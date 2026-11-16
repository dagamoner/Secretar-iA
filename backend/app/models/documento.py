from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class Documento(Base):
    __tablename__ = "documentos"

    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(Integer, ForeignKey("areas.id", ondelete="CASCADE"), nullable=False, index=True)
    numero_expediente = Column(String(80), nullable=False, index=True)
    tipo_documento = Column(String(40), default="EXPEDIENTE", nullable=False) # EXPEDIENTE, NOTA, RESOLUCION, etc.
    anio = Column(Integer, default=datetime.utcnow().year, nullable=False, index=True)
    iniciador_caratula = Column(String(255), nullable=False)
    extracto = Column(Text, nullable=True)
    
    # Cached denormalized current state for ultra-fast dense grid query
    estado_actual = Column(String(50), default="INICIADO", nullable=False, index=True)
    destino_actual = Column(String(150), default="Mesa de Entradas", nullable=False, index=True)
    portador_actual = Column(String(150), default="Mesa de Entradas", nullable=False, index=True)
    foja_actual = Column(Integer, default=1, nullable=False)
    prioridad = Column(String(30), default="NORMAL", nullable=False) # NORMAL, URGENTE, PRONTO DESPACHO
    
    fecha_ingreso = Column(DateTime, default=datetime.utcnow, nullable=False)
    ultimo_movimiento_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    creado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    area = relationship("Area", back_populates="documentos")
    creado_por = relationship("Usuario", back_populates="documentos_creados")
    movimientos = relationship("Movimiento", back_populates="documento", cascade="all, delete-orphan", order_by="desc(Movimiento.fecha_hora)")

    __table_args__ = (
        Index("ix_docs_area_num", "area_id", "numero_expediente"),
        Index("ix_docs_area_estado", "area_id", "estado_actual"),
    )
