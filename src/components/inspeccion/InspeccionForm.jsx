import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle, Camera } from "lucide-react";
import SignaturePad from "@/components/autorizacion/SignaturePad";
import FotoRecepcion, { ANGULOS_FOTO } from "@/components/inspeccion/FotoRecepcion";

const ESTADOS_CONDICION = ["Bueno", "Regular", "Malo"];
const TIPOS_DANO = ["Rayón", "Golpe", "Quebrado", "Faltante", "Óxido", "Vidrio dañado", "Daño eléctrico", "Otro"];
const EVALUACIONES_RECEPCION = [
  ["Carrocería", "Lámina"], ["Carrocería", "Puertas"], ["Carrocería", "Vidrios"], ["Carrocería", "Cubierta de luces"],
  ["Carrocería", "Funcionamiento de luces"], ["Carrocería", "Vías"], ["Carrocería", "Antena"],
  ["Interior", "Casetera / radio"], ["Interior", "Parlantes"], ["Interior", "Asientos"], ["Interior", "Retrovisores"], ["Interior", "Equipo especial"]
];

const condicionColor = { "Bueno": "bg-green-100 text-green-800", "Regular": "bg-yellow-100 text-yellow-800", "Malo": "bg-red-100 text-red-800" };

const CondicionSelect = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-2 border-b border-gray-50 py-2.5 sm:flex-row sm:items-center sm:justify-between">
    <span className="text-sm text-gray-700">{label}</span>
    <div className="flex gap-1.5">
      {ESTADOS_CONDICION.map(e => (
        <button key={e} onClick={() => onChange(e)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${value === e ? condicionColor[e] + " border-transparent" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}>
          {e}
        </button>
      ))}
    </div>
  </div>
);

const SiNoSelect = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-2 border-b border-gray-50 py-2.5 sm:flex-row sm:items-center sm:justify-between">
    <span className="text-sm text-gray-700">{label}</span>
    <div className="flex gap-1.5">
      {["Sí", "No"].map(v => (
        <button key={v} onClick={() => onChange(v)}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all border ${value === v ? (v === "Sí" ? "bg-green-100 text-green-800 border-transparent" : "bg-red-100 text-red-800 border-transparent") : "border-gray-200 text-gray-400 hover:border-gray-300"}`}>
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
    aseguradora: "",
    orden_trabajo_referencia: "",
    vehiculo_agencia_importado: false,
    tipo_croquis: vehiculo?.tipo_vehiculo === "SUV" ? "Camioneta / SUV" : (vehiculo?.tipo_vehiculo || "Otro"),
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
    evaluaciones: [],
    firma_ingreso: { nombre_firma: cliente?.nombre_completo || "", firma_data_url: "", metodo: "Digital" },
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nuevoDano, setNuevoDano] = useState({ tipo: "Rayón", ubicacion: "", descripcion: "" });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fotosGuardadas = (form.fotos || []).filter(foto => typeof foto === "string" && foto.trim()).length;

  const agregarDano = () => {
    if (!nuevoDano.ubicacion) return;
    set("daños", [...(form.daños || []), { ...nuevoDano }]);
    setNuevoDano({ tipo: "Rayón", ubicacion: "", descripcion: "" });
  };

  const quitarDano = (i) => set("daños", form.daños.filter((_, idx) => idx !== i));

  const estadoEvaluacion = (elemento) => form.evaluaciones?.find(e => e.elemento === elemento)?.estado || "";
  const setEvaluacion = (categoria, elemento, estado) => {
    const actuales = form.evaluaciones || [];
    const sinElemento = actuales.filter(e => e.elemento !== elemento);
    set("evaluaciones", estado ? [...sinElemento, { categoria, elemento, estado }] : sinElemento);
  };

  const handleFotoAngulo = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const fotos = [...(form.fotos || [])];
      while (fotos.length < ANGULOS_FOTO.length) fotos.push("");
      fotos[index] = file_uri;
      set("fotos", fotos);
    } catch {
      alert("No se pudo guardar la foto. Intenta nuevamente.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      expediente_id: expediente.id,
      vehiculo_id: vehiculo.id,
      cliente_id: cliente.id,
      fecha: new Date().toISOString(),
      estado: fotosGuardadas >= ANGULOS_FOTO.length ? "Completada" : "Pendiente",
      firma_ingreso: form.firma_ingreso?.firma_data_url ? {
        ...form.firma_ingreso,
        fecha: new Date().toISOString(),
        tecnico_nombre: form.realizada_por || "",
      } : undefined,
    };
    if (inspeccionExistente) {
      await base44.entities.Inspeccion.update(inspeccionExistente.id, data);
    } else {
      await base44.entities.Inspeccion.create(data);
    }
    setSaving(false);
    onSave(fotosGuardadas >= ANGULOS_FOTO.length);
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      {/* Datos de recepción */}
      <div className="bg-white border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label>Aseguradora</Label><Input value={form.aseguradora || ""} onChange={e => set("aseguradora", e.target.value)} placeholder="Si aplica" /></div>
        <div><Label>Referencia de orden</Label><Input value={form.orden_trabajo_referencia || ""} onChange={e => set("orden_trabajo_referencia", e.target.value)} placeholder="N.º de orden" /></div>
        <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2"><input type="checkbox" checked={!!form.vehiculo_agencia_importado} onChange={e => set("vehiculo_agencia_importado", e.target.checked)} className="w-4 h-4 accent-[#E31E24]" /> Vehículo de agencia o importado</label>
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
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-3">
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

      {/* Estado detallado de la hoja de recepción */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-1">Revisión detallada</h3>
        <p className="text-xs text-gray-500 mb-3">Registra el estado de cada elemento recibido. Los daños específicos se anotan en el siguiente paso.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EVALUACIONES_RECEPCION.map(([categoria, elemento]) => (
            <div key={elemento} className="flex flex-col items-stretch gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-medium text-gray-800">{elemento}</p><p className="text-xs text-gray-400">{categoria}</p></div>
              <Select value={estadoEvaluacion(elemento)} onValueChange={estado => setEvaluacion(categoria, elemento, estado)}><SelectTrigger className="h-9 w-full sm:w-28"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent>{ESTADOS_CONDICION.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}</SelectContent></Select>
            </div>
          ))}
        </div>
      </div>

      {/* Daños */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Daños Encontrados</h3>
        {(form.daños || []).map((d, i) => (
          <div key={i} className="mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-2">
            <Badge className="bg-red-100 text-red-800 text-xs">{d.tipo}</Badge>
            <span className="min-w-0 flex-1 break-words text-sm">{d.ubicacion} {d.descripcion && `— ${d.descripcion}`}</span>
            <button onClick={() => quitarDano(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          <Select value={nuevoDano.tipo} onValueChange={v => setNuevoDano(n => ({ ...n, tipo: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TIPOS_DANO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Ubicación (Ej: puerta delantera izq)" value={nuevoDano.ubicacion}
            onChange={e => setNuevoDano(n => ({ ...n, ubicacion: e.target.value }))} />
          <Button variant="outline" onClick={agregarDano} className="gap-1 h-10"><Plus className="w-3 h-3" /> Agregar</Button>
        </div>
        <Input className="mt-2" placeholder="Descripción del daño (opcional)"
          value={nuevoDano.descripcion} onChange={e => setNuevoDano(n => ({ ...n, descripcion: e.target.value }))} />
      </div>

      {/* Fotos y confirmación inicial */}
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div>
          <h3 className="font-semibold text-gray-800">Fotos de recepción: {Math.min(fotosGuardadas, ANGULOS_FOTO.length)}/{ANGULOS_FOTO.length}</h3>
          <p className="mt-1 text-sm text-gray-600">Usa la cámara del dispositivo del taller. Cada foto se sube directo al expediente y queda guardada de forma privada.</p>
        </div>
        <div role="status" className={`rounded-lg border px-3 py-2 text-sm ${fotosGuardadas >= ANGULOS_FOTO.length ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {fotosGuardadas >= ANGULOS_FOTO.length ? "Recepción fotográfica completa. Ya puedes continuar con la facturación." : `Pendiente de fotografías: ${Math.min(fotosGuardadas, ANGULOS_FOTO.length)}/4. Completa los cuatro ángulos antes de facturar.`}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ANGULOS_FOTO.map((angulo, index) => {
            const fileUri = form.fotos?.[index];
            return (
              <div key={angulo} className="space-y-2 rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-gray-800">{index + 1}. {angulo}</p>
                  <span className={`text-xs font-medium ${fileUri ? "text-green-700" : "text-amber-700"}`}>{fileUri ? "Guardada" : "Pendiente"}</span>
                </div>
                {fileUri ? <FotoRecepcion fileUri={fileUri} alt={`Vista ${angulo}`} className="h-36 w-full rounded-md object-cover" /> : <div className="flex h-24 items-center justify-center rounded-md bg-gray-50 text-sm text-gray-500">Foto pendiente</div>}
                <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Camera className="h-4 w-4" aria-hidden="true" />{uploading ? "Guardando foto…" : fileUri ? "Cambiar foto" : "Tomar foto"}
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={event => handleFotoAngulo(index, event)} disabled={uploading} />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Observaciones generales</Label>
        <Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} rows={3} />
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">Confirmación de ingreso</h3>
        <div><Label>Nombre del cliente o representante</Label><Input value={form.firma_ingreso?.nombre_firma || ""} onChange={e => set("firma_ingreso", { ...(form.firma_ingreso || {}), nombre_firma: e.target.value, metodo: "Digital" })} /></div>
        <div><Label>Firma del cliente</Label><SignaturePad value={form.firma_ingreso?.firma_data_url || ""} onChange={firma_data_url => set("firma_ingreso", { ...(form.firma_ingreso || {}), firma_data_url, metodo: "Digital" })} /></div>
      </div>

      <Button className="w-full bg-[#E31E24] hover:bg-[#B71C1C] gap-2" onClick={handleSave} disabled={saving || uploading}>
        <CheckCircle className="w-4 h-4" />
        {saving ? "Guardando..." : "Guardar Inspección"}
      </Button>
    </div>
  );
}