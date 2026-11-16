export interface Area {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
}

export interface Usuario {
  id: number;
  area_id: number;
  area_nombre?: string;
  username: string;
  nombre_completo: string;
  rol: string;
  activo: boolean;
  password_hash?: string;
}

export interface CatalogoDestino {
  id: number;
  area_id: number;
  nombre: string;
  responsable_defecto?: string;
  activo: boolean;
}

export interface Movimiento {
  id: number;
  documento_id: number;
  area_id: number;
  usuario_id?: number;
  usuario_nombre: string;
  estado_anterior?: string;
  estado_nuevo: string;
  destino_anterior?: string;
  destino_nuevo: string;
  portador_anterior?: string;
  portador_nuevo: string;
  fojas_agregadas: number;
  observacion?: string;
  fecha_hora: string;
  hora_corta: string;
  fecha_formateada: string;
}

export interface Documento {
  id: number;
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
  fecha_ingreso: string;
  ultimo_movimiento_at?: string | null;
  ultimo_movimiento_hora_corta?: string | null;
  ultimo_movimiento_formateado?: string | null;
  creado_por_id?: number;
  created_at: string;
  updated_at: string;
  movimientos?: Movimiento[];
}

export interface WSEvent {
  event: "DOC_CREATED" | "DOC_UPDATED" | "MOVIMIENTO_ADDED" | "USER_EDITING";
  area_id: number;
  doc_id?: number;
  user_name?: string;
  timestamp: string;
  payload?: any;
}

export interface FilterState {
  search: string;
  estado: string;
  portador: string;
  destino: string;
  prioridad: string;
  fechaTipo?: "ENTRADA" | "SALIDA" | "AMBAS";
  fechaDesde?: string;
  fechaHasta?: string;
}
