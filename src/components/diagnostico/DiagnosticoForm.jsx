import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle } from "lucide-react";

const SISTEMAS = ["Motor", "Transmisión", "Frenos", "Suspensión", "Dirección", "Sistema eléctrico", "A/C", "Carrocería", "Combustible", "Escape", "Neumáticos", "Otro"];
const SEVERIDADES = ["Leve", "Moderada", "Grave", "Crítica"];
const sevColor = { "Leve": "bg-green-100 text-green-800", "Moderada": "bg-yellow-100 text-yellow-800", "Grave": "bg-orange-100 text-orange-800", "Crítica": "bg-red-100 text-red-800" };

export default function DiagnosticoForm({ expediente, empleados, onSave, diagnosticoExistente }) {
  const [form, setForm] = useState(diagnosticoExistente || {
    tecnico_nombre: "",
    diagnostico_inicial: "",
    diagnostico_final: "",
    fallas_detectadas: [],
    recomendaciones: "",
    fotos: [],
    estado: "En Proceso",
  });
  const [saving, setSaving] = useState(false);
  const [nuevaFalla, setNuevaFalla] = useState({ sistema: "Motor", descripcion: "", severidad: "Moderada" });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const agregarFalla = () => {
    if (!nuevaFalla.descripcion) return;
    set("fallas_detectadas", [...(form.fallas_detectadas || []), { ...nuevaFalla }]);
    setNuevaFalla({ sistema: "Motor", descripcion: "", severidad: "Moderada" });
  };

  const quitarFalla = (i) => set("fallas_detectadas", form.fallas_detectadas.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      expediente_id: expediente.id,
      vehiculo_id: expediente.vehiculo_id,
      fecha: new Date().toISOString(),
      estado: "Completado",
    };
    if (diagnosticoExistente) {
      await base44.entities.Diagnostico.update(diagnosticoExistente.id, data);
    } else {
      await base44.entities.Diagnostico.create(data);
    }
    // Actualizar expediente
    await base44.entities.Expediente.update(expediente.id, {
      estado_interno: "Esperando Aprobación",
      diagnostico_documentado: true,
    });
    setSaving(false);
    onSave();
  };

  return (
    <div className="space-y-6">
      {/* Técnico */}
      <div>
        <Label>Técnico responsable</Label>
        <Select value={form.tecnico_nombre} onValueChange={v => set("tecnico_nombre", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar técnico..." /></SelectTrigger>
          <SelectContent>
            {empleados.filter(e => e.activo && ["Técnico", "Pintura", "Administración", "Gerencia"].includes(e.tipo)).map(e => (
              <SelectItem key={e.id} value={e.nombre_completo}>{e.nombre_completo} — {e.tipo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Diagnóstico inicial */}
      <div>
        <Label>Diagnóstico inicial</Label>
        <Textarea value={form.diagnostico_inicial} onChange={e => set("diagnostico_inicial", e.target.value)}
          rows={3} placeholder="Descripción del problema encontrado al recibir el vehículo..." />
      </div>

      {/* Fallas detectadas */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Fallas Detectadas</h3>
        {(form.fallas_detectadas || []).map((f, i) => (
          <div key={i} className="flex items-start gap-2 mb-2 bg-gray-50 rounded-lg p-2">
            <Badge className="bg-blue-100 text-blue-800 text-xs shrink-0">{f.sistema}</Badge>
            <span className="text-sm flex-1">{f.descripcion}</span>
            <Badge className={`${sevColor[f.severidad]} text-xs shrink-0`}>{f.severidad}</Badge>
            <button onClick={() => quitarFalla(i)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
          <Select value={nuevaFalla.sistema} onValueChange={v => setNuevaFalla(n => ({ ...n, sistema: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SISTEMAS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={nuevaFalla.severidad} onValueChange={v => setNuevaFalla(n => ({ ...n, severidad: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SEVERIDADES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={agregarFalla} className="gap-1"><Plus className="w-3 h-3" /> Agregar</Button>
        </div>
        <Input className="mt-2" placeholder="Descripción de la falla *"
          value={nuevaFalla.descripcion} onChange={e => setNuevaFalla(n => ({ ...n, descripcion: e.target.value }))} />
      </div>

      {/* Diagnóstico final */}
      <div>
        <Label>Diagnóstico final confirmado</Label>
        <Textarea value={form.diagnostico_final} onChange={e => set("diagnostico_final", e.target.value)}
          rows={3} placeholder="Resumen final después de diagnóstico completo..." />
      </div>

      {/* Recomendaciones */}
      <div>
        <Label>Recomendaciones técnicas</Label>
        <Textarea value={form.recomendaciones} onChange={e => set("recomendaciones", e.target.value)}
          rows={2} placeholder="Trabajos recomendados, repuestos a cambiar..." />
      </div>

      <Button className="w-full bg-[#E31E24] hover:bg-[#B71C1C] gap-2" onClick={handleSave} disabled={saving}>
        <CheckCircle className="w-4 h-4" />
        {saving ? "Guardando..." : "Completar Diagnóstico"}
      </Button>
    </div>
  );
}