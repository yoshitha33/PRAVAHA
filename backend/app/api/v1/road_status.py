"""
/api/v1/road-status — Enhanced Road DNA Engine

Three layers of intelligence:
  1. OSM Overpass API  → road type classification (motorway / trunk / primary / secondary / residential)
  2. Time-of-day heuristics → Bengaluru-specific rush hour penalties (IST)
  3. OSRM speed profile  → base travel speed on the actual road segment
  4. Weather overlay     → rain / fog / thunderstorm penalty
  5. Optional place_name → forward-geocode any user-typed location
"""

import asyncio
import httpx
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(tags=["road_status"])

IST = timedelta(hours=5, minutes=30)

# ── Response schema ──────────────────────────────────────────────────────────

class RoadStatusResponse(BaseModel):
    area_name: str
    road_name: str
    road_type: str           # motorway / trunk / primary / secondary / residential / unknown
    latitude: float
    longitude: float
    road_dna: int            # 0–100 (higher = worse health)
    congestion: str          # Low / Medium / High
    congestion_reason: str
    avg_speed_kmh: float
    free_flow_speed_kmh: float   # expected free-flow speed for this road type
    time_of_day_label: str       # "Morning Rush" / "Evening Rush" / "Off-Peak" etc.
    weather_condition: str
    temperature_c: float | None = None
    humidity: int | None = None
    confidence: float
    data_sources: list[str]  # which sources contributed


# ── OSM Overpass — road type ──────────────────────────────────────────────────

# Free-flow speeds by OSM highway tag (km/h, Bengaluru context)
FREE_FLOW_SPEEDS: dict[str, float] = {
    "motorway":        80.0,
    "trunk":           60.0,
    "primary":         45.0,
    "secondary":       35.0,
    "tertiary":        28.0,
    "residential":     20.0,
    "living_street":   12.0,
    "service":         15.0,
    "unclassified":    25.0,
    "unknown":         30.0,
}

ROAD_TYPE_LABEL: dict[str, str] = {
    "motorway":     "Expressway / Flyover",
    "trunk":        "Major Arterial Road",
    "primary":      "Primary Road",
    "secondary":    "Secondary Road",
    "tertiary":     "Local Connector",
    "residential":  "Residential Street",
    "living_street":"Slow Zone",
    "service":      "Service Lane",
    "unclassified": "Unnamed Road",
    "unknown":      "Unknown Road Type",
}


async def get_road_type_overpass(lat: float, lng: float) -> str:
    """
    Query OSM Overpass to find the nearest highway type within 100m.
    Returns the OSM highway tag (e.g. 'primary', 'residential', …).
    """
    overpass_query = f"""
    [out:json][timeout:8];
    way(around:100,{lat},{lng})[highway];
    out tags 1;
    """
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": overpass_query},
                headers={"User-Agent": "PRAVAHA/1.0 traffic-app"},
                timeout=9.0,
            )
        if resp.status_code == 200:
            data = resp.json()
            elements = data.get("elements", [])
            if elements:
                hw = elements[0].get("tags", {}).get("highway", "unknown")
                # Normalise link variants: motorway_link → motorway
                hw = hw.replace("_link", "")
                print(f"[Overpass] Road type at ({lat:.4f},{lng:.4f}): {hw}")
                return hw
    except Exception as e:
        print(f"[Overpass ERROR] {e}")
    return "unknown"


# ── Time-of-day heuristics (IST) ─────────────────────────────────────────────

def get_time_context() -> dict:
    """
    Return Bengaluru-specific time-of-day rush factor.
    Rush hours sourced from BBMP / TomTom Bengaluru traffic reports.
    """
    now_ist = datetime.now(timezone.utc) + IST
    hour = now_ist.hour
    weekday = now_ist.weekday()  # 0=Monday … 6=Sunday

    if weekday >= 5:  # Weekend
        if 10 <= hour < 13 or 17 <= hour < 20:
            return {"label": "Weekend Peak", "penalty": 6, "factor": 1.10}
        return {"label": "Weekend Off-Peak", "penalty": 0, "factor": 1.0}

    # Weekday rush patterns for Bengaluru
    if 8 <= hour < 10:
        return {"label": "Morning Rush (8–10 AM)", "penalty": 18, "factor": 0.55}
    elif 10 <= hour < 12:
        return {"label": "Late Morning", "penalty": 8, "factor": 0.80}
    elif 12 <= hour < 14:
        return {"label": "Afternoon Lull", "penalty": 3, "factor": 0.95}
    elif 14 <= hour < 17:
        return {"label": "Post-Lunch", "penalty": 5, "factor": 0.85}
    elif 17 <= hour < 20:
        return {"label": "Evening Rush (5–8 PM)", "penalty": 20, "factor": 0.50}
    elif 20 <= hour < 22:
        return {"label": "Late Evening", "penalty": 8, "factor": 0.80}
    else:
        return {"label": "Night / Early Morning", "penalty": 0, "factor": 1.10}


# ── OSRM speed with road-type-aware profile ───────────────────────────────────

async def get_osrm_speed(lat: float, lng: float) -> float:
    """
    Estimate travel speed using OSRM nearest + short route.
    Returns km/h.  Fallback = 30.0.
    """
    try:
        async with httpx.AsyncClient() as client:
            snap = await client.get(
                f"https://router.project-osrm.org/nearest/v1/driving/{lng},{lat}",
                params={"number": 1},
                timeout=6.0,
            )
        if snap.status_code != 200:
            return 30.0
        waypoints = snap.json().get("waypoints", [])
        if not waypoints:
            return 30.0
        s_lng, s_lat = waypoints[0]["location"]

        offset = 0.004  # ~400m for a more reliable speed sample
        async with httpx.AsyncClient() as client:
            route = await client.get(
                f"https://router.project-osrm.org/route/v1/driving/{s_lng},{s_lat};{s_lng+offset},{s_lat+offset}",
                params={"overview": "false"},
                timeout=7.0,
            )
        if route.status_code != 200:
            return 30.0
        routes = route.json().get("routes", [])
        if not routes:
            return 30.0
        dur = routes[0]["duration"]
        dist = routes[0]["distance"]
        if dur <= 0:
            return 30.0
        speed = (dist / 1000) / (dur / 3600)
        print(f"[OSRM] {speed:.1f} km/h at ({lat:.4f},{lng:.4f})")
        return round(min(speed, 120.0), 1)
    except Exception as e:
        print(f"[OSRM Speed ERROR] {e}")
        return 30.0


# ── Weather ───────────────────────────────────────────────────────────────────

async def get_weather_data(lat: float, lng: float) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "http://localhost:8000/api/v1/weather",
                params={"latitude": lat, "longitude": lng},
                timeout=7.0,
            )
        if resp.status_code == 200:
            data = resp.json()
            condition = "Clear"
            if data.get("conditions"):
                condition = data["conditions"][0].get("main", "Clear")
            return {
                "condition": condition,
                "temperature": data.get("temperature"),
                "humidity": data.get("humidity"),
            }
    except Exception as e:
        print(f"[Weather ERROR] {e}")
    return {"condition": "Clear", "temperature": 28, "humidity": 70}


# ── Geocode helpers ───────────────────────────────────────────────────────────

async def reverse_geocode(lat: float, lng: float) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lng, "format": "json"},
                headers={"User-Agent": "PRAVAHA/1.0 traffic-app"},
                timeout=6.0,
            )
        if resp.status_code == 200:
            data = resp.json()
            address = data.get("address", {})
            area = (
                address.get("suburb")
                or address.get("neighbourhood")
                or address.get("city_district")
                or address.get("city")
                or address.get("town")
                or address.get("village")
                or address.get("municipality")
                or address.get("county")
                or address.get("state_district")
                or address.get("state")
                or "Unknown Area"
            )
            road = (
                address.get("road")
                or address.get("pedestrian")
                or address.get("footway")
                or "Main Road"
            )
            return {"area": area, "road": road}
    except Exception as e:
        print(f"[ReverseGeocode ERROR] {e}")
    return {"area": "Current Location", "road": "Main Road"}


async def forward_geocode(place_name: str) -> dict | None:
    """Forward geocode any user-typed place name (e.g. Bhimavaram, Whitefield, Hyderabad) to lat/lng via Nominatim."""
    query = place_name.strip()
    if "india" not in query.lower():
        query = f"{query}, India"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": query, "format": "json", "limit": 1, "countrycodes": "in"},
                headers={"User-Agent": "PRAVAHA/1.0 traffic-app"},
                timeout=6.0,
            )
        if resp.status_code == 200:
            data = resp.json()
            if data:
                lat = float(data[0]["lat"])
                lng = float(data[0]["lon"])
                display = data[0].get("display_name", query).split(",")[0]
                print(f"[ForwardGeocode] '{place_name}' → ({lat:.4f},{lng:.4f}) [{display}]")
                return {"latitude": lat, "longitude": lng, "display": display}
    except Exception as e:
        print(f"[ForwardGeocode ERROR] {e}")
    return None


# ── DNA score computation ─────────────────────────────────────────────────────

def compute_road_dna(
    speed_kmh: float,
    free_flow_kmh: float,
    weather_condition: str,
    time_context: dict,
    road_type: str,
) -> tuple[int, str, str, list[str]]:
    """
    Multi-factor Road DNA (0-100, higher = worse health).
    Returns: (dna_score, congestion_level, full_reason, factors_list)
    """
    reasons: list[str] = []
    factors: list[str] = []

    # ── 1. Speed ratio vs free-flow ──────────────────────────────────────────
    # Apply time-of-day factor to model expected slower speeds during rush
    effective_speed = speed_kmh * time_context["factor"]
    ratio = effective_speed / max(free_flow_kmh, 1)

    if ratio >= 0.85:
        base = 18; congestion = "Low"
        reasons.append("Free-flowing traffic — near free-flow speed")
    elif ratio >= 0.65:
        base = 35; congestion = "Low"
        reasons.append("Light traffic — minor slow patches")
    elif ratio >= 0.50:
        base = 52; congestion = "Medium"
        reasons.append("Moderate congestion — noticeably below free-flow speed")
    elif ratio >= 0.35:
        base = 66; congestion = "Medium"
        reasons.append("Heavy slow traffic — well below free-flow")
    elif ratio >= 0.20:
        base = 78; congestion = "High"
        reasons.append("Severely congested — vehicles barely moving")
    else:
        base = 90; congestion = "High"
        reasons.append("Traffic at near standstill")

    factors.append(f"OSRM speed {speed_kmh:.0f} km/h (free-flow {free_flow_kmh:.0f} km/h)")

    # ── 2. Time-of-day penalty ────────────────────────────────────────────────
    tod_penalty = time_context["penalty"]
    if tod_penalty > 0:
        label = time_context["label"]
        reasons.append(f"{label} — historically heavy congestion in Bengaluru")
        factors.append(f"Time-of-day: +{tod_penalty} pts ({label})")

    # ── 3. Road type factor ───────────────────────────────────────────────────
    road_penalty = 0
    road_type_norm = road_type.lower()
    if road_type_norm in ("motorway", "trunk"):
        road_penalty = -5  # highways tend to move faster even in rush
        factors.append(f"Road type: {ROAD_TYPE_LABEL.get(road_type_norm, road_type)} (−5 pts)")
    elif road_type_norm in ("residential", "living_street", "service"):
        road_penalty = 8   # narrow roads amplify congestion
        reasons.append(f"Narrow {ROAD_TYPE_LABEL.get(road_type_norm, road_type)} — congestion amplified")
        factors.append(f"Road type: {ROAD_TYPE_LABEL.get(road_type_norm, road_type)} (+8 pts)")
    else:
        factors.append(f"Road type: {ROAD_TYPE_LABEL.get(road_type_norm, road_type)}")

    # ── 4. Weather penalty ────────────────────────────────────────────────────
    wc = weather_condition.lower()
    weather_penalty = 0
    if "thunderstorm" in wc:
        weather_penalty = 12
        reasons.append("Thunderstorm severely worsening road conditions")
        factors.append("Weather: Thunderstorm (+12 pts)")
    elif "rain" in wc or "drizzle" in wc:
        weather_penalty = 8
        reasons.append("Rain reducing visibility and traction")
        factors.append("Weather: Rain (+8 pts)")
    elif "fog" in wc or "mist" in wc:
        weather_penalty = 6
        reasons.append("Fog reducing driving visibility")
        factors.append("Weather: Fog (+6 pts)")
    elif "haze" in wc or "smoke" in wc:
        weather_penalty = 3
        reasons.append("Hazy conditions slowing traffic")
        factors.append("Weather: Haze (+3 pts)")
    else:
        factors.append(f"Weather: {weather_condition} (no penalty)")

    # ── Final DNA score ───────────────────────────────────────────────────────
    dna = min(100, max(0, base + tod_penalty + road_penalty + weather_penalty))

    # Upgrade congestion based on final score
    if dna >= 75:
        congestion = "High"
    elif dna >= 45:
        congestion = "Medium"
    else:
        congestion = "Low"

    # Confidence increases with more data sources
    full_reason = " · ".join(reasons) + f" — Road DNA: {dna}/100."
    return dna, congestion, full_reason, factors


# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.get("/road-status", response_model=RoadStatusResponse)
async def get_road_status(
    latitude: float = Query(default=12.9716, description="GPS latitude"),
    longitude: float = Query(default=77.5946, description="GPS longitude"),
    place_name: str | None = Query(default=None, description="Optional: type a place name to override GPS"),
) -> RoadStatusResponse:
    """
    Auto Road DNA engine — combines:
      • OSM Overpass (road type: motorway / primary / residential …)
      • Time-of-day heuristics (Bengaluru rush hour: 8-10am, 5-8pm)
      • OSRM speed profile (actual driving speed on road segment)
      • Live weather (rain / fog / thunderstorm penalty)
      • Optional place_name forward-geocode (user-entered location)
    """
    data_sources: list[str] = []

    # ── Resolve coordinates ───────────────────────────────────────────────────
    resolved_lat, resolved_lng = latitude, longitude
    resolved_display: str | None = None

    if place_name and place_name.strip():
        geo_result = await forward_geocode(place_name)
        if geo_result:
            resolved_lat = geo_result["latitude"]
            resolved_lng = geo_result["longitude"]
            resolved_display = geo_result["display"]
            data_sources.append(f"OSM Nominatim (searched: {place_name})")
        else:
            data_sources.append(f"GPS fallback ('{place_name}' not found)")
    else:
        data_sources.append("GPS coordinates")

    # ── Fetch all signals in parallel ────────────────────────────────────────
    geo_task = reverse_geocode(resolved_lat, resolved_lng)
    speed_task = get_osrm_speed(resolved_lat, resolved_lng)
    weather_task = get_weather_data(resolved_lat, resolved_lng)
    road_type_task = get_road_type_overpass(resolved_lat, resolved_lng)

    geo, speed, weather, road_type = await asyncio.gather(
        geo_task, speed_task, weather_task, road_type_task
    )

    data_sources += ["OSM Overpass (road type)", "OSRM (speed profile)", "OpenWeather API"]

    # ── Time context ──────────────────────────────────────────────────────────
    time_context = get_time_context()
    data_sources.append(f"Time heuristics ({time_context['label']})")

    # ── Free-flow speed for this road type ────────────────────────────────────
    free_flow = FREE_FLOW_SPEEDS.get(road_type, FREE_FLOW_SPEEDS["unknown"])

    # ── Compute DNA ───────────────────────────────────────────────────────────
    dna, congestion, reason, factors = compute_road_dna(
        speed_kmh=speed,
        free_flow_kmh=free_flow,
        weather_condition=weather["condition"],
        time_context=time_context,
        road_type=road_type,
    )

    # ── Confidence ────────────────────────────────────────────────────────────
    confidence_pts = 0.5
    if speed != 30.0:     confidence_pts += 0.20   # real OSRM speed
    if road_type != "unknown": confidence_pts += 0.15  # real road type
    if weather["temperature"] is not None: confidence_pts += 0.15  # live weather

    area = resolved_display or geo["area"]

    return RoadStatusResponse(
        area_name=area,
        road_name=geo["road"],
        road_type=ROAD_TYPE_LABEL.get(road_type, road_type),
        latitude=resolved_lat,
        longitude=resolved_lng,
        road_dna=dna,
        congestion=congestion,
        congestion_reason=reason,
        avg_speed_kmh=speed,
        free_flow_speed_kmh=free_flow,
        time_of_day_label=time_context["label"],
        weather_condition=weather["condition"],
        temperature_c=weather.get("temperature"),
        humidity=weather.get("humidity"),
        confidence=round(min(confidence_pts, 1.0), 2),
        data_sources=data_sources,
    )
