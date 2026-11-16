from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, computed_field
from app.schemas.movimiento import MovimientoResponse

class DocumentoBase(BaseModel):
    area_id: int
    numero_expediente: str
    tipo_documento: str = "EXPEDIENTE"
    anio: int = datetime.utcnow().year
    iniciador_caratula: str
    extracto: Optional[str] = None
    estado_actual: str = "INICIADO"
    destino_actual: str = "Mesa de Entradas"
    portador_actual: str = "Mesa de Entradas"
    foja_actual: int = 1
    prioridad: str = "NORMAL"

class DocumentoCreate(DocumentoBase):
    creado_por_id: Optional[int] = None
    creado_por_nombre: Optional[str] = None
    observacion_inicial: Optional[str] = "Ingreso inicial por mesa de entradas"

class DocumentoUpdate(BaseModel):
    iniciador_caratula: Optional[str] = None
    extracto: Optional[str] = None
    prioridad: Optional[str] = None

class DocumentoResponse(BaseModel):
    id: int
    area_id: int
    numero_expediente: str
    tipo_documento: str
    anio: int
    iniciador_caratula: str
    extracto: Optional[str] = None
    estado_actual: str
    destino_actual: str
    portador_actual: str
    foja_actual: int
    prioridad: str
    fecha_ingreso: datetime
    ultimo_movimiento_at: datetime
    creado_por_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def ultimo_movimiento_hora_corta(self) -> str:
        return self.ultimo_movimiento_at.strftime("%H:%M")

    @computed_field
    @property
    def ultimo_movimiento_formateado(self) -> str:
        return self.ultimo_movimiento_at.strftime("%d/%m/%Y %H:%M")

    class Config:
        from_attributes = True

class DocumentoDetailResponse(DocumentoResponse):
    movimientos: List[MovimientoResponse] = []

    class Config:
        from_attributes = True
