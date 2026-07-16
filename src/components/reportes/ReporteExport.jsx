import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";

export default function ReporteExport({
  facturas, pagos, clientes, vehiculos,
  chartFacturacion, topClientes, topTrabajos, ventasPorTipo,
  totalFacturado, totalCobrado, pendienteCobro,
  clientesNuevosCount, clientesRepetidosCount, pctNuevos, pctRepetidos,
  periodoLabel,
}) {
  const handleDownload = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const M = 14;
    const fechaGen = new Date().toLocaleString("es-SV");

    // === HEADER (todas las páginas via addHeader) ===
    const addHeader = () => {
      doc.setFillColor(227, 14, 29);
      doc.rect(0, 0, pageW, 26, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("PROAUTO Taller SV", M, 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Reporte de Ventas", M, 19);
      doc.text(`Periodo: ${periodoLabel}`, M, 24);
      doc.setFontSize(8);
      doc.text(`Generado: ${fechaGen}`, pageW - M, 12, { align: "right" });
      doc.text("Documento Confidencial", pageW - M, 19, { align: "right" });
    };

    // === FOOTER ===
    const addFooter = () => {
      doc.setDrawColor(227, 14, 29);
      doc.setLineWidth(0.5);
      doc.line(M, pageH - 12, pageW - M, pageH - 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text("PROAUTO Taller SV - Reporte Confidencial", M, pageH - 7);
      doc.text(`Generado el ${fechaGen}`, pageW - M, pageH - 7, { align: "right" });
    };

    const checkPage = (y, needed = 20) => {
      if (y + needed > pageH - 16) {
        addFooter();
        doc.addPage();
        addHeader();
        return 34;
      }
      return y;
    };

    addHeader();
    let y = 34;

    // === SECCIÓN 1: RESUMEN FINANCIERO ===
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Resumen Financiero", M, y);
    y += 3;
    doc.setDrawColor(227, 14, 29);
    doc.setLineWidth(0.8);
    doc.line(M, y, pageW - M, y);
    y += 6;

    const ivaTotal = facturas.reduce((s, f) => s + (f.iva || 0), 0);
    const cards = [
      { label: "Facturacion Total", value: `$${(totalFacturado || 0).toFixed(2)}`, color: [16, 185, 129] },
      { label: "Total Cobrado", value: `$${(totalCobrado || 0).toFixed(2)}`, color: [59, 130, 246] },
      { label: "Pendiente de Cobro", value: `$${(pendienteCobro || 0).toFixed(2)}`, color: [239, 68, 68] },
      { label: "IVA Recaudado", value: `$${ivaTotal.toFixed(2)}`, color: [245, 158, 11] },
      { label: "Cantidad de Facturas", value: String(facturas.length), color: [147, 51, 234] },
    ];
    const cardW = (pageW - M * 2 - 16) / 5;
    cards.forEach((card, i) => {
      const x = M + i * (cardW + 4);
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(x, y, cardW, 20, 2, 2, "F");
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(card.label.toUpperCase(), x + 2, y + 5);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...card.color);
      doc.text(card.value, x + 2, y + 13);
    });
    y += 28;

    // === SECCIÓN 2: VENTAS POR MES ===
    y = checkPage(y, 40);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Ventas por Mes", M, y);
    y += 3;
    doc.setDrawColor(227, 14, 29);
    doc.line(M, y, pageW - M, y);
    y += 5;

    const colW2 = (pageW - M * 2) / Math.max(chartFacturacion.length, 1);
    const barMaxH = 30;
    const maxVal = Math.max(...chartFacturacion.map(c => c.monto || 0), 1);

    chartFacturacion.forEach((c) => {
      const barH = ((c.monto || 0) / maxVal) * barMaxH;
      const x = M + chartFacturacion.indexOf(c) * colW2;
      doc.setFillColor(227, 14, 29);
      doc.rect(x + 1, y + barMaxH - barH, colW2 - 2, barH, "F");
      doc.setFontSize(6);
      doc.setTextColor(80, 80, 80);
      doc.text(c.label, x + colW2 / 2, y + barMaxH + 3, { align: "center" });
      if (c.monto > 0) {
        doc.setTextColor(50, 50, 50);
        doc.text(`$${(c.monto / 1000).toFixed(0)}k`, x + colW2 / 2, y + barMaxH - barH - 1, { align: "center" });
      }
    });
    y += barMaxH + 8;

    // === SECCIÓN 3: CLIENTES NUEVOS VS REPETIDOS ===
    y = checkPage(y, 30);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Clientes Nuevos vs Repetidos", M, y);
    y += 3;
    doc.setDrawColor(227, 14, 29);
    doc.line(M, y, pageW - M, y);
    y += 6;

    const totalClientes = clientesNuevosCount + clientesRepetidosCount;
    const halfW = (pageW - M * 2 - 6) / 2;

    // Nuevos
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(M, y, halfW, 24, 2, 2, "F");
    doc.setFillColor(59, 130, 246);
    doc.circle(M + 8, y + 8, 3, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("CLIENTES NUEVOS", M + 14, y + 8);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text(String(clientesNuevosCount), M + 4, y + 19);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`${pctNuevos.toFixed(1)}% del total`, M + 14, y + 19);

    // Repetidos
    const x2 = M + halfW + 6;
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(x2, y, halfW, 24, 2, 2, "F");
    doc.setFillColor(239, 68, 68);
    doc.circle(x2 + 8, y + 8, 3, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("CLIENTES REPETIDOS", x2 + 14, y + 8);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text(String(clientesRepetidosCount), x2 + 4, y + 19);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`${pctRepetidos.toFixed(1)}% del total`, x2 + 14, y + 19);
    y += 30;

    // === SECCIÓN 4: VENTAS POR TIPO ===
    y = checkPage(y, 25);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Ventas por Tipo", M, y);
    y += 3;
    doc.setDrawColor(227, 14, 29);
    doc.line(M, y, pageW - M, y);
    y += 5;

    const tipos = Object.entries(ventasPorTipo || {});
    const tipoColors = { "Mano de Obra": [59, 130, 246], "Repuesto": [227, 14, 29], "Insumo": [245, 158, 11], "Diagnóstico": [139, 92, 246], "Otro": [107, 114, 128] };
    const totalTipos = tipos.reduce((s, [, v]) => s + v, 0) || 1;
    const tipoW = (pageW - M * 2) / Math.max(tipos.length, 1);
    tipos.forEach(([tipo, monto], i) => {
      const x = M + i * tipoW;
      const pct = (monto / totalTipos * 100);
      doc.setFillColor(...(tipoColors[tipo] || [107, 114, 128]));
      doc.roundedRect(x + 2, y, tipoW - 4, 16, 2, 2, "F");
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(tipo.toUpperCase(), x + tipoW / 2, y + 5, { align: "center" });
      doc.setFontSize(8);
      doc.text(`$${monto.toFixed(0)}`, x + tipoW / 2, y + 10, { align: "center" });
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text(`${pct.toFixed(1)}%`, x + tipoW / 2, y + 14, { align: "center" });
    });
    y += 22;

    // === SECCIÓN 5: TOP 10 CLIENTES CON MAYOR CONSUMO ===
    y = checkPage(y, 40);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Top 10 Clientes con Mayor Consumo", M, y);
    y += 3;
    doc.setDrawColor(227, 14, 29);
    doc.line(M, y, pageW - M, y);
    y += 5;

    const tHeaders = ["#", "Cliente", "Facturas", "Total Consumo"];
    const tWidths = [12, 90, 30, 40];
    const tW = tWidths.reduce((a, b) => a + b, 0);
    let x = M;
    doc.setFillColor(227, 14, 29);
    doc.rect(x, y - 4, tW, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    tHeaders.forEach((h, i) => {
      doc.text(h, x + (i >= 2 ? tWidths[i] - 1 : 1), y, { align: i >= 2 ? "right" : "left" });
      x += tWidths[i];
    });
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    let alt = false;
    (topClientes || []).slice(0, 10).forEach((c, i) => {
      y = checkPage(y, 6);
      if (alt) {
        doc.setFillColor(245, 245, 245);
        doc.rect(M, y - 3, tW, 5.5, "F");
      }
      alt = !alt;
      doc.setTextColor(40, 40, 40);
      x = M;
      doc.text(String(i + 1), x + 1, y);
      x += tWidths[0];
      doc.text(trunc(c.nombre, 48), x + 1, y);
      x += tWidths[1];
      doc.text(String(c.facturas), x + tWidths[2] - 1, y, { align: "right" });
      x += tWidths[2];
      doc.setFont("helvetica", "bold");
      doc.text(`$${(c.total || 0).toFixed(2)}`, x + tWidths[3] - 1, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += 5.5;
    });
    y += 4;

    // === SECCIÓN 6: LO QUE MÁS SE VENDE ===
    y = checkPage(y, 40);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Lo Que Más Se Vende (Top 10)", M, y);
    y += 3;
    doc.setDrawColor(227, 14, 29);
    doc.line(M, y, pageW - M, y);
    y += 5;

    const vHeaders = ["#", "Descripción", "Veces", "Monto Total"];
    const vWidths = [12, 100, 25, 35];
    const vW = vWidths.reduce((a, b) => a + b, 0);
    x = M;
    doc.setFillColor(227, 14, 29);
    doc.rect(x, y - 4, vW, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    vHeaders.forEach((h, i) => {
      doc.text(h, x + (i >= 2 ? vWidths[i] - 1 : 1), y, { align: i >= 2 ? "right" : "left" });
      x += vWidths[i];
    });
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    alt = false;
    (topTrabajos || []).slice(0, 10).forEach((t, i) => {
      y = checkPage(y, 6);
      if (alt) {
        doc.setFillColor(245, 245, 245);
        doc.rect(M, y - 3, vW, 5.5, "F");
      }
      alt = !alt;
      doc.setTextColor(40, 40, 40);
      x = M;
      doc.text(String(i + 1), x + 1, y);
      x += vWidths[0];
      doc.text(trunc(t.descripcion, 55), x + 1, y);
      x += vWidths[1];
      doc.text(String(t.count), x + vWidths[2] - 1, y, { align: "right" });
      x += vWidths[2];
      doc.setFont("helvetica", "bold");
      doc.text(`$${(t.monto || 0).toFixed(2)}`, x + vWidths[3] - 1, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += 5.5;
    });

    addFooter();

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

function trunc(s, max) {
  s = String(s || "");
  return s.length > max ? s.substring(0, max - 1) + "…" : s;
}