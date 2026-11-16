"use client";

import React, { useState, useMemo, useRef } from "react";
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Archive,
} from "lucide-react";
import { getEstadoBadgeClass, cn } from "@/lib/utils";

interface KanbanBoardProps {
  documentos: Documento[];
  onOpenMovementDrawer: (doc: Documento) => void;
  onSelectDoc: (doc: Documento) => void;
  selectedDocId: number | null;
  onArchivarDoc?: (doc: Documento) => void;
}

interface KanbanColumnDef {
  id: string;
  title: string;
  shortTitle: string;
  estados: string[];
  color: string;
  borderClass: string;
  badgeClass: string;
  dotColor: string;
}

const COLUMNS: KanbanColumnDef[] = [
  {
    id: "iniciado",
    title: "Ingreso / Iniciado",
    shortTitle: "Iniciado",
    estados: ["INICIADO"],
    color: "blue",
    borderClass: "border-blue-200 dark:border-blue-900/60",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
    dotColor: "bg-blue-500",
  },
  {
    id: "despacho",
    title: "En Despacho / Trámite",
    shortTitle: "Despacho",
    estados: ["DESPACHO"],
    color: "amber",
    borderClass: "border-amber-200 dark:border-amber-900/60",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    dotColor: "bg-amber-500",
  },
  {
    id: "en_mano",
    title: "En Mano de Funcionario",
    shortTitle: "En Mano",
    estados: ["EN MANO"],
    color: "sky",
    borderClass: "border-sky-200 dark:border-sky-900/60",
    badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
    dotColor: "bg-sky-500",
  },
  {
    id: "observado",
    title: "Observado / Subsanar",
    shortTitle: "Observado",
    estados: ["OBSERVADO"],
    color: "rose",
    borderClass: "border-rose-200 dark:border-rose-900/60",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
    dotColor: "bg-rose-500",
  },
  {
    id: "firmado",
    title: "Firmado / Resuelto",
    shortTitle: "Firmado",
    estados: ["FIRMADO"],
    color: "emerald",
    borderClass: "border-emerald-200 dark:border-emerald-900/60",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
  },
  {
    id: "archivo",
    title: "Archivo / Notificado",
    shortTitle: "Archivo",
    estados: ["ARCHIVO", "NOTIFICADO"],
    color: "slate",
    borderClass: "border-slate-200 dark:border-slate-800",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dotColor: "bg-slate-400",
  },
];

const INITIAL_LIMIT = 40;

export function KanbanBoard({
  documentos,
  onOpenMovementDrawer,
  onSelectDoc,
  selectedDocId,
  onArchivarDoc,
}: KanbanBoardProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [columnLimits, setColumnLimits] = useState<Record<string, number>>({});
  const [selectedColumnFilter, setSelectedColumnFilter] = useState<string>("TODOS");
  const [hideEmptyColumns, setHideEmptyColumns] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleCopyExpediente = (doc: Documento, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(doc.numero_expediente);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group documents by column with normalized matching
  const groupedDocs = useMemo(() => {
    const groups: Record<string, Documento[]> = {};
    COLUMNS.forEach((col) => {
      groups[col.id] = [];
    });

    documentos.forEach((doc) => {
      const st = (doc.estado_actual || "").trim().toUpperCase();

      if (st.includes("FIRMA")) {
        groups["firmado"].push(doc);
      } else if (st.includes("DESPACHO")) {
        groups["despacho"].push(doc);
      } else if (st.includes("MANO")) {
        groups["en_mano"].push(doc);
      } else if (st.includes("OBSERVA")) {
        groups["observado"].push(doc);
      } else if (st.includes("ARCHIV") || st.includes("NOTIF")) {
        groups["archivo"].push(doc);
      } else if (st.includes("INICI")) {
        groups["iniciado"].push(doc);
      } else {
        // Fallback to despacho
        groups["despacho"].push(doc);
      }
    });

    return groups;
  }, [documentos]);

  const handleLoadMore = (colId: string) => {
    setColumnLimits((prev) => ({
      ...prev,
      [colId]: (prev[colId] || INITIAL_LIMIT) + 40,
    }));
  };

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -360, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 360, behavior: "smooth" });
  };

  // Filter columns based on user selection or empty hiding
  const visibleColumns = useMemo(() => {
    if (selectedColumnFilter !== "TODOS") {
      return COLUMNS.filter((c) => c.id === selectedColumnFilter);
    }
    if (hideEmptyColumns) {
      const populated = COLUMNS.filter((c) => (groupedDocs[c.id]?.length || 0) > 0);
      return populated.length > 0 ? populated : COLUMNS;
    }
    return COLUMNS;
  }, [selectedColumnFilter, hideEmptyColumns, groupedDocs]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-950">
      {/* Stage Navigation & Quick Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/90 bg-white/95 px-4 py-2.5 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95 shadow-2xs">
        {/* Stage Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 hidden sm:inline">
            Etapas:
          </span>

          <button
            type="button"
            onClick={() => setSelectedColumnFilter("TODOS")}
            className={cn(
              "flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition active:scale-95 shrink-0",
              selectedColumnFilter === "TODOS"
                ? "bg-slate-900 text-white shadow-2xs dark:bg-white dark:text-slate-900"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            )}
          >
            <span>Todas</span>
            <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-black text-slate-800 dark:bg-slate-700 dark:text-slate-200 font-mono">
              {documentos.length.toLocaleString("es-AR")}
            </span>
          </button>

          {COLUMNS.map((col) => {
            const count = groupedDocs[col.id]?.length || 0;
            const isSelected = selectedColumnFilter === col.id;

            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setSelectedColumnFilter(col.id)}
                className={cn(
                  "flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition active:scale-95 shrink-0 border",
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : count > 0
                    ? "bg-white text-slate-800 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                    : "bg-slate-50/60 text-slate-400 border-slate-200 hover:bg-slate-100 dark:bg-slate-850 dark:text-slate-500 dark:border-slate-800"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full shrink-0", col.dotColor)} />
                <span>{col.shortTitle}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-black font-mono",
                    isSelected
                      ? "bg-blue-700 text-white"
                      : count > 0
                      ? col.badgeClass
                      : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  )}
                >
                  {count.toLocaleString("es-AR")}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Controls: Hide empty columns toggle & scroll arrows */}
        <div className="flex items-center space-x-2 shrink-0">
          {selectedColumnFilter === "TODOS" && (
            <button
              type="button"
              onClick={() => setHideEmptyColumns((prev) => !prev)}
              className={cn(
                "inline-flex items-center space-x-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
                hideEmptyColumns
                  ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              )}
              title="Ocultar columnas sin trámites para aprovechar mejor la pantalla"
            >
              {hideEmptyColumns ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              <span>{hideEmptyColumns ? "Ver columnas vacías" : "Ocultar vacías"}</span>
            </button>
          )}

          {/* Scroll Nav Buttons */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={scrollLeft}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              title="Desplazar hacia la izquierda"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              title="Desplazar hacia la derecha"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Kanban Columns Scroll Area */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex flex-1 overflow-x-auto p-4 gap-4",
          selectedColumnFilter !== "TODOS" && "justify-center"
        )}
      >
        {visibleColumns.map((col) => {
          const docsInCol = groupedDocs[col.id] || [];
          const limit = columnLimits[col.id] || INITIAL_LIMIT;
          const visibleDocs = docsInCol.slice(0, limit);
          const hasMore = docsInCol.length > limit;
          const isSingleView = selectedColumnFilter === col.id;

          return (
            <div
              key={col.id}
              className={cn(
                "flex flex-col shrink-0 rounded-2xl border bg-white/95 dark:bg-slate-900/95 shadow-sm max-h-full transition-all",
                isSingleView ? "w-full max-w-5xl" : "w-84",
                col.borderClass
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 rounded-t-2xl">
                <div className="flex items-center space-x-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0 shadow-xs", col.dotColor)} />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {col.title}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-black font-mono shadow-2xs",
                      col.badgeClass
                    )}
                  >
                    {docsInCol.length.toLocaleString("es-AR")} trámites
                  </span>
                  {isSingleView && (
                    <button
                      type="button"
                      onClick={() => setSelectedColumnFilter("TODOS")}
                      className="text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Volver a todas
                    </button>
                  )}
                </div>
              </div>

              {/* Cards Container */}
              <div
                className={cn(
                  "flex-1 overflow-y-auto p-3 space-y-3",
                  isSingleView && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 space-y-0"
                )}
              >
                {visibleDocs.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-xs text-slate-400">
                    <FileText className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-500">Sin trámites en esta etapa</p>
                    <p className="text-[11px] text-slate-400">
                      Los expedientes en este estado aparecerán aquí automáticamente
                    </p>
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
                          "group relative rounded-xl border p-3.5 shadow-2xs transition-all duration-150 cursor-pointer",
                          "bg-white dark:bg-slate-850 hover:shadow-md hover:border-blue-400",
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30"
                            : "border-slate-200/90 dark:border-slate-800"
                        )}
                      >
                        {/* Priority Alert Banner if Urgent */}
                        {(doc.prioridad === "URGENTE" || doc.prioridad === "PRONTO DESPACHO") && (
                          <div className="mb-2 flex items-center space-x-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[9px] font-black text-rose-700 dark:bg-rose-950/60 dark:border-rose-900/60 dark:text-rose-300 uppercase tracking-wide">
                            <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
                            <span>{doc.prioridad}</span>
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
                              className="rounded p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
                            <span className="inline-block rounded bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                              {ambito}
                            </span>
                          </div>
                        )}

                        {/* Caratula / Resumen */}
                        <p
                          className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 font-medium mb-2.5"
                          title={doc.iniciador_caratula}
                        >
                          {caratula}
                        </p>

                        {/* Footer Details: Destino, Portador, Fechas */}
                        <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center justify-between">
                            <div
                              className="flex items-center space-x-1 truncate max-w-[190px]"
                              title={doc.destino_actual}
                            >
                              <Building className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {doc.destino_actual}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              F. {doc.foja_actual}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div
                              className="flex items-center space-x-1 truncate max-w-[180px]"
                              title={doc.portador_actual}
                            >
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

                        {/* Action: Pase or Archivar Button */}
                        <div className="mt-2.5 flex items-center justify-end">
                          {doc.ultimo_movimiento_at ? (
                            doc.estado_actual === "ARCHIVO" ? (
                              <span className="inline-flex items-center space-x-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                                <Archive className="h-3 w-3" />
                                <span>Archivado</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onArchivarDoc?.(doc);
                                }}
                                className="inline-flex items-center space-x-1 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-2xs"
                                title={`El trámite ya egresó hacia ${doc.destino_actual || "su destino"}. Pasar a Archivo definitivo.`}
                              >
                                <Archive className="h-3 w-3 text-slate-500" />
                                <span>Archivar</span>
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenMovementDrawer(doc);
                              }}
                              className="inline-flex items-center space-x-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition active:scale-95 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white shadow-2xs"
                              title="Registrar nuevo pase de área (trámite en oficina)"
                            >
                              <span>Pase</span>
                              <ArrowRight className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Load More Button */}
                {hasMore && (
                  <div className={cn("pt-2", isSingleView && "col-span-full")}>
                    <button
                      type="button"
                      onClick={() => handleLoadMore(col.id)}
                      className="w-full flex items-center justify-center space-x-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 shadow-2xs"
                    >
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                      <span>Cargar más trámites ({docsInCol.length - limit} restantes)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
