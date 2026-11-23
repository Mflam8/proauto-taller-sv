import React from "react";
import { Car, DollarSign, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const InfoRow = ({ label, value }) => value ? (
  <div className="flex items-start justify-between gap-3 border-b border-gray-50 py-2 last:border-0">
    <span className="shrink-0 text-sm text-gray-500">{label}</span>
    <span className="max-w-[60%] break-words text-right text-sm font-medium text-gray-900">{value}</span>
  </div>
) : null;

export default function ResumenExpediente({ expediente, cliente, vehiculo }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center gap-2"><User className="h-4 w-4 text-[#E31E24]" /><h3 className="font-semibold">Cliente</h3></div>
        <InfoRow label="Nombre" value={cliente?.nombre_completo} />
        <InfoRow label="Teléfono" value={cliente?.telefono} />
        <InfoRow label="WhatsApp" value={cliente?.whatsapp} />
        <InfoRow label="Tipo" value={cliente?.tipo_cliente} />
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center gap-2"><Car className="h-4 w-4 text-[#E31E24]" /><h3 className="font-semibold">Vehículo</h3></div>
        {!vehiculo && (
          <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Servicio sin vehículo (pieza)
          </p>
        )}
        <InfoRow label="Vehículo" value={vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio || ""}` : null} />
        <InfoRow label="Placa" value={vehiculo?.placa} />
        <InfoRow label="Color" value={vehiculo?.color} />
        <InfoRow label="Motor" value={vehiculo?.motor} />
        <InfoRow label="Km entrada" value={expediente.kilometraje_entrada ? `${expediente.kilometraje_entrada} km` : null} />
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="mb-3 font-semibold">Detalles de la visita</h3>
        <InfoRow label="Síntomas" value={expediente.sintomas_cliente} />
        <InfoRow label="Indicaciones" value={expediente.indicaciones_cliente} />
        <InfoRow label="Llaves" value={expediente.llaves_cantidad ? `${expediente.llaves_cantidad} llave(s)` : null} />
        <InfoRow label="Ingreso" value={expediente.fecha_ingreso ? format(new Date(expediente.fecha_ingreso), "dd MMM yyyy HH:mm", { locale: es }) : null} />
        <InfoRow label="Promesa entrega" value={expediente.fecha_promesa_entrega ? format(new Date(expediente.fecha_promesa_entrega), "dd MMM yyyy HH:mm", { locale: es }) : "No definida"} />
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4 text-[#E31E24]" /><h3 className="font-semibold">Estado financiero</h3></div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-gray-50 p-2 text-center">
            <p className="text-[11px] text-gray-500">Total</p>
            <p className="break-words text-sm font-bold">${(expediente.total_cobrado || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-2 text-center">
            <p className="text-[11px] text-gray-500">Pagado</p>
            <p className="break-words text-sm font-bold text-green-700">${(expediente.total_pagado || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-2 text-center">
            <p className="text-[11px] text-gray-500">Pendiente</p>
            <p className="break-words text-sm font-bold text-red-700">${(expediente.saldo_pendiente || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}