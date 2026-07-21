# 🚦 PRAVAHA (प्रवाह)
> **Predict Bangalore traffic before congestion forms.**

PRAVAHA is an intelligent traffic prediction and route optimization system designed for Bangalore. By combining real-time weather metrics, computer vision (YOLOv8 vehicle detection), historical traffic trends, and scheduled city events, PRAVAHA computes a dynamic **Road DNA Score (0–100)** and predicts traffic congestion **30–60 minutes in advance** to recommend optimal, low-risk routes.

---

## 📌 Project Status

### ✅ Completed
- FastAPI backend architecture & endpoint setup
- Authentication system (JWT-based user registration & login)
- MongoDB database integration
- Machine Learning traffic prediction model (`traffic_model.pkl` via Scikit-Learn Random Forest)
- Real-time weather integration (OpenWeather API)
- Expo mobile application setup (React Native SDK 57)

### 🚧 In Progress
- Google Maps interactive integration & custom marker positioning
- Road DNA Engine multi-factor risk scoring
- OpenStreetMap routing integration (OSMnx + NetworkX)
- YOLOv8 vehicle detection pipeline (counting & density estimation)
- Real-time WebSocket live updates

### 📋 Planned
- Risk-Weighted A* route optimization engine
- Real-time push notifications for traffic incidents & severe weather
- Containerization & Production Deployment

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Mobile** | React Native (Expo SDK 57) | Cross-platform Android/iOS application written in TypeScript |
| **Maps** | React Native Maps + Google Maps APIs | Interactive map, current location, destination search, route visualization |
| **Backend** | FastAPI (Python 3.12) | REST APIs, authentication, prediction services, WebSockets |
| **Database** | MongoDB | Stores users, predictions, events, Road DNA data |
| **Traffic Prediction** | Scikit-Learn (Random Forest) | Predicts traffic congestion using the trained model (`traffic_model.pkl`) |
| **Computer Vision** | YOLOv8 Nano | Detects vehicles and estimates traffic density from images/videos |
| **Routing** | OpenStreetMap, OSMnx, NetworkX | Road network graph and Risk-Weighted A* routing |
| **Weather** | OpenWeather API | Real-time weather information |
| **Real-Time** | FastAPI WebSockets | Live traffic alerts and congestion updates |

---

## 🏗️ Updated Architecture

```
                    ┌─────────────────────────┐
                    │      Expo Mobile App    │
                    │ (React Native SDK 57)   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                  React Native Maps + Google Maps APIs
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     FastAPI Backend     │
                    └────────────┬────────────┘
                                 │
      ┌──────────────────────────┼───────────────────────────┐
      │                          │                           │
      ▼                          ▼                           ▼
 Scikit-Learn             OpenWeather API            YOLOv8 Vehicle Detection
Traffic Prediction               │                    (Vehicle Counting)
      │                          │                           │
      └──────────────┬───────────┴──────────────┬────────────┘
                     ▼
              Road DNA Engine
                     │
                     ▼
     OpenStreetMap (OSMnx + NetworkX)
                     │
                     ▼
        Risk-Weighted A* Route
                     │
                     ▼
            Optimized Route to User
```

---

## ⚡ Updated Road DNA Formula

$$\text{Road DNA Score} = w_1 \cdot \text{Weather Risk} + w_2 \cdot \text{Vehicle Density (YOLO)} + w_3 \cdot \text{Historical Congestion} + w_4 \cdot \text{Event Impact}$$

Where:
* **Weather Risk**: Rainfall, visibility, waterlogging risk from OpenWeather API.
* **Vehicle Density (YOLO)**: Real-time vehicle count from uploaded image/video or CCTV camera feed.
* **Historical Congestion**: Machine learning prediction using historical traffic patterns (`traffic_model.pkl`).
* **Event Impact**: Cricket matches (Chinnaswamy Stadium), metro construction, festivals, VIP movement.

The **Road DNA score ranges from 0 to 100**, where higher values indicate greater congestion risk.

---

## 📂 Directory Structure

```
pravaha/
│
├── .git/
├── .gitignore
├── README.md
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── config/
│   │   ├── database/
│   │   └── main.py
│   │
│   ├── data/
│   ├── models/
│   │   ├── traffic_model.pkl
│   │   ├── traffic_preprocessor.pkl
│   │   └── traffic_training_metadata.json
│   │
│   ├── outputs/
│   ├── requirements.txt
│   └── train_model.py
│
├── mobile/
│   ├── src/
│   ├── assets/
│   ├── package.json
│   ├── app.config.js
│   └── tsconfig.json
│
├── datasets/
├── docs/
├── models/
└── videos/
```

---

## 🔑 Environment Variables

### Mobile (`mobile/.env`)
```env
# Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

# Android Emulator
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000

# Physical Device Example
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:8000
```

### Backend (`backend/.env`)
```env
APP_NAME=PRAVAHA API

MONGO_URI=mongodb://localhost:27017
MONGO_DATABASE=pravaha

JWT_SECRET_KEY=your_secure_secret

OPENWEATHER_API_KEY=your_api_key

OPENWEATHER_DEFAULT_CITY=Bengaluru
```

---

## 🚀 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Backend health check |
| `POST` | `/api/v1/auth/register` | Register user |
| `POST` | `/api/v1/auth/login` | User login |
| `GET` | `/api/v1/weather` | Current weather |
| `POST` | `/api/v1/api/predict` | Predict traffic congestion |
| `POST` | `/api/v1/detect` *(Planned)* | YOLO vehicle detection |
| `GET` | `/api/v1/roads` *(Planned)* | Fetch Road DNA information |
| `POST` | `/api/v1/route` *(Planned)* | Risk-weighted route generation |
| `WS` | `/ws/updates` *(Planned)* | Live traffic updates |

> *Note: Endpoints marked (Planned) are part of the upcoming implementation and are not yet available.*

---

## 🎯 Demo Flow

1. User logs into PRAVAHA.
2. Google Maps displays the current location.
3. User selects a destination.
4. Backend retrieves:
   - Current weather from OpenWeather.
   - Historical traffic prediction from the trained Scikit-Learn model.
   - Vehicle density from YOLOv8 (uploaded video/image or camera feed).
   - Event information affecting traffic.
5. The Road DNA Engine computes a dynamic risk score (0–100).
6. The routing engine (OSMnx + NetworkX A*) generates the safest and fastest route.
7. The optimized route and congestion status are displayed on the map.
8. Live updates are pushed through WebSockets when traffic conditions change.
