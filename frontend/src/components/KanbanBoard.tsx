"use client";

import React, { useState, useMemo } from "react";
import { Documento } from "@/types";
import {
  FileText,
  Clock,
  ArrowRight,
  User,
  AlertTriangle,
  Building,
  Copy,
  Check,
  Plus,
  Send,
  Calendar,
  Layers,
  ChevronDown,
} from "lucide-react";
import { getEstadoBadgeClass, cn } from "@/lib/utils";

interface KanbanBoardProps {
  documentos: Documento[];
  onOpenMovementDrawer: (doc: Documento) => void;
  onSelectDoc: (doc: Documento) => void;
  selectedDocId: number | null;
}

interface KanbanColumn {
  id: string;
  title: string;
  estados: string[];
  color: string;
  borderClass: string;
  badgeClass: string;
  dotColor: string;
}

const COLUMNS: KanbanColumn[] = [
  {
    id: "iniciado",
    title: "Ingreso / Iniciado",
    estados: ["INICIADO"],
    color: "blue",
    borderClass: "border-blue-200 dark:border-blue-900/60",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
    dotColor: "bg-blue-500",
  },
  {
    id: "despacho",
    title: "En Despacho / Trámite",
    estados: ["DESPACHO"],
    color: "amber",
    borderClass: "border-amber-200 dark:border-amber-900/60",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    dotColor: "bg-amber-500",
  },
  {
    id: "en_mano",
    title: "En Mano de Funcionario",
    estados: ["EN MANO"],
    color: "sky",
    borderClass: "border-sky-200 dark:border-sky-900/60",
    badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
    dotColor: "bg-sky-500",
  },
  {
    id: "observado",
    title: "Observado / Subsanar",
    estados: ["OBSERVADO"],
    color: "rose",
    borderClass: "border-rose-200 dark:border-rose-900/60",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
    dotColor: "bg-rose-500",
  },
  {
    id: "firmado",
    title: "Firmado / Resuelto",
    estados: ["FIRMADO"],
    color: "emerald",
    borderClass: "border-emerald-200 dark:border-emerald-900/60",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
  },
  {
    id: "archivo",
    title: "Archivo / Notificado",
    estados: ["ARCHIVO", "NOTIFICADO"],
    color: "slate",
    borderClass: "border-slate-200 dark:border-slate-800",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dotColor: "bg-slate-400",
  },
];

const INITIAL_LIMIT = 30;

export function KanbanBoard({
  documentos,
  onOpenMovementDrawer,
  onSelectDoc,
  selectedDocId,
}: KanbanBoardProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [columnLimits, setColumnLimits] = useState<Record<string, number>>({});

  const handleCopyExpediente = (doc: Documento, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(doc.numero_expediente);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group documents by column
  const groupedDocs = useMemo(() => {
    const groups: Record<string, Documento[]> = {};
    COLUMNS.forEach((col) => {
      groups[col.id] = [];
    });

    documentos.forEach((doc) => {
      const col = COLUMNS.find((c) => c.estados.includes(doc.estado_actual));
      if (col) {
        groups[col.id].push(doc);
      } else {
        // Fallback to Despacho if not explicitly mapped
        groups["despacho"].push(doc);
      }
    });

    return groups;
  }, [documentos]);

  const handleLoadMore = (colId: string) => {
    setColumnLimits((prev) => ({
      ...prev,
      [colId]: (prev[colId] || INITIAL_LIMIT) + 30,
    }));
  };

  return (
    <div className="flex flex-1 overflow-x-auto bg-slate-100/70 p-4 dark:bg-slate-950/90 gap-4">
      {COLUMNS.map((col) => {
        const docsInCol = groupedDocs[col.id] || [];
        const limit = columnLimits[col.id] || INITIAL_LIMIT;
        const visibleDocs = docsInCol.slice(0, limit);
        const hasMore = docsInCol.length > limit;

        return (
          <div
            key={col.id}
            className={cn(
              "flex flex-col w-80 shrink-0 rounded-2xl border bg-white/95 dark:bg-slate-900/95 shadow-sm max-h-full",
              col.borderClass
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", col.dotColor)} />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                  {col.title}
                </h3>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-black font-mono shadow-2xs",
                  col.badgeClass
                )}
              >
                {docsInCol.length.toLocaleString("es-AR")}
              </span>
            </div>

            {/* Cards Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
              {visibleDocs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Sin trámites en esta etapa
                </div>
              ) : (
                visibleDocs.map((doc) => {
                  const isSelected = selectedDocId === doc.id;
                  const isCopied = copiedId === doc.id;

                  // Extract Ámbito from Carátula
                  const matchAmbito = (doc.iniciador_caratula || "").match(/^\[(.*?)\]\s*(.*)$/);
                  const ambito = matchAmbito ? matchAmbito[1] : null;
                  const caratula = matchAmbito ? matchAmbito[2] : doc.iniciador_caratula;

                  return (
                    <div
                      key={doc.id}
                      onClick={() => onSelectDoc(doc)}
                      onDoubleClick={() => onOpenMovementDrawer(doc)}
                      className={cn(
                        "group relative rounded-xl border p-3 shadow-2xs transition-all duration-200 cursor-pointer",
                        "bg-white dark:bg-slate-850 hover:shadow-md hover:-translate-y-0.5",
                        isSelected
                          ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30"
                          : "border-slate-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                      )}
                    >
                      {/* Priority Alert Banner if Urgent */}
                      {doc.prioridad === "URGENTE" && (
                        <div className="mb-2 flex items-center space-x-1 rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[9px] font-black text-rose-700 dark:bg-rose-950/60 dark:border-rose-900/60 dark:text-rose-300 uppercase tracking-wide">
                          <AlertTriangle className="h-2.5 w-2.5 text-rose-600" />
                          <span>Trámite Urgente</span>
                        </div>
                      )}

                      {/* Header: Expediente & Copy */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight">
                          {doc.numero_expediente}
                        </span>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={(e) => handleCopyExpediente(doc, e)}
                            title="Copiar número de expediente"
                            className="rounded p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>

                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {doc.tipo_documento}
                          </span>
                        </div>
                      </div>

                      {/* Ambito Badge */}
                      {ambito && (
                        <div className="mb-1">
                          <span className="inline-block rounded-sm bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                            {ambito}
                          </span>
                        </div>
                      )}

                      {/* Caratula / Resumen */}
                      <p
                        className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 font-medium mb-2"
                        title={doc.iniciador_caratula}
                      >
                        {caratula}
                      </p>

                      {/* Footer Details: Destino, Portador, Fechas */}
                      <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 truncate max-w-[170px]" title={doc.destino_actual}>
                            <Building className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {doc.destino_actual}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-slate-500">
                            F. {doc.foja_actual}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 truncate max-w-[160px]" title={doc.portador_actual}>
                            <User className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{doc.portador_actual}</span>
                          </div>

                          {doc.ultimo_movimiento_at && (
                            <div className="flex items-center space-x-0.5 text-[10px] font-mono">
                              <Clock className="h-2.5 w-2.5 text-slate-400" />
                              <span>{new Date(doc.ultimo_movimiento_at).toLocaleDateString("es-AR")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Pase Button */}
                      <div className="mt-2.5 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenMovementDrawer(doc);
                          }}
                          className="inline-flex items-center space-x-1 rounded-md border border-blue-200 bg-blue-50/70 px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition active:scale-95 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white"
                          title="Registrar nuevo pase de área"
                        >
                          <span>Pase</span>
                          <ArrowRight className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Load More Button for column */}
              {hasMore && (
                <button
                  type="button"
                  onClick={() => handleLoadMore(col.id)}
                  className="w-full flex items-center justify-center space-x-1 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>Ver más ({docsInCol.length - limit} restantes)</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
