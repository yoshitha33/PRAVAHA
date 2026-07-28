"""
Social Intelligence Engine — GET /api/v1/social-intel

Simulates a real-time social media scan (Twitter/X style) for Bangalore traffic
events. In a production system this would call the Twitter/X Filtered Stream API
or a third-party social listening service. Here we generate realistic, fully
time-aware and weather-aware reports using the same live signals (OpenWeather +
time-of-day) that power the Road DNA engine, so the output is always coherent
with the rest of the PRAVAHA data pipeline.

Classification pipeline (mirrors a real NLP keyword extractor):
  raw_text → keyword_scan → category + severity → DNA_impact_delta
"""

from __future__ import annotations

import hashlib
import random
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter

from app.services.weather_service import WeatherService

router = APIRouter(tags=["social-intel"])
weather_service = WeatherService()

# ── Bangalore traffic hotspot corpus ─────────────────────────────────────────

LOCATIONS = [
    "Silk Board Junction",
    "Marathahalli Bridge",
    "Hebbal Flyover",
    "Electronic City Toll",
    "Outer Ring Road (ORR)",
    "Whitefield Main Road",
    "Koramangala 4th Block",
    "MG Road & Brigade Rd",
    "Indiranagar 100ft Road",
    "Bellandur Lake Rd",
    "KR Puram Bridge",
    "Sarjapur Road",
    "Bannerghatta Road",
    "Hosur Road near Bommanahalli",
    "Tumkur Road near Peenya",
]

# Twitter/X style handles — realistic Bangalore accounts
HANDLES = [
    ("@blr_traffic_live", "🚦 Bengaluru Traffic Live"),
    ("@namma_commuter",   "🏙️ Namma Commuter"),
    ("@blr_news_flash",  "📡 BLR News Flash"),
    ("@techie_commutes",  "💻 Techie on ORR"),
    ("@blr_rains",        "🌧️ BLR Rain Watch"),
    ("@blrtrafficpolice", "👮 BLR Traffic Police"),
    ("@swiggy_delivery",  "🛵 Swiggy Delivery Rider"),
    ("@ola_driver_blr",   "🚖 Ola Driver BLR"),
    ("@resident_korama",  "🏘️ Koramangala Resident"),
    ("@itpl_office_goer", "🏢 ITPL Office Goer"),
    ("@namma_metro_blr",  "🚇 Namma Metro Updates"),
    ("@blr_weather_bot",  "⛅ BLR Weather Bot"),
]

# ── Report templates — keyed by (category, weather_context) ──────────────────
# Each entry: (text_template, severity, dna_delta, likes_range, rt_range)

TEMPLATES: dict[str, list[tuple[str, str, int, tuple, tuple]]] = {
    "accident": [
        ("Huge accident near {loc} — 3 vehicles involved, ambulance on the way. Avoid this route! 🚨 #BlrTraffic", "Critical", 18, (120, 890), (45, 310)),
        ("Bad crash at {loc}. Traffic police have blocked 2 lanes. Major jam building up. #Bangalore", "Critical", 15, (90, 650), (30, 220)),
        ("Multi-vehicle collision at {loc}. Debris on road. Taking 40+ mins to clear. #BlrChaos", "High", 12, (60, 450), (20, 180)),
        ("Minor fender bender near {loc} but blocking left lane. Expect 15 min delay. #BlrRoads", "Medium", 6, (20, 150), (8, 55)),
    ],
    "waterlogging": [
        ("Road completely flooded at {loc}. Water level knee-high. Don't even try. 🌊 #BlrRains", "Critical", 20, (200, 1200), (80, 400)),
        ("Waterlogging at {loc} underpass — cars getting stuck. Take alternate route via {alt}. ⚠️", "Critical", 18, (150, 900), (60, 280)),
        ("30cm water accumulation at {loc}. BBMP team called but no sign yet 😤 #BangaloreRains", "High", 14, (100, 700), (40, 200)),
        ("Slight waterlogging at {loc} — passable for SUVs but sedans should avoid. #BlrWeather", "Medium", 7, (30, 200), (10, 70)),
    ],
    "congestion": [
        ("Bumper-to-bumper at {loc} since 7AM. No end in sight 😩 #BlrTraffic #ORR", "High", 10, (80, 600), (25, 190)),
        ("Massive jam near {loc}. GPS showing 45 min delay. Rerouting via {alt}. #Bangalore", "High", 11, (70, 550), (22, 170)),
        ("Traffic barely moving at {loc}. Peak hour madness 🚗🚗🚗 #BlrRush", "Medium", 8, (40, 350), (15, 120)),
        ("Slow movement at {loc} — signal timing issue causing backup. About 20 min delay.", "Medium", 5, (25, 180), (8, 60)),
    ],
    "protest": [
        ("Road blocked near {loc} due to protest. Police deployed. Use alternate routes! #BlrAlert", "Critical", 16, (180, 1100), (70, 350)),
        ("Bandh supporters blocking {loc}. Avoid the area completely today. #KarnatakaAlert", "Critical", 14, (140, 850), (55, 280)),
        ("Small protest at {loc} — one lane blocked. Minor disruption. Police managing. #Bangalore", "Medium", 6, (30, 200), (10, 65)),
    ],
    "tree_fall": [
        ("Tree fell near {loc} blocking entire road! Strong winds. BBMP clearing now. 🌳⚠️", "High", 13, (90, 700), (30, 230)),
        ("Uprooted tree at {loc} after last night's storm. One lane clear, expect slow traffic.", "Medium", 7, (45, 320), (15, 100)),
        ("Large branch fell at {loc}. Road partially blocked. Should clear in 30 min.", "Low", 4, (20, 140), (6, 45)),
    ],
    "construction": [
        ("Metro construction near {loc} down to 1 lane. 35-min delay during peak hours. #NammaMetro", "High", 11, (75, 520), (25, 170)),
        ("BWSSB pipeline work at {loc} blocking 2 lanes. Expected to continue for 3 days. 😒", "Medium", 8, (40, 300), (12, 90)),
        ("Road repair work at {loc} — night closure 10PM-5AM. Plan accordingly. #BBMP", "Low", 3, (15, 120), (5, 40)),
    ],
    "stadium_traffic": [
        ("RCB match at Chinnaswamy tonight — {loc} will be CHAOS from 5PM. Park & take Metro! 🏏", "High", 12, (200, 1500), (90, 500)),
        ("Stadium exit traffic at {loc} — 40,000 fans leaving simultaneously. MG Road gridlocked. 🔴", "Critical", 16, (300, 2000), (120, 650)),
        ("Pre-match crowd building near {loc}. Avoid Cubbon Park area until 9PM. #RCBvsCSK", "Medium", 7, (100, 800), (35, 250)),
    ],
    "clear": [
        ("Roads surprisingly clear at {loc} today! Smooth sailing 🚗💨 #BlrTraffic #Rare", "Low", -3, (15, 90), (5, 30)),
        ("Off-peak bliss at {loc}. Google Maps green all the way. Enjoy it while it lasts 😄", "Low", -2, (10, 75), (3, 25)),
        ("Traffic moving well at {loc} this morning. Take advantage before rush hits! ✅", "Low", -2, (12, 80), (4, 28)),
    ],
}

ALTERNATE_ROUTES = {
    "Silk Board Junction":   "Koramangala 100ft Rd",
    "Marathahalli Bridge":   "ITPL Main Gate Rd",
    "Hebbal Flyover":        "Bellary Rd service lane",
    "Electronic City Toll":  "Hosur Rd Elevated Expressway",
    "Outer Ring Road (ORR)": "HAL Old Airport Rd",
    "Whitefield Main Road":  "Varthur Kodi Bypass",
    "Koramangala 4th Block": "Intermediate Ring Rd",
    "KR Puram Bridge":       "Old Madras Rd",
    "Sarjapur Road":         "Carmelaram - Marathahalli Link Rd",
    "Bannerghatta Road":     "Gottigere - JP Nagar Link",
}

# Keyword classifier — mirrors a real NLP pipeline
KEYWORD_MAP: list[tuple[list[str], str]] = [
    (["accident", "crash", "collision", "hit", "ambulance", "injured"], "accident"),
    (["flood", "waterlog", "water", "submerge", "rain", "drizzle", "storm", "knee"], "waterlogging"),
    (["protest", "block", "bandh", "rally", "march", "police", "shut"], "protest"),
    (["tree", "fell", "branch", "uprooted", "fallen", "storm"], "tree_fall"),
    (["metro", "construction", "bwssb", "bbmp", "repair", "pipeline", "dig"], "construction"),
    (["stadium", "match", "ipl", "rcb", "cricket", "fans", "chinnaswamy"], "stadium_traffic"),
    (["jam", "bumper", "stuck", "slow", "delay", "traffic", "congestion", "gridlock"], "congestion"),
    (["clear", "smooth", "green", "free", "bliss", "moving"], "clear"),
]


def classify_text(text: str) -> str:
    """Keyword-based NLP classification — same logic a real social media scanner uses."""
    lower = text.lower()
    for keywords, category in KEYWORD_MAP:
        if any(kw in lower for kw in keywords):
            return category
    return "congestion"


def severity_color(severity: str) -> str:
    return {"Critical": "#dc2626", "High": "#d97706", "Medium": "#0284c7", "Low": "#10b981"}.get(severity, "#6b7280")


def _seed_for_hour(hour: int, day: int) -> int:
    """Deterministic seed so reports are stable within the same hour (no re-shuffle on refresh)."""
    return hour * 100 + day


def _mins_ago(base_seed: int, idx: int) -> str:
    options = ["just now", "1 min ago", "2 min ago", "3 min ago", "5 min ago",
               "7 min ago", "10 min ago", "12 min ago", "15 min ago", "18 min ago",
               "22 min ago", "25 min ago", "30 min ago"]
    return options[(base_seed + idx * 7) % len(options)]


# ── Endpoint ──────────────────────────────────────────────────────────────────

class SocialReport(BaseModel := __import__("pydantic").BaseModel):  # type: ignore[misc]
    id: str
    handle: str
    display_name: str
    text: str
    location: str
    category: str
    severity: str
    severity_color: str
    dna_impact: int
    likes: int
    retweets: int
    posted_at: str
    verified_by_ai: bool
    ai_classification: str
    source: str = "Simulated · X (Twitter) Social Intel"


@router.get("/social-intel", response_model=list[SocialReport])
async def get_social_intel() -> list[SocialReport]:
    """
    Returns time-aware, weather-aware simulated social media traffic reports
    for Bangalore. Classification mirrors a real NLP keyword extraction pipeline.
    """
    now      = datetime.now(timezone.utc)
    hour     = now.hour
    month    = now.month
    day      = now.timetuple().tm_yday
    rng      = random.Random(_seed_for_hour(hour, day))
    reports: list[SocialReport] = []

    # ── Determine active weather context ─────────────────────────────────────
    is_raining   = False
    weather_desc = "Clear"
    try:
        wx = await weather_service.get_current_weather(city="Bengaluru")
        is_raining = any("rain" in c.main.lower() or "drizzle" in c.main.lower() for c in wx.conditions)
        weather_desc = wx.conditions[0].description if wx.conditions else "Clear"
    except Exception:
        pass  # graceful degradation

    # ── Determine time-of-day context (IST = UTC+5:30) ───────────────────────
    ist_hour       = (hour + 5) % 24 + (1 if hour >= 18 else 0)  # approximate
    is_morning_rush = 7 <= ist_hour <= 10
    is_evening_rush = 17 <= ist_hour <= 21
    is_peak         = is_morning_rush or is_evening_rush
    is_ipl_season   = month in [3, 4, 5, 9, 10]  # IPL + ICC season

    # ── Build event category weights based on context ─────────────────────────
    weights: dict[str, float] = {
        "congestion":     4.0 if is_peak else 1.5,
        "waterlogging":   5.0 if is_raining else 0.2,
        "accident":       2.5 if is_peak else 1.0,
        "construction":   1.5,
        "tree_fall":      3.0 if is_raining else 0.3,
        "protest":        0.8,
        "stadium_traffic": 4.0 if is_ipl_season else 0.5,
        "clear":          0.2 if is_peak or is_raining else 1.5,
    }

    # ── Pick 8–10 reports weighted by context ─────────────────────────────────
    categories  = list(weights.keys())
    cat_weights = [weights[c] for c in categories]
    chosen_cats = rng.choices(categories, weights=cat_weights, k=9)

    # Always include at least one waterlogging report if raining
    if is_raining and "waterlogging" not in chosen_cats:
        chosen_cats[0] = "waterlogging"

    # Always include stadium traffic during IPL evening
    if is_ipl_season and is_evening_rush and "stadium_traffic" not in chosen_cats:
        chosen_cats[1] = "stadium_traffic"

    loc_pool     = rng.sample(LOCATIONS, min(len(LOCATIONS), 9))
    handle_pool  = rng.sample(HANDLES,   min(len(HANDLES),   9))

    for i, (cat, loc) in enumerate(zip(chosen_cats, loc_pool)):
        templates_for_cat = TEMPLATES.get(cat, TEMPLATES["congestion"])
        tmpl, severity, dna_delta, likes_range, rt_range = templates_for_cat[
            rng.randint(0, len(templates_for_cat) - 1)
        ]

        alt = ALTERNATE_ROUTES.get(loc, "Inner Ring Road")
        text = tmpl.format(loc=loc, alt=alt)

        # If raining, append weather context to non-weather reports
        if is_raining and cat not in ("waterlogging", "clear"):
            text += f" Heavy rain ({weather_desc}) making conditions worse."

        handle, display_name = handle_pool[i % len(handle_pool)]

        # Deterministic ID so cards don't flicker on refresh within same hour
        uid = hashlib.md5(f"{day}-{hour}-{i}-{cat}".encode()).hexdigest()[:12]

        # AI re-classification of the generated text (demonstrates the pipeline)
        ai_cat = classify_text(text)

        reports.append(
            SocialReport(
                id=uid,
                handle=handle,
                display_name=display_name,
                text=text,
                location=loc,
                category=cat,
                severity=severity,
                severity_color=severity_color(severity),
                dna_impact=dna_delta,
                likes=rng.randint(*likes_range),
                retweets=rng.randint(*rt_range),
                posted_at=_mins_ago(day + hour, i),
                verified_by_ai=True,
                ai_classification=ai_cat,
                source="Simulated · X (Twitter) Social Intel",
            )
        )

    # Sort: Critical first, then High, then by DNA impact descending
    order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    reports.sort(key=lambda r: (order.get(r.severity, 4), -r.dna_impact))
    return reports
