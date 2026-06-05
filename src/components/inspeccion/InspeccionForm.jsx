import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle } from "lucide-react";

const ESTADOS_CONDICION = ["Bueno", "Regular", "Malo"];
const TIPOS_DANO = ["Rayón", "Golpe", "Quebrado", "Faltante", "Óxido", "Vidrio dañado", "Daño eléctrico", "Otro"];

const condicionColor = { "Bueno": "bg-green-100 text-green-800", "Regular": "bg-yellow-100 text-yellow-800", "Malo": "bg-red-100 text-red-800" };

const CondicionSelect = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50">
    <span className="text-sm text-gray-700">{label}</span>
    <div className="flex gap-1">
      {ESTADOS_CONDICION.map(e => (
        <button key={e} onClick={() => onChange(e)}
          className={`px-2 py-0.5 rounded text-xs font-medium transition-all border ${value === e ? condicionColor[e] + " border-transparent" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}>
          {e}
        </button>
      ))}
    </div>
  </div>
);

const SiNoSelect = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50">
    <span className="text-sm text-gray-700">{label}</span>
    <div className="flex gap-1">
      {["Sí", "No"].map(v => (
        <button key={v} onClick={() => onChange(v)}
          className={`px-3 py-0.5 rounded text-xs font-medium transition-all border ${value === v ? (v === "Sí" ? "bg-green-100 text-green-800 border-transparent" : "bg-red-100 text-red-800 border-transparent") : "border-gray-200 text-gray-400 hover:border-gray-300"}`}>
          {v}
        </button>
      ))}
    </div>
  </div>
);

export default function InspeccionForm({ expediente, vehiculo, cliente, empleados, onSave, inspeccionExistente }) {
  const [form, setForm] = useState(inspeccionExistente || {
    realizada_por: "",
    kilometraje: vehiculo?.kilometraje_actual || "",
    aire_acondicionado: "",
    direccion_hidraulica: "",
    alarma: "",
    estado_llantas: "",
    estado_luces: "",
    estado_vidrios: "",
    estado_pintura: "",
    estado_tapiceria: "",
    llanta_repuesto: false,
    herramientas: false,
    documentos: false,
    accesorios_recibidos: "",
    daños: [],
    observaciones: "",
    fotos: [],
  });
  const [saving, setSaving] = useState(false);
  const [nuevoDano, setNuevoDano] = useState({ tipo: "Rayón", ubicacion: "", descripcion: "" });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const agregarDano = () => {
    if (!nuevoDano.ubicacion) return;
    set("daños", [...(form.daños || []), { ...nuevoDano }]);
    setNuevoDano({ tipo: "Rayón", ubicacion: "", descripcion: "" });
  };

  const quitarDano = (i) => set("daños", form.daños.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      expediente_id: expediente.id,
      vehiculo_id: vehiculo.id,
      cliente_id: cliente.id,
      fecha: new Date().toISOString(),
      estado: "Completada",
    };
    if (inspeccionExistente) {
      await base44.entities.Inspeccion.update(inspeccionExistente.id, data);
    } else {
      await base44.entities.Inspeccion.create(data);
    }
    setSaving(false);
    onSave();
  };

  return (
    <div className="space-y-6">
      {/* Info vehículo */}
      <div className="bg-blue-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div><p className="text-gray-500 text-xs">Vehículo</p><p className="font-semibold">{vehiculo?.marca} {vehiculo?.modelo}</p></div>
        <div><p className="text-gray-500 text-xs">Placa</p><p className="font-semibold">{vehiculo?.placa}</p></div>
        <div><p className="text-gray-500 text-xs">Cliente</p><p className="font-semibold">{cliente?.nombre_completo}</p></div>
        <div><p className="text-gray-500 text-xs">Teléfono</p><p className="font-semibold">{cliente?.telefono}</p></div>
      </div>

      {/* Técnico y KM */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Realizada por</Label>
          <Select value={form.realizada_por} onValueChange={v => set("realizada_por", v)}>
            <SelectTrigger><SelectValue placeholder="Técnico..." /></SelectTrigger>
            <SelectContent>
              {empleados.filter(e => e.activo).map(e => (
                <SelectItem key={e.id} value={e.nombre_completo}>{e.nombre_completo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Kilometraje</Label>
          <Input type="number" value={form.kilometraje} onChange={e => set("kilometraje", e.target.value)} />
        </div>
      </div>

      {/* Sistemas */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Condición del Vehículo</h3>
        <CondicionSelect label="Estado de llantas" value={form.estado_llantas} onChange={v => set("estado_llantas", v)} />
        <CondicionSelect label="Estado de luces" value={form.estado_luces} onChange={v => set("estado_luces", v)} />
        <CondicionSelect label="Estado de vidrios" value={form.estado_vidrios} onChange={v => set("estado_vidrios", v)} />
        <CondicionSelect label="Estado de pintura" value={form.estado_pintura} onChange={v => set("estado_pintura", v)} />
        <CondicionSelect label="Estado de tapicería" value={form.estado_tapiceria} onChange={v => set("estado_tapiceria", v)} />
        <div className="mt-2">
          <SiNoSelect label="Aire acondicionado" value={form.aire_acondicionado === "Funciona" ? "Sí" : form.aire_acondicionado === "No funciona" ? "No" : ""}
            onChange={v => set("aire_acondicionado", v === "Sí" ? "Funciona" : "No funciona")} />
          <SiNoSelect label="Dirección hidráulica" value={form.direccion_hidraulica} onChange={v => set("direccion_hidraulica", v)} />
          <SiNoSelect label="Alarma" value={form.alarma} onChange={v => set("alarma", v)} />
        </div>
      </div>

      {/* Accesorios recibidos */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Accesorios y Documentos</h3>
        <div className="flex gap-6 mb-3">
          {[["llanta_repuesto", "Llanta de repuesto"], ["herramientas", "Herramientas"], ["documentos", "Documentos"]].map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)}
                className="w-4 h-4 accent-[#E31E24]" />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
        <div>
          <Label>Otros accesorios recibidos</Label>
          <Input value={form.accesorios_recibidos} onChange={e => set("accesorios_recibidos", e.target.value)}
            placeholder="Ej: Gato hidráulico, cables de arranque..." />
        </div>
      </div>

      {/* Daños */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Daños Encontrados</h3>
        {(form.daños || []).map((d, i) => (
          <div key={i} className="flex items-center gap-2 mb-2 bg-red-50 rounded-lg p-2">
            <Badge className="bg-red-100 text-red-800 text-xs">{d.tipo}</Badge>
            <span className="text-sm flex-1">{d.ubicacion} {d.descripcion && `— ${d.descripcion}`}</span>
            <button onClick={() => quitarDano(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <Select value={nuevoDano.tipo} onValueChange={v => setNuevoDano(n => ({ ...n, tipo: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TIPOS_DANO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Ubicación (Ej: puerta delantera izq)" value={nuevoDano.ubicacion}
            onChange={e => setNuevoDano(n => ({ ...n, ubicacion: e.target.value }))} />
          <Button variant="outline" onClick={agregarDano} className="gap-1"><Plus className="w-3 h-3" /> Agregar</Button>
        </div>
        <Input className="mt-2" placeholder="Descripción del daño (opcional)"
          value={nuevoDano.descripcion} onChange={e => setNuevoDano(n => ({ ...n, descripcion: e.target.value }))} />
      </div>

      {/* Observaciones */}
      <div>
        <Label>Observaciones generales</Label>
        <Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} rows={3} />
      </div>

      <Button className="w-full bg-[#E31E24] hover:bg-[#B71C1C] gap-2" onClick={handleSave} disabled={saving}>
        <CheckCircle className="w-4 h-4" />
        {saving ? "Guardando..." : "Guardar Inspección"}
      </Button>
    </div>
  );
}