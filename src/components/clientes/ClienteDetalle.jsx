import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, FileText, Car, DollarSign, Calendar } from "lucide-react";

export default function ClienteDetalle({ cliente }) {
  const { data: vehiculos = [] } = useQuery({
    queryKey: ['vehiculos-cliente', cliente.id],
    queryFn: () => base44.entities.Vehiculo.filter({ cliente_id: cliente.id }),
    initialData: [],
  });

  const { data: ordenes = [] } = useQuery({
    queryKey: ['ordenes-cliente', cliente.id],
    queryFn: () => base44.entities.OrdenTrabajo.filter({ cliente_id: cliente.id }),
    initialData: [],
  });

  const { data: facturas = [] } = useQuery({
    queryKey: ['facturas-cliente', cliente.id],
    queryFn: () => base44.entities.Factura.filter({ cliente_id: cliente.id }),
    initialData: [],
  });

  const { data: expedientes = [] } = useQuery({
    queryKey: ['expedientes-cliente', cliente.id],
    queryFn: () => base44.entities.Expediente.filter({ cliente_id: cliente.id }),
    initialData: [],
  });

  const totalFacturado = facturas.reduce((sum, f) => sum + (f.total || 0), 0);
  const totalPagado = facturas.reduce((sum, f) => sum + (f.monto_pagado || 0), 0);
  const saldoPendiente = facturas.reduce((sum, f) => sum + (f.saldo_pendiente || 0), 0);

  const expedientesOrdenados = [...expedientes].sort((a, b) =>
    new Date(b.fecha_ingreso || b.created_date) - new Date(a.fecha_ingreso || a.created_date)
  );
  const facturasOrdenadas = [...facturas].sort((a, b) =>
    new Date(b.fecha_emision || b.created_date) - new Date(a.fecha_emision || a.created_date)
  );

  const estadoPagoColor = {
    'Pagada': 'bg-green-100 text-green-800',
    'Pendiente': 'bg-red-100 text-red-800',
    'Parcial': 'bg-yellow-100 text-yellow-800',
    'Vencida': 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="space-y-6">
      {/* Información Personal */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] text-white rounded-t-lg">
          <CardTitle className="text-xl">Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nombre Completo</p>
              <p className="font-semibold text-gray-900">{cliente.nombre_completo}</p>
            </div>
            {cliente.dui && (
              <div>
                <p className="text-sm text-gray-500 mb-1">DUI</p>
                <p className="font-semibold text-gray-900">{cliente.dui}</p>
              </div>
            )}
            {cliente.nit && (
              <div>
                <p className="text-sm text-gray-500 mb-1">NIT</p>
                <p className="font-semibold text-gray-900">{cliente.nit}</p>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {cliente.telefono && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-[#E31E24]" />
                <span className="text-gray-900">{cliente.telefono}</span>
              </div>
            )}
            {cliente.email && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-[#E31E24]" />
                <span className="text-gray-900">{cliente.email}</span>
              </div>
            )}
            {cliente.direccion && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-[#E31E24]" />
                <span className="text-gray-900">{cliente.direccion}</span>
              </div>
            )}
          </div>

          {cliente.notas && (
            <div className="pt-2">
              <p className="text-sm text-gray-500 mb-1">Notas</p>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{cliente.notas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Vehículos</p>
                <p className="text-3xl font-bold text-gray-900">{vehiculos.length}</p>
              </div>
              <Car className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Órdenes</p>
                <p className="text-3xl font-bold text-gray-900">{ordenes.length}</p>
              </div>
              <FileText className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Facturado</p>
                <p className="text-2xl font-bold text-gray-900">${totalFacturado.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehículos */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Vehículos Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehiculos.length > 0 ? (
            <div className="space-y-3">
              {vehiculos.map((vehiculo) => (
                <div key={vehiculo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {vehiculo.marca?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {vehiculo.marca} {vehiculo.modelo}
                      </p>
                      <p className="text-sm text-gray-600">Placa: {vehiculo.placa}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{vehiculo.anio}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay vehículos registrados</p>
          )}
        </CardContent>
      </Card>

      {/* Historial de Servicios (Expedientes) */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Historial de Servicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expedientesOrdenados.length > 0 ? (
            <div className="space-y-3">
              {expedientesOrdenados.slice(0, 8).map((exp) => {
                const vehiculo = vehiculos.find(v => v.id === exp.vehiculo_id);
                return (
                  <div key={exp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {exp.numero_expediente || `EXP-${exp.id.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {exp.motivo_visita || "Sin motivo registrado"}
                        {vehiculo && ` · ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa})`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {exp.fecha_ingreso ? new Date(exp.fecha_ingreso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 whitespace-nowrap">{exp.estado_interno}</Badge>
                  </div>
                );
              })}
            </div>
          ) : ordenes.length > 0 ? (
            <div className="space-y-3">
              {ordenes.slice(0, 5).map((orden) => (
                <div key={orden.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Orden #{orden.numero_orden || orden.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(orden.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">{orden.estado}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay servicios registrados</p>
          )}
        </CardContent>
      </Card>

      {/* Facturas del Cliente */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Facturas del Cliente ({facturas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facturasOrdenadas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Factura</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Pagado</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Saldo</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {facturasOrdenadas.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        {f.numero_factura || f.legacy_invoice_number || `#${f.id.slice(0, 8)}`}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        {f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-gray-900">${(f.total || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-green-600">${(f.monto_pagado || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-red-600">${(f.saldo_pendiente || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge className={estadoPagoColor[f.estado_pago] || 'bg-gray-100 text-gray-700'}>{f.estado_pago}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 font-bold">
                    <td className="py-3 px-3 text-gray-900" colSpan={2}>Totales</td>
                    <td className="py-3 px-3 text-right text-gray-900">${totalFacturado.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-green-600">${totalPagado.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-red-600">${saldoPendiente.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay facturas registradas para este cliente</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}