"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crearDocumento } from "@/lib/api";
import { CatalogoDestino, Usuario } from "@/types";
import { X, Plus, AlertCircle, FilePlus2, Sparkles, Building2, User, AlertTriangle } from "lucide-react";

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  areaId: number;
  currentUser: Usuario | null;
  catalogosDestinos: CatalogoDestino[];
}

const TIPOS_DOC = ["EXPEDIENTE", "NOTA", "RESOLUCION", "DECRETO", "CONVENIO", "DISPOSICION"];

export function NewDocumentModal({
  isOpen,
  onClose,
  areaId,
  currentUser,
  catalogosDestinos,
}: NewDocumentModalProps) {
  const queryClient = useQueryClient();

  const [numeroExpediente, setNumeroExpediente] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("EXPEDIENTE");
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [ambitoOrigen, setAmbitoOrigen] = useState("");
  const [caratula, setCaratula] = useState("");
  const [extracto, setExtracto] = useState("");
  const [destinoActual, setDestinoActual] = useState("Mesa de Entradas");
  const [portadorActual, setPortadorActual] = useState(currentUser?.nombre_completo || "Mesa de Entradas");
  const [fojaActual, setFojaActual] = useState(1);
  const [prioridad, setPrioridad] = useState("NORMAL");
  const [observacionInicial, setObservacionInicial] = useState("Ingreso inicial a la Secretaría Privada.");
  const [errorMsg, setErrorMsg] = useState("");

  const mutation = useMutation({
    mutationFn: crearDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos", areaId] });
      handleClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Error al registrar el expediente");
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setNumeroExpediente("");
    setAmbitoOrigen("");
    setCaratula("");
    setExtracto("");
    setFojaActual(1);
    setPrioridad("NORMAL");
    setErrorMsg("");
    onClose();
  };

  const handleGenerateTemplateExp = () => {
    const curYear = new Date().getFullYear();
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    setNumeroExpediente(`EX-${curYear}-${randomSeq}- -GDEMZA-SPMG#MHYF`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroExpediente.trim()) {
      setErrorMsg("El número de expediente o identificador es obligatorio");
      return;
    }
    if (!caratula.trim()) {
      setErrorMsg("La carátula o resumen es obligatoria");
      return;
    }

    // Standardize carátula format: [ÁMBITO] Carátula
    let fullCaratula = caratula.trim();
    if (ambitoOrigen.trim()) {
      const cleanAmbito = ambitoOrigen.trim().replace(/[\[\]]/g, "").toUpperCase();
      fullCaratula = `[${cleanAmbito}] ${fullCaratula}`;
    }

    mutation.mutate({
      area_id: areaId,
      numero_expediente: numeroExpediente.trim().toUpperCase(),
      tipo_documento: tipoDocumento,
      anio: Number(anio) || new Date().getFullYear(),
      iniciador_caratula: fullCaratula,
      extracto: extracto.trim() || undefined,
      estado_actual: "INICIADO",
      destino_actual: destinoActual.trim() || "Mesa de Entradas",
      portador_actual: portadorActual.trim() || (currentUser?.nombre_completo || "Mesa de Entradas"),
      foja_actual: Number(fojaActual) || 1,
      prioridad,
      creado_por_id: currentUser?.id,
      creado_por_nombre: currentUser?.nombre_completo || "Operador",
      observacion_inicial: observacionInicial.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <FilePlus2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Nuevo Trámite / Caratulación
              </h2>
              <p className="text-xs text-slate-500">
                Se registrará con trazabilidad completa y primer pase inmutable
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 flex items-center space-x-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:border-rose-900/60 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Quick Document Type Chips */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Documento
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TIPOS_DOC.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoDocumento(tipo)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    tipoDocumento === tipo
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* Expediente & Year */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  N° de Expediente / Trámite *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateTemplateExp}
                  className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  title="Insertar formato estándar GDEMZA"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Formato GDEMZA</span>
                </button>
              </div>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ej. EX-2026-0012345- -GDEMZA-SPMG#MHYF"
                value={numeroExpediente}
                onChange={(e) => setNumeroExpediente(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white uppercase font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Año
              </label>
              <input
                type="number"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Ámbito de Origen & Carátula */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ámbito de Origen
              </label>
              <input
                type="text"
                placeholder="Ej. HACIENDA"
                value={ambitoOrigen}
                onChange={(e) => setAmbitoOrigen(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white uppercase"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Carátula / Resumen Principal *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. S/ Adquisición de equipamiento informático..."
                value={caratula}
                onChange={(e) => setCaratula(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Fojas & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fojas Iniciales
              </label>
              <input
                type="number"
                min="1"
                value={fojaActual}
                onChange={(e) => setFojaActual(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Prioridad
              </label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="URGENTE">⚡ URGENTE</option>
                <option value="PRONTO DESPACHO">PRONTO DESPACHO</option>
              </select>
            </div>
          </div>

          {/* Destino & Portador Inicial */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destino Inicial
              </label>
              <input
                type="text"
                list="modal-destinos"
                value={destinoActual}
                onChange={(e) => setDestinoActual(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
              />
              <datalist id="modal-destinos">
                {catalogosDestinos.map((c) => (
                  <option key={c.id} value={c.nombre} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Portador / Responsable
              </label>
              <input
                type="text"
                value={portadorActual}
                onChange={(e) => setPortadorActual(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Observación Inicial */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nota / Observación Inicial
            </label>
            <input
              type="text"
              value={observacionInicial}
              onChange={(e) => setObservacionInicial(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-end space-x-2.5 border-t border-slate-200 pt-3.5 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              Cancelar (Esc)
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>{mutation.isPending ? "Caratulando..." : "Crear Trámite"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
