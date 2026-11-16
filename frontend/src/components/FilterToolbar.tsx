"use client";

import React, { useRef, useEffect } from "react";
import { FilterState } from "@/types";
import { Search, X, RotateCcw, BarChart3, Table as TableIcon, LayoutGrid, Calendar } from "lucide-react";

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
    const todayStr = now.toISOString().slice(0, 10);

    if (preset === "hoy") {
      onFilterChange({ ...filters, fechaDesde: todayStr, fechaHasta: todayStr });
    } else if (preset === "ayer") {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      onFilterChange({ ...filters, fechaDesde: yesterday, fechaHasta: yesterday });
    } else if (preset === "semana") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      onFilterChange({ ...filters, fechaDesde: sevenDaysAgo, fechaHasta: todayStr });
    } else if (preset === "mes") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      onFilterChange({ ...filters, fechaDesde: firstDay, fechaHasta: todayStr });
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

  return (
    <div className="border-b border-slate-200 bg-white/80 backdrop-blur-xs text-xs dark:border-slate-800 dark:bg-slate-900/80">
      {/* Row 1: Executive KPI Metrics Cards & Instant Quick Filters */}
      {stats && (
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Métricas de Mesa:
          </span>

          {/* KPI: Total */}
          <button
            type="button"
            onClick={clearFilters}
            className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition active:scale-95 shrink-0 ${
              !hasActiveFilters
                ? "bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-white dark:text-slate-900"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            }`}
          >
            <span>📁 Todos</span>
            <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-black text-slate-800 dark:bg-slate-700 dark:text-slate-200">
              {stats.total.toLocaleString("es-AR")}
            </span>
          </button>

          {/* KPI: Firmados */}
          <button
            type="button"
            onClick={() => updateField("estado", filters.estado === "FIRMADO" ? "TODOS" : "FIRMADO")}
            className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition active:scale-95 shrink-0 ${
              filters.estado === "FIRMADO"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
            }`}
          >
            <span>✍️ Firmados</span>
            <span className="rounded-full bg-emerald-200 px-1.5 py-0.2 text-[10px] font-black text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
              {stats.firmados.toLocaleString("es-AR")}
            </span>
          </button>

          {/* KPI: Despacho */}
          <button
            type="button"
            onClick={() => updateField("estado", filters.estado === "DESPACHO" ? "TODOS" : "DESPACHO")}
            className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition active:scale-95 shrink-0 ${
              filters.estado === "DESPACHO"
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
            }`}
          >
            <span>📬 En Despacho</span>
            <span className="rounded-full bg-amber-200 px-1.5 py-0.2 text-[10px] font-black text-amber-900 dark:bg-amber-900 dark:text-amber-200">
              {stats.despacho.toLocaleString("es-AR")}
            </span>
          </button>

          {/* KPI: En Mano */}
          <button
            type="button"
            onClick={() => updateField("estado", filters.estado === "EN MANO" ? "TODOS" : "EN MANO")}
            className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition active:scale-95 shrink-0 ${
              filters.estado === "EN MANO"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
            }`}
          >
            <span>🤝 En Mano</span>
            <span className="rounded-full bg-blue-200 px-1.5 py-0.2 text-[10px] font-black text-blue-900 dark:bg-blue-900 dark:text-blue-200">
              {stats.enMano.toLocaleString("es-AR")}
            </span>
          </button>

          {/* KPI: Observados */}
          {stats.observados > 0 && (
            <button
              type="button"
              onClick={() => updateField("estado", filters.estado === "OBSERVADO" ? "TODOS" : "OBSERVADO")}
              className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition active:scale-95 shrink-0 ${
                filters.estado === "OBSERVADO"
                  ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                  : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
              }`}
            >
              <span>⚠️ Observados</span>
              <span className="rounded-full bg-rose-200 px-1.5 py-0.2 text-[10px] font-black text-rose-900 dark:bg-rose-900 dark:text-rose-200">
                {stats.observados}
              </span>
            </button>
          )}

          {/* KPI: Urgentes */}
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
            className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition active:scale-95 shrink-0 ${
              filters.prioridad === "URGENTES_TODOS" || filters.prioridad === "URGENTE" || filters.prioridad === "PRONTO DESPACHO"
                ? "bg-red-600 text-white border-red-600 shadow-sm"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
            }`}
            title="Filtrar los 23 trámites prioritarios: 6 Urgentes + 17 Pronto Despacho"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>⚡ Urgentes</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                filters.prioridad === "URGENTES_TODOS" || filters.prioridad === "URGENTE" || filters.prioridad === "PRONTO DESPACHO"
                  ? "bg-white text-red-700"
                  : "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {stats.urgentes}
            </span>
          </button>

          {/* KPI: Mis Trámites */}
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
              className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition active:scale-95 shrink-0 ${
                filters.portador === currentUserName
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
              }`}
              title="Filtrar trámites a cargo de mi usuario"
            >
              <span>📌 Mis Trámites</span>
              {stats.misTramites > 0 && (
                <span className="rounded-full bg-indigo-200 px-1.5 py-0.2 text-[10px] font-black text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200">
                  {stats.misTramites}
                </span>
              )}
            </button>
          )}

          {/* Quick Dashboard Pill */}
          {onOpenDashboard && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="flex items-center space-x-1.5 rounded-lg border border-blue-300 bg-blue-100/70 px-2.5 py-1 text-xs font-black text-blue-800 transition active:scale-95 shrink-0 ml-auto hover:bg-blue-200 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 shadow-2xs"
              title="Abrir Dashboard interactivo con gráficos de movimientos (D)"
            >
              <BarChart3 className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
              <span>Ver Gráficos & Flujo</span>
            </button>
          )}
        </div>
      )}

      {/* Row 2: Search Input & Dropdown Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Instant Search Bar */}
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por N° exp, fecha (16/11/2026), ámbito, carátula o portador..."
              value={filters.search}
              onChange={(e) => updateField("search", e.target.value)}
              className="h-9 w-72 rounded-lg border border-slate-200 bg-white pl-9 pr-14 text-xs text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 transition"
            />
            {filters.search ? (
              <button
                onClick={() => updateField("search", "")}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                title="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2.5 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:border-slate-700 dark:bg-slate-700">
                /
              </kbd>
            )}
          </div>

          {/* Dedicated Date Search / Range Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs dark:bg-slate-800/80 dark:border-slate-700">
            <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <select
              value={filters.fechaTipo || "ENTRADA"}
              onChange={(e) => updateField("fechaTipo", e.target.value)}
              className="cursor-pointer bg-transparent font-bold text-slate-700 focus:outline-none dark:text-slate-200 text-[11px]"
              title="Filtrar por Fecha de Entrada o Fecha de Salida"
            >
              <option value="ENTRADA">F. Entrada</option>
              <option value="SALIDA">F. Salida</option>
              <option value="AMBAS">Cualquier Fecha</option>
            </select>

            <input
              type="date"
              value={filters.fechaDesde || ""}
              onChange={(e) => updateField("fechaDesde", e.target.value)}
              className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              title="Desde fecha"
            />
            <span className="text-slate-400 text-[11px]">a</span>
            <input
              type="date"
              value={filters.fechaHasta || ""}
              onChange={(e) => updateField("fechaHasta", e.target.value)}
              className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              title="Hasta fecha"
            />

            {/* Quick Date Presets */}
            <div className="hidden xl:flex items-center space-x-1 border-l border-slate-200 pl-1.5 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setQuickDate("hoy")}
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("ayer")}
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              >
                Ayer
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("semana")}
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              >
                7 días
              </button>
              <button
                type="button"
                onClick={() => setQuickDate("mes")}
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition"
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

          {/* Filter: Estado */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs dark:bg-slate-800/80 dark:border-slate-700">
            <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">Estado:</span>
            <select
              value={filters.estado}
              onChange={(e) => updateField("estado", e.target.value)}
              className="cursor-pointer bg-transparent font-medium text-slate-800 focus:outline-none dark:text-slate-200"
            >
              <option value="TODOS">Todos</option>
              <option value="INICIADO">INICIADO</option>
              <option value="DESPACHO">DESPACHO</option>
              <option value="EN MANO">EN MANO</option>
              <option value="FIRMADO">FIRMADO</option>
              <option value="OBSERVADO">OBSERVADO</option>
              <option value="ARCHIVO">ARCHIVO</option>
            </select>
          </div>

          {/* Filter: Destino */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs dark:bg-slate-800/80 dark:border-slate-700">
            <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">Destino:</span>
            <select
              value={filters.destino}
              onChange={(e) => updateField("destino", e.target.value)}
              className="cursor-pointer max-w-[170px] truncate bg-transparent font-medium text-slate-800 focus:outline-none dark:text-slate-200"
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
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs dark:bg-slate-800/80 dark:border-slate-700">
            <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">Portador:</span>
            <select
              value={filters.portador}
              onChange={(e) => updateField("portador", e.target.value)}
              className="cursor-pointer max-w-[150px] truncate bg-transparent font-medium text-slate-800 focus:outline-none dark:text-slate-200"
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
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs dark:bg-slate-800/80 dark:border-slate-700">
            <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">Prioridad:</span>
            <select
              value={filters.prioridad}
              onChange={(e) => updateField("prioridad", e.target.value)}
              className="cursor-pointer bg-transparent font-medium text-slate-800 focus:outline-none dark:text-slate-200"
            >
              <option value="TODOS">Todas las prioridades</option>
              <option value="URGENTES_TODOS">⚡ Urgentes y Pronto Despacho ({stats?.urgentes || 23})</option>
              <option value="URGENTE">Solo URGENTE (6)</option>
              <option value="PRONTO DESPACHO">Solo PRONTO DESPACHO (17)</option>
              <option value="NORMAL">NORMAL</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center space-x-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition active:scale-95 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Live Records Counter & View Switcher */}
        <div className="flex items-center space-x-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-800 font-bold dark:bg-slate-800 dark:text-slate-200">
            {totalRegistros.toLocaleString("es-AR")} trámites
          </span>

          {/* View Mode Switcher */}
          {onViewModeChange && (
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => onViewModeChange("tabla")}
                className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  viewMode === "tabla"
                    ? "bg-white text-blue-700 shadow-2xs dark:bg-slate-700 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
                title="Vista Grilla de Alta Densidad (1)"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("kanban")}
                className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  viewMode === "kanban"
                    ? "bg-white text-blue-700 shadow-2xs dark:bg-slate-700 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
                title="Vista Tablero Kanban de Trazabilidad (2)"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Kanban</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
