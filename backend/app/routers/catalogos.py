from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.catalogo_destino import CatalogoDestino
from app.models.user import Usuario
from app.schemas.catalogo_destino import DestinoCreate, DestinoResponse
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/catalogos", tags=["Catálogos"])

@router.get("/destinos", response_model=List[DestinoResponse])
def listar_destinos(area_id: int = Query(...), db: Session = Depends(get_db)):
    return db.query(CatalogoDestino).filter(
        CatalogoDestino.area_id == area_id,
        CatalogoDestino.activo == True
    ).order_by(CatalogoDestino.nombre).all()

@router.post("/destinos", response_model=DestinoResponse, status_code=201)
def crear_destino(data: DestinoCreate, db: Session = Depends(get_db)):
    destino = CatalogoDestino(**data.model_dump())
    db.add(destino)
    db.commit()
    db.refresh(destino)
    return destino

@router.get("/usuarios", response_model=List[UserResponse])
def listar_usuarios(area_id: int = Query(...), db: Session = Depends(get_db)):
    return db.query(Usuario).filter(
        Usuario.area_id == area_id,
        Usuario.activo == True
    ).order_by(Usuario.nombre_completo).all()

@router.post("/usuarios", response_model=UserResponse, status_code=201)
def crear_usuario(data: UserCreate, db: Session = Depends(get_db)):
    existente = db.query(Usuario).filter(Usuario.username == data.username).first()
    if existente:
        raise HTTPException(status_code=400, detail="Nombre de usuario ya existente")
    user = Usuario(**data.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
