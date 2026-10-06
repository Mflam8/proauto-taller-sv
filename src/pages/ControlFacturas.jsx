import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, FilePlus2, Printer, Activity, Lock, Search } from "lucide-react";
import { esDueno } from "@/lib/permissions";

export default function ControlFacturas() {
  const [user, setUser] = useState(null);
  const [cargandoUser, setCargandoUser] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCargandoUser(false));
  }, []);

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ["control-facturas"],
    queryFn: () => base44.entities.ControlFactura.list("-fecha_evento", 1000),
    enabled: !!user && esDueno(user),
  });

  if (cargandoUser) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !esDueno(user)) {
    return (
      <div className="p-8">
        <Card className="max-w-md mx-auto border-0 shadow-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Acceso restringido</h2>
            <p className="text-sm text-gray-600">
              Este reporte es exclusivo del dueño del taller.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const busquedaLower = busqueda.toLowerCase().trim();
  const filtrados = busquedaLower
    ? registros.filter(r =>
        [r.numero_control, r.numero_factura, r.cliente_nombre, r.usuario_email, r.usuario_nombre]
          .some(v => (v || "").toLowerCase().includes(busquedaLower)))
    : registros;

  const creaciones = registros.filter(r => r.evento === "Creación").length;
  const impresiones = registros.filter(r => r.evento === "Impresión").length;

  // Resumen por factura: cuántas veces fue creada e impresa
  const porFactura = {};
  registros.forEach(r => {
    const key = r.factura_id;
    if (!porFactura[key]) {
      porFactura[key] = {
        numero_factura: r.numero_factura || "(sin número)",
        cliente_nombre: r.cliente_nombre || "",
        monto_total: r.monto_total || 0,
        creaciones: 0,
        impresiones: 0,
      };
    }
    if (r.evento === "Creación") porFactura[key].creaciones++;
    else porFactura[key].impresiones++;
  });
  const resumenFacturas = Object.entries(porFactura)
    .sort((a, b) => b[1].impresiones - a[1].impresiones || b[1].creaciones - a[1].creaciones);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-xl flex items-center justify-center shadow-md">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control Interno de Facturas</h1>
          <p className="text-sm text-gray-600">Registro de cada creación e impresión, con número único por evento. Solo visible para el dueño.</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center">
              <FilePlus2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Facturas creadas</p>
              <p className="text-2xl font-bold text-gray-900">{creaciones}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-purple-100 rounded-lg flex items-center justify-center">
              <Printer className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Impresiones de recibos</p>
              <p className="text-2xl font-bold text-gray-900">{impresiones}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Eventos totales</p>
              <p className="text-2xl font-bold text-gray-900">{registros.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen por factura */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Resumen por Factura</CardTitle>
        </CardHeader>
        <CardContent>
          {resumenFacturas.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              Aún no hay eventos registrados. Cada factura creada o impresa aparecerá aquí automáticamente.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b">
                    <th className="py-2 pr-3">Factura</th>
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3 text-right">Monto</th>
                    <th className="py-2 pr-3 text-center">Creaciones</th>
                    <th className="py-2 text-center">Impresiones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {resumenFacturas.map(([id, r]) => (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-3 font-mono font-semibold text-gray-900">#{r.numero_factura}</td>
                      <td className="py-2.5 pr-3 text-gray-700">{r.cliente_nombre || "—"}</td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-gray-900">${r.monto_total.toFixed(2)}</td>
                      <td className="py-2.5 pr-3 text-center">
                        <Badge className="bg-blue-100 text-blue-700 border-0">{r.creaciones}</Badge>
                      </td>
                      <td className="py-2.5 text-center">
                        <Badge className="bg-purple-100 text-purple-700 border-0">{r.impresiones}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bitácora de eventos */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-lg">Bitácora de Eventos</CardTitle>
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar por N° control, factura, cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            </div>
          ) : filtrados.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              {busqueda ? "No hay resultados para esa búsqueda." : "Aún no hay eventos registrados."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b">
                    <th className="py-2 pr-3">N° Control</th>
                    <th className="py-2 pr-3">Evento</th>
                    <th className="py-2 pr-3">Factura</th>
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3 text-right">Monto</th>
                    <th className="py-2 pr-3">Usuario</th>
                    <th className="py-2 text-right">Fecha y hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtrados.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-3 font-mono font-semibold text-[#E31E24]">{r.numero_control}</td>
                      <td className="py-2.5 pr-3">
                        <Badge className={
                          r.evento === "Creación"
                            ? "bg-blue-500 text-white border-0"
                            : "bg-purple-500 text-white border-0"
                        }>
                          {r.evento}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-gray-900">#{r.numero_factura || "—"}</td>
                      <td className="py-2.5 pr-3 text-gray-700">{r.cliente_nombre || "—"}</td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-gray-900">${(r.monto_total || 0).toFixed(2)}</td>
                      <td className="py-2.5 pr-3 text-gray-700">
                        {r.usuario_nombre || "—"}
                        {r.usuario_email && <span className="block text-xs text-gray-400">{r.usuario_email}</span>}
                      </td>
                      <td className="py-2.5 text-right text-gray-600 whitespace-nowrap">
                        {r.fecha_evento ? new Date(r.fecha_evento).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}