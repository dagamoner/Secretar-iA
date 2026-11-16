from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.movimiento import MovimientoCreate, MovimientoResponse
from app.services.doc_service import DocumentoService

router = APIRouter(prefix="/movimientos", tags=["Movimientos"])

@router.post("", response_model=MovimientoResponse, status_code=201)
async def registrar_movimiento(data: MovimientoCreate, db: Session = Depends(get_db)):
    try:
        mov = await DocumentoService.registrar_movimiento(db, data)
        return mov
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar movimiento: {str(e)}")

@router.get("/documento/{doc_id}", response_model=List[MovimientoResponse])
def obtener_historial(doc_id: int, area_id: int = Query(...), db: Session = Depends(get_db)):
    return DocumentoService.obtener_historial_movimientos(db, doc_id, area_id)
