import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all facturas to find the highest invoice number
    let allFacturas = [];
    let skip = 0;
    const limit = 500;
    let hasMore = true;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.Factura.list('-created_date', limit, skip);
      allFacturas = allFacturas.concat(batch);
      hasMore = batch.length === limit;
      skip += limit;
    }

    // Extract numeric parts from numero_factura and find the max
    let maxNumber = 0;
    for (const f of allFacturas) {
      const numStr = f.numero_factura || '';
      const match = numStr.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    const nextNumber = maxNumber + 1;
    const nextFacturaNumber = String(nextNumber);

    return Response.json({ numero_factura: nextFacturaNumber });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});