import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, CheckCircle, Clock, Wrench, ShieldCheck } from "lucide-react";

const TIPOS = ["Mano de Obra", "Mano de Obra Pintura", "Repuesto", "Insumo", "Diagnóstico", "Otro"];

const estadoColor = {
  "Pendiente": "bg-yellow-100 text-yellow-800",
  "En Proceso": "bg-blue-100 text-blue-800",
  "Completado": "bg-green-100 text-green-800",
};

const emptyTrabajo = {
  descripcion: "", tipo: "Mano de Obra", cantidad: 1,
  precio_unitario: 0, subtotal: 0, estado: "Pendiente",
  aprobado_cliente: false, tecnico_nombre: "", notas: "",
  catalogo_precio_id: "", precio_sugerido: 0, origen_precio: "Manual"
};

export default function TrabajosTab({ expediente, empleados, onTotalesChange }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyTrabajo);
  const [saving, setSaving] = useState(false);
  const [busquedaCatalogo, setBusquedaCatalogo] = useState("");
  const [trabajoEnRevision, setTrabajoEnRevision] = useState(null);
  const [ajuste, setAjuste] = useState({ precio_aprobado: "", motivo: "", aprobado_por_nombre: "" });

  const { data: trabajos = [], refetch } = useQuery({
    queryKey: ["trabajos", expediente.id],
    queryFn: () => base44.entities.TrabajoExpediente.filter({ expediente_id: expediente.id }),
    enabled: !!expediente.id,
  });

  const { data: catalogo = [] } = useQuery({
    queryKey: ["catalogo-precios-activos"],
    queryFn: () => base44.entities.CatalogoPrecio.filter({ activo: true }),
  });

  const tecnicos = empleados.filter(e => ["Técnico", "Pintura"].includes(e.tipo) && e.activo !== false);

  const coincidenciasCatalogo = useMemo(() => {
    const q = busquedaCatalogo.trim().toLowerCase();
    if (q.length < 2) return [];
    return catalogo.filter(item =>
      `${item.codigo_catalogo} ${item.descripcion} ${item.rubro}`.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [catalogo, busquedaCatalogo]);

  const calcSubtotal = (f) => (parseFloat(f.cantidad) || 0) * (parseFloat(f.precio_unitario) || 0);

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    updated.subtotal = calcSubtotal(updated);
    setForm(updated);
  };

  const seleccionarCatalogo = (item) => {
    const precio = item.precio_verificado ?? item.precio_base ?? 0;
    const tipo = item.rubro?.includes("PINTURA") ? "Mano de Obra Pintura"
      : item.rubro?.includes("REPUEST") ? "Repuesto"
      : item.rubro?.includes("LUBRIC") || item.rubro?.includes("MATERIAL") ? "Insumo"
      : "Mano de Obra";
    const updated = {
      ...form,
      descripcion: item.descripcion,
      tipo,
      catalogo_precio_id: item.id,
      precio_sugerido: precio,
      precio_unitario: precio,
      origen_precio: "Catálogo",
    };
    updated.subtotal = calcSubtotal(updated);
    setForm(updated);
    setBusquedaCatalogo("");
  };

  const abrirRevision = (trabajo) => {
    const sugerido = trabajo.precio_sugerido ?? trabajo.precio_unitario ?? 0;
    setTrabajoEnRevision(trabajo);
    setAjuste({
      precio_aprobado: String(trabajo.precio_unitario ?? sugerido),
      motivo: "",
      aprobado_por_nombre: "",
    });
  };

  const guardarRevision = async () => {
    if (!trabajoEnRevision || !ajuste.aprobado_por_nombre) return;
    const precioSugerido = trabajoEnRevision.precio_sugerido ?? trabajoEnRevision.precio_unitario ?? 0;
    const precioAprobado = Number(ajuste.precio_aprobado);
    if (!Number.isFinite(precioAprobado) || precioAprobado < 0) return;

    setSaving(true);
    try {
      const subtotal = (Number(trabajoEnRevision.cantidad) || 0) * precioAprobado;
      await base44.entities.AjustePrecioTrabajo.create({
        trabajo_id: trabajoEnRevision.id,
        expediente_id: expediente.id,
        catalogo_precio_id: trabajoEnRevision.catalogo_precio_id || "",
        precio_sugerido: precioSugerido,
        precio_aprobado: precioAprobado,
        motivo: ajuste.motivo.trim() || "Precio sugerido aprobado",
        aprobado_por_nombre: ajuste.aprobado_por_nombre,
        fecha: new Date().toISOString(),
      });
      await base44.entities.TrabajoExpediente.update(trabajoEnRevision.id, {
        precio_unitario: precioAprobado,
        subtotal,
        precio_ajustado_por: ajuste.aprobado_por_nombre,
        motivo_ajuste_precio: ajuste.motivo.trim() || "Precio sugerido aprobado",
        fecha_ajuste_precio: new Date().toISOString(),
      });
      const total = trabajos.reduce((s, trabajo) =>
        s + (trabajo.id === trabajoEnRevision.id ? subtotal : (trabajo.subtotal || 0)), 0);
      await base44.entities.Expediente.update(expediente.id, {
        total_cobrado: total,
        saldo_pendiente: total - (expediente.total_pagado || 0),
      });
      qc.invalidateQueries(["trabajos", expediente.id]);
      qc.invalidateQueries(["expediente", expediente.id]);
      setTrabajoEnRevision(null);
      refetch();
    } catch (error) {
      alert("Error al revisar el precio: " + (error.message || error));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.descripcion) return;
    setSaving(true);
    try {
      const data = {
        ...form,
        expediente_id: expediente.id,
        cantidad: parseFloat(form.cantidad) || 1,
        precio_unitario: parseFloat(form.precio_unitario) || 0,
        subtotal: calcSubtotal(form),
      };
      await base44.entities.TrabajoExpediente.create(data);
      // Actualizar totales en expediente
      const allTrabajos = [...trabajos, data];
      const total = allTrabajos.reduce((s, t) => s + (t.subtotal || 0), 0);
      await base44.entities.Expediente.update(expediente.id, {
        total_cobrado: total,
        saldo_pendiente: total - (expediente.total_pagado || 0)
      });
      qc.invalidateQueries(["trabajos", expediente.id]);
      qc.invalidateQueries(["expediente", expediente.id]);
      if (onTotalesChange) onTotalesChange();
      setForm(emptyTrabajo);
      setShowForm(false);
    } catch (error) {
      alert("Error al guardar el trabajo: " + (error.message || error));
    } finally {
      setSaving(false);
      refetch();
    }
  };

  const handleDelete = async (t) => {
    await base44.entities.TrabajoExpediente.delete(t.id);
    const remaining = trabajos.filter(w => w.id !== t.id);
    const total = remaining.reduce((s, w) => s + (w.subtotal || 0), 0);
    await base44.entities.Expediente.update(expediente.id, {
      total_cobrado: total,
      saldo_pendiente: total - (expediente.total_pagado || 0)
    });
    qc.invalidateQueries(["trabajos", expediente.id]);
    qc.invalidateQueries(["expediente", expediente.id]);
    refetch();
  };

  const handleEstado = async (t, estado) => {
    await base44.entities.TrabajoExpediente.update(t.id, { estado });
    refetch();
  };

  const trabajosOrdenados = [...trabajos].sort((a, b) => {
    const fechaA = a.created_date ? new Date(a.created_date).getTime() : 0;
    const fechaB = b.created_date ? new Date(b.created_date).getTime() : 0;
    return fechaA - fechaB;
  });

  const total = trabajosOrdenados.reduce((s, t) => s + (t.subtotal || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">Trabajos y Servicios</h3>
          <p className="text-xs text-gray-500">{trabajos.length} ítem(s) · Total: <span className="font-semibold text-gray-800">${total.toFixed(2)}</span></p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-[#E31E24] hover:bg-[#B71C1C] gap-1 text-xs">
          <Plus className="w-3 h-3" /> Agregar
        </Button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3 border">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 block">Buscar precio sugerido en catálogo</label>
            <Input
              placeholder="Ej: aceite, freno, pintura..."
              value={busquedaCatalogo}
              onChange={e => setBusquedaCatalogo(e.target.value)}
            />
            {coincidenciasCatalogo.length > 0 && (
              <div className="rounded-lg border bg-white divide-y max-h-48 overflow-y-auto">
                {coincidenciasCatalogo.map(item => {
                  const precio = item.precio_verificado ?? item.precio_base ?? 0;
                  return (
                    <button type="button" key={item.id} onClick={() => seleccionarCatalogo(item)}
                      className="w-full text-left px-3 py-2 hover:bg-red-50">
                      <span className="block text-xs font-medium text-gray-800">{item.descripcion}</span>
                      <span className="text-[11px] text-gray-500">{item.rubro} · Sugerido: ${precio.toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {form.catalogo_precio_id && (
              <p className="text-[11px] text-green-700">Precio sugerido desde el catálogo: ${(form.precio_sugerido || 0).toFixed(2)}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Descripción *</label>
              <Input placeholder="Ej: Cambio de aceite, Pastillas de freno..." value={form.descripcion} onChange={e => handleChange("descripcion", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo</label>
              <Select value={form.tipo} onValueChange={v => handleChange("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Técnico</label>
              <Select value={form.tecnico_nombre} onValueChange={v => handleChange("tecnico_nombre", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar técnico" /></SelectTrigger>
                <SelectContent>
                  {tecnicos.map(e => <SelectItem key={e.id} value={e.nombre_completo}>{e.nombre_completo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Cantidad</label>
                <Input type="number" min="1" value={form.cantidad} onChange={e => handleChange("cantidad", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Precio unit.</label>
                <Input type="number" min="0" step="0.01" value={form.precio_unitario} onChange={e => handleChange("precio_unitario", e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium text-gray-700">Subtotal: <span className="text-[#E31E24] font-bold">${calcSubtotal(form).toFixed(2)}</span></span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-[#E31E24] hover:bg-[#B71C1C]">
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {trabajos.length === 0 && !showForm && (
          <div className="text-center py-10 text-gray-400">
            <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay trabajos registrados</p>
          </div>
        )}
        {trabajosOrdenados.map(t => (
          <div key={t.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-gray-900">{t.descripcion}</span>
                <Badge className="text-xs bg-gray-200 text-gray-700">{t.tipo}</Badge>
              </div>
              {t.tecnico_nombre && <p className="text-xs text-gray-500 mt-0.5">Técnico: {t.tecnico_nombre}</p>}
              <p className="text-xs text-gray-500">{t.cantidad} × ${(t.precio_unitario || 0).toFixed(2)} = <span className="font-semibold text-gray-800">${(t.subtotal || 0).toFixed(2)}</span></p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => abrirRevision(t)}>
                <ShieldCheck className="w-3 h-3" /> Revisar
              </Button>
              <Select value={t.estado} onValueChange={v => handleEstado(t, v)}>
                <SelectTrigger className="h-7 text-xs w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="En Proceso">En Proceso</SelectItem>
                  <SelectItem value="Completado">Completado</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(t)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {trabajos.length > 0 && (
        <div className="mt-4 bg-gray-900 text-white rounded-xl p-4 flex justify-between items-center">
          <span className="text-sm font-medium">Total trabajos</span>
          <span className="text-xl font-bold">${total.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}