# Secretar-iA - Sistema de Trazabilidad Documental Multi-Área (On-Premise)

> Sistema web de alta velocidad diseñado para reemplazar planillas Excel de mesa de entradas y despachos en organizaciones públicas y corporativas, desplegado 100% On-Premise con Docker en infraestructura propia.

---

## 🎯 Características Principales

1. **Arquitectura Multi-Área (Multi-Tenant):**
   - Aislamiento lógico por `area_id` en todas las tablas principales (`documentos`, `catalogos_destinos`, `usuarios`, `movimientos`).
   - Selector dinámico de área en la barra superior con canales independientes en tiempo real.

2. **Inmutabilidad Absoluta del Historial de Movimientos:**
   - Cada cambio de destino, pase o estado (`DESPACHO`, `EN MANO`, `FIRMADO`, `ARCHIVO`, `NOTIFICADO`) genera un nuevo registro no modificable en la tabla `movimientos`.
   - La tabla `documentos` mantiene el estado cacheado para consultas instantáneas en la grilla sin perder nunca el historial de origen.

3. **Auditoría Visible en Cada Pase:**
   - Visualización explícita del operador actuante y la hora exacta en formato `HH:mm` (más fecha completa y fojas acumuladas).

4. **Sincronización en Tiempo Real (WebSockets):**
   - `ConnectionManager` en FastAPI conectado a canales `/ws/{area_id}`.
   - Emisión de eventos: `DOC_CREATED`, `DOC_UPDATED`, `MOVIMIENTO_ADDED`, `USER_EDITING`.
   - Hook `useRealtimeArea(areaId)` en Next.js con invalidación automática de caché TanStack Query y **resaltado visual por 3 segundos** de la fila modificada por otros usuarios concurrentes.

5. **UX de Alta Densidad (Tipo Excel) y Atajos de Teclado:**
   - Grilla con TanStack Table optimizada para cientos de filas por pantalla.
   - Búsqueda instantánea con debounce cero y filtros combinados.
   - Drawer lateral ultrarrápido para asentar pases sin recargar la página.
   - Atajos de teclado completos (`/`, `N`, `P`, `Enter`, `↓/J`, `↑/K`, `Esc`, `?`).

6. **ETL Histórico Automatizado:**
   - Script Python (`pandas` + `openpyxl`) para importar planillas Excel preexistentes manteniendo correlación de fojas, carátulas y primer pase auditado.

---

## 🏗️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Base de Datos** | PostgreSQL 16 (Índices compuestos por `area_id`, `numero_expediente`, `estado_actual`) |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic, WebSockets |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Table v8, TanStack Query v5, Lucide Icons |
| **ETL / Reportes** | Pandas, Openpyxl |
| **Contenedores** | Docker & Docker Compose (Imágenes slim y multi-stage optimizadas) |

---

## 🚀 Despliegue Rápido On-Premise con Docker

En el servidor institucional interno:

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd Secretar-iA

# 2. Configurar variables de entorno (opcional o personalizar credenciales)
cp .env.example .env

# 3. Levantar la solución completa con Docker Compose
docker compose up -d --build
```

Los servicios quedarán disponibles en:
- **Frontend Web:** `http://<IP-SERVIDOR>:3000`
- **Backend API & Swagger:** `http://<IP-SERVIDOR>:8000/docs`
- **PostgreSQL 16:** `puerto 5432`

---

## ⌨️ Atajos de Teclado (Modo Alta Velocidad)

| Tecla | Acción |
|---|---|
| `/` o `Ctrl + K` | Enfocar la barra de búsqueda instantánea |
| `N` o `Alt + N` | Abrir modal de caratulación de nuevo trámite |
| `P` o `Enter` | Abrir drawer lateral de pase para el trámite seleccionado |
| `↓` o `J` | Seleccionar la fila siguiente en la grilla |
| `↑` o `K` | Seleccionar la fila anterior en la grilla |
| `Esc` | Cerrar drawer/modal o cancelar foco |
| `?` | Abrir panel de ayuda de atajos |

---

## 📊 Migración Inicial desde Excel (ETL)

Para migrar la planilla histórica existente de mesa de entradas hacia una determinada área:

```bash
# Generar planilla modelo de prueba
python etl/generar_planilla_ejemplo.py

# Ejecutar migración hacia el Área 1 (Mesa de Entradas General)
python etl/migrar_excel.py --file etl/planilla_ejemplo_mesa_entradas.xlsx --area-id 1 --user-name "ETL Migrador Excel"
```

El script valida duplicados, inicializa los expedientes con fojas y genera el primer registro en `movimientos` para garantizar auditoría desde el día uno.

---

## 📁 Estructura del Proyecto

```
Secretar-iA/
├── backend/
│   ├── app/
│   │   ├── core/         # Configuración, Base de Datos y ConnectionManager WebSockets
│   │   ├── models/       # Modelos SQLAlchemy (Area, Documento, Movimiento, Usuario, CatalogoDestino)
│   │   ├── schemas/      # Esquemas Pydantic y eventos en tiempo real
│   │   ├── routers/      # Endpoints REST y canal WebSocket /ws/{area_id}
│   │   └── services/     # Lógica transaccional de documentos y pases
│   ├── alembic/          # Migraciones de base de datos
│   ├── seed_data.py      # Datos iniciales para pruebas
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/          # App Router de Next.js, Layout y Providers (TanStack Query)
│   │   ├── components/   # Grilla densa, Drawer de pases, Modal de nuevo trámite, Toolbar
│   │   ├── hooks/        # useRealtimeArea (WebSockets) y useKeyboardShortcuts
│   │   ├── lib/          # Cliente API y utilidades
│   │   └── types/        # Definiciones TypeScript
│   ├── package.json
│   ├── tailwind.config.ts
│   └── Dockerfile
├── etl/
│   ├── migrar_excel.py              # Script ETL de importación de planillas
│   └── generar_planilla_ejemplo.py  # Generador de Excel modelo
├── docker-compose.yml
├── .env.example
└── README.md
```
