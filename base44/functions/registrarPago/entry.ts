import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const METODOS = ['Efectivo', 'Transferencia', 'Tarjeta Débito', 'Tarjeta Crédito', 'Cheque'];
const cents = (value) => Math.round((Number(value) || 0) * 100);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const facturaId = String(body.factura_id || '').trim();
    const idempotenciaId = String(body.idempotencia_id || '').trim();
    const monto = Number(body.monto);
    const metodoPago = String(body.metodo_pago || '');
    if (!facturaId || !idempotenciaId || !Number.isFinite(monto) || monto <= 0 || !METODOS.includes(metodoPago)) {
      return Response.json({ error: 'Datos de pago inválidos.' }, { status: 400 });
    }
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(idempotenciaId)) {
      return Response.json({ error: 'Identificador de pago inválido.' }, { status: 400 });
    }

    const perfil = await base44.functions.invoke('tallerAccess', { action: 'perfil' })
      .then((result) => result.data)
      .catch(() => null);
    if (!perfil || !['gerencia', 'admin'].includes(perfil.perfil_acceso) || (perfil.perfil_acceso === 'admin' && perfil.capacidades?.registrar_cobros === false)) {
      return Response.json({ error: 'No tienes permiso para registrar cobros.' }, { status: 403 });
    }

    const db = base44.asServiceRole.entities;
    const ahora = new Date();
    const tokenBloqueo = crypto.randomUUID();
    const venceBloqueo = new Date(ahora.getTime() + 30000).toISOString();
    let factura = await db.Factura.get(facturaId).catch((error) => (error.status === 404 ? null : Promise.reject(error)));
    if (!factura) return Response.json({ error: 'No se encontró la factura.' }, { status: 404 });
    if (factura.pago_lock_id !== facturaId) {
      await db.Factura.update(facturaId, { pago_lock_id: facturaId });
      factura = await db.Factura.get(facturaId);
    }
    await db.Factura.updateMany({
      pago_lock_id: facturaId,
      $or: [
        { pago_lock_hasta: { $exists: false } },
        { pago_lock_hasta: { $lt: ahora.toISOString() } },
      ],
    }, { $set: { pago_lock_token: tokenBloqueo, pago_lock_hasta: venceBloqueo } });
    factura = await db.Factura.get(facturaId);
    if (factura.pago_lock_token !== tokenBloqueo) {
      return Response.json({ error: 'Otro cobro está procesándose para esta factura. Espera y vuelve a consultar.' }, { status: 409 });
    }

    try {
      const pagosConMismaClave = await db.Pago.filter({ factura_id: facturaId, idempotencia_id: idempotenciaId });
      if (pagosConMismaClave.length) return Response.json({ pago: pagosConMismaClave[0], repetido: true });
      if (factura.estado_pago === 'Cerrada') {
        return Response.json({ error: 'No se pueden registrar pagos en una factura anulada.' }, { status: 409 });
      }

      const pagos = await db.Pago.filter({ factura_id: facturaId });
      const totalPagosRegistrados = pagos.reduce((sum, pago) => sum + cents(pago.monto), 0);
      const montoPagadoFactura = cents(factura.monto_pagado);
      if (totalPagosRegistrados > montoPagadoFactura + 1) {
        return Response.json({ error: 'Los pagos registrados no coinciden con el total de la factura. Se requiere revisar el historial antes de cobrar más.' }, { status: 409 });
      }

      const totalFactura = cents(factura.total);
      const pagadoActual = Math.max(totalPagosRegistrados, montoPagadoFactura);
      const saldoActual = Math.max(0, totalFactura - pagadoActual);
      const montoCentavos = cents(monto);
      if (saldoActual <= 0) {
        return Response.json({ error: 'Esta factura ya está pagada. No se puede registrar otro cobro.' }, { status: 409 });
      }
      if (montoCentavos > saldoActual) {
        return Response.json({ error: `El pago supera el saldo pendiente de $${(saldoActual / 100).toFixed(2)}.` }, { status: 409 });
      }

      const pago = await db.Pago.create({
        factura_id: facturaId,
        idempotencia_id: idempotenciaId,
        monto: montoCentavos / 100,
        metodo_pago: metodoPago,
        referencia: String(body.referencia || '').slice(0, 200),
        fecha_pago: String(body.fecha_pago || new Date().toISOString()).slice(0, 40),
        recibido_por: String(body.recibido_por || user.full_name || user.email).slice(0, 120),
        notas: String(body.notas || '').slice(0, 1000),
      });

      const nuevoPagado = pagadoActual + montoCentavos;
      const nuevoSaldo = Math.max(0, totalFactura - nuevoPagado);
      const nuevoEstado = nuevoSaldo === 0 ? 'Pagada' : 'Parcial';
      await db.Factura.update(facturaId, {
        monto_pagado: nuevoPagado / 100,
        saldo_pendiente: nuevoSaldo / 100,
        estado_pago: nuevoEstado,
      });

      if (factura.expediente_id) {
        const facturasExpediente = (await db.Factura.filter({ expediente_id: factura.expediente_id }))
          .filter((item) => item.estado_pago !== 'Cerrada');
        const totalCobrado = facturasExpediente.reduce((sum, item) => sum + cents(item.total), 0);
        const totalPagado = facturasExpediente.reduce((sum, item) => sum + cents(item.monto_pagado), 0);
        const expediente = await db.Expediente.get(factura.expediente_id).catch((error) => (error.status === 404 ? null : Promise.reject(error)));
        if (expediente) {
          const sync = { total_pagado: totalPagado / 100, saldo_pendiente: Math.max(0, totalCobrado - totalPagado) / 100 };
          if (perfil.perfil_acceso === 'gerencia') sync.total_cobrado = totalCobrado / 100;
          if (perfil?.perfil_acceso === 'admin' && perfil.capacidades?.registrar_cobros !== false) sync.total_cobrado = totalCobrado / 100;
          await db.Expediente.update(factura.expediente_id, sync);
        }
      }

      return Response.json({ pago, saldo_pendiente: nuevoSaldo / 100 });
    } finally {
      await db.Factura.updateMany({ pago_lock_id: facturaId, pago_lock_token: tokenBloqueo }, {
        $unset: { pago_lock_token: '', pago_lock_hasta: '' },
      });
    }
  } catch (error) {
    return Response.json({ error: error.message || 'No se pudo registrar el pago.' }, { status: error.status || 500 });
  }
}