from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AreaBase(BaseModel):
    nombre: str
    codigo: str
    descripcion: Optional[str] = None
    activo: bool = True

class AreaCreate(AreaBase):
    pass

class AreaResponse(AreaBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
