// Calcula el siguiente número de factura a partir del mayor número existente.
export async function siguienteNumeroFactura(base44) {
  let facturas = [];
  let skip = 0;
  const limit = 500;
  let hasMore = true;

  while (hasMore) {
    const batch = await base44.asServiceRole.entities.Factura.list('-created_date', limit, skip);
    if (!batch || !batch.length) break;
    facturas = facturas.concat(batch);
    hasMore = batch.length === limit;
    skip += limit;
  }

  let maxNumber = 0;
  for (const f of facturas) {
    const match = String(f.numero_factura || '').match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  }

  return String(maxNumber + 1);
}