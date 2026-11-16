"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Area, Usuario, CatalogoDestino } from "@/types";
import {
  crearArea,
  eliminarArea,
  crearDestino,
  eliminarDestino,
  crearUsuario,
  eliminarUsuario,
  importarExcelBatch,
  limpiarDatosDemo,
} from "@/lib/api";
import {
  X,
  Settings,
  Layers,
  MapPin,
  Users,
  FileSpreadsheet,
  Trash2,
  Plus,
  Upload,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: Area[];
  currentAreaId: number;
  usuarios: Usuario[];
  catalogosDestinos: CatalogoDestino[];
  onRefetchData: () => void;
}

export function AdminModal({
  isOpen,
  onClose,
  areas,
  currentAreaId,
  usuarios,
  catalogosDestinos,
  onRefetchData,
}: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<"areas" | "destinos" | "usuarios" | "excel" | "limpieza">("excel");

  // Form states
  const [nuevoNombreArea, setNuevoNombreArea] = useState("");
  const [nuevoCodigoArea, setNuevoCodigoArea] = useState("");
  const [nuevaDescArea, setNuevaDescArea] = useState("");

  const [nuevoDestinoNombre, setNuevoDestinoNombre] = useState("");
  const [nuevoDestinoResp, setNuevoDestinoResp] = useState("");

  const [nuevoUserNombre, setNuevoUserNombre] = useState("");
  const [nuevoUsername, setNuevoUsername] = useState("");
  const [nuevoUserRol, setNuevoUserRol] = useState("OPERADOR");

  // Excel ETL state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [excelCols, setExcelCols] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  // Handlers for Areas
  const handleCrearArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crearArea({
        nombre: nuevoNombreArea.trim(),
        codigo: nuevoCodigoArea.trim().toUpperCase(),
        descripcion: nuevaDescArea.trim() || undefined,
      });
      setNuevoNombreArea("");
      setNuevoCodigoArea("");
      setNuevaDescArea("");
      setStatusMsg({ text: "Área creada con éxito" });
      onRefetchData();
    } catch (err: any) {
      setStatusMsg({ text: err.message || "Error al crear área", isError: true });
    }
  };

  const handleEliminarArea = async (id: number) => {
    if (confirm("¿Seguro que deseas eliminar esta área? Se eliminarán sus catálogos asociados.")) {
      try {
        await eliminarArea(id);
        setStatusMsg({ text: "Área eliminada" });
        onRefetchData();
      } catch (err: any) {
        setStatusMsg({ text: err.message, isError: true });
      }
    }
  };

  // Handlers for Destinos
  const handleCrearDestino = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crearDestino({
        area_id: currentAreaId,
        nombre: nuevoDestinoNombre.trim(),
        responsable_defecto: nuevoDestinoResp.trim() || undefined,
      });
      setNuevoDestinoNombre("");
      setNuevoDestinoResp("");
      setStatusMsg({ text: "Destino agregado al catálogo" });
      onRefetchData();
    } catch (err: any) {
      setStatusMsg({ text: err.message, isError: true });
    }
  };

  const handleEliminarDestino = async (id: number) => {
    try {
      await eliminarDestino(id);
      setStatusMsg({ text: "Destino eliminado" });
      onRefetchData();
    } catch (err: any) {
      setStatusMsg({ text: err.message, isError: true });
    }
  };

  // Handlers for Usuarios
  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crearUsuario({
        area_id: currentAreaId,
        username: nuevoUsername.trim().toLowerCase(),
        nombre_completo: nuevoUserNombre.trim(),
        rol: nuevoUserRol,
      });
      setNuevoUserNombre("");
      setNuevoUsername("");
      setStatusMsg({ text: "Operador registrado con éxito" });
      onRefetchData();
    } catch (err: any) {
      setStatusMsg({ text: err.message, isError: true });
    }
  };

  const handleEliminarUsuario = async (id: number) => {
    try {
      await eliminarUsuario(id);
      setStatusMsg({ text: "Usuario eliminado" });
      onRefetchData();
    } catch (err: any) {
      setStatusMsg({ text: err.message, isError: true });
    }
  };

  // Handlers for Excel Import (Opción A)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (data.length > 0) {
          setExcelRows(data);
          setExcelCols(Object.keys(data[0] as object));
        }
      } catch (err) {
        alert("Error al leer el archivo Excel. Asegúrate de que sea un .xlsx o .xls válido.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleEjecutarImportacion = async () => {
    if (excelRows.length === 0) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      // Find matching keys
      const normalizedMap: Record<string, string> = {};
      excelCols.forEach((col) => {
        const clean = col.toLowerCase().replace(/[\s_-]/g, "");
        if (clean.includes("expediente") || clean.includes("tramite") || clean.includes("numero") || clean.includes("nro")) normalizedMap["numero_expediente"] = col;
        if (clean.includes("caratula") || clean.includes("iniciador") || clean.includes("asunto") || clean.includes("objeto")) normalizedMap["iniciador_caratula"] = col;
        if (clean.includes("extracto") || clean.includes("sintesis") || clean.includes("resumen")) normalizedMap["extracto"] = col;
        if (clean.includes("estado")) normalizedMap["estado_actual"] = col;
        if (clean.includes("destino")) normalizedMap["destino_actual"] = col;
        if (clean.includes("portador") || clean.includes("responsable")) normalizedMap["portador_actual"] = col;
        if (clean.includes("foja") || clean.includes("folios")) normalizedMap["foja_actual"] = col;
        if (clean.includes("prioridad")) normalizedMap["prioridad"] = col;
        if (clean.includes("tipo")) normalizedMap["tipo_documento"] = col;
        if (clean.includes("observacion") || clean.includes("nota")) normalizedMap["observacion"] = col;
      });

      const colExp = normalizedMap["numero_expediente"] || excelCols[0];
      const colCar = normalizedMap["iniciador_caratula"] || excelCols[1];

      const items = excelRows.map((row) => ({
        numero_expediente: String(row[colExp] || "").trim(),
        iniciador_caratula: String(row[colCar] || "Sin carátula especificada").trim(),
        extracto: normalizedMap["extracto"] ? String(row[normalizedMap["extracto"]] || "").trim() : undefined,
        estado_actual: normalizedMap["estado_actual"] ? String(row[normalizedMap["estado_actual"]] || "INICIADO").trim() : "INICIADO",
        destino_actual: normalizedMap["destino_actual"] ? String(row[normalizedMap["destino_actual"]] || "Mesa de Entradas").trim() : "Mesa de Entradas",
        portador_actual: normalizedMap["portador_actual"] ? String(row[normalizedMap["portador_actual"]] || "Mesa de Entradas").trim() : "Mesa de Entradas",
        foja_actual: normalizedMap["foja_actual"] ? Number(row[normalizedMap["foja_actual"]]) || 1 : 1,
        prioridad: normalizedMap["prioridad"] ? String(row[normalizedMap["prioridad"]] || "NORMAL").trim() : "NORMAL",
        tipo_documento: normalizedMap["tipo_documento"] ? String(row[normalizedMap["tipo_documento"]] || "EXPEDIENTE").trim() : "EXPEDIENTE",
        observacion: normalizedMap["observacion"] ? String(row[normalizedMap["observacion"]] || "").trim() : "Importación histórica desde planilla Excel",
      }));

      const res = await importarExcelBatch(currentAreaId, items, "Importador Web Excel");
      setImportResult(`✔ Se importaron exitosamente ${res.importados} expedientes a la base de datos.`);
      onRefetchData();
    } catch (err: any) {
      setImportResult(`Error en la importación: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Handlers for Limpiar Demo
  const handleLimpiarDemo = async () => {
    if (confirm("¿Estás seguro de que deseas vaciar los expedientes de prueba para empezar limpio con la información real de tu institución?")) {
      try {
        await limpiarDatosDemo(currentAreaId);
        setStatusMsg({ text: "Datos de prueba eliminados correctamente. El área está lista para registros reales." });
        onRefetchData();
      } catch (err: any) {
        setStatusMsg({ text: err.message, isError: true });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Administración y Parametrización Real
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configura las Áreas, Destinos, Operadores y migra tu planilla Excel histórica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
              statusMsg.isError ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
            }`}
          >
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="underline text-[11px]">
              Cerrar
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/70">
          <button
            onClick={() => setActiveTab("excel")}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold transition ${
              activeTab === "excel"
                ? "border-blue-600 text-blue-600 bg-white dark:bg-slate-800 dark:text-blue-400"
                : "border-transparent hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>📥 Importar Planilla Excel (ETL)</span>
          </button>

          <button
            onClick={() => setActiveTab("areas")}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition ${
              activeTab === "areas"
                ? "border-blue-600 text-blue-600 bg-white dark:bg-slate-800 dark:text-blue-400"
                : "border-transparent hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>🏛️ Áreas de la Institución</span>
          </button>

          <button
            onClick={() => setActiveTab("destinos")}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition ${
              activeTab === "destinos"
                ? "border-blue-600 text-blue-600 bg-white dark:bg-slate-800 dark:text-blue-400"
                : "border-transparent hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>📂 Destinos y Oficinas</span>
          </button>

          <button
            onClick={() => setActiveTab("usuarios")}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition ${
              activeTab === "usuarios"
                ? "border-blue-600 text-blue-600 bg-white dark:bg-slate-800 dark:text-blue-400"
                : "border-transparent hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>👥 Personal / Operadores</span>
          </button>

          <button
            onClick={() => setActiveTab("limpieza")}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition ${
              activeTab === "limpieza"
                ? "border-rose-600 text-rose-600 bg-white dark:bg-slate-800"
                : "border-transparent hover:text-rose-600"
            }`}
          >
            <Trash2 className="h-4 w-4 text-rose-500" />
            <span>🧹 Limpiar Demo</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs">
          {/* TAB 1: EXCEL IMPORT (OPCIÓN A) */}
          {activeTab === "excel" && (
            <div className="space-y-5">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" /> Importación Masiva de Planilla Histórica
                </h3>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Sube el archivo Excel (`.xlsx`, `.xls` o `.csv`) de tu mesa de entradas. El sistema detectará las columnas, creará cada expediente en la base de datos de Neon/Vercel y registrará el pase inaugural inmutable con auditoría.
                </p>
              </div>

              {/* Upload Input */}
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 hover:border-blue-500 dark:border-slate-700 transition">
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <label className="cursor-pointer font-bold text-blue-600 hover:underline">
                  <span>Seleccionar archivo Excel</span>
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">Formatos soportados: .xlsx, .xls, .csv</p>
                {excelFile && (
                  <div className="mt-3 inline-flex items-center space-x-2 rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{excelFile.name} ({excelRows.length} filas detectadas)</span>
                  </div>
                )}
              </div>

              {/* Preview */}
              {excelRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Vista previa de las primeras 5 filas:
                    </span>
                    <button
                      onClick={handleEjecutarImportacion}
                      disabled={isImporting}
                      className="inline-flex items-center space-x-2 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Importando a la base de datos...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Importar {excelRows.length} Expedientes Ahora</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        <tr>
                          {excelCols.slice(0, 7).map((c) => (
                            <th key={c} className="p-2 border-r">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {excelRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            {excelCols.slice(0, 7).map((c) => (
                              <td key={c} className="p-2 truncate max-w-[150px] border-r">
                                {String(row[c] || "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importResult && (
                <div className="rounded-lg bg-emerald-100 p-4 text-emerald-900 font-bold">
                  {importResult}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ÁREAS */}
          {activeTab === "areas" && (
            <div className="space-y-6">
              <form onSubmit={handleCrearArea} className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <label className="block font-semibold mb-1">Nombre del Área *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mesa General de Entradas"
                    value={nuevoNombreArea}
                    onChange={(e) => setNuevoNombreArea(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Código / Sigla *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. MGEN"
                    value={nuevoCodigoArea}
                    onChange={(e) => setNuevoCodigoArea(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Descripción</label>
                  <input
                    type="text"
                    placeholder="Objeto o funciones..."
                    value={nuevaDescArea}
                    onChange={(e) => setNuevaDescArea(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div className="col-span-3 text-right">
                  <button type="submit" className="rounded-md bg-blue-600 px-4 py-1.5 font-bold text-white hover:bg-blue-500">
                    <Plus className="inline h-3.5 w-3.5 mr-1" /> Agregar Área Real
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:border-slate-800">
                {areas.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div>
                      <span className="font-bold text-sm mr-2">{a.nombre}</span>
                      <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700">[{a.codigo}]</span>
                      {a.descripcion && <p className="text-[11px] text-slate-500 mt-0.5">{a.descripcion}</p>}
                    </div>
                    {areas.length > 1 && (
                      <button onClick={() => handleEliminarArea(a.id)} className="text-rose-500 hover:text-rose-700 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DESTINOS */}
          {activeTab === "destinos" && (
            <div className="space-y-6">
              <form onSubmit={handleCrearDestino} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <label className="block font-semibold mb-1">Nombre de la Oficina o Sector *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Dirección General de Asuntos Jurídicos"
                    value={nuevoDestinoNombre}
                    onChange={(e) => setNuevoDestinoNombre(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Responsable por defecto (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Dr. Andrés Suárez"
                    value={nuevoDestinoResp}
                    onChange={(e) => setNuevoDestinoResp(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div className="col-span-2 text-right">
                  <button type="submit" className="rounded-md bg-blue-600 px-4 py-1.5 font-bold text-white hover:bg-blue-500">
                    <Plus className="inline h-3.5 w-3.5 mr-1" /> Agregar al Catálogo de Destinos
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:border-slate-800">
                {catalogosDestinos.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div>
                      <strong className="text-xs text-slate-900 dark:text-white mr-2">{d.nombre}</strong>
                      {d.responsable_defecto && (
                        <span className="text-slate-500 text-[11px]">(Responsable: {d.responsable_defecto})</span>
                      )}
                    </div>
                    <button onClick={() => handleEliminarDestino(d.id)} className="text-rose-500 hover:text-rose-700 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: USUARIOS */}
          {activeTab === "usuarios" && (
            <div className="space-y-6">
              <form onSubmit={handleCrearUsuario} className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <label className="block font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Valeria Gómez"
                    value={nuevoUserNombre}
                    onChange={(e) => setNuevoUserNombre(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Nombre de Usuario (Login) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. valeria.gomez"
                    value={nuevoUsername}
                    onChange={(e) => setNuevoUsername(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Rol</label>
                  <select
                    value={nuevoUserRol}
                    onChange={(e) => setNuevoUserRol(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs"
                  >
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="col-span-3 text-right">
                  <button type="submit" className="rounded-md bg-blue-600 px-4 py-1.5 font-bold text-white hover:bg-blue-500">
                    <Plus className="inline h-3.5 w-3.5 mr-1" /> Registrar Operador Real
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:border-slate-800">
                {usuarios.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white mr-2">{u.nombre_completo}</span>
                      <span className="text-slate-400 font-mono text-[11px]">(@{u.username})</span>
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600">{u.rol}</span>
                    </div>
                    {usuarios.length > 1 && (
                      <button onClick={() => handleEliminarUsuario(u.id)} className="text-rose-500 hover:text-rose-700 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: LIMPIAR DEMO */}
          {activeTab === "limpieza" && (
            <div className="space-y-4 rounded-xl border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900/50 dark:bg-rose-950/20">
              <div className="flex items-center space-x-3 text-rose-800 dark:text-rose-300">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <h3 className="text-sm font-bold">Limpiar Expedientes de Prueba</h3>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Esta acción elimina los trámites de demostración iniciales (`EXP-2026-00104-MEG`, etc.) en la base de datos de Neon/Vercel para que tu mesa de entradas quede 100% limpia y comience a registrar los datos reales desde cero o mediante la importación de Excel.
              </p>
              <button
                onClick={handleLimpiarDemo}
                className="inline-flex items-center space-x-2 rounded-lg bg-rose-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-rose-500 transition"
              >
                <Trash2 className="h-4 w-4" />
                <span>Vaciar Trámites de Prueba de esta Área</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
