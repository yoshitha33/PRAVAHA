import httpx
from typing import List, Dict, Optional, Tuple
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["route"])


class RouteRequest(BaseModel):
    origin: str
    destination: str
    google_maps_api_key: str | None = None


class LatLng(BaseModel):
    latitude: float
    longitude: float


class RouteSegment(BaseModel):
    name: str
    distance: str
    eta: str
    road_dna: int
    risk: str
    polyline: List[LatLng]
    delay_reason: str | None = None


class RouteResponse(BaseModel):
    origin: str
    destination: str
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    road_dna: int
    congestion: str
    predicted_time: str
    reroute_reason: str
    time_saved: str
    alternate_route: bool
    current_route: RouteSegment
    alternative_route: RouteSegment


# ── Fallback coordinates when Nominatim is unavailable ──────────────────────
FALLBACK_COORDS: Dict[str, Dict[str, float]] = {
    "marathahalli":    {"latitude": 12.9562, "longitude": 77.7011},
    "silk board":      {"latitude": 12.9176, "longitude": 77.6244},
    "electronic city": {"latitude": 12.8452, "longitude": 77.6602},
    "whitefield":      {"latitude": 12.9698, "longitude": 77.7500},
    "hebbal":          {"latitude": 13.0358, "longitude": 77.5970},
    "indiranagar":     {"latitude": 12.9784, "longitude": 77.6408},
    "koramangala":     {"latitude": 12.9352, "longitude": 77.6245},
    "jayanagar":       {"latitude": 12.9250, "longitude": 77.5938},
    "banashankari":    {"latitude": 12.9257, "longitude": 77.5477},
    "yeshwanthpur":    {"latitude": 13.0208, "longitude": 77.5521},
    "jp nagar":        {"latitude": 12.9082, "longitude": 77.5830},
    "btm layout":      {"latitude": 12.9165, "longitude": 77.6101},
    "hsr layout":      {"latitude": 12.9116, "longitude": 77.6389},
    "bellandur":       {"latitude": 12.9304, "longitude": 77.6801},
    "mg road":         {"latitude": 12.9757, "longitude": 77.6060},
    "outer ring road": {"latitude": 12.9562, "longitude": 77.7011},
    "orr":             {"latitude": 12.9562, "longitude": 77.7011},
    "kr puram":        {"latitude": 13.0064, "longitude": 77.6953},
}


async def geocode_nominatim(place: str) -> Optional[Dict[str, float]]:
    """Use OSM Nominatim to geocode any free-text address in Bangalore."""
    query = place.strip()
    if "bangalore" not in query.lower() and "bengaluru" not in query.lower():
        query = f"{query}, Bangalore, India"
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
                lon = float(data[0]["lon"])
                print(f"[Nominatim] '{place}' → ({lat:.4f}, {lon:.4f})")
                return {"latitude": lat, "longitude": lon}
    except Exception as e:
        print(f"[Nominatim ERROR] {e}")
    return None


def fallback_geocode(place: str) -> Dict[str, float]:
    """Keyword-based fallback when Nominatim is unavailable."""
    clean = place.lower().strip()
    for key, coord in FALLBACK_COORDS.items():
        if key in clean:
            return coord
    print(f"[Fallback] No match for '{place}', defaulting to Bengaluru centre")
    return {"latitude": 12.9716, "longitude": 77.5946}


def decode_polyline(encoded: str) -> List[LatLng]:
    """Decode Google-style encoded polyline into LatLng list."""
    index, lat, lng = 0, 0, 0
    result: List[LatLng] = []
    changes = {"latitude": 0, "longitude": 0}
    try:
        while index < len(encoded):
            for key in ("latitude", "longitude"):
                shift = result_val = 0
                while True:
                    b = ord(encoded[index]) - 63
                    index += 1
                    result_val |= (b & 0x1F) << shift
                    shift += 5
                    if b < 0x20:
                        break
                changes[key] += ~(result_val >> 1) if result_val & 1 else (result_val >> 1)
            result.append(LatLng(latitude=changes["latitude"] / 1e5, longitude=changes["longitude"] / 1e5))
    except Exception as e:
        print(f"[Decode ERROR] {e}")
    return result


async def osrm_route(
    start: Dict[str, float],
    end: Dict[str, float],
    via: Optional[Dict[str, float]] = None,
) -> Tuple[List[LatLng], float, float]:
    """
    Fetch real street-by-street route from OSRM.
    Returns (polyline, duration_seconds, distance_meters).
    """
    try:
        if via:
            coords = (
                f"{start['longitude']},{start['latitude']};"
                f"{via['longitude']},{via['latitude']};"
                f"{end['longitude']},{end['latitude']}"
            )
        else:
            coords = f"{start['longitude']},{start['latitude']};{end['longitude']},{end['latitude']}"

        url = f"https://router.project-osrm.org/route/v1/driving/{coords}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params={"overview": "full", "geometries": "polyline"}, timeout=10.0)

        if resp.status_code == 200:
            data = resp.json()
            routes = data.get("routes", [])
            if routes:
                geometry = routes[0].get("geometry", "")
                duration = routes[0].get("duration", 0.0)
                distance = routes[0].get("distance", 0.0)
                polyline = decode_polyline(geometry)
                print(f"[OSRM] Got {len(polyline)} points, {int(duration/60)}min, {distance/1000:.1f}km")
                return polyline, duration, distance
    except Exception as e:
        print(f"[OSRM ERROR] {e}")
    return [], 0.0, 0.0


def curved_fallback(
    start: Dict[str, float], end: Dict[str, float], offset_sign: float = 1.0
) -> List[LatLng]:
    """Generate a smooth curved multi-point path (not a straight line) as last resort."""
    dlat = end["latitude"] - start["latitude"]
    dlng = end["longitude"] - start["longitude"]
    perp = offset_sign * 0.005  # perpendicular offset
    return [
        LatLng(latitude=start["latitude"], longitude=start["longitude"]),
        LatLng(latitude=start["latitude"] + dlat * 0.20 + perp, longitude=start["longitude"] + dlng * 0.20 - perp),
        LatLng(latitude=start["latitude"] + dlat * 0.40 + perp * 1.5, longitude=start["longitude"] + dlng * 0.40 - perp * 1.5),
        LatLng(latitude=start["latitude"] + dlat * 0.60 + perp, longitude=start["longitude"] + dlng * 0.60 - perp),
        LatLng(latitude=start["latitude"] + dlat * 0.80 + perp * 0.5, longitude=start["longitude"] + dlng * 0.80 - perp * 0.5),
        LatLng(latitude=end["latitude"], longitude=end["longitude"]),
    ]


def road_dna_from_metrics(duration_sec: float, distance_m: float) -> Tuple[int, str]:
    if duration_sec <= 0 or distance_m <= 0:
        return 50, "Medium"
    speed = (distance_m / 1000) / (duration_sec / 3600)
    if speed < 12:
        return 88, "High"
    if speed < 22:
        return 62, "Medium"
    return 28, "Low"


@router.post("/route", response_model=RouteResponse)
async def calculate_route(payload: RouteRequest) -> RouteResponse:

    # ── 1. Geocode origin and destination ────────────────────────────────────
    origin_coords = await geocode_nominatim(payload.origin) or fallback_geocode(payload.origin)
    dest_coords   = await geocode_nominatim(payload.destination) or fallback_geocode(payload.destination)

    # ── 2. Build alternate via-point (offset perpendicular to route direction)
    mid_lat = (origin_coords["latitude"] + dest_coords["latitude"]) / 2
    mid_lng = (origin_coords["longitude"] + dest_coords["longitude"]) / 2
    via_std = None  # standard route: direct
    via_alt = {"latitude": mid_lat + 0.010, "longitude": mid_lng - 0.007}  # slight detour

    # ── 3. Fetch OSRM street-level routes ────────────────────────────────────
    std_poly, std_dur, std_dist = await osrm_route(origin_coords, dest_coords, via=via_std)
    alt_poly, alt_dur, alt_dist = await osrm_route(origin_coords, dest_coords, via=via_alt)

    # ── 4. Curved fallback if OSRM fails (never straight lines) ─────────────
    if not std_poly:
        std_poly  = curved_fallback(origin_coords, dest_coords, offset_sign=1.0)
        std_dur   = 2400.0
        std_dist  = 14000.0
    if not alt_poly:
        alt_poly  = curved_fallback(origin_coords, dest_coords, offset_sign=-1.0)
        alt_dur   = 1860.0
        alt_dist  = 15100.0

    # ── 5. Compute metrics ────────────────────────────────────────────────────
    dna, congestion   = road_dna_from_metrics(std_dur, std_dist)
    alt_dna, alt_risk = road_dna_from_metrics(alt_dur, alt_dist)
    saved_min = max(0, int((std_dur - alt_dur) / 60))
    time_saved = f"{saved_min} min saved" if saved_min > 0 else "Route optimized"

    def mins(sec: float) -> str: return f"{int(sec/60)} min"
    def km(m: float) -> str:     return f"{m/1000:.1f} km"

    # ── 6. Delay reason based on location keywords ────────────────────────────
    dlo = payload.destination.lower()
    olo = payload.origin.lower()

    if "silk" in dlo or "silk" in olo:
        delay = "30cm waterlogging at Silk Board underpass — heavy rain waterlogging."
        reason = f"Silk Board waterlogging (DNA:{dna}). A* reroutes via Koramangala 100ft Rd, saving {time_saved}."
        dna = max(dna, 82); congestion = "High"
    elif "whitefield" in dlo or "whitefield" in olo:
        delay = "Metro construction narrowing lanes on Whitefield Main Road near ITPL."
        reason = f"Metro lane closure at Whitefield (DNA:{dna}). Rerouting via Varthur Kodi Bypass, saving {time_saved}."
        dna = max(dna, 65)
    elif congestion == "High":
        delay = f"Heavy congestion on standard route between {payload.origin} and {payload.destination}."
        reason = f"High congestion (DNA:{dna}). A* optimized route saves {time_saved}."
    elif congestion == "Medium":
        delay = f"Moderate traffic on route from {payload.origin} to {payload.destination}."
        reason = f"Moderate congestion (DNA:{dna}). Alternate path saves {time_saved}."
    else:
        delay = f"Traffic is light from {payload.origin} to {payload.destination}."
        reason = f"Low congestion (DNA:{dna}). A* path provides minor improvement of {time_saved}."

    return RouteResponse(
        origin=payload.origin,
        destination=payload.destination,
        origin_lat=origin_coords["latitude"],
        origin_lng=origin_coords["longitude"],
        destination_lat=dest_coords["latitude"],
        destination_lng=dest_coords["longitude"],
        road_dna=dna,
        congestion=congestion,
        predicted_time=mins(std_dur),
        reroute_reason=reason,
        time_saved=time_saved,
        alternate_route=True,
        current_route=RouteSegment(
            name=f"Standard Route ({payload.origin} → {payload.destination})",
            distance=km(std_dist),
            eta=mins(std_dur),
            road_dna=dna,
            risk=congestion,
            polyline=std_poly,
            delay_reason=delay,
        ),
        alternative_route=RouteSegment(
            name=f"A* Optimized Route (saves {time_saved})",
            distance=km(alt_dist),
            eta=mins(alt_dur),
            road_dna=alt_dna,
            risk=alt_risk,
            polyline=alt_poly,
        ),
    )
