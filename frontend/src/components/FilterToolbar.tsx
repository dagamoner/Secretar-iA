"use client";

import React, { useRef, useEffect, useState } from "react";
import { FilterState } from "@/types";
import {
  Search,
  X,
  RotateCcw,
  BarChart3,
  Table as TableIcon,
  LayoutGrid,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Building,
  User,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterToolbarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  destinosDisponibles: string[];
  portadoresDisponibles: string[];
  totalRegistros: number;
  focusSearchTrigger: number;
  currentUserName?: string;
  stats?: {
    total: number;
    firmados: number;
    despacho: number;
    enMano: number;
    observados: number;
    urgentes: number;
    misTramites: number;
  };
  onOpenDashboard?: () => void;
  viewMode?: "tabla" | "kanban";
  onViewModeChange?: (mode: "tabla" | "kanban") => void;
}

export function FilterToolbar({
  filters,
  onFilterChange,
  destinosDisponibles,
  portadoresDisponibles,
  totalRegistros,
  focusSearchTrigger,
  currentUserName,
  stats,
  onOpenDashboard,
  viewMode = "tabla",
  onViewModeChange,
}: FilterToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  useEffect(() => {
    if (focusSearchTrigger > 0) {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
  }, [focusSearchTrigger]);

  const updateField = (field: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const setQuickDate = (preset: "hoy" | "ayer" | "semana" | "mes") => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (preset === "hoy") {
      onFilterChange({ ...filters, fechaDesde: todayStr, fechaHasta: todayStr });
    } else if (preset === "ayer") {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      onFilterChange({ ...filters, fechaDesde: yesterday, fechaHasta: yesterday });
    } else if (preset === "semana") {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      onFilterChange({ ...filters, fechaDesde: weekAgo, fechaHasta: todayStr });
    } else if (preset === "mes") {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      onFilterChange({ ...filters, fechaDesde: firstDayOfMonth, fechaHasta: todayStr });
    }
  };

  const clearFilters = () => {
    onFilterChange({
      search: "",
      estado: "TODOS",
      portador: "TODOS",
      destino: "TODOS",
      prioridad: "TODOS",
      fechaTipo: "ENTRADA",
      fechaDesde: "",
      fechaHasta: "",
    });
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.estado !== "TODOS" ||
    filters.portador !== "TODOS" ||
    filters.destino !== "TODOS" ||
    filters.prioridad !== "TODOS" ||
    Boolean(filters.fechaDesde) ||
    Boolean(filters.fechaHasta);

  const activeAdvancedCount =
    (filters.destino !== "TODOS" ? 1 : 0) +
    (filters.portador !== "TODOS" ? 1 : 0) +
    (filters.prioridad !== "TODOS" && filters.prioridad !== "URGENTES_TODOS" ? 1 : 0) +
    (filters.fechaDesde || filters.fechaHasta ? 1 : 0);

  // Auto open advanced filters if user previously set date or destination filter
  useEffect(() => {
    if (activeAdvancedCount > 0 && !isAdvancedOpen) {
      setIsAdvancedOpen(true);
    }
  }, [activeAdvancedCount]);

  return (
    <div className="border-b border-slate-200/90 bg-white/95 text-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 shadow-2xs z-20">
      {/* Primary Unified Bar: View Mode, Fast Work Status Chips, Search & Filter Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2">
        {/* Left Side: View Switcher (Tabla/Kanban) + Main Status Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* View Mode Toggle: Tabla vs Kanban */}
          {onViewModeChange && (
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100/90 p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => onViewModeChange("tabla")}
                className={cn(
                  "flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition",
                  viewMode === "tabla"
                    ? "bg-white text-blue-700 shadow-2xs dark:bg-slate-700 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                )}
                title="Vista Grilla de Alta Densidad (1)"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("kanban")}
                className={cn(
                  "flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition",
                  viewMode === "kanban"
                    ? "bg-white text-blue-700 shadow-2xs dark:bg-slate-700 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                )}
                title="Vista Tablero Kanban de Trazabilidad (2)"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Kanban</span>
              </button>
            </div>
          )}

          {/* Record Count Pill */}
          <span className="rounded-lg bg-slate-100 border border-slate-200/80 px-2 py-1 text-slate-800 font-bold dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shrink-0 font-mono text-[11px]">
            {totalRegistros.toLocaleString("es-AR")} trámites
          </span>

          <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 shrink-0 mx-0.5 hidden sm:inline" />

          {/* Fast Status Filter Chips (Pestañas de Trabajo) */}
          {stats && (
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Todos */}
              <button
                type="button"
                onClick={clearFilters}
                className={cn(
                  "flex items-center space-x-1 rounded-lg border px-2 py-1 text-xs font-bold transition active:scale-95 shrink-0",
                  !hasActiveFilters
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs dark:bg-white dark:text-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                )}
              >
                <span>Todos</span>
                <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-mono font-black text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                  {stats.total.toLocaleString("es-AR")}
                </span>
              </button>

              {/* En Despacho */}
              <button
                type="button"
                onClick={() => updateField("estado", filters.estado === "DESPACHO" ? "TODOS" : "DESPACHO")}
                className={cn(
                  "flex items-center space-x-1 rounded-lg border px-2 py-1 text-xs font-bold transition active:scale-95 shrink-0",
                  filters.estado === "DESPACHO"
                    ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                    : "bg-amber-50/80 text-amber-900 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800"
                )}
                title="Expedientes en despacho dentro de la secretaría"
              >
                <span>📬 Despacho</span>
                <span className="rounded-full bg-amber-200 px-1.5 py-0.2 text-[10px] font-mono font-black text-amber-950 dark:bg-amber-900 dark:text-amber-200">
                  {stats.despacho}
                </span>
              </button>

              {/* En Mano */}
              <button
                type="button"
                onClick={() => updateField("estado", filters.estado === "EN MANO" ? "TODOS" : "EN MANO")}
                className={cn(
                  "flex items-center space-x-1 rounded-lg border px-2 py-1 text-xs font-bold transition active:scale-95 shrink-0",
                  filters.estado === "EN MANO"
                    ? "bg-sky-600 text-white border-sky-600 shadow-2xs"
                    : "bg-sky-50/80 text-sky-900 border-sky-200 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800"
                )}
                title="Trámites en mano directa de funcionarios"
              >
                <span>🤝 En Mano</span>
                <span className="rounded-full bg-sky-200 px-1.5 py-0.2 text-[10px] font-mono font-black text-sky-950 dark:bg-sky-900 dark:text-sky-200">
                  {stats.enMano}
                </span>
              </button>

              {/* Urgentes & Pronto Despacho */}
              <button
                type="button"
                onClick={() =>
                  updateField(
                    "prioridad",
                    filters.prioridad === "URGENTES_TODOS" || filters.prioridad === "URGENTE" || filters.prioridad === "PRONTO DESPACHO"
                      ? "TODOS"
                      : "URGENTES_TODOS"
                  )
                }
                className={cn(
                  "flex items-center space-x-1 rounded-lg border px-2 py-1 text-xs font-bold transition active:scale-95 shrink-0",
                  filters.prioridad === "URGENTES_TODOS" || filters.prioridad === "URGENTE" || filters.prioridad === "PRONTO DESPACHO"
                    ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                    : "bg-rose-50/80 text-rose-900 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
                )}
                title="Filtrar los 23 trámites prioritarios: 6 Urgentes + 17 Pronto Despacho"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span>⚡ Urgentes</span>
                <span className="rounded-full bg-rose-200 px-1.5 py-0.2 text-[10px] font-mono font-black text-rose-950 dark:bg-rose-900 dark:text-rose-200">
                  {stats.urgentes}
                </span>
              </button>

              {/* Firmados */}
              <button
                type="button"
                onClick={() => updateField("estado", filters.estado === "FIRMADO" ? "TODOS" : "FIRMADO")}
                className={cn(
                  "hidden xl:flex items-center space-x-1 rounded-lg border px-2 py-1 text-xs font-bold transition active:scale-95 shrink-0",
                  filters.estado === "FIRMADO"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
                )}
                title="Trámites firmados y egresados de la secretaría"
              >
                <span>✍️ Firmados</span>
                <span className="rounded-full bg-emerald-200 px-1.5 py-0.2 text-[10px] font-mono font-black text-emerald-950 dark:bg-emerald-900 dark:text-emerald-200">
                  {stats.firmados.toLocaleString("es-AR")}
                </span>
              </button>

              {/* Mis Trámites */}
              {currentUserName && (
                <button
                  type="button"
                  onClick={() => {
                    if (filters.portador === currentUserName) {
                      updateField("portador", "TODOS");
                    } else {
                      updateField("portador", currentUserName);
                    }
                  }}
                  className={cn(
                    "hidden lg:flex items-center space-x-1 rounded-lg border px-2 py-1 text-xs font-bold transition active:scale-95 shrink-0",
                    filters.portador === currentUserName
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                      : "bg-indigo-50/80 text-indigo-900 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-800"
                  )}
                  title="Filtrar trámites a cargo de mi usuario"
                >
                  <span>📌 Mis Trámites</span>
                  {stats.misTramites > 0 && (
                    <span className="rounded-full bg-indigo-200 px-1.5 py-0.2 text-[10px] font-mono font-black text-indigo-950 dark:bg-indigo-900 dark:text-indigo-200">
                      {stats.misTramites}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Fast Search, Advanced Filter Toggle & Reset */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Fast Instant Search Bar */}
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por N° exp, carátula, fecha..."
              value={filters.search}
              onChange={(e) => updateField("search", e.target.value)}
              className="h-8 w-44 sm:w-64 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-12 text-xs text-slate-900 placeholder:text-slate-400 shadow-xs focus:w-72 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 transition-all"
            />
            {filters.search ? (
              <button
                onClick={() => updateField("search", "")}
                className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                title="Limpiar búsqueda"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2 rounded border border-slate-200 bg-slate-100 px-1 py-0.2 text-[9px] font-mono text-slate-400 dark:border-slate-700 dark:bg-slate-700">
                /
              </kbd>
            )}
          </div>

          {/* Toggle Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen((prev) => !prev)}
            className={cn(
              "inline-flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition shadow-2xs",
              isAdvancedOpen || activeAdvancedCount > 0
                ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
            )}
            title="Desplegar u ocultar filtros avanzados (Fechas, Destino, Portador)"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Filtros</span>
            {activeAdvancedCount > 0 && (
              <span className="rounded-full bg-blue-600 text-white text-[9px] font-mono font-black px-1.5 py-0.2">
                {activeAdvancedCount}
              </span>
            )}
            {isAdvancedOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center space-x-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition active:scale-95 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 shadow-2xs"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Limpiar</span>
            </button>
          )}

          {/* Quick Dashboard Pill */}
          {onOpenDashboard && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="hidden md:inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-2xs"
              title="Abrir Dashboard interactivo con gráficos de movimientos (D)"
            >
              <BarChart3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Gráficos</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary Collapsible Bar: Advanced Filters (Fechas, Destino, Portador, Prioridad) */}
      {isAdvancedOpen && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 px-4 py-2 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex flex-wrap items-center gap-2">
            {/* Dedicated Date Search / Range Filter */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs dark:bg-slate-800 dark:border-slate-700 shadow-2xs">
              <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <select
                value={filters.fechaTipo || "ENTRADA"}
                onChange={(e) => updateField("fechaTipo", e.target.value)}
                className="cursor-pointer bg-transparent font-bold text-slate-700 focus:outline-none dark:text-slate-200 text-[11px]"
                title="Filtrar por Fecha de Entrada o Fecha de Salida"
              >
                <option value="ENTRADA">F. Entrada</option>
                <option value="SALIDA">F. Salida</option>
                <option value="AMBAS">Cualquiera</option>
              </select>

              <input
                type="date"
                value={filters.fechaDesde || ""}
                onChange={(e) => updateField("fechaDesde", e.target.value)}
                className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                title="Desde fecha"
              />
              <span className="text-slate-400 text-[11px]">a</span>
              <input
                type="date"
                value={filters.fechaHasta || ""}
                onChange={(e) => updateField("fechaHasta", e.target.value)}
                className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                title="Hasta fecha"
              />

              {/* Quick Date Presets */}
              <div className="hidden sm:flex items-center space-x-1 border-l border-slate-200 pl-1.5 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setQuickDate("hoy")}
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate("ayer")}
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                >
                  Ayer
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate("semana")}
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                >
                  7 días
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate("mes")}
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                >
                  Este Mes
                </button>
              </div>

              {(filters.fechaDesde || filters.fechaHasta) && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, fechaDesde: "", fechaHasta: "" })}
                  className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Quitar filtro de fecha"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter: Destino */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs dark:bg-slate-800 dark:border-slate-700 shadow-2xs">
              <Building className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">Destino:</span>
              <select
                value={filters.destino}
                onChange={(e) => updateField("destino", e.target.value)}
                className="cursor-pointer max-w-[170px] truncate bg-transparent font-medium text-slate-800 focus:outline-none dark:text-slate-200 text-xs"
              >
                <option value="TODOS">Todos los destinos</option>
                {destinosDisponibles.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Portador */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs dark:bg-slate-800 dark:border-slate-700 shadow-2xs">
              <User className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">Portador:</span>
              <select
                value={filters.portador}
                onChange={(e) => updateField("portador", e.target.value)}
                className="cursor-pointer max-w-[150px] truncate bg-transparent font-medium text-slate-800 focus:outline-none dark:text-slate-200 text-xs"
              >
                <option value="TODOS">Todos</option>
                {portadoresDisponibles.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Prioridad */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs dark:bg-slate-800 dark:border-slate-700 shadow-2xs">
              <AlertTriangle className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">Prioridad:</span>
              <select
                value={filters.prioridad}
                onChange={(e) => updateField("prioridad", e.target.value)}
                className="cursor-pointer bg-transparent font-medium text-slate-800 focus:outline-none dark:text-slate-200 text-xs"
              >
                <option value="TODOS">Todas las prioridades</option>
                <option value="URGENTES_TODOS">⚡ Urgentes y Pronto Despacho ({stats?.urgentes || 23})</option>
                <option value="URGENTE">Solo URGENTE (6)</option>
                <option value="PRONTO DESPACHO">Solo PRONTO DESPACHO (17)</option>
                <option value="NORMAL">NORMAL</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(false)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cerrar filtros ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
