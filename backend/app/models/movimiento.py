from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class Movimiento(Base):
    __tablename__ = "movimientos"

    id = Column(Integer, primary_key=True, index=True)
    documento_id = Column(Integer, ForeignKey("documentos.id", ondelete="CASCADE"), nullable=False, index=True)
    area_id = Column(Integer, ForeignKey("areas.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    usuario_nombre = Column(String(150), nullable=False) # Inmutable audit: user name at moment of record
    
    estado_anterior = Column(String(50), nullable=True)
    estado_nuevo = Column(String(50), nullable=False) # DESPACHO, EN MANO, FIRMADO, ARCHIVO, NOTIFICADO, etc.
    
    destino_anterior = Column(String(150), nullable=True)
    destino_nuevo = Column(String(150), nullable=False)
    
    portador_anterior = Column(String(150), nullable=True)
    portador_nuevo = Column(String(150), nullable=False)
    
    fojas_agregadas = Column(Integer, default=0, nullable=False)
    observacion = Column(Text, nullable=True)
    fecha_hora = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    documento = relationship("Documento", back_populates="movimientos")
    area = relationship("Area", back_populates="movimientos")
    usuario = relationship("Usuario", back_populates="movimientos")

    __table_args__ = (
        Index("ix_mov_doc_fecha", "documento_id", "fecha_hora"),
    )
