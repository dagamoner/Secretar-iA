import os
import sys
from datetime import datetime, timedelta

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.models.area import Area
from app.models.user import Usuario
from app.models.catalogo_destino import CatalogoDestino
from app.models.documento import Documento
from app.models.movimiento import Movimiento

def seed_database():
    print("Creando tablas si no existen...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(Area).count() > 0:
            print("La base de datos ya contiene registros. Omitiendo seed inicial.")
            return

        print("Poblando Áreas iniciales...")
        area_mesa = Area(
            nombre="Mesa de Entradas General",
            codigo="MEG",
            descripcion="Recepción, caratulación y derivación general de trámites, expedientes y notas."
        )
        area_despacho = Area(
            nombre="Despacho de Presidencia",
            codigo="DESP-PRES",
            descripcion="Control, rúbrica, resoluciones y decretos de la Presidencia."
        )
        area_legales = Area(
            nombre="Dirección General de Asuntos Jurídicos",
            codigo="DGAJ",
            descripcion="Dictámenes legales, sumarios y asesoría jurídica."
        )
        db.add_all([area_mesa, area_despacho, area_legales])
        db.flush()

        print("Poblando Usuarios de prueba con roles...")
        u1 = Usuario(
            area_id=area_mesa.id,
            username="marianalopez",
            nombre_completo="Mariana López (Mesa Central)",
            rol="OPERADOR"
        )
        u2 = Usuario(
            area_id=area_mesa.id,
            username="carlos.admin",
            nombre_completo="Lic. Carlos Menéndez",
            rol="ADMIN"
        )
        u3 = Usuario(
            area_id=area_despacho.id,
            username="roberto.despacho",
            nombre_completo="Roberto Silva (Despacho)",
            rol="SUPERVISOR"
        )
        u4 = Usuario(
            area_id=area_legales.id,
            username="andres.abogado",
            nombre_completo="Dr. Andrés Suárez",
            rol="OPERADOR"
        )
        db.add_all([u1, u2, u3, u4])
        db.flush()

        print("Poblando Catálogo de Destinos frecuentes...")
        destinos = [
            CatalogoDestino(area_id=area_mesa.id, nombre="Despacho de Presidencia", responsable_defecto="Roberto Silva"),
            CatalogoDestino(area_id=area_mesa.id, nombre="Asuntos Jurídicos", responsable_defecto="Dr. Andrés Suárez"),
            CatalogoDestino(area_id=area_mesa.id, nombre="Secretaría de Hacienda", responsable_defecto="Cra. Patricia Varela"),
            CatalogoDestino(area_id=area_mesa.id, nombre="Dirección de Compras y Contrataciones", responsable_defecto="Ing. Gonzalo Romero"),
            CatalogoDestino(area_id=area_mesa.id, nombre="Archivo Central", responsable_defecto="Mesa de Entradas"),
            CatalogoDestino(area_id=area_despacho.id, nombre="Firma de Ministro/Presidente", responsable_defecto="Secretaría Privada"),
            CatalogoDestino(area_id=area_despacho.id, nombre="Mesa de Entradas General", responsable_defecto="Mariana López"),
        ]
        db.add_all(destinos)
        db.flush()

        print("Poblando Documentos y trazabilidad histórica inmutable...")
        now = datetime.utcnow()

        # Documento 1
        d1 = Documento(
            area_id=area_mesa.id,
            numero_expediente="EXP-2026-00104-MEG",
            tipo_documento="EXPEDIENTE",
            anio=2026,
            iniciador_caratula="Dirección de RRHH - S/ Adquisición de Licencias de Software y Cómputo",
            extracto="Solicitud de presupuesto y compra directa para 45 puestos de trabajo administrativos.",
            estado_actual="DESPACHO",
            destino_actual="Despacho de Presidencia",
            portador_actual="Roberto Silva",
            foja_actual=34,
            prioridad="URGENTE",
            creado_por_id=u1.id,
            fecha_ingreso=now - timedelta(days=2, hours=4),
            ultimo_movimiento_at=now - timedelta(hours=1, minutes=15)
        )
        db.add(d1)
        db.flush()

        m1_1 = Movimiento(
            documento_id=d1.id,
            area_id=area_mesa.id,
            usuario_id=u1.id,
            usuario_nombre="Mariana López (Mesa Central)",
            estado_anterior=None,
            estado_nuevo="INICIADO",
            destino_anterior=None,
            destino_nuevo="Mesa de Entradas",
            portador_anterior=None,
            portador_nuevo="Mariana López",
            fojas_agregadas=12,
            observacion="Ingreso por ventanilla mesa central, caratulación y foliatura inicial.",
            fecha_hora=now - timedelta(days=2, hours=4)
        )
        m1_2 = Movimiento(
            documento_id=d1.id,
            area_id=area_mesa.id,
            usuario_id=u2.id,
            usuario_nombre="Lic. Carlos Menéndez",
            estado_anterior="INICIADO",
            estado_nuevo="EN MANO",
            destino_anterior="Mesa de Entradas",
            destino_nuevo="Asuntos Jurídicos",
            portador_anterior="Mariana López",
            portador_nuevo="Dr. Andrés Suárez",
            fojas_agregadas=10,
            observacion="Se adjunta pliego de especificaciones y dictamen de necesidad técnica.",
            fecha_hora=now - timedelta(days=1, hours=3)
        )
        m1_3 = Movimiento(
            documento_id=d1.id,
            area_id=area_mesa.id,
            usuario_id=u1.id,
            usuario_nombre="Mariana López (Mesa Central)",
            estado_anterior="EN MANO",
            estado_nuevo="DESPACHO",
            destino_anterior="Asuntos Jurídicos",
            destino_nuevo="Despacho de Presidencia",
            portador_anterior="Dr. Andrés Suárez",
            portador_nuevo="Roberto Silva",
            fojas_agregadas=12,
            observacion="Pase a Despacho para resolución de autorización de gasto.",
            fecha_hora=now - timedelta(hours=1, minutes=15)
        )
        db.add_all([m1_1, m1_2, m1_3])

        # Documento 2
        d2 = Documento(
            area_id=area_mesa.id,
            numero_expediente="NOTA-2026-0042-MEG",
            tipo_documento="NOTA",
            anio=2026,
            iniciador_caratula="Secretaría de Obras Públicas - S/ Mantenimiento de Servidores y Climatización",
            extracto="Informe de temperatura y necesidad de reemplazo de UPS en sala de rack.",
            estado_actual="FIRMADO",
            destino_actual="Archivo Central",
            portador_actual="Mesa de Entradas",
            foja_actual=6,
            prioridad="NORMAL",
            creado_por_id=u1.id,
            fecha_ingreso=now - timedelta(days=5),
            ultimo_movimiento_at=now - timedelta(hours=3, minutes=40)
        )
        db.add(d2)
        db.flush()

        m2_1 = Movimiento(
            documento_id=d2.id,
            area_id=area_mesa.id,
            usuario_id=u1.id,
            usuario_nombre="Mariana López (Mesa Central)",
            estado_anterior=None,
            estado_nuevo="INICIADO",
            destino_anterior=None,
            destino_nuevo="Mesa de Entradas",
            portador_anterior=None,
            portador_nuevo="Mesa de Entradas",
            fojas_agregadas=6,
            observacion="Recepción de nota rubricada.",
            fecha_hora=now - timedelta(days=5)
        )
        m2_2 = Movimiento(
            documento_id=d2.id,
            area_id=area_mesa.id,
            usuario_id=u2.id,
            usuario_nombre="Lic. Carlos Menéndez",
            estado_anterior="INICIADO",
            estado_nuevo="FIRMADO",
            destino_anterior="Mesa de Entradas",
            destino_nuevo="Archivo Central",
            portador_anterior="Mesa de Entradas",
            portador_nuevo="Mesa de Entradas",
            fojas_agregadas=0,
            observacion="Trámite concluido con firma digital ministerial. Con pase a archivo.",
            fecha_hora=now - timedelta(hours=3, minutes=40)
        )
        db.add_all([m2_1, m2_2])

        # Documento 3
        d3 = Documento(
            area_id=area_mesa.id,
            numero_expediente="RES-2026-0089-MEG",
            tipo_documento="RESOLUCION",
            anio=2026,
            iniciador_caratula="Presidencia - Designación de Personal Técnico de Guardia Operativa",
            extracto="Resolución que designa personal técnico rotativo para guardia 24/7.",
            estado_actual="EN MANO",
            destino_actual="Secretaría de Hacienda",
            portador_actual="Cra. Patricia Varela",
            foja_actual=18,
            prioridad="PRONTO DESPACHO",
            creado_por_id=u2.id,
            fecha_ingreso=now - timedelta(days=1),
            ultimo_movimiento_at=now - timedelta(minutes=25)
        )
        db.add(d3)
        db.flush()

        m3_1 = Movimiento(
            documento_id=d3.id,
            area_id=area_mesa.id,
            usuario_id=u2.id,
            usuario_nombre="Lic. Carlos Menéndez",
            estado_anterior=None,
            estado_nuevo="EN MANO",
            destino_anterior=None,
            destino_nuevo="Secretaría de Hacienda",
            portador_anterior=None,
            portador_nuevo="Cra. Patricia Varela",
            fojas_agregadas=18,
            observacion="Proyecto de resolución con impacto presupuestario para liquidación.",
            fecha_hora=now - timedelta(minutes=25)
        )
        db.add(m3_1)

        db.commit()
        print("¡Seed inicial completado con éxito! Se cargaron áreas, usuarios, destinos y expedientes con historial.")

    except Exception as e:
        db.rollback()
        print(f"Error durante el seed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
