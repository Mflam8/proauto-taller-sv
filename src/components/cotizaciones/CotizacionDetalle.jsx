import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Car, FileText, Calendar, DollarSign, CheckCircle, XCircle, Download } from "lucide-react";

export default function CotizacionDetalle({ cotizacion }) {
  const queryClient = useQueryClient();

  const { data: cliente } = useQuery({
    queryKey: ['cliente', cotizacion.cliente_id],
    queryFn: async () => {
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.id === cotizacion.cliente_id);
    },
  });

  const { data: vehiculo } = useQuery({
    queryKey: ['vehiculo', cotizacion.vehiculo_id],
    queryFn: async () => {
      const vehiculos = await base44.entities.Vehiculo.list();
      return vehiculos.find(v => v.id === cotizacion.vehiculo_id);
    },
  });

  const aprobarMutation = useMutation({
    mutationFn: (metodo) => base44.entities.Cotizacion.update(cotizacion.id, {
      estado: 'Aprobada',
      fecha_aprobacion: new Date().toISOString(),
      metodo_aprobacion: metodo
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
    },
  });

  const rechazarMutation = useMutation({
    mutationFn: () => base44.entities.Cotizacion.update(cotizacion.id, {
      estado: 'Rechazada'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
    },
  });

  const handleAprobar = (metodo) => {
    if (window.confirm(`¿Aprobar esta cotización por ${metodo}?`)) {
      aprobarMutation.mutate(metodo);
    }
  };

  const handleRechazar = () => {
    if (window.confirm('¿Está seguro de rechazar esta cotización?')) {
      rechazarMutation.mutate();
    }
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Aprobada': 'bg-green-100 text-green-800',
      'Rechazada': 'bg-red-100 text-red-800',
      'Vencida': 'bg-gray-100 text-gray-800'
    };
    return colors[estado] || colors['Pendiente'];
  };

  return (
    <div className="space-y-6">
      {/* Header con Estado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            COT-{cotizacion.numero_cotizacion}
          </h2>
          <p className="text-gray-600">
            Creada: {new Date(cotizacion.created_date).toLocaleDateString()}
          </p>
        </div>
        <Badge className={`${getEstadoColor(cotizacion.estado)} text-lg px-4 py-2`}>
          {cotizacion.estado}
        </Badge>
      </div>

      {/* Información del Cliente y Vehículo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {cliente && (
              <div className="space-y-2">
                <p className="font-bold text-lg text-gray-900">{cliente.nombre_completo}</p>
                {cliente.telefono && <p className="text-gray-600">📞 {cliente.telefono}</p>}
                {cliente.email && <p className="text-gray-600">📧 {cliente.email}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="w-5 h-5" />
              Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {vehiculo && (
              <div className="space-y-2">
                <p className="font-bold text-lg text-gray-900">
                  {vehiculo.marca} {vehiculo.modelo}
                </p>
                <p className="text-gray-600">Placa: {vehiculo.placa}</p>
                <p className="text-gray-600">Año: {vehiculo.anio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Servicios */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Servicios Cotizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cotizacion.servicios?.map((servicio, index) => (
              <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{servicio.nombre}</p>
                  {servicio.descripcion && (
                    <p className="text-sm text-gray-600 mt-1">{servicio.descripcion}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">${servicio.precio?.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Totales */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-lg">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-semibold text-gray-900">
                ${cotizacion.subtotal?.toFixed(2)}
              </span>
            </div>

            {cotizacion.descuento > 0 && (
              <div className="flex items-center justify-between text-lg">
                <span className="text-gray-700">Descuento:</span>
                <span className="font-semibold text-red-600">
                  -${cotizacion.descuento?.toFixed(2)}
                </span>
              </div>
            )}

            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-900">Total:</span>
                <span className="text-4xl font-bold text-[#E31E24]">
                  ${cotizacion.total?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información Adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="font-semibold text-gray-900">Vigencia</span>
            </div>
            <p className="text-gray-600">{cotizacion.vigencia_dias || 15} días</p>
          </CardContent>
        </Card>

        {cotizacion.fecha_aprobacion && (
          <Card className="border-0 shadow-md bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900">Aprobación</span>
              </div>
              <p className="text-gray-600">
                {new Date(cotizacion.fecha_aprobacion).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Método: {cotizacion.metodo_aprobacion}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notas */}
      {cotizacion.notas && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{cotizacion.notas}</p>
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      {cotizacion.estado === 'Pendiente' && (
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={() => handleAprobar('Digital')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            disabled={aprobarMutation.isPending}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Aprobar Digital
          </Button>
          <Button
            onClick={() => handleAprobar('Física')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={aprobarMutation.isPending}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Aprobar Física
          </Button>
          <Button
            onClick={handleRechazar}
            variant="outline"
            className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
            disabled={rechazarMutation.isPending}
          >
            <XCircle className="w-5 h-5 mr-2" />
            Rechazar
          </Button>
        </div>
      )}
    </div>
  );
}