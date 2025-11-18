import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Hash, Calendar, Fuel, User, FileText, Wrench, Camera } from "lucide-react";

export default function VehiculoDetalle({ vehiculo }) {
  const { data: cliente } = useQuery({
    queryKey: ['cliente', vehiculo.cliente_id],
    queryFn: async () => {
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.id === vehiculo.cliente_id);
    },
  });

  const { data: ordenes = [] } = useQuery({
    queryKey: ['ordenes-vehiculo', vehiculo.id],
    queryFn: () => base44.entities.OrdenTrabajo.filter({ vehiculo_id: vehiculo.id }),
    initialData: [],
  });

  const { data: inspecciones = [] } = useQuery({
    queryKey: ['inspecciones-vehiculo', vehiculo.id],
    queryFn: () => base44.entities.Inspeccion.filter({ vehiculo_id: vehiculo.id }),
    initialData: [],
  });

  return (
    <div className="space-y-6">
      {/* Información del Vehículo */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="text-xl">Información del Vehículo</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Marca y Modelo</p>
              <p className="font-bold text-2xl text-gray-900">
                {vehiculo.marca} {vehiculo.modelo}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Año</p>
              <p className="font-semibold text-xl text-gray-900">{vehiculo.anio}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Hash className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Placa</p>
                <p className="font-bold text-gray-900">{vehiculo.placa}</p>
              </div>
            </div>

            {vehiculo.color && (
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" style={{ backgroundColor: vehiculo.color.toLowerCase() }}></div>
                <div>
                  <p className="text-xs text-gray-600">Color</p>
                  <p className="font-semibold text-gray-900 capitalize">{vehiculo.color}</p>
                </div>
              </div>
            )}

            {vehiculo.tipo_combustible && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Fuel className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Combustible</p>
                  <p className="font-semibold text-gray-900">{vehiculo.tipo_combustible}</p>
                </div>
              </div>
            )}
          </div>

          {vehiculo.vin && (
            <div className="pt-2">
              <p className="text-sm text-gray-500 mb-1">VIN</p>
              <p className="font-mono text-gray-900 bg-gray-50 p-3 rounded-lg">{vehiculo.vin}</p>
            </div>
          )}

          {vehiculo.kilometraje_actual > 0 && (
            <div className="pt-2">
              <p className="text-sm text-gray-500 mb-1">Kilometraje Actual</p>
              <p className="font-semibold text-gray-900">
                {vehiculo.kilometraje_actual.toLocaleString()} km
              </p>
            </div>
          )}

          {vehiculo.notas && (
            <div className="pt-2">
              <p className="text-sm text-gray-500 mb-1">Notas</p>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{vehiculo.notas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del Propietario */}
      {cliente && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Propietario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-14 h-14 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-full flex items-center justify-center text-white font-bold text-xl">
                {cliente.nombre_completo?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{cliente.nombre_completo}</p>
                <p className="text-sm text-gray-600">{cliente.telefono}</p>
                {cliente.email && <p className="text-sm text-gray-600">{cliente.email}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Órdenes de Trabajo</p>
                <p className="text-3xl font-bold text-gray-900">{ordenes.length}</p>
              </div>
              <Wrench className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Inspecciones</p>
                <p className="text-3xl font-bold text-gray-900">{inspecciones.length}</p>
              </div>
              <Camera className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Trabajos Activos</p>
                <p className="text-3xl font-bold text-gray-900">
                  {ordenes.filter(o => !['Completado', 'Entregado'].includes(o.estado)).length}
                </p>
              </div>
              <FileText className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Órdenes */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Historial de Servicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordenes.length > 0 ? (
            <div className="space-y-3">
              {ordenes.slice(0, 5).map((orden) => (
                <div key={orden.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
            <p className="text-center text-gray-500 py-8">No hay órdenes de trabajo registradas</p>
          )}
        </CardContent>
      </Card>

      {/* Inspecciones Recientes */}
      {inspecciones.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Inspecciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inspecciones.slice(0, 3).map((inspeccion) => (
                <div key={inspeccion.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{inspeccion.tipo_inspeccion}</p>
                    <Badge variant="outline">{inspeccion.estado_general}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(inspeccion.created_date).toLocaleDateString()}
                  </p>
                  {inspeccion.observaciones && (
                    <p className="text-sm text-gray-700 mt-2">{inspeccion.observaciones}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}