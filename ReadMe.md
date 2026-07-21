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
