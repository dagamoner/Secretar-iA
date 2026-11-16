from typing import Optional
from datetime import datetime
from pydantic import BaseModel, computed_field

class MovimientoBase(BaseModel):
    area_id: int
    documento_id: int
    estado_nuevo: str
    destino_nuevo: str
    portador_nuevo: str
    fojas_agregadas: int = 0
    observacion: Optional[str] = None

class MovimientoCreate(MovimientoBase):
    usuario_id: Optional[int] = None
    usuario_nombre: Optional[str] = None

class MovimientoResponse(BaseModel):
    id: int
    documento_id: int
    area_id: int
    usuario_id: Optional[int] = None
    usuario_nombre: str
    estado_anterior: Optional[str] = None
    estado_nuevo: str
    destino_anterior: Optional[str] = None
    destino_nuevo: str
    portador_anterior: Optional[str] = None
    portador_nuevo: str
    fojas_agregadas: int
    observacion: Optional[str] = None
    fecha_hora: datetime
    created_at: datetime

    @computed_field
    @property
    def hora_corta(self) -> str:
        return self.fecha_hora.strftime("%H:%M")

    @computed_field
    @property
    def fecha_formateada(self) -> str:
        return self.fecha_hora.strftime("%d/%m/%Y %H:%M")

    class Config:
        from_attributes = True
