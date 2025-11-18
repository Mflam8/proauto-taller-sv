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

  const totalFacturado = facturas.reduce((sum, f) => sum + (f.total || 0), 0);

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

      {/* Historial Reciente */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Historial Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordenes.length > 0 ? (
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
            <p className="text-center text-gray-500 py-8">No hay órdenes registradas</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}