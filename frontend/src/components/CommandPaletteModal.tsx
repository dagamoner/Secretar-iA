"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Documento } from "@/types";
import {
  Search,
  Plus,
  BarChart3,
  FileSpreadsheet,
  Table as TableIcon,
  LayoutGrid,
  Moon,
  Sun,
  HelpCircle,
  ArrowRight,
  Clock,
  Building,
  User,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import { normalizeSearchText } from "@/lib/utils";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentos: Documento[];
  onSelectDoc: (doc: Documento) => void;
  onOpenNewDoc: () => void;
  onOpenDashboard: () => void;
  onExportExcel: () => void;
  onSetViewMode: (mode: "tabla" | "kanban") => void;
  onFilterPreset?: (field: string, value: string) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onOpenHelp: () => void;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  documentos,
  onSelectDoc,
  onOpenNewDoc,
  onOpenDashboard,
  onExportExcel,
  onSetViewMode,
  onFilterPreset,
  onToggleTheme,
  isDarkMode,
  onOpenHelp,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // System actions list
  const systemActions = useMemo(
    () => [
      {
        id: "new-doc",
        title: "Nuevo Trámite Ministerial",
        subtitle: "Caratular e ingresar expediente o nota",
        category: "Acción",
        shortcut: "N",
        icon: Plus,
        action: () => {
          onClose();
          onOpenNewDoc();
        },
      },
      {
        id: "open-dashboard",
        title: "Abrir Dashboard de Flujo y Movimientos",
        subtitle: "Gráficos de estado, fojas y curvas temporales",
        category: "Acción",
        shortcut: "D",
        icon: BarChart3,
        action: () => {
          onClose();
          onOpenDashboard();
        },
      },
      {
        id: "export-excel",
        title: "Exportar Planilla Excel Completa",
        subtitle: "Descargar trazabilidad con formato oficial de secretaría",
        category: "Acción",
        shortcut: "E",
        icon: FileSpreadsheet,
        action: () => {
          onClose();
          onExportExcel();
        },
      },
      {
        id: "view-tabla",
        title: "Cambiar a Vista Tabla de Alta Densidad",
        subtitle: "Visualización en grilla compacta de expedientes",
        category: "Vista",
        shortcut: "1",
        icon: TableIcon,
        action: () => {
          onClose();
          onSetViewMode("tabla");
        },
      },
      {
        id: "view-kanban",
        title: "Cambiar a Vista Tablero Kanban",
        subtitle: "Visualización por etapas de trazabilidad y flujo",
        category: "Vista",
        shortcut: "2",
        icon: LayoutGrid,
        action: () => {
          onClose();
          onSetViewMode("kanban");
        },
      },
      {
        id: "filter-urgentes",
        title: "Filtrar Trámites Urgentes y Pronto Despacho (23)",
        subtitle: "Mostrar carpetas con máxima prioridad de resolución",
        category: "Filtro",
        shortcut: "U",
        icon: AlertTriangle,
        action: () => {
          onClose();
          onFilterPreset?.("prioridad", "URGENTES_TODOS");
        },
      },
      {
        id: "filter-despacho",
        title: "Ver Expedientes en Despacho de Secretaría (168)",
        subtitle: "Mostrar trámites que están dentro del área ministerial",
        category: "Filtro",
        shortcut: "S",
        icon: Clock,
        action: () => {
          onClose();
          onFilterPreset?.("estado", "DESPACHO");
        },
      },
      {
        id: "toggle-theme",
        title: isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro",
        subtitle: "Ajustar contraste visual de la interfaz",
        category: "Ajustes",
        shortcut: "T",
        icon: isDarkMode ? Sun : Moon,
        action: () => {
          onClose();
          onToggleTheme();
        },
      },
      {
        id: "help",
        title: "Atajos de Teclado y Ayuda",
        subtitle: "Guía completa para operar a alta velocidad",
        category: "Ayuda",
        shortcut: "?",
        icon: HelpCircle,
        action: () => {
          onClose();
          onOpenHelp();
        },
      },
    ],
    [
      isDarkMode,
      onClose,
      onOpenNewDoc,
      onOpenDashboard,
      onExportExcel,
      onSetViewMode,
      onFilterPreset,
      onToggleTheme,
      onOpenHelp,
    ]
  );

  // Matched items (Actions + Documents)
  const filteredResults = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) {
      return {
        actions: systemActions,
        docs: documentos.slice(0, 8),
      };
    }

    const matchedActions = systemActions.filter(
      (a) => normalizeSearchText(a.title).includes(q) || normalizeSearchText(a.subtitle).includes(q)
    );

    const matchedDocs = documentos
      .filter((d) => {
        const num = normalizeSearchText(d.numero_expediente);
        const cara = normalizeSearchText(d.iniciador_caratula);
        const port = normalizeSearchText(d.portador_actual);
        const dest = normalizeSearchText(d.destino_actual);
        return num.includes(q) || cara.includes(q) || port.includes(q) || dest.includes(q);
      })
      .slice(0, 10);

    return { actions: matchedActions, docs: matchedDocs };
  }, [query, systemActions, documentos]);

  const totalItems = filteredResults.actions.length + filteredResults.docs.length;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex < filteredResults.actions.length) {
          filteredResults.actions[selectedIndex].action();
        } else {
          const docIndex = selectedIndex - filteredResults.actions.length;
          const targetDoc = filteredResults.docs[docIndex];
          if (targetDoc) {
            onClose();
            onSelectDoc(targetDoc);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, selectedIndex, totalItems, filteredResults, onSelectDoc]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-200 px-4 py-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Escribe una acción, expediente, carátula o funcionario... (Esc para salir)"
            className="ml-3 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white font-medium"
          />
          <kbd className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {totalItems === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No se encontraron acciones ni expedientes para &quot;{query}&quot;
            </div>
          ) : (
            <>
              {/* Actions Section */}
              {filteredResults.actions.length > 0 && (
                <div className="py-1.5">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Comandos del Sistema
                  </span>
                  {filteredResults.actions.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer transition ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "hover:bg-slate-100 text-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/80"
                        }`}
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isSelected ? "text-white" : "text-slate-500 dark:text-slate-400"
                            }`}
                          />
                          <div className="truncate">
                            <span className="text-xs font-bold block leading-tight">{item.title}</span>
                            <span
                              className={`text-[10px] truncate block ${
                                isSelected ? "text-blue-100" : "text-slate-400"
                              }`}
                            >
                              {item.subtitle}
                            </span>
                          </div>
                        </div>

                        {item.shortcut && (
                          <kbd
                            className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                              isSelected
                                ? "bg-blue-700 text-white"
                                : "bg-slate-100 border border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                            }`}
                          >
                            {item.shortcut}
                          </kbd>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Documents Section */}
              {filteredResults.docs.length > 0 && (
                <div className="py-1.5">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Expedientes y Documentos
                  </span>
                  {filteredResults.docs.map((doc, idx) => {
                    const globalIdx = filteredResults.actions.length + idx;
                    const isSelected = selectedIndex === globalIdx;

                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          onClose();
                          onSelectDoc(doc);
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer transition ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "hover:bg-slate-100 text-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/80"
                        }`}
                      >
                        <div className="flex items-center space-x-3 truncate flex-1 mr-2">
                          <FolderOpen
                            className={`h-4 w-4 shrink-0 ${
                              isSelected ? "text-white" : "text-slate-400"
                            }`}
                          />
                          <div className="truncate flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs font-black tracking-tight">
                                {doc.numero_expediente}
                              </span>
                              <span
                                className={`text-[9px] uppercase px-1 rounded font-bold ${
                                  isSelected
                                    ? "bg-blue-700 text-white"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {doc.tipo_documento}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] truncate block ${
                                isSelected ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {doc.iniciador_caratula}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-semibold shrink-0 ${
                            isSelected ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          {doc.estado_actual}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navegar</span>
            <span>↵ Seleccionar</span>
            <span>Esc Salir</span>
          </div>
          <span className="font-mono text-[10px]">Secretar·iA Command 2.0</span>
        </div>
      </div>
    </div>
  );
}
