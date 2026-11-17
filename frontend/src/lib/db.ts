import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { neon } from "@neondatabase/serverless";
import { Area, Usuario, CatalogoDestino, Documento, Movimiento, FilterState } from "@/types";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password.trim()).digest("hex");
}

export function verifyPassword(password: string, hash?: string): boolean {
  if (!hash) return false;
  return hashPassword(password) === hash || password === hash;
}

export function getDbClient() {
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.STORAGE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.STORAGE_POSTGRES_URL;

  if (connectionString) {
    return neon(connectionString);
  }
  return null;
}

// In-Memory store for preview/demo when no database is connected yet
let memoryAreas: Area[] = [
  { id: 1, nombre: "Secretaría Privada - Ministerio de Gobierno", codigo: "SPMG", descripcion: "Recepción, despacho y seguimiento de expedientes y notas de la Secretaría Privada.", activo: true, created_at: new Date().toISOString() },
  { id: 2, nombre: "Despacho General", codigo: "DESP", descripcion: "Rúbrica y control de despachos", activo: true, created_at: new Date().toISOString() },
  { id: 3, nombre: "Asuntos Jurídicos", codigo: "DGAJ", descripcion: "Dictámenes y asesoría legal", activo: true, created_at: new Date().toISOString() },
];

let memoryUsers: Usuario[] = [
  { id: 1, area_id: 1, username: "admin", nombre_completo: "Administrador General", rol: "ADMIN", activo: true, password_hash: hashPassword("admin2026") },
  { id: 2, area_id: 1, username: "vaninapardo", nombre_completo: "Vanina Pardo", rol: "OPERADOR", activo: true, password_hash: hashPassword("vanina2026") },
  { id: 3, area_id: 1, username: "betianasalinas", nombre_completo: "Betiana Salinas", rol: "OPERADOR", activo: true, password_hash: hashPassword("betiana2026") },
];

import seedDocuments from "./seed_documentos.json";

// In-Memory store seeded directly with full official documents (4,595 records)
let memoryDocs: Documento[] = (seedDocuments as unknown as Documento[]) || [];

// Populate destinations catalogue dynamically from seed documents
const uniqueDestinos = new Set<string>();
memoryDocs.forEach((d) => {
  if (d.destino_actual) uniqueDestinos.add(d.destino_actual.trim());
});

let memoryDestinos: CatalogoDestino[] = Array.from(uniqueDestinos).slice(0, 100).map((nombre, idx) => ({
  id: idx + 1,
  area_id: 1,
  nombre,
  responsable_defecto: "Mesa de Entradas",
  activo: true,
}));

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

let isDbInitialized = false;

export async function ensureDbInitialized() {
  if (isDbInitialized) return;
  const client = getDbClient();
  if (!client) return;
  try {
    await initializeVercelDb();

    // Ensure Area 1 is named Secretaría Privada - Ministerio de Gobierno
    await client`
      UPDATE areas 
      SET 
        nombre = 'Secretaría Privada - Ministerio de Gobierno',
        codigo = 'SPMG',
        descripcion = 'Recepción, despacho y seguimiento de expedientes y notas de la Secretaría Privada.'
      WHERE id = 1;
    `;

    // Ensure password_hash column exists
    await client`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`;

    const hashAdmin = hashPassword("admin2026");
    const hashVanina = hashPassword("vanina2026");
    const hashBetiana = hashPassword("betiana2026");

    // Ensure Admin, Vanina Pardo and Betiana Salinas exist in PostgreSQL with initial passwords
    await client`
      INSERT INTO usuarios (area_id, username, nombre_completo, rol, activo, password_hash)
      VALUES 
        (1, 'admin', 'Administrador General', 'ADMIN', true, ${hashAdmin}),
        (1, 'vaninapardo', 'Vanina Pardo', 'OPERADOR', true, ${hashVanina}),
        (1, 'betianasalinas', 'Betiana Salinas', 'OPERADOR', true, ${hashBetiana})
      ON CONFLICT (username) DO UPDATE 
      SET 
        nombre_completo = EXCLUDED.nombre_completo,
        rol = EXCLUDED.rol,
        password_hash = COALESCE(usuarios.password_hash, EXCLUDED.password_hash),
        activo = true;
    `;

    // Purge mock demo users
    await client`DELETE FROM usuarios WHERE username IN ('marianalopez', 'carlos.admin');`;

    isDbInitialized = true;
  } catch (e) {
    console.warn("ensureDbInitialized warning:", e);
  }
}

function normalizeSearchText(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Data queries with fallback
export async function dbGetAreas(): Promise<Area[]> {
  await ensureDbInitialized();
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

    if (filters?.search && filters.search.trim()) {
      const q = normalizeSearchText(filters.search);
      list = list.filter((d) => {
        const num = normalizeSearchText(d.numero_expediente);
        const cara = normalizeSearchText(d.iniciador_caratula);
        const ext = normalizeSearchText(d.extracto);
        const dest = normalizeSearchText(d.destino_actual);
        const port = normalizeSearchText(d.portador_actual);
        const tipo = normalizeSearchText(d.tipo_documento);
        const anio = String(d.anio || "");
        return (
          num.includes(q) ||
          cara.includes(q) ||
          ext.includes(q) ||
          dest.includes(q) ||
          port.includes(q) ||
          tipo.includes(q) ||
          anio.includes(q)
        );
      });
    }
    if (filters?.estado && filters.estado !== "TODOS") {
      list = list.filter((d) => d.estado_actual === filters.estado);
    }
    if (filters?.portador && filters.portador !== "TODOS") {
      const p = normalizeSearchText(filters.portador);
      list = list.filter((d) => normalizeSearchText(d.portador_actual).includes(p));
    }
    if (filters?.destino && filters.destino !== "TODOS") {
      const des = normalizeSearchText(filters.destino);
      list = list.filter((d) => normalizeSearchText(d.destino_actual).includes(des));
    }
    if (filters?.prioridad && filters.prioridad !== "TODOS") {
      if (filters.prioridad === "URGENTES_TODOS") {
        list = list.filter((d) => d.prioridad === "URGENTE" || d.prioridad === "PRONTO DESPACHO");
      } else {
        list = list.filter((d) => d.prioridad === filters.prioridad);
      }
    }
    return [...list].sort((a, b) => {
      const timeB = b.ultimo_movimiento_at ? new Date(b.ultimo_movimiento_at).getTime() : (b.fecha_ingreso ? new Date(b.fecha_ingreso).getTime() : 0);
      const timeA = a.ultimo_movimiento_at ? new Date(a.ultimo_movimiento_at).getTime() : (a.fecha_ingreso ? new Date(a.fecha_ingreso).getTime() : 0);
      return timeB - timeA;
    });
  }

  try {
    const rows = await client`
      SELECT * FROM documentos 
      WHERE area_id = ${areaId}
      ORDER BY COALESCE(ultimo_movimiento_at, fecha_ingreso) DESC, id DESC 
      LIMIT 15000;
    `;
    let result: Documento[] = rows.map((r: any): Documento => {
      const ult = r.ultimo_movimiento_at ? new Date(r.ultimo_movimiento_at) : null;
      const hora = ult ? ult.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : null;
      const fecha = ult ? ult.toLocaleDateString("es-AR") + " " + hora : null;
      return {
        id: r.id,
        area_id: r.area_id,
        numero_expediente: r.numero_expediente,
        tipo_documento: r.tipo_documento,
        anio: r.anio,
        iniciador_caratula: r.iniciador_caratula,
        extracto: r.extracto || undefined,
        estado_actual: r.estado_actual,
        destino_actual: r.destino_actual,
        portador_actual: r.portador_actual,
        foja_actual: r.foja_actual,
        prioridad: r.prioridad,
        fecha_ingreso: r.fecha_ingreso ? new Date(r.fecha_ingreso).toISOString() : new Date().toISOString(),
        ultimo_movimiento_at: ult ? ult.toISOString() : null,
        ultimo_movimiento_hora_corta: hora,
        ultimo_movimiento_formateado: fecha,
        creado_por_id: r.creado_por_id,
        created_at: r.created_at?.toISOString() || new Date().toISOString(),
        updated_at: r.updated_at?.toISOString() || new Date().toISOString(),
      };
    });

    // If the database only contains the 3 demo mock documents or is empty, use the full real Excel seed documents
    if (result.length <= 3 && (result.length === 0 || result.some((d) => d.numero_expediente.includes("-MEG")))) {
      result = memoryDocs.filter((d) => d.area_id === areaId);
    }

    if (filters?.search && filters.search.trim()) {
      const q = normalizeSearchText(filters.search);
      result = result.filter((d) => {
        const num = normalizeSearchText(d.numero_expediente);
        const cara = normalizeSearchText(d.iniciador_caratula);
        const ext = normalizeSearchText(d.extracto);
        const dest = normalizeSearchText(d.destino_actual);
        const port = normalizeSearchText(d.portador_actual);
        const tipo = normalizeSearchText(d.tipo_documento);
        const anio = String(d.anio || "");
        return (
          num.includes(q) ||
          cara.includes(q) ||
          ext.includes(q) ||
          dest.includes(q) ||
          port.includes(q) ||
          tipo.includes(q) ||
          anio.includes(q)
        );
      });
    }
    if (filters?.estado && filters.estado !== "TODOS") {
      result = result.filter((d) => d.estado_actual === filters.estado);
    }
    if (filters?.portador && filters.portador !== "TODOS") {
      const p = normalizeSearchText(filters.portador);
      result = result.filter((d) => normalizeSearchText(d.portador_actual).includes(p));
    }
    if (filters?.destino && filters.destino !== "TODOS") {
      const des = normalizeSearchText(filters.destino);
      result = result.filter((d) => normalizeSearchText(d.destino_actual).includes(des));
    }
    if (filters?.prioridad && filters.prioridad !== "TODOS") {
      if (filters.prioridad === "URGENTES_TODOS") {
        result = result.filter((d) => d.prioridad === "URGENTE" || d.prioridad === "PRONTO DESPACHO");
      } else {
        result = result.filter((d) => d.prioridad === filters.prioridad);
      }
    }

    return result;
  } catch (e) {
    console.error("Error in dbGetDocumentos:", e);
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
    const ult = r.ultimo_movimiento_at ? new Date(r.ultimo_movimiento_at) : null;
    const ultHora = ult ? ult.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : null;
    const ultFecha = ult ? ult.toLocaleDateString("es-AR") + " " + ultHora : null;

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
      fecha_ingreso: r.fecha_ingreso ? new Date(r.fecha_ingreso).toISOString() : new Date().toISOString(),
      ultimo_movimiento_at: ult ? ult.toISOString() : null,
      ultimo_movimiento_hora_corta: ultHora,
      ultimo_movimiento_formateado: ultFecha,
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

  const ultMov = data.ultimo_movimiento_at ? new Date(data.ultimo_movimiento_at).toISOString() : null;
  const fIngreso = data.fecha_ingreso ? new Date(data.fecha_ingreso).toISOString() : now.toISOString();

  const res = await client`
    INSERT INTO documentos (
      area_id, numero_expediente, tipo_documento, anio, iniciador_caratula, 
      extracto, estado_actual, destino_actual, portador_actual, foja_actual, 
      prioridad, creado_por_id, fecha_ingreso, ultimo_movimiento_at
    ) VALUES (
      ${data.area_id}, ${data.numero_expediente}, ${data.tipo_documento || 'EXPEDIENTE'}, ${data.anio || now.getFullYear()},
      ${data.iniciador_caratula}, ${data.extracto || null}, ${data.estado_actual || 'INICIADO'}, ${data.destino_actual || 'Mesa de Entradas'},
      ${data.portador_actual || 'Mesa de Entradas'}, ${data.foja_actual || 1}, ${data.prioridad || 'NORMAL'}, ${data.creado_por_id || null},
      ${fIngreso}, ${ultMov}
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
      ${data.observacion_inicial || 'Caratulación e ingreso inicial'}, ${fIngreso}
    );
  `;

  if (ultMov) {
    await client`
      INSERT INTO movimientos (
        documento_id, area_id, usuario_id, usuario_nombre, estado_nuevo, 
        destino_nuevo, portador_nuevo, fojas_agregadas, observacion, fecha_hora
      ) VALUES (
        ${doc.id}, ${doc.area_id}, ${data.creado_por_id || null}, ${data.creado_por_nombre || 'Mesa de Entradas'},
        ${doc.estado_actual}, ${doc.destino_actual}, ${doc.portador_actual}, ${doc.foja_actual},
        ${'Salida registrada hacia ' + (doc.destino_actual || 'ámbito correspondiente')}, ${ultMov}
      );
    `;
  }

  const ultMovHora = ultMov ? new Date(ultMov).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : null;
  const ultMovFormateado = ultMov ? new Date(ultMov).toLocaleDateString("es-AR") + " " + ultMovHora : null;

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
    fecha_ingreso: fIngreso,
    ultimo_movimiento_at: ultMov,
    ultimo_movimiento_hora_corta: ultMovHora,
    ultimo_movimiento_formateado: ultMovFormateado,
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

export async function dbGetMovimientosRecientes(
  areaId: number,
  limit = 100
): Promise<(Movimiento & { numero_expediente?: string; iniciador_caratula?: string })[]> {
  const client = getDbClient();
  if (!client) {
    const movs = memoryMovimientos
      .filter((m) => m.area_id === areaId)
      .slice(0, limit);
    return movs.map((m) => {
      const doc = memoryDocs.find((d) => d.id === m.documento_id);
      return {
        ...m,
        numero_expediente: doc?.numero_expediente,
        iniciador_caratula: doc?.iniciador_caratula,
      };
    });
  }

  try {
    const rows = await client`
      SELECT 
        m.*,
        d.numero_expediente,
        d.iniciador_caratula
      FROM movimientos m
      LEFT JOIN documentos d ON m.documento_id = d.id
      WHERE m.area_id = ${areaId}
      ORDER BY m.fecha_hora DESC
      LIMIT ${limit};
    `;

    return rows.map((r: any) => {
      const fh = r.fecha_hora ? new Date(r.fecha_hora) : new Date();
      const hc = fh.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      const ff = fh.toLocaleDateString("es-AR") + " " + hc;
      return {
        id: r.id,
        documento_id: r.documento_id,
        area_id: r.area_id,
        usuario_id: r.usuario_id,
        usuario_nombre: r.usuario_nombre,
        estado_anterior: r.estado_anterior,
        estado_nuevo: r.estado_nuevo,
        destino_anterior: r.destino_anterior,
        destino_nuevo: r.destino_nuevo,
        portador_anterior: r.portador_anterior,
        portador_nuevo: r.portador_nuevo,
        fojas_agregadas: r.fojas_agregadas,
        observacion: r.observacion,
        fecha_hora: fh.toISOString(),
        hora_corta: hc,
        fecha_formateada: ff,
        numero_expediente: r.numero_expediente,
        iniciador_caratula: r.iniciador_caratula,
      };
    });
  } catch (error) {
    console.error("Error in dbGetMovimientosRecientes:", error);
    return [];
  }
}

// -------------------------------------------------------------
// ADMINISTRACIÓN: ÁREAS, USUARIOS, DESTINOS Y BATCH IMPORT (ETL)
// -------------------------------------------------------------

export async function dbCreateArea(data: { nombre: string; codigo: string; descripcion?: string }): Promise<Area> {
  const client = getDbClient();
  const now = new Date().toISOString();
  if (!client) {
    const newArea: Area = {
      id: memoryAreas.length + 1,
      nombre: data.nombre.trim(),
      codigo: data.codigo.trim().toUpperCase(),
      descripcion: data.descripcion?.trim(),
      activo: true,
      created_at: now,
    };
    memoryAreas.push(newArea);
    return newArea;
  }

  const res = await client`
    INSERT INTO areas (nombre, codigo, descripcion, activo)
    VALUES (${data.nombre.trim()}, ${data.codigo.trim().toUpperCase()}, ${data.descripcion?.trim() || null}, true)
    RETURNING *;
  `;
  const r = res[0];
  return {
    id: r.id,
    nombre: r.nombre,
    codigo: r.codigo,
    descripcion: r.descripcion,
    activo: r.activo,
    created_at: r.created_at?.toISOString() || now,
  };
}

export async function dbDeleteArea(id: number): Promise<boolean> {
  const client = getDbClient();
  if (!client) {
    memoryAreas = memoryAreas.filter((a) => a.id !== id);
    return true;
  }
  await client`DELETE FROM areas WHERE id = ${id};`;
  return true;
}

export async function dbCreateUsuario(data: { area_id: number; username: string; nombre_completo: string; rol?: string; password?: string }): Promise<Usuario> {
  const client = getDbClient();
  const initialPassword = data.password || "secretaria2026";
  const pwdHash = hashPassword(initialPassword);

  if (!client) {
    const newUser: Usuario = {
      id: memoryUsers.length + 1,
      area_id: data.area_id,
      username: data.username.trim().toLowerCase(),
      nombre_completo: data.nombre_completo.trim(),
      rol: data.rol || "OPERADOR",
      activo: true,
    };
    memoryUsers.push(newUser);
    return newUser;
  }

  const res = await client`
    INSERT INTO usuarios (area_id, username, nombre_completo, rol, activo, password_hash)
    VALUES (${data.area_id}, ${data.username.trim().toLowerCase()}, ${data.nombre_completo.trim()}, ${data.rol || 'OPERADOR'}, true, ${pwdHash})
    RETURNING *;
  `;
  const r = res[0];
  return {
    id: r.id,
    area_id: r.area_id,
    username: r.username,
    nombre_completo: r.nombre_completo,
    rol: r.rol,
    activo: r.activo,
  };
}

export async function dbDeleteUsuario(id: number): Promise<boolean> {
  const client = getDbClient();
  if (!client) {
    memoryUsers = memoryUsers.filter((u) => u.id !== id);
    return true;
  }
  await client`DELETE FROM usuarios WHERE id = ${id};`;
  return true;
}

export async function dbCreateDestino(data: { area_id: number; nombre: string; responsable_defecto?: string }): Promise<CatalogoDestino> {
  const client = getDbClient();
  if (!client) {
    const newDest: CatalogoDestino = {
      id: memoryDestinos.length + 1,
      area_id: data.area_id,
      nombre: data.nombre.trim(),
      responsable_defecto: data.responsable_defecto?.trim(),
      activo: true,
    };
    memoryDestinos.push(newDest);
    return newDest;
  }

  const res = await client`
    INSERT INTO catalogos_destinos (area_id, nombre, responsable_defecto, activo)
    VALUES (${data.area_id}, ${data.nombre.trim()}, ${data.responsable_defecto?.trim() || null}, true)
    RETURNING *;
  `;
  const r = res[0];
  return {
    id: r.id,
    area_id: r.area_id,
    nombre: r.nombre,
    responsable_defecto: r.responsable_defecto,
    activo: r.activo,
  };
}

export async function dbDeleteDestino(id: number): Promise<boolean> {
  const client = getDbClient();
  if (!client) {
    memoryDestinos = memoryDestinos.filter((d) => d.id !== id);
    return true;
  }
  await client`DELETE FROM catalogos_destinos WHERE id = ${id};`;
  return true;
}

export async function dbImportarDocumentosBatch(
  areaId: number,
  items: Array<{
    numero_expediente: string;
    tipo_documento?: string;
    anio?: number;
    iniciador_caratula: string;
    extracto?: string;
    estado_actual?: string;
    destino_actual?: string;
    portador_actual?: string;
    foja_actual?: number;
    prioridad?: string;
    fecha_ingreso?: string;
    ultimo_movimiento_at?: string;
    observacion?: string;
  }>,
  userName: string = "Importador Masivo Excel"
): Promise<{ importados: number; actualizados: number; errores: number }> {
  let importados = 0;
  let actualizados = 0;
  let errores = 0;

  // Process in concurrent chunks of 25 to optimize serverless execution speed
  const chunkSize = 25;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (item) => {
        try {
          if (!item.numero_expediente || !item.iniciador_caratula) {
            errores++;
            return;
          }
          await dbCreateDocumento({
            area_id: areaId,
            numero_expediente: item.numero_expediente.trim(),
            tipo_documento: item.tipo_documento || "EXPEDIENTE",
            anio: item.anio || new Date().getFullYear(),
            iniciador_caratula: item.iniciador_caratula.trim(),
            extracto: item.extracto?.trim() || undefined,
            estado_actual: item.estado_actual?.toUpperCase() || "INICIADO",
            destino_actual: item.destino_actual?.trim() || "Mesa de Entradas",
            portador_actual: item.portador_actual?.trim() || "Mesa de Entradas",
            foja_actual: Number(item.foja_actual) || 1,
            prioridad: item.prioridad?.toUpperCase() || "NORMAL",
            fecha_ingreso: item.fecha_ingreso,
            ultimo_movimiento_at: item.ultimo_movimiento_at || null,
            creado_por_nombre: userName,
            observacion_inicial: item.observacion || "Migrado desde planilla Excel histórica.",
          });
          importados++;
        } catch (e) {
          errores++;
        }
      })
    );
  }

  return { importados, actualizados, errores };
}

export async function dbLimpiarDatosPrueba(areaId?: number): Promise<{ limpiados: boolean }> {
  const client = getDbClient();
  if (!client) {
    if (areaId) {
      memoryDocs = memoryDocs.filter((d) => d.area_id !== areaId);
      memoryMovimientos = memoryMovimientos.filter((m) => m.area_id !== areaId);
    } else {
      memoryDocs = [];
      memoryMovimientos = [];
    }
    return { limpiados: true };
  }

  await ensureDbInitialized();

  try {
    if (areaId) {
      await client`DELETE FROM movimientos WHERE area_id = ${areaId};`;
      await client`DELETE FROM documentos WHERE area_id = ${areaId};`;
    } else {
      await client`DELETE FROM movimientos;`;
      await client`DELETE FROM documentos;`;
    }
  } catch (err: any) {
    console.warn("Aviso al limpiar:", err);
  }

  if (areaId) {
    memoryDocs = memoryDocs.filter((d) => d.area_id !== areaId);
    memoryMovimientos = memoryMovimientos.filter((m) => m.area_id !== areaId);
  } else {
    memoryDocs = [];
    memoryMovimientos = [];
  }

  return { limpiados: true };
}

// -------------------------------------------------------------
// AUTENTICACIÓN: LOGIN Y CAMBIO DE CONTRASEÑA
// -------------------------------------------------------------

export async function dbAuthenticateUser(username: string, password: string): Promise<Usuario | null> {
  await ensureDbInitialized();
  const cleanUsername = username.trim().toLowerCase();
  const client = getDbClient();

  if (!client) {
    const user = memoryUsers.find(
      (u) =>
        (u.username.toLowerCase() === cleanUsername ||
          u.nombre_completo.toLowerCase() === cleanUsername ||
          u.username.toLowerCase().replace(/\s/g, "") === cleanUsername.replace(/\s/g, "")) &&
        u.activo
    );
    if (!user) return null;
    if (!verifyPassword(password, user.password_hash)) return null;
    const area = memoryAreas.find((a) => a.id === user.area_id);
    return {
      id: user.id,
      area_id: user.area_id,
      area_nombre: area?.nombre || "Secretaría Privada - Ministerio de Gobierno",
      username: user.username,
      nombre_completo: user.nombre_completo,
      rol: user.rol,
      activo: user.activo,
    };
  }

  const rows = await client`
    SELECT u.*, a.nombre as area_nombre 
    FROM usuarios u
    JOIN areas a ON a.id = u.area_id
    WHERE (LOWER(u.username) = ${cleanUsername} OR LOWER(u.nombre_completo) = ${cleanUsername} OR REPLACE(LOWER(u.nombre_completo), ' ', '') = ${cleanUsername.replace(/\s/g, '')})
      AND u.activo = true
    LIMIT 1;
  `;

  if (rows.length === 0) return null;
  const r = rows[0];

  if (!verifyPassword(password, r.password_hash)) {
    return null;
  }

  return {
    id: r.id,
    area_id: r.area_id,
    area_nombre: r.area_nombre,
    username: r.username,
    nombre_completo: r.nombre_completo,
    rol: r.rol,
    activo: r.activo,
  };
}

export async function dbChangePassword(
  userId: number,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  await ensureDbInitialized();
  const client = getDbClient();

  if (!client) {
    const user = memoryUsers.find((u) => u.id === userId);
    if (!user) return { success: false, message: "Usuario no encontrado" };
    if (!verifyPassword(oldPassword, user.password_hash)) {
      return { success: false, message: "La contraseña actual no es correcta" };
    }
    user.password_hash = hashPassword(newPassword);
    return { success: true, message: "Contraseña actualizada exitosamente" };
  }

  const rows = await client`SELECT * FROM usuarios WHERE id = ${userId};`;
  if (rows.length === 0) return { success: false, message: "Usuario no encontrado" };
  const r = rows[0];

  if (!verifyPassword(oldPassword, r.password_hash)) {
    return { success: false, message: "La contraseña actual no es correcta" };
  }

  const newHash = hashPassword(newPassword);
  await client`UPDATE usuarios SET password_hash = ${newHash} WHERE id = ${userId};`;
  return { success: true, message: "Contraseña actualizada exitosamente" };
}
