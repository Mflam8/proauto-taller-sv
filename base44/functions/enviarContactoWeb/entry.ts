import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const WORKSHOP_EMAIL = 'proautotallersv@gmail.com';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const nombre = String(body.nombre || '').trim();
    const telefono = String(body.telefono || '').trim();
    const mensaje = String(body.mensaje || '').trim();

    if (!nombre || nombre.length > 120) return Response.json({ error: 'Escribe un nombre de hasta 120 caracteres.' }, { status: 400 });
    if (!telefono || telefono.length > 40) return Response.json({ error: 'Escribe un teléfono válido de hasta 40 caracteres.' }, { status: 400 });
    if (!mensaje || mensaje.length > 2000) return Response.json({ error: 'El mensaje debe tener entre 1 y 2000 caracteres.' }, { status: 400 });

    const contacto = await base44.entities.ContactoWeb.create({ nombre, telefono, mensaje, leido: false });
    const fecha = new Date().toLocaleString('es-SV', { timeZone: 'America/El_Salvador' });
    const emailVariables = {
      nombre,
      telefono,
      mensaje,
      fecha,
      mensaje_resumen: mensaje.slice(0, 140),
    };

    try {
      const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
        to: WORKSHOP_EMAIL,
        template_name: 'NuevoMensajeWeb',
        variables: emailVariables,
        category: 'transactional',
      });
      if (emailResult?.success === false) {
        return Response.json({
          success: false,
          saved: true,
          error: 'Tu mensaje quedó guardado, pero no pudimos avisar al taller por correo. Escríbenos por WhatsApp para confirmar tu solicitud.',
        });
      }
    } catch {
      return Response.json({
        success: false,
        saved: true,
        error: 'Tu mensaje quedó guardado, pero no pudimos avisar al taller por correo. Escríbenos por WhatsApp para confirmar tu solicitud.',
      });
    }

    return Response.json({ success: true, saved: true, message_id: contacto.id });
  } catch {
    return Response.json({ error: 'No se pudo guardar tu mensaje. Intenta de nuevo o contáctanos por WhatsApp.' }, { status: 500 });
  }
}