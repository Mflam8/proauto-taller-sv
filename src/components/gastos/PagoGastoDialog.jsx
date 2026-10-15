import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const METODOS = ["Efectivo", "Transferencia", "Tarjeta Débito", "Tarjeta Crédito", "Cheque"];

const aFecha = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function PagoGastoDialog({ gasto, open, onClose, onSaved }) {
  const [pago, setPago] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open && gasto) {
      setPago({
        monto: gasto.saldo_pendiente ?? "",
        fecha_pago: aFecha(new Date()),
        metodo_pago: "Efectivo",
        referencia: "",
      });
    }
  }, [open, gasto]);

  if (!gasto) return null;

  const guardar = async () => {
    const monto = Number(pago.monto);
    if (!monto || monto <= 0) return;
    setGuardando(true);
    try {
      const pagos = [...(Array.isArray(gasto.pagos) ? gasto.pagos : []), {
        fecha_pago: pago.fecha_pago,
        monto: Math.round(monto * 100) / 100,
        metodo_pago: pago.metodo_pago,
        referencia: pago.referencia.trim(),
      }];
      const monto_pagado = Math.round(((Number(gasto.monto_pagado) || 0) + monto) * 100) / 100;
      const saldo_pendiente = Math.max(0, Math.round(((Number(gasto.monto) || 0) - monto_pagado) * 100) / 100);
      await base44.entities.Gasto.update(gasto.id, {
        pagos,
        monto_pagado,
        saldo_pendiente,
        estado_pago: saldo_pendiente === 0 ? "Pagada" : "Parcial",
        metodo_pago: metodoAbono(gasto, pago),
      });
      onSaved?.();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  const metodoAbono = (g, p) => (g.forma_pago === "Contado" ? g.metodo_pago : p.metodo_pago);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago del gasto</DialogTitle>
        </DialogHeader>
        {pago && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {gasto.concepto} · Saldo pendiente: ${Number(gasto.saldo_pendiente).toFixed(2)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Monto ($)</Label>
                <Input type="number" min="0" step="0.01" value={pago.monto}
                  onChange={(e) => setPago({ ...pago, monto: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Fecha de pago</Label>
                <Input type="date" value={pago.fecha_pago}
                  onChange={(e) => setPago({ ...pago, fecha_pago: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Medio de pago</Label>
              <Select value={pago.metodo_pago} onValueChange={(v) => setPago({ ...pago, metodo_pago: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METODOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Referencia (opcional)</Label>
              <Input value={pago.referencia} onChange={(e) => setPago({ ...pago, referencia: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={onClose} disabled={guardando}>Cancelar</Button>
              <Button onClick={guardar} disabled={guardando || !Number(pago.monto)}>
                {guardando ? "Guardando…" : "Registrar pago"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}