import json
import logging
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from app.core.websockets import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSockets"])

class EditingNotice(BaseModel):
    area_id: int
    doc_id: int
    user_name: str
    is_editing: bool = True

@router.websocket("/ws/{area_id}")
async def websocket_endpoint(websocket: WebSocket, area_id: int):
    await manager.connect(websocket, area_id)
    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
                # If client sent an editing notice or heartbeat
                event_type = data.get("event")
                if event_type == "USER_EDITING":
                    await manager.broadcast_to_area(area_id, {
                        "event": "USER_EDITING",
                        "area_id": area_id,
                        "doc_id": data.get("doc_id"),
                        "user_name": data.get("user_name", "Otro usuario"),
                        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                        "payload": data.get("payload", {})
                    })
                elif event_type == "PING":
                    await websocket.send_text(json.dumps({"event": "PONG"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, area_id)
    except Exception as e:
        logger.warning(f"WebSocket unexpected error in area {area_id}: {e}")
        manager.disconnect(websocket, area_id)

@router.post("/events/editing")
async def emit_editing_event(notice: EditingNotice):
    event_payload = {
        "event": "USER_EDITING",
        "area_id": notice.area_id,
        "doc_id": notice.doc_id,
        "user_name": notice.user_name,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "payload": {
            "is_editing": notice.is_editing
        }
    }
    await manager.broadcast_to_area(notice.area_id, event_payload)
    return {"status": "broadcasted"}
