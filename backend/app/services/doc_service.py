from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.models.documento import Documento
from app.models.movimiento import Movimiento
from app.schemas.documento import DocumentoCreate
from app.schemas.movimiento import MovimientoCreate
from app.core.websockets import manager

class DocumentoService:
    @staticmethod
    async def create_documento(db: Session, data: DocumentoCreate) -> Documento:
        # Create Document record
        doc = Documento(
            area_id=data.area_id,
            numero_expediente=data.numero_expediente.strip(),
            tipo_documento=data.tipo_documento,
            anio=data.anio,
            iniciador_caratula=data.iniciador_caratula.strip(),
            extracto=data.extracto.strip() if data.extracto else None,
            estado_actual=data.estado_actual,
            destino_actual=data.destino_actual,
            portador_actual=data.portador_actual,
            foja_actual=data.foja_actual,
            prioridad=data.prioridad,
            creado_por_id=data.creado_por_id,
            fecha_ingreso=datetime.utcnow(),
            ultimo_movimiento_at=datetime.utcnow()
        )
        db.add(doc)
        db.flush() # get doc.id

        # Register initial immutable movement
        creador_nombre = data.creado_por_nombre or "Mesa de Entradas"
        initial_mov = Movimiento(
            documento_id=doc.id,
            area_id=data.area_id,
            usuario_id=data.creado_por_id,
            usuario_nombre=creador_nombre,
            estado_anterior=None,
            estado_nuevo=data.estado_actual,
            destino_anterior=None,
            destino_nuevo=data.destino_actual,
            portador_anterior=None,
            portador_nuevo=data.portador_actual,
            fojas_agregadas=data.foja_actual,
            observacion=data.observacion_inicial or "Caratulación e ingreso al sistema",
            fecha_hora=datetime.utcnow()
        )
        db.add(initial_mov)
        db.commit()
        db.refresh(doc)

        # Real-time WebSocket event
        event_payload = {
            "event": "DOC_CREATED",
            "area_id": doc.area_id,
            "doc_id": doc.id,
            "user_name": creador_nombre,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "payload": {
                "id": doc.id,
                "numero_expediente": doc.numero_expediente,
                "iniciador_caratula": doc.iniciador_caratula,
                "estado_actual": doc.estado_actual,
                "destino_actual": doc.destino_actual,
                "portador_actual": doc.portador_actual,
                "ultimo_movimiento_hora_corta": doc.ultimo_movimiento_at.strftime("%H:%M")
            }
        }
        await manager.broadcast_to_area(doc.area_id, event_payload)

        return doc

    @staticmethod
    async def registrar_movimiento(db: Session, data: MovimientoCreate) -> Movimiento:
        doc = db.query(Documento).filter(
            Documento.id == data.documento_id,
            Documento.area_id == data.area_id
        ).first()

        if not doc:
            raise ValueError(f"Documento id={data.documento_id} no encontrado en el área {data.area_id}")

        now = datetime.utcnow()
        user_name = data.usuario_nombre or "Operador Despacho"

        # Record new immutable movement
        mov = Movimiento(
            documento_id=doc.id,
            area_id=data.area_id,
            usuario_id=data.usuario_id,
            usuario_nombre=user_name,
            estado_anterior=doc.estado_actual,
            estado_nuevo=data.estado_nuevo,
            destino_anterior=doc.destino_actual,
            destino_nuevo=data.destino_nuevo,
            portador_anterior=doc.portador_actual,
            portador_nuevo=data.portador_nuevo,
            fojas_agregadas=data.fojas_agregadas,
            observacion=data.observacion,
            fecha_hora=now
        )
        db.add(mov)

        # Update cached state in Documento
        doc.estado_actual = data.estado_nuevo
        doc.destino_actual = data.destino_nuevo
        doc.portador_actual = data.portador_nuevo
        if data.fojas_agregadas > 0:
            doc.foja_actual += data.fojas_agregadas
        doc.ultimo_movimiento_at = now
        doc.updated_at = now

        db.commit()
        db.refresh(mov)
        db.refresh(doc)

        # Real-time WebSocket event
        event_payload = {
            "event": "MOVIMIENTO_ADDED",
            "area_id": doc.area_id,
            "doc_id": doc.id,
            "user_name": user_name,
            "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
            "payload": {
                "movimiento_id": mov.id,
                "documento_id": doc.id,
                "numero_expediente": doc.numero_expediente,
                "estado_nuevo": mov.estado_nuevo,
                "destino_nuevo": mov.destino_nuevo,
                "portador_nuevo": mov.portador_nuevo,
                "usuario_nombre": user_name,
                "hora_corta": now.strftime("%H:%M")
            }
        }
        await manager.broadcast_to_area(doc.area_id, event_payload)

        return mov

    @staticmethod
    def listar_documentos(
        db: Session,
        area_id: int,
        search: Optional[str] = None,
        estado: Optional[str] = None,
        portador: Optional[str] = None,
        destino: Optional[str] = None,
        prioridad: Optional[str] = None,
        skip: int = 0,
        limit: int = 500
    ) -> List[Documento]:
        query = db.query(Documento).filter(Documento.area_id == area_id)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Documento.numero_expediente.ilike(search_term),
                    Documento.iniciador_caratula.ilike(search_term),
                    Documento.extracto.ilike(search_term)
                )
            )

        if estado and estado != "TODOS":
            query = query.filter(Documento.estado_actual == estado)

        if portador and portador != "TODOS":
            query = query.filter(Documento.portador_actual.ilike(f"%{portador}%"))

        if destino and destino != "TODOS":
            query = query.filter(Documento.destino_actual.ilike(f"%{destino}%"))

        if prioridad and prioridad != "TODOS":
            query = query.filter(Documento.prioridad == prioridad)

        return query.order_by(desc(Documento.ultimo_movimiento_at)).offset(skip).limit(limit).all()

    @staticmethod
    def obtener_documento(db: Session, doc_id: int, area_id: int) -> Optional[Documento]:
        return db.query(Documento).filter(
            Documento.id == doc_id,
            Documento.area_id == area_id
        ).first()

    @staticmethod
    def obtener_historial_movimientos(db: Session, doc_id: int, area_id: int) -> List[Movimiento]:
        return db.query(Movimiento).filter(
            Movimiento.documento_id == doc_id,
            Movimiento.area_id == area_id
        ).order_by(desc(Movimiento.fecha_hora)).all()
