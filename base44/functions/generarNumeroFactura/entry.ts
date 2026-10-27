import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { siguienteNumeroFactura } from '../../shared/numeroFactura.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const numero = await siguienteNumeroFactura(base44);
    return Response.json({ numero_factura: numero });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}