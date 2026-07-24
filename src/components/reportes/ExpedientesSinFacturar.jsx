import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ExpedientesSinFacturar({ expedientes, clienteMap, vehiculoMap }) {
  const sinFactura = expedientes.filter(
    (e) => ["Entregado", "Cerrado"].includes(e.estado_interno) && e.factura_generada === false
  );

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Expedientes Sin Facturar
          {sinFactura.length > 0 && (
            <Badge className="bg-red-100 text-red-700">{sinFactura.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {sinFactura.length === 0 ? (
          <div className="flex items-center gap-2 text-green-600 py-4">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-medium">Todo en orden. Todos los expedientes entregados o cerrados tienen factura generada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Expediente</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Vehículo</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Ingreso</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sinFactura.map((e) => {
                  const cliente = clienteMap[e.cliente_id];
                  const vehiculo = vehiculoMap[e.vehiculo_id];
                  return (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-medium text-gray-900">{e.numero_expediente || "N/A"}</td>
                      <td className="py-2.5 px-3 text-gray-700">{cliente?.nombre_completo || "N/A"}</td>
                      <td className="py-2.5 px-3 text-gray-700">
                        {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : "N/A"}
                        {vehiculo?.placa && <span className="text-xs text-gray-500 ml-1">({vehiculo.placa})</span>}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        {e.fecha_ingreso ? format(new Date(e.fecha_ingreso), "dd MMM yyyy", { locale: es }) : "N/A"}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge className="bg-red-100 text-red-700">{e.estado_interno}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link to={`/Expedientes/${e.id}`} className="inline-flex items-center text-[#E31E24] hover:underline font-medium">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}