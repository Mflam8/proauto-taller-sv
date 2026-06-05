import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CATEGORIAS = ["Repuesto", "Insumo", "Herramienta", "Transporte", "Otro"];

const emptyMovimiento = {
  concepto: "", tipo: "Gasto", categoria: "Repuesto",
  monto: "", proveedor: "", notas: "", registrado_por: ""
};

export default function CajaChicaTab({ expediente }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyMovimiento);
  const [saving, setSaving] = useState(false);

  const { data: movimientos = [], refetch } = useQuery({
    queryKey: ["caja", expediente.id],
    queryFn: () => base44.entities.CajaChica.filter({ expediente_id: expediente.id }),
    enabled: !!expediente.id,
  });

  const handleSave = async () => {
    if (!form.concepto || !form.monto) return;
    setSaving(true);
    await base44.entities.CajaChica.create({
      ...form,
      expediente_id: expediente.id,
      monto: parseFloat(form.monto),
      fecha: new Date().toISOString(),
    });
    qc.invalidateQueries(["caja", expediente.id]);
    setForm(emptyMovimiento);
    setShowForm(false);
    setSaving(false);
    refetch();
  };

  const handleDelete = async (m) => {
    await base44.entities.CajaChica.delete(m.id);
    refetch();
  };

  const totalGastos = movimientos.filter(m => m.tipo === "Gasto").reduce((s, m) => s + (m.monto || 0), 0);
  const totalIngresos = movimientos.filter(m => m.tipo === "Ingreso").reduce((s, m) => s + (m.monto || 0), 0);
  const balance = totalIngresos - totalGastos;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">Caja Chica</h3>
          <p className="text-xs text-gray-500">{movimientos.length} movimiento(s)</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-[#E31E24] hover:bg-[#B71C1C] gap-1 text-xs">
          <Plus className="w-3 h-3" /> Registrar
        </Button>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <TrendingDown className="w-4 h-4 text-red-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Gastos</p>
          <p className="font-bold text-red-600">${totalGastos.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Ingresos</p>
          <p className="font-bold text-green-600">${totalIngresos.toFixed(2)}</p>
        </div>
        <div className={`border rounded-xl p-3 text-center ${balance >= 0 ? "bg-blue-50 border-blue-100" : "bg-orange-50 border-orange-100"}`}>
          <DollarSign className="w-4 h-4 text-gray-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Balance</p>
          <p className={`font-bold ${balance >= 0 ? "text-blue-700" : "text-orange-600"}`}>${balance.toFixed(2)}</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3 border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Concepto *</label>
              <Input placeholder="Ej: Compra de filtro de aceite..." value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo</label>
              <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gasto">Gasto</SelectItem>
                  <SelectItem value="Ingreso">Ingreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Categoría</label>
              <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Monto ($) *</label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Proveedor</label>
              <Input placeholder="Nombre del proveedor..." value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Registrado por</label>
              <Input placeholder="Tu nombre..." value={form.registrado_por} onChange={e => setForm({ ...form, registrado_por: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 pt-1 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-[#E31E24] hover:bg-[#B71C1C]">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {movimientos.length === 0 && !showForm && (
          <div className="text-center py-10 text-gray-400">
            <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay movimientos registrados</p>
          </div>
        )}
        {movimientos.map(m => (
          <div key={m.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m.tipo === "Gasto" ? "bg-red-100" : "bg-green-100"}`}>
              {m.tipo === "Gasto" ? <TrendingDown className="w-4 h-4 text-red-600" /> : <TrendingUp className="w-4 h-4 text-green-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-gray-900">{m.concepto}</span>
                <Badge className="text-xs bg-gray-200 text-gray-700">{m.categoria}</Badge>
              </div>
              {m.proveedor && <p className="text-xs text-gray-500">Proveedor: {m.proveedor}</p>}
              {m.registrado_por && <p className="text-xs text-gray-500">Por: {m.registrado_por}</p>}
              {m.fecha && <p className="text-xs text-gray-400">{format(new Date(m.fecha), "dd MMM yyyy HH:mm", { locale: es })}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`font-bold text-sm ${m.tipo === "Gasto" ? "text-red-600" : "text-green-600"}`}>
                {m.tipo === "Gasto" ? "-" : "+"}${(m.monto || 0).toFixed(2)}
              </span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(m)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}