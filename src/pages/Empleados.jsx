import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, UserCircle, Phone, Mail, Wrench } from "lucide-react";
import { motion } from "framer-motion";

const TIPOS = ["Recepción", "Técnico", "Administración", "Gerencia", "Carwash", "Pintura", "Otro"];

const tipoColor = {
  "Técnico": "bg-blue-100 text-blue-800",
  "Recepción": "bg-green-100 text-green-800",
  "Administración": "bg-purple-100 text-purple-800",
  "Gerencia": "bg-red-100 text-red-800",
  "Carwash": "bg-cyan-100 text-cyan-800",
  "Pintura": "bg-orange-100 text-orange-800",
  "Otro": "bg-gray-100 text-gray-800",
};

const empty = { nombre_completo: "", telefono: "", email: "", cargo: "", tipo: "Técnico", especialidad: "", fecha_ingreso: "", dui: "", activo: true, notas: "" };

export default function Empleados() {
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const qc = useQueryClient();

  const { data: empleados = [] } = useQuery({
    queryKey: ["empleados"],
    queryFn: () => base44.entities.Empleado.list("-created_date"),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Empleado.update(editing.id, data)
      : base44.entities.Empleado.create(data),
    onSuccess: () => { qc.invalidateQueries(["empleados"]); setShowForm(false); setEditing(null); setForm(empty); },
  });

  const toggleActivoMutation = useMutation({
    mutationFn: ({ id, activo }) => base44.entities.Empleado.update(id, { activo }),
    onSuccess: () => qc.invalidateQueries(["empleados"]),
  });

  const openNew = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (e) => { setEditing(e); setForm({ ...e }); setShowForm(true); };

  const filtered = empleados.filter(e => {
    const matchSearch = e.nombre_completo?.toLowerCase().includes(search.toLowerCase()) ||
      e.cargo?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filtroTipo === "Todos" || e.tipo === filtroTipo;
    return matchSearch && matchTipo;
  });

  const activos = empleados.filter(e => e.activo).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
          <p className="text-gray-500 text-sm">{activos} activos · {empleados.length} total</p>
        </div>
        <Button onClick={openNew} className="bg-[#E31E24] hover:bg-[#B71C1C] gap-2">
          <Plus className="w-4 h-4" /> Nuevo Empleado
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Buscar por nombre o cargo..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos los tipos</SelectItem>
            {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((emp, i) => (
          <motion.div
            key={emp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition-shadow ${!emp.activo ? "opacity-60" : ""}`}
            onClick={() => openEdit(emp)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{emp.nombre_completo?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{emp.nombre_completo}</p>
                  <p className="text-xs text-gray-500">{emp.cargo || "Sin cargo"}</p>
                </div>
              </div>
              <Badge className={tipoColor[emp.tipo] || tipoColor["Otro"]}>{emp.tipo}</Badge>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              {emp.telefono && <p className="flex items-center gap-2"><Phone className="w-3 h-3" />{emp.telefono}</p>}
              {emp.email && <p className="flex items-center gap-2"><Mail className="w-3 h-3" />{emp.email}</p>}
              {emp.especialidad && <p className="flex items-center gap-2"><Wrench className="w-3 h-3" />{emp.especialidad}</p>}
            </div>
            {!emp.activo && <p className="mt-2 text-xs text-red-500 font-medium">Inactivo</p>}
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No se encontraron empleados</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) { setEditing(null); setForm(empty); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Nombre completo *</Label>
                <Input value={form.nombre_completo} onChange={e => setForm({ ...form, nombre_completo: e.target.value })} />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} placeholder="Ej: Mecánico, Recepcionista" />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Especialidad</Label>
                <Input value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })} placeholder="Ej: Frenos, Motor" />
              </div>
              <div>
                <Label>DUI</Label>
                <Input value={form.dui} onChange={e => setForm({ ...form, dui: e.target.value })} />
              </div>
              <div>
                <Label>Fecha de ingreso</Label>
                <Input type="date" value={form.fecha_ingreso} onChange={e => setForm({ ...form, fecha_ingreso: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Notas / Observaciones</Label>
                <Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              {editing && (
                <Button
                  variant="outline"
                  className={form.activo ? "text-red-600 border-red-200" : "text-green-600 border-green-200"}
                  onClick={() => { toggleActivoMutation.mutate({ id: editing.id, activo: !editing.activo }); setShowForm(false); }}
                >
                  {form.activo ? "Marcar Inactivo" : "Reactivar"}
                </Button>
              )}
              <Button className="flex-1 bg-[#E31E24] hover:bg-[#B71C1C]" onClick={() => saveMutation.mutate(form)}>
                {editing ? "Guardar Cambios" : "Crear Empleado"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}