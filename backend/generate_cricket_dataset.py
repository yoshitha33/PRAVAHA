"""Generate Bangalore Cricket Match Peak Hours Traffic Dataset.
Target Location: M. Chinnaswamy Stadium & Surrounding Corridors
Months: March, April, May (IPL Season)
Peak Hours: 16:00 to 23:30
"""

import random
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "traffic"
DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_CSV = DATA_DIR / "Bangalore_Cricket_Match_Traffic_Dataset.csv"

TEAMS = ["CSK", "MI", "KKR", "GT", "DC", "RR", "SRH", "LSG"]
STADIUM_ROADS = [
    "MG Road",
    "Kasturba Road",
    "Residency Road",
    "Cubbon Road",
    "Richmond Road",
    "Infant Jesus Church Junction",
]


def generate_cricket_match_dataset(num_records: int = 1500) -> Path:
    records = []
    # Start date in March of IPL season
    start_date = datetime(2025, 3, 22)

    for i in range(num_records):
        # Match dates in March, April, May
        days_offset = random.randint(0, 70)
        match_datetime = start_date + timedelta(days=days_offset)

        # Match months constraint: March (3), April (4), May (5)
        month = random.choice([3, 4, 5])
        match_date = datetime(2025, month, random.randint(1, 28))

        # Peak hours during match days (16:00 PM to 23:30 PM)
        hour = random.choice([16, 17, 18, 19, 20, 21, 22, 23])

        road_name = random.choice(STADIUM_ROADS)
        opponent_team = random.choice(TEAMS)
        spectators = random.randint(28000, 35000)
        weather = random.choice(["Clear", "Light Rain", "Heavy Rain", "Thunderstorm"])

        # High congestion during entry (17:00-19:30) and exit (22:00-23:30)
        is_peak_entry_exit = hour in [17, 18, 19, 22, 23]

        if is_peak_entry_exit or "Rain" in weather:
            traffic_volume = random.randint(85000, 130000)
            avg_speed = round(random.uniform(6.5, 14.0), 2)
            travel_time_index = round(random.uniform(2.5, 4.5), 2)
            road_utilization = round(random.uniform(92.0, 115.0), 2)
            congestion_level = "High" if "Rain" not in weather else "Severe"
            road_dna = random.randint(78, 95)
        else:
            traffic_volume = random.randint(55000, 84000)
            avg_speed = round(random.uniform(15.0, 25.0), 2)
            travel_time_index = round(random.uniform(1.6, 2.4), 2)
            road_utilization = round(random.uniform(70.0, 91.0), 2)
            congestion_level = "Medium"
            road_dna = random.randint(55, 75)

        reroute_reason = (
            f"IPL Match at Chinnaswamy Stadium (RCB vs {opponent_team}, {spectators:,} spectators). "
            f"Heavy crowd movement on {road_name} during peak match hours ({hour}:00). "
            f"Road DNA: {road_dna}. Reroute via Richmond Road flyover."
        )

        records.append({
            "Date": match_date.strftime("%Y-%m-%d"),
            "Time_Hour": hour,
            "Month": month,
            "Area Name": "Chinnaswamy Stadium Zone",
            "Road/Intersection Name": road_name,
            "Event": f"IPL Match: RCB vs {opponent_team}",
            "Spectator_Count": spectators,
            "Traffic Volume": traffic_volume,
            "Average Speed": avg_speed,
            "Travel Time Index": travel_time_index,
            "Road Capacity Utilization": road_utilization,
            "Incident Reports": random.randint(0, 4),
            "Environmental Impact": round(random.uniform(120.0, 190.0), 2),
            "Public Transport Usage": round(random.uniform(60.0, 90.0), 2),
            "Traffic Signal Compliance": round(random.uniform(70.0, 90.0), 2),
            "Parking Usage": round(random.uniform(85.0, 100.0), 2),
            "Pedestrian and Cyclist Count": random.randint(800, 3500),
            "Weather Conditions": weather,
            "Roadwork and Construction Activity": random.choice(["No", "Yes"]),
            "Congestion Level": congestion_level,
            "Road_DNA_Score": road_dna,
            "Reroute_Reason": reroute_reason,
        })

    df = pd.DataFrame(records)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Successfully generated {len(df)} records in {OUTPUT_CSV}")
    return OUTPUT_CSV


if __name__ == "__main__":
    generate_cricket_match_dataset()
