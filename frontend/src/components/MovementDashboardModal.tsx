"use client";

import React, { useState, useMemo } from "react";
import { Documento, Movimiento } from "@/types";
import {
  X,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  ArrowRight,
  Clock,
  UserCheck,
  Building,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Send,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { getEstadoBadgeClass, cn } from "@/lib/utils";

interface MovementDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentos: Documento[];
  onApplyFilter: (filters: { estado?: string; destino?: string; search?: string }) => void;
  onOpenMovementDrawer: (doc: Documento) => void;
}

type PeriodFilter = "TODOS" | "2026" | "2025" | "ULTIMOS_30_DIAS";

export function MovementDashboardModal({
  isOpen,
  onClose,
  documentos,
  onApplyFilter,
  onOpenMovementDrawer,
}: MovementDashboardModalProps) {
  const [periodo, setPeriodo] = useState<PeriodFilter>("TODOS");
  const [activeTab, setActiveTab] = useState<"graficos" | "flujo" | "pases">("graficos");
  const [hoveredStateSegment, setHoveredStateSegment] = useState<string | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Filter documents by selected period
  const docsFiltrados = useMemo(() => {
    if (periodo === "TODOS") return documentos;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return documentos.filter((d) => {
      if (periodo === "2026") return d.anio === 2026;
      if (periodo === "2025") return d.anio === 2025;
      if (periodo === "ULTIMOS_30_DIAS") {
        if (!d.fecha_ingreso && !d.ultimo_movimiento_at) return false;
        const dt = new Date(d.ultimo_movimiento_at || d.fecha_ingreso || 0);
        return dt >= thirtyDaysAgo;
      }
      return true;
    });
  }, [documentos, periodo]);

  // Executive KPI Metrics
  const kpis = useMemo(() => {
    const total = docsFiltrados.length;
    let firmados = 0;
    let despacho = 0;
    let enMano = 0;
    let observados = 0;
    let urgentes = 0;
    let totalFojas = 0;

    for (const d of docsFiltrados) {
      if (d.estado_actual === "FIRMADO") firmados++;
      else if (d.estado_actual === "DESPACHO") despacho++;
      else if (d.estado_actual === "EN MANO") enMano++;
      else if (d.estado_actual === "OBSERVADO") observados++;

      if (d.prioridad === "URGENTE" || d.prioridad === "PRONTO DESPACHO") urgentes++;
      totalFojas += Number(d.foja_actual) || 1;
    }

    const pctFirmados = total > 0 ? ((firmados / total) * 100).toFixed(1) : "0.0";
    const pctDespacho = total > 0 ? ((despacho / total) * 100).toFixed(1) : "0.0";
    const promedioFojas = total > 0 ? Math.round(totalFojas / total) : 0;

    return {
      total,
      firmados,
      despacho,
      enMano,
      observados,
      urgentes,
      pctFirmados,
      pctDespacho,
      promedioFojas,
    };
  }, [docsFiltrados]);

  // Distribution by Status (for interactive SVG Donut)
  const estadoData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of docsFiltrados) {
      const st = d.estado_actual || "DESCONOCIDO";
      counts[st] = (counts[st] || 0) + 1;
    }

    const colors: Record<string, string> = {
      FIRMADO: "#10b981", // emerald-500
      DESPACHO: "#f59e0b", // amber-500
      "EN MANO": "#0284c7", // sky-600
      OBSERVADO: "#f43f5e", // rose-500
      ARCHIVO: "#64748b", // slate-500
      INICIADO: "#3b82f6", // blue-500
      NOTIFICADO: "#8b5cf6", // violet-500
    };

    const entries = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: kpis.total > 0 ? (count / kpis.total) * 100 : 0,
      color: colors[name] || "#94a3b8",
    }));

    return entries.sort((a, b) => b.count - a.count);
  }, [docsFiltrados, kpis.total]);

  // Temporal Movement Curve: Group by Month
  const seriesTemporal = useMemo(() => {
    const mesesMap: Record<string, { mes: string; entradas: number; salidas: number; dateKey: string }> = {};

    const mesesNombres = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];

    docsFiltrados.forEach((d) => {
      if (d.fecha_ingreso) {
        try {
          const dt = new Date(d.fecha_ingreso);
          const y = dt.getFullYear();
          const m = dt.getMonth();
          const key = `${y}-${String(m + 1).padStart(2, "0")}`;
          const label = `${mesesNombres[m]} ${y}`;
          if (!mesesMap[key]) {
            mesesMap[key] = { mes: label, entradas: 0, salidas: 0, dateKey: key };
          }
          mesesMap[key].entradas++;
        } catch {}
      }

      if (d.ultimo_movimiento_at) {
        try {
          const dt = new Date(d.ultimo_movimiento_at);
          const y = dt.getFullYear();
          const m = dt.getMonth();
          const key = `${y}-${String(m + 1).padStart(2, "0")}`;
          const label = `${mesesNombres[m]} ${y}`;
          if (!mesesMap[key]) {
            mesesMap[key] = { mes: label, entradas: 0, salidas: 0, dateKey: key };
          }
          mesesMap[key].salidas++;
        } catch {}
      }
    });

    const sorted = Object.values(mesesMap).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return sorted.slice(-12); // Last 12 months
  }, [docsFiltrados]);

  // Top Origins (Ámbitos de procedencia)
  const topOrigenes = useMemo(() => {
    const counts: Record<string, number> = {};
    docsFiltrados.forEach((d) => {
      const match = (d.iniciador_caratula || "").match(/^\[(.*?)\]/);
      const origen = match ? match[1].trim() : "MESA DE ENTRADAS";
      counts[origen] = (counts[origen] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [docsFiltrados]);

  // Top Destinations (Ámbitos a donde salen)
  const topDestinos = useMemo(() => {
    const counts: Record<string, number> = {};
    docsFiltrados.forEach((d) => {
      const dest = d.destino_actual?.trim() || "SIN DESTINO";
      counts[dest] = (counts[dest] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [docsFiltrados]);

  // Distribution by Document Type
  const topTipos = useMemo(() => {
    const counts: Record<string, number> = {};
    docsFiltrados.forEach((d) => {
      const t = d.tipo_documento?.trim() || "EXPEDIENTE";
      counts[t] = (counts[t] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count);
  }, [docsFiltrados]);

  if (!isOpen) return null;

  // Max value for temporal chart scaling
  const maxTemporal = Math.max(
    ...seriesTemporal.map((s) => Math.max(s.entradas, s.salidas)),
    10
  );

  // Max values for horizontal bar charts
  const maxOrigen = topOrigenes.length > 0 ? topOrigenes[0].count : 1;
  const maxDestino = topDestinos.length > 0 ? topDestinos[0].count : 1;

  // SVG Donut calculation helper
  let cumulativeAngle = 0;
  const donutSlices = estadoData.map((slice) => {
    const angle = (slice.count / (kpis.total || 1)) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((startAngle + angle - 90) * Math.PI) / 180;

    const x1 = 100 + 70 * Math.cos(startRad);
    const y1 = 100 + 70 * Math.sin(startRad);
    const x2 = 100 + 70 * Math.cos(endRad);
    const y2 = 100 + 70 * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;
    const pathData = `M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      ...slice,
      pathData,
      startAngle,
      angle,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200/90 bg-slate-50/90 px-6 py-3.5 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Dashboard de Movimientos y Flujo Documental
                </h2>
                <span className="rounded-full bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-black text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 uppercase">
                  Interactivo
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Trazabilidad de entradas, salidas, despachos y resoluciones de Secretaría Privada
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 mt-2 sm:mt-0">
            {/* Period Switcher */}
            <div className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setPeriodo("TODOS")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-bold transition",
                  periodo === "TODOS"
                    ? "bg-slate-900 text-white shadow-2xs dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                Histórico
              </button>
              <button
                type="button"
                onClick={() => setPeriodo("2026")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-bold transition",
                  periodo === "2026"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                2026
              </button>
              <button
                type="button"
                onClick={() => setPeriodo("2025")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-bold transition",
                  periodo === "2025"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                2025
              </button>
              <button
                type="button"
                onClick={() => setPeriodo("ULTIMOS_30_DIAS")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-bold transition",
                  periodo === "ULTIMOS_30_DIAS"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                Últimos 30d
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setActiveTab("graficos")}
                className={cn(
                  "flex items-center space-x-1 rounded-md px-3 py-1 font-bold transition",
                  activeTab === "graficos"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                )}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Métricas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("flujo")}
                className={cn(
                  "flex items-center space-x-1 rounded-md px-3 py-1 font-bold transition",
                  activeTab === "flujo"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Flujo de Ámbitos</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition"
              title="Cerrar dashboard (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Row 1: Executive KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Total */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Registros
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {kpis.total.toLocaleString("es-AR")}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">100%</span>
              </div>
            </div>

            {/* Firmados */}
            <div
              onClick={() => {
                onApplyFilter({ estado: "FIRMADO" });
                onClose();
              }}
              className="cursor-pointer group rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-2xs hover:border-emerald-400 transition dark:border-emerald-900/60 dark:bg-emerald-950/30"
              title="Hacer clic para filtrar en la mesa"
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                <span>✍️ Firmados</span>
                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  {kpis.firmados.toLocaleString("es-AR")}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {kpis.pctFirmados}%
                </span>
              </div>
            </div>

            {/* En Despacho */}
            <div
              onClick={() => {
                onApplyFilter({ estado: "DESPACHO" });
                onClose();
              }}
              className="cursor-pointer group rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-2xs hover:border-amber-400 transition dark:border-amber-900/60 dark:bg-amber-950/30"
              title="Hacer clic para filtrar en la mesa"
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                <span>📬 En Despacho</span>
                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
                  {kpis.despacho.toLocaleString("es-AR")}
                </span>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {kpis.pctDespacho}%
                </span>
              </div>
            </div>

            {/* En Mano */}
            <div
              onClick={() => {
                onApplyFilter({ estado: "EN MANO" });
                onClose();
              }}
              className="cursor-pointer group rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-2xs hover:border-blue-400 transition dark:border-blue-900/60 dark:bg-blue-950/30"
              title="Hacer clic para filtrar en la mesa"
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                <span>🤝 En Mano</span>
                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono">
                  {kpis.enMano.toLocaleString("es-AR")}
                </span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {kpis.total > 0 ? ((kpis.enMano / kpis.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* Observados */}
            <div
              onClick={() => {
                onApplyFilter({ estado: "OBSERVADO" });
                onClose();
              }}
              className="cursor-pointer group rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-2xs hover:border-rose-400 transition dark:border-rose-900/60 dark:bg-rose-950/30"
              title="Hacer clic para filtrar en la mesa"
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                <span>⚠️ Observados</span>
                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-700 dark:text-rose-300 font-mono">
                  {kpis.observados.toLocaleString("es-AR")}
                </span>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  {kpis.total > 0 ? ((kpis.observados / kpis.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* Urgentes */}
            <div className="rounded-xl border border-red-200 bg-red-50/40 p-3.5 shadow-2xs dark:border-red-900/60 dark:bg-red-950/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-800 dark:text-red-300 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" /> Urgentes
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-red-700 dark:text-red-300 font-mono">
                  {kpis.urgentes}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {kpis.promedioFojas} fojas prom.
                </span>
              </div>
            </div>
          </div>

          {/* Tab 1: Evolución Temporal & Donut */}
          {activeTab === "graficos" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Temporal Area/Bar Chart (2 columns) */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Evolución Mensual de Movimientos (Ingresos vs. Salidas)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Comparativa de volumen de expedientes recibidos vs. derivados
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center space-x-1.5 font-bold text-blue-600">
                      <span className="h-3 w-3 rounded-sm bg-blue-500" />
                      <span>Ingresos (F. Entrada)</span>
                    </span>
                    <span className="flex items-center space-x-1.5 font-bold text-emerald-600">
                      <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                      <span>Salidas (Pases)</span>
                    </span>
                  </div>
                </div>

                {/* SVG Interactive Chart */}
                <div className="h-64 w-full relative pt-4">
                  {seriesTemporal.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      Sin datos temporales en este período
                    </div>
                  ) : (
                    <div className="flex h-full items-end gap-2.5 pb-8 border-b border-slate-100 dark:border-slate-800">
                      {seriesTemporal.map((item, idx) => {
                        const hEntradas = (item.entradas / maxTemporal) * 180;
                        const hSalidas = (item.salidas / maxTemporal) * 180;
                        const isHovered = hoveredBarIndex === idx;

                        return (
                          <div
                            key={item.dateKey}
                            onMouseEnter={() => setHoveredBarIndex(idx)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                            className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                          >
                            {/* Hover Tooltip */}
                            {isHovered && (
                              <div className="absolute -top-12 z-30 rounded-lg bg-slate-900 text-white px-2.5 py-1.5 text-[11px] shadow-lg pointer-events-none whitespace-nowrap dark:bg-white dark:text-slate-900">
                                <p className="font-bold">{item.mes}</p>
                                <p className="text-blue-400 dark:text-blue-600 font-mono">
                                  Ingresos: {item.entradas.toLocaleString("es-AR")}
                                </p>
                                <p className="text-emerald-400 dark:text-emerald-600 font-mono">
                                  Salidas: {item.salidas.toLocaleString("es-AR")}
                                </p>
                              </div>
                            )}

                            {/* Dual Bars */}
                            <div className="flex items-end space-x-1 w-full justify-center">
                              {/* Entradas */}
                              <div
                                style={{ height: `${Math.max(hEntradas, 4)}px` }}
                                className={cn(
                                  "w-3.5 rounded-t bg-blue-500 transition-all duration-300",
                                  isHovered ? "bg-blue-600 ring-2 ring-blue-300" : "opacity-85"
                                )}
                              />
                              {/* Salidas */}
                              <div
                                style={{ height: `${Math.max(hSalidas, 4)}px` }}
                                className={cn(
                                  "w-3.5 rounded-t bg-emerald-500 transition-all duration-300",
                                  isHovered ? "bg-emerald-600 ring-2 ring-emerald-300" : "opacity-85"
                                )}
                              />
                            </div>

                            {/* Month Label */}
                            <span className="absolute -bottom-6 text-[10px] font-bold text-slate-500 tracking-tight text-center">
                              {item.mes.split(" ")[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Donut Chart (1 column) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                    <PieChartIcon className="h-4 w-4 text-blue-600" />
                    Distribución por Estado
                  </h3>
                  <p className="text-xs text-slate-500">
                    Proporción de resoluciones y trámites en curso
                  </p>
                </div>

                {/* SVG Donut Visualizer */}
                <div className="relative flex items-center justify-center my-4">
                  <svg viewBox="0 0 200 200" className="h-44 w-44">
                    {donutSlices.map((slice) => (
                      <path
                        key={slice.name}
                        d={slice.pathData}
                        fill={slice.color}
                        onMouseEnter={() => setHoveredStateSegment(slice.name)}
                        onMouseLeave={() => setHoveredStateSegment(null)}
                        className="transition-all duration-200 cursor-pointer hover:opacity-90 hover:scale-105 origin-center"
                      />
                    ))}
                    {/* Inner hole */}
                    <circle cx="100" cy="100" r="45" className="fill-white dark:fill-slate-900" />
                  </svg>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {hoveredStateSegment || "ESTADO"}
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                      {hoveredStateSegment
                        ? estadoData.find((s) => s.name === hoveredStateSegment)?.count.toLocaleString("es-AR")
                        : kpis.total.toLocaleString("es-AR")}
                    </span>
                    {hoveredStateSegment && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {estadoData.find((s) => s.name === hoveredStateSegment)?.pct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Legend Chips with One-Click Filter */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {estadoData.slice(0, 4).map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        onApplyFilter({ estado: item.name });
                        onClose();
                      }}
                      className="w-full flex items-center justify-between rounded-lg px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition group text-left"
                      title="Hacer clic para filtrar en la mesa"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-slate-900 dark:text-white font-bold">
                          {item.count.toLocaleString("es-AR")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold w-9 text-right">
                          {item.pct.toFixed(1)}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Flujo de Ámbitos (Top Orígenes vs Top Destinos) */}
          {activeTab === "flujo" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Orígenes */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    Top 7 Ámbitos de Origen (Procedencia)
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">Volumen recibido</span>
                </div>

                <div className="space-y-3">
                  {topOrigenes.map((orig, i) => {
                    const pct = (orig.count / maxOrigen) * 100;
                    return (
                      <div
                        key={orig.nombre}
                        onClick={() => {
                          onApplyFilter({ search: orig.nombre });
                          onClose();
                        }}
                        className="group cursor-pointer rounded-lg p-2 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition"
                        title="Hacer clic para filtrar documentos de este ámbito"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition truncate max-w-xs">
                            {i + 1}. {orig.nombre}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {orig.count.toLocaleString("es-AR")} trámites
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Destinos */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Send className="h-4 w-4 text-emerald-600" />
                    Top 7 Ámbitos de Destino (Derivaciones)
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">Volumen enviado</span>
                </div>

                <div className="space-y-3">
                  {topDestinos.map((dest, i) => {
                    const pct = (dest.count / maxDestino) * 100;
                    return (
                      <div
                        key={dest.nombre}
                        onClick={() => {
                          onApplyFilter({ destino: dest.nombre });
                          onClose();
                        }}
                        className="group cursor-pointer rounded-lg p-2 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 transition"
                        title="Hacer clic para filtrar documentos hacia este destino"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition truncate max-w-xs">
                            {i + 1}. {dest.nombre}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {dest.count.toLocaleString("es-AR")} trámites
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Row 3: Breakdown by Type of Document */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              Tipología Documental en Secretaría
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {topTipos.map((tipo) => (
                <div
                  key={tipo.nombre}
                  onClick={() => {
                    onApplyFilter({ search: tipo.nombre });
                    onClose();
                  }}
                  className="cursor-pointer group rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 hover:border-blue-400 hover:bg-blue-50/50 transition dark:border-slate-800 dark:bg-slate-850 dark:hover:bg-blue-950/30"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-600 transition">
                    {tipo.nombre}
                  </span>
                  <p className="mt-1 text-xl font-black text-slate-900 dark:text-white font-mono">
                    {tipo.count.toLocaleString("es-AR")}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400">
                    {kpis.total > 0 ? ((tipo.count / kpis.total) * 100).toFixed(1) : 0}% del área
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-slate-500">
            Secretar·iA Analytics — Secretaría Privada del Ministerio de Gobierno
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-1.5 font-bold text-white shadow-2xs hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition active:scale-95"
          >
            Cerrar Vista
          </button>
        </div>
      </div>
    </div>
  );
}
