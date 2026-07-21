import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.api.v1.events import get_live_events

router = APIRouter(tags=["websockets"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


manager = ConnectionManager()


@router.websocket("/ws/updates")
async def websocket_updates(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection",
            "message": "Connected to PRAVAHA Live API Alert Stream"
        })

        last_alerts_len = 0

        while True:
            await asyncio.sleep(8)

            try:
                # Query the fully dynamic get_live_events() function
                live_alerts = await get_live_events()
                
                if len(live_alerts) > 0:
                    latest = live_alerts[0]
                    # Broadcast latest dynamic alert
                    await websocket.send_json({
                        "type": "alert",
                        "id": latest.id,
                        "title": latest.title,
                        "location": latest.location,
                        "detail": latest.detail,
                        "timestamp": latest.timestamp,
                    })
            except Exception as exc:
                print(f"WebSocket broadcast error: {exc}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
