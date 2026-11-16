import io
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd

from app.core.database import get_db
from app.schemas.documento import DocumentoCreate, DocumentoResponse, DocumentoDetailResponse
from app.services.doc_service import DocumentoService

router = APIRouter(prefix="/documentos", tags=["Documentos"])

@router.get("", response_model=List[DocumentoResponse])
def listar_documentos(
    area_id: int = Query(..., description="ID del área multi-tenant obligatoria"),
    search: Optional[str] = Query(None, description="Búsqueda instantánea en número de exp, carátula o extracto"),
    estado: Optional[str] = Query(None, description="Filtro por estado (DESPACHO, EN MANO, FIRMADO, etc.)"),
    portador: Optional[str] = Query(None, description="Filtro por portador actual"),
    destino: Optional[str] = Query(None, description="Filtro por destino actual"),
    prioridad: Optional[str] = Query(None, description="Filtro por prioridad"),
    skip: int = Query(0, ge=0),
    limit: int = Query(500, le=2000),
    db: Session = Depends(get_db)
):
    return DocumentoService.listar_documentos(
        db=db,
        area_id=area_id,
        search=search,
        estado=estado,
        portador=portador,
        destino=destino,
        prioridad=prioridad,
        skip=skip,
        limit=limit
    )

@router.post("", response_model=DocumentoResponse, status_code=201)
async def crear_documento(data: DocumentoCreate, db: Session = Depends(get_db)):
    try:
        doc = await DocumentoService.create_documento(db, data)
        return doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando documento: {str(e)}")

@router.get("/{doc_id}", response_model=DocumentoDetailResponse)
def obtener_documento(doc_id: int, area_id: int = Query(...), db: Session = Depends(get_db)):
    doc = DocumentoService.obtener_documento(db, doc_id, area_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado en esta área")
    return doc

@router.get("/export/excel")
def exportar_excel(
    area_id: int = Query(...),
    search: Optional[str] = None,
    estado: Optional[str] = None,
    portador: Optional[str] = None,
    destino: Optional[str] = None,
    prioridad: Optional[str] = None,
    db: Session = Depends(get_db)
):
    docs = DocumentoService.listar_documentos(
        db=db,
        area_id=area_id,
        search=search,
        estado=estado,
        portador=portador,
        destino=destino,
        prioridad=prioridad,
        limit=5000
    )

    data = []
    for d in docs:
        data.append({
            "N° Expediente/Trámite": d.numero_expediente,
            "Tipo": d.tipo_documento,
            "Año": d.anio,
            "Iniciador / Carátula": d.iniciador_caratula,
            "Extracto": d.extracto or "",
            "Estado Actual": d.estado_actual,
            "Destino Actual": d.destino_actual,
            "Portador Actual": d.portador_actual,
            "Fojas": d.foja_actual,
            "Prioridad": d.prioridad,
            "Fecha Ingreso": d.fecha_ingreso.strftime("%d/%m/%Y"),
            "Último Movimiento": d.ultimo_movimiento_at.strftime("%d/%m/%Y %H:%M")
        })

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Mesa_de_Entradas")
    output.seek(0)

    filename = f"trazabilidad_area_{area_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
