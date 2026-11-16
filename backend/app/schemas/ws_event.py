from typing import Any, Dict, Optional
from datetime import datetime
from pydantic import BaseModel

class WSEvent(BaseModel):
    event: str  # DOC_CREATED, DOC_UPDATED, MOVIMIENTO_ADDED, USER_EDITING
    area_id: int
    doc_id: Optional[int] = None
    user_name: Optional[str] = "Sistema"
    timestamp: str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    payload: Optional[Dict[str, Any]] = None
