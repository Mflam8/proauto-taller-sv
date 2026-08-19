import { jsPDF } from "jspdf";

const PRIMARY = [227, 30, 36];
const DARK = [26, 26, 26];
const GRAY = [120, 120, 120];
const LIGHT = [240, 240, 240];

export default function generarAutorizacionPDF({
  expediente,
  cliente,
  vehiculo,
  inspeccion,
  trabajos = [],
  autorizacion = {},
}) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = 0;

  const header = (title) => {
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PROAUTO Taller SV", margin, 14);
    doc.setFontSize(9);
    doc.text(title, pageW - margin, 14, { align: "right" });
  };

  const footer = () => {
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(
      "PROAUTO Taller SV · Documento de autorizaci\u00f3n y conformidad",
      pageW / 2,
      pageH - 8,
      { align: "center" }
    );
  };

  // ===== P\u00e1gina 1: Autorizaci\u00f3n =====
  header("Autorizaci\u00f3n y Conformidad");
  y = 30;
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("AUTORIZACI\u00d3N DE PRESUPUESTO", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 5;
  doc.text(`Expediente: ${expediente.numero_expediente || expediente.id || "—"}`, margin, y);
  doc.text(
    `Fecha: ${new Date().toLocaleDateString("es-SV")}`,
    pageW - margin,
    y,
    { align: "right" }
  );
  y += 8;

  // Cliente y Veh\u00edculo en dos columnas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CLIENTE", margin, y);
  doc.text("VEH\u00cdCULO", pageW / 2, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const placaLabel = vehiculo?.placa === "SIN PLACA"
    ? `Sin placa${vehiculo.poliza ? " · P\u00f3liza " + vehiculo.poliza : ""}`
    : vehiculo?.placa || "—";
  const clienteLines = [
    cliente?.nombre_completo || "—",
    cliente?.telefono || "",
    cliente?.direccion || "",
  ].filter(Boolean);
  const vehLines = [
    vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio || ""}` : "—",
    `Placa: ${placaLabel}`,
    `Color: ${vehiculo?.color || "—"}`,
  ];
  doc.text(clienteLines, margin, y);
  doc.text(vehLines, pageW / 2, y);
  y += Math.max(clienteLines.length, vehLines.length) * 4 + 4;

  // Presupuesto de trabajos
  if (y > pageH - 70) { doc.addPage(); y = margin; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PRESUPUESTO DE TRABAJOS", margin, y);
  y += 5;
  doc.setFillColor(...LIGHT);
  doc.rect(margin, y, pageW - margin * 2, 7, "F");
  doc.setFontSize(8);
  doc.text("Descripci\u00f3n", margin + 2, y + 5);
  doc.text("Tipo", margin + 110, y + 5);
  doc.text("Cant.", pageW - margin - 35, y + 5);
  doc.text("Precio", pageW - margin - 15, y + 5, { align: "right" });
  y += 8;
  doc.setFont("helvetica", "normal");
  let total = 0;
  if (trabajos.length === 0) {
    doc.text("(Sin trabajos registrados)", margin + 2, y);
    y += 5;
  }
  trabajos.forEach((t) => {
    if (y > pageH - 50) { doc.addPage(); y = margin; }
    const desc = (t.descripcion || "—").slice(0, 65);
    doc.text(desc, margin + 2, y);
    doc.text((t.tipo || "").slice(0, 18), margin + 110, y);
    doc.text(String(t.cantidad ?? 1), pageW - margin - 35, y);
    doc.text(`$${(t.precio_unitario || 0).toFixed(2)}`, pageW - margin - 15, y, { align: "right" });
    total += t.subtotal || (t.cantidad || 1) * (t.precio_unitario || 0);
    y += 5;
  });
  y += 2;
  doc.setFillColor(...PRIMARY);
  doc.rect(pageW - margin - 55, y, 55, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: $${total.toFixed(2)}`, pageW - margin - 2, y + 5.5, { align: "right" });
  doc.setTextColor(...DARK);
  y += 13;

  // Estado del veh\u00edculo (inspecci\u00f3n)
  if (inspeccion) {
    if (y > pageH - 70) { doc.addPage(); y = margin; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ESTADO DEL VEHI\u0301CULO (INSPECCI\u00d3N)", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const cond = [
      ["Llantas", inspeccion.estado_llantas],
      ["Luces", inspeccion.estado_luces],
      ["Vidrios", inspeccion.estado_vidrios],
      ["Pintura", inspeccion.estado_pintura],
      ["Tapicer\u00eda", inspeccion.estado_tapiceria],
      ["A/C", inspeccion.aire_acondicionado],
      ["Direcci\u00f3n hidr.", inspeccion.direccion_hidraulica],
      ["Alarma", inspeccion.alarma],
    ].filter(([, v]) => v);
    cond.forEach(([k, v], i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      doc.text(`${k}: ${v}`, margin + col * 60, y + row * 5);
    });
    y += Math.ceil(cond.length / 3) * 5 + 2;
    if (inspeccion.daños && inspeccion.daños.length) {
      doc.setFont("helvetica", "bold");
      doc.text(`Da\u00f1os registrados: ${inspeccion.daños.length}`, margin, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      inspeccion.daños.forEach((d) => {
        if (y > pageH - 40) { doc.addPage(); y = margin; }
        doc.text(`\u2022 ${d.tipo} \u2014 ${d.ubicacion || ""}${d.descripcion ? " · " + d.descripcion : ""}`, margin + 2, y);
        y += 4;
      });
      y += 2;
    }
  }

  // Declaraci\u00f3n del cliente
  if (y > pageH - 75) { doc.addPage(); y = margin; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DECLARACI\u00d3N DEL CLIENTE", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const texto = [
    "El suscrito cliente declara que ha revisado y aprobado el presupuesto de trabajos detallado arriba, as\u00ed",
    "como el estado en que se recibe el veh\u00edculo seg\u00fan la inspecci\u00f3n realizada. Autoriza al taller PROAUTO",
    "Taller SV a realizar los trabajos descritos. Entiende que los precios pueden variar si se detectan da\u00f1os",
    "adicionales, los cuales ser\u00e1n comunicados previamente. Libera al taller de responsabilidad por da\u00f1os",
    "preexistentes declarados en la inspecci\u00f3n. Los t\u00e9rminos de garant\u00eda constan en el reverso de este documento.",
  ];
  texto.forEach((line) => {
    if (y > pageH - 45) { doc.addPage(); y = margin; }
    doc.text(line, margin, y);
    y += 4.5;
  });
  y += 6;

  // Firma del cliente
  if (y > pageH - 45) { doc.addPage(); y = margin; }
  if (autorizacion.firma_data_url) {
    try {
      doc.addImage(autorizacion.firma_data_url, "PNG", margin, y, 50, 18);
    } catch (e) {
      /* firma inv\u00e1lida, se omite */
    }
  }
  y += 20;
  doc.setDrawColor(120);
  doc.line(margin, y, margin + 70, y);
  doc.line(pageW - margin - 70, y, pageW - margin, y);
  doc.setFontSize(8);
  doc.text(`Firma del cliente: ${autorizacion.nombre_firma || ""}`, margin, y + 5);
  doc.text("Firma taller PROAUTO", pageW - margin - 70, y + 5);
  doc.text(
    `Fecha: ${autorizacion.fecha_autorizacion ? new Date(autorizacion.fecha_autorizacion).toLocaleDateString("es-SV") : ""}`,
    margin,
    y + 11
  );
  doc.setTextColor(...GRAY);
  doc.setFontSize(7);
  doc.text(`M\u00e9todo: ${autorizacion.metodo || "—"}`, pageW - margin, y + 11, { align: "right" });

  footer();

  // ===== P\u00e1gina 2: Garant\u00eda =====
  doc.addPage();
  header("T\u00e9rminos de Garant\u00eda");
  y = 30;
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("GARANT\u00cdA DE SERVICIOS", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const garantia = [
    ["p", "PROAUTO Taller SV garantiza los trabajos de reparaci\u00f3n y mano de obra realizados por un periodo de"],
    ["p", "treinta (30) d\u00edas o 1,500 km, lo que ocurra primero, contados a partir de la fecha de entrega del veh\u00edculo."],
    ["", ""],
    ["b", "ALCANCE DE LA GARANT\u00cdA:"],
    ["p", "\u2022 Cubre \u00fanicamente los defectos atribuibles a la mano de obra o a las piezas instaladas por el taller."],
    ["p", "\u2022 La garant\u00eda no cubre da\u00f1os causados por mal uso, accidentes, negligencia, modificaciones o reparaciones"],
    ["p", "  realizadas por terceros despu\u00e9s de la entrega."],
    ["p", "\u2022 Las reparaciones cubiertas por garant\u00eda se realizar\u00e1n sin costo adicional para el cliente."],
    ["", ""],
    ["b", "EXCLUSIONES:"],
    ["p", "\u2022 No se cubren da\u00f1os por desgaste normal, uso inadecuado de combustible o lubricantes, ni fallas en"],
    ["p", "  sistemas no intervenidos durante la reparaci\u00f3n."],
    ["p", "\u2022 Los repuestos suministrados por el cliente no est\u00e1n cubiertos por esta garant\u00eda; \u00fanicamente la mano de obra."],
    ["p", "\u2022 La garant\u00eda se anula si el od\u00f3metro/kilometraje es alterado o si el veh\u00edculo es intervenido por terceros."],
    ["", ""],
    ["b", "PROCEDIMIENTO:"],
    ["p", "Para hacer efectiva la garant\u00eda, el cliente deber\u00e1 presentar este documento y el veh\u00edculo en el taller,"],
    ["p", "dentro del periodo de vigencia. El taller evaluar\u00e1 la falla y, si corresponde a la garant\u00eda, realizar\u00e1 la"],
    ["p", "reparaci\u00f3n a la mayor brevedad posible."],
    ["", ""],
    ["p", "El cliente acepta los t\u00e9rminos de esta garant\u00eda al firmar la autorizaci\u00f3n de presupuesto en el anverso."],
  ];

  garantia.forEach(([style, line]) => {
    if (y > pageH - 15) { doc.addPage(); y = margin; }
    if (style === "b") {
      doc.setFont("helvetica", "bold");
      doc.text(line, margin, y);
      doc.setFont("helvetica", "normal");
    } else if (style === "p") {
      doc.text(line, margin, y);
    }
    y += 5;
  });

  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("PROAUTO Taller SV · T\u00e9rminos de garant\u00eda", pageW / 2, pageH - 8, { align: "center" });

  doc.save(`Autorizacion_${expediente.numero_expediente || expediente.id || "expediente"}.pdf`);
}