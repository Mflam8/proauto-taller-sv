import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ClipboardList, Plus, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const estadoConfig = {
  "Recibido": "bg-gray-100 text-gray-700",
  "En Diagnóstico": "bg-blue-100 text-blue-700",
  "Esperando Repuestos": "bg-yellow-100 text-yellow-700",
  "En Reparación": "bg-orange-100 text-orange-700",
  "Control de Calidad": "bg-purple-100 text-purple-700",
  "Completado": "bg-green-100 text-green-700",
  "Entregado": "bg-slate-100 text-slate-700",
};

export default function OrdenesTrabajos() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: ordenes = [], isLoading } = useQuery({
    queryKey: ["ordenes"],
    queryFn: () => base44.entities.OrdenTrabajo.list("-created_date", 100),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: vehiculos = [] } = useQuery({
    queryKey: ["vehiculos"],
    queryFn: () => base44.entities.Vehiculo.list(),
  });

  const clienteMap = Object.fromEntries(clientes.map((c) => [c.id, c]));
  const vehiculoMap = Object.fromEntries(vehiculos.map((v) => [v.id, v]));

  const filtered = ordenes.filter((o) => {
    const cliente = clienteMap[o.cliente_id];
    const vehiculo = vehiculoMap[o.vehiculo_id];
    const term = search.toLowerCase();
    return (
      o.numero_orden?.toLowerCase().includes(term) ||
      cliente?.nombre_completo?.toLowerCase().includes(term) ||
      vehiculo?.placa?.toLowerCase().includes(term) ||
      vehiculo?.marca?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h1>
            <p className="text-sm text-gray-500">{ordenes.length} órdenes registradas</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por número, cliente, placa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <ClipboardList className="w-12 h-12 opacity-30" />
          <p className="text-lg font-medium">No hay órdenes de trabajo</p>
          <p className="text-sm">Las órdenes se crean desde los Expedientes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Orden</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Vehículo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Progreso</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entrega Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((orden) => {
                const cliente = clienteMap[orden.cliente_id];
                const vehiculo = vehiculoMap[orden.vehiculo_id];
                return (
                  <tr key={orden.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#E31E24] text-sm">
                      {orden.numero_orden || `#${orden.id.slice(-6).toUpperCase()}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {cliente?.nombre_completo || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa})` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${estadoConfig[orden.estado] || "bg-gray-100 text-gray-600"}`}>
                        {orden.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#E31E24] rounded-full transition-all"
                            style={{ width: `${orden.progreso_porcentaje || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{orden.progreso_porcentaje || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {orden.fecha_estimada_entrega
                        ? new Date(orden.fecha_estimada_entrega).toLocaleDateString("es-SV")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}