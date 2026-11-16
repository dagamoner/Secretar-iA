from fastapi import APIRouter
from app.routers.areas import router as areas_router
from app.routers.catalogos import router as catalogos_router
from app.routers.documentos import router as documentos_router
from app.routers.movimientos import router as movimientos_router

api_router = APIRouter()
api_router.include_router(areas_router)
api_router.include_router(catalogos_router)
api_router.include_router(documentos_router)
api_router.include_router(movimientos_router)
