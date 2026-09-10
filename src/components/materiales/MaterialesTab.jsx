import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Trash2 } from "lucide-react";

const ORIGENES = ["Inventario del taller", "Compra para este vehículo", "Proporcionado por el cliente"];
const ESTADOS = ["Recibida", "Instalada", "No utilizada", "Devuelta"];
const emptyMaterial = {
  origen: "Inventario del taller", descripcion: "", numero_parte: "",
  cantidad: 1, estado: "Recibida", notas: ""
};

export default function MaterialesTab({ expediente, trabajos }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyMaterial);
  const [saving, setSaving] = useState(false);

  const { data: materiales = [], refetch } = useQuery({
    queryKey: ["materiales-trabajo", expediente.id],
    queryFn: () => base44.entities.MaterialTrabajo.filter({ expediente_id: expediente.id }),
    enabled: !!expediente.id,
  });

  const handleSave = async () => {
    if (!form.descripcion.trim()) return;
    setSaving(true);
    try {
      await base44.entities.MaterialTrabajo.create({
        ...form,
        expediente_id: expediente.id,
        cantidad: Number(form.cantidad) || 1,
        fecha_registro: new Date().toISOString(),
      });
      qc.invalidateQueries(["materiales-trabajo", expediente.id]);
      setForm(emptyMaterial);
      setShowForm(false);
      refetch();
    } catch (error) {
      alert("Error al guardar el material: " + (error.message || error));
    } finally {
      setSaving(false);
    }
  };

  const actualizarEstado = async (material, estado) => {
    await base44.entities.MaterialTrabajo.update(material.id, { estado });
    qc.invalidateQueries(["materiales-trabajo", expediente.id]);
    refetch();
  };

  const eliminar = async (material) => {
    await base44.entities.MaterialTrabajo.delete(material.id);
    qc.invalidateQueries(["materiales-trabajo", expediente.id]);
    refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="font-semibold text-gray-800">Materiales y repuestos</h3>
          <p className="text-xs text-gray-500">Registra qué se recibió, instaló, devolvió o quedó sin usar.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-[#E31E24] hover:bg-[#B71C1C] gap-1 text-xs">
          <Plus className="w-3 h-3" /> Agregar
        </Button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3 border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Origen *</label>
              <Select value={form.origen} onValueChange={v => setForm({ ...form, origen: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ORIGENES.map(origen => <SelectItem key={origen} value={origen}>{origen}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Estado</label>
              <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ESTADOS.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Descripción *</label>
              <Input value={form.descripcion} placeholder="Ej: filtro de aceite" onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Cantidad</label>
                <Input type="number" min="0.01" step="0.01" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">N.º parte</label>
                <Input value={form.numero_parte} onChange={e => setForm({ ...form, numero_parte: e.target.value })} />
              </div>
            </div>
          </div>
          {form.origen === "Proporcionado por el cliente" && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
              Esta pieza se registra para trazabilidad; no descuenta inventario ni se suma como compra del taller.
            </p>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Notas</label>
            <Input value={form.notas} placeholder="Condición, procedencia o indicaciones" onChange={e => setForm({ ...form, notas: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" disabled={saving} onClick={handleSave} className="bg-[#E31E24] hover:bg-[#B71C1C]">
              {saving ? "Guardando..." : "Guardar material"}
            </Button>
          </div>
        </div>
      )}

      {materiales.length === 0 && !showForm ? (
        <div className="text-center py-10 text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay materiales registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {materiales.map(material => (
            <div key={material.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border">
              <Package className="w-4 h-4 text-[#E31E24] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900">{material.descripcion}</p>
                <p className="text-xs text-gray-500">{material.origen} · Cantidad: {material.cantidad}{material.numero_parte ? ` · Parte: ${material.numero_parte}` : ""}</p>
                {material.notas && <p className="text-xs text-gray-500 mt-1">{material.notas}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Select value={material.estado} onValueChange={v => actualizarEstado(material, v)}>
                  <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => eliminar(material)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
