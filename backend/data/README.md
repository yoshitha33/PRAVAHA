# Dataset Drop Zones

Place your CSV files in the matching folders below.

## Recommended folders

- `data/traffic/` - historical traffic records for congestion prediction
- `data/weather/` - weather CSV exports or historical weather samples
- `data/events/` - event impact data
- `data/incidents/` - accidents, construction, waterlogging, lane closure data
- `data/roads/` - road network CSV files or road metadata extracts

## Suggested file types

- Traffic: `csv`
- Weather: `csv`
- Events: `csv` or `json`
- Incidents: `csv` or `json`
- Roads: `csv` or `json`

## Suggested traffic columns

- `timestamp`
- `road_name`
- `latitude`
- `longitude`
- `average_speed`
- `traffic_volume`
- `congestion_level`

## Next step

After you add files here, I can build the ingestion, validation, and preprocessing pipeline around them.
