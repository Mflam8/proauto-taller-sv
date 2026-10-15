import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const CATEGORIAS_GASTO = ["Gasto de Taller", "Servicio del Local", "Suministros y Limpieza", "Otro"];
const METODOS = ["Efectivo", "Transferencia", "Tarjeta Débito", "Tarjeta Crédito", "Cheque"];

const aFecha = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const vacio = () => ({
  categoria: "Gasto de Taller",
  concepto: "",
  proveedor: "",
  monto: "",
  forma_pago: "Contado",
  metodo_pago: "Efectivo",
  numero_factura: "",
  fecha_compra: aFecha(new Date()),
  expediente_id: "",
  notas: "",
});

export default function GastoForm({ open, onClose, gasto, onSaved }) {
  const editando = !!gasto;
  const [form, setForm] = useState(vacio());
  const [guardando, setGuardando] = useState(false);
  const [expedientes, setExpedientes] = useState([]);

  useEffect(() => {
    if (open) {
      setForm(gasto ? {
        categoria: gasto.categoria || "Gasto de Taller",
        concepto: gasto.concepto || "",
        proveedor: gasto.proveedor || "",
        monto: gasto.monto ?? "",
        forma_pago: gasto.forma_pago || "Contado",
        metodo_pago: gasto.metodo_pago || "Efectivo",
        numero_factura: gasto.numero_factura || "",
        fecha_compra: (gasto.fecha_compra || "").slice(0, 10),
        expediente_id: gasto.expediente_id || "",
        notas: gasto.notas || "",
      } : vacio());
      base44.entities.Expediente.filter({}, "-created_date", 50)
        .then((p) => setExpedientes(Array.isArray(p) ? p : p.items || []))
        .catch(() => setExpedientes([]));
    }
  }, [open, gasto]);

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const valido = form.concepto.trim() && form.monto !== "" && Number(form.monto) > 0 && form.fecha_compra;

  const guardar = async () => {
    if (!valido) return;
    setGuardando(true);
    try {
      const monto = Math.round(Number(form.monto) * 100) / 100;
      let pagos = Array.isArray(gasto?.pagos) ? [...gasto.pagos] : [];
      let monto_pagado = Number(gasto?.monto_pagado) || 0;
      let saldo_pendiente = 0;
      let estado_pago = "Pagada";

      if (form.forma_pago === "Contado") {
        pagos = [{ fecha_pago: form.fecha_compra, monto, metodo_pago: form.metodo_pago, referencia: "Compra de contado" }];
        monto_pagado = monto;
      } else {
        saldo_pendiente = Math.max(0, Math.round((monto - monto_pagado) * 100) / 100);
        estado_pago = saldo_pendiente === 0 ? "Pagada" : monto_pagado > 0 ? "Parcial" : "Pendiente";
      }

      const data = {
        categoria: form.categoria,
        concepto: form.concepto.trim(),
        proveedor: form.proveedor.trim(),
        monto,
        forma_pago: form.forma_pago,
        metodo_pago: form.metodo_pago,
        numero_factura: form.numero_factura.trim(),
        fecha_compra: form.fecha_compra,
        expediente_id: form.expediente_id || "",
        notas: form.notas.trim(),
        pagos,
        monto_pagado,
        saldo_pendiente,
        estado_pago,
      };

      if (editando) await base44.entities.Gasto.update(gasto.id, data);
      else await base44.entities.Gasto.create(data);
      onSaved?.();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Categoría</Label>
              <Select value={form.categoria} onValueChange={(v) => set("categoria", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_GASTO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Fecha de compra / factura</Label>
              <Input type="date" value={form.fecha_compra} onChange={(e) => set("fecha_compra", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Concepto *</Label>
            <Input value={form.concepto} onChange={(e) => set("concepto", e.target.value)} placeholder="Ej: Pastillas de freno Toyota" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Proveedor</Label>
              <Input value={form.proveedor} onChange={(e) => set("proveedor", e.target.value)} placeholder="Ej: Super Repuestos" />
            </div>
            <div className="space-y-1">
              <Label>N° de factura / recibo</Label>
              <Input value={form.numero_factura} onChange={(e) => set("numero_factura", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Monto ($) *</Label>
              <Input type="number" min="0" step="0.01" value={form.monto} onChange={(e) => set("monto", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Forma de pago</Label>
              <Select value={form.forma_pago} onValueChange={(v) => set("forma_pago", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contado">Contado (se paga de inmediato)</SelectItem>
                  <SelectItem value="Crédito">Crédito (queda pendiente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.forma_pago === "Contado" && (
            <div className="space-y-1">
              <Label>Medio de pago</Label>
              <Select value={form.metodo_pago} onValueChange={(v) => set("metodo_pago", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METODOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label>Expediente del vehículo (opcional)</Label>
            <Select value={form.expediente_id || "ninguno"} onValueChange={(v) => set("expediente_id", v === "ninguno" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguno">Sin expediente</SelectItem>
                {expedientes.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.numero_expediente || e.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea rows={2} value={form.notas} onChange={(e) => set("notas", e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} disabled={guardando}>Cancelar</Button>
            <Button onClick={guardar} disabled={!valido || guardando}>
              {guardando ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}