import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FolderOpen, Car, User, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ExpedienteForm from "@/components/expedientes/ExpedienteForm";
import ExpedienteDetalle from "@/components/expedientes/ExpedienteDetalle";

const ESTADOS = [
  "Todos", "Recibido", "En Diagnóstico", "Esperando Aprobación", "Aprobado",
  "En Reparación", "Esperando Repuesto", "En Pintura", "En Lavado",
  "Listo para Entrega", "Entregado", "Cerrado", "Cancelado"
];

const estadoColor = {
  "Recibido": "bg-gray-100 text-gray-800",
  "En Diagnóstico": "bg-blue-100 text-blue-800",
  "Esperando Aprobación": "bg-yellow-100 text-yellow-800",
  "Aprobado": "bg-green-100 text-green-800",
  "En Reparación": "bg-orange-100 text-orange-800",
  "Esperando Repuesto": "bg-red-100 text-red-800",
  "En Pintura": "bg-purple-100 text-purple-800",
  "En Lavado": "bg-cyan-100 text-cyan-800",
  "Listo para Entrega": "bg-emerald-100 text-emerald-800",
  "Entregado": "bg-teal-100 text-teal-800",
  "Cerrado": "bg-gray-200 text-gray-600",
  "Cancelado": "bg-red-200 text-red-700",
};

export default function Expedientes() {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const qc = useQueryClient();

  const { data: expedientes = [], isLoading } = useQuery({
    queryKey: ["expedientes"],
    queryFn: () => base44.entities.Expediente.list("-created_date"),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: vehiculos = [] } = useQuery({
    queryKey: ["vehiculos"],
    queryFn: () => base44.entities.Vehiculo.list(),
  });

  const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c]));
  const vehiculoMap = Object.fromEntries(vehiculos.map(v => [v.id, v]));

  const filtered = expedientes.filter(exp => {
    const cliente = clienteMap[exp.cliente_id];
    const vehiculo = vehiculoMap[exp.vehiculo_id];
    const matchSearch =
      exp.numero_expediente?.toLowerCase().includes(search.toLowerCase()) ||
      cliente?.nombre_completo?.toLowerCase().includes(search.toLowerCase()) ||
      vehiculo?.placa?.toLowerCase().includes(search.toLowerCase()) ||
      vehiculo?.marca?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === "Todos" || exp.estado_interno === filtroEstado;
    return matchSearch && matchEstado;
  });

  // Stats
  const activos = expedientes.filter(e => !["Cerrado", "Cancelado", "Entregado"].includes(e.estado_interno)).length;
  const listos = expedientes.filter(e => e.estado_interno === "Listo para Entrega").length;

  if (selected) {
    return (
      <ExpedienteDetalle
        expediente={selected}
        cliente={clienteMap[selected.cliente_id]}
        vehiculo={vehiculoMap[selected.vehiculo_id]}
        onBack={() => setSelected(null)}
        onUpdate={() => { qc.invalidateQueries(["expedientes"]); setSelected(null); }}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expedientes</h1>
          <p className="text-gray-500 text-sm">{activos} activos · {listos} listos para entrega</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#E31E24] hover:bg-[#B71C1C] gap-2">
          <Plus className="w-4 h-4" /> Nuevo Expediente
        </Button>
      </div>

      {/* Alertas */}
      {listos > 0 && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 mb-4 text-sm font-medium">
          <AlertCircle className="w-4 h-4" />
          {listos} vehículo(s) listo(s) para entrega
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Buscar por expediente, cliente, placa..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Tabs de estado */}
      <div className="flex gap-2 flex-wrap mb-5">
        {ESTADOS.slice(0, 8).map(estado => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filtroEstado === estado ? "bg-[#E31E24] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {estado}
            {estado !== "Todos" && (
              <span className="ml-1">({expedientes.filter(e => e.estado_interno === estado).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {isLoading && <p className="text-gray-400 text-center py-8">Cargando...</p>}
        {filtered.map((exp, i) => {
          const cliente = clienteMap[exp.cliente_id];
          const vehiculo = vehiculoMap[exp.vehiculo_id];
          return (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(exp)}
              className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-[#E31E24]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-5 h-5 text-[#E31E24]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{exp.numero_expediente || `EXP-${exp.id?.slice(-6)?.toUpperCase()}`}</p>
                  <p className="text-sm text-gray-500">{exp.motivo_visita}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-3 h-3" />
                {cliente?.nombre_completo || "—"}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Car className="w-3 h-3" />
                {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} · ${vehiculo.placa}` : "—"}
              </div>
              {exp.fecha_ingreso && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {format(new Date(exp.fecha_ingreso), "dd MMM yyyy", { locale: es })}
                </div>
              )}
              <Badge className={estadoColor[exp.estado_interno] || "bg-gray-100 text-gray-800"}>
                {exp.estado_interno}
              </Badge>
            </motion.div>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No se encontraron expedientes</p>
          </div>
        )}
      </div>

      {/* Modal nuevo expediente */}
      <ExpedienteForm
        open={showForm}
        onClose={() => setShowForm(false)}
        clientes={clientes}
        vehiculos={vehiculos}
        onSave={() => { qc.invalidateQueries(["expedientes"]); setShowForm(false); }}
      />
    </div>
  );
}