from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class DestinoBase(BaseModel):
    area_id: int
    nombre: str
    responsable_defecto: Optional[str] = None
    activo: bool = True

class DestinoCreate(DestinoBase):
    pass

class DestinoResponse(DestinoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
