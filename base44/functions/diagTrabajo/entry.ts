import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

function errInfo(e: any) {
  return {
    message: e?.message ?? String(e),
    status: e?.status ?? e?.response?.status ?? null,
    data: e?.data ?? e?.response?.data ?? null,
  };
}

export default async function (req: any) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const patron = body.patron || 'NELSON';

  const clientes = await base44.asServiceRole.entities.Cliente.filter({
    nombre_completo: { $regex: patron, $options: 'i' },
  });

  const out: any = { clientes: clientes.map((c: any) => ({ id: c.id, nombre: c.nombre_completo })), expedientes: [], trabajoPrueba: null, actualizarTotales: null };

  out.totalExpedientes = await base44.asServiceRole.entities.Expediente.count();
  const recientes = await base44.asServiceRole.entities.Cliente.list({ sort: '-created_date', limit: 5 });
  out.clientesRecientes = (recientes.items ?? []).map((c: any) => c.nombre_completo);

  for (const c of clientes) {
    const exps = await base44.asServiceRole.entities.Expediente.filter({ cliente_id: c.id }, { sort: '-created_date', limit: 3 });
    for (const e of exps.items ?? []) {
      const sizeKb = Math.round(JSON.stringify(e).length / 1024);
      const firma = e.recepcion_cliente?.firma_data_url;
      out.expedientes.push({
        id: e.id,
        numero: e.numero_expediente,
        estado: e.estado_interno,
        sizeKb,
        firmaKb: firma ? Math.round(firma.length / 1024) : 0,
        fotos: Array.isArray(e.fotos) ? e.fotos.length : 0,
        total_cobrado: e.total_cobrado,
        tipo_total_cobrado: typeof e.total_cobrado,
        total_pagado: e.total_pagado,
        tipo_total_pagado: typeof e.total_pagado,
        factura_generada: e.factura_generada,
      });
    }
  }

  const objetivo = out.expedientes[0];
  if (!objetivo) return Response.json(out);

  const trabajos = await base44.asServiceRole.entities.TrabajoExpediente.filter({ expediente_id: objetivo.id });
  out.trabajosExistentes = (trabajos.items ?? []).map((t: any) => ({
    descripcion: t.descripcion,
    tipo: t.tipo,
    tipoDato: typeof t.subtotal,
    precioSugeridoDato: typeof t.precio_sugerido,
    cantidadDato: typeof t.cantidad,
  }));

  if (body.probarCreacion) {
    const payload = body.payload ?? {
      descripcion: 'BOMBA DE POWER STEERING (COMPLETA)',
      tipo: 'Repuesto',
      cantidad: 1,
      precio_unitario: 130,
      subtotal: 130,
      estado: 'Pendiente',
      aprobado_cliente: false,
      tecnico_nombre: 'LUIS GEOVANNI ARDON MEJIA',
      notas: '',
      catalogo_precio_id: '',
      precio_sugerido: 0,
      origen_precio: 'Manual',
      expediente_id: objetivo.id,
    };
    try {
      const creado = await base44.asServiceRole.entities.TrabajoExpediente.create({ ...payload, expediente_id: objetivo.id });
      out.trabajoPrueba = { ok: true, id: creado.id };
      await base44.asServiceRole.entities.TrabajoExpediente.delete(creado.id);
    } catch (e: any) {
      out.trabajoPrueba = { ok: false, error: errInfo(e), payload };
    }
  }

  if (body.probarTotales) {
    try {
      const total = 130;
      await base44.asServiceRole.entities.Expediente.update(objetivo.id, {
        total_cobrado: total,
        saldo_pendiente: total - (Number(objetivo.total_pagado) || 0),
      });
      out.actualizarTotales = { ok: true };
      await base44.asServiceRole.entities.Expediente.update(objetivo.id, {
        total_cobrado: objetivo.total_cobrado,
        saldo_pendiente: objetivo.total_cobrado - (Number(objetivo.total_pagado) || 0),
      });
    } catch (e: any) {
      out.actualizarTotales = { ok: false, error: errInfo(e) };
    }
  }

  return Response.json(out);
}