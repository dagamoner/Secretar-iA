import os
import pandas as pd
from datetime import datetime, timedelta

def generar_excel_ejemplo():
    now = datetime.now()
    datos = [
        {
            "Nro_Expediente": "EXP-2025-08910-MEG",
            "Tipo": "EXPEDIENTE",
            "Año": 2025,
            "Iniciador_Caratula": "Dirección de Infraestructura - Licitación Pública Edificio Anexo",
            "Extracto": "Licitación de obras de impermeabilización y refacción integral.",
            "Estado": "DESPACHO",
            "Destino": "Despacho de Presidencia",
            "Portador": "Roberto Silva",
            "Fojas": 142,
            "Prioridad": "URGENTE",
            "Fecha_Ingreso": (now - timedelta(days=60)).strftime("%d/%m/%Y"),
            "Observaciones": "Migrado de planilla histórica de mesa general - Folios verificados."
        },
        {
            "Nro_Expediente": "NOTA-2026-0012-MEG",
            "Tipo": "NOTA",
            "Año": 2026,
            "Iniciador_Caratula": "Universidad Tecnológica Nacional - Solicitud de Convenio de Prácticas",
            "Extracto": "Propuesta de pasantías y formación técnica para estudiantes de grado.",
            "Estado": "EN MANO",
            "Destino": "Asuntos Jurídicos",
            "Portador": "Dr. Andrés Suárez",
            "Fojas": 8,
            "Prioridad": "NORMAL",
            "Fecha_Ingreso": (now - timedelta(days=20)).strftime("%d/%m/%Y"),
            "Observaciones": "Dictamen legal preliminar solicitado."
        },
        {
            "Nro_Expediente": "RES-2025-0312-MEG",
            "Tipo": "RESOLUCION",
            "Año": 2025,
            "Iniciador_Caratula": "Secretaría de Hacienda - Modificación Presupuestaria Ejercicio",
            "Extracto": "Reasignación de partidas presupuestarias por compensación de créditos.",
            "Estado": "FIRMADO",
            "Destino": "Archivo Central",
            "Portador": "Mesa de Entradas",
            "Fojas": 24,
            "Prioridad": "NORMAL",
            "Fecha_Ingreso": (now - timedelta(days=45)).strftime("%d/%m/%Y"),
            "Observaciones": "Registrada bajo R.P. 312/25 con copia protocolizada."
        },
        {
            "Nro_Expediente": "EXP-2026-00055-MEG",
            "Tipo": "EXPEDIENTE",
            "Año": 2026,
            "Iniciador_Caratula": "Subsecretaría de Informática - Adquisición de Enlaces de Fibra Óptica",
            "Extracto": "Servicio de conectividad redundante para el centro de cómputos.",
            "Estado": "EN MANO",
            "Destino": "Secretaría de Hacienda",
            "Portador": "Cra. Patricia Varela",
            "Fojas": 19,
            "Prioridad": "PRONTO DESPACHO",
            "Fecha_Ingreso": (now - timedelta(days=12)).strftime("%d/%m/%Y"),
            "Observaciones": "Requiere certificación presupuestaria preventiva."
        },
        {
            "Nro_Expediente": "NOTA-2026-0089-MEG",
            "Tipo": "NOTA",
            "Año": 2026,
            "Iniciador_Caratula": "Defensoría del Pueblo - Pedido de Informes Actuación 102/26",
            "Extracto": "Solicitud de estado de trámite de reclamo de ciudadano Martínez.",
            "Estado": "DESPACHO",
            "Destino": "Despacho de Presidencia",
            "Portador": "Roberto Silva",
            "Fojas": 5,
            "Prioridad": "URGENTE",
            "Fecha_Ingreso": (now - timedelta(days=4)).strftime("%d/%m/%Y"),
            "Observaciones": "Plazo de respuesta vence en 5 días hábiles."
        }
    ]

    df = pd.DataFrame(datos)
    salida = os.path.join(os.path.dirname(os.path.abspath(__file__)), "planilla_ejemplo_mesa_entradas.xlsx")
    df.to_excel(salida, index=False, engine="openpyxl")
    print(f"Archivo de ejemplo generado en: {salida}")

if __name__ == "__main__":
    generar_excel_ejemplo()
