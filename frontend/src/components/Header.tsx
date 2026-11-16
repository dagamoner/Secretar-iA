"use client";

import React, { useState } from "react";
import { Area, Usuario } from "@/types";
import {
  Layers,
  Wifi,
  WifiOff,
  FileSpreadsheet,
  Plus,
  HelpCircle,
  Settings,
  LogOut,
  Key,
  Shield,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
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
  onOpenAdmin: () => void;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onExportExcel?: () => void;
  onOpenDashboard?: () => void;
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
  onOpenAdmin,
  onLogout,
  onOpenChangePassword,
  onExportExcel,
  onOpenDashboard,
}: HeaderProps) {
  const exportUrl = getExcelExportUrl(currentAreaId);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportClick = () => {
    setIsExporting(true);
    try {
      if (onExportExcel) {
        onExportExcel();
      } else {
        window.open(exportUrl, "_blank");
      }
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 shadow-2xs">
      {/* Brand & Government Area Info */}
      <div className="flex items-center space-x-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-sm shadow-sm shadow-blue-500/30">
            S
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-black leading-none tracking-tight text-slate-900 dark:text-white flex items-center">
                Secretar<span className="text-blue-600 dark:text-blue-400">·iA</span>
              </h1>
              <span className="rounded bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 text-[9px] font-black uppercase text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                SPMG
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Secretaría Privada · Gobierno de Mendoza
            </p>
          </div>
        </div>

        {/* Tenant Area Switcher */}
        <div className="hidden sm:flex items-center space-x-1.5 rounded-lg border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-xs dark:border-slate-800 dark:bg-slate-800/80">
          <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-slate-500 dark:text-slate-400">Mesa:</span>
          <select
            value={currentAreaId}
            onChange={(e) => onAreaChange(Number(e.target.value))}
            className="cursor-pointer bg-transparent font-bold text-slate-800 focus:outline-none dark:text-white"
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
      <div className="flex items-center space-x-2.5">
        {/* Real-time Connection Indicator */}
        <div
          title={isWsConnected ? "Sincronizado en tiempo real" : "Reconectando..."}
          className="flex items-center space-x-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold dark:border-slate-800 dark:bg-slate-800/80"
        >
          {isWsConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 hidden sm:inline">
                En Vivo
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span className="text-amber-700 dark:text-amber-400 hidden sm:inline">
                Reconectando
              </span>
            </>
          )}
        </div>

        {/* Authenticated Secretary Profile & Logout */}
        {currentUser && (
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center space-x-2 rounded-lg border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-xs dark:border-slate-800 dark:bg-slate-800/80">
              <span className="font-bold text-slate-800 dark:text-white max-w-[130px] truncate">
                {currentUser.nombre_completo}
              </span>
              <span
                className={`rounded px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider ${
                  currentUser.rol === "ADMIN"
                    ? "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                    : "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                }`}
              >
                {currentUser.rol}
              </span>

              {/* Change Password */}
              <button
                onClick={onOpenChangePassword}
                title="Cambiar mi contraseña personal"
                className="rounded p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition dark:hover:bg-slate-700 dark:hover:text-white"
              >
                <Key className="h-3 w-3" />
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Salir y volver a la pantalla de acceso"
              className="inline-flex items-center space-x-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-100 hover:border-rose-300 transition active:scale-95 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        )}

        {/* Interactive Movements Dashboard */}
        {onOpenDashboard && (
          <button
            onClick={onOpenDashboard}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 hover:border-blue-300 transition active:scale-95 cursor-pointer dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
            title="Abrir Dashboard interactivo de movimientos y flujo documental (D)"
          >
            <BarChart3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Dashboard</span>
          </button>
        )}

        {/* Export to Excel */}
        <button
          onClick={handleExportClick}
          className="inline-flex items-center space-x-1.5 rounded-lg border border-emerald-200 bg-emerald-50/60 px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 hover:border-emerald-300 transition active:scale-95 cursor-pointer dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
          title="Descargar planilla Excel con la trazabilidad completa"
        >
          {isExporting ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
          ) : (
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{isExporting ? "Exportando..." : "Exportar Excel"}</span>
        </button>

        {/* Administration & ETL Settings - EXCLUSIVO PARA ADMINISTRADOR GENERAL */}
        {currentUser?.rol === "ADMIN" && (
          <button
            onClick={onOpenAdmin}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-100 hover:border-purple-300 transition dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/60"
            title="Panel de Administración General: Catálogos, Operadores y Carga ETL"
          >
            <Shield className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden md:inline">Configuración & ETL</span>
          </button>
        )}

        {/* Shortcuts Help */}
        <button
          onClick={onOpenHelp}
          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition"
          title="Atajos de teclado (?)"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        {/* New Document Button */}
        <button
          onClick={onOpenNewDoc}
          className="inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Trámite</span>
          <kbd className="ml-1 rounded bg-blue-700 px-1 py-0.2 text-[10px] font-mono opacity-80 hidden sm:inline">
            N
          </kbd>
        </button>
      </div>
    </header>
  );
}
