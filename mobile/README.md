Project Name: PRAVAHA

Purpose:
Predict Bangalore traffic before congestion forms.

Frontend:
React Native

Backend:
FastAPI

Database:
MongoDB

AI:
YOLOv8

Maps:
Google Maps

Weather:
OpenWeather

Routing:
NetworkX A*

Architecture:
Modular

Coding Rules

Use TypeScript.

Use Clean Architecture.

Write reusable components.

Write comments.

Never generate duplicate code.

Use async/await.

Follow SOLID principles.

Project Goal
Develop a React Native mobile application that predicts Bangalore traffic congestion before it occurs by combining weather, computer vision, historical traffic, and scheduled city events. The system generates a Road DNA Score, predicts congestion, and recommends safer routes.

Problem Statement
•	Heavy rainfall
•	Waterlogging
•	Metro construction
•	Road maintenance
•	Cricket matches & festivals
•	Political rallies
•	Office rush hours
•	Accidents
•	Current navigation apps react after congestion forms; PRAVAHA aims to predict congestion 30–60 minutes in advance.
Technology Stack
•	Mobile: React Native (Expo)
•	Backend: FastAPI
•	Database: MongoDB
•	AI: YOLOv8 Nano
•	Maps: Google Maps API
•	Weather: OpenWeather API
•	Routing: OpenStreetMap + OSMnx + NetworkX (A*)
•	Real-Time: FastAPI WebSockets
Project Modules
•	1. Authentication – Login, Register, JWT, User Profile
•	2. Google Maps – Current Location, Destination, Route Display, Traffic Layer
•	3. Weather Service – Rainfall, Temperature, Humidity, Visibility, Wind
•	4. Event Intelligence – IPL, Festivals, Construction, VIP Movement, Accidents
•	5. Computer Vision – YOLO vehicle detection, vehicle count, density estimation
•	6. Historical Traffic – Peak hour patterns and congestion trends
•	7. Road Database – Silk Board, Bellandur, Marathahalli, Whitefield, Hebbal, Electronic City
•	8. Road DNA Engine – Combines weather, traffic, events and history into a 0–100 score
•	9. Prediction Engine – Predicts congestion for the next 30–60 minutes
•	10. Route Optimization – Risk-weighted A* algorithm
•	11. Notification Engine – Alerts for congestion, rain, accidents and route changes
•	12. Real-Time Updates – WebSocket-based live updates
Mobile Screens
•	Splash
•	Login
•	Home
•	Google Map
•	Prediction
•	Alerts
•	Profile
•	Settings
Backend APIs
•	POST /login
•	POST /register
•	GET /weather
•	GET /roads
•	GET /events
•	POST /detect
•	POST /road-dna
•	GET /prediction
•	POST /route
•	WS /updates
MongoDB Collections
•	users
•	roads
•	weather
•	events
•	traffic
•	predictions
•	notifications
Folder Structure
•	mobile/
•	backend/
•	datasets/
•	videos/
•	models/
•	docs/
•	README.md
Development Plan
•	Sprint 1: Setup, Authentication, MongoDB, FastAPI, React Native
•	Sprint 2: Maps, Weather API, Road Database
•	Sprint 3: YOLO, Historical Data, Event Service
•	Sprint 4: Road DNA Engine, Prediction Engine
•	Sprint 5: Route Optimization, WebSockets, Notifications
•	Sprint 6: UI Polish, Testing, Documentation, Cisco Demo
Final Demo Flow
•	Login
•	Map loads
•	Weather fetched
•	YOLO analyzes traffic video
•	Road DNA generated
•	Congestion predicted
•	Alternative route displayed
•	Real-time alert shown
CISCO IDEATHON 2026 · TECHNICAL IMPLEMENTATION DOCUMENT
PRAVAHA: What To Build, How It Works, and Why

1. Executive Summary
PRAVAHA is a predictive traffic-routing system for Bangalore. It reads early warning signals — weather, social media, municipal alerts, and live camera footage at key junctions — to predict road congestion 30–90 minutes before it actually forms, and then reroutes an entire delivery fleet in advance, instead of one vehicle at a time.
This document is the technical build reference: it lays out exactly what to implement, which algorithms to use and why, the full system architecture, the real data sources available today, and an honest, phased plan for building it — written so that any new reviewer, technical or not, can follow it from start to finish.
2. Problem Statement
Standard navigation apps (Google Maps, Waze) rely on historical patterns and current GPS pings. They cannot see hyper-local, sudden events before they cause a jam:
•	Sudden monsoon waterlogging
•	Unannounced VIP movement
•	Localized, last-minute construction
•	Impromptu public gatherings or festivals
As a result, commercial delivery fleets and daily commuters are routed directly into bottlenecks that were, in hindsight, predictable. The task is to design a responsive, predictive routing architecture that ingests non-standard, real-time signals and reroutes vehicles before the jam fully forms.
3. Solution Overview
The idea, in one line:
PRAVAHA reads early warning signs (weather, tweets, civic alerts, camera footage) and predicts which road will jam up 30–90 minutes before it happens — then reroutes an entire delivery fleet in advance.

How it works, step by step:
1.	Watch for signals — read tweets, civic alerts, and weather; watch live camera feeds at key junctions.
2.	Understand it instantly, at the edge — a small AI model running on Cisco edge hardware (Cisco IOx) turns a noisy tweet or a camera frame into a clean fact, before anything reaches the cloud.
3.	Build a Road DNA risk score — cloud AI fuses every clean fact with live traffic into one profile per road: flood, event, VIP, construction, and accident risk, plus one overall score.
4.	Predict the jam 30–90 minutes early — because the system reads leading indicators, not just current speed.
5.	Reroute the whole fleet, together — one decision goes to every vehicle in the fleet at once, so vehicles don't create a new jam avoiding the old one.
4. System Architecture
The system is organized into eight layers, from raw signal to final action. Data flows top to bottom; each layer only passes on what the next layer actually needs, which keeps the whole pipeline fast.
Layer	What it does
1. Data Sources	Text: tweets, BBMP/Traffic Police alerts, weather APIs. Physical: Cisco Meraki cameras, IoT loop sensors, fleet GPS.
2. Edge Layer	Cisco Meraki cameras + Cisco IOx run lightweight computer vision and local text filtering, so only short, clean summaries leave the site.
3. Secure Transport	Cisco Kinetic normalizes sensor formats; Cisco SD-WAN secures the link; Cisco ThousandEyes monitors that the link stays healthy.
4. Cloud Ingestion	Apache Kafka streams every signal; Spark or Flink organizes it by road segment and time window.
5. Knowledge Layer	A Feature Store, a Knowledge Graph (roads + live risk factors), and a Vector Database (for text embeddings) hold the current state of the city.
6. Fusion Prediction Engine	A Graph Neural Network + a small LLM + a lightweight computer vision model combine every signal into one Road DNA score per road, with a confidence level.
7. Decision Engine	A* search with risk-weighted edge costs picks the safest route; a Cooperative A* / Multi-Agent RL layer coordinates the whole fleet; a Digital Twin simulates 'what-if' scenarios.
8. Outputs	Fleet Dashboard, Driver App, Dispatcher Panel, and an Alert System — what a human actually sees and acts on.

Why split work between edge and cloud: sending raw video or a firehose of tweets straight to the cloud is slow and expensive. Processing near the source (the edge layer) means only small, clean, already-useful facts travel onward — this is the same reason edge computing exists as a category in real networking products.
5. Core Algorithms — What To Actually Implement
5.1 Understanding Messy Text
Goal: turn a noisy tweet or civic alert into a clean, structured fact: {type, location, time_window, confidence}.
Prototype approach (buildable in days): keyword and rule-based tagging — scan text for known trigger words (‘flood’, ‘waterlogged’, ‘accident’, ‘closed’, ‘VIP’, ‘bandh’, ‘rally’) and match them to nearby road names. Assign a simple confidence score based on how many independent posts mention the same thing in the same time window.
Production upgrade: a small, fine-tuned language model (e.g. a DistilBERT-class classifier) trained on labelled traffic-related text, extracting the same structured fields with better accuracy on ambiguous phrasing.
5.2 Confirming Signals With Vision
Goal: confirm a text-based claim is real before trusting it, using camera footage at the same junction.
Prototype approach: since physical Cisco Meraki hardware is not available to a student team, this step is simulated in software — a function that stands in for the camera and returns a mock ‘confirmed / not confirmed’ result, clearly documented as simulated.
Production approach: a lightweight object-detection model (YOLO-class) running on Cisco IOx at the camera site, counting vehicles and detecting standing/stopped vehicles or visible flooding.
5.3 Predicting Congestion Ahead of Time
Goal: predict how congestion at one road segment will spread to nearby segments over the next 30–90 minutes.
Recommended model: a Graph Neural Network (GNN), where each road segment is a node and each junction connection is an edge. This is the same general approach used in Google's production Maps ETA model (Google DeepMind, 2021), which improved ETA accuracy by up to 50% using exactly this graph-based approach — applied here to prediction instead of correction.
Prototype fallback (if a full GNN is too heavy for the available time): a simpler weighted moving-average or logistic regression model using the same input features (current speed, rainfall, nearby event flags) is an acceptable, honest starting point — the graph-based upgrade can follow once the pipeline works end-to-end.
5.4 The Road DNA Risk Score
Each road segment is scored on five separate risk types, then combined into one overall score:
Overall Score =
    (0.40 x Flood Risk)        +
    (0.25 x Construction Risk) +
    (0.20 x Event Risk)        +
    (0.10 x Accident Risk)     +
    (0.05 x VIP Movement Risk)
Worked example (Silk Board Junction): Flood 92%, Construction 70%, Event 45%, Accident 18%, VIP 12%.
Overall = (0.40 x 92) + (0.25 x 70) + (0.20 x 45) + (0.10 x 18) + (0.05 x 12)
        = 36.8 + 17.5 + 9.0 + 1.8 + 0.6
        = 65.7  ->  approx. 66
Note: the pitch deck shows a rounded, illustrative figure of 81 for visual impact on the same example. The formula above is the actual computation logic to implement — the weights (0.40, 0.25, 0.20, 0.10, 0.05) are a starting point and should be tuned per deployment, since flood and construction typically cause full blockage while VIP movement and minor events usually cause partial slowdowns only.
Decision rule: a company sets a simple threshold, e.g. ‘avoid any road with an Overall Score above 60,’ without needing to understand the model underneath.
5.5 Routing Algorithm: Risk-Weighted A*
Goal: find the best single route from A to B, avoiding high-risk roads.
Base algorithm: A* (A-star) search — the same family of algorithm used by real routing engines (Google Maps, OSRM). It is available out of the box in Python's networkx and osmnx libraries, which makes it realistic to implement directly.
The key change: instead of minimizing plain distance or time, each road's cost is adjusted using its Road DNA score:
adjusted_cost(road) = base_travel_time(road) x (1 + risk_score(road) / 100)

# Example: a road with 92% flood risk becomes almost twice as
# 'expensive' to travel through, so A* naturally routes around it.
5.6 Coordinating the Whole Fleet
Goal: reroute many vehicles at once without having them all pile onto the same alternate road.
Prototype approach: Cooperative A* — run A* for each vehicle in the fleet one at a time; after each vehicle's route is chosen, slightly increase the cost of the roads it now uses before computing the next vehicle's route. This spreads vehicles across different alternate roads using only the same A* algorithm run in a loop — genuinely buildable in the available time.
for vehicle in fleet:
    route = a_star(vehicle.start, vehicle.end, road_costs)
    for road in route:
        road_costs[road] *= 1.15   # slightly penalize reuse
    assign(vehicle, route)
Production upgrade: Multi-Agent Reinforcement Learning (MARL), where each vehicle is an agent that learns the best joint routing policy over time. This is a more powerful but less predictable approach, with real academic precedent for Bangalore traffic control (IISc / Amazon Alexa research, arXiv:2511.11654) — recommended as a Phase 2 upgrade, not a Phase 0 requirement.
6. Technology Stack & Protocols
Layer	Tool	Why
Frontend	React + Google Maps API	Shows the live map and reroutes to drivers and dispatchers
Backend	Python (FastAPI)	Fast to build with and handles requests quickly
Database	PostgreSQL + Redis	Permanent storage plus a fast cache for changing data
Live data movement	Apache Kafka	Moves tweets, weather, camera alerts, and GPS instantly
Edge compute	Cisco Meraki MV + Cisco IOx (simulated in prototype)	Runs computer vision at the junction, not the cloud
Secure networking	Cisco SD-WAN + Cisco ThousandEyes	Keeps every edge-to-cloud link secure and monitored
AI models	GNN + rule-based/small LLM + lightweight CV	Learns road patterns, reads messy text, confirms incidents
Routing algorithm	A* (risk-weighted) + Cooperative A*	Industry-standard shortest path, adapted to avoid risk
Protocols	REST · MQTT · TCP/IP	App-to-server, sensor-to-server, and base internet rules
7. Data Sources To Use
Source	Type	Where to get it
Bangalore's Traffic Pulse (Kaggle)	Static / historical	kaggle.com/datasets/preethamgouda/banglore-city-traffic-dataset
Bangalore GTFS Data (Kaggle)	Static	kaggle.com/datasets/ashiksanyo/bangalore-gtfs-data
OpenStreetMap road network (via osmnx)	Live / structural	Python osmnx library, pulls directly from OpenStreetMap
OpenWeatherMap	Live API	openweathermap.org/api — free tier available
METR-LA / PEMS-BAY	Static benchmark	github.com/liyaguang/DCRNN — for validating the model before Bangalore data
OpenCity Urban Data Portal	Static / civic	data.opencity.in — for realistic mock municipal alerts
Reddit (r/bangalore)	Live, free	Reddit API — free for small-scale/non-commercial use
Twitter / X	Not free in 2026	Paid API only — recommend mocking realistic sample posts instead
8. Implementation Roadmap
8.1 Phase 0 — Prototype (10 Days)
•	Days 1–2: Set up FastAPI backend, PostgreSQL + PostGIS, and pull the OSMnx road graph for 3–4 real corridors (Silk Board, Marathahalli, ORR, ITPL).
•	Day 3: Build mock data feeds for tweets, weather, and municipal alerts as controllable JSON files.
•	Day 4: Represent the road network in NetworkX and connect mock events to specific roads.
•	Day 5: Implement the Road DNA scoring formula and a simple prediction model (start with logistic regression/weighted average; upgrade to a GNN only if time allows).
•	Day 6: Implement risk-weighted A* for single-route rerouting and Cooperative A* for fleet-level rerouting.
•	Day 7: Build the React + Google Maps API frontend showing the live map and risk heatmap.
•	Day 8: Connect frontend to backend; add the explainable Road DNA card in the UI.
•	Day 9: Rehearse a full scripted demo (rain event → mock tweet → predicted jam → fleet reroute) until smooth.
•	Day 10: Polish the UI, record a backup demo video, and finalize the pitch deck.
8.2 Phase 1 — Pilot (2–3 months)
Real Cisco Meraki cameras and IoT gateways installed on 2–3 real corridors, partnered with one logistics company for live trials. Cost: moderate (real hardware + cloud infrastructure).
8.3 Phase 2 — Scale (6–12 months)
Expand to more corridors and fleet partners; add a lighter public commuter app; explore Multi-Agent RL for fleet coordination; explore drone delivery for small, urgent parcels on very high-risk roads (subject to DGCA regulatory approval — not a Phase 0 or Phase 1 commitment).
9. Research Papers & References
•	Derrow-Pinion et al., “ETA Prediction with Graph Neural Networks in Google Maps,” Google DeepMind, CIKM 2021 — arXiv:2108.11482
•	“DeepETA: How Uber Predicts Arrival Times,” Uber Engineering, 2022
•	“Multimodal Big Data Fusion for Traffic Congestion Prediction,” Springer, 2018 — doi:10.1007/978-3-319-97598-6_13
•	Kumar et al., “Real-Time Bengaluru City Traffic Congestion Prediction Using Deep Learning Models,” IJTDI, Sept 2025 — doi:10.18280/ijtdi.090315
•	Sen & Bhatnagar, “Convergence of Multiagent Learning Systems for Traffic Control,” Amazon Alexa / IISc Bangalore — arXiv:2511.11654
•	“Ten Quick Tips for Improving ETA Predictions in Logistics and Transportation,” PeerJ Computer Science, Oct 2025
10. Success Metrics (Target KPIs)
Metric	Target
Prediction accuracy	> 80%
Average alert lead time	30–90 minutes
Edge alert latency	< 5 seconds
Full fleet reroute latency	< 30 seconds
Fleet delay reduction (pilot target)	15–25%
11. Honest Limitations & Open Risks
•	No physical Cisco camera/edge hardware is available to a student team — the edge layer is simulated in software for the prototype.
•	Live municipal (BBMP/Traffic Police) data is mostly unstructured today — realistic mock alerts are used, built from real historical civic data.
•	The Twitter/X API is no longer free as of 2026 — Reddit or fully mocked posts are used instead for the social-signal input.
•	Multi-Agent RL for full fleet coordination is an active research area — recommended as a human-in-the-loop, Phase 2 upgrade, not a Phase 0 claim.
•	The Road DNA weighting formula is a reasonable starting point, not a scientifically finalized weighting — it should be tuned with real operational data during the pilot phase.
