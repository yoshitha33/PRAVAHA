# PRAVAHA: End-to-End Route Visualization & Traffic Analysis Walkthrough

This document walksthrough the implementation of the **Risk-Weighted A* Route Optimizer**, double polyline drawing (Normal vs. Optimized), and dynamic traffic delay explanation features.

---

## 🛠️ Key Accomplishments

### 1. High-Accuracy Bangalore Geocoded Start/End Points
- Fixed the map origin pointer issue: The map now centers and places the start marker exactly at the resolved coordinate of the city/area typed in the **Origin input** (e.g. `Marathahalli` or `Indiranagar`) rather than staying pinned to the user's real GPS device location in Bhimavaram.
- Returns:
  - `origin_lat`, `origin_lng`
  - `destination_lat`, `destination_lng`

### 2. Actual Street-by-Street Route Generation (OSRM Integration)
- Updated the backend (`route.py`) to query the **OSRM (Open Source Routing Machine) API** to fetch exact road-by-road and turn-by-turn path coordinates between places in Bangalore.
- Generates:
  - **Red Dashed Polyline (🔴)**: Real street-by-street standard route.
  - **Green Solid Polyline (🟢)**: Real street-by-street A* optimized route.

### 3. Pure OpenStreetMap Web Navigation Map
- Rebuilt the Web Map component (`home-map.web.tsx`) to exclusively use **Leaflet.js & OpenStreetMap** (removing Google Maps Scripts entirely).
- This ensures 100% reliable, fast, and keyless route visualization out of the box in the web browser preview.

### 4. Native Mobile Map Polyline Draw
- Updated the Native Map component (`home-map.tsx`) to render react-native-maps `<Polyline>` overlays with customized stroke styling for both routes.
- Configured map camera focus adjustment to automatically scale and center routes inside the viewport.

### 5. Delays & Reason UI Integration
- Programmed the Map Screen bottom sheet to render:
  - Both route ETAs in minutes.
  - Dynamic **"Why is the normal route late?"** cards showing exact weather/waterlogging/construction bottleneck details.
  - Dynamic route optimization logical descriptions.
