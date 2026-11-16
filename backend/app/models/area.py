from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False, unique=True)
    codigo = Column(String(20), nullable=False, unique=True, index=True)
    descripcion = Column(Text, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    documentos = relationship("Documento", back_populates="area", cascade="all, delete-orphan")
    usuarios = relationship("Usuario", back_populates="area", cascade="all, delete-orphan")
    destinos = relationship("CatalogoDestino", back_populates="area", cascade="all, delete-orphan")
    movimientos = relationship("Movimiento", back_populates="area", cascade="all, delete-orphan")
