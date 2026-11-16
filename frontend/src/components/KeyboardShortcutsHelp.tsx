"use client";

import React from "react";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "/", desc: "Enfocar barra de búsqueda instantánea" },
    { key: "Ctrl + K", desc: "Búsqueda rápida universal" },
    { key: "N", desc: "Abrir modal de nuevo trámite / caratulación" },
    { key: "D", desc: "Abrir Dashboard interactivo de movimientos y flujo documental" },
    { key: "P ó Enter", desc: "Abrir drawer de nuevo pase para el trámite seleccionado" },
    { key: "↓ / J", desc: "Navegar hacia la siguiente fila en la grilla" },
    { key: "↑ / K", desc: "Navegar hacia la fila anterior en la grilla" },
    { key: "Esc", desc: "Cerrar modal, drawer o cancelar selección" },
    { key: "?", desc: "Mostrar este panel de atajos de teclado" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Atajos de Teclado (Modo Alta Velocidad)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 divide-y divide-slate-100 text-xs dark:divide-slate-800">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-slate-600 dark:text-slate-300">{s.desc}</span>
              <kbd className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-800 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
