"use client";

import React, { useState } from "react";
import { Documento, Movimiento } from "@/types";
import {
  X,
  Printer,
  Edit3,
  ArrowRight,
  Archive,
  Copy,
  Check,
  Building,
  User,
  Calendar,
  Clock,
  Hourglass,
  FileText,
  AlertTriangle,
  History,
  CheckCircle2,
  FileCheck,
  Send,
  Share2,
} from "lucide-react";
import { cn, getEstadoBadgeClass } from "@/lib/utils";

interface DocumentInspectorPanelProps {
  documento: Documento | null;
  onClose: () => void;
  onOpenMovementDrawer: (doc: Documento) => void;
  onOpenReceiptModal: (doc: Documento) => void;
  onArchivarDoc?: (doc: Documento) => void;
  onOpenEditModal?: (doc: Documento) => void;
}

export function DocumentInspectorPanel({
  documento,
  onClose,
  onOpenMovementDrawer,
  onOpenReceiptModal,
  onArchivarDoc,
  onOpenEditModal,
}: DocumentInspectorPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!documento) return null;

  const hasSalida = Boolean(documento.ultimo_movimiento_at);

  const handleCopy = () => {
    navigator.clipboard.writeText(documento.numero_expediente);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute days in office
  let daysInOffice: number | null = null;
  if (documento.fecha_ingreso) {
    try {
      const end = documento.ultimo_movimiento_at
        ? new Date(documento.ultimo_movimiento_at).getTime()
        : Date.now();
      const ms = end - new Date(documento.fecha_ingreso).getTime();
      daysInOffice = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
    } catch {}
  }

  // Extract Ámbito from Carátula
  const matchAmbito = (documento.iniciador_caratula || "").match(/^\[(.*?)\]\s*(.*)$/);
  const ambito = matchAmbito ? matchAmbito[1] : null;
  const caratula = matchAmbito ? matchAmbito[2] : documento.iniciador_caratula;

  return (
    <aside className="w-88 sm:w-96 border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col h-full shadow-lg z-20 shrink-0 animate-in slide-in-from-right duration-200">
      {/* Panel Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
        <div className="flex items-center space-x-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/escudo-mendoza.svg"
            alt="Gobierno de Mendoza"
            className="h-5 w-auto dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/escudo-mendoza-white.svg"
            alt="Gobierno de Mendoza"
            className="h-5 w-auto hidden dark:block"
          />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-rem">
            Ficha Ejecutiva SPMG
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {onOpenEditModal && (
            <button
              type="button"
              onClick={() => onOpenEditModal(documento)}
              title="Editar datos del trámite"
              className="rounded-lg p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 dark:hover:text-amber-400 transition cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenReceiptModal(documento)}
            title="Imprimir volante oficial de remito con código QR"
            className="rounded-lg p-1.5 text-slate-500 hover:text-[#000f9f] hover:bg-blue-50 dark:hover:bg-slate-800 dark:hover:text-[#3cb4e5] transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Cerrar panel de inspección (Esc)"
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Priority Banner if High */}
        {(documento.prioridad === "URGENTE" || documento.prioridad === "PRONTO DESPACHO") && (
          <div className="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200 p-2.5 dark:bg-rose-950/50 dark:border-rose-900/60">
            <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider block">
                  PRIORIDAD MÁXIMA
                </span>
                <span className="text-xs font-bold">{documento.prioridad}</span>
              </div>
            </div>
            <span className="rounded bg-rose-200 px-2 py-0.5 text-[9px] font-mono font-black text-rose-900 dark:bg-rose-900 dark:text-rose-100 uppercase">
              Atención
            </span>
          </div>
        )}

        {/* Identification Block */}
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase shadow-2xs",
                documento.tipo_documento === "EXPEDIENTE"
                  ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  : documento.tipo_documento === "RESOLUCION"
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
                  : documento.tipo_documento === "DECRETO"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  : "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
              )}
            >
              {documento.tipo_documento}
            </span>

            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                getEstadoBadgeClass(documento.estado_actual)
              )}
            >
              {documento.estado_actual}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-2.5 dark:bg-slate-800/80 dark:border-slate-700 mt-2">
            <div className="font-mono text-sm font-black text-slate-900 dark:text-white break-all">
              {documento.numero_expediente}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition shrink-0 ml-2"
              title="Copiar número"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Ámbito Origen & Carátula */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Caratulado y Resumen
          </span>
          {ambito && (
            <div className="mb-1.5">
              <span className="inline-flex items-center space-x-1 rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300">
                <Building className="h-3 w-3" />
                <span>Origen: {ambito}</span>
              </span>
            </div>
          )}
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
            {caratula || "Sin carátula especificada"}
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-xl border border-slate-200 p-2.5 bg-white dark:border-slate-800 dark:bg-slate-850">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
              Fojas Registradas
            </span>
            <span className="font-mono text-base font-black text-slate-900 dark:text-white">
              {documento.foja_actual} <span className="text-xs text-slate-400 font-normal">fs.</span>
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 p-2.5 bg-white dark:border-slate-800 dark:bg-slate-850">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
              Permanencia
            </span>
            {daysInOffice !== null ? (
              <span
                className={cn(
                  "font-mono text-base font-black",
                  daysInOffice > 15
                    ? "text-rose-600 dark:text-rose-400"
                    : daysInOffice > 5
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {daysInOffice} <span className="text-xs font-normal">días</span>
              </span>
            ) : (
              <span className="text-slate-400 text-xs">-</span>
            )}
          </div>
        </div>

        {/* Ubicación Actual & Portador */}
        <div className="rounded-xl border border-slate-200 p-3 bg-white dark:border-slate-800 dark:bg-slate-850 space-y-2 text-xs">
          <div className="flex items-start space-x-2">
            <Building className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Destino / Repartición
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {documento.destino_actual || "Secretaría Privada"}
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <User className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Portador / Responsable
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {documento.portador_actual || "Mesa de Entradas"}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Stepper de Movimientos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <History className="h-3 w-3" />
              <span>Línea de Tiempo del Trámite</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {documento.movimientos?.length || 1} registros
            </span>
          </div>

          <div className="relative pl-5 space-y-4 border-l-2 border-blue-200 dark:border-blue-900 ml-2 py-1">
            {/* Movimiento 1: Ingreso */}
            <div className="relative">
              <div className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 shadow-xs dark:border-slate-900" />
              <div className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Ingreso a Secretaría Privada
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {documento.fecha_ingreso ? new Date(documento.fecha_ingreso).toLocaleDateString("es-AR") : "-"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Caratulación y recepción en mesa de entradas
                </p>
              </div>
            </div>

            {/* Movimientos adicionales si existen */}
            {documento.movimientos &&
              documento.movimientos.map((m, idx) => (
                <div key={m.id || idx} className="relative">
                  <div className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-500 shadow-xs dark:border-slate-900" />
                  <div className="text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Pase a {m.destino_nuevo}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {m.fecha_hora ? new Date(m.fecha_hora).toLocaleDateString("es-AR") : "-"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {m.observacion || `Intervención de ${m.usuario_nombre}`}
                    </p>
                  </div>
                </div>
              ))}

            {/* Salida / Egreso si ocurrió */}
            {hasSalida && (
              <div className="relative">
                <div className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-600 shadow-xs dark:border-slate-900" />
                <div className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      Egreso / Salida Registrada
                    </span>
                    <span className="font-mono text-[10px] text-emerald-600 font-bold">
                      {new Date(documento.ultimo_movimiento_at!).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hacia {documento.destino_actual} con retiro de {documento.portador_actual}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="border-t border-slate-200 p-3.5 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 space-y-2">
        {onOpenEditModal && (
          <button
            type="button"
            onClick={() => onOpenEditModal(documento)}
            className="w-full flex items-center justify-center space-x-1.5 rounded-xl border border-amber-300/80 bg-amber-50/70 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100/80 shadow-2xs active:scale-95 transition dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/40 cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>Editar Datos del Trámite</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onOpenReceiptModal(documento)}
            className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs active:scale-95 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Remito Oficial</span>
          </button>

          {hasSalida ? (
            <button
              type="button"
              onClick={() => onArchivarDoc?.(documento)}
              className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-800 hover:text-white shadow-2xs active:scale-95 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archivar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenMovementDrawer(documento)}
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-[#000f9f] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#000966] active:scale-95 transition cursor-pointer dark:bg-[#3cb4e5] dark:text-slate-950 dark:hover:bg-[#32a2cf]"
            >
              <span>Registrar Pase</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
