import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Asigna el rol de la app según la ficha del empleado (campo perfil_acceso).
// Se ejecuta automáticamente al registrarse o iniciar sesión (workflow Sincronizar Rol Empleado)
// y también desde la ficha de empleados al guardar un cambio de perfil.
// Nunca asigna el rol "admin": las cuentas administradoras se protegen aparte.
const PERFIL_A_ROL = {
  'admin': 'user',
  'tecnico': 'tecnico',
  'pintura': 'tecnico',
  'jefe_taller': 'jefe_taller',
  'recepcion_cobros': 'user',
  'sin_acceso': 'user',
};

// Cuentas de gerencia: las únicas que pueden sincronizar el rol de otra persona desde la app.
const CORREOS_GERENCIA = ['mayaflamenco89@gmail.com', 'proautotallersv@gmail.com'];
const PERFILES_ADMIN = ['admin', 'jefe_taller', 'recepcion_cobros'];
const normalizar = (v) => String(v || '').trim().toLowerCase();

// Perfil Admin activo con la capacidad de gestionar empleados habilitada.
function puedeSincronizarOtros(empleado) {
  if (!empleado || empleado.activo !== true) return false;
  if (!PERFILES_ADMIN.includes(empleado.perfil_acceso)) return false;
  const caps = empleado.capacidades;
  if (caps && typeof caps === 'object' && Object.hasOwn(caps, 'gestionar_empleados')) return caps.gestionar_empleados === true;
  return true;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const session = await base44.auth.me().catch((e) => (e && (e.status === 401 || e.status === 403) ? null : Promise.reject(e)));

    let email = null;

    if (session?.email) {
      // Con sesión iniciada solo se sincroniza la propia cuenta, salvo gerencia
      // o un perfil Admin con permiso de empleados.
      const propio = normalizar(session.email);
      const solicitado = normalizar(body.email);
      if (!solicitado || solicitado === propio) {
        email = propio;
      } else {
        let autorizado = CORREOS_GERENCIA.includes(propio);
        if (!autorizado) {
          const fichas = await base44.asServiceRole.entities.Empleado.filter({ email: propio });
          autorizado = puedeSincronizarOtros(fichas[0]);
        }
        if (!autorizado) return Response.json({ error: 'No tienes permiso para esta acción.' }, { status: 403 });
        email = solicitado;
      }
    } else {
      // Invocación automática del registro/inicio de sesión: exige el identificador de la
      // cuenta que entrega el evento, así un tercero no puede elegir el correo a sincronizar.
      const objetivo = normalizar(body.email);
      const userId = String(body.user_id || '');
      if (!objetivo || !userId) return Response.json({ error: 'Solicitud inválida.' }, { status: 400 });
      const usuarios = await base44.asServiceRole.entities.User.filter({ email: objetivo });
      const cuenta = usuarios[0];
      if (!cuenta || cuenta.id !== userId) return Response.json({ error: 'Solicitud inválida.' }, { status: 400 });
      email = objetivo;
    }

    const empleados = await base44.asServiceRole.entities.Empleado.filter({ email });
    const empleado = empleados[0];

    let rol = 'user';
    if (empleado && empleado.activo !== false) {
      rol = PERFIL_A_ROL[empleado.perfil_acceso] || 'user';
    }

    const users = await base44.asServiceRole.entities.User.filter({ email });
    const appUser = users[0];
    if (appUser && appUser.role !== rol && appUser.role !== 'admin') {
      await base44.asServiceRole.entities.User.update(appUser.id, { role: rol });
    }

    // Respuesta genérica: no revela si el correo pertenece a un empleado ni qué perfil tiene.
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}