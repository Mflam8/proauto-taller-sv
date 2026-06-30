import React from "react";

/**
 * ReciboPrint — genera un recibo optimizado para impresora térmica 80mm (3NSTAR).
 * Abre una ventana nueva con el HTML del recibo y dispara window.print().
 * Así no interfiere con el layout de la página principal.
 */
export default function ReciboPrint({ factura, cliente, vehiculo }) {
  const handlePrint = () => {
    const fecha = factura.fecha_emision
      ? new Date(factura.fecha_emision).toLocaleString("es-SV")
      : new Date().toLocaleString("es-SV");

    const itemsHtml = (factura.items || [])
      .map(
        (item) => `
        <tr>
          <td colspan="2" class="item-desc">${escapeHtml(item.descripcion || "")}</td>
        </tr>
        <tr>
          <td class="item-qty">${item.cantidad} × $${(item.precio_unitario || 0).toFixed(2)}</td>
          <td class="item-sub">$${(item.subtotal || 0).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Recibo ${factura.numero_factura || factura.id}</title>
<style>
  @page {
    size: 80mm auto;
    margin: 0;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: "Courier New", monospace;
    font-size: 11px;
    color: #000;
    width: 72mm;
    padding: 2mm 1mm;
    line-height: 1.4;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .header {
    border-bottom: 1px dashed #000;
    padding-bottom: 4px;
    margin-bottom: 4px;
  }
  .header h1 { font-size: 14px; }
  .header p { font-size: 10px; }
  .section {
    border-bottom: 1px dashed #000;
    padding: 4px 0;
    margin-bottom: 4px;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 2px 0;
  }
  td { padding: 1px 0; vertical-align: top; }
  .item-desc { font-size: 10px; }
  .item-qty { font-size: 9px; color: #333; }
  .item-sub { font-size: 10px; text-align: right; }
  .totals {
    border-top: 1px dashed #000;
    padding-top: 4px;
    margin-top: 4px;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: bold;
    padding: 2px 0;
  }
  .footer {
    border-top: 1px dashed #000;
    padding-top: 4px;
    margin-top: 6px;
    text-align: center;
    font-size: 9px;
  }
</style>
</head>
<body>
  <div class="header center">
    <h1>PROAUTO Taller SV</h1>
    <p>Taller Mecánico Automotriz</p>
    <p>Tel: +503 XXXX-XXXX</p>
  </div>

  <div class="section">
    <div class="info-row">
      <span class="bold">Recibo:</span>
      <span>${escapeHtml(factura.numero_factura || factura.id.slice(0, 8))}</span>
    </div>
    <div class="info-row">
      <span class="bold">Fecha:</span>
      <span>${fecha}</span>
    </div>
    <div class="info-row">
      <span class="bold">Forma Pago:</span>
      <span>${escapeHtml(factura.forma_pago || "Contado")}</span>
    </div>
  </div>

  <div class="section">
    <p class="bold">Cliente:</p>
    <p>${escapeHtml(cliente?.nombre_completo || "N/A")}</p>
    ${cliente?.telefono ? `<p>Tel: ${escapeHtml(cliente.telefono)}</p>` : ""}
    ${vehiculo ? `<p class="bold" style="margin-top:2px">Vehículo:</p><p>${escapeHtml(vehiculo.marca + " " + vehiculo.modelo)} - ${escapeHtml(vehiculo.placa || "")}</p>` : ""}
  </div>

  <table>
    ${itemsHtml}
  </table>

  <div class="totals">
    <div class="info-row">
      <span>Subtotal:</span>
      <span>$${(factura.subtotal || 0).toFixed(2)}</span>
    </div>
    ${factura.iva > 0 ? `<div class="info-row"><span>IVA (13%):</span><span>$${(factura.iva || 0).toFixed(2)}</span></div>` : ""}
    <div class="total-row">
      <span>TOTAL:</span>
      <span>$${(factura.total || 0).toFixed(2)}</span>
    </div>
  </div>

  <div class="totals">
    <div class="info-row">
      <span>Pagado:</span>
      <span>$${(factura.monto_pagado || 0).toFixed(2)}</span>
    </div>
    <div class="info-row bold">
      <span>Saldo:</span>
      <span>$${factura.estado_pago === "Pagada" ? "0.00" : ((factura.saldo_pendiente != null ? factura.saldo_pendiente : (factura.total || 0) - (factura.monto_pagado || 0))).toFixed(2)}</span>
    </div>
    <p class="center" style="margin-top:2px">Estado: ${escapeHtml(factura.estado_pago || "Pendiente")}</p>
  </div>

  <div class="footer">
    <p>¡Gracias por su preferencia!</p>
    <p>Conserve este recibo</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      alert("Permite las ventanas emergentes para imprimir el recibo.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return handlePrint;
}

function escapeHtml(text) {
  if (text == null) return "";
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}