import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@2.5.2';

const LOGO_URL = "https://media.base44.com/images/public/691be028b7c98b3edbc7aec7/3462a2501_527724637_10228100711375307_2433035938491200389_n.jpg";

const RED = "#E31E24";
const RED_DARK = "#B71C1C";
const DARK = "#1A1A1A";
const GRAY_DARK = "#424242";
const GRAY_MED = "#757575";
const GRAY_LIGHT = "#E8E8E8";
const GRAY_BG = "#F5F5F5";

function abToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function escapeText(s) {
  if (s == null) return "";
  return String(s);
}

function fmtMoney(n) {
  return (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return new Date().toLocaleDateString("es-SV");
  try {
    return new Date(d).toLocaleDateString("es-SV", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return String(d);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, factura, cliente, vehiculo } = await req.json();
    if (!to || !factura) return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 });

    const numeroFactura = factura.numero_factura || factura.id?.slice(0, 8) || "N/A";

    // Fetch logo as base64
    let logoDataUrl = null;
    try {
      const logoResp = await fetch(LOGO_URL);
      if (logoResp.ok) {
        const logoBuf = await logoResp.arrayBuffer();
        const logoB64 = abToBase64(logoBuf);
        logoDataUrl = `data:image/jpeg;base64,${logoB64}`;
      }
    } catch (e) {
      // Logo is optional — continue without it
    }

    // Build PDF
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const pageW = 216; // letter width in mm
    const margin = 15;
    const contentW = pageW - margin * 2;

    // ---- Header band (red) ----
    doc.setFillColor(227, 30, 36);
    doc.rect(0, 0, pageW, 38, 'F');

    // Logo
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'JPEG', margin, 6, 30, 26);
      } catch (e) {
        // skip if image fails
      }
    }

    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("PROAUTO", margin + 36, 16);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Taller SV", margin + 36, 22);
    doc.setFontSize(8);
    doc.text("Mecanica General  -  Diagnostico Computarizado", margin + 36, 28);
    doc.text("8 Av Sur Entre 27 y 29 Calle Pte, Santa Ana", margin + 36, 32);

    // "FACTURA" label on right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("FACTURA", pageW - margin, 18, { align: "right" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`N° ${numeroFactura}`, pageW - margin, 26, { align: "right" });
    doc.text(`Fecha: ${fmtDate(factura.fecha_emision)}`, pageW - margin, 32, { align: "right" });

    // ---- Cliente / Vehiculo section ----
    let y = 48;
    doc.setTextColor(GRAY_MED);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("FACTURAR A", margin, y);
    if (vehiculo) {
      doc.text("VEHICULO", pageW / 2 + 5, y);
    }

    y += 5;
    doc.setTextColor(DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(escapeText(cliente?.nombre_completo || "N/A"), margin, y);
    if (vehiculo) {
      doc.text(`${escapeText(vehiculo.marca || "")} ${escapeText(vehiculo.modelo || "")}`.trim(), pageW / 2 + 5, y);
    }

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(GRAY_DARK);
    if (cliente?.telefono) {
      doc.text(`Tel: ${escapeText(cliente.telefono)}`, margin, y);
    }
    if (cliente?.email) {
      doc.text(escapeText(cliente.email), margin, y + 4);
    }
    if (vehiculo) {
      doc.text(`Placa: ${escapeText(vehiculo.placa || "—")}`, pageW / 2 + 5, y);
      if (vehiculo.anio) {
        doc.text(`Ano: ${vehiculo.anio}`, pageW / 2 + 5, y + 4);
      }
      if (vehiculo.color) {
        doc.text(`Color: ${escapeText(vehiculo.color)}`, pageW / 2 + 5, y + 8);
      }
    }

    // ---- Forma de pago & vencimiento ----
    y = Math.max(y + 10, 72);
    doc.setDrawColor(GRAY_LIGHT);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    doc.setFontSize(9);
    doc.setTextColor(GRAY_MED);
    doc.setFont("helvetica", "bold");
    doc.text("FORMA DE PAGO:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(DARK);
    doc.text(escapeText(factura.forma_pago || "Contado"), margin + 35, y);

    if (factura.fecha_vencimiento) {
      doc.setTextColor(GRAY_MED);
      doc.setFont("helvetica", "bold");
      doc.text("VENCIMIENTO:", pageW / 2 + 5, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(DARK);
      doc.text(fmtDate(factura.fecha_vencimiento), pageW / 2 + 40, y);
    }

    // ---- Items table ----
    y += 6;
    const tableX = margin;
    const tableW = contentW;
    const colCant = 18;
    const colDesc = tableW - colCant - 30 - 30;
    const colPrecio = 30;
    const colTotal = 30;

    // Table header
    doc.setFillColor(227, 30, 36);
    doc.rect(tableX, y, tableW, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("CANT.", tableX + 2, y + 5);
    doc.text("DESCRIPCION", tableX + colCant + 2, y + 5);
    doc.text("P. UNIT.", tableX + colCant + colDesc + 2, y + 5);
    doc.text("TOTAL", tableX + colCant + colDesc + colPrecio + 2, y + 5);

    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const items = factura.items || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const sub = item.subtotal != null ? item.subtotal : (item.cantidad || 0) * (item.precio_unitario || 0);

      // Alternate row background
      if (i % 2 === 1) {
        doc.setFillColor(245, 245, 245);
        doc.rect(tableX, y, tableW, 7, 'F');
      }

      doc.setTextColor(DARK);
      doc.text(String(item.cantidad || 0), tableX + 2, y + 5);
      // Truncate description if too long
      const descText = escapeText(item.descripcion || "");
      const descLines = doc.splitTextToSize(descText, colDesc - 4);
      doc.text(descLines[0] || "", tableX + colCant + 2, y + 5);
      doc.text(fmtMoney(item.precio_unitario), tableX + colCant + colDesc + colPrecio - 2, y + 5, { align: "right" });
      doc.text(fmtMoney(sub), tableX + tableW - 2, y + 5, { align: "right" });

      y += 7;

      // Page break if needed
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
    }

    // Table border
    doc.setDrawColor(GRAY_LIGHT);
    doc.setLineWidth(0.3);
    doc.rect(tableX, y - items.length * 7, tableW, items.length * 7 + 7);

    // ---- Totals section ----
    y += 5;
    const totalsX = pageW - margin - 75;
    const totalsW = 75;
    const labelX = totalsX;
    const valueX = totalsX + totalsW - 2;

    doc.setFontSize(9);
    doc.setTextColor(GRAY_DARK);
    doc.setFont("helvetica", "normal");

    const saldoPendiente = factura.estado_pago === "Pagada" ? 0 :
      (factura.saldo_pendiente != null ? factura.saldo_pendiente : (factura.total || 0) - (factura.monto_pagado || 0));

    doc.text("Subtotal:", labelX, y);
    doc.text(`$${fmtMoney(factura.subtotal)}`, valueX, y, { align: "right" });
    y += 5;

    if (factura.importe_neto != null && factura.importe_neto !== factura.subtotal) {
      doc.text("Importe Neto:", labelX, y);
      doc.text(`$${fmtMoney(factura.importe_neto)}`, valueX, y, { align: "right" });
      y += 5;
    }

    if (factura.iva > 0) {
      doc.text("IVA (13%):", labelX, y);
      doc.text(`$${fmtMoney(factura.iva)}`, valueX, y, { align: "right" });
      y += 5;
    }

    // Total box
    doc.setFillColor(227, 30, 36);
    doc.rect(totalsX - 2, y - 2, totalsW, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL:", labelX, y + 4);
    doc.text(`$${fmtMoney(factura.total)}`, valueX, y + 4, { align: "right" });

    y += 14;
    doc.setTextColor(GRAY_DARK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Pagado:", labelX, y);
    doc.setTextColor("#2E7D32");
    doc.text(`$${fmtMoney(factura.monto_pagado)}`, valueX, y, { align: "right" });
    y += 5;

    doc.setTextColor(GRAY_DARK);
    doc.text("Saldo Pendiente:", labelX, y);
    doc.setTextColor(saldoPendiente > 0 ? "#C62828" : "#2E7D32");
    doc.setFont("helvetica", "bold");
    doc.text(`$${fmtMoney(saldoPendiente)}`, valueX, y, { align: "right" });

    // ---- Estado de pago badge ----
    y += 8;
    const estado = factura.estado_pago || "Pendiente";
    const estadoColors = {
      "Pagada": [46, 125, 50],
      "Parcial": [249, 168, 37],
      "Pendiente": [198, 40, 40],
      "Vencida": [198, 40, 40],
    };
    const ec = estadoColors[estado] || [198, 40, 40];
    doc.setFillColor(ec[0], ec[1], ec[2]);
    const badgeW = 40;
    doc.roundedRect(totalsX, y, badgeW, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(estado.toUpperCase(), totalsX + badgeW / 2, y + 5, { align: "center" });

    // ---- Footer ----
    const footerY = 260;
    doc.setDrawColor(GRAY_LIGHT);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageW - margin, footerY);

    doc.setTextColor(GRAY_MED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("PROAUTO Taller SV  -  8 Av Sur Entre 27 y 29 Calle Pte, Santa Ana", pageW / 2, footerY + 5, { align: "center" });
    doc.text("Tel: 6866-0952 / 2406-8129", pageW / 2, footerY + 9, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(RED);
    doc.setFontSize(9);
    doc.text("Gracias por preferirnos!", pageW / 2, footerY + 15, { align: "center" });

    // Generate PDF bytes
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBase64 = abToBase64(pdfArrayBuffer);

    // ---- Build email with attachment ----
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const subject = `Factura ${numeroFactura} - PROAUTO Taller SV`;
    const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

    const bodyText = `Estimado/a ${cliente?.nombre_completo || ""},\n\n` +
      `Adjunto encontrara su factura ${numeroFactura} por un total de $${fmtMoney(factura.total)}.\n\n` +
      `Si tiene alguna consulta, no dude en contactarnos.\n\n` +
      `Gracias por preferirnos!\n\nPROAUTO Taller SV\nTel: 6866-0952 / 2406-8129`;

    const boundary = 'proauto_pdf_' + Math.random().toString(36).substring(2);
    const altBoundary = 'proauto_alt_' + Math.random().toString(36).substring(2);

    const bodyB64 = btoa(unescape(encodeURIComponent(bodyText)));

    const rawMessage = [
      `To: ${to}`,
      `From: PROAUTO Taller SV <me>`,
      `Subject: ${encodedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      bodyB64,
      ``,
      `--${boundary}`,
      `Content-Type: application/pdf; name="Factura_${numeroFactura}.pdf"`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="Factura_${numeroFactura}.pdf"`,
      ``,
      pdfBase64,
      ``,
      `--${boundary}--`,
    ].join('\r\n');

    const encodedMessage = btoa(rawMessage)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: `Gmail API error: ${errorText}` }, { status: 500 });
    }

    const result = await response.json();
    return Response.json({ success: true, messageId: result.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});