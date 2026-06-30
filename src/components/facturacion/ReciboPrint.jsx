import React from "react";

const LOGO_URL = "https://media.base44.com/images/public/691be028b7c98b3edbc7aec7/3462a2501_527724637_10228100711375307_2433035938491200389_n.jpg";

/**
 * ReciboPrint — recibo optimizado para impresora térmica 80mm (POS-80C / 3NSTAR).
 * Todo el texto en negrita para evitar impresión tenue.
 */
export default function ReciboPrint({ factura, cliente, vehiculo }) {
  const handlePrint = () => {
    const fecha = factura.fecha_emision
      ? new Date(factura.fecha_emision).toLocaleDateString("es-SV", { day: "2-digit", month: "2-digit", year: "2-digit" })
      : new Date().toLocaleDateString("es-SV", { day: "2-digit", month: "2-digit", year: "2-digit" });

    const itemsHtml = (factura.items || [])
      .map(
        (item) => `
        <tr>
          <td class="col-cant">${item.cantidad}</td>
          <td class="col-desc">${escapeHtml(item.descripcion || "")}</td>
          <td class="col-precio">${(item.precio_unitario || 0).toFixed(2)}</td>
          <td class="col-total">${(item.subtotal || item.cantidad * item.precio_unitario || 0).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const vehiculoLinea = vehiculo
      ? `${escapeHtml(vehiculo.marca || "")} ${escapeHtml(vehiculo.modelo || "")} ${vehiculo.anio || ""}`.trim()
      : "N/A";

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
    font-weight: bold;
  }
  body {
    font-family: "Courier New", monospace;
    font-size: 11px;
    font-weight: bold;
    color: #000;
    width: 72mm;
    padding: 2mm 1mm;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .logo {
    width: 40mm;
    height: auto;
    margin: 0 auto 2px;
    display: block;
  }
  .header {
    border-bottom: 1px dashed #000;
    padding-bottom: 4px;
    margin-bottom: 4px;
    text-align: center;
  }
  .header p { font-size: 10px; font-weight: bold; }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 4px;
    border-bottom: 1px dashed #000;
    padding-bottom: 4px;
    margin-bottom: 4px;
    font-size: 10px;
  }
  .meta-grid div { display: flex; justify-content: space-between; }
  .meta-full {
    border-bottom: 1px dashed #000;
    padding-bottom: 4px;
    margin-bottom: 4px;
    font-size: 10px;
  }
  .meta-full div { display: flex; justify-content: space-between; margin-bottom: 1px; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 2px 0;
  }
  thead th {
    font-size: 9px;
    font-weight: bold;
    border-bottom: 1px solid #000;
    padding: 2px 0;
    text-transform: uppercase;
  }
  tbody td {
    font-size: 10px;
    font-weight: bold;
    padding: 2px 0;
    vertical-align: top;
  }
  .col-cant { width: 12%; text-align: left; }
  .col-desc { width: 48%; }
  .col-precio { width: 18%; text-align: right; }
  .col-total { width: 22%; text-align: right; }
  .totals {
    border-top: 1px dashed #000;
    padding-top: 4px;
    margin-top: 2px;
    font-size: 10px;
  }
  .totals div { display: flex; justify-content: space-between; margin-bottom: 1px; }
  .total-final {
    font-size: 13px;
    border-top: 1px solid #000;
    margin-top: 2px;
    padding-top: 2px;
  }
  .footer {
    border-top: 1px dashed #000;
    padding-top: 4px;
    margin-top: 4px;
    text-align: center;
    font-size: 10px;
    font-weight: bold;
  }
</style>
</head>
<body>
  <div class="header">
    <img src="${LOGO_URL}" class="logo" alt="PROAUTO" />
    <p>8 Av Sur Entre 27 y 29 Calle Pte</p>
    <p>Locales 1 y 2, Santa Ana</p>
    <p>Tel: 6866-0952 / 2406-8129</p>
  </div>

  <div class="meta-grid">
    <div><span>ORDEN:</span><span>${escapeHtml(factura.numero_factura || factura.id.slice(0, 8))}</span></div>
    <div><span>FECHA:</span><span>${fecha}</span></div>
    <div><span>PAGO:</span><span>${escapeHtml(factura.forma_pago || "Contado")}</span></div>
  </div>

  <div class="meta-full">
    <div><span>NOMBRE:</span><span>${escapeHtml(truncate(cliente?.nombre_completo || "N/A", 30))}</span></div>
    <div><span>VEHICULO:</span><span>${escapeHtml(truncate(vehiculoLinea, 30))}</span></div>
    <div><span>PLACA:</span><span>${escapeHtml(vehiculo?.placa || "—")}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="col-cant">Cant</th>
        <th class="col-desc">Descripcion</th>
        <th class="col-precio">Precio</th>
        <th class="col-total">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Importe Bruto:</span><span>$${(factura.subtotal || 0).toFixed(2)}</span></div>
    <div><span>Importe Neto:</span><span>$${(factura.importe_neto || factura.subtotal || 0).toFixed(2)}</span></div>
    ${factura.iva > 0 ? `<div><span>IVA (13%):</span><span>$${(factura.iva || 0).toFixed(2)}</span></div>` : ""}
    <div class="total-final"><span>TOTAL:</span><span>$${(factura.total || 0).toFixed(2)}</span></div>
  </div>

  <div class="totals">
    <div><span>Pagado:</span><span>$${(factura.monto_pagado || 0).toFixed(2)}</span></div>
    <div><span>Saldo:</span><span>$${factura.estado_pago === "Pagada" ? "0.00" : ((factura.saldo_pendiente != null ? factura.saldo_pendiente : (factura.total || 0) - (factura.monto_pagado || 0))).toFixed(2)}</span></div>
  </div>

  <div class="footer">
    <p>GRACIAS POR PREFERIRNOS</p>
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

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}