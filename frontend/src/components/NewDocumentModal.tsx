"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crearDocumento } from "@/lib/api";
import { CatalogoDestino, Usuario } from "@/types";
import { X, Plus, AlertCircle, FilePlus2 } from "lucide-react";

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  areaId: number;
  currentUser: Usuario | null;
  catalogosDestinos: CatalogoDestino[];
}

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
  const [iniciadorCaratula, setIniciadorCaratula] = useState("");
  const [extracto, setExtracto] = useState("");
  const [destinoActual, setDestinoActual] = useState("Mesa de Entradas");
  const [portadorActual, setPortadorActual] = useState("Mesa de Entradas");
  const [fojaActual, setFojaActual] = useState(1);
  const [prioridad, setPrioridad] = useState("NORMAL");
  const [observacionInicial, setObservacionInicial] = useState("Ingreso por mesa de entradas y foliatura inicial.");
  const [errorMsg, setErrorMsg] = useState("");

  const mutation = useMutation({
    mutationFn: crearDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos", areaId] });
      handleClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Error al crear el documento");
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setNumeroExpediente("");
    setIniciadorCaratula("");
    setExtracto("");
    setFojaActual(1);
    setPrioridad("NORMAL");
    setErrorMsg("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroExpediente.trim()) {
      setErrorMsg("El número de trámite o expediente es obligatorio");
      return;
    }
    if (!iniciadorCaratula.trim()) {
      setErrorMsg("La carátula o iniciador es obligatoria");
      return;
    }

    mutation.mutate({
      area_id: areaId,
      numero_expediente: numeroExpediente.trim(),
      tipo_documento: tipoDocumento,
      anio: Number(anio),
      iniciador_caratula: iniciadorCaratula.trim(),
      extracto: extracto.trim() || undefined,
      estado_actual: "INICIADO",
      destino_actual: destinoActual.trim() || "Mesa de Entradas",
      portador_actual: portadorActual.trim() || (currentUser?.nombre_completo || "Mesa de Entradas"),
      foja_actual: Number(fojaActual) || 1,
      prioridad,
      creado_por_id: currentUser?.id,
      creado_por_nombre: currentUser?.nombre_completo || "Mesa de Entradas",
      observacion_inicial: observacionInicial.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
              <FilePlus2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Nuevo Trámite / Caratulación
              </h2>
              <p className="text-[11px] text-slate-500">
                Se registrará con el primer pase inmutable para auditoría
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 flex items-center space-x-2 rounded-md bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                N° de Expediente / Código *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ej. EXP-2026-00512-MEG"
                value={numeroExpediente}
                onChange={(e) => setNumeroExpediente(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo
              </label>
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="EXPEDIENTE">EXPEDIENTE</option>
                <option value="NOTA">NOTA</option>
                <option value="RESOLUCION">RESOLUCION</option>
                <option value="DISPOSICION">DISPOSICION</option>
                <option value="MEMORANDUM">MEMORANDUM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Iniciador / Carátula *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Secretaría de Modernización - S/ Renovación de Servidores"
              value={iniciadorCaratula}
              onChange={(e) => setIniciadorCaratula(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Extracto / Síntesis (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Breve resumen del objeto del trámite..."
              value={extracto}
              onChange={(e) => setExtracto(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fojas Iniciales
              </label>
              <input
                type="number"
                min="1"
                value={fojaActual}
                onChange={(e) => setFojaActual(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Año
              </label>
              <input
                type="number"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prioridad
              </label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="URGENTE">URGENTE</option>
                <option value="PRONTO DESPACHO">PRONTO DESPACHO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destino Inicial
              </label>
              <input
                type="text"
                list="modal-destinos"
                value={destinoActual}
                onChange={(e) => setDestinoActual(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <datalist id="modal-destinos">
                {catalogosDestinos.map((c) => (
                  <option key={c.id} value={c.nombre} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Portador Inicial
              </label>
              <input
                type="text"
                value={portadorActual}
                onChange={(e) => setPortadorActual(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nota / Observación inicial
            </label>
            <input
              type="text"
              value={observacionInicial}
              onChange={(e) => setObservacionInicial(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="mt-5 flex items-center justify-end space-x-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar (Esc)
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center space-x-1.5 rounded-md bg-blue-600 px-4 py-1.5 font-bold text-white shadow hover:bg-blue-500 disabled:opacity-50"
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
