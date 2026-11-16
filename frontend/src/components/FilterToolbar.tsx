"use client";

import React, { useRef, useEffect } from "react";
import { FilterState } from "@/types";
import { Search, X, RotateCcw } from "lucide-react";

interface FilterToolbarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  destinosDisponibles: string[];
  portadoresDisponibles: string[];
  totalRegistros: number;
  focusSearchTrigger: number;
}

export function FilterToolbar({
  filters,
  onFilterChange,
  destinosDisponibles,
  portadoresDisponibles,
  totalRegistros,
  focusSearchTrigger,
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

  const clearFilters = () => {
    onFilterChange({
      search: "",
      estado: "TODOS",
      portador: "TODOS",
      destino: "TODOS",
      prioridad: "TODOS",
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.estado !== "TODOS" ||
    filters.portador !== "TODOS" ||
    filters.destino !== "TODOS" ||
    filters.prioridad !== "TODOS";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/75 px-4 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-center gap-2">
        {/* Instant Search Bar */}
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar por expediente, carátula o extracto..."
            value={filters.search}
            onChange={(e) => updateField("search", e.target.value)}
            className="h-8 w-72 rounded-md border border-slate-200 bg-white pl-8 pr-14 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {filters.search ? (
            <button
              onClick={() => updateField("search", "")}
              className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-400">
              /
            </kbd>
          )}
        </div>

        {/* Filter: Estado */}
        <div className="flex items-center space-x-1">
          <span className="font-medium text-slate-500 dark:text-slate-400">Estado:</span>
          <select
            value={filters.estado}
            onChange={(e) => updateField("estado", e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="INICIADO">INICIADO</option>
            <option value="DESPACHO">DESPACHO</option>
            <option value="EN MANO">EN MANO</option>
            <option value="FIRMADO">FIRMADO</option>
            <option value="ARCHIVO">ARCHIVO</option>
          </select>
        </div>

        {/* Filter: Destino */}
        <div className="flex items-center space-x-1">
          <span className="font-medium text-slate-500 dark:text-slate-400">Destino:</span>
          <select
            value={filters.destino}
            onChange={(e) => updateField("destino", e.target.value)}
            className="h-8 max-w-[160px] truncate rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
        <div className="flex items-center space-x-1">
          <span className="font-medium text-slate-500 dark:text-slate-400">Portador:</span>
          <select
            value={filters.portador}
            onChange={(e) => updateField("portador", e.target.value)}
            className="h-8 max-w-[160px] truncate rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="TODOS">Todos los portadores</option>
            {portadoresDisponibles.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Filter: Prioridad */}
        <div className="flex items-center space-x-1">
          <span className="font-medium text-slate-500 dark:text-slate-400">Prioridad:</span>
          <select
            value={filters.prioridad}
            onChange={(e) => updateField("prioridad", e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="TODOS">Todas</option>
            <option value="NORMAL">NORMAL</option>
            <option value="URGENTE">URGENTE</option>
            <option value="PRONTO DESPACHO">PRONTO DESPACHO</option>
          </select>
        </div>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Record Counter */}
      <div className="text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        Mostrando <span className="text-slate-900 dark:text-white font-bold">{totalRegistros}</span> trámites
      </div>
    </div>
  );
}
