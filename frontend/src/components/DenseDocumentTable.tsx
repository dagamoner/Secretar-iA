"use client";

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";
import { Documento } from "@/types";
import { getEstadoBadgeClass, getPrioridadBadgeClass, cn } from "@/lib/utils";
import {
  ArrowUpDown,
  Clock,
  Edit3,
  ArrowRight,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  FileText,
  AlertTriangle,
  Archive,
  Printer,
} from "lucide-react";

interface DenseDocumentTableProps {
  data: Documento[];
  selectedDocId: number | null;
  onSelectDoc: (doc: Documento) => void;
  onOpenMovementDrawer: (doc: Documento) => void;
  onArchivarDoc?: (doc: Documento) => void;
  onOpenReceiptModal?: (doc: Documento) => void;
  highlightedDocIds: Set<number>;
  activeEditors: Record<number, string>;
  selectedIndex: number;
}

export function DenseDocumentTable({
  data,
  selectedDocId,
  onSelectDoc,
  onOpenMovementDrawer,
  onArchivarDoc,
  onOpenReceiptModal,
  highlightedDocIds,
  activeEditors,
  selectedIndex,
}: DenseDocumentTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "ultimo_movimiento_at", desc: true },
  ]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 100,
  });

  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyToClipboard = (doc: Documento, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(doc.numero_expediente);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columns = useMemo<ColumnDef<Documento>[]>(
    () => [
      {
        accessorKey: "prioridad",
        header: "Pri.",
        size: 50,
        cell: (info) => {
          const val = String(info.getValue() || "NORMAL");
          if (val === "NORMAL") return null;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-2xs",
                val === "URGENTE"
                  ? "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800"
                  : "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800"
              )}
            >
              <AlertTriangle className="h-2.5 w-2.5" />
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
            className="flex items-center space-x-1 font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200 transition"
            title="Fecha de ingreso a la Secretaría Privada"
          >
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>F. Entrada</span>
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          </button>
        ),
        size: 100,
        cell: (info) => {
          const val = String(info.getValue() || "");
          if (!val) return <span className="text-slate-300 dark:text-slate-600 text-[11px]">-</span>;
          try {
            const d = new Date(val);
            const dateStr = d.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
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
            className="flex items-center space-x-1 font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200 transition"
          >
            <span>N° Expediente / Trámite</span>
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          </button>
        ),
        size: 195,
        cell: (info) => {
          const doc = info.row.original;
          const isHighlighted = highlightedDocIds.has(doc.id);
          const editor = activeEditors[doc.id];
          const isCopied = copiedId === doc.id;

          return (
            <div className="flex items-center space-x-1.5 group">
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {String(info.getValue())}
              </span>

              {/* Instant Copy to Clipboard Button */}
              <button
                type="button"
                onClick={(e) => copyToClipboard(doc, e)}
                title="Copiar número de expediente"
                className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
              >
                {isCopied ? (
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>

              {isHighlighted && (
                <span className="inline-flex items-center rounded bg-blue-600 px-1.5 py-0.2 text-[9px] font-black text-white shadow-xs animate-pulse">
                  ACTUALIZADO
                </span>
              )}
              {editor && (
                <span
                  title={`${editor} está interviniendo este trámite`}
                  className="inline-flex items-center space-x-0.5 rounded bg-amber-500 px-1.5 py-0.2 text-[9px] font-bold text-white animate-bounce shadow-xs"
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
        cell: (info) => {
          const val = String(info.getValue() || "EXPEDIENTE");
          return (
            <span
              className={cn(
                "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-tight uppercase",
                val === "EXPEDIENTE"
                  ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  : val === "RESOLUCION"
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"
                  : val === "DECRETO"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                  : val === "NOTA"
                  ? "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
              )}
            >
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: "iniciador_caratula",
        header: "Ámbito Origen / Carátula y Resumen",
        size: 360,
        cell: (info) => {
          const doc = info.row.original;
          const text = doc.iniciador_caratula || "";
          const matchAmbito = text.match(/^\[(.*?)\]\s*(.*)$/);
          const ambito = matchAmbito ? matchAmbito[1] : null;
          const resumen = matchAmbito ? matchAmbito[2] : text;

          return (
            <div className="max-w-md truncate" title={text}>
              {ambito && (
                <span className="inline-block mr-1.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 text-[9px] font-bold tracking-wide uppercase dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
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
            className="flex items-center space-x-1 font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200 transition"
          >
            <span>Estado</span>
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          </button>
        ),
        size: 120,
        cell: (info) => {
          const val = String(info.getValue());
          let dotColor = "bg-slate-400";
          if (val === "FIRMADO") dotColor = "bg-emerald-500 shadow-sm shadow-emerald-500/50";
          else if (val === "DESPACHO") dotColor = "bg-amber-500 shadow-sm shadow-amber-500/50";
          else if (val === "EN MANO") dotColor = "bg-sky-500 shadow-sm shadow-sky-500/50";
          else if (val === "OBSERVADO") dotColor = "bg-rose-500 shadow-sm shadow-rose-500/50";

          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                getEstadoBadgeClass(val)
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: "destino_actual",
        header: "Ámbito Enviado / Destino",
        size: 190,
        cell: (info) => (
          <span
            className="font-semibold text-slate-800 dark:text-slate-200 truncate block text-xs"
            title={String(info.getValue())}
          >
            {String(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "portador_actual",
        header: "Portador / Retiró",
        size: 145,
        cell: (info) => (
          <span
            className="text-slate-700 dark:text-slate-300 truncate block text-xs"
            title={String(info.getValue())}
          >
            {String(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "foja_actual",
        header: "Fojas",
        size: 65,
        cell: (info) => (
          <span className="font-mono text-center block text-slate-700 dark:text-slate-300 font-bold text-xs">
            {String(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "ultimo_movimiento_at",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center space-x-1 font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200 transition"
            title="Fecha y hora de salida de la Secretaría"
          >
            <Clock className="h-3 w-3 text-slate-400" />
            <span>F. Salida</span>
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          </button>
        ),
        size: 110,
        cell: (info) => {
          const doc = info.row.original;
          const val = doc.ultimo_movimiento_at;
          if (!val) return <span className="text-slate-300 dark:text-slate-600 text-[11px]">-</span>;
          try {
            const d = new Date(val);
            const dateStr = d.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
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
        size: 85,
        cell: (info) => {
          const doc = info.row.original;
          const hasSalida = Boolean(doc.ultimo_movimiento_at);
          const isArchivado = doc.estado_actual === "ARCHIVO";

          // If the document has a departure date, it is NOT in the office; it cannot have a Pase.
          if (hasSalida) {
            if (isArchivado) {
              return (
                <span className="inline-flex items-center space-x-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                  <Archive className="h-3 w-3" />
                  <span>Archivado</span>
                </span>
              );
            }

            return (
              <div className="flex items-center space-x-1.5 justify-end">
                {onOpenReceiptModal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenReceiptModal(doc);
                    }}
                    className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1 text-slate-500 hover:text-slate-900 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white transition shadow-2xs"
                    title="Imprimir Volante Oficial de Remito con QR"
                  >
                    <Printer className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchivarDoc?.(doc);
                  }}
                  className="inline-flex items-center space-x-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 shadow-2xs hover:bg-slate-800 hover:text-white hover:border-slate-800 transition active:scale-95 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-700"
                  title={`El documento ya egresó hacia ${doc.destino_actual || "su ámbito"}. Pasar a Archivo definitivo.`}
                >
                  <Archive className="h-3 w-3 text-slate-500" />
                  <span>Archivar</span>
                </button>
              </div>
            );
          }

          // Document is physically in the office, allow Pase
          return (
            <div className="flex items-center space-x-1.5 justify-end">
              {onOpenReceiptModal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenReceiptModal(doc);
                  }}
                  className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1 text-slate-500 hover:text-blue-600 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-blue-400 transition shadow-2xs"
                  title="Imprimir Volante Oficial de Remito con QR"
                >
                  <Printer className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMovementDrawer(doc);
                }}
                className="inline-flex items-center space-x-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 shadow-2xs hover:bg-blue-600 hover:text-white hover:border-blue-600 transition active:scale-95 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white"
                title="Registrar nuevo pase (P)"
              >
                <span>Pase</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          );
        },
      },
    ],
    [highlightedDocIds, activeEditors, onOpenMovementDrawer, onArchivarDoc, onOpenReceiptModal, copiedId]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalRows = data.length;
  const currentFirstRow = pagination.pageIndex * pagination.pageSize + 1;
  const currentLastRow = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-white dark:bg-slate-950">
      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 backdrop-blur-xs text-[11px] font-bold uppercase tracking-wider text-slate-600 shadow-xs dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-400">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="px-3 py-2.5 font-semibold select-none"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="font-medium">No se encontraron expedientes con los filtros actuales.</p>
                    <p className="text-xs text-slate-400">Prueba ajustando la búsqueda o limpiando los filtros.</p>
                  </div>
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
                      "cursor-pointer select-none transition-colors border-l-2",
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-950"
                        : "bg-slate-50/40 dark:bg-slate-900/30",
                      "hover:bg-blue-50/60 dark:hover:bg-blue-950/30",
                      isSelected
                        ? "border-l-blue-600 bg-blue-100/60 dark:bg-blue-900/40 font-medium"
                        : "border-l-transparent",
                      isHighlighted &&
                        "bg-blue-200/90 dark:bg-blue-700/60 ring-2 ring-blue-500 animate-pulse"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className="px-3 py-1.5 whitespace-nowrap"
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

      {/* Modern High-Density Pagination Footer Bar */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/90 px-4 py-2 text-xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400">
          <span>
            Mostrando{" "}
            <strong className="font-semibold text-slate-900 dark:text-white">
              {totalRows > 0 ? `${currentFirstRow.toLocaleString("es-AR")} - ${currentLastRow.toLocaleString("es-AR")}` : "0"}
            </strong>{" "}
            de{" "}
            <strong className="font-semibold text-slate-900 dark:text-white">
              {totalRows.toLocaleString("es-AR")}
            </strong>{" "}
            trámites
          </span>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          {/* Rows per page selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px]">Por página:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {[50, 100, 250, 500, 1000].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="Primera página"
            className="rounded p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Página anterior"
            className="rounded p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {Math.max(table.getPageCount(), 1)}
          </span>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Página siguiente"
            className="rounded p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title="Última página"
            className="rounded p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
