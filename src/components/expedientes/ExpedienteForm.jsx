import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, User, Car, ClipboardList, Plus, ChevronRight, Check } from "lucide-react";

// ─── Paso 1: Buscar / Crear Cliente ───────────────────────────────────────────
function PasoCliente({ clientes, onSelect }) {
  const [q, setQ] = useState("");
  const [creando, setCreando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nuevo, setNuevo] = useState({
    nombre_completo: "", telefono: "", whatsapp: "", dui: "",
    tipo_cliente: "Particular", activo: true,
  });

  const resultados = q.length >= 2
    ? clientes.filter(c =>
        c.nombre_completo?.toLowerCase().includes(q.toLowerCase()) ||
        c.telefono?.includes(q)
      ).slice(0, 8)
    : [];

  const handleCrear = async () => {
    if (!nuevo.nombre_completo || !nuevo.telefono) return;
    setSaving(true);
    const creado = await base44.entities.Cliente.create(nuevo);
    setSaving(false);
    onSelect(creado);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Busca por nombre o teléfono. Si no existe, créalo aquí.</p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Nombre o teléfono..."
          value={q}
          onChange={e => { setQ(e.target.value); setCreando(false); }}
          autoFocus
        />
      </div>

      {q.length >= 2 && (
        <div className="border rounded-xl divide-y overflow-hidden">
          {resultados.map(c => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="w-8 h-8 bg-[#E31E24]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-[#E31E24]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{c.nombre_completo}</p>
                <p className="text-xs text-gray-500">{c.telefono} · {c.tipo_cliente}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
            </button>
          ))}
          {resultados.length === 0 && !creando && (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center justify-between">
              <span>No encontrado: <strong>"{q}"</strong></span>
              <Button size="sm" variant="outline" onClick={() => { setCreando(true); setNuevo(n => ({ ...n, nombre_completo: q })); }}>
                <Plus className="w-3 h-3 mr-1" /> Crear cliente
              </Button>
            </div>
          )}
        </div>
      )}

      {creando && (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800">Nuevo Cliente</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Nombre completo *</Label>
              <Input value={nuevo.nombre_completo} onChange={e => setNuevo(n => ({ ...n, nombre_completo: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Teléfono *</Label>
              <Input value={nuevo.telefono} onChange={e => setNuevo(n => ({ ...n, telefono: e.target.value }))} placeholder="7777-1234" />
            </div>
            <div>
              <Label className="text-xs">WhatsApp</Label>
              <Input value={nuevo.whatsapp} onChange={e => setNuevo(n => ({ ...n, whatsapp: e.target.value }))} placeholder="7777-1234" />
            </div>
            <div>
              <Label className="text-xs">DUI</Label>
              <Input value={nuevo.dui} onChange={e => setNuevo(n => ({ ...n, dui: e.target.value }))} placeholder="00000000-0" />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={nuevo.tipo_cliente} onValueChange={v => setNuevo(n => ({ ...n, tipo_cliente: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Particular", "Empresa", "Aseguradora", "Flota"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="w-full bg-[#E31E24] hover:bg-[#B71C1C]"
            onClick={handleCrear}
            disabled={saving || !nuevo.nombre_completo || !nuevo.telefono}
          >
            {saving ? "Creando..." : "Crear y Continuar"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Paso 2: Buscar / Crear Vehículo ──────────────────────────────────────────
function PasoVehiculo({ cliente, vehiculos, onSelect }) {
  const vehiculosCliente = vehiculos.filter(v => v.cliente_id === cliente.id);
  const [creando, setCreando] = useState(vehiculosCliente.length === 0);
  const [saving, setSaving] = useState(false);
  const [nuevo, setNuevo] = useState({
    cliente_id: cliente.id, placa: "", marca: "", modelo: "", anio: "",
    color: "", tipo_vehiculo: "Sedán", tipo_combustible: "Gasolina",
    estado_actual: "En taller",
  });

  const handleCrear = async () => {
    if (!nuevo.placa || !nuevo.marca || !nuevo.modelo) return;
    setSaving(true);
    const creado = await base44.entities.Vehiculo.create({ ...nuevo, anio: Number(nuevo.anio) || undefined });
    setSaving(false);
    onSelect(creado);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 text-sm">
        <User className="w-4 h-4 text-[#E31E24]" />
        <span className="font-medium">{cliente.nombre_completo}</span>
        <span className="text-gray-400">· {cliente.telefono}</span>
      </div>

      {vehiculosCliente.length > 0 && !creando && (
        <div className="border rounded-xl divide-y overflow-hidden">
          {vehiculosCliente.map(v => (
            <button
              key={v.id}
              onClick={() => onSelect(v)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="w-8 h-8 bg-[#E31E24]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Car className="w-4 h-4 text-[#E31E24]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{v.marca} {v.modelo} {v.anio}</p>
                <p className="text-xs text-gray-500">{v.placa} · {v.color}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
            </button>
          ))}
          <button
            onClick={() => setCreando(true)}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#E31E24] hover:bg-red-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Registrar otro vehículo
          </button>
        </div>
      )}

      {(creando || vehiculosCliente.length === 0) && (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800">
            {vehiculosCliente.length === 0 ? "Primera visita — Registrar vehículo" : "Nuevo Vehículo"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Placa *</Label>
              <Input value={nuevo.placa} onChange={e => setNuevo(n => ({ ...n, placa: e.target.value.toUpperCase() }))} placeholder="P-000-000" />
            </div>
            <div>
              <Label className="text-xs">Marca *</Label>
              <Input value={nuevo.marca} onChange={e => setNuevo(n => ({ ...n, marca: e.target.value }))} placeholder="Toyota" />
            </div>
            <div>
              <Label className="text-xs">Modelo *</Label>
              <Input value={nuevo.modelo} onChange={e => setNuevo(n => ({ ...n, modelo: e.target.value }))} placeholder="Corolla" />
            </div>
            <div>
              <Label className="text-xs">Año</Label>
              <Input type="number" value={nuevo.anio} onChange={e => setNuevo(n => ({ ...n, anio: e.target.value }))} placeholder="2020" />
            </div>
            <div>
              <Label className="text-xs">Color</Label>
              <Input value={nuevo.color} onChange={e => setNuevo(n => ({ ...n, color: e.target.value }))} placeholder="Blanco" />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={nuevo.tipo_vehiculo} onValueChange={v => setNuevo(n => ({ ...n, tipo_vehiculo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Sedán", "Pick-up", "SUV", "Camión", "Motocicleta", "Van", "Otro"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Combustible</Label>
              <Select value={nuevo.tipo_combustible} onValueChange={v => setNuevo(n => ({ ...n, tipo_combustible: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Gasolina", "Diesel", "Híbrido", "Eléctrico"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="w-full bg-[#E31E24] hover:bg-[#B71C1C]"
            onClick={handleCrear}
            disabled={saving || !nuevo.placa || !nuevo.marca || !nuevo.modelo}
          >
            {saving ? "Registrando..." : "Registrar y Continuar"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Paso 3: Recepción + Inspección rápida ────────────────────────────────────
const INSPECCION_ITEMS = [
  { key: "llanta_repuesto", label: "Llanta de repuesto" },
  { key: "herramientas", label: "Herramientas" },
  { key: "caja_herramientas", label: "Caja de herramientas" },
  { key: "documentos", label: "Documentos" },
  { key: "gato_mecanico", label: "Gato mecánico" },
  { key: "cables_corriente", label: "Cables de corriente" },
];

function PasoRecepcion({ cliente, vehiculo, onSave }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    motivo_visita: "", sintomas_cliente: "", indicaciones_cliente: "",
    kilometraje_entrada: "", llaves_cantidad: 1, llaves_observaciones: "",
    fecha_promesa_entrega: "", observaciones: "",
  });
  const [inspeccion, setInspeccion] = useState({
    llanta_repuesto: false, herramientas: false, caja_herramientas: false,
    documentos: false, gato_mecanico: false, cables_corriente: false,
    carroceria_pintura: "", llantas_estado: "", vidrios_estado: "",
    observaciones: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setInsp = (k, v) => setInspeccion(i => ({ ...i, [k]: v }));

  const handleSave = async () => {
    if (!form.motivo_visita) return;
    setSaving(true);

    // Generar número expediente EXP-YYYY-NNNN
    const year = new Date().getFullYear();
    const existentes = await base44.entities.Expediente.filter({});
    const delAnio = existentes.filter(e => e.numero_expediente?.startsWith(`EXP-${year}-`));
    const siguiente = String(delAnio.length + 1).padStart(4, "0");
    const numero_expediente = `EXP-${year}-${siguiente}`;

    // 1. Crear expediente
    const expediente = await base44.entities.Expediente.create({
      ...form,
      numero_expediente,
      cliente_id: cliente.id,
      vehiculo_id: vehiculo.id,
      fecha_ingreso: new Date().toISOString(),
      estado_interno: "Recibido",
      estado_cliente: "En revisión",
      kilometraje_entrada: Number(form.kilometraje_entrada) || 0,
      llaves_cantidad: Number(form.llaves_cantidad) || 1,
    });

    // 2. Actualizar vehículo a "En taller"
    await base44.entities.Vehiculo.update(vehiculo.id, { estado_actual: "En taller" });

    // 3. Crear inspección vinculada
    await base44.entities.Inspeccion.create({
      expediente_id: expediente.id,
      vehiculo_id: vehiculo.id,
      cliente_id: cliente.id,
      fecha: new Date().toISOString(),
      kilometraje: Number(form.kilometraje_entrada) || 0,
      estado: "Pendiente",
      ...inspeccion,
    });

    setSaving(false);
    onSave();
  };

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="flex gap-2 flex-wrap">
        <Badge className="bg-[#E31E24]/10 text-[#E31E24] border-0">
          <User className="w-3 h-3 mr-1" />{cliente.nombre_completo}
        </Badge>
        <Badge className="bg-blue-50 text-blue-700 border-0">
          <Car className="w-3 h-3 mr-1" />{vehiculo.marca} {vehiculo.modelo} · {vehiculo.placa}
        </Badge>
      </div>

      {/* Motivo */}
      <div>
        <Label>Motivo de visita *</Label>
        <Input value={form.motivo_visita} onChange={e => set("motivo_visita", e.target.value)} placeholder="Ej: Mantenimiento, Frenos, Diagnóstico..." />
      </div>

      <div>
        <Label>Síntomas reportados</Label>
        <Textarea value={form.sintomas_cliente} onChange={e => set("sintomas_cliente", e.target.value)} rows={2} placeholder="¿Qué siente el cliente en el vehículo?" />
      </div>

      <div>
        <Label>Indicaciones del cliente</Label>
        <Textarea value={form.indicaciones_cliente} onChange={e => set("indicaciones_cliente", e.target.value)} rows={2} placeholder="Instrucciones especiales..." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Kilometraje entrada</Label>
          <Input type="number" value={form.kilometraje_entrada} onChange={e => set("kilometraje_entrada", e.target.value)} />
        </div>
        <div>
          <Label>Fecha promesa entrega</Label>
          <Input type="datetime-local" value={form.fecha_promesa_entrega} onChange={e => set("fecha_promesa_entrega", e.target.value)} />
        </div>
        <div>
          <Label>Cantidad de llaves</Label>
          <Input type="number" value={form.llaves_cantidad} onChange={e => set("llaves_cantidad", e.target.value)} min={0} />
        </div>
        <div>
          <Label>Obs. llaves</Label>
          <Input value={form.llaves_observaciones} onChange={e => set("llaves_observaciones", e.target.value)} placeholder="Llavero, copias..." />
        </div>
      </div>

      {/* Inspección rápida */}
      <div className="border rounded-xl p-4 space-y-3 bg-gray-50">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Inspección rápida de ingreso
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Carrocería / Pintura</Label>
            <Select value={inspeccion.carroceria_pintura} onValueChange={v => setInsp("carroceria_pintura", v)}>
              <SelectTrigger><SelectValue placeholder="Estado..." /></SelectTrigger>
              <SelectContent>
                {["Buena", "Regular", "Mala", "Golpeada", "Rayada", "Descolorida"].map(e => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Llantas</Label>
            <Select value={inspeccion.llantas_estado} onValueChange={v => setInsp("llantas_estado", v)}>
              <SelectTrigger><SelectValue placeholder="Estado..." /></SelectTrigger>
              <SelectContent>
                {["Buenas", "Regulares", "Malas"].map(e => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Vidrios</Label>
            <Select value={inspeccion.vidrios_estado} onValueChange={v => setInsp("vidrios_estado", v)}>
              <SelectTrigger><SelectValue placeholder="Estado..." /></SelectTrigger>
              <SelectContent>
                {["Buenos", "Regulares", "Malos", "Rajados"].map(e => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Checkboxes artículos */}
        <div className="grid grid-cols-2 gap-2">
          {INSPECCION_ITEMS.map(item => (
            <label key={item.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={inspeccion[item.key]}
                onChange={e => setInsp(item.key, e.target.checked)}
                className="w-4 h-4 accent-[#E31E24]"
              />
              {item.label}
            </label>
          ))}
        </div>

        <div>
          <Label className="text-xs">Observaciones de inspección</Label>
          <Textarea value={inspeccion.observaciones} onChange={e => setInsp("observaciones", e.target.value)} rows={2} placeholder="Golpes, rayaduras, faltantes..." />
        </div>
      </div>

      <div>
        <Label>Observaciones generales</Label>
        <Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} rows={2} />
      </div>

      <Button
        className="w-full bg-[#E31E24] hover:bg-[#B71C1C] h-11 font-semibold"
        onClick={handleSave}
        disabled={saving || !form.motivo_visita}
      >
        {saving ? "Abriendo expediente..." : "✓ Abrir Expediente"}
      </Button>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────
const PASOS = [
  { label: "Cliente", icon: User },
  { label: "Vehículo", icon: Car },
  { label: "Recepción", icon: ClipboardList },
];

export default function ExpedienteForm({ open, onClose, clientes, vehiculos, onSave, expediente }) {
  const [paso, setPaso] = useState(0);
  const [cliente, setCliente] = useState(null);
  const [vehiculo, setVehiculo] = useState(null);

  // Reset al abrir
  useEffect(() => {
    if (open) { setPaso(0); setCliente(null); setVehiculo(null); }
  }, [open]);

  // Si es edición, usar el formulario simple original
  if (expediente) {
    return <ExpedienteEditSimple open={open} onClose={onClose} expediente={expediente} clientes={clientes} vehiculos={vehiculos} onSave={onSave} />;
  }

  const handleSelectCliente = (c) => { setCliente(c); setPaso(1); };
  const handleSelectVehiculo = (v) => { setVehiculo(v); setPaso(2); };
  const handleSave = () => { onSave(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Expediente</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-2">
          {PASOS.map((p, i) => {
            const Icon = p.icon;
            const done = i < paso;
            const active = i === paso;
            return (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  done ? "bg-green-100 text-green-700" :
                  active ? "bg-[#E31E24] text-white" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  {p.label}
                </div>
                {i < PASOS.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
              </React.Fragment>
            );
          })}
        </div>

        {paso === 0 && (
          <PasoCliente clientes={clientes} onSelect={handleSelectCliente} />
        )}
        {paso === 1 && cliente && (
          <PasoVehiculo cliente={cliente} vehiculos={vehiculos} onSelect={handleSelectVehiculo} />
        )}
        {paso === 2 && cliente && vehiculo && (
          <PasoRecepcion cliente={cliente} vehiculo={vehiculo} onSave={handleSave} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Edición simple (sin cambiar flujo existente) ─────────────────────────────
function ExpedienteEditSimple({ open, onClose, expediente, clientes, vehiculos, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (expediente) setForm({ ...expediente }); }, [expediente, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Expediente.update(expediente.id, form);
    setSaving(false);
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Expediente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Motivo de visita *</Label>
            <Input value={form.motivo_visita || ""} onChange={e => set("motivo_visita", e.target.value)} />
          </div>
          <div>
            <Label>Síntomas</Label>
            <Textarea value={form.sintomas_cliente || ""} onChange={e => set("sintomas_cliente", e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Indicaciones</Label>
            <Textarea value={form.indicaciones_cliente || ""} onChange={e => set("indicaciones_cliente", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kilometraje</Label>
              <Input type="number" value={form.kilometraje_entrada || ""} onChange={e => set("kilometraje_entrada", e.target.value)} />
            </div>
            <div>
              <Label>Fecha promesa</Label>
              <Input type="datetime-local" value={form.fecha_promesa_entrega || ""} onChange={e => set("fecha_promesa_entrega", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Observaciones</Label>
            <Textarea value={form.observaciones || ""} onChange={e => set("observaciones", e.target.value)} rows={2} />
          </div>
          <Button className="w-full bg-[#E31E24] hover:bg-[#B71C1C]" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}