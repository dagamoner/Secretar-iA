from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class UserBase(BaseModel):
    area_id: int
    username: str
    nombre_completo: str
    rol: str = "OPERADOR"
    activo: bool = True

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
