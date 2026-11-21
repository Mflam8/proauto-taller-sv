import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const PROFILES_ALLOWED = ['admin', 'gerencia', 'jefe_taller', 'recepcion_cobros'];
const OWNER_EMAILS = ['proautotallersv@gmail.com', 'mayaflamenco89@gmail.com'];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => error.status === 401 ? null : Promise.reject(error));
    if (!user) return Response.json({ error: 'Inicia sesión para ver los mensajes.' }, { status: 401 });

    let autorizado = user.role === 'admin' || OWNER_EMAILS.includes(String(user.email || '').toLowerCase());
    if (!autorizado && user.email) {
      const empleados = await base44.asServiceRole.entities.Empleado.filter({ email: user.email });
      const empleado = empleados[0];
      autorizado = Boolean(empleado && empleado.activo !== false && PROFILES_ALLOWED.includes(empleado.perfil_acceso));
    }
    if (!autorizado) return Response.json({ error: 'Solo gerencia y administración pueden ver estos mensajes.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    if (body.action === 'mark_read') {
      const id = String(body.id || '').trim();
      if (!id) return Response.json({ error: 'Falta el mensaje que se marcará como leído.' }, { status: 400 });
      const contacto = await base44.asServiceRole.entities.ContactoWeb.get(id).catch((error) => error.status === 404 ? null : Promise.reject(error));
      if (!contacto) return Response.json({ error: 'No encontramos ese mensaje.' }, { status: 404 });
      await base44.asServiceRole.entities.ContactoWeb.update(id, { leido: true });
      const unreadCount = await base44.asServiceRole.entities.ContactoWeb.count({ leido: false });
      return Response.json({ success: true, leido: true, unread_count: unreadCount });
    }

    if (body.action !== 'list') return Response.json({ error: 'Acción no válida.' }, { status: 400 });
    const options: { sort: string; limit: number; cursor?: string } = { sort: '-created_date', limit: 50 };
    if (typeof body.cursor === 'string' && body.cursor) options.cursor = body.cursor;
    const [page, unreadCount] = await Promise.all([
      base44.asServiceRole.entities.ContactoWeb.filter({}, options),
      base44.asServiceRole.entities.ContactoWeb.count({ leido: false }),
    ]);
    return Response.json({ items: page.items, next_cursor: page.next_cursor, has_more: page.has_more, unread_count: unreadCount });
  } catch {
    return Response.json({ error: 'No se pudieron procesar los mensajes. Intenta de nuevo.' }, { status: 500 });
  }
}