"use client";

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { Documento } from "@/types";
import { getEstadoBadgeClass, getPrioridadBadgeClass, cn } from "@/lib/utils";
import { ArrowUpDown, Clock, Edit3, ArrowRight } from "lucide-react";

interface DenseDocumentTableProps {
  data: Documento[];
  selectedDocId: number | null;
  onSelectDoc: (doc: Documento) => void;
  onOpenMovementDrawer: (doc: Documento) => void;
  highlightedDocIds: Set<number>;
  activeEditors: Record<number, string>;
  selectedIndex: number;
}

export function DenseDocumentTable({
  data,
  selectedDocId,
  onSelectDoc,
  onOpenMovementDrawer,
  highlightedDocIds,
  activeEditors,
  selectedIndex,
}: DenseDocumentTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "ultimo_movimiento_at", desc: true },
  ]);

  const columns = useMemo<ColumnDef<Documento>[]>(
    () => [
      {
        accessorKey: "prioridad",
        header: "Pri.",
        size: 45,
        cell: (info) => {
          const val = String(info.getValue() || "NORMAL");
          if (val === "NORMAL") return null;
          return (
            <span
              className={cn(
                "inline-block rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase",
                getPrioridadBadgeClass(val)
              )}
            >
              {val === "URGENTE" ? "URG" : "PD"}
            </span>
          );
        },
      },
      {
        accessorKey: "fecha_ingreso",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center space-x-1 font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200"
            title="Fecha en que se recibe el documento en Secretaría"
          >
            <span>F. Entrada</span>
            <ArrowUpDown className="h-3 w-3 opacity-60" />
          </button>
        ),
        size: 95,
        cell: (info) => {
          const val = String(info.getValue() || "");
          if (!val) return <span className="text-slate-400 text-[11px]">-</span>;
          try {
            const d = new Date(val);
            const dateStr = d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
            return (
              <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {dateStr}
              </span>
            );
          } catch {
            return <span className="font-mono text-[11px]">{val.slice(0, 10)}</span>;
          }
        },
      },
      {
        accessorKey: "numero_expediente",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center space-x-1 font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200"
          >
            <span>N° Trámite / Exp.</span>
            <ArrowUpDown className="h-3 w-3 opacity-60" />
          </button>
        ),
        size: 170,
        cell: (info) => {
          const doc = info.row.original;
          const isHighlighted = highlightedDocIds.has(doc.id);
          const editor = activeEditors[doc.id];

          return (
            <div className="flex items-center space-x-1.5">
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                {String(info.getValue())}
              </span>
              {isHighlighted && (
                <span className="inline-flex items-center rounded bg-blue-500 px-1 py-0.2 text-[9px] font-bold text-white shadow-sm animate-pulse">
                  ACTUALIZADO
                </span>
              )}
              {editor && (
                <span
                  title={`${editor} está interviniendo este trámite`}
                  className="inline-flex items-center space-x-0.5 rounded bg-amber-500/90 px-1 py-0.2 text-[9px] font-medium text-white animate-bounce"
                >
                  <Edit3 className="h-2.5 w-2.5" />
                  <span>{editor.split(" ")[0]}</span>
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "tipo_documento",
        header: "Tipo",
        size: 95,
        cell: (info) => (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {String(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "iniciador_caratula",
        header: "Ámbito Origen / Resumen del Documento",
        size: 340,
        cell: (info) => {
          const doc = info.row.original;
          const text = doc.iniciador_caratula || "";
          const matchAmbito = text.match(/^\[(.*?)\]\s*(.*)$/);
          const ambito = matchAmbito ? matchAmbito[1] : null;
          const resumen = matchAmbito ? matchAmbito[2] : text;

          return (
            <div className="max-w-md truncate" title={text}>
              {ambito && (
                <span className="inline-block mr-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 text-[9px] font-bold dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                  {ambito}
                </span>
              )}
              <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                {resumen}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "estado_actual",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center space-x-1 font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200"
          >
            <span>Estado</span>
            <ArrowUpDown className="h-3 w-3 opacity-60" />
          </button>
        ),
        size: 110,
        cell: (info) => {
          const val = String(info.getValue());
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                getEstadoBadgeClass(val)
              )}
            >
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: "destino_actual",
        header: "Ámbito Enviado / Destino",
        size: 180,
        cell: (info) => (
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block" title={String(info.getValue())}>
            {String(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "portador_actual",
        header: "Portador / Retiró",
        size: 140,
        cell: (info) => (
          <span className="text-slate-700 dark:text-slate-300 truncate block text-xs" title={String(info.getValue())}>
            {String(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "foja_actual",
        header: "Fojas",
        size: 60,
        cell: (info) => (
          <span className="font-mono text-center block text-slate-600 dark:text-slate-400 font-semibold">
            {String(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "ultimo_movimiento_at",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center space-x-1 font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200"
            title="Fecha en que sale del área de secretaría"
          >
            <Clock className="h-3 w-3" />
            <span>F. Salida</span>
            <ArrowUpDown className="h-3 w-3 opacity-60" />
          </button>
        ),
        size: 110,
        cell: (info) => {
          const doc = info.row.original;
          const val = doc.ultimo_movimiento_at;
          if (!val) return <span className="text-slate-400 text-[11px]">-</span>;
          try {
            const d = new Date(val);
            const dateStr = d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
            return (
              <div className="flex flex-col text-right">
                <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {dateStr}
                </span>
                {doc.ultimo_movimiento_hora_corta && doc.ultimo_movimiento_hora_corta !== "09:00" && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {doc.ultimo_movimiento_hora_corta} hs
                  </span>
                )}
              </div>
            );
          } catch {
            return <span className="font-mono text-xs">{val.slice(0, 10)}</span>;
          }
        },
      },
      {
        id: "acciones",
        header: "",
        size: 80,
        cell: (info) => {
          const doc = info.row.original;
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenMovementDrawer(doc);
              }}
              className="inline-flex items-center space-x-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-600 hover:text-white transition dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
              title="Registrar nuevo pase (P)"
            >
              <span>Pase</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          );
        },
      },
    ],
    [highlightedDocIds, activeEditors, onOpenMovementDrawer]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="relative flex-1 overflow-auto bg-white dark:bg-slate-950">
      <table className="w-full border-collapse text-left text-xs">
        {/* Sticky Table Header */}
        <thead className="sticky top-0 z-20 border-b border-slate-200 bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className="px-2.5 py-2 font-semibold"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        {/* Table Body (Dense Rows) */}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                No se encontraron trámites o expedientes con los filtros seleccionados.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, idx) => {
              const doc = row.original;
              const isSelected = selectedDocId === doc.id || selectedIndex === idx;
              const isHighlighted = highlightedDocIds.has(doc.id);

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectDoc(doc)}
                  onDoubleClick={() => onOpenMovementDrawer(doc)}
                  className={cn(
                    "cursor-pointer select-none transition-colors",
                    // High-density padding
                    "py-1",
                    // Normal alternating / hover state
                    idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/50 dark:bg-slate-900/40",
                    "hover:bg-blue-50/70 dark:hover:bg-blue-950/40",
                    // Selected state
                    isSelected && "bg-blue-100/70 dark:bg-blue-900/40 font-medium ring-1 ring-inset ring-blue-500",
                    // Real-time flash highlight (3 seconds duration)
                    isHighlighted && "bg-blue-200/90 dark:bg-blue-700/60 ring-2 ring-blue-500 animate-pulse"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="px-2.5 py-1.5 whitespace-nowrap"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
