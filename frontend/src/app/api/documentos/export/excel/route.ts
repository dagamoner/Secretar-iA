import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { dbGetDocumentos } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaId = Number(searchParams.get("area_id")) || 1;
    const search = searchParams.get("search") || undefined;
    const estado = searchParams.get("estado") || undefined;
    const portador = searchParams.get("portador") || undefined;
    const destino = searchParams.get("destino") || undefined;
    const prioridad = searchParams.get("prioridad") || undefined;

    const docs = await dbGetDocumentos(areaId, {
      search,
      estado,
      portador,
      destino,
      prioridad,
    });

    const exportRows = docs.map((d) => {
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

      // Ambito origen
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

    // Auto-fit column widths
    const colWidths = [
      { wch: 6 },  // DIA
      { wch: 6 },  // MES
      { wch: 6 },  // AÑO
      { wch: 12 }, // F. ENTRADA
      { wch: 25 }, // N° EXPEDIENTE
      { wch: 14 }, // TIPO
      { wch: 22 }, // AMBITO ORIGEN
      { wch: 60 }, // CARATULADO / RESUMEN
      { wch: 14 }, // ESTADO
      { wch: 12 }, // F. SALIDA
      { wch: 30 }, // AMBITO DESTINO
      { wch: 25 }, // PORTADOR / RETIRO
      { wch: 8 },  // FOJAS
      { wch: 12 }, // PRIORIDAD
    ];
    worksheet["!cols"] = colWidths;

    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const todayStr = new Date().toISOString().split("T")[0];
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Secretaria_Privada_Expedientes_${todayStr}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
