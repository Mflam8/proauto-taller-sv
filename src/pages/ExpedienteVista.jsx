import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FolderOpen, Car, User, ClipboardList, Stethoscope, Wrench, DollarSign, PackageMinus, TruckIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import InspeccionForm from "@/components/inspeccion/InspeccionForm";
import DiagnosticoForm from "@/components/diagnostico/DiagnosticoForm";
import TrabajosTab from "@/components/trabajos/TrabajosTab";
import CajaChicaTab from "@/components/caja/CajaChicaTab";
import CierreTab from "@/components/cierre/CierreTab";

const TABS = [
  { id: "resumen", label: "Resumen", icon: FolderOpen },
  { id: "inspeccion", label: "Inspección", icon: ClipboardList },
  { id: "diagnostico", label: "Diagnóstico", icon: Stethoscope },
  { id: "trabajos", label: "Trabajos", icon: Wrench },
  { id: "caja", label: "Caja", icon: DollarSign },
  { id: "cierre", label: "Cierre", icon: TruckIcon },
];

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

export default function ExpedienteVista() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("resumen");

  const { data: expediente, isLoading } = useQuery({
    queryKey: ["expediente", id],
    queryFn: () => base44.entities.Expediente.filter({ id }),
    select: data => data[0],
  });

  const { data: cliente } = useQuery({
    queryKey: ["cliente", expediente?.cliente_id],
    queryFn: () => base44.entities.Cliente.filter({ id: expediente.cliente_id }),
    select: data => data[0],
    enabled: !!expediente?.cliente_id,
  });

  const { data: vehiculo } = useQuery({
    queryKey: ["vehiculo", expediente?.vehiculo_id],
    queryFn: () => base44.entities.Vehiculo.filter({ id: expediente.vehiculo_id }),
    select: data => data[0],
    enabled: !!expediente?.vehiculo_id,
  });

  const { data: empleados = [] } = useQuery({
    queryKey: ["empleados"],
    queryFn: () => base44.entities.Empleado.list(),
  });

  const { data: inspecciones = [], refetch: refetchInsp } = useQuery({
    queryKey: ["inspecciones", id],
    queryFn: () => base44.entities.Inspeccion.filter({ expediente_id: id }),
    enabled: !!id,
  });

  const { data: diagnosticos = [], refetch: refetchDiag } = useQuery({
    queryKey: ["diagnosticos", id],
    queryFn: () => base44.entities.Diagnostico.filter({ expediente_id: id }),
    enabled: !!id,
  });

  const updateEstado = async (nuevoEstado) => {
    await base44.entities.Expediente.update(id, { estado_interno: nuevoEstado });
    qc.invalidateQueries(["expediente", id]);
    qc.invalidateQueries(["expedientes"]);
  };

  if (isLoading || !expediente) {
    return <div className="p-6 text-gray-400">Cargando expediente...</div>;
  }

  const inspeccion = inspecciones[0];
  const diagnostico = diagnosticos[0];

  const InfoRow = ({ label, value }) => value ? (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-xs">{value}</span>
    </div>
  ) : null;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <button onClick={() => navigate("/Expedientes")} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver a Expedientes
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#E31E24]/10 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-[#E31E24]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {expediente.numero_expediente || `EXP-${id?.slice(-6)?.toUpperCase()}`}
            </h1>
            <p className="text-sm text-gray-500">{expediente.motivo_visita}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={estadoColor[expediente.estado_interno]}>{expediente.estado_interno}</Badge>
        </div>
      </div>

      {/* Cambiar estado */}
      <div className="bg-white border rounded-xl p-3 mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Cambiar estado:</span>
        <Select value={expediente.estado_interno} onValueChange={updateEstado}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 flex-shrink-0 justify-center py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === t.id ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="hidden sm:inline">{t.label}</span><span className="sm:hidden">{t.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* TAB: Resumen */}
      {tab === "resumen" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><User className="w-4 h-4 text-[#E31E24]" /><h3 className="font-semibold">Cliente</h3></div>
            <InfoRow label="Nombre" value={cliente?.nombre_completo} />
            <InfoRow label="Teléfono" value={cliente?.telefono} />
            <InfoRow label="WhatsApp" value={cliente?.whatsapp} />
            <InfoRow label="Tipo" value={cliente?.tipo_cliente} />
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><Car className="w-4 h-4 text-[#E31E24]" /><h3 className="font-semibold">Vehículo</h3></div>
            <InfoRow label="Vehículo" value={vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio || ""}` : null} />
            <InfoRow label="Placa" value={vehiculo?.placa} />
            <InfoRow label="Color" value={vehiculo?.color} />
            <InfoRow label="Motor" value={vehiculo?.motor} />
            <InfoRow label="Km entrada" value={expediente.kilometraje_entrada ? `${expediente.kilometraje_entrada} km` : null} />
          </div>
          <div className="bg-white border rounded-xl p-4">
            <h3 className="font-semibold mb-3">Detalles de la visita</h3>
            <InfoRow label="Síntomas" value={expediente.sintomas_cliente} />
            <InfoRow label="Indicaciones" value={expediente.indicaciones_cliente} />
            <InfoRow label="Llaves" value={expediente.llaves_cantidad ? `${expediente.llaves_cantidad} llave(s)` : null} />
            <InfoRow label="Ingreso" value={expediente.fecha_ingreso ? format(new Date(expediente.fecha_ingreso), "dd MMM yyyy HH:mm", { locale: es }) : null} />
            <InfoRow label="Promesa entrega" value={expediente.fecha_promesa_entrega ? format(new Date(expediente.fecha_promesa_entrega), "dd MMM yyyy HH:mm", { locale: es }) : "No definida"} />
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><DollarSign className="w-4 h-4 text-[#E31E24]" /><h3 className="font-semibold">Estado Financiero</h3></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Total</p><p className="font-bold">${(expediente.total_cobrado || 0).toFixed(2)}</p></div>
              <div className="bg-green-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Pagado</p><p className="font-bold text-green-700">${(expediente.total_pagado || 0).toFixed(2)}</p></div>
              <div className="bg-red-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Pendiente</p><p className="font-bold text-red-700">${(expediente.saldo_pendiente || 0).toFixed(2)}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Inspección */}
      {tab === "inspeccion" && (
        <div className="bg-white border rounded-xl p-5">
          {inspeccion ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Inspección registrada</h3>
                <Badge className="bg-green-100 text-green-800">Completada</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {[
                  ["Llantas", inspeccion.estado_llantas],
                  ["Luces", inspeccion.estado_luces],
                  ["Vidrios", inspeccion.estado_vidrios],
                  ["Pintura", inspeccion.estado_pintura],
                  ["Tapicería", inspeccion.estado_tapiceria],
                  ["A/C", inspeccion.aire_acondicionado],
                ].map(([label, val]) => val && (
                  <div key={label} className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-medium">{val}</p>
                  </div>
                ))}
              </div>
              {inspeccion.daños?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Daños ({inspeccion.daños.length})</p>
                  {inspeccion.daños.map((d, i) => (
                    <div key={i} className="flex gap-2 mb-1">
                      <Badge className="bg-red-100 text-red-800 text-xs">{d.tipo}</Badge>
                      <span className="text-sm text-gray-700">{d.ubicacion}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">Realizada por: {inspeccion.realizada_por} · {inspeccion.fecha ? format(new Date(inspeccion.fecha), "dd MMM yyyy HH:mm", { locale: es }) : ""}</p>
            </div>
          ) : (
            <InspeccionForm
              expediente={expediente}
              vehiculo={vehiculo}
              cliente={cliente}
              empleados={empleados}
              onSave={() => { refetchInsp(); qc.invalidateQueries(["expediente", id]); setTab("diagnostico"); }}
            />
          )}
        </div>
      )}

      {/* TAB: Diagnóstico */}
      {tab === "diagnostico" && (
        <div className="bg-white border rounded-xl p-5">
          {diagnostico ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Diagnóstico registrado</h3>
                <Badge className="bg-blue-100 text-blue-800">{diagnostico.estado}</Badge>
              </div>
              <p className="text-sm text-gray-500 mb-1">Técnico: <span className="font-medium text-gray-900">{diagnostico.tecnico_nombre}</span></p>
              {diagnostico.diagnostico_inicial && <div className="bg-gray-50 rounded-lg p-3 mb-3"><p className="text-xs text-gray-500 mb-1">Diagnóstico inicial</p><p className="text-sm">{diagnostico.diagnostico_inicial}</p></div>}
              {diagnostico.diagnostico_final && <div className="bg-blue-50 rounded-lg p-3 mb-3"><p className="text-xs text-gray-500 mb-1">Diagnóstico final</p><p className="text-sm">{diagnostico.diagnostico_final}</p></div>}
              {diagnostico.fallas_detectadas?.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Fallas ({diagnostico.fallas_detectadas.length})</p>
                  {diagnostico.fallas_detectadas.map((f, i) => (
                    <div key={i} className="flex gap-2 mb-1 items-center">
                      <Badge className="bg-blue-100 text-blue-800 text-xs">{f.sistema}</Badge>
                      <span className="text-sm text-gray-700 flex-1">{f.descripcion}</span>
                      <Badge className="text-xs">{f.severidad}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {diagnostico.recomendaciones && <div className="bg-green-50 rounded-lg p-3"><p className="text-xs text-gray-500 mb-1">Recomendaciones</p><p className="text-sm">{diagnostico.recomendaciones}</p></div>}
            </div>
          ) : (
            <DiagnosticoForm
              expediente={expediente}
              empleados={empleados}
              onSave={() => { refetchDiag(); qc.invalidateQueries(["expediente", id]); }}
            />
          )}
        </div>
      )}

      {/* TAB: Trabajos */}
      {tab === "trabajos" && (
        <div className="bg-white border rounded-xl p-5">
          <TrabajosTab expediente={expediente} empleados={empleados} />
        </div>
      )}

      {/* TAB: Caja Chica */}
      {tab === "caja" && (
        <div className="bg-white border rounded-xl p-5">
          <CajaChicaTab expediente={expediente} />
        </div>
      )}

      {/* TAB: Cierre */}
      {tab === "cierre" && (
        <div>
          <CierreTab
            expediente={expediente}
            onCerrar={() => qc.invalidateQueries(["expediente", id])}
          />
        </div>
      )}
    </div>
  );
}