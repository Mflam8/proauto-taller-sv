import React from "react";
import { format } from "date-fns";
import { DollarSign, CreditCard, Banknote, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const metodoBadge = {
  "Efectivo":       "bg-emerald-100 text-emerald-800",
  "Transferencia":  "bg-blue-100 text-blue-800",
  "Tarjeta Débito": "bg-purple-100 text-purple-800",
  "Tarjeta Crédito":"bg-violet-100 text-violet-800",
  "Cheque":         "bg-orange-100 text-orange-800",
};

const metodoIcon = {
  "Efectivo":       <Banknote className="w-3 h-3" />,
  "Transferencia":  <ArrowLeftRight className="w-3 h-3" />,
  "Tarjeta Débito": <CreditCard className="w-3 h-3" />,
  "Tarjeta Crédito":<CreditCard className="w-3 h-3" />,
  "Cheque":         <DollarSign className="w-3 h-3" />,
};

export default function PagosDia({ pagos, clienteMap, facturaMap, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
        Cargando pagos...
      </div>
    );
  }

  // Totales
  const total = pagos.reduce((s, p) => s + (p.monto || 0), 0);
  const porMetodo = pagos.reduce((acc, p) => {
    const m = p.metodo_pago || "Otro";
    acc[m] = (acc[m] || 0) + (p.monto || 0);
    return acc;
  }, {});

  if (pagos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-12 text-center text-gray-400">
          <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="font-medium">No hay pagos registrados hoy</p>
        </div>
        <TotalesPie total={0} porMetodo={{}} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hora</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Forma de pago</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Referencia</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Concepto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pagos.map((pago) => {
              const factura = facturaMap[pago.factura_id];
              const cliente = factura ? clienteMap[factura.cliente_id] : null;
              return (
                <tr key={pago.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {pago.fecha_pago
                      ? format(new Date(pago.fecha_pago), "HH:mm")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {cliente?.nombre_completo || pago.recibido_por || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    ${(pago.monto || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`${metodoBadge[pago.metodo_pago] || "bg-gray-100 text-gray-700"} flex items-center gap-1 w-fit text-xs`}>
                      {metodoIcon[pago.metodo_pago]}
                      {pago.metodo_pago || "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                    {pago.referencia || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {pago.notas || (factura ? `Factura #${factura.numero_factura || factura.id?.slice(-6).toUpperCase()}` : "—")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {pagos.map((pago) => {
          const factura = facturaMap[pago.factura_id];
          const cliente = factura ? clienteMap[factura.cliente_id] : null;
          return (
            <div key={pago.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{cliente?.nombre_completo || "—"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${metodoBadge[pago.metodo_pago] || "bg-gray-100 text-gray-700"} text-xs`}>
                    {pago.metodo_pago}
                  </Badge>
                  {pago.referencia && <span className="text-xs text-gray-400 font-mono">{pago.referencia}</span>}
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">${(pago.monto || 0).toFixed(2)}</p>
            </div>
          );
        })}
      </div>

      {/* Totales */}
      <TotalesPie total={total} porMetodo={porMetodo} />
    </div>
  );
}

function TotalesPie({ total, porMetodo }) {
  return (
    <div className="bg-gray-50 border-t border-gray-200 px-4 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {Object.entries(porMetodo).map(([metodo, monto]) => (
            <div key={metodo} className="flex items-center gap-1.5 text-sm text-gray-600">
              <span className="font-medium">{metodo}:</span>
              <span className="font-bold text-gray-900">${monto.toFixed(2)}</span>
            </div>
          ))}
          {Object.keys(porMetodo).length === 0 && (
            <span className="text-sm text-gray-400">Sin movimientos</span>
          )}
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span className="text-sm text-gray-600 font-medium">Total facturado:</span>
          <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}