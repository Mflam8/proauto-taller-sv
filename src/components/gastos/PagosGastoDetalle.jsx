import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const fmtFecha = (s) => {
  if (!s) return "";
  const [f] = s.split("T");
  return f;
};

export default function PagosGastoDetalle({ gasto, open, onClose }) {
  if (!gasto) return null;
  const pagos = Array.isArray(gasto.pagos) ? gasto.pagos : [];
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagos de: {gasto.concepto}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {pagos.length === 0 && <p className="text-sm text-gray-500">Sin pagos registrados.</p>}
          {pagos.map((p, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{fmtFecha(p.fecha_pago)}</p>
                <p className="text-xs text-gray-500">{p.metodo_pago || ""}{p.referencia ? ` · ${p.referencia}` : ""}</p>
              </div>
              <span className="font-semibold">${Number(p.monto).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-semibold">
            <span>Pagado</span>
            <span>${Number(gasto.monto_pagado || 0).toFixed(2)} / ${Number(gasto.monto || 0).toFixed(2)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}