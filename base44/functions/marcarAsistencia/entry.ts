import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Distancia en metros entre dos coordenadas (fórmula de Haversine)
function distanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 });

    if (!['admin', 'jefe_taller', 'tecnico'].includes(user.role)) {
      return Response.json({ error: 'Tu acceso a la app no permite marcar asistencia. Pide a gerencia que revise tu rol de empleado.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const tipo = body.tipo;
    if (tipo !== 'Entrada' && tipo !== 'Salida') {
      return Response.json({ error: 'Tipo de registro inválido' }, { status: 400 });
    }

    const latitud = Number(body.latitud);
    const longitud = Number(body.longitud);
    if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
      return Response.json({ error: 'No pudimos obtener tu ubicación. Permite el acceso a la ubicación en tu navegador.' }, { status: 400 });
    }

    const configs = await base44.asServiceRole.entities.ConfigTaller.list();
    const config = configs[0];
    if (!config || !Number.isFinite(Number(config.latitud)) || !Number.isFinite(Number(config.longitud))) {
      return Response.json({ error: 'La ubicación del taller aún no está configurada. Un administrador debe guardarla desde "Mi Taller".' }, { status: 400 });
    }

    const radio = Number(config.radio_metros) > 0 ? Number(config.radio_metros) : 150;
    const distancia = distanciaMetros(latitud, longitud, Number(config.latitud), Number(config.longitud));
    if (distancia > radio) {
      return Response.json({
        error: `Estás a ${Math.round(distancia)} m del taller. Solo puedes marcar tu asistencia estando en el taller.`,
        distancia: Math.round(distancia),
      }, { status: 403 });
    }

    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' });
    const email = String(user.email).toLowerCase();
    const registrosHoy = await base44.asServiceRole.entities.Asistencia.filter({ empleado_email: email, fecha_sv: hoy });
    const entrada = registrosHoy.find((r) => r.tipo === 'Entrada');
    const salida = registrosHoy.find((r) => r.tipo === 'Salida');

    if (tipo === 'Entrada' && entrada) {
      return Response.json({ error: 'Ya marcaste tu entrada hoy.', yaRegistrado: true }, { status: 400 });
    }
    if (tipo === 'Salida' && !entrada) {
      return Response.json({ error: 'Primero debes marcar tu entrada.' }, { status: 400 });
    }
    if (tipo === 'Salida' && salida) {
      return Response.json({ error: 'Ya marcaste tu salida hoy.', yaRegistrado: true }, { status: 400 });
    }

    const registro = await base44.asServiceRole.entities.Asistencia.create({
      empleado_email: email,
      empleado_nombre: user.full_name || email,
      tipo,
      fecha_hora: new Date().toISOString(),
      fecha_sv: hoy,
      latitud,
      longitud,
      distancia_metros: Math.round(distancia),
      verificado: true,
    });

    return Response.json({ ok: true, registro });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}