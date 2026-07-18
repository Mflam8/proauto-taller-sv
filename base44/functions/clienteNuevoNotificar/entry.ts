import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TALLER_EMAIL = "proautotallersv@gmail.com";
// Si tienes un Sheet ya creado, pon su ID aquí. Si está vacío, se creará uno automátticament.
let SPREADSHEET_ID_ENV = "";
try { SPREADSHEET_ID_ENV = Deno.env.get("CLIENTES_SPREADSHEET_ID") || ""; } catch(_) {}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return Response.json({ error: "Forbidden: se requiere rol admin" }, { status: 403 });
    }

    const body = await req.json();

    const cliente = body.data;
    if (!cliente) {
      return Response.json({ error: "No se recibió data del cliente" }, { status: 400 });
    }

    const { accessToken: sheetsToken } = await base44.asServiceRole.connectors.getConnection("googlesheets");
    const { accessToken: gmailToken } = await base44.asServiceRole.connectors.getConnection("gmail");

    // --- 1. Google Sheets: buscar o crear spreadsheet ---
    let spreadsheetId = SPREADSHEET_ID_ENV;

    if (!spreadsheetId) {
      // Buscar si ya existe uno con ese nombre
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name%3D'PROAUTO_Clientes'%20and%20mimeType%3D'application%2Fvnd.google-apps.spreadsheet'%20and%20trashed%3Dfalse&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${sheetsToken}` } }
      );
      const searchData = await searchRes.json();

      if (searchData.files && searchData.files.length > 0) {
        spreadsheetId = searchData.files[0].id;
      } else {
        // Crear nuevo spreadsheet con cabeceras
        const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sheetsToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: { title: "PROAUTO_Clientes" },
            sheets: [{
              properties: { title: "Clientes" },
              data: [{
                startRow: 0,
                startColumn: 0,
                rowData: [{
                  values: [
                    "Fecha Registro", "ID", "Nombre Completo", "Teléfono", "WhatsApp",
                    "Email", "DUI", "NIT", "Dirección", "Tipo Cliente",
                    "Nombre Empresa", "Notas"
                  ].map(v => ({ userEnteredValue: { stringValue: v } }))
                }]
              }]
            }]
          }),
        });
        const newSheet = await createRes.json();
        spreadsheetId = newSheet.spreadsheetId;
      }
    }

    // --- 2. Agregar fila con datos del cliente ---
    const fechaRegistro = new Date().toLocaleString("es-SV", { timeZone: "America/El_Salvador" });
    const rowValues = [
      fechaRegistro,
      cliente.id || "",
      cliente.nombre_completo || "",
      cliente.telefono || "",
      cliente.whatsapp || "",
      cliente.email || "",
      cliente.dui || "",
      cliente.nit || "",
      cliente.direccion || "",
      cliente.tipo_cliente || "Particular",
      cliente.nombre_empresa || "",
      cliente.notas || "",
    ];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Clientes!A:L:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sheetsToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [rowValues] }),
      }
    );

    // --- 3. Enviar correo de notificación vía Gmail ---
    const asunto = `🚗 Nuevo cliente registrado: ${cliente.nombre_completo}`;
    const cuerpo = `
Hola PROAUTO Taller 👋

Se registró un nuevo cliente en el sistema:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Nombre:       ${cliente.nombre_completo || "—"}
📱 Teléfono:     ${cliente.telefono || "—"}
💬 WhatsApp:     ${cliente.whatsapp || "—"}
📧 Email:        ${cliente.email || "—"}
🏷️ Tipo:         ${cliente.tipo_cliente || "Particular"}
🏢 Empresa:      ${cliente.nombre_empresa || "—"}
📍 Dirección:    ${cliente.direccion || "—"}
📅 Registrado:   ${fechaRegistro}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Los datos ya fueron guardados automáticamente en Google Sheets:
https://docs.google.com/spreadsheets/d/${spreadsheetId}

PROAUTO Taller SV — Sistema Interno
`.trim();

    // Construir mensaje RFC 2822 en Base64
    const mimeMessage = [
      `From: PROAUTO Taller <${TALLER_EMAIL}>`,
      `To: ${TALLER_EMAIL}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(asunto)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(unescape(encodeURIComponent(cuerpo))),
    ].join("\r\n");

    const encodedMessage = btoa(mimeMessage)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gmailToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    return Response.json({
      success: true,
      spreadsheetId,
      cliente: cliente.nombre_completo,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});