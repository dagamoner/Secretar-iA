"use client";

import React from "react";
import { Area, Usuario } from "@/types";
import { Layers, Wifi, WifiOff, FileSpreadsheet, Plus, HelpCircle } from "lucide-react";
import { getExcelExportUrl } from "@/lib/api";

interface HeaderProps {
  areas: Area[];
  currentAreaId: number;
  onAreaChange: (areaId: number) => void;
  usuarios: Usuario[];
  currentUser: Usuario | null;
  onUserChange: (user: Usuario) => void;
  isWsConnected: boolean;
  onOpenNewDoc: () => void;
  onOpenHelp: () => void;
}

export function Header({
  areas,
  currentAreaId,
  onAreaChange,
  usuarios,
  currentUser,
  onUserChange,
  isWsConnected,
  onOpenNewDoc,
  onOpenHelp,
}: HeaderProps) {
  const exportUrl = getExcelExportUrl(currentAreaId);

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      {/* Brand & Area Switcher */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black shadow-sm shadow-blue-500/20">
            S
          </div>
          <div>
            <h1 className="text-base font-bold leading-none tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Secretar<span className="text-blue-600 dark:text-blue-400">·iA</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-400">
                On-Premise
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Trazabilidad Documental Multi-Área
            </p>
          </div>
        </div>

        {/* Tenant Area Selector */}
        <div className="flex items-center space-x-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800/80">
          <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-slate-500 dark:text-slate-400">Área:</span>
          <select
            value={currentAreaId}
            onChange={(e) => onAreaChange(Number(e.target.value))}
            className="cursor-pointer bg-transparent font-medium text-slate-900 focus:outline-none dark:text-white"
          >
            {areas.map((a) => (
              <option key={a.id} value={a.id} className="dark:bg-slate-900">
                [{a.codigo}] {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-time Status, Current User, and Action Buttons */}
      <div className="flex items-center space-x-3">
        {/* Real-time Connection Indicator */}
        <div
          title={isWsConnected ? "Sincronizado en tiempo real" : "Reconectando..."}
          className="flex items-center space-x-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium dark:border-slate-800 dark:bg-slate-800"
        >
          {isWsConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <Wifi className="h-3 w-3" /> En Vivo
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <WifiOff className="h-3 w-3" /> Reconectando...
              </span>
            </>
          )}
        </div>

        {/* User Selection */}
        {usuarios.length > 0 && (
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-slate-400">Operador:</span>
            <select
              value={currentUser?.id || ""}
              onChange={(e) => {
                const found = usuarios.find((u) => u.id === Number(e.target.value));
                if (found) onUserChange(found);
              }}
              className="rounded border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-800 shadow-sm focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {usuarios.map((u) => (
                <option key={u.id} value={u.id} className="dark:bg-slate-900">
                  {u.nombre_completo}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Export to Excel */}
        <a
          href={exportUrl}
          download
          className="inline-flex items-center space-x-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title="Descargar planilla Excel de la vista actual"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
          <span>Exportar Excel</span>
        </a>

        {/* Shortcuts Help */}
        <button
          onClick={onOpenHelp}
          className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          title="Atajos de teclado (?)"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        {/* New Document Button */}
        <button
          onClick={onOpenNewDoc}
          className="inline-flex items-center space-x-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nuevo Trámite</span>
          <kbd className="ml-1 rounded bg-blue-700 px-1 py-0.2 text-[10px] font-mono opacity-80">N</kbd>
        </button>
      </div>
    </header>
  );
}
