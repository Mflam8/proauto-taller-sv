import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, DollarSign, Truck, AlertCircle, ClipboardCheck, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";

const METODOS_PAGO = ["Efectivo", "Transferencia", "Tarjeta Débito", "Tarjeta Crédito", "Cheque"];

export default function CierreTab({ expediente, onCerrar }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [pago, setPago] = useState({ monto: expediente.saldo_pendiente || 0, metodo: "Efectivo", referencia: "", notas: "" });
  const [kmSalida, setKmSalida] = useState(expediente.kilometraje_salida || "");
  const [saving, setSaving] = useState(false);
  const [pagado, setPagado] = useState(false);

  // Buscar factura asociada al expediente
  const { data: facturas = [] } = useQuery({
    queryKey: ["facturas-expediente", expediente.id],
    queryFn: () => base44.entities.Factura.filter({ expediente_id: expediente.id }),
    enabled: !!expediente.id,
  });
  const factura = facturas[0];

  const listo = expediente.estado_interno === "Listo para Entrega" || expediente.estado_interno === "Entregado";
  const yaCerrado = expediente.estado_interno === "Cerrado" || expediente.estado_interno === "Entregado";
  const sinFactura = !factura && expediente.factura_generada !== true;

  const handlePagar = async () => {
    if (!pago.monto || !factura) return;
    setSaving(true);
    const montoNum = parseFloat(pago.monto);

    // 1. Crear registro de Pago vinculado a la Factura
    const currentUser = await base44.auth.me();
    await base44.entities.Pago.create({
      factura_id: factura.id,
      monto: montoNum,
      metodo_pago: pago.metodo,
      referencia: pago.referencia,
      fecha_pago: new Date().toISOString(),
      recibido_por: currentUser?.full_name || "",
      notas: pago.notas,
    });

    // 2. Actualizar Factura
    const nuevoMontoPagadoFactura = (factura.monto_pagado || 0) + montoNum;
    const nuevoSaldoFactura = factura.total - nuevoMontoPagadoFactura;
    const nuevoEstadoFactura = nuevoSaldoFactura <= 0.01 ? "Pagada" : "Parcial";
    await base44.entities.Factura.update(factura.id, {
      monto_pagado: nuevoMontoPagadoFactura,
      saldo_pendiente: Math.max(0, nuevoSaldoFactura),
      estado_pago: nuevoEstadoFactura,
    });

    // 3. Actualizar Expediente
    const nuevoTotalPagado = (expediente.total_pagado || 0) + montoNum;
    const nuevoSaldo = (expediente.total_cobrado || 0) - nuevoTotalPagado;
    await base44.entities.Expediente.update(expediente.id, {
      total_pagado: nuevoTotalPagado,
      saldo_pendiente: Math.max(0, nuevoSaldo),
    });

    qc.invalidateQueries(["expediente", expediente.id]);
    qc.invalidateQueries(["facturas-expediente", expediente.id]);
    qc.invalidateQueries(["facturas"]);
    qc.invalidateQueries(["pagos"]);
    setPagado(true);
    setSaving(false);
  };

  const handleEntregar = async () => {
    setSaving(true);
    await base44.entities.Expediente.update(expediente.id, {
      estado_interno: "Entregado",
      estado_cliente: "Entregado",
      fecha_salida: new Date().toISOString(),
      kilometraje_salida: kmSalida ? parseFloat(kmSalida) : undefined,
      trabajos_completados: true,
    });
    // Actualizar estado del vehículo
    if (expediente.vehiculo_id) {
      await base44.entities.Vehiculo.update(expediente.vehiculo_id, { estado_actual: "Entregado" });
    }
    qc.invalidateQueries(["expediente", expediente.id]);
    qc.invalidateQueries(["expedientes"]);
    setSaving(false);
    if (onCerrar) onCerrar();
  };

  const handleCerrar = async () => {
    setSaving(true);
    await base44.entities.Expediente.update(expediente.id, {
      estado_interno: "Cerrado",
      cierre_autorizado: true,
    });
    qc.invalidateQueries(["expediente", expediente.id]);
    qc.invalidateQueries(["expedientes"]);
    setSaving(false);
    if (onCerrar) onCerrar();
  };

  return (
    <div className="space-y-4">
      {/* Resumen financiero */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-[#E31E24]" />
          <h3 className="font-semibold text-gray-800">Resumen de Cobro</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">${(expediente.total_cobrado || 0).toFixed(2)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Pagado</p>
            <p className="text-lg font-bold text-green-700">${(expediente.total_pagado || 0).toFixed(2)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${(expediente.saldo_pendiente || 0) > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
            <p className="text-xs text-gray-500">Pendiente</p>
            <p className={`text-lg font-bold ${(expediente.saldo_pendiente || 0) > 0 ? "text-red-700" : "text-emerald-700"}`}>
              ${(expediente.saldo_pendiente || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Registrar pago */}
        {!yaCerrado && (expediente.saldo_pendiente || 0) > 0 && !pagado && (
          sinFactura ? (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl p-3 border border-amber-200">
                <Receipt className="w-4 h-4 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Primero genera la factura</p>
                  <p className="text-xs text-amber-600">Debes generar la factura desde el botón rojo en la parte superior del expediente antes de registrar un pago.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Registrar pago</p>
                {factura && (
                  <Badge variant="outline" className="text-xs">
                    Factura #{factura.numero_factura || factura.id.slice(0, 8)}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Monto ($)</label>
                  <Input type="number" min="0" step="0.01" value={pago.monto} onChange={e => setPago({ ...pago, monto: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Método</label>
                  <Select value={pago.metodo} onValueChange={v => setPago({ ...pago, metodo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{METODOS_PAGO.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Referencia</label>
                  <Input placeholder="# de transferencia..." value={pago.referencia} onChange={e => setPago({ ...pago, referencia: e.target.value })} />
                </div>
              </div>
              <Button onClick={handlePagar} disabled={saving} className="bg-[#E31E24] hover:bg-[#B71C1C] gap-2">
                <DollarSign className="w-4 h-4" /> Registrar Pago
              </Button>
            </div>
          )
        )}
        {pagado && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl p-3 border border-green-100">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Pago registrado correctamente</span>
          </div>
        )}
      </div>

      {/* Entrega del vehículo */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-4 h-4 text-[#E31E24]" />
          <h3 className="font-semibold text-gray-800">Entrega del Vehículo</h3>
        </div>

        {yaCerrado ? (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Vehículo {expediente.estado_interno.toLowerCase()}</span>
          </div>
        ) : (
          <>
            {!listo && (
              <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 rounded-xl p-3 border border-yellow-100 mb-3">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">El expediente debe estar en "Listo para Entrega" para proceder</span>
              </div>
            )}
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Kilometraje de salida</label>
              <Input type="number" placeholder="Kilometraje al entregar..." value={kmSalida} onChange={e => setKmSalida(e.target.value)} className="max-w-xs" />
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleEntregar} disabled={saving || !listo} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Truck className="w-4 h-4" /> Marcar como Entregado
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Cierre definitivo */}
      {expediente.estado_interno === "Entregado" && !expediente.cierre_autorizado && (
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className="w-4 h-4 text-[#E31E24]" />
            <h3 className="font-semibold text-gray-800">Cierre del Expediente</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">Al cerrar el expediente, quedará archivado definitivamente en el sistema.</p>
          <Button onClick={handleCerrar} disabled={saving} variant="outline" className="border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white gap-2">
            <ClipboardCheck className="w-4 h-4" /> Cerrar Expediente
          </Button>
        </div>
      )}

      {expediente.cierre_autorizado && (
        <div className="bg-gray-50 border rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-gray-500" />
          <div>
            <p className="font-medium text-gray-700 text-sm">Expediente Cerrado</p>
            <p className="text-xs text-gray-400">Archivado definitivamente</p>
          </div>
          <Badge className="ml-auto bg-gray-200 text-gray-700">Cerrado</Badge>
        </div>
      )}
    </div>
  );
}