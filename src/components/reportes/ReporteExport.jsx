import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function esc(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function fmtFecha(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date)) return String(d);
  return date.toLocaleDateString("es-SV");
}

export default function ReporteExport({ facturas, pagos, clientes, periodoLabel, vehiculos }) {
  const handleDownload = () => {
    const clienteMap = Object.fromEntries((clientes || []).map(c => [c.id, c]));
    const vehMap = Object.fromEntries((vehiculos || []).map(v => [v.id, v]));

    const totalFacturado = facturas.reduce((s, f) => s + (f.total || 0), 0);
    const totalCobrado = (pagos || []).reduce((s, p) => s + (p.monto || 0), 0);
    const pendiente = facturas
      .filter(f => (f.saldo_pendiente || 0) > 0 && f.estado_pago !== "Pagada")
      .reduce((s, f) => s + (f.saldo_pendiente || 0), 0);

    const rows = [];

    rows.push(`REPORTE DE VENTAS - PROAUTO Taller SV`);
    rows.push(`Periodo: ${periodoLabel}`);
    rows.push(`Generado: ${new Date().toLocaleString("es-SV")}`);
    rows.push(`Total Facturado: $${totalFacturado.toFixed(2)}`);
    rows.push(`Total Cobrado: $${totalCobrado.toFixed(2)}`);
    rows.push(`Pendiente de Cobro: $${pendiente.toFixed(2)}`);
    rows.push(`Cantidad de Facturas: ${facturas.length}`);
    rows.push("");
    rows.push("");

    rows.push([
      "No. Factura",
      "Fecha Emision",
      "Cliente",
      "Vehiculo",
      "Forma Pago",
      "Subtotal",
      "IVA",
      "Total",
      "Monto Pagado",
      "Saldo Pendiente",
      "Estado Pago",
    ].map(esc).join(","));

    facturas.forEach(f => {
      const cli = clienteMap[f.cliente_id];
      const veh = vehMap[f.vehiculo_id];
      rows.push([
        f.numero_factura || "",
        fmtFecha(f.fecha_emision),
        cli ? cli.nombre_completo : "",
        veh ? `${veh.placa} ${veh.marca} ${veh.modelo}` : "",
        f.forma_pago || "",
        (f.subtotal || 0).toFixed(2),
        (f.iva || 0).toFixed(2),
        (f.total || 0).toFixed(2),
        (f.monto_pagado || 0).toFixed(2),
        (f.saldo_pendiente || 0).toFixed(2),
        f.estado_pago || "",
      ].map(esc).join(","));
    });

    const csv = "\uFEFF" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fechaArchivo = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `reporte_ventas_${periodoArchivo(periodoLabel)}_${fechaArchivo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleDownload} variant="default" className="bg-[#E31E24] hover:bg-[#B71C1C]">
      <Download className="w-4 h-4" />
      Descargar CSV
    </Button>
  );
}

function periodoArchivo(label) {
  const map = {
    "Última Semana": "semana",
    "Último Mes": "mes",
    "Último Trimestre": "trimestre",
    "Último Año": "anio",
  };
  return map[label] || "reporte";
}