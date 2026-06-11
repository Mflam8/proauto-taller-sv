import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Car, DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import VehiculosEnTaller from "@/components/tablero/VehiculosEnTaller";
import PagosDia from "@/components/tablero/PagosDia";
import ExpedienteForm from "@/components/expedientes/ExpedienteForm";
import PagoRapidoForm from "@/components/tablero/PagoRapidoForm";

const logoUrl = "https://media.base44.com/images/public/691be028b7c98b3edbc7aec7/d4efbb649_paletadecoloresproauto1ai.png";

const ESTADOS_ACTIVOS = [
  "Recibido", "En Diagnóstico", "Esperando Aprobación", "Aprobado",
  "En Reparación", "Esperando Repuesto", "En Pintura", "En Lavado", "Listo para Entrega"
];

export default function TableroDiario() {
  const [showExpedienteForm, setShowExpedienteForm] = useState(false);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const qc = useQueryClient();

  const { data: expedientes = [], isLoading: loadingExp } = useQuery({
    queryKey: ["expedientes-tablero"],
    queryFn: () => base44.entities.Expediente.list("-fecha_ingreso"),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: vehiculos = [] } = useQuery({
    queryKey: ["vehiculos"],
    queryFn: () => base44.entities.Vehiculo.list(),
  });

  const { data: pagos = [], isLoading: loadingPagos } = useQuery({
    queryKey: ["pagos-tablero"],
    queryFn: () => base44.entities.Pago.list("-fecha_pago"),
  });

  const { data: facturas = [] } = useQuery({
    queryKey: ["facturas"],
    queryFn: () => base44.entities.Factura.list(),
  });

  const updateExpediente = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expediente.update(id, data),
    onSuccess: () => qc.invalidateQueries(["expedientes-tablero"]),
  });

  // Datos derivados
  const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c]));
  const vehiculoMap = Object.fromEntries(vehiculos.map(v => [v.id, v]));
  const facturaMap = Object.fromEntries(facturas.map(f => [f.id, f]));

  const vehiculosEnTaller = expedientes.filter(e => ESTADOS_ACTIVOS.includes(e.estado_interno));

  const pagosHoy = pagos.filter(p => {
    if (!p.fecha_pago) return false;
    try { return isToday(parseISO(p.fecha_pago)); } catch { return false; }
  });

  const fechaHoy = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full border border-gray-100 overflow-hidden flex items-center justify-center shadow-sm">
              <img src={logoUrl} alt="PROAUTO" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Tablero Diario</h1>
              <p className="text-xs text-gray-500 capitalize">{fechaHoy}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Contador */}
            <div className="flex items-center gap-2 bg-[#C0392B]/10 text-[#C0392B] px-3 py-2 rounded-lg text-sm font-semibold">
              <Car className="w-4 h-4" />
              <span>{vehiculosEnTaller.length} en taller</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-semibold">
              <DollarSign className="w-4 h-4" />
              <span>${pagosHoy.reduce((s, p) => s + (p.monto || 0), 0).toFixed(2)} hoy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* SECCIÓN 1 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-[#C0392B] rounded-full" />
              <h2 className="text-lg font-bold text-gray-900">Vehículos en Taller</h2>
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                {vehiculosEnTaller.length}
              </span>
            </div>
            <Button
              onClick={() => setShowExpedienteForm(true)}
              className="bg-[#C0392B] hover:bg-[#a93226] text-white gap-2 text-sm"
              size="sm"
            >
              <Plus className="w-4 h-4" /> Nuevo ingreso
            </Button>
          </div>
          <VehiculosEnTaller
            expedientes={vehiculosEnTaller}
            clienteMap={clienteMap}
            vehiculoMap={vehiculoMap}
            onUpdate={(id, data) => updateExpediente.mutate({ id, data })}
            loading={loadingExp}
          />
        </section>

        {/* SECCIÓN 2 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-500 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900">Pagos del Día</h2>
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                {pagosHoy.length}
              </span>
            </div>
            <Button
              onClick={() => setShowPagoForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-sm"
              size="sm"
            >
              <Plus className="w-4 h-4" /> Registrar pago
            </Button>
          </div>
          <PagosDia
            pagos={pagosHoy}
            clienteMap={clienteMap}
            facturaMap={facturaMap}
            loading={loadingPagos}
          />
        </section>
      </div>

      {/* Modales */}
      <ExpedienteForm
        open={showExpedienteForm}
        onClose={() => setShowExpedienteForm(false)}
        clientes={clientes}
        vehiculos={vehiculos}
        onSave={() => { qc.invalidateQueries(["expedientes-tablero"]); setShowExpedienteForm(false); }}
      />

      {showPagoForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Registrar Pago</h3>
              <button onClick={() => setShowPagoForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-6">
              <PagoRapidoForm
                onSave={() => { qc.invalidateQueries(["pagos-tablero"]); setShowPagoForm(false); }}
                onCancel={() => setShowPagoForm(false)}
                facturas={facturas}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}