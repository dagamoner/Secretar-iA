from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(Integer, ForeignKey("areas.id", ondelete="CASCADE"), nullable=False, index=True)
    username = Column(String(50), nullable=False, unique=True, index=True)
    nombre_completo = Column(String(150), nullable=False)
    rol = Column(String(30), default="OPERADOR", nullable=False)  # ADMIN, OPERADOR, SUPERVISOR, CONSULTA
    activo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    area = relationship("Area", back_populates="usuarios")
    documentos_creados = relationship("Documento", back_populates="creado_por")
    movimientos = relationship("Movimiento", back_populates="usuario")
