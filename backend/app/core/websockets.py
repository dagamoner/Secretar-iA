import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps area_id -> List of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, area_id: int):
        await websocket.accept()
        if area_id not in self.active_connections:
            self.active_connections[area_id] = []
        self.active_connections[area_id].append(websocket)
        logger.info(f"WebSocket client connected to area {area_id}. Total: {len(self.active_connections[area_id])}")

    def disconnect(self, websocket: WebSocket, area_id: int):
        if area_id in self.active_connections:
            if websocket in self.active_connections[area_id]:
                self.active_connections[area_id].remove(websocket)
            if not self.active_connections[area_id]:
                del self.active_connections[area_id]
        logger.info(f"WebSocket client disconnected from area {area_id}")

    async def broadcast_to_area(self, area_id: int, message: dict):
        if area_id not in self.active_connections:
            return
        dead_connections = []
        for connection in self.active_connections[area_id]:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.warning(f"Error broadcasting to client in area {area_id}: {e}")
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect(dead, area_id)

    async def broadcast_all(self, message: dict):
        for area_id in list(self.active_connections.keys()):
            await self.broadcast_to_area(area_id, message)

manager = ConnectionManager()
