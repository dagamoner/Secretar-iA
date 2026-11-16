"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAreas,
  fetchCatalogosDestinos,
  fetchUsuarios,
  fetchDocumentos,
} from "@/lib/api";
import { Area, Usuario, Documento, FilterState } from "@/types";
import { useRealtimeArea } from "@/hooks/useRealtimeArea";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

import { Header } from "@/components/Header";
import { FilterToolbar } from "@/components/FilterToolbar";
import { DenseDocumentTable } from "@/components/DenseDocumentTable";
import { MovementDrawer } from "@/components/MovementDrawer";
import { NewDocumentModal } from "@/components/NewDocumentModal";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";

export default function HomePage() {
  // Area Multi-Tenant State
  const [currentAreaId, setCurrentAreaId] = useState<number>(1);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  // Modals & Drawer State
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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

  // Select default user once loaded
  React.useEffect(() => {
    if (usuarios.length > 0 && (!currentUser || currentUser.area_id !== currentAreaId)) {
      setCurrentUser(usuarios[0]);
    }
  }, [usuarios, currentAreaId, currentUser]);

  const { data: documentos = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ["documentos", currentAreaId, filters],
    queryFn: () => fetchDocumentos(currentAreaId, filters),
    enabled: !!currentAreaId,
  });

  // Real-Time WebSocket Hook (Emits events, invalidates TanStack cache, highlights rows for 3 seconds)
  const { isConnected, highlightedDocIds, activeEditors } = useRealtimeArea(currentAreaId);

  // Distinct options for dropdown filters
  const destinosDisponibles = useMemo(() => {
    const set = new Set<string>();
    documentos.forEach((d) => {
      if (d.destino_actual) set.add(d.destino_actual);
    });
    return Array.from(set).sort();
  }, [documentos]);

  const portadoresDisponibles = useMemo(() => {
    const set = new Set<string>();
    documentos.forEach((d) => {
      if (d.portador_actual) set.add(d.portador_actual);
    });
    return Array.from(set).sort();
  }, [documentos]);

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
    },
    onToggleHelp: () => setIsHelpOpen((prev) => !prev),
  });

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
        onUserChange={setCurrentUser}
        isWsConnected={isConnected}
        onOpenNewDoc={() => setIsNewDocOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Instant Filter Bar */}
      <FilterToolbar
        filters={filters}
        onFilterChange={setFilters}
        destinosDisponibles={destinosDisponibles}
        portadoresDisponibles={portadoresDisponibles}
        totalRegistros={documentos.length}
        focusSearchTrigger={focusSearchTrigger}
      />

      {/* Dense High-Speed Document Grid */}
      <main className="flex flex-1 overflow-hidden">
        {isLoadingDocs ? (
          <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
            Cargando trazabilidad documental del área...
          </div>
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
    </div>
  );
}
