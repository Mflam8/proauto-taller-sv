import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const empty = {
  cliente_id: "", vehiculo_id: "", motivo_visita: "", sintomas_cliente: "",
  indicaciones_cliente: "", fecha_promesa_entrega: "", kilometraje_entrada: "",
  llaves_cantidad: 1, llaves_observaciones: "", observaciones: ""
};

export default function ExpedienteForm({ open, onClose, clientes, vehiculos, onSave, expediente }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (expediente) setForm({ ...expediente });
    else setForm(empty);
  }, [expediente, open]);

  const vehiculosCliente = vehiculos.filter(v => v.cliente_id === form.cliente_id);

  const handleSave = async () => {
    if (!form.cliente_id || !form.vehiculo_id || !form.motivo_visita) return;
    setSaving(true);
    const now = new Date().toISOString();
    const data = {
      ...form,
      fecha_ingreso: now,
      estado_interno: "Recibido",
      estado_cliente: "En revisión",
      numero_expediente: `EXP-${Date.now().toString().slice(-8)}`,
    };
    if (expediente) {
      await base44.entities.Expediente.update(expediente.id, form);
    } else {
      await base44.entities.Expediente.create(data);
    }
    setSaving(false);
    onSave();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expediente ? "Editar Expediente" : "Nuevo Expediente"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Cliente *</Label>
            <Select value={form.cliente_id} onValueChange={v => set("cliente_id", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
              <SelectContent>
                {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre_completo} — {c.telefono}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Vehículo *</Label>
            <Select value={form.vehiculo_id} onValueChange={v => set("vehiculo_id", v)} disabled={!form.cliente_id}>
              <SelectTrigger><SelectValue placeholder={form.cliente_id ? "Seleccionar vehículo..." : "Primero selecciona cliente"} /></SelectTrigger>
              <SelectContent>
                {vehiculosCliente.map(v => <SelectItem key={v.id} value={v.id}>{v.marca} {v.modelo} · {v.placa}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.cliente_id && vehiculosCliente.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Este cliente no tiene vehículos registrados aún.</p>
            )}
          </div>
          <div>
            <Label>Motivo de visita *</Label>
            <Input value={form.motivo_visita} onChange={e => set("motivo_visita", e.target.value)} placeholder="Ej: Mantenimiento, Frenos, Diagnóstico..." />
          </div>
          <div>
            <Label>Síntomas reportados por el cliente</Label>
            <Textarea value={form.sintomas_cliente} onChange={e => set("sintomas_cliente", e.target.value)} rows={2} placeholder="¿Qué siente el cliente en el vehículo?" />
          </div>
          <div>
            <Label>Indicaciones del cliente</Label>
            <Textarea value={form.indicaciones_cliente} onChange={e => set("indicaciones_cliente", e.target.value)} rows={2} placeholder="Instrucciones especiales, preferencias..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kilometraje de entrada</Label>
              <Input type="number" value={form.kilometraje_entrada} onChange={e => set("kilometraje_entrada", e.target.value)} />
            </div>
            <div>
              <Label>Fecha promesa entrega</Label>
              <Input type="datetime-local" value={form.fecha_promesa_entrega} onChange={e => set("fecha_promesa_entrega", e.target.value)} />
            </div>
            <div>
              <Label>Cantidad de llaves</Label>
              <Input type="number" value={form.llaves_cantidad} onChange={e => set("llaves_cantidad", Number(e.target.value))} min={0} />
            </div>
          </div>
          <div>
            <Label>Observaciones</Label>
            <Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} rows={2} />
          </div>
          <Button className="w-full bg-[#E31E24] hover:bg-[#B71C1C]" onClick={handleSave} disabled={saving || !form.cliente_id || !form.vehiculo_id || !form.motivo_visita}>
            {saving ? "Guardando..." : expediente ? "Guardar Cambios" : "Abrir Expediente"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}