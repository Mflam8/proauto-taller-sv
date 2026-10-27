import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { siguienteNumeroFactura } from '../../shared/numeroFactura.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const datos = body.factura || {};
    const expedienteId = datos.expediente_id;
    const items = Array.isArray(datos.items) ? datos.items : [];

    if (!expedienteId) {
      return Response.json({ error: 'Falta el expediente.' }, { status: 400 });
    }
    if (!items.length) {
      return Response.json({ error: 'La factura no tiene ítems.' }, { status: 400 });
    }

    // Permisos: mismo criterio que el resto del sistema (perfil + capacidad de facturar)
    const perfil = await base44.functions.invoke('tallerAccess', { action: 'perfil' })
      .then((r) => r.data)
      .catch(() => null);
    if (!perfil || !['gerencia', 'admin'].includes(perfil.perfil_acceso)) {
      return Response.json({ error: 'No autorizado para facturar.' }, { status: 403 });
    }
    if (perfil.perfil_acceso === 'admin' && perfil.capacidades?.crear_facturas === false) {
      return Response.json({ error: 'No tiene permiso para crear facturas.' }, { status: 403 });
    }

    // Una sola factura por expediente: evita duplicados por doble clic o reintentos
    // Las facturas anuladas (Cerrada) no cuentan: el expediente puede facturarse de nuevo
    const existentes = await base44.asServiceRole.entities.Factura.filter({ expediente_id: expedienteId });
    const activa = (existentes || []).find((f) => f.estado_pago !== 'Cerrada');
    if (activa) {
      return Response.json({
        error: `Este expediente ya tiene la factura #${activa.numero_factura || activa.id.slice(0, 8)}.`,
        factura: activa,
      }, { status: 409 });
    }

    let numero = await siguienteNumeroFactura(base44);
    const ocupado = await base44.asServiceRole.entities.Factura.filter({ numero_factura: numero });
    if (ocupado && ocupado.length) numero = String(Number(numero) + 1);

    const total = Number(datos.total) || 0;
    const factura = await base44.asServiceRole.entities.Factura.create({
      ...datos,
      numero_factura: numero,
      estado_pago: 'Pendiente',
      monto_pagado: 0,
      saldo_pendiente: total,
    });

    const expediente = await base44.asServiceRole.entities.Expediente.get(expedienteId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!expediente) {
      return Response.json({ error: 'Expediente no disponible.' }, { status: 404 });
    }

    await base44.asServiceRole.entities.Expediente.update(expedienteId, {
      total_cobrado: total,
      saldo_pendiente: total - (expediente.total_pagado || 0),
      factura_generada: true,
    });

    return Response.json({ factura });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}