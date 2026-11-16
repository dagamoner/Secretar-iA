import { sql } from "@vercel/postgres";
import { neon } from "@neondatabase/serverless";
import { Area, Usuario, CatalogoDestino, Documento, Movimiento, FilterState } from "@/types";

// Detect connection string
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

export function getDbClient() {
  if (connectionString) {
    return neon(connectionString);
  }
  return null;
}

// In-Memory store for preview/demo when no database is connected yet
let memoryAreas: Area[] = [
  { id: 1, nombre: "Mesa de Entradas General", codigo: "MEG", descripcion: "Recepción general y derivación de expedientes", activo: true, created_at: new Date().toISOString() },
  { id: 2, nombre: "Despacho de Presidencia", codigo: "DESP-PRES", descripcion: "Rúbrica y control de despachos", activo: true, created_at: new Date().toISOString() },
  { id: 3, nombre: "Asuntos Jurídicos", codigo: "DGAJ", descripcion: "Dictámenes y asesoría legal", activo: true, created_at: new Date().toISOString() },
];

let memoryUsers: Usuario[] = [
  { id: 1, area_id: 1, username: "marianalopez", nombre_completo: "Mariana López (Mesa Central)", rol: "OPERADOR", activo: true },
  { id: 2, area_id: 1, username: "carlos.admin", nombre_completo: "Lic. Carlos Menéndez", rol: "ADMIN", activo: true },
  { id: 3, area_id: 2, username: "roberto.despacho", nombre_completo: "Roberto Silva (Despacho)", rol: "SUPERVISOR", activo: true },
  { id: 4, area_id: 3, username: "andres.abogado", nombre_completo: "Dr. Andrés Suárez", rol: "OPERADOR", activo: true },
];

let memoryDestinos: CatalogoDestino[] = [
  { id: 1, area_id: 1, nombre: "Despacho de Presidencia", responsable_defecto: "Roberto Silva", activo: true },
  { id: 2, area_id: 1, nombre: "Asuntos Jurídicos", responsable_defecto: "Dr. Andrés Suárez", activo: true },
  { id: 3, area_id: 1, nombre: "Secretaría de Hacienda", responsable_defecto: "Cra. Patricia Varela", activo: true },
  { id: 4, area_id: 1, nombre: "Archivo Central", responsable_defecto: "Mesa de Entradas", activo: true },
];

let memoryDocs: Documento[] = [
  {
    id: 1,
    area_id: 1,
    numero_expediente: "EXP-2026-00104-MEG",
    tipo_documento: "EXPEDIENTE",
    anio: 2026,
    iniciador_caratula: "Dirección de RRHH - S/ Adquisición de Licencias de Software y Cómputo",
    extracto: "Solicitud de presupuesto y compra directa para 45 puestos de trabajo administrativos.",
    estado_actual: "DESPACHO",
    destino_actual: "Despacho de Presidencia",
    portador_actual: "Roberto Silva",
    foja_actual: 34,
    prioridad: "URGENTE",
    fecha_ingreso: new Date(Date.now() - 172800000).toISOString(),
    ultimo_movimiento_at: new Date(Date.now() - 4500000).toISOString(),
    ultimo_movimiento_hora_corta: "12:15",
    ultimo_movimiento_formateado: "16/11/2026 12:15",
    creado_por_id: 1,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    area_id: 1,
    numero_expediente: "NOTA-2026-0042-MEG",
    tipo_documento: "NOTA",
    anio: 2026,
    iniciador_caratula: "Secretaría de Obras Públicas - S/ Mantenimiento de Servidores y Climatización",
    extracto: "Informe de temperatura y necesidad de reemplazo de UPS en sala de rack.",
    estado_actual: "FIRMADO",
    destino_actual: "Archivo Central",
    portador_actual: "Mesa de Entradas",
    foja_actual: 6,
    prioridad: "NORMAL",
    fecha_ingreso: new Date(Date.now() - 432000000).toISOString(),
    ultimo_movimiento_at: new Date(Date.now() - 13200000).toISOString(),
    ultimo_movimiento_hora_corta: "09:50",
    ultimo_movimiento_formateado: "16/11/2026 09:50",
    creado_por_id: 1,
    created_at: new Date(Date.now() - 432000000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    area_id: 1,
    numero_expediente: "RES-2026-0089-MEG",
    tipo_documento: "RESOLUCION",
    anio: 2026,
    iniciador_caratula: "Presidencia - Designación de Personal Técnico de Guardia Operativa",
    extracto: "Resolución que designa personal técnico rotativo para guardia 24/7.",
    estado_actual: "EN MANO",
    destino_actual: "Secretaría de Hacienda",
    portador_actual: "Cra. Patricia Varela",
    foja_actual: 18,
    prioridad: "PRONTO DESPACHO",
    fecha_ingreso: new Date(Date.now() - 86400000).toISOString(),
    ultimo_movimiento_at: new Date(Date.now() - 1500000).toISOString(),
    ultimo_movimiento_hora_corta: "13:05",
    ultimo_movimiento_formateado: "16/11/2026 13:05",
    creado_por_id: 2,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

let memoryMovimientos: Movimiento[] = [
  {
    id: 1,
    documento_id: 1,
    area_id: 1,
    usuario_nombre: "Mariana López (Mesa Central)",
    estado_anterior: undefined,
    estado_nuevo: "INICIADO",
    destino_anterior: undefined,
    destino_nuevo: "Mesa de Entradas",
    portador_anterior: undefined,
    portador_nuevo: "Mariana López",
    fojas_agregadas: 12,
    observacion: "Ingreso por ventanilla mesa central, caratulación y foliatura inicial.",
    fecha_hora: new Date(Date.now() - 172800000).toISOString(),
    hora_corta: "09:00",
    fecha_formateada: "14/11/2026 09:00",
  },
  {
    id: 2,
    documento_id: 1,
    area_id: 1,
    usuario_nombre: "Lic. Carlos Menéndez",
    estado_anterior: "INICIADO",
    estado_nuevo: "EN MANO",
    destino_anterior: "Mesa de Entradas",
    destino_nuevo: "Asuntos Jurídicos",
    portador_anterior: "Mariana López",
    portador_nuevo: "Dr. Andrés Suárez",
    fojas_agregadas: 10,
    observacion: "Se adjunta pliego de especificaciones y dictamen de necesidad técnica.",
    fecha_hora: new Date(Date.now() - 97200000).toISOString(),
    hora_corta: "11:30",
    fecha_formateada: "15/11/2026 11:30",
  },
  {
    id: 3,
    documento_id: 1,
    area_id: 1,
    usuario_nombre: "Mariana López (Mesa Central)",
    estado_anterior: "EN MANO",
    estado_nuevo: "DESPACHO",
    destino_anterior: "Asuntos Jurídicos",
    destino_nuevo: "Despacho de Presidencia",
    portador_anterior: "Dr. Andrés Suárez",
    portador_nuevo: "Roberto Silva",
    fojas_agregadas: 12,
    observacion: "Pase a Despacho para resolución de autorización de gasto.",
    fecha_hora: new Date(Date.now() - 4500000).toISOString(),
    hora_corta: "12:15",
    fecha_formateada: "16/11/2026 12:15",
  }
];

// Database Schema Initialization for Vercel Postgres / Neon
export async function initializeVercelDb() {
  const client = getDbClient();
  if (!client) return { initialized: false, message: "No POSTGRES_URL configured" };

  try {
    await client`
      CREATE TABLE IF NOT EXISTS areas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL UNIQUE,
        codigo VARCHAR(20) NOT NULL UNIQUE,
        descripcion TEXT,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
        username VARCHAR(50) NOT NULL UNIQUE,
        nombre_completo VARCHAR(150) NOT NULL,
        rol VARCHAR(30) NOT NULL DEFAULT 'OPERADOR',
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client`
      CREATE TABLE IF NOT EXISTS catalogos_destinos (
        id SERIAL PRIMARY KEY,
        area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
        nombre VARCHAR(150) NOT NULL,
        responsable_defecto VARCHAR(150),
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client`
      CREATE TABLE IF NOT EXISTS documentos (
        id SERIAL PRIMARY KEY,
        area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
        numero_expediente VARCHAR(80) NOT NULL,
        tipo_documento VARCHAR(40) NOT NULL DEFAULT 'EXPEDIENTE',
        anio INTEGER NOT NULL,
        iniciador_caratula VARCHAR(255) NOT NULL,
        extracto TEXT,
        estado_actual VARCHAR(50) NOT NULL DEFAULT 'INICIADO',
        destino_actual VARCHAR(150) NOT NULL DEFAULT 'Mesa de Entradas',
        portador_actual VARCHAR(150) NOT NULL DEFAULT 'Mesa de Entradas',
        foja_actual INTEGER NOT NULL DEFAULT 1,
        prioridad VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
        fecha_ingreso TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ultimo_movimiento_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        creado_por_id INTEGER,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client`
      CREATE TABLE IF NOT EXISTS movimientos (
        id SERIAL PRIMARY KEY,
        documento_id INTEGER NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
        area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
        usuario_id INTEGER,
        usuario_nombre VARCHAR(150) NOT NULL,
        estado_anterior VARCHAR(50),
        estado_nuevo VARCHAR(50) NOT NULL,
        destino_anterior VARCHAR(150),
        destino_nuevo VARCHAR(150) NOT NULL,
        portador_anterior VARCHAR(150),
        portador_nuevo VARCHAR(150) NOT NULL,
        fojas_agregadas INTEGER NOT NULL DEFAULT 0,
        observacion TEXT,
        fecha_hora TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Check if seeded
    const countAreas = await client`SELECT COUNT(*)::int as count FROM areas;`;
    if (countAreas[0].count === 0) {
      await client`
        INSERT INTO areas (id, nombre, codigo, descripcion) VALUES
        (1, 'Mesa de Entradas General', 'MEG', 'Recepción general y derivación de expedientes'),
        (2, 'Despacho de Presidencia', 'DESP-PRES', 'Rúbrica y control de despachos'),
        (3, 'Asuntos Jurídicos', 'DGAJ', 'Dictámenes y asesoría legal')
        ON CONFLICT DO NOTHING;
      `;

      await client`
        INSERT INTO usuarios (id, area_id, username, nombre_completo, rol) VALUES
        (1, 1, 'marianalopez', 'Mariana López (Mesa Central)', 'OPERADOR'),
        (2, 1, 'carlos.admin', 'Lic. Carlos Menéndez', 'ADMIN'),
        (3, 2, 'roberto.despacho', 'Roberto Silva (Despacho)', 'SUPERVISOR'),
        (4, 3, 'andres.abogado', 'Dr. Andrés Suárez', 'OPERADOR')
        ON CONFLICT DO NOTHING;
      `;

      await client`
        INSERT INTO catalogos_destinos (id, area_id, nombre, responsable_defecto) VALUES
        (1, 1, 'Despacho de Presidencia', 'Roberto Silva'),
        (2, 1, 'Asuntos Jurídicos', 'Dr. Andrés Suárez'),
        (3, 1, 'Secretaría de Hacienda', 'Cra. Patricia Varela'),
        (4, 1, 'Archivo Central', 'Mesa de Entradas')
        ON CONFLICT DO NOTHING;
      `;

      await client`
        INSERT INTO documentos (id, area_id, numero_expediente, tipo_documento, anio, iniciador_caratula, extracto, estado_actual, destino_actual, portador_actual, foja_actual, prioridad) VALUES
        (1, 1, 'EXP-2026-00104-MEG', 'EXPEDIENTE', 2026, 'Dirección de RRHH - S/ Adquisición de Licencias de Software y Cómputo', 'Solicitud de presupuesto y compra directa para 45 puestos de trabajo administrativos.', 'DESPACHO', 'Despacho de Presidencia', 'Roberto Silva', 34, 'URGENTE'),
        (2, 1, 'NOTA-2026-0042-MEG', 'NOTA', 2026, 'Secretaría de Obras Públicas - S/ Mantenimiento de Servidores y Climatización', 'Informe de temperatura y necesidad de reemplazo de UPS en sala de rack.', 'FIRMADO', 'Archivo Central', 'Mesa de Entradas', 6, 'NORMAL'),
        (3, 1, 'RES-2026-0089-MEG', 'RESOLUCION', 2026, 'Presidencia - Designación de Personal Técnico de Guardia Operativa', 'Resolución que designa personal técnico rotativo para guardia 24/7.', 'EN MANO', 'Secretaría de Hacienda', 'Cra. Patricia Varela', 18, 'PRONTO DESPACHO')
        ON CONFLICT DO NOTHING;
      `;

      await client`
        INSERT INTO movimientos (id, documento_id, area_id, usuario_nombre, estado_nuevo, destino_nuevo, portador_nuevo, fojas_agregadas, observacion) VALUES
        (1, 1, 1, 'Mariana López (Mesa Central)', 'INICIADO', 'Mesa de Entradas', 'Mariana López', 12, 'Ingreso inicial por mesa general.'),
        (2, 1, 1, 'Lic. Carlos Menéndez', 'EN MANO', 'Asuntos Jurídicos', 'Dr. Andrés Suárez', 10, 'Pase con proyecto y pliego técnico.'),
        (3, 1, 1, 'Mariana López (Mesa Central)', 'DESPACHO', 'Despacho de Presidencia', 'Roberto Silva', 12, 'Pase a Despacho para resolución ministerial.')
        ON CONFLICT DO NOTHING;
      `;
    }

    return { initialized: true, message: "Tablas y datos iniciales listos en Vercel Postgres" };
  } catch (error: any) {
    console.error("Error inicializando Vercel DB:", error);
    return { initialized: false, error: error.message };
  }
}

// Data queries with fallback
export async function dbGetAreas(): Promise<Area[]> {
  const client = getDbClient();
  if (!client) return memoryAreas;
  try {
    const rows = await client`SELECT * FROM areas WHERE activo = true ORDER BY nombre ASC;`;
    return rows.map((r: any) => ({
      id: r.id,
      nombre: r.nombre,
      codigo: r.codigo,
      descripcion: r.descripcion,
      activo: r.activo,
      created_at: r.created_at?.toISOString() || new Date().toISOString(),
    }));
  } catch (e) {
    return memoryAreas;
  }
}

export async function dbGetCatalogosDestinos(areaId: number): Promise<CatalogoDestino[]> {
  const client = getDbClient();
  if (!client) return memoryDestinos.filter((d) => d.area_id === areaId);
  try {
    const rows = await client`SELECT * FROM catalogos_destinos WHERE area_id = ${areaId} AND activo = true ORDER BY nombre ASC;`;
    return rows.map((r: any) => ({
      id: r.id,
      area_id: r.area_id,
      nombre: r.nombre,
      responsable_defecto: r.responsable_defecto,
      activo: r.activo,
    }));
  } catch (e) {
    return memoryDestinos.filter((d) => d.area_id === areaId);
  }
}

export async function dbGetUsuarios(areaId: number): Promise<Usuario[]> {
  const client = getDbClient();
  if (!client) return memoryUsers.filter((u) => u.area_id === areaId);
  try {
    const rows = await client`SELECT * FROM usuarios WHERE area_id = ${areaId} AND activo = true ORDER BY nombre_completo ASC;`;
    return rows.map((r: any) => ({
      id: r.id,
      area_id: r.area_id,
      username: r.username,
      nombre_completo: r.nombre_completo,
      rol: r.rol,
      activo: r.activo,
    }));
  } catch (e) {
    return memoryUsers.filter((u) => u.area_id === areaId);
  }
}

export async function dbGetDocumentos(areaId: number, filters?: Partial<FilterState>): Promise<Documento[]> {
  const client = getDbClient();
  if (!client) {
    let list = memoryDocs.filter((d) => d.area_id === areaId);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((d) => d.numero_expediente.toLowerCase().includes(q) || d.iniciador_caratula.toLowerCase().includes(q) || (d.extracto && d.extracto.toLowerCase().includes(q)));
    }
    if (filters?.estado && filters.estado !== "TODOS") {
      list = list.filter((d) => d.estado_actual === filters.estado);
    }
    if (filters?.portador && filters.portador !== "TODOS") {
      list = list.filter((d) => d.portador_actual.toLowerCase().includes(filters.portador!.toLowerCase()));
    }
    if (filters?.destino && filters.destino !== "TODOS") {
      list = list.filter((d) => d.destino_actual.toLowerCase().includes(filters.destino!.toLowerCase()));
    }
    if (filters?.prioridad && filters.prioridad !== "TODOS") {
      list = list.filter((d) => d.prioridad === filters.prioridad);
    }
    return [...list].sort((a, b) => new Date(b.ultimo_movimiento_at).getTime() - new Date(a.ultimo_movimiento_at).getTime());
  }

  try {
    const rows = await client`
      SELECT * FROM documentos 
      WHERE area_id = ${areaId}
      ORDER BY ultimo_movimiento_at DESC 
      LIMIT 1000;
    `;
    let result = rows.map((r: any) => {
      const ult = r.ultimo_movimiento_at ? new Date(r.ultimo_movimiento_at) : new Date();
      const hora = ult.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      const fecha = ult.toLocaleDateString("es-AR") + " " + hora;
      return {
        id: r.id,
        area_id: r.area_id,
        numero_expediente: r.numero_expediente,
        tipo_documento: r.tipo_documento,
        anio: r.anio,
        iniciador_caratula: r.iniciador_caratula,
        extracto: r.extracto,
        estado_actual: r.estado_actual,
        destino_actual: r.destino_actual,
        portador_actual: r.portador_actual,
        foja_actual: r.foja_actual,
        prioridad: r.prioridad,
        fecha_ingreso: r.fecha_ingreso?.toISOString() || new Date().toISOString(),
        ultimo_movimiento_at: ult.toISOString(),
        ultimo_movimiento_hora_corta: hora,
        ultimo_movimiento_formateado: fecha,
        creado_por_id: r.creado_por_id,
        created_at: r.created_at?.toISOString() || new Date().toISOString(),
        updated_at: r.updated_at?.toISOString() || new Date().toISOString(),
      };
    });

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((d) => d.numero_expediente.toLowerCase().includes(q) || d.iniciador_caratula.toLowerCase().includes(q) || (d.extracto && d.extracto.toLowerCase().includes(q)));
    }
    if (filters?.estado && filters.estado !== "TODOS") {
      result = result.filter((d) => d.estado_actual === filters.estado);
    }
    if (filters?.portador && filters.portador !== "TODOS") {
      result = result.filter((d) => d.portador_actual.toLowerCase().includes(filters.portador!.toLowerCase()));
    }
    if (filters?.destino && filters.destino !== "TODOS") {
      result = result.filter((d) => d.destino_actual.toLowerCase().includes(filters.destino!.toLowerCase()));
    }
    if (filters?.prioridad && filters.prioridad !== "TODOS") {
      result = result.filter((d) => d.prioridad === filters.prioridad);
    }

    return result;
  } catch (e) {
    return memoryDocs.filter((d) => d.area_id === areaId);
  }
}

export async function dbGetDocumentoDetalle(docId: number, areaId: number): Promise<Documento | null> {
  const client = getDbClient();
  if (!client) {
    const doc = memoryDocs.find((d) => d.id === docId && d.area_id === areaId);
    if (!doc) return null;
    const movs = memoryMovimientos.filter((m) => m.documento_id === docId && m.area_id === areaId);
    return { ...doc, movimientos: movs };
  }

  try {
    const docRows = await client`SELECT * FROM documentos WHERE id = ${docId} AND area_id = ${areaId};`;
    if (docRows.length === 0) return null;
    const r = docRows[0];
    const ult = r.ultimo_movimiento_at ? new Date(r.ultimo_movimiento_at) : new Date();

    const movRows = await client`
      SELECT * FROM movimientos 
      WHERE documento_id = ${docId} AND area_id = ${areaId}
      ORDER BY fecha_hora DESC;
    `;

    const movimientos: Movimiento[] = movRows.map((m: any) => {
      const fh = m.fecha_hora ? new Date(m.fecha_hora) : new Date();
      const hc = fh.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      return {
        id: m.id,
        documento_id: m.documento_id,
        area_id: m.area_id,
        usuario_id: m.usuario_id,
        usuario_nombre: m.usuario_nombre,
        estado_anterior: m.estado_anterior,
        estado_nuevo: m.estado_nuevo,
        destino_anterior: m.destino_anterior,
        destino_nuevo: m.destino_nuevo,
        portador_anterior: m.portador_anterior,
        portador_nuevo: m.portador_nuevo,
        fojas_agregadas: m.fojas_agregadas,
        observacion: m.observacion,
        fecha_hora: fh.toISOString(),
        hora_corta: hc,
        fecha_formateada: fh.toLocaleDateString("es-AR") + " " + hc,
      };
    });

    return {
      id: r.id,
      area_id: r.area_id,
      numero_expediente: r.numero_expediente,
      tipo_documento: r.tipo_documento,
      anio: r.anio,
      iniciador_caratula: r.iniciador_caratula,
      extracto: r.extracto,
      estado_actual: r.estado_actual,
      destino_actual: r.destino_actual,
      portador_actual: r.portador_actual,
      foja_actual: r.foja_actual,
      prioridad: r.prioridad,
      fecha_ingreso: r.fecha_ingreso?.toISOString() || new Date().toISOString(),
      ultimo_movimiento_at: ult.toISOString(),
      ultimo_movimiento_hora_corta: ult.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      ultimo_movimiento_formateado: ult.toLocaleDateString("es-AR") + " " + ult.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      creado_por_id: r.creado_por_id,
      created_at: r.created_at?.toISOString() || new Date().toISOString(),
      updated_at: r.updated_at?.toISOString() || new Date().toISOString(),
      movimientos,
    };
  } catch (e) {
    const doc = memoryDocs.find((d) => d.id === docId && d.area_id === areaId);
    if (!doc) return null;
    const movs = memoryMovimientos.filter((m) => m.documento_id === docId && m.area_id === areaId);
    return { ...doc, movimientos: movs };
  }
}

export async function dbCreateDocumento(data: any): Promise<Documento> {
  const client = getDbClient();
  const now = new Date();
  const hora = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  if (!client) {
    const newDoc: Documento = {
      id: memoryDocs.length + 1,
      area_id: data.area_id,
      numero_expediente: data.numero_expediente,
      tipo_documento: data.tipo_documento || "EXPEDIENTE",
      anio: data.anio || now.getFullYear(),
      iniciador_caratula: data.iniciador_caratula,
      extracto: data.extracto,
      estado_actual: data.estado_actual || "INICIADO",
      destino_actual: data.destino_actual || "Mesa de Entradas",
      portador_actual: data.portador_actual || "Mesa de Entradas",
      foja_actual: data.foja_actual || 1,
      prioridad: data.prioridad || "NORMAL",
      fecha_ingreso: now.toISOString(),
      ultimo_movimiento_at: now.toISOString(),
      ultimo_movimiento_hora_corta: hora,
      ultimo_movimiento_formateado: now.toLocaleDateString("es-AR") + " " + hora,
      creado_por_id: data.creado_por_id,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    memoryDocs.unshift(newDoc);

    const initialMov: Movimiento = {
      id: memoryMovimientos.length + 1,
      documento_id: newDoc.id,
      area_id: data.area_id,
      usuario_nombre: data.creado_por_nombre || "Mesa de Entradas",
      estado_nuevo: newDoc.estado_actual,
      destino_nuevo: newDoc.destino_actual,
      portador_nuevo: newDoc.portador_actual,
      fojas_agregadas: newDoc.foja_actual,
      observacion: data.observacion_inicial || "Caratulación e ingreso inicial",
      fecha_hora: now.toISOString(),
      hora_corta: hora,
      fecha_formateada: now.toLocaleDateString("es-AR") + " " + hora,
    };
    memoryMovimientos.unshift(initialMov);
    return newDoc;
  }

  const res = await client`
    INSERT INTO documentos (
      area_id, numero_expediente, tipo_documento, anio, iniciador_caratula, 
      extracto, estado_actual, destino_actual, portador_actual, foja_actual, 
      prioridad, creado_por_id, fecha_ingreso, ultimo_movimiento_at
    ) VALUES (
      ${data.area_id}, ${data.numero_expediente}, ${data.tipo_documento || 'EXPEDIENTE'}, ${data.anio || now.getFullYear()},
      ${data.iniciador_caratula}, ${data.extracto || null}, ${data.estado_actual || 'INICIADO'}, ${data.destino_actual || 'Mesa de Entradas'},
      ${data.portador_actual || 'Mesa de Entradas'}, ${data.foja_actual || 1}, ${data.prioridad || 'NORMAL'}, ${data.creado_por_id || null},
      ${now.toISOString()}, ${now.toISOString()}
    ) RETURNING *;
  `;
  const doc = res[0];

  await client`
    INSERT INTO movimientos (
      documento_id, area_id, usuario_id, usuario_nombre, estado_nuevo, 
      destino_nuevo, portador_nuevo, fojas_agregadas, observacion, fecha_hora
    ) VALUES (
      ${doc.id}, ${doc.area_id}, ${data.creado_por_id || null}, ${data.creado_por_nombre || 'Mesa de Entradas'},
      ${doc.estado_actual}, ${doc.destino_actual}, ${doc.portador_actual}, ${doc.foja_actual},
      ${data.observacion_inicial || 'Caratulación inicial'}, ${now.toISOString()}
    );
  `;

  return {
    id: doc.id,
    area_id: doc.area_id,
    numero_expediente: doc.numero_expediente,
    tipo_documento: doc.tipo_documento,
    anio: doc.anio,
    iniciador_caratula: doc.iniciador_caratula,
    extracto: doc.extracto,
    estado_actual: doc.estado_actual,
    destino_actual: doc.destino_actual,
    portador_actual: doc.portador_actual,
    foja_actual: doc.foja_actual,
    prioridad: doc.prioridad,
    fecha_ingreso: now.toISOString(),
    ultimo_movimiento_at: now.toISOString(),
    ultimo_movimiento_hora_corta: hora,
    ultimo_movimiento_formateado: now.toLocaleDateString("es-AR") + " " + hora,
    creado_por_id: doc.creado_por_id,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

export async function dbRegistrarMovimiento(data: any): Promise<Movimiento> {
  const client = getDbClient();
  const now = new Date();
  const hora = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  if (!client) {
    const doc = memoryDocs.find((d) => d.id === data.documento_id && d.area_id === data.area_id);
    if (!doc) throw new Error("Documento no encontrado");

    const mov: Movimiento = {
      id: memoryMovimientos.length + 1,
      documento_id: data.documento_id,
      area_id: data.area_id,
      usuario_id: data.usuario_id,
      usuario_nombre: data.usuario_nombre || "Operador Despacho",
      estado_anterior: doc.estado_actual,
      estado_nuevo: data.estado_nuevo,
      destino_anterior: doc.destino_actual,
      destino_nuevo: data.destino_nuevo,
      portador_anterior: doc.portador_actual,
      portador_nuevo: data.portador_nuevo,
      fojas_agregadas: data.fojas_agregadas || 0,
      observacion: data.observacion,
      fecha_hora: now.toISOString(),
      hora_corta: hora,
      fecha_formateada: now.toLocaleDateString("es-AR") + " " + hora,
    };
    memoryMovimientos.unshift(mov);

    doc.estado_actual = data.estado_nuevo;
    doc.destino_actual = data.destino_nuevo;
    doc.portador_actual = data.portador_nuevo;
    if (data.fojas_agregadas > 0) doc.foja_actual += data.fojas_agregadas;
    doc.ultimo_movimiento_at = now.toISOString();
    doc.ultimo_movimiento_hora_corta = hora;
    doc.ultimo_movimiento_formateado = now.toLocaleDateString("es-AR") + " " + hora;

    return mov;
  }

  const docRes = await client`SELECT * FROM documentos WHERE id = ${data.documento_id} AND area_id = ${data.area_id};`;
  if (docRes.length === 0) throw new Error("Documento no encontrado");
  const doc = docRes[0];

  const movRes = await client`
    INSERT INTO movimientos (
      documento_id, area_id, usuario_id, usuario_nombre, estado_anterior, estado_nuevo,
      destino_anterior, destino_nuevo, portador_anterior, portador_nuevo, fojas_agregadas,
      observacion, fecha_hora
    ) VALUES (
      ${doc.id}, ${doc.area_id}, ${data.usuario_id || null}, ${data.usuario_nombre || 'Operador'},
      ${doc.estado_actual}, ${data.estado_nuevo}, ${doc.destino_actual}, ${data.destino_nuevo},
      ${doc.portador_actual}, ${data.portador_nuevo}, ${data.fojas_agregadas || 0},
      ${data.observacion || null}, ${now.toISOString()}
    ) RETURNING *;
  `;

  await client`
    UPDATE documentos SET
      estado_actual = ${data.estado_nuevo},
      destino_actual = ${data.destino_nuevo},
      portador_actual = ${data.portador_nuevo},
      foja_actual = foja_actual + ${data.fojas_agregadas || 0},
      ultimo_movimiento_at = ${now.toISOString()},
      updated_at = ${now.toISOString()}
    WHERE id = ${doc.id};
  `;

  const m = movRes[0];
  return {
    id: m.id,
    documento_id: m.documento_id,
    area_id: m.area_id,
    usuario_id: m.usuario_id,
    usuario_nombre: m.usuario_nombre,
    estado_anterior: m.estado_anterior,
    estado_nuevo: m.estado_nuevo,
    destino_anterior: m.destino_anterior,
    destino_nuevo: m.destino_nuevo,
    portador_anterior: m.portador_anterior,
    portador_nuevo: m.portador_nuevo,
    fojas_agregadas: m.fojas_agregadas,
    observacion: m.observacion,
    fecha_hora: now.toISOString(),
    hora_corta: hora,
    fecha_formateada: now.toLocaleDateString("es-AR") + " " + hora,
  };
}
