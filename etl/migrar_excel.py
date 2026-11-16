import os
import sys
import argparse
from datetime import datetime
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path to reuse models
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.database import Base
from app.models.area import Area
from app.models.documento import Documento
from app.models.movimiento import Movimiento

def normalizar_columna(col: str) -> str:
    return col.strip().lower().replace(" ", "_").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u").replace("ñ", "n")

def parsear_fecha(valor) -> datetime:
    if pd.isna(valor) or not valor:
        return datetime.utcnow()
    if isinstance(valor, datetime):
        return valor
    valor_str = str(valor).strip()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d/%m/%Y %H:%M", "%Y-%m-%d %H:%M:%S", "%d-%m-%Y"):
        try:
            return datetime.strptime(valor_str, fmt)
        except ValueError:
            pass
    return datetime.utcnow()

def ejecutar_migracion(excel_path: str, area_id: int, db_url: str, user_name: str = "ETL Migrador Excel"):
    print("=" * 60)
    print(f"Iniciando ETL de migración histórica desde: {excel_path}")
    print(f"Destino Area ID: {area_id}")
    print(f"Auditoría: Usuario '{user_name}'")
    print("=" * 60)

    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"No se encontró el archivo: {excel_path}")

    df = pd.read_excel(excel_path, engine="openpyxl")
    print(f"Filas encontradas en Excel: {len(df)}")

    # Column map
    cols_map = {normalizar_columna(c): c for c in df.columns}
    
    # Required core mappings
    col_nro = cols_map.get("nro_expediente") or cols_map.get("expediente") or cols_map.get("numero") or cols_map.get("numero_expediente")
    col_caratula = cols_map.get("iniciador_caratula") or cols_map.get("caratula") or cols_map.get("iniciador") or cols_map.get("asunto")
    
    if not col_nro or not col_caratula:
        raise ValueError(f"El Excel debe contener al menos columnas para Número de Expediente y Carátula. Columnas detectadas: {list(df.columns)}")

    engine = create_engine(db_url)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    # Validate Area exists
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        # Fallback to create default area if DB is brand new
        print(f"Aviso: El Área ID {area_id} no existía. Se creará automáticamente para el ETL.")
        area = Area(
            id=area_id,
            nombre=f"Área Migrada {area_id}",
            codigo=f"AREA-{area_id}",
            descripcion="Área creada automáticamente por migrador histórico ETL."
        )
        db.add(area)
        db.commit()

    total_creados = 0
    total_actualizados = 0
    total_errores = 0

    for idx, row in df.iterrows():
        nro_exp = str(row[col_nro]).strip()
        caratula = str(row[col_caratula]).strip()
        if not nro_exp or pd.isna(row[col_nro]):
            continue

        tipo = str(row.get(cols_map.get("tipo", ""), "EXPEDIENTE")).strip().upper()
        if tipo not in ["EXPEDIENTE", "NOTA", "RESOLUCION", "DISPOSICION", "MEMORANDUM"]:
            tipo = "EXPEDIENTE"

        anio_val = row.get(cols_map.get("ano", cols_map.get("anio", "")), datetime.utcnow().year)
        try:
            anio = int(anio_val) if not pd.isna(anio_val) else datetime.utcnow().year
        except (ValueError, TypeError):
            anio = datetime.utcnow().year

        extracto = str(row.get(cols_map.get("extracto", ""), "")).strip() if cols_map.get("extracto") and not pd.isna(row[cols_map.get("extracto")]) else None
        estado = str(row.get(cols_map.get("estado", ""), "INICIADO")).strip().upper()
        destino = str(row.get(cols_map.get("destino", ""), "Mesa de Entradas")).strip()
        portador = str(row.get(cols_map.get("portador", ""), "Mesa de Entradas")).strip()
        
        fojas_val = row.get(cols_map.get("fojas", ""), 1)
        try:
            fojas = int(fojas_val) if not pd.isna(fojas_val) else 1
        except (ValueError, TypeError):
            fojas = 1

        prioridad = str(row.get(cols_map.get("prioridad", ""), "NORMAL")).strip().upper()
        if prioridad not in ["NORMAL", "URGENTE", "PRONTO DESPACHO"]:
            prioridad = "NORMAL"

        fecha_ingreso = parsear_fecha(row.get(cols_map.get("fecha_ingreso", "")))
        observaciones = str(row.get(cols_map.get("observaciones", ""), "Migración histórica desde planilla Excel")).strip()

        try:
            # Check existing document in this area
            doc = db.query(Documento).filter(
                Documento.area_id == area_id,
                Documento.numero_expediente == nro_exp
            ).first()

            if not doc:
                # Create brand new document
                doc = Documento(
                    area_id=area_id,
                    numero_expediente=nro_exp,
                    tipo_documento=tipo,
                    anio=anio,
                    iniciador_caratula=caratula,
                    extracto=extracto,
                    estado_actual=estado,
                    destino_actual=destino,
                    portador_actual=portador,
                    foja_actual=fojas,
                    prioridad=prioridad,
                    fecha_ingreso=fecha_ingreso,
                    ultimo_movimiento_at=fecha_ingreso
                )
                db.add(doc)
                db.flush()

                # Add initial movement for audit trail
                mov = Movimiento(
                    documento_id=doc.id,
                    area_id=area_id,
                    usuario_nombre=user_name,
                    estado_anterior=None,
                    estado_nuevo=estado,
                    destino_anterior=None,
                    destino_nuevo=destino,
                    portador_anterior=None,
                    portador_nuevo=portador,
                    fojas_agregadas=fojas,
                    observacion=observaciones or "Ingreso por migración de planilla Excel",
                    fecha_hora=fecha_ingreso
                )
                db.add(mov)
                total_creados += 1
            else:
                # If document exists and has a new destination or state, record movement (never overwrite history!)
                if doc.estado_actual != estado or doc.destino_actual != destino or doc.portador_actual != portador:
                    mov = Movimiento(
                        documento_id=doc.id,
                        area_id=area_id,
                        usuario_nombre=user_name,
                        estado_anterior=doc.estado_actual,
                        estado_nuevo=estado,
                        destino_anterior=doc.destino_actual,
                        destino_nuevo=destino,
                        portador_anterior=doc.portador_actual,
                        portador_nuevo=portador,
                        fojas_agregadas=max(0, fojas - doc.foja_actual),
                        observacion=f"Actualización ETL: {observaciones}",
                        fecha_hora=datetime.utcnow()
                    )
                    db.add(mov)
                    doc.estado_actual = estado
                    doc.destino_actual = destino
                    doc.portador_actual = portador
                    doc.foja_actual = fojas
                    doc.ultimo_movimiento_at = datetime.utcnow()
                    total_actualizados += 1

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error procesando fila {idx + 1} ({nro_exp}): {e}")
            total_errores += 1

    db.close()
    print("-" * 60)
    print("RESUMEN DE MIGRACIÓN ETL:")
    print(f"✔ Documentos nuevos migrados con pase inicial: {total_creados}")
    print(f"✔ Documentos existentes actualizados con nuevo pase: {total_actualizados}")
    print(f"✖ Errores encontrados: {total_errores}")
    print("=" * 60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ETL de migración de planillas Excel históricas a Secretar-iA")
    parser.add_argument("--file", default="etl/planilla_ejemplo_mesa_entradas.xlsx", help="Ruta al archivo .xlsx o .xls")
    parser.add_argument("--area-id", type=int, default=1, help="ID del área multi-tenant destino")
    parser.add_argument("--db-url", default=os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/secretaria_db"), help="Cadena de conexión SQLAlchemy")
    parser.add_argument("--user-name", default="ETL Migrador Excel", help="Nombre del usuario de auditoría")
    args = parser.parse_args()

    ejecutar_migracion(
        excel_path=args.file,
        area_id=args.area_id,
        db_url=args.db_url,
        user_name=args.user_name
    )
