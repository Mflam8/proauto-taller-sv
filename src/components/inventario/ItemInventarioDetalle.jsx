import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";

export default function ItemInventarioDetalle({ item }) {
  const { data: movimientos = [] } = useQuery({
    queryKey: ['movimientos-item', item.id],
    queryFn: () => base44.entities.MovimientoInventario.filter({ item_inventario_id: item.id }),
    initialData: [],
  });

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => base44.entities.Proveedor.list(),
    initialData: [],
  });

  const proveedor = proveedores.find(p => p.id === item.proveedor_principal);
  const stockBajo = item.stock_actual <= item.stock_minimo;
  const valorStock = (item.precio_compra || 0) * (item.stock_actual || 0);

  const movimientosRecientes = movimientos.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Info Principal */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{item.nombre}</CardTitle>
              {item.codigo && (
                <p className="text-sm opacity-90 mt-1">Código: {item.codigo}</p>
              )}
            </div>
            <Badge className={`${stockBajo ? 'bg-red-500' : 'bg-green-500'} text-white border-0 text-lg px-4 py-2`}>
              {stockBajo ? <AlertCircle className="w-4 h-4 mr-1" /> : <Package className="w-4 h-4 mr-1" />}
              {stockBajo ? 'Stock Bajo' : 'Stock OK'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {item.descripcion && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Descripción</p>
                <p className="text-gray-700">{item.descripcion}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500 mb-1">Categoría</p>
              <Badge variant="outline">{item.categoria}</Badge>
            </div>

            {item.ubicacion_fisica && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Ubicación</p>
                <p className="font-semibold text-gray-900">📍 {item.ubicacion_fisica}</p>
              </div>
            )}

            {proveedor && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Proveedor Principal</p>
                <p className="font-semibold text-gray-900">{proveedor.nombre}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Actual</p>
                <p className="text-3xl font-bold text-gray-900">{item.stock_actual}</p>
              </div>
              <Package className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Mínimo</p>
                <p className="text-3xl font-bold text-gray-900">{item.stock_minimo}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Precio Venta</p>
                <p className="text-2xl font-bold text-gray-900">${(item.precio_venta || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Stock</p>
                <p className="text-xl font-bold text-gray-900">${valorStock.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movimientos Recientes */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Movimientos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {movimientosRecientes.length > 0 ? (
            <div className="space-y-3">
              {movimientosRecientes.map((mov) => (
                <div key={mov.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={
                        mov.tipo_movimiento === 'Entrada' ? 'default' : 
                        mov.tipo_movimiento === 'Salida' ? 'destructive' : 'secondary'
                      }>
                        {mov.tipo_movimiento === 'Entrada' && <TrendingUp className="w-3 h-3 mr-1" />}
                        {mov.tipo_movimiento === 'Salida' && <TrendingDown className="w-3 h-3 mr-1" />}
                        {mov.tipo_movimiento}
                      </Badge>
                      <p className="text-sm text-gray-600">
                        {new Date(mov.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-gray-900 font-medium">{mov.motivo}</p>
                    {mov.responsable && (
                      <p className="text-sm text-gray-600">Por: {mov.responsable}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      mov.tipo_movimiento === 'Entrada' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {mov.tipo_movimiento === 'Entrada' ? '+' : '-'}{mov.cantidad}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay movimientos registrados</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}