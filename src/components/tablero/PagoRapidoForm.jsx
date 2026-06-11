import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, DollarSign } from "lucide-react";

export default function PagoRapidoForm({ onSave, onCancel, facturas = [] }) {
  const [formData, setFormData] = useState({
    factura_id: "",
    monto: "",
    metodo_pago: "Efectivo",
    referencia: "",
    fecha_pago: new Date().toISOString(),
    recibido_por: "",
    notas: "",
  });
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) setFormData(p => ({ ...p, recibido_por: u.full_name || "" }));
    });
  }, []);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Pago.create(data),
    onSuccess: () => {
      qc.invalidateQueries(["pagos-tablero"]);
      if (onSave) onSave();
    },
  });

  const handleChange = (field, value) => setFormData(p => ({ ...p, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      alert("Ingresa un monto válido");
      return;
    }
    mutation.mutate({
      ...formData,
      monto: parseFloat(formData.monto),
      fecha_pago: new Date().toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-semibold text-gray-700">Factura (opcional)</Label>
          <Select value={formData.factura_id} onValueChange={v => handleChange("factura_id", v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Seleccionar factura..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Sin factura</SelectItem>
              {facturas.map(f => (
                <SelectItem key={f.id} value={f.id}>
                  {f.numero_factura || `FAC-${f.id.slice(-6).toUpperCase()}`} — ${(f.total || 0).toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-semibold text-gray-700">Monto *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.monto}
              onChange={e => handleChange("monto", e.target.value)}
              required
              className="pl-9 h-10"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-semibold text-gray-700">Método de pago *</Label>
          <Select value={formData.metodo_pago} onValueChange={v => handleChange("metodo_pago", v)}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Efectivo">💵 Efectivo</SelectItem>
              <SelectItem value="Transferencia">🏦 Transferencia</SelectItem>
              <SelectItem value="Tarjeta Débito">💳 Tarjeta Débito</SelectItem>
              <SelectItem value="Tarjeta Crédito">💳 Tarjeta Crédito</SelectItem>
              <SelectItem value="Cheque">📝 Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-semibold text-gray-700">Referencia / Remesa</Label>
          <Input
            value={formData.referencia}
            onChange={e => handleChange("referencia", e.target.value)}
            placeholder="Ej: 1234567890"
            className="h-10"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-semibold text-gray-700">Recibido por</Label>
        <Input
          value={formData.recibido_por}
          onChange={e => handleChange("recibido_por", e.target.value)}
          placeholder="Nombre"
          className="h-10"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-semibold text-gray-700">Notas / Concepto</Label>
        <Textarea
          value={formData.notas}
          onChange={e => handleChange("notas", e.target.value)}
          rows={2}
          placeholder="Trabajo realizado, observaciones..."
          className="resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Save className="w-4 h-4" />
          {mutation.isPending ? "Guardando..." : "Registrar pago"}
        </Button>
      </div>
    </form>
  );
}