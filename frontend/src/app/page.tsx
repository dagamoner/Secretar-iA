"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAreas,
  fetchCatalogosDestinos,
  fetchUsuarios,
  fetchDocumentos,
  registrarMovimiento,
} from "@/lib/api";
import { Area, Usuario, Documento, FilterState } from "@/types";
import { useRealtimeArea } from "@/hooks/useRealtimeArea";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

import { Header } from "@/components/Header";
import { FilterToolbar } from "@/components/FilterToolbar";
import { DenseDocumentTable } from "@/components/DenseDocumentTable";
import { KanbanBoard } from "@/components/KanbanBoard";
import { MovementDrawer } from "@/components/MovementDrawer";
import { NewDocumentModal } from "@/components/NewDocumentModal";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { AdminModal } from "@/components/AdminModal";
import { LoginScreen } from "@/components/LoginScreen";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { MovementDashboardModal } from "@/components/MovementDashboardModal";
import { normalizeSearchText } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";

export default function HomePage() {
  const queryClient = useQueryClient();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Area Multi-Tenant State
  const [currentAreaId, setCurrentAreaId] = useState<number>(1);

  // Modals & Drawer State
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"tabla" | "kanban">("tabla");

  // Keyboard navigation & search trigger state
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [focusSearchTrigger, setFocusSearchTrigger] = useState<number>(0);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    estado: "TODOS",
    portador: "TODOS",
    destino: "TODOS",
    prioridad: "TODOS",
  });

  // Queries
  const { data: areas = [] } = useQuery<Area[]>({
    queryKey: ["areas"],
    queryFn: fetchAreas,
  });

  // Ensure currentAreaId is valid once areas load
  React.useEffect(() => {
    if (areas.length > 0 && !areas.some((a) => a.id === currentAreaId)) {
      setCurrentAreaId(areas[0].id);
    }
  }, [areas, currentAreaId]);

  const { data: catalogosDestinos = [] } = useQuery({
    queryKey: ["catalogosDestinos", currentAreaId],
    queryFn: () => fetchCatalogosDestinos(currentAreaId),
    enabled: !!currentAreaId,
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ["usuarios", currentAreaId],
    queryFn: () => fetchUsuarios(currentAreaId),
    enabled: !!currentAreaId,
  });

  // Restore logged-in user on client mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("secretaria_auth_user");
      if (saved) {
        try {
          const u: Usuario = JSON.parse(saved);
          setCurrentUser(u);
          if (u.area_id) {
            setCurrentAreaId(u.area_id);
          }
        } catch {
          localStorage.removeItem("secretaria_auth_user");
        }
      }
      setIsAuthLoaded(true);
    }
  }, []);

  // Update current user info if refreshed in usuarios list
  React.useEffect(() => {
    if (currentUser && usuarios.length > 0) {
      const matched = usuarios.find((u) => u.id === currentUser.id);
      if (matched && matched.nombre_completo !== currentUser.nombre_completo) {
        setCurrentUser(matched);
      }
    }
  }, [usuarios, currentUser]);

  // Fetch full area documents once (TanStack Query cached)
  const { data: todosLosDocumentos = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ["documentos", currentAreaId],
    queryFn: () => fetchDocumentos(currentAreaId),
    enabled: !!currentAreaId,
  });

  // Real-Time WebSocket Hook (Emits events, invalidates TanStack cache, highlights rows for 3 seconds)
  const { isConnected, highlightedDocIds, activeEditors } = useRealtimeArea(currentAreaId);

  // Distinct options for dropdown filters (always complete from all area documents)
  const destinosDisponibles = useMemo(() => {
    const set = new Set<string>();
    todosLosDocumentos.forEach((d) => {
      if (d.destino_actual) set.add(d.destino_actual);
    });
    return Array.from(set).sort();
  }, [todosLosDocumentos]);

  const portadoresDisponibles = useMemo(() => {
    const set = new Set<string>();
    todosLosDocumentos.forEach((d) => {
      if (d.portador_actual) set.add(d.portador_actual);
    });
    return Array.from(set).sort();
  }, [todosLosDocumentos]);

  // Executive KPI stats for quick dashboard metrics & instant chips
  const stats = useMemo(() => {
    let total = todosLosDocumentos.length;
    let firmados = 0;
    let despacho = 0;
    let enMano = 0;
    let observados = 0;
    let urgentes = 0;
    let misTramites = 0;

    const myName = currentUser?.nombre_completo ? normalizeSearchText(currentUser.nombre_completo) : "";

    for (const d of todosLosDocumentos) {
      if (d.estado_actual === "FIRMADO") firmados++;
      else if (d.estado_actual === "DESPACHO") despacho++;
      else if (d.estado_actual === "EN MANO") enMano++;
      else if (d.estado_actual === "OBSERVADO") observados++;

      if (d.prioridad === "URGENTE" || d.prioridad === "PRONTO DESPACHO") urgentes++;

      if (myName && normalizeSearchText(d.portador_actual).includes(myName)) {
        misTramites++;
      }
    }

    return { total, firmados, despacho, enMano, observados, urgentes, misTramites };
  }, [todosLosDocumentos, currentUser]);

  // Instant real-time filtered documents (0ms latency, accent-insensitive, null-safe)
  const documentos = useMemo(() => {
    let list = todosLosDocumentos;

    if (filters.search && filters.search.trim()) {
      const q = normalizeSearchText(filters.search);
      list = list.filter((d) => {
        const num = normalizeSearchText(d.numero_expediente);
        const cara = normalizeSearchText(d.iniciador_caratula);
        const ext = normalizeSearchText(d.extracto);
        const dest = normalizeSearchText(d.destino_actual);
        const port = normalizeSearchText(d.portador_actual);
        const tipo = normalizeSearchText(d.tipo_documento);
        const anio = String(d.anio || "");
        return (
          num.includes(q) ||
          cara.includes(q) ||
          ext.includes(q) ||
          dest.includes(q) ||
          port.includes(q) ||
          tipo.includes(q) ||
          anio.includes(q)
        );
      });
    }

    if (filters.estado && filters.estado !== "TODOS") {
      list = list.filter((d) => d.estado_actual === filters.estado);
    }

    if (filters.portador && filters.portador !== "TODOS") {
      const p = normalizeSearchText(filters.portador);
      list = list.filter((d) => normalizeSearchText(d.portador_actual).includes(p));
    }

    if (filters.destino && filters.destino !== "TODOS") {
      const des = normalizeSearchText(filters.destino);
      list = list.filter((d) => normalizeSearchText(d.destino_actual).includes(des));
    }

    if (filters.prioridad && filters.prioridad !== "TODOS") {
      list = list.filter((d) => d.prioridad === filters.prioridad);
    }

    return list;
  }, [todosLosDocumentos, filters]);

  // Actions
  const handleOpenMovement = (doc?: Documento) => {
    const target = doc || documentos[selectedIndex] || selectedDoc;
    if (target) {
      setSelectedDoc(target);
      setIsDrawerOpen(true);
    }
  };

  // Keyboard Shortcuts Binding
  useKeyboardShortcuts({
    onFocusSearch: () => setFocusSearchTrigger((prev) => prev + 1),
    onNewDocument: () => setIsNewDocOpen(true),
    onOpenMovement: () => handleOpenMovement(),
    onSelectNextRow: () => {
      if (documentos.length > 0) {
        setSelectedIndex((prev) => Math.min(prev + 1, documentos.length - 1));
      }
    },
    onSelectPrevRow: () => {
      if (documentos.length > 0) {
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }
    },
    onEscape: () => {
      setIsDrawerOpen(false);
      setIsNewDocOpen(false);
      setIsHelpOpen(false);
      setIsDashboardOpen(false);
    },
    onToggleHelp: () => setIsHelpOpen((prev) => !prev),
    onToggleDashboard: () => setIsDashboardOpen((prev) => !prev),
    onToggleViewMode: () => setViewMode((prev) => (prev === "tabla" ? "kanban" : "tabla")),
  });

  // Loading screen while checking authentication session
  if (!isAuthLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-xs font-semibold text-slate-500">Iniciando Secretar·iA...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, display login screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (typeof window !== "undefined") {
            localStorage.setItem("secretaria_auth_user", JSON.stringify(user));
          }
          if (user.area_id) {
            setCurrentAreaId(user.area_id);
          }
        }}
      />
    );
  }

  // Instant Export to Excel matching the exact layout of the office
  const handleExportExcel = () => {
    const listToExport = documentos.length > 0 ? documentos : todosLosDocumentos;
    const exportRows = listToExport.map((d) => {
      let fIngreso = "";
      let dia = "";
      let mes = "";
      let anioIngreso = "";
      if (d.fecha_ingreso) {
        try {
          const dt = new Date(d.fecha_ingreso);
          dia = String(dt.getDate());
          mes = String(dt.getMonth() + 1);
          anioIngreso = String(dt.getFullYear());
          fIngreso = dt.toLocaleDateString("es-AR");
        } catch {}
      }

      let fSalida = "";
      if (d.ultimo_movimiento_at) {
        try {
          const dt = new Date(d.ultimo_movimiento_at);
          fSalida = dt.toLocaleDateString("es-AR");
        } catch {}
      }

      let ambitoOrigen = "";
      let caratulaLimpia = d.iniciador_caratula || "";
      const matchAmb = caratulaLimpia.match(/^\[(.*?)\]\s*(.*)$/);
      if (matchAmb) {
        ambitoOrigen = matchAmb[1];
        caratulaLimpia = matchAmb[2];
      }

      return {
        DIA: dia,
        MES: mes,
        AÑO: anioIngreso,
        "F. ENTRADA": fIngreso,
        "N° EXPEDIENTE": d.numero_expediente,
        TIPO: d.tipo_documento,
        "AMBITO ORIGEN": ambitoOrigen,
        "CARATULADO / RESUMEN": caratulaLimpia,
        ESTADO: d.estado_actual,
        "F. SALIDA": fSalida,
        "AMBITO DESTINO": d.destino_actual,
        "PORTADOR / RETIRO": d.portador_actual,
        FOJAS: d.foja_actual,
        PRIORIDAD: d.prioridad,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expedientes");
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 6 },
      { wch: 6 },
      { wch: 12 },
      { wch: 25 },
      { wch: 14 },
      { wch: 22 },
      { wch: 60 },
      { wch: 14 },
      { wch: 12 },
      { wch: 30 },
      { wch: 25 },
      { wch: 8 },
      { wch: 12 },
    ];
    const todayStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Secretaria_Privada_Expedientes_${todayStr}.xlsx`);
  };

  // Handler for archiving a document that has already left the office
  const handleArchivarDoc = async (doc: Documento) => {
    const confirmArchivar = window.confirm(
      `¿Deseas enviar el expediente ${doc.numero_expediente} a ARCHIVO definitivo?`
    );
    if (!confirmArchivar) return;

    try {
      await registrarMovimiento({
        area_id: currentAreaId,
        documento_id: doc.id,
        estado_nuevo: "ARCHIVO",
        destino_nuevo: "Archivo Central",
        portador_nuevo: "Archivo",
        fojas_agregadas: 0,
        observacion: `Archivado por encontrarse tramitado y egresado del área hacia ${doc.destino_actual || "su destino"}.`,
        usuario_id: currentUser?.id,
        usuario_nombre: currentUser?.nombre_completo || "Operador",
      });

      queryClient.invalidateQueries({ queryKey: ["documentos", currentAreaId] });
    } catch (e: any) {
      alert("Error al archivar el documento: " + (e.message || "Error desconocido"));
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Header Bar */}
      <Header
        areas={areas}
        currentAreaId={currentAreaId}
        onAreaChange={(id) => {
          setCurrentAreaId(id);
          setSelectedDoc(null);
          setSelectedIndex(0);
        }}
        usuarios={usuarios}
        currentUser={currentUser}
        onUserChange={(u) => {
          setCurrentUser(u);
          if (typeof window !== "undefined") {
            localStorage.setItem("secretaria_auth_user", JSON.stringify(u));
            localStorage.setItem("secretaria_user_id", String(u.id));
          }
        }}
        isWsConnected={isConnected}
        onOpenNewDoc={() => setIsNewDocOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("secretaria_auth_user");
            localStorage.removeItem("secretaria_user_id");
          }
        }}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onExportExcel={handleExportExcel}
        onOpenDashboard={() => setIsDashboardOpen(true)}
      />

      {/* Instant Filter Bar */}
      <FilterToolbar
        filters={filters}
        onFilterChange={setFilters}
        destinosDisponibles={destinosDisponibles}
        portadoresDisponibles={portadoresDisponibles}
        totalRegistros={documentos.length}
        focusSearchTrigger={focusSearchTrigger}
        currentUserName={currentUser?.nombre_completo}
        stats={stats}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Dense High-Speed Document Grid or Kanban Board */}
      <main className="flex flex-1 overflow-hidden">
        {isLoadingDocs && todosLosDocumentos.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
            Cargando trazabilidad documental del área...
          </div>
        ) : viewMode === "kanban" ? (
          <KanbanBoard
            documentos={documentos}
            selectedDocId={selectedDoc?.id || null}
            onSelectDoc={(doc) => {
              setSelectedDoc(doc);
            }}
            onOpenMovementDrawer={(doc) => {
              setSelectedDoc(doc);
              setIsDrawerOpen(true);
            }}
            onArchivarDoc={handleArchivarDoc}
          />
        ) : (
          <DenseDocumentTable
            data={documentos}
            selectedDocId={selectedDoc?.id || null}
            selectedIndex={selectedIndex}
            onSelectDoc={(doc) => {
              setSelectedDoc(doc);
              const idx = documentos.findIndex((d) => d.id === doc.id);
              if (idx !== -1) setSelectedIndex(idx);
            }}
            onOpenMovementDrawer={(doc) => {
              setSelectedDoc(doc);
              setIsDrawerOpen(true);
            }}
            onArchivarDoc={handleArchivarDoc}
            highlightedDocIds={highlightedDocIds}
            activeEditors={activeEditors}
          />
        )}
      </main>

      {/* Movement Drawer (Lateral Pase & Inmutable Audit Timeline) */}
      {isDrawerOpen && selectedDoc && (
        <MovementDrawer
          documento={selectedDoc}
          areaId={currentAreaId}
          currentUser={currentUser}
          catalogosDestinos={catalogosDestinos}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}

      {/* New Document Modal */}
      <NewDocumentModal
        isOpen={isNewDocOpen}
        onClose={() => setIsNewDocOpen(false)}
        areaId={currentAreaId}
        currentUser={currentUser}
        catalogosDestinos={catalogosDestinos}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsHelp
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Administration, Organization & Excel ETL Modal (Exclusivo Administrador) */}
      {isAdminOpen && currentUser?.rol === "ADMIN" && (
        <AdminModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          areas={areas}
          currentAreaId={currentAreaId}
          usuarios={usuarios}
          catalogosDestinos={catalogosDestinos}
          onRefetchData={() => {
            queryClient.invalidateQueries({ queryKey: ["areas"] });
            queryClient.invalidateQueries({ queryKey: ["usuarios", currentAreaId] });
            queryClient.invalidateQueries({ queryKey: ["catalogosDestinos", currentAreaId] });
            queryClient.invalidateQueries({ queryKey: ["documentos", currentAreaId] });
          }}
        />
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && currentUser && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Interactive Movements Dashboard */}
      {isDashboardOpen && (
        <MovementDashboardModal
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          documentos={todosLosDocumentos}
          onApplyFilter={(newFilters) => {
            setFilters((prev) => ({
              ...prev,
              ...newFilters,
            }));
          }}
          onOpenMovementDrawer={(doc) => {
            setSelectedDoc(doc);
            setIsDrawerOpen(true);
          }}
        />
      )}
    </div>
  );
}
