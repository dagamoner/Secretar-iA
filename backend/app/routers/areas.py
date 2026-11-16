from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.area import Area
from app.schemas.area import AreaCreate, AreaResponse

router = APIRouter(prefix="/areas", tags=["Areas"])

@router.get("", response_model=List[AreaResponse])
def listar_areas(db: Session = Depends(get_db)):
    return db.query(Area).filter(Area.activo == True).order_by(Area.nombre).all()

@router.post("", response_model=AreaResponse, status_code=201)
def crear_area(data: AreaCreate, db: Session = Depends(get_db)):
    existente = db.query(Area).filter(Area.codigo == data.codigo).first()
    if existente:
        raise HTTPException(status_code=400, detail="Código de área ya existente")
    area = Area(**data.model_dump())
    db.add(area)
    db.commit()
    db.refresh(area)
    return area

@router.get("/{area_id}", response_model=AreaResponse)
def obtener_area(area_id: int, db: Session = Depends(get_db)):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Área no encontrada")
    return area
