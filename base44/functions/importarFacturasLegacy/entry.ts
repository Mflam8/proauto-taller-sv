import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Función de migración: importa facturas y pagos del sistema legacy (DBF)
 * con permisos de service-role (admin). Diseñada para ser invocada por
 * un agente externo (Codex) que envía los datos ya estructurados.
 *
 * Deduplicación: si ya existe un registro con el mismo legacy_invoice_id
 * (o legacy_payment_id para pagos), se omite — no se duplica.
 *
 * Payload esperado:
 * {
 *   facturas: [
 *     {
 *       numero_factura, cliente_id, vehiculo_id, expediente_id,
 *       items: [{ descripcion, cantidad, precio_unitario, subtotal }],
 *       subtotal, importe_neto, iva, total,
 *       estado_pago, monto_pagado, saldo_pendiente,
 *       fecha_emision, fecha_vencimiento, forma_pago,
 *       legacy_invoice_id, legacy_invoice_number, legacy_customer_id,
 *       legacy_job_id, legacy_series, legacy_raw_table
 *     }
 *   ],
 *   pagos: [
 *     {
 *       monto, metodo_pago, referencia, fecha_pago, recibido_por, notas,
 *       legacy_invoice_id,   // para vincular con la factura recién creada
 *       legacy_payment_id, legacy_customer_id, legacy_raw_table
 *     }
 *   ]
 * }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // --- Autenticación: solo admin puede migrar ---
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — se requiere rol admin' }, { status: 403 });
    }

    const body = await req.json();
    const facturasIn = Array.isArray(body.facturas) ? body.facturas : [];
    const pagosIn = Array.isArray(body.pagos) ? body.pagos : [];

    if (facturasIn.length === 0 && pagosIn.length === 0) {
      return Response.json({ error: 'No se recibieron facturas ni pagos' }, { status: 400 });
    }

    const summary = {
      facturas_creadas: 0,
      facturas_omitidas: 0,
      pagos_creados: 0,
      pagos_omitidos: 0,
      errors: [],
      mapa_legacy_to_id: {},
    };

    // =====================================================
    // 1) IMPORTAR FACTURAS
    // =====================================================
    // Recolectar legacy_invoice_ids para verificar duplicados en bloque
    const legacyIds = facturasIn
      .map(f => f.legacy_invoice_id)
      .filter(Boolean);

    const existentes = new Set();
    if (legacyIds.length > 0) {
      // Filtrar en lotes para no exceder límites de query
      for (let i = 0; i < legacyIds.length; i += 100) {
        const lote = legacyIds.slice(i, i + 100);
        const found = await base44.asServiceRole.entities.Factura.filter({
          legacy_invoice_id: { $in: lote }
        });
        for (const f of found) {
          if (f.legacy_invoice_id) existentes.add(f.legacy_invoice_id);
        }
      }
    }

    // Crear facturas en lotes (bulkCreate) — solo las no duplicadas
    const facturasParaCrear = [];
    for (const fac of facturasIn) {
      const lid = fac.legacy_invoice_id;
      if (lid && existentes.has(lid)) {
        summary.facturas_omitidas++;
        continue;
      }
      facturasParaCrear.push({
        numero_factura: fac.numero_factura || fac.legacy_invoice_number || "",
        expediente_id: fac.expediente_id || "",
        orden_trabajo_id: fac.orden_trabajo_id || "",
        cliente_id: fac.cliente_id || "",
        vehiculo_id: fac.vehiculo_id || "",
        forma_pago: fac.forma_pago || "Contado",
        items: Array.isArray(fac.items) ? fac.items : [],
        subtotal: Number(fac.subtotal) || 0,
        importe_neto: Number(fac.importe_neto) || 0,
        iva: Number(fac.iva) || 0,
        total: Number(fac.total) || 0,
        estado_pago: fac.estado_pago || "Pendiente",
        monto_pagado: Number(fac.monto_pagado) || 0,
        saldo_pendiente: Number(fac.saldo_pendiente) || 0,
        fecha_vencimiento: fac.fecha_vencimiento || null,
        fecha_emision: fac.fecha_emision || null,
        legacy_invoice_id: lid || "",
        legacy_invoice_number: fac.legacy_invoice_number || "",
        legacy_customer_id: fac.legacy_customer_id || "",
        legacy_job_id: fac.legacy_job_id || "",
        legacy_series: fac.legacy_series || "",
        legacy_raw_table: fac.legacy_raw_table || "",
      });
    }

    // bulkCreate en lotes de 100
    for (let i = 0; i < facturasParaCrear.length; i += 100) {
      const lote = facturasParaCrear.slice(i, i + 100);
      try {
        const creadas = await base44.asServiceRole.entities.Factura.bulkCreate(lote);
        for (const c of creadas) {
          summary.facturas_creadas++;
          if (c.legacy_invoice_id) {
            summary.mapa_legacy_to_id[c.legacy_invoice_id] = c.id;
          }
        }
      } catch (err) {
        summary.errors.push({ lote_facturas: i, error: err.message });
      }
    }

    // =====================================================
    // 2) IMPORTAR PAGOS
    // =====================================================
    const legacyPagoIds = pagosIn
      .map(p => p.legacy_payment_id)
      .filter(Boolean);

    const existentesPagos = new Set();
    if (legacyPagoIds.length > 0) {
      for (let i = 0; i < legacyPagoIds.length; i += 100) {
        const lote = legacyPagoIds.slice(i, i + 100);
        const found = await base44.asServiceRole.entities.Pago.filter({
          legacy_payment_id: { $in: lote }
        });
        for (const p of found) {
          if (p.legacy_payment_id) existentesPagos.add(p.legacy_payment_id);
        }
      }
    }

    const pagosParaCrear = [];
    for (const pago of pagosIn) {
      const lpid = pago.legacy_payment_id;
      if (lpid && existentesPagos.has(lpid)) {
        summary.pagos_omitidos++;
        continue;
      }
      // Vincular el pago a la factura recién creada (o existente) vía legacy_invoice_id
      let factura_id = pago.factura_id || "";
      if (!factura_id && pago.legacy_invoice_id) {
        factura_id = summary.mapa_legacy_to_id[pago.legacy_invoice_id] || "";
        // Si no estaba en el lote actual, buscar la factura existente
        if (!factura_id) {
          const facs = await base44.asServiceRole.entities.Factura.filter({
            legacy_invoice_id: pago.legacy_invoice_id
          }, '-created_date', 1);
          if (facs.length > 0) factura_id = facs[0].id;
        }
      }
      pagosParaCrear.push({
        factura_id: factura_id,
        monto: Number(pago.monto) || 0,
        metodo_pago: pago.metodo_pago || "Efectivo",
        referencia: pago.referencia || "",
        fecha_pago: pago.fecha_pago || null,
        recibido_por: pago.recibido_por || "",
        notas: pago.notas || "",
        legacy_payment_id: lpid || "",
        legacy_invoice_id: pago.legacy_invoice_id || "",
        legacy_customer_id: pago.legacy_customer_id || "",
        legacy_raw_table: pago.legacy_raw_table || "",
      });
    }

    for (let i = 0; i < pagosParaCrear.length; i += 100) {
      const lote = pagosParaCrear.slice(i, i + 100);
      try {
        const creados = await base44.asServiceRole.entities.Pago.bulkCreate(lote);
        summary.pagos_creados += creados.length;
      } catch (err) {
        summary.errors.push({ lote_pagos: i, error: err.message });
      }
    }

    return Response.json({ success: true, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});