import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const OWNERS = ["mayaflamenco89@gmail.com", "proautotallersv@gmail.com"];
const LEGACY_ADMIN = ["jefe_taller", "recepcion_cobros"];
const esPerfilAdmin = (p: string) => p === "admin" || LEGACY_ADMIN.includes(p);
const normalize = (s: any) => String(s || "").trim().toLowerCase();

// Capacidad efectiva: el interruptor individual manda; si no se definió, queda habilitada por el perfil Admin.
function capOk(caps: any, key: string) {
  if (caps && typeof caps === "object" && Object.hasOwn(caps, key)) return caps[key] === true;
  return true;
}

// Gerencia siempre; perfil Admin solo con la capacidad que corresponde al evento.
async function puedeRegistrar(base44: any, user: any, evento: string) {
  const email = normalize(user.email);
  if (OWNERS.includes(email)) return true;
  const empleados = await base44.asServiceRole.entities.Empleado.list('-created_date', 500);
  const matches = empleados.filter((e: any) => normalize(e.email) === email);
  if (matches.length !== 1 || matches[0].activo !== true || !esPerfilAdmin(matches[0].perfil_acceso)) return false;
  return capOk(matches[0].capacidades, evento === 'Creación' ? 'crear_facturas' : 'imprimir_facturas');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const evento = body.evento;
    if (evento !== 'Creación' && evento !== 'Impresión') {
      return Response.json({ error: 'Evento inválido. Debe ser "Creación" o "Impresión".' }, { status: 400 });
    }
    const facturaId = String(body.factura?.id || '').trim();
    if (!facturaId) {
      return Response.json({ error: 'factura.id es requerido' }, { status: 400 });
    }

    if (!(await puedeRegistrar(base44, user, evento))) {
      return Response.json({ error: 'No tienes permiso para registrar este evento.' }, { status: 403 });
    }

    // El contenido del evento se toma de la factura guardada, nunca del cuerpo de la petición.
    const factura = await base44.asServiceRole.entities.Factura.get(facturaId).catch(() => null);
    if (!factura) {
      return Response.json({ error: 'La factura no existe.' }, { status: 404 });
    }

    let clienteNombre = '';
    if (factura.cliente_id) {
      const cliente = await base44.asServiceRole.entities.Cliente.get(factura.cliente_id).catch(() => null);
      clienteNombre = cliente?.nombre_completo || '';
    }
    let vehiculoDesc = '';
    if (factura.vehiculo_id) {
      const vehiculo = await base44.asServiceRole.entities.Vehiculo.get(factura.vehiculo_id).catch(() => null);
      if (vehiculo) vehiculoDesc = `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim();
    }

    // Buscar el mayor número de control en los últimos registros para continuar la secuencia
    const ultimos = await base44.asServiceRole.entities.ControlFactura.list('-created_date', 500);
    const year = new Date().getFullYear();
    let maxSeq = 0;
    for (const r of ultimos) {
      const match = (r.numero_control || '').match(/^CT-(\d{4})-(\d+)$/);
      if (match && parseInt(match[1], 10) === year) {
        const seq = parseInt(match[2], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    }

    const numeroControl = `CT-${year}-${String(maxSeq + 1).padStart(6, '0')}`;

    const registro = await base44.asServiceRole.entities.ControlFactura.create({
      numero_control: numeroControl,
      evento,
      factura_id: factura.id,
      numero_factura: String(factura.numero_factura || ''),
      cliente_nombre: String(clienteNombre),
      vehiculo_desc: String(vehiculoDesc),
      expediente_id: String(factura.expediente_id || ''),
      monto_total: Number(factura.total) || 0,
      usuario_email: user.email || '',
      usuario_nombre: user.full_name || '',
      fecha_evento: new Date().toISOString(),
    });

    return Response.json({ ok: true, numero_control: registro.numero_control });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}