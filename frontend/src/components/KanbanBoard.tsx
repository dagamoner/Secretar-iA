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
  Eye,
  EyeOff,
  Layers,
  Archive,
  Search,
  ArrowUpDown,
  Calendar,
  Hourglass,
  CheckCircle2,
  FileCheck,
  Send,
  Sparkles,
} from "lucide-react";
import { cn, normalizeSearchText } from "@/lib/utils";

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
  description: string;
  color: string;
  isOfficeActive: boolean; // True if documents are physically inside Secretaría
  borderClass: string;
  headerBgClass: string;
  badgeClass: string;
  dotColor: string;
}

const COLUMNS: KanbanColumnDef[] = [
  {
    id: "iniciado",
    title: "Ingreso / Iniciado",
    shortTitle: "Iniciado",
    description: "Recepción inicial en mesa",
    color: "blue",
    isOfficeActive: true,
    borderClass: "border-blue-200 dark:border-blue-900/60",
    headerBgClass: "bg-blue-50/70 border-b border-blue-100 dark:bg-blue-950/40 dark:border-blue-900/60",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
    dotColor: "bg-blue-500",
  },
  {
    id: "despacho",
    title: "En Despacho / Trámite",
    shortTitle: "En Despacho",
    description: "Expedientes en trámite ministerial",
    color: "amber",
    isOfficeActive: true,
    borderClass: "border-amber-200 dark:border-amber-900/60",
    headerBgClass: "bg-amber-50/70 border-b border-amber-100 dark:bg-amber-950/40 dark:border-amber-900/60",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    dotColor: "bg-amber-500",
  },
  {
    id: "en_mano",
    title: "En Mano de Funcionario",
    shortTitle: "En Mano",
    description: "En poder directo de autoridades",
    color: "sky",
    isOfficeActive: true,
    borderClass: "border-sky-200 dark:border-sky-900/60",
    headerBgClass: "bg-sky-50/70 border-b border-sky-100 dark:bg-sky-950/40 dark:border-sky-900/60",
    badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
    dotColor: "bg-sky-500",
  },
  {
    id: "observado",
    title: "Observado / Subsanar",
    shortTitle: "Observado",
    description: "Requiere corrección o firma adicional",
    color: "rose",
    isOfficeActive: true,
    borderClass: "border-rose-200 dark:border-rose-900/60",
    headerBgClass: "bg-rose-50/70 border-b border-rose-100 dark:bg-rose-950/40 dark:border-rose-900/60",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
    dotColor: "bg-rose-500",
  },
  {
    id: "firmado",
    title: "Firmado / Resuelto",
    shortTitle: "Firmados",
    description: "Egresados hacia repartición de destino",
    color: "emerald",
    isOfficeActive: false,
    borderClass: "border-emerald-200 dark:border-emerald-900/60",
    headerBgClass: "bg-emerald-50/70 border-b border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/60",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
  },
  {
    id: "archivo",
    title: "Archivo / Notificado",
    shortTitle: "Archivo",
    description: "Guarda temporal o archivo central",
    color: "slate",
    isOfficeActive: false,
    borderClass: "border-slate-200 dark:border-slate-800",
    headerBgClass: "bg-slate-100/70 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dotColor: "bg-slate-400",
  },
];

const INITIAL_LIMIT = 50;

type ScopeMode = "OFICINA" | "TODOS";
type DensityMode = "DETALLADA" | "COMPACTA";
type SortMode = "RECIENTES" | "ANTIGUOS" | "PRIORIDAD" | "EXPEDIENTE";

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
  const [scopeMode, setScopeMode] = useState<ScopeMode>("OFICINA");
  const [densityMode, setDensityMode] = useState<DensityMode>("DETALLADA");
  const [sortMode, setSortMode] = useState<SortMode>("RECIENTES");
  const [kanbanSearch, setKanbanSearch] = useState<string>("");
  const [hideEmptyColumns, setHideEmptyColumns] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleCopyExpediente = (doc: Documento, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(doc.numero_expediente);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group and sort documents
  const groupedDocs = useMemo(() => {
    const groups: Record<string, Documento[]> = {};
    COLUMNS.forEach((col) => {
      groups[col.id] = [];
    });

    const searchNorm = normalizeSearchText(kanbanSearch);

    documentos.forEach((doc) => {
      // Local quick search filter if typed
      if (searchNorm) {
        const num = normalizeSearchText(doc.numero_expediente);
        const cara = normalizeSearchText(doc.iniciador_caratula);
        const port = normalizeSearchText(doc.portador_actual);
        const dest = normalizeSearchText(doc.destino_actual);
        if (!num.includes(searchNorm) && !cara.includes(searchNorm) && !port.includes(searchNorm) && !dest.includes(searchNorm)) {
          return;
        }
      }

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
        // Fallback: if it has an exit date -> firmado, else -> despacho
        if (doc.ultimo_movimiento_at) {
          groups["firmado"].push(doc);
        } else {
          groups["despacho"].push(doc);
        }
      }
    });

    // Apply sorting to each column
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        if (sortMode === "PRIORIDAD") {
          const score = (d: Documento) => (d.prioridad === "URGENTE" ? 3 : d.prioridad === "PRONTO DESPACHO" ? 2 : 1);
          const diff = score(b) - score(a);
          if (diff !== 0) return diff;
        }

        if (sortMode === "EXPEDIENTE") {
          return (a.numero_expediente || "").localeCompare(b.numero_expediente || "");
        }

        const timeA = a.ultimo_movimiento_at
          ? new Date(a.ultimo_movimiento_at).getTime()
          : a.fecha_ingreso
          ? new Date(a.fecha_ingreso).getTime()
          : 0;
        const timeB = b.ultimo_movimiento_at
          ? new Date(b.ultimo_movimiento_at).getTime()
          : b.fecha_ingreso
          ? new Date(b.fecha_ingreso).getTime()
          : 0;

        if (sortMode === "ANTIGUOS") {
          return timeA - timeB;
        }
        // Default: RECIENTES
        return timeB - timeA;
      });
    });

    return groups;
  }, [documentos, kanbanSearch, sortMode]);

  // Total active in office count
  const activeInOfficeCount = useMemo(() => {
    return (
      (groupedDocs["iniciado"]?.length || 0) +
      (groupedDocs["despacho"]?.length || 0) +
      (groupedDocs["en_mano"]?.length || 0) +
      (groupedDocs["observado"]?.length || 0)
    );
  }, [groupedDocs]);

  const handleLoadMore = (colId: string) => {
    setColumnLimits((prev) => ({
      ...prev,
      [colId]: (prev[colId] || INITIAL_LIMIT) + 50,
    }));
  };

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -380, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 380, behavior: "smooth" });
  };

  // Visible columns based on Scope Mode and Filters
  const visibleColumns = useMemo(() => {
    if (selectedColumnFilter !== "TODOS") {
      return COLUMNS.filter((c) => c.id === selectedColumnFilter);
    }

    let cols = COLUMNS;
    if (scopeMode === "OFICINA") {
      cols = cols.filter((c) => c.isOfficeActive);
    }

    if (hideEmptyColumns) {
      const populated = cols.filter((c) => (groupedDocs[c.id]?.length || 0) > 0);
      return populated.length > 0 ? populated : cols;
    }

    return cols;
  }, [selectedColumnFilter, scopeMode, hideEmptyColumns, groupedDocs]);

  // Helper for computing days in office
  const getDaysInOffice = (fechaIngreso?: string) => {
    if (!fechaIngreso) return null;
    try {
      const ms = Date.now() - new Date(fechaIngreso).getTime();
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      return Math.max(days, 0);
    } catch {
      return null;
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-100/70 dark:bg-slate-950">
      {/* Slim Kanban Controls Toolbar */}
      <div className="flex items-center justify-between gap-2.5 border-b border-slate-200/90 bg-white/95 px-4 py-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 shadow-2xs">
        {/* Left Side: Scope Switcher (En Oficina vs Historial) */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => {
                setScopeMode("OFICINA");
                setSelectedColumnFilter("TODOS");
              }}
              className={cn(
                "inline-flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition active:scale-95",
                scopeMode === "OFICINA"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              )}
              title="Mostrar únicamente los trámites físicos actualmente en la Secretaría"
            >
              <Building className="h-3.5 w-3.5" />
              <span>En Oficina</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-mono font-black",
                  scopeMode === "OFICINA"
                    ? "bg-blue-700 text-white"
                    : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                )}
              >
                {activeInOfficeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScopeMode("TODOS");
                setSelectedColumnFilter("TODOS");
              }}
              className={cn(
                "inline-flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition active:scale-95",
                scopeMode === "TODOS"
                  ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              )}
              title="Mostrar el historial completo con trámites firmados y archivados"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Historial Completo</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-mono font-black",
                  scopeMode === "TODOS"
                    ? "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900"
                    : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                )}
              >
                {documentos.length.toLocaleString("es-AR")}
              </span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            {scopeMode === "OFICINA" ? "4 etapas operativas activas" : "Todas las etapas del circuito ministerial"}
          </span>
        </div>

        {/* Right Side: Sort, Density & Column Scroll */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Sort Selector */}
          <div className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
            <ArrowUpDown className="h-3 w-3 text-slate-400" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="cursor-pointer bg-transparent text-[11px] font-semibold text-slate-700 focus:outline-none dark:text-slate-200"
              title="Criterio de ordenamiento de tarjetas"
            >
              <option value="RECIENTES">Más recientes</option>
              <option value="ANTIGUOS">Más antiguos (demoras)</option>
              <option value="PRIORIDAD">Mayor prioridad</option>
              <option value="EXPEDIENTE">N° de Expediente</option>
            </select>
          </div>

          {/* Density Toggle (Detallada vs Compacta) */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setDensityMode("DETALLADA")}
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-bold transition",
                densityMode === "DETALLADA"
                  ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              )}
              title="Vista Detallada: muestra extracto completo, tiempos y dependencias"
            >
              Detalle
            </button>
            <button
              type="button"
              onClick={() => setDensityMode("COMPACTA")}
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-bold transition",
                densityMode === "COMPACTA"
                  ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              )}
              title="Vista Compacta: máxima densidad visual para escaneo rápido"
            >
              Compacto
            </button>
          </div>

          {/* Toggle Hide Empty */}
          {selectedColumnFilter === "TODOS" && (
            <button
              type="button"
              onClick={() => setHideEmptyColumns((prev) => !prev)}
              className={cn(
                "inline-flex items-center space-x-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition",
                hideEmptyColumns
                  ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              )}
              title="Ocultar columnas sin trámites para aprovechar mejor la pantalla"
            >
              {hideEmptyColumns ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              <span className="hidden lg:inline">{hideEmptyColumns ? "Ver vacías" : "Ocultar vacías"}</span>
            </button>
          )}

          {/* Scroll Nav Buttons */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={scrollLeft}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-2xs transition"
              title="Desplazar hacia la izquierda"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-2xs transition"
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
          "flex flex-1 overflow-x-auto p-4 gap-4 items-start",
          selectedColumnFilter !== "TODOS" && "justify-center"
        )}
      >
        {visibleColumns.map((col) => {
          const docsInCol = groupedDocs[col.id] || [];
          const limit = columnLimits[col.id] || INITIAL_LIMIT;
          const visibleDocs = docsInCol.slice(0, limit);
          const hasMore = docsInCol.length > limit;
          const isSingleView = selectedColumnFilter === col.id;
          const urgentInCol = docsInCol.filter((d) => d.prioridad === "URGENTE" || d.prioridad === "PRONTO DESPACHO").length;

          return (
            <div
              key={col.id}
              className={cn(
                "flex flex-col shrink-0 rounded-2xl border bg-slate-50/80 dark:bg-slate-900/80 shadow-xs max-h-[calc(100vh-140px)] transition-all",
                isSingleView ? "w-full max-w-5xl" : "w-[330px]",
                col.borderClass
              )}
            >
              {/* Column Header */}
              <div className={cn("px-4 py-3 rounded-t-2xl", col.headerBgClass)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0 shadow-xs", col.dotColor)} />
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {col.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">
                        {col.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-black font-mono shadow-2xs",
                        col.badgeClass
                      )}
                    >
                      {docsInCol.length.toLocaleString("es-AR")}
                    </span>

                    {isSingleView && (
                      <button
                        type="button"
                        onClick={() => setSelectedColumnFilter("TODOS")}
                        className="text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400 ml-1"
                      >
                        Ver todas
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-bar with Column Alerts if Urgencies exist */}
                {urgentInCol > 0 && (
                  <div className="mt-2 flex items-center justify-between rounded-md bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/50 dark:border-rose-900/50 dark:text-rose-300">
                    <span className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3 text-rose-600" />
                      <span>{urgentInCol} con prioridad alta</span>
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider">Atención</span>
                  </div>
                )}
              </div>

              {/* Cards Container */}
              <div
                className={cn(
                  "flex-1 overflow-y-auto p-2.5 space-y-2.5",
                  isSingleView && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 space-y-0"
                )}
              >
                {visibleDocs.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-xs text-slate-400">
                    <FileText className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-60" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">Sin trámites en esta etapa</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {kanbanSearch
                        ? "Ningún trámite coincide con la búsqueda"
                        : "Los expedientes asignados aquí se listarán automáticamente"}
                    </p>
                  </div>
                ) : (
                  visibleDocs.map((doc) => {
                    const isSelected = selectedDocId === doc.id;
                    const isCopied = copiedId === doc.id;
                    const isUrgent = doc.prioridad === "URGENTE";
                    const isProntoDespacho = doc.prioridad === "PRONTO DESPACHO";
                    const hasSalida = Boolean(doc.ultimo_movimiento_at);
                    const daysInOffice = getDaysInOffice(doc.fecha_ingreso);

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
                          "group relative rounded-xl border transition-all duration-150 cursor-pointer overflow-hidden",
                          "bg-white dark:bg-slate-850 hover:shadow-md hover:-translate-y-0.5",
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/40 dark:bg-blue-950/40 shadow-sm"
                            : "border-slate-200/90 dark:border-slate-800 shadow-2xs",
                          // Priority left accent stripe
                          isUrgent && "border-l-4 border-l-rose-500",
                          isProntoDespacho && "border-l-4 border-l-amber-500",
                          densityMode === "COMPACTA" ? "p-2.5" : "p-3.5"
                        )}
                      >
                        {/* Header: Priority & Type Badges + Copy Expediente */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center space-x-1.5 truncate">
                            {/* Priority Badge */}
                            {isUrgent && (
                              <span className="inline-flex items-center space-x-0.5 rounded px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800 shadow-2xs animate-pulse">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                <span>URGENTE</span>
                              </span>
                            )}
                            {isProntoDespacho && (
                              <span className="inline-flex items-center space-x-0.5 rounded px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800 shadow-2xs">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                <span>PRONTO DESP.</span>
                              </span>
                            )}

                            {/* Document Type Badge */}
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.2 text-[9px] font-bold tracking-tight uppercase shadow-2xs",
                                doc.tipo_documento === "EXPEDIENTE"
                                  ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  : doc.tipo_documento === "RESOLUCION"
                                  ? "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
                                  : doc.tipo_documento === "DECRETO"
                                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                  : doc.tipo_documento === "NOTA"
                                  ? "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              )}
                            >
                              {doc.tipo_documento}
                            </span>
                          </div>

                          {/* Foja count */}
                          <span
                            className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded shrink-0"
                            title={`${doc.foja_actual} fojas totales`}
                          >
                            {doc.foja_actual} fs
                          </span>
                        </div>

                        {/* Title: Número de Expediente + Quick Copy */}
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-mono text-xs font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {doc.numero_expediente}
                          </h4>

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
                        </div>

                        {/* Ámbito Origen Pill */}
                        {ambito && (
                          <div className="mb-1.5">
                            <span className="inline-flex items-center space-x-1 rounded bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              <Building className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[240px]">{ambito}</span>
                            </span>
                          </div>
                        )}

                        {/* Extracto / Carátula */}
                        <p
                          className={cn(
                            "text-slate-700 dark:text-slate-300 font-medium leading-snug mb-2",
                            densityMode === "COMPACTA"
                              ? "text-[11px] truncate"
                              : "text-xs line-clamp-2"
                          )}
                          title={doc.iniciador_caratula}
                        >
                          {caratula}
                        </p>

                        {/* Metadata Footer: Fechas, Antigüedad, Portador */}
                        <div
                          className={cn(
                            "pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400",
                            densityMode === "COMPACTA" ? "space-y-1" : "space-y-1.5"
                          )}
                        >
                          {/* Row 1: Ubicación & Portador */}
                          <div className="flex items-center justify-between gap-1">
                            <div
                              className="flex items-center space-x-1 truncate max-w-[190px]"
                              title={`Portador actual: ${doc.portador_actual}`}
                            >
                              <User className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="font-semibold truncate text-slate-800 dark:text-slate-200">
                                {doc.portador_actual}
                              </span>
                            </div>

                            {/* Destination or Area tag */}
                            <span
                              className="truncate text-[10px] text-slate-500 dark:text-slate-400 max-w-[100px] text-right font-medium"
                              title={`Destino: ${doc.destino_actual}`}
                            >
                              {doc.destino_actual}
                            </span>
                          </div>

                          {/* Row 2: Fechas & Antigüedad */}
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            {/* Fecha de Entrada */}
                            <div
                              className="flex items-center space-x-1 text-slate-500 dark:text-slate-400"
                              title="Fecha de ingreso a la Secretaría Privada"
                            >
                              <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>
                                {doc.fecha_ingreso ? new Date(doc.fecha_ingreso).toLocaleDateString("es-AR") : "-"}
                              </span>
                            </div>

                            {/* Status or Days in Office */}
                            {!hasSalida ? (
                              <span
                                className={cn(
                                  "inline-flex items-center space-x-0.5 rounded px-1.5 py-0.2 font-semibold",
                                  daysInOffice !== null && daysInOffice > 15
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                    : daysInOffice !== null && daysInOffice > 5
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                )}
                                title={`Tiempo transcurrido desde el ingreso (${daysInOffice ?? 0} días)`}
                              >
                                <Hourglass className="h-2.5 w-2.5" />
                                <span>{daysInOffice !== null ? `${daysInOffice}d en área` : "En trámite"}</span>
                              </span>
                            ) : (
                              <div
                                className="flex items-center space-x-0.5 text-slate-600 dark:text-slate-400 font-semibold"
                                title="Fecha y hora de salida de la secretaría"
                              >
                                <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{new Date(doc.ultimo_movimiento_at!).toLocaleDateString("es-AR")}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Action Button Bar */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">
                            #{doc.id}
                          </span>

                          <div className="flex items-center space-x-1.5">
                            {hasSalida ? (
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
                                  className="inline-flex items-center space-x-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-2xs"
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
                                className="inline-flex items-center space-x-1 rounded-md border border-blue-300 bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-700 hover:border-blue-700 transition active:scale-95 shadow-xs"
                                title="Registrar nuevo pase de área o funcionario (trámite en oficina)"
                              >
                                <span>Pase</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
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
                      className="w-full flex items-center justify-center space-x-1.5 rounded-xl border border-dashed border-slate-300 bg-white/50 py-2.5 text-xs font-bold text-slate-700 hover:bg-white hover:border-slate-400 transition dark:border-slate-700 dark:bg-slate-850 dark:text-slate-300 dark:hover:bg-slate-800 shadow-2xs"
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
