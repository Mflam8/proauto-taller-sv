import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";

export default function ReporteExport({ facturas, pagos, clientes, vehiculos, periodoLabel }) {
  const handleDownload = () => {
    const clienteMap = Object.fromEntries((clientes || []).map(c => [c.id, c]));
    const vehMap = Object.fromEntries((vehiculos || []).map(v => [v.id, v]));

    const totalFacturado = facturas.reduce((s, f) => s + (f.total || 0), 0);
    const totalCobrado = (pagos || []).reduce((s, p) => s + (p.monto || 0), 0);
    const pendiente = facturas
      .filter(f => (f.saldo_pendiente || 0) > 0 && f.estado_pago !== "Pagada")
      .reduce((s, f) => s + (f.saldo_pendiente || 0), 0);

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;

    // === HEADER ===
    doc.setFillColor(227, 14, 29);
    doc.rect(0, 0, pageW, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("PROAUTO Taller SV", margin, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Reporte de Ventas", margin, 20);
    doc.text(`Periodo: ${periodoLabel}`, margin, 25);

    doc.setFontSize(9);
    const fechaGen = new Date().toLocaleString("es-SV");
    doc.text(`Generado: ${fechaGen}`, pageW - margin, 13, { align: "right" });
    doc.text("Documento Confidencial", pageW - margin, 20, { align: "right" });

    // === RESUMEN ===
    let y = 38;
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Resumen Financiero", margin, y);

    y += 4;
    doc.setDrawColor(227, 14, 29);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageW - margin, y);

    y += 6;
    const colW = (pageW - margin * 2) / 4;
    const cards = [
      { label: "Facturacion Total", value: totalFacturado, color: [16, 185, 129] },
      { label: "Total Cobrado", value: totalCobrado, color: [59, 130, 246] },
      { label: "Pendiente de Cobro", value: pendiente, color: [239, 68, 68] },
      { label: "Cantidad de Facturas", value: facturas.length, color: [147, 51, 234], isCount: true },
    ];

    cards.forEach((card, i) => {
      const x = margin + i * colW;
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(x + 2, y, colW - 4, 18, 2, 2, "F");

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(card.label.toUpperCase(), x + 4, y + 5);

      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...card.color);
      doc.text(card.isCount ? String(card.value) : `$${card.value.toFixed(2)}`, x + 4, y + 13);
    });

    // === TABLA DE FACTURAS ===
    y += 26;
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Detalle de Facturas", margin, y);

    y += 4;
    doc.line(margin, y, pageW - margin, y);

    y += 5;
    const headers = ["No. Factura", "Fecha", "Cliente", "Vehiculo", "Forma Pago", "Subtotal", "IVA", "Total", "Pagado", "Saldo", "Estado"];
    const colWidths = [28, 22, 45, 42, 22, 22, 18, 22, 22, 22, 24];
    const tableW = colWidths.reduce((a, b) => a + b, 0);
    let x = margin;

    // Header row
    doc.setFillColor(227, 14, 29);
    doc.rect(x, y - 4, tableW, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    headers.forEach((h, i) => {
      doc.text(h, x + 1, y, { align: i >= 5 ? "right" : "left" });
      x += colWidths[i];
    });

    y += 4;

    // Data rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const rowH = 5;
    let alt = false;

    facturas.forEach((f) => {
      if (y > doc.internal.pageSize.getHeight() - 15) {
        doc.addPage();
        y = 20;
        // Repeat header
        let hx = margin;
        doc.setFillColor(227, 14, 29);
        doc.rect(hx, y - 4, tableW, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        headers.forEach((h, i) => {
          doc.text(h, hx + 1, y, { align: i >= 5 ? "right" : "left" });
          hx += colWidths[i];
        });
        y += 4;
        doc.setFont("helvetica", "normal");
        alt = false;
      }

      const cli = clienteMap[f.cliente_id];
      const veh = vehMap[f.vehiculo_id];
      const vals = [
        f.numero_factura || "-",
        fmtFecha(f.fecha_emision),
        cli ? trunc(cli.nombre_completo, 26) : "-",
        veh ? trunc(`${veh.placa} ${veh.marca} ${veh.modelo}`, 24) : "-",
        f.forma_pago || "-",
        (f.subtotal || 0).toFixed(2),
        (f.iva || 0).toFixed(2),
        (f.total || 0).toFixed(2),
        (f.monto_pagado || 0).toFixed(2),
        (f.saldo_pendiente || 0).toFixed(2),
        f.estado_pago || "-",
      ];

      if (alt) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y - 3, tableW, rowH, "F");
      }
      alt = !alt;

      doc.setTextColor(40, 40, 40);
      x = margin;
      vals.forEach((v, i) => {
        if (i >= 5 && i <= 9) {
          doc.text(`$${v}`, x + colWidths[i] - 1, y, { align: "right" });
        } else {
          doc.text(String(v), x + 1, y);
        }
        x += colWidths[i];
      });
      y += rowH;
    });

    // === TOTALES ===
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + tableW, y);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(227, 14, 29);
    const totalX = margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4];
    doc.text("TOTALES:", totalX + 1, y, { align: "right" });
    doc.text(`$${facturas.reduce((s, f) => s + (f.subtotal || 0), 0).toFixed(2)}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] - 1, y, { align: "right" });
    doc.text(`$${facturas.reduce((s, f) => s + (f.iva || 0), 0).toFixed(2)}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] - 1, y, { align: "right" });
    doc.text(`$${totalFacturado.toFixed(2)}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7] - 1, y, { align: "right" });
    doc.text(`$${facturas.reduce((s, f) => s + (f.monto_pagado || 0), 0).toFixed(2)}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7] + colWidths[8] - 1, y, { align: "right" });
    doc.text(`$${facturas.reduce((s, f) => s + (f.saldo_pendiente || 0), 0).toFixed(2)}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7] + colWidths[8] + colWidths[9] - 1, y, { align: "right" });

    // === FOOTER ===
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(227, 14, 29);
    doc.setLineWidth(0.5);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("PROAUTO Taller SV - Reporte Confidencial", margin, pageH - 7);
    doc.text(`Generado el ${fechaGen}`, pageW - margin, pageH - 7, { align: "right" });

    const fechaArchivo = new Date().toISOString().split("T")[0];
    doc.save(`reporte_ventas_${fechaArchivo}.pdf`);
  };

  return (
    <Button onClick={handleDownload} className="bg-[#E31E24] hover:bg-[#B71C1C]">
      <Download className="w-4 h-4" />
      Descargar PDF
    </Button>
  );
}

function fmtFecha(d) {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date)) return String(d);
  return date.toLocaleDateString("es-SV");
}

function trunc(s, max) {
  s = String(s || "");
  return s.length > max ? s.substring(0, max - 1) + "…" : s;
}