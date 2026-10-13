import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Asigna el rol de la app según la ficha del empleado (campo rol_sistema).
// Se ejecuta automáticamente al registrarse o iniciar sesión (workflow Sincronizar Rol Empleado)
// y también desde la ficha de empleados al guardar un cambio de rol.
// Nunca asigna el rol "admin": las cuentas administradoras se protegen aparte.
const ROL_SISTEMA_A_ROL = {
  'Técnico': 'tecnico',
  'Auxiliar de Pintura': 'tecnico',
  'Jefe de Taller': 'jefe_taller',
  'Sin acceso': 'user',
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Correo objetivo: el enviado en el payload (workflow / ficha de empleados),
    // o el de la sesión como respaldo.
    let email = null;
    const body = await req.json().catch(() => ({}));
    if (body.email) email = String(body.email).toLowerCase();
    if (!email) {
      try {
        const session = await base44.auth.me();
        if (session?.email) email = String(session.email).toLowerCase();
      } catch (e) {
        // Sin sesión (invocación desde workflow): continuar
      }
    }
    if (!email) return Response.json({ ok: false, error: 'Sin correo para sincronizar' }, { status: 400 });

    const empleados = await base44.asServiceRole.entities.Empleado.filter({ email });
    const empleado = empleados[0];

    let rol = 'user';
    if (empleado && empleado.activo !== false) {
      rol = ROL_SISTEMA_A_ROL[empleado.rol_sistema] || 'user';
    }

    const users = await base44.asServiceRole.entities.User.filter({ email });
    const appUser = users[0];
    if (appUser && appUser.role !== rol && appUser.role !== 'admin') {
      await base44.asServiceRole.entities.User.update(appUser.id, { role: rol });
    }

    return Response.json({ ok: true, email, rol });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}