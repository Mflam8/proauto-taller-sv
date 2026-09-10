import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // La invocación programada (workflow) llega sin sesión; si hay usuario, exigir admin
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      // Sin sesión: invocación programada — continuar
    }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: se requiere rol admin' }, { status: 403 });
    }

    // Fecha actual en El Salvador (el servidor corre en UTC)
    const nowSv = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/El_Salvador' }));
    const hoyDia = nowSv.getDate();
    const hoyMes = nowSv.getMonth() + 1;
    const hoyAnio = nowSv.getFullYear();

    const empleados = await base44.asServiceRole.entities.Empleado.list('-created_date', 500);

    const cumplen = empleados
      .filter((e: any) => e.fecha_nacimiento && e.activo !== false)
      .filter((e: any) => {
        const partes = String(e.fecha_nacimiento).split('-');
        return parseInt(partes[1]) === hoyMes && parseInt(partes[2]) === hoyDia;
      })
      .map((e: any) => {
        const anioNac = parseInt(String(e.fecha_nacimiento).split('-')[0]);
        return { nombre: e.nombre_completo, edad: hoyAnio - anioNac };
      });

    if (cumplen.length === 0) {
      return Response.json({ enviados: 0, cumpleanos: [] });
    }

    // Notificar a todos los administradores de la app
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const correos = admins.map((a: any) => a.email).filter(Boolean);
    if (correos.length === 0) {
      return Response.json({ enviados: 0, error: 'No hay administradores con correo registrado' });
    }

    const fechaHoy = nowSv.toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' });
    const lista = cumplen.map(c => `- ${c.nombre}${c.edad > 0 ? ` (cumple ${c.edad} años)` : ''}`).join('\n');
    const subject = cumplen.length === 1
      ? `🎂 Recordatorio: hoy es cumpleaños de ${cumplen[0].nombre}`
      : `🎂 Recordatorio: hoy hay ${cumplen.length} cumpleaños en el equipo`;
    const body = `Hola equipo PROAUTO Taller SV,\n\nHoy, ${fechaHoy}, ${cumplen.length === 1 ? 'es cumpleaños de:' : 'son cumpleaños de:'}\n\n${lista}\n\n¡No olvides felicitarlos!\n\n-- Sistema PROAUTO Taller SV`;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const rawMessage = [
      `To: ${correos.join(', ')}`,
      `From: PROAUTO Taller SV <me>`,
      `Subject: ${encodedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(unescape(encodeURIComponent(body))),
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
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: `Gmail API error: ${errorText}` }, { status: 500 });
    }

    return Response.json({ enviados: correos.length, cumpleanos: cumplen.map(c => c.nombre) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}