"use client";

import React, { useEffect, useState } from "react";
import { Documento } from "@/types";
import { Printer, X, Shield, QrCode, FileText, Calendar, Building, User, Clock } from "lucide-react";
import QRCode from "qrcode";

interface PassReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  documento: Documento | null;
  areaNombre?: string;
  usuarioEmisor?: string;
}

export function PassReceiptModal({
  isOpen,
  onClose,
  documento,
  areaNombre = "Secretaría Privada (SPMG)",
  usuarioEmisor = "Operador de Mesa",
}: PassReceiptModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (documento && isOpen) {
      const qrPayload = JSON.stringify({
        sistema: "Secretar-iA SPMG",
        exp: documento.numero_expediente,
        tipo: documento.tipo_documento,
        fojas: documento.foja_actual,
        destino: documento.destino_actual,
        fecha: new Date().toISOString(),
      });

      QRCode.toDataURL(qrPayload, {
        width: 130,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(""));
    }
  }, [documento, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !documento) return null;

  const now = new Date();
  const fechaEmision = now.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const horaEmision = now.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm print:p-0 print:bg-white">
      {/* Container Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 print:shadow-none print:border-none print:max-w-none print:w-full">
        {/* Screen Header (Hidden on print) */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800 print:hidden">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Volante Oficial de Remito y Pase
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Vista previa con membrete ministerial y código QR para despacho físico
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir Remito</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 text-slate-900 print:p-6 print:text-black">
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="font-serif font-black tracking-widest text-xs uppercase text-slate-900">
                    GOBIERNO DE MENDOZA
                  </span>
                  <span className="text-[10px] text-slate-400">|</span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">
                    MGIyDT
                  </span>
                </div>
                <h1 className="text-base font-black tracking-tight text-slate-900 leading-tight">
                  SECRETARÍA PRIVADA
                </h1>
                <p className="text-[11px] font-semibold text-slate-600">
                  Ministerio de Gobierno, Infraestructura y Desarrollo Territorial
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block rounded border border-slate-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  REMITO DE TRASLADO
                </span>
                <p className="text-[11px] font-mono text-slate-600 mt-1">
                  Fecha: <strong className="text-slate-900">{fechaEmision}</strong> - {horaEmision} hs
                </p>
              </div>
            </div>
          </div>

          {/* Expediente Hero Banner */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 mb-4 print:bg-white print:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                N° de Identificación Documental (GDE / Oficial):
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 uppercase print:border print:border-slate-400">
                {documento.tipo_documento}
              </span>
            </div>
            <div className="font-mono text-lg font-black tracking-tight text-slate-950">
              {documento.numero_expediente}
            </div>
          </div>

          {/* Details Grid & QR Code */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Left 2 Cols: Metadata */}
            <div className="col-span-2 space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                  Caratulado / Resumen:
                </span>
                <p className="font-medium text-slate-800 leading-snug border-l-2 border-blue-600 pl-2 text-xs italic">
                  {documento.iniciador_caratula || "Sin carátula especificada"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Área Emisora:
                  </span>
                  <span className="font-bold text-slate-900">{areaNombre}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Fojas Declaradas:
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {documento.foja_actual} fojas
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Destino del Pase:
                  </span>
                  <span className="font-black text-blue-900 text-xs">
                    {documento.destino_actual || "Despacho Ministerial"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Portador / Retiró:
                  </span>
                  <span className="font-bold text-slate-900">
                    {documento.portador_actual || "En mano"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Col: QR Code & Priority */}
            <div className="flex flex-col items-center justify-center border-l border-slate-200 pl-4 text-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Verificación Expediente"
                  className="w-28 h-28 border border-slate-200 rounded-lg p-1 bg-white mb-1.5 shadow-2xs"
                />
              ) : (
                <div className="w-28 h-28 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 mb-1.5">
                  <QrCode className="h-10 w-10" />
                </div>
              )}
              <span className="text-[9px] font-mono text-slate-500 font-bold">
                VALIDACIÓN DIGITAL
              </span>
              <span className="text-[9px] font-bold uppercase text-slate-700 mt-1">
                Prioridad: {documento.prioridad}
              </span>
            </div>
          </div>

          {/* Signature Boxes at the bottom */}
          <div className="mt-8 pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border border-dashed border-slate-400 rounded-xl p-3 bg-slate-50/50 print:bg-white">
              <div className="h-14"></div>
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-900">ENTREGADO POR</p>
                <p className="text-[10px] text-slate-600">{usuarioEmisor}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Firma, Aclaración y DNI</p>
              </div>
            </div>

            <div className="border border-dashed border-slate-400 rounded-xl p-3 bg-slate-50/50 print:bg-white">
              <div className="h-14"></div>
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-900">RECIBIDO POR</p>
                <p className="text-[10px] text-slate-600">{documento.portador_actual || "Mesa Receptora"}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Firma, Sello de Recepción y Hora</p>
              </div>
            </div>
          </div>

          {/* Institutional Footer */}
          <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400 flex items-center justify-between">
            <span>Sistema Secretar·iA SPMG - Trazabilidad Documental</span>
            <span>Casa de Gobierno de Mendoza - Cuerpo Central</span>
          </div>
        </div>
      </div>
    </div>
  );
}
