import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Car, User, Clock, Phone, FolderOpen, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ExpedienteForm from "./ExpedienteForm";

const ESTADOS = [
  "Recibido", "En Diagnóstico", "Esperando Aprobación", "Aprobado",
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

export default function ExpedienteDetalle({ expediente, cliente, vehiculo, onBack, onUpdate }) {
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const updateEstado = async (nuevoEstado) => {
    setSaving(true);
    await base44.entities.Expediente.update(expediente.id, { estado_interno: nuevoEstado });
    setSaving(false);
    qc.invalidateQueries(["expedientes"]);
    onUpdate();
  };

  const InfoRow = ({ label, value }) => value ? (
    <div className="flex justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-xs">{value}</span>
    </div>
  ) : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-5 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a Expedientes
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#E31E24]/10 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-[#E31E24]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {expediente.numero_expediente || `EXP-${expediente.id?.slice(-6)?.toUpperCase()}`}
            </h1>
            <p className="text-sm text-gray-500">{expediente.motivo_visita}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={estadoColor[expediente.estado_interno] || "bg-gray-100 text-gray-800"}>
            {expediente.estado_interno}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1">
            <Edit2 className="w-3 h-3" /> Editar
          </Button>
        </div>
      </div>

      {/* Cambiar estado */}
      <div className="bg-white rounded-xl border p-4 mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Cambiar Estado</p>
        <Select value={expediente.estado_interno} onValueChange={updateEstado} disabled={saving}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cliente */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-[#E31E24]" />
            <h3 className="font-semibold text-gray-800">Cliente</h3>
          </div>
          <InfoRow label="Nombre" value={cliente?.nombre_completo} />
          <InfoRow label="Teléfono" value={cliente?.telefono} />
          <InfoRow label="WhatsApp" value={cliente?.whatsapp} />
          <InfoRow label="Tipo" value={cliente?.tipo_cliente} />
        </div>

        {/* Vehículo */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-4 h-4 text-[#E31E24]" />
            <h3 className="font-semibold text-gray-800">Vehículo</h3>
          </div>
          <InfoRow label="Vehículo" value={vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio || ""}` : null} />
          <InfoRow label="Placa" value={vehiculo?.placa} />
          <InfoRow label="Color" value={vehiculo?.color} />
          <InfoRow label="Km entrada" value={expediente.kilometraje_entrada ? `${expediente.kilometraje_entrada} km` : null} />
        </div>

        {/* Tiempos */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#E31E24]" />
            <h3 className="font-semibold text-gray-800">Tiempos</h3>
          </div>
          <InfoRow label="Ingreso" value={expediente.fecha_ingreso ? format(new Date(expediente.fecha_ingreso), "dd MMM yyyy HH:mm", { locale: es }) : null} />
          <InfoRow label="Promesa entrega" value={expediente.fecha_promesa_entrega ? format(new Date(expediente.fecha_promesa_entrega), "dd MMM yyyy HH:mm", { locale: es }) : "No definida"} />
          <InfoRow label="Salida real" value={expediente.fecha_salida ? format(new Date(expediente.fecha_salida), "dd MMM yyyy HH:mm", { locale: es }) : "—"} />
        </div>

        {/* Detalles */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-[#E31E24]" />
            <h3 className="font-semibold text-gray-800">Detalles</h3>
          </div>
          <InfoRow label="Síntomas" value={expediente.sintomas_cliente} />
          <InfoRow label="Indicaciones" value={expediente.indicaciones_cliente} />
          <InfoRow label="Llaves" value={expediente.llaves_cantidad ? `${expediente.llaves_cantidad} llave(s)` : null} />
          <InfoRow label="Observaciones" value={expediente.observaciones} />
        </div>

        {/* Estado financiero */}
        <div className="bg-white rounded-xl border p-4 md:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-3">Estado Financiero</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Total cobrado</p>
              <p className="text-xl font-bold text-gray-900">${(expediente.total_cobrado || 0).toFixed(2)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Total pagado</p>
              <p className="text-xl font-bold text-green-700">${(expediente.total_pagado || 0).toFixed(2)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Saldo pendiente</p>
              <p className="text-xl font-bold text-red-700">${(expediente.saldo_pendiente || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <ExpedienteForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        expediente={expediente}
        clientes={cliente ? [cliente] : []}
        vehiculos={vehiculo ? [vehiculo] : []}
        onSave={() => { setEditOpen(false); onUpdate(); }}
      />
    </div>
  );
}