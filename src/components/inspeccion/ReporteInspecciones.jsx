import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Wrench, AlertCircle, CheckCircle, Package } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function MetricCard({ icon: Icon, label, value, sub, color }) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function ReporteInspecciones({
  inspecciones,
  expedientes,
  vehiculos,
  clientes,
  trabajos,
  vehiculoMap,
  clienteMap,
  expedienteMap,
  inspSemana,
  inspMes,
  inspTrimestre,
  inspAnio,
  vehiculosRecibidos,
  diasPromedio,
  totalPagado,
  ticketPromedio,
  expedientesConRepuesto,
  expedientesSinRepuesto,
  inspeccionesConDaños,
  totalDaños,
  topModelos,
  trabajosPorTipo,
}) {
  // Todos los modelos (no solo top 6)
  const todosModelos = Object.entries(
    expedientes.reduce((acc, e) => {
      const v = vehiculoMap[e.vehiculo_id];
      if (v?.modelo) acc[v.modelo] = (acc[v.modelo] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  // Vehículos recibidos expandido: lista de expedientes con datos del vehículo y cliente
  const vehiculosRecibidosLista = expedientes
    .map(e => {
      const v = vehiculoMap[e.vehiculo_id];
      const c = clienteMap[e.cliente_id];
      return { expediente: e, vehiculo: v, cliente: c };
    })
    .sort((a, b) => new Date(b.expediente.fecha_ingreso) - new Date(a.expediente.fecha_ingreso));

  // Trabajos expandido: agrupar por tipo y luego listar cada trabajo
  const trabajosPorTipoExpandido = Object.entries(
    trabajos.reduce((acc, t) => {
      const tipo = t.tipo || "Otro";
      if (!acc[tipo]) acc[tipo] = [];
      acc[tipo].push(t);
      return acc;
    }, {})
  ).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-6">
      {/* Métricas expandidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <MetricCard icon={Car} label="Vehículos recibidos" value={vehiculosRecibidos} color="bg-blue-500" />
        <MetricCard icon={CheckCircle} label="Días promedio en taller" value={diasPromedio} color="bg-orange-500" />
        <MetricCard icon={Package} label="Total pagado" value={`$${totalPagado.toFixed(0)}`} color="bg-green-500" />
        <MetricCard icon={Package} label="Ticket promedio" value={`$${ticketPromedio.toFixed(0)}`} color="bg-emerald-600" />
        <MetricCard icon={Package} label="Con repuestos" value={expedientesConRepuesto} color="bg-purple-500" />
        <MetricCard icon={Wrench} label="Sin repuestos" value={expedientesSinRepuesto} color="bg-gray-500" />
        <MetricCard icon={AlertCircle} label="Con daños al recibir" value={inspeccionesConDaños} sub={`${totalDaños} daños registrados`} color="bg-red-500" />
        <MetricCard icon={CheckCircle} label="Inspecciones totales" value={inspecciones.length} color="bg-indigo-500" />
      </div>

      {/* Por periodo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Car} label="Esta semana" value={inspSemana} color="bg-blue-500" />
        <MetricCard icon={Car} label="Este mes" value={inspMes} color="bg-emerald-500" />
        <MetricCard icon={Car} label="Este trimestre" value={inspTrimestre} color="bg-purple-500" />
        <MetricCard icon={Car} label="Este año" value={inspAnio} color="bg-amber-500" />
      </div>

      {/* Vehículos recibidos expandido */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="w-5 h-5 text-blue-600" />
            Vehículos recibidos ({vehiculosRecibidosLista.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Vehículo</th>
                  <th className="px-4 py-3 text-left">Placa</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Motivo</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehiculosRecibidosLista.length > 0 ? (
                  vehiculosRecibidosLista.map(({ expediente: e, vehiculo: v, cliente: c }) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {e.fecha_ingreso ? format(new Date(e.fecha_ingreso), "dd MMM yyyy", { locale: es }) : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{v?.marca} {v?.modelo}</td>
                      <td className="px-4 py-3 text-gray-600">{v?.placa || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{c?.nombre_completo || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{e.motivo_visita || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-gray-50">{e.estado_interno}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sin vehículos recibidos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modelos expandido */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="w-5 h-5 text-blue-600" />
            Modelos que ingresaron ({todosModelos.length} modelos distintos)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {todosModelos.length > 0 ? (
            <div className="space-y-3">
              {todosModelos.map(([modelo, count]) => {
                const pct = vehiculosRecibidos > 0 ? (count / vehiculosRecibidos * 100) : 0;
                return (
                  <div key={modelo}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{modelo}</span>
                      <span className="text-gray-500">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-6">Sin datos aún</p>
          )}
        </CardContent>
      </Card>

      {/* Qué se hizo expandido */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="w-5 h-5 text-[#E31E24]" />
            Qué se hizo ({trabajos.length} trabajos registrados)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {trabajosPorTipoExpandido.length > 0 ? (
            <div className="space-y-5">
              {trabajosPorTipoExpandido.map(([tipo, trabajosTipo]) => (
                <div key={tipo}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-[#E31E24] text-white">{tipo}</Badge>
                    <span className="text-sm text-gray-500">{trabajosTipo.length} trabajos</span>
                  </div>
                  <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                    {trabajosTipo.slice(0, 50).map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-sm py-1">
                        <span className="text-gray-700 truncate max-w-md">{t.descripcion}</span>
                        <span className="text-gray-400 ml-2 whitespace-nowrap">
                          {t.tecnico_nombre || "—"} · ${t.subtotal?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    ))}
                    {trabajosTipo.length > 50 && (
                      <p className="text-xs text-gray-400 pl-1">...y {trabajosTipo.length - 50} más</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-6">Sin trabajos registrados</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}