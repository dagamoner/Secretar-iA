import { Documento, Movimiento, Area, CatalogoDestino, Usuario, FilterState } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function fetchAreas(): Promise<Area[]> {
  const res = await fetch(`${API_BASE}/areas`);
  if (!res.ok) throw new Error("Error al obtener áreas");
  return res.json();
}

export async function fetchCatalogosDestinos(areaId: number): Promise<CatalogoDestino[]> {
  const res = await fetch(`${API_BASE}/catalogos/destinos?area_id=${areaId}`);
  if (!res.ok) throw new Error("Error al obtener catálogo de destinos");
  return res.json();
}

export async function fetchMovimientosRecientes(areaId: number, limit = 100): Promise<(Movimiento & { numero_expediente?: string; iniciador_caratula?: string })[]> {
  const res = await fetch(`${API_BASE}/movimientos?area_id=${areaId}&limit=${limit}`);
  if (!res.ok) throw new Error("Error al obtener movimientos recientes");
  return res.json();
}

export async function fetchUsuarios(areaId: number): Promise<Usuario[]> {
  const res = await fetch(`${API_BASE}/catalogos/usuarios?area_id=${areaId}`);
  if (!res.ok) throw new Error("Error al obtener usuarios");
  return res.json();
}

export async function fetchDocumentos(areaId: number, filters?: Partial<FilterState>): Promise<Documento[]> {
  const params = new URLSearchParams();
  params.set("area_id", String(areaId));
  if (filters?.search) params.set("search", filters.search);
  if (filters?.estado && filters.estado !== "TODOS") params.set("estado", filters.estado);
  if (filters?.portador && filters.portador !== "TODOS") params.set("portador", filters.portador);
  if (filters?.destino && filters.destino !== "TODOS") params.set("destino", filters.destino);
  if (filters?.prioridad && filters.prioridad !== "TODOS") params.set("prioridad", filters.prioridad);

  const res = await fetch(`${API_BASE}/documentos?${params.toString()}`);
  if (!res.ok) throw new Error("Error al obtener documentos");
  return res.json();
}

export async function fetchDocumentoDetalle(docId: number, areaId: number): Promise<Documento> {
  const res = await fetch(`${API_BASE}/documentos/${docId}?area_id=${areaId}`);
  if (!res.ok) throw new Error("Error al obtener detalle del documento");
  return res.json();
}

export async function crearDocumento(data: {
  area_id: number;
  numero_expediente: string;
  tipo_documento: string;
  anio: number;
  iniciador_caratula: string;
  extracto?: string;
  estado_actual: string;
  destino_actual: string;
  portador_actual: string;
  foja_actual: number;
  prioridad: string;
  creado_por_id?: number;
  creado_por_nombre?: string;
  observacion_inicial?: string;
}): Promise<Documento> {
  const res = await fetch(`${API_BASE}/documentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error al crear documento");
  }
  return res.json();
}

export async function updateDocumento(
  docId: number,
  areaId: number,
  data: Partial<Documento> & {
    usuario_id?: number;
    usuario_nombre?: string;
    observacion_edicion?: string;
  }
): Promise<Documento> {
  const res = await fetch(`${API_BASE}/documentos/${docId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, area_id: areaId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || "Error al actualizar documento");
  }
  return res.json();
}

export async function registrarMovimiento(data: {
  area_id: number;
  documento_id: number;
  estado_nuevo: string;
  destino_nuevo: string;
  portador_nuevo: string;
  fojas_agregadas: number;
  observacion?: string;
  usuario_id?: number;
  usuario_nombre?: string;
}): Promise<Movimiento> {
  const res = await fetch(`${API_BASE}/movimientos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error al registrar movimiento");
  }
  return res.json();
}

export async function emitEditingNotice(areaId: number, docId: number, userName: string, isEditing: boolean) {
  try {
    await fetch(`${API_BASE}/events/editing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        area_id: areaId,
        doc_id: docId,
        user_name: userName,
        is_editing: isEditing,
      }),
    });
  } catch (e) {
    // Fail silently on editing heartbeat
  }
}

export function getExcelExportUrl(areaId: number, filters?: Partial<FilterState>): string {
  const params = new URLSearchParams();
  params.set("area_id", String(areaId));
  if (filters?.search) params.set("search", filters.search);
  if (filters?.estado && filters.estado !== "TODOS") params.set("estado", filters.estado);
  if (filters?.portador && filters.portador !== "TODOS") params.set("portador", filters.portador);
  if (filters?.destino && filters.destino !== "TODOS") params.set("destino", filters.destino);
  if (filters?.prioridad && filters.prioridad !== "TODOS") params.set("prioridad", filters.prioridad);
  return `${API_BASE}/documentos/export/excel?${params.toString()}`;
}

// -------------------------------------------------------------
// ADMINISTRACIÓN: ÁREAS, USUARIOS, DESTINOS Y BATCH IMPORT (ETL)
// -------------------------------------------------------------

export async function crearArea(data: { nombre: string; codigo: string; descripcion?: string }): Promise<Area> {
  const res = await fetch(`${API_BASE}/areas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error al crear área");
  }
  return res.json();
}

export async function eliminarArea(id: number): Promise<boolean> {
  const res = await fetch(`${API_BASE}/areas?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar área");
  return true;
}

export async function crearUsuario(data: { area_id: number; username: string; nombre_completo: string; rol?: string }): Promise<Usuario> {
  const res = await fetch(`${API_BASE}/catalogos/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error al crear usuario");
  }
  return res.json();
}

export async function eliminarUsuario(id: number): Promise<boolean> {
  const res = await fetch(`${API_BASE}/catalogos/usuarios?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar usuario");
  return true;
}

export async function crearDestino(data: { area_id: number; nombre: string; responsable_defecto?: string }): Promise<CatalogoDestino> {
  const res = await fetch(`${API_BASE}/catalogos/destinos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error al crear destino");
  }
  return res.json();
}

export async function eliminarDestino(id: number): Promise<boolean> {
  const res = await fetch(`${API_BASE}/catalogos/destinos?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar destino");
  return true;
}

export async function importarExcelBatch(areaId: number, items: any[], userName: string): Promise<{ importados: number; actualizados: number; errores: number }> {
  const res = await fetch(`${API_BASE}/importar-excel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ area_id: areaId, items, user_name: userName }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error al importar lote Excel");
  }
  return res.json();
}

export async function limpiarDatosDemo(areaId?: number): Promise<boolean> {
  const url = areaId ? `${API_BASE}/limpiar-demo?area_id=${areaId}` : `${API_BASE}/limpiar-demo`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || "Error al limpiar datos");
  }
  return true;
}

// -------------------------------------------------------------
// AUTENTICACIÓN
// -------------------------------------------------------------

export async function loginUser(username: string, password: string): Promise<Usuario> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Usuario o contraseña incorrectos");
  }
  const data = await res.json();
  return data.user;
}

export async function cambiarPassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, old_password: oldPassword, new_password: newPassword }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al cambiar contraseña");
  }
  return true;
}
