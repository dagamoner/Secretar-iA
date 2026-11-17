"use client";

import React, { useState, useEffect } from "react";
import { updateDocumento } from "@/lib/api";
import { Documento, CatalogoDestino, Usuario } from "@/types";
import {
  X,
  Save,
  AlertCircle,
  FileEdit,
  Building2,
  User,
  AlertTriangle,
  Calendar,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface EditDocumentModalProps {
  isOpen: boolean;
  documento: Documento | null;
  onClose: () => void;
  onSaved: (updatedDoc: Documento) => void;
  areaId: number;
  currentUser: Usuario | null;
  catalogosDestinos: CatalogoDestino[];
}

const TIPOS_DOC = [
  "EXPEDIENTE",
  "NOTA",
  "RESOLUCION",
  "DECRETO",
  "CONVENIO",
  "DISPOSICION",
  "INFORME",
  "ACTUACION",
];

const ESTADOS_VALIDOS = [
  "INICIADO",
  "DESPACHO",
  "EN MANO",
  "FIRMADO",
  "OBSERVADO",
  "ARCHIVO",
];

export function EditDocumentModal({
  isOpen,
  documento,
  onClose,
  onSaved,
  areaId,
  currentUser,
  catalogosDestinos,
}: EditDocumentModalProps) {
  const [numeroExpediente, setNumeroExpediente] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("EXPEDIENTE");
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [caratula, setCaratula] = useState("");
  const [extracto, setExtracto] = useState("");
  const [estadoActual, setEstadoActual] = useState("INICIADO");
  const [destinoActual, setDestinoActual] = useState("");
  const [portadorActual, setPortadorActual] = useState("");
  const [fojaActual, setFojaActual] = useState(1);
  const [prioridad, setPrioridad] = useState("NORMAL");
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [observacionEdicion, setObservacionEdicion] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync state when documento changes
  useEffect(() => {
    if (documento) {
      setNumeroExpediente(documento.numero_expediente || "");
      setTipoDocumento(documento.tipo_documento || "EXPEDIENTE");
      setAnio(documento.anio || new Date().getFullYear());
      setCaratula(documento.iniciador_caratula || "");
      setExtracto(documento.extracto || "");
      setEstadoActual(documento.estado_actual || "INICIADO");
      setDestinoActual(documento.destino_actual || "");
      setPortadorActual(documento.portador_actual || "");
      setFojaActual(documento.foja_actual || 1);
      setPrioridad(documento.prioridad || "NORMAL");
      
      // Parse ISO date to YYYY-MM-DD for date input
      if (documento.fecha_ingreso) {
        try {
          const d = new Date(documento.fecha_ingreso);
          setFechaIngreso(d.toISOString().slice(0, 10));
        } catch {
          setFechaIngreso(new Date().toISOString().slice(0, 10));
        }
      } else {
        setFechaIngreso(new Date().toISOString().slice(0, 10));
      }

      setObservacionEdicion("");
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [documento]);

  if (!isOpen || !documento) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!numeroExpediente.trim()) {
      setErrorMsg("El número de expediente o identificador es obligatorio.");
      return;
    }
    if (!caratula.trim()) {
      setErrorMsg("La carátula o descripción del trámite es obligatoria.");
      return;
    }

    setIsSaving(true);
    try {
      // Build ISO date if modified
      let isoFechaIngreso = documento.fecha_ingreso;
      if (fechaIngreso) {
        try {
          isoFechaIngreso = new Date(`${fechaIngreso}T09:00:00.000Z`).toISOString();
        } catch {
          // fallback to current
        }
      }

      const updated = await updateDocumento(documento.id, areaId, {
        numero_expediente: numeroExpediente.trim(),
        tipo_documento: tipoDocumento.trim().toUpperCase(),
        anio: Number(anio) || new Date().getFullYear(),
        iniciador_caratula: caratula.trim(),
        extracto: extracto.trim() || undefined,
        estado_actual: estadoActual,
        destino_actual: destinoActual.trim() || "Mesa de Entradas",
        portador_actual: portadorActual.trim() || "Mesa de Entradas",
        foja_actual: Number(fojaActual) || 1,
        prioridad: prioridad.trim().toUpperCase(),
        fecha_ingreso: isoFechaIngreso,
        usuario_id: currentUser?.id,
        usuario_nombre: currentUser?.nombre_completo || "Operador SPMG",
        observacion_edicion: observacionEdicion.trim() || `Edición de datos generales por ${currentUser?.nombre_completo || "Operador"}`,
      });

      setSuccessMsg("¡Documento actualizado exitosamente!");
      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al actualizar los datos del documento");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Institucional Gobierno de Mendoza */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#000f9f]/10 text-[#000f9f] dark:bg-[#3cb4e5]/20 dark:text-[#3cb4e5]">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-rem">
                  Editar Datos del Trámite
                </h2>
                <span className="rounded bg-slate-200/80 px-2 py-0.5 font-mono text-[11px] font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  ID #{documento.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Secretaría Privada — Ministerio de Gobierno, Infraestructura y Desarrollo Territorial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center space-x-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Row 1: Número de Expediente + Tipo + Año */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6 space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <span>N° Expediente / Identificador</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={numeroExpediente}
                onChange={(e) => setNumeroExpediente(e.target.value.toUpperCase())}
                placeholder="Ej: EX-2025-146099- -GDEMZA-..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 shadow-2xs focus:border-[#000f9f] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tipo de Trámite
              </label>
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:border-[#000f9f] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {TIPOS_DOC.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Año
              </label>
              <input
                type="number"
                min={1990}
                max={2030}
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 shadow-2xs focus:border-[#000f9f] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white text-center"
              />
            </div>
          </div>

          {/* Row 2: Carátula / Iniciador / Resumen */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <span>Ámbito Origen / Carátula y Objeto</span>
                <span className="text-rose-500">*</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">
                {caratula.length} caracteres
              </span>
            </label>
            <textarea
              rows={3}
              value={caratula}
              onChange={(e) => setCaratula(e.target.value)}
              placeholder="Ej: [CONTABILIDAD#GOBIERNO] Solicitud de adquisición y pliego..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 shadow-2xs focus:border-[#000f9f] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          {/* Row 3: Extracto / Resumen Ampliado (opcional) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <span>Extracto / Observaciones de Contenido</span>
              <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={2}
              value={extracto}
              onChange={(e) => setExtracto(e.target.value)}
              placeholder="Detalles ampliados o notas del extracto..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 shadow-2xs focus:border-[#000f9f] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Row 4: Prioridad, Fojas y Fecha de Ingreso */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Prioridad</span>
              </label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:border-[#000f9f] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="URGENTE">⚡ URGENTE</option>
                <option value="PRONTO DESPACHO">⚡ PRONTO DESPACHO</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <span>Fojas Totales</span>
              </label>
              <input
                type="number"
                min={1}
                value={fojaActual}
                onChange={(e) => setFojaActual(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 shadow-2xs focus:border-[#000f9f] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Fecha de Ingreso</span>
              </label>
              <input
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-900 shadow-2xs focus:border-[#000f9f] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Row 5: Estado Actual, Destino Actual y Portador */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-850/50 space-y-3">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              Estado y Localización Operativa
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Estado
                </label>
                <select
                  value={estadoActual}
                  onChange={(e) => setEstadoActual(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {ESTADOS_VALIDOS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  <span>Destino / Ámbito</span>
                </label>
                <input
                  type="text"
                  list="destinos-list"
                  value={destinoActual}
                  onChange={(e) => setDestinoActual(e.target.value)}
                  placeholder="Ej: Despacho 008, Hacienda..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <datalist id="destinos-list">
                  {catalogosDestinos.map((d) => (
                    <option key={d.id} value={d.nombre} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                  <User className="h-3 w-3 text-slate-400" />
                  <span>Portador / Retiró</span>
                </label>
                <input
                  type="text"
                  value={portadorActual}
                  onChange={(e) => setPortadorActual(e.target.value)}
                  placeholder="Ej: Sonia, Roberto Silva..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Row 6: Motivo de la Edición / Nota de Auditoría */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>Motivo o Nota de la Modificación</span>
              <span className="text-[10px] text-slate-400 font-normal">(Quedará registrada en la trazabilidad)</span>
            </label>
            <input
              type="text"
              value={observacionEdicion}
              onChange={(e) => setObservacionEdicion(e.target.value)}
              placeholder="Ej: Corrección de carátula por error de tipeo / Actualización de fojas..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-[#000f9f] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center space-x-2 rounded-xl bg-[#000f9f] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#000966] active:scale-95 transition disabled:opacity-50 dark:bg-[#3cb4e5] dark:text-slate-950 dark:hover:bg-[#32a2cf]"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-slate-950" />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
