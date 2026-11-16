"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Documento, CatalogoDestino, Usuario, Movimiento } from "@/types";
import { fetchDocumentoDetalle, registrarMovimiento, emitEditingNotice } from "@/lib/api";
import { getEstadoBadgeClass, cn } from "@/lib/utils";
import {
  X,
  ArrowRight,
  UserCheck,
  Clock,
  FileText,
  Send,
  AlertCircle,
  History,
  Copy,
  Check,
  Building,
  Tag,
  ArrowUpRight,
  Archive,
} from "lucide-react";

interface MovementDrawerProps {
  documento: Documento | null;
  areaId: number;
  currentUser: Usuario | null;
  catalogosDestinos: CatalogoDestino[];
  onClose: () => void;
}

const DESTINOS_RAPIDOS = [
  "Despacho de Hacienda",
  "Despacho 008",
  "Ministerio de Infraestructura",
  "Archivo Central",
  "Dirección de Asuntos Jurídicos",
  "Contabilidad General",
];

const OBSERVACIONES_RAPIDAS = [
  "A la firma del Ministro",
  "Para dictamen legal",
  "Para conocimiento e intervención",
  "Aprobado y refrendado",
  "Remitido para archivo definitivo",
];

export function MovementDrawer({
  documento,
  areaId,
  currentUser,
  catalogosDestinos,
  onClose,
}: MovementDrawerProps) {
  const queryClient = useQueryClient();

  // Form State
  const [estadoNuevo, setEstadoNuevo] = useState<string>("DESPACHO");
  const [destinoNuevo, setDestinoNuevo] = useState<string>("");
  const [portadorNuevo, setPortadorNuevo] = useState<string>("");
  const [fojasAgregadas, setFojasAgregadas] = useState<number>(0);
  const [observacion, setObservacion] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isReingresoOpen, setIsReingresoOpen] = useState<boolean>(false);

  // Fetch full details and immutable movement history
  const { data: docDetalle, isLoading } = useQuery({
    queryKey: ["documento", documento?.id, areaId],
    queryFn: () => (documento ? fetchDocumentoDetalle(documento.id, areaId) : null),
    enabled: !!documento,
  });

  // Set default values when document changes
  useEffect(() => {
    if (documento) {
      setEstadoNuevo(documento.estado_actual === "DESPACHO" ? "EN MANO" : "DESPACHO");
      setDestinoNuevo(documento.destino_actual);
      setPortadorNuevo(documento.portador_actual);
      setFojasAgregadas(0);
      setObservacion("");
      setErrorMsg("");

      if (currentUser) {
        emitEditingNotice(areaId, documento.id, currentUser.nombre_completo, true);
      }
    }

    return () => {
      if (documento && currentUser) {
        emitEditingNotice(areaId, documento.id, currentUser.nombre_completo, false);
      }
    };
  }, [documento, areaId, currentUser]);

  const handleCopyExpediente = () => {
    if (documento?.numero_expediente) {
      navigator.clipboard.writeText(documento.numero_expediente);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDestinoSelect = (nombre: string) => {
    setDestinoNuevo(nombre);
    const cat = catalogosDestinos.find((c) => c.nombre === nombre);
    if (cat?.responsable_defecto) {
      setPortadorNuevo(cat.responsable_defecto);
    }
  };

  const mutation = useMutation({
    mutationFn: registrarMovimiento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos", areaId] });
      if (documento) {
        queryClient.invalidateQueries({ queryKey: ["documento", documento.id] });
      }
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Error al registrar el pase");
    },
  });

  if (!documento) return null;

  const handleArchivarDirecto = () => {
    if (!documento) return;
    mutation.mutate({
      area_id: areaId,
      documento_id: documento.id,
      estado_nuevo: "ARCHIVO",
      destino_nuevo: "Archivo Central",
      portador_nuevo: "Archivo",
      fojas_agregadas: 0,
      observacion:
        "Archivado por encontrarse tramitado y egresado del área hacia " +
        (documento.destino_actual || "destino"),
      usuario_id: currentUser?.id,
      usuario_nombre: currentUser?.nombre_completo || "Operador Despacho",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinoNuevo.trim() || !portadorNuevo.trim()) {
      setErrorMsg("Debe indicar el nuevo destino y portador");
      return;
    }

    mutation.mutate({
      area_id: areaId,
      documento_id: documento.id,
      estado_nuevo: estadoNuevo,
      destino_nuevo: destinoNuevo.trim(),
      portador_nuevo: portadorNuevo.trim(),
      fojas_agregadas: Number(fojasAgregadas) || 0,
      observacion: observacion.trim() || undefined,
      usuario_id: currentUser?.id,
      usuario_nombre: currentUser?.nombre_completo || "Operador Despacho",
    });
  };

  const movimientos = docDetalle?.movimientos || [];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-3.5 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-800/60">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {documento.numero_expediente}
            </span>
            <button
              onClick={handleCopyExpediente}
              title="Copiar N° Expediente"
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white transition"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                getEstadoBadgeClass(documento.estado_actual)
              )}
            >
              {documento.estado_actual}
            </span>
          </div>
          <p className="mt-1 max-w-md truncate text-xs text-slate-600 dark:text-slate-300">
            {documento.iniciador_caratula}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {/* Banner de Salida: El documento ya no está en la oficina */}
        {documento.ultimo_movimiento_at && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 shadow-2xs dark:border-amber-900/60 dark:bg-amber-950/40">
            <div className="flex items-start space-x-2.5">
              <Building className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Documento Fuera de la Oficina (Con Fecha de Salida)
                </h4>
                <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                  Este expediente ya egresó de la Secretaría el{" "}
                  <strong>{new Date(documento.ultimo_movimiento_at).toLocaleDateString("es-AR")}</strong>{" "}
                  hacia <strong>{documento.destino_actual}</strong> (Retiró:{" "}
                  <strong>{documento.portador_actual}</strong>). Por lo tanto, no se encuentra físicamente en el área para pases habituales.
                </p>
              </div>
            </div>

            <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2.5 border-t border-amber-200/80 dark:border-amber-900/60">
              {documento.estado_actual !== "ARCHIVO" ? (
                <button
                  type="button"
                  onClick={handleArchivarDirecto}
                  disabled={mutation.isPending}
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition active:scale-95 shadow-2xs"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>Pasar a Archivo Definitivo</span>
                </button>
              ) : (
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>El expediente se encuentra en Archivo Central</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsReingresoOpen((prev) => !prev)}
                className="inline-flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <span>{isReingresoOpen ? "Ocultar formulario de reingreso" : "Registrar Reingreso Físico a Secretaría"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Rapid Pase Form - Solo visible si está en la oficina o si se abre expresamente para reingreso */}
        {(!documento.ultimo_movimiento_at || isReingresoOpen) && (
        <section className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 shadow-2xs dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />{" "}
              {isReingresoOpen ? "Registrar Reingreso y Nuevo Pase" : "Registrar Nuevo Pase / Movimiento"}
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Fojas actuales: <strong className="text-slate-900 dark:text-white font-mono">{documento.foja_actual}</strong>
            </span>
          </div>

          {errorMsg && (
            <div className="mb-3 flex items-center space-x-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:border-rose-900/60 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              {/* Estado Nuevo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nuevo Estado *
                </label>
                <select
                  value={estadoNuevo}
                  onChange={(e) => setEstadoNuevo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="DESPACHO">DESPACHO</option>
                  <option value="EN MANO">EN MANO</option>
                  <option value="FIRMADO">FIRMADO</option>
                  <option value="OBSERVADO">OBSERVADO</option>
                  <option value="ARCHIVO">ARCHIVO</option>
                  <option value="NOTIFICADO">NOTIFICADO</option>
                  <option value="INICIADO">INICIADO</option>
                </select>
              </div>

              {/* Fojas Agregadas */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fojas Agregadas (+F)
                </label>
                <input
                  type="number"
                  min="0"
                  value={fojasAgregadas}
                  onChange={(e) => setFojasAgregadas(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Destino Nuevo */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Building className="h-3 w-3 text-slate-400" />
                  <span>Ámbito Destino *</span>
                </label>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                  Mesa de destino
                </span>
              </div>
              <input
                type="text"
                list="lista-destinos"
                value={destinoNuevo}
                onChange={(e) => handleDestinoSelect(e.target.value)}
                placeholder="Ej. Despacho de Hacienda / Min. Infraestructura"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
              />
              <datalist id="lista-destinos">
                {catalogosDestinos.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.responsable_defecto ? `(Resp: ${c.responsable_defecto})` : ""}
                  </option>
                ))}
              </datalist>

              {/* Quick Destination Chips */}
              <div className="mt-2 flex flex-wrap gap-1">
                {DESTINOS_RAPIDOS.map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => handleDestinoSelect(dest)}
                    className="rounded border border-blue-200/80 bg-white px-2 py-0.5 text-[10px] font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700 transition"
                  >
                    + {dest}
                  </button>
                ))}
              </div>
            </div>

            {/* Portador Nuevo */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Portador / Retiró / Persona a cargo *
              </label>
              <input
                type="text"
                value={portadorNuevo}
                onChange={(e) => setPortadorNuevo(e.target.value)}
                placeholder="Ej. Vanina Pardo / Betiana Salinas / Dr. Suárez"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Motivo del pase / Observaciones
              </label>
              <textarea
                rows={2}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Ej. A la firma del Ministro para posterior elevación..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

              {/* Quick Observation Chips */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {OBSERVACIONES_RAPIDAS.map((obs) => (
                  <button
                    key={obs}
                    type="button"
                    onClick={() => setObservacion(obs)}
                    className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition"
                  >
                    "{obs}"
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 dark:border-blue-900/40">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Interviene: <strong className="text-slate-900 dark:text-white">{currentUser?.nombre_completo || "Operador"}</strong>
              </span>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{mutation.isPending ? "Guardando..." : "Confirmar Pase"}</span>
              </button>
            </div>
          </form>
        </section>
        )}

        {/* Immutable Audit Trail Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <History className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Historial de Pases y Auditoría
            </h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {movimientos.length} {movimientos.length === 1 ? "movimiento" : "movimientos"}
            </span>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">Cargando trazabilidad...</div>
          ) : movimientos.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">Sin movimientos registrados.</div>
          ) : (
            <div className="relative border-l-2 border-slate-200 pl-4 space-y-4 dark:border-slate-800">
              {movimientos.map((m: Movimiento, index: number) => (
                <div key={m.id} className="relative group">
                  {/* Timeline Dot */}
                  <span
                    className={cn(
                      "absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900",
                      index === 0
                        ? "bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950"
                        : "bg-slate-400"
                    )}
                  />

                  {/* Card Content */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900/90">
                    {/* Header: User + Time */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 dark:border-slate-800/80">
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {m.usuario_nombre}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {m.hora_corta} hs
                        </span>
                        <span>({m.fecha_formateada.split(" ")[0]})</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-500">Pase a:</span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          getEstadoBadgeClass(m.estado_nuevo)
                        )}
                      >
                        {m.estado_nuevo}
                      </span>

                      <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300">
                        <span className="font-medium text-slate-400">Destino:</span>
                        <strong className="text-slate-900 dark:text-slate-100">{m.destino_nuevo}</strong>
                      </div>

                      <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300">
                        <span className="font-medium text-slate-400">Portador:</span>
                        <span>{m.portador_nuevo}</span>
                      </div>

                      {m.fojas_agregadas > 0 && (
                        <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                          +{m.fojas_agregadas} fojas
                        </span>
                      )}
                    </div>

                    {/* Observations */}
                    {m.observacion && (
                      <p className="mt-2.5 text-xs text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        "{m.observacion}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
