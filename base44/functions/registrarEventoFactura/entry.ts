import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

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
    const factura = body.factura || {};
    if (!factura.id) {
      return Response.json({ error: 'factura.id es requerido' }, { status: 400 });
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
      cliente_nombre: String(factura.cliente_nombre || ''),
      vehiculo_desc: String(factura.vehiculo_desc || ''),
      expediente_id: String(factura.expediente_id || ''),
      monto_total: Number(factura.monto_total) || 0,
      usuario_email: user.email || '',
      usuario_nombre: user.full_name || '',
      fecha_evento: new Date().toISOString(),
    });

    return Response.json({ ok: true, numero_control: registro.numero_control });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}