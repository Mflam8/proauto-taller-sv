import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Camera, Search, Eye, Car, Calendar, DollarSign, Package,
  TrendingUp, Wrench, AlertCircle, CheckCircle, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ReporteInspecciones from "@/components/inspeccion/ReporteInspecciones";
import { BarChart3, List } from "lucide-react";

const condicionColor = {
  "Bueno": "bg-green-100 text-green-800",
  "Regular": "bg-yellow-100 text-yellow-800",
  "Malo": "bg-red-100 text-red-800",
};

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

export default function Inspecciones() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInsp, setSelectedInsp] = useState(null);
  const [vista, setVista] = useState("lista");

  const { data: inspecciones = [], isLoading } = useQuery({
    queryKey: ['inspecciones'],
    queryFn: () => base44.entities.Inspeccion.list('-fecha'),
    initialData: [],
  });

  const { data: expedientes = [] } = useQuery({
    queryKey: ['expedientes'],
    queryFn: () => base44.entities.Expediente.list(),
    initialData: [],
  });

  const { data: vehiculos = [] } = useQuery({
    queryKey: ['vehiculos'],
    queryFn: () => base44.entities.Vehiculo.list(),
    initialData: [],
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    initialData: [],
  });

  const { data: pagos = [] } = useQuery({
    queryKey: ['pagos-inspecciones'],
    queryFn: () => base44.entities.Pago.list(),
    initialData: [],
  });

  const { data: trabajos = [] } = useQuery({
    queryKey: ['trabajos-inspecciones'],
    queryFn: () => base44.entities.TrabajoExpediente.list(),
    initialData: [],
  });

  const vehiculoMap = useMemo(() => Object.fromEntries(vehiculos.map(v => [v.id, v])), [vehiculos]);
  const clienteMap = useMemo(() => Object.fromEntries(clientes.map(c => [c.id, c])), [clientes]);
  const expedienteMap = useMemo(() => Object.fromEntries(expedientes.map(e => [e.id, e])), [expedientes]);

  // === MÉTRICAS DEL DUEÑO ===
  const vehiculosRecibidos = expedientes.length;

  const diasEnTaller = expedientes.map(e => {
    const inicio = new Date(e.fecha_ingreso);
    const fin = e.fecha_salida ? new Date(e.fecha_salida) : new Date();
    return Math.max(0, Math.floor((fin - inicio) / (1000 * 60 * 60 * 24)));
  });
  const diasPromedio = diasEnTaller.length > 0
    ? (diasEnTaller.reduce((a, b) => a + b, 0) / diasEnTaller.length).toFixed(1)
    : 0;

  const totalPagado = expedientes.reduce((sum, e) => sum + (e.total_pagado || 0), 0);
  const ticketPromedio = pagos.length > 0 ? (totalPagado / pagos.length) : 0;

  const trabajosRepuesto = trabajos.filter(t => t.tipo === "Repuesto");
  const expedientesConRepuesto = new Set(trabajosRepuesto.map(t => t.expediente_id)).size;
  const expedientesSinRepuesto = Math.max(0, vehiculosRecibidos - expedientesConRepuesto);

  // Modelos más frecuentes
  const modelosCount = {};
  expedientes.forEach(e => {
    const v = vehiculoMap[e.vehiculo_id];
    if (v?.modelo) modelosCount[v.modelo] = (modelosCount[v.modelo] || 0) + 1;
  });
  const topModelos = Object.entries(modelosCount).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Condición de llegada
  const inspeccionesConDaños = inspecciones.filter(i => i.daños?.length > 0).length;
  const totalDaños = inspecciones.reduce((sum, i) => sum + (i.daños?.length || 0), 0);

  // === INSPECCIONES POR PERIODO ===
  const ahora = new Date();
  const inicioSemana = new Date(ahora); inicioSemana.setDate(ahora.getDate() - 7);
  const inicioMes = new Date(ahora); inicioMes.setMonth(ahora.getMonth() - 1);
  const inicioTrimestre = new Date(ahora); inicioTrimestre.setMonth(ahora.getMonth() - 3);
  const inicioAnio = new Date(ahora); inicioAnio.setFullYear(ahora.getFullYear() - 1);

  const inspeccionesPorPeriodo = (inicio) => inspecciones.filter(i => {
    const fecha = new Date(i.fecha || i.created_date);
    return fecha >= inicio && fecha <= ahora;
  }).length;

  const inspSemana = inspeccionesPorPeriodo(inicioSemana);
  const inspMes = inspeccionesPorPeriodo(inicioMes);
  const inspTrimestre = inspeccionesPorPeriodo(inicioTrimestre);
  const inspAnio = inspeccionesPorPeriodo(inicioAnio);

  // Trabajos realizados (qué se hizo)
  const trabajosPorTipo = {};
  trabajos.forEach(t => {
    const tipo = t.tipo || "Otro";
    trabajosPorTipo[tipo] = (trabajosPorTipo[tipo] || 0) + 1;
  });

  // === FILTRO DE LISTADO ===
  const filteredInspecciones = inspecciones.filter(insp => {
    const v = vehiculoMap[insp.vehiculo_id];
    const c = clienteMap[insp.cliente_id];
    const s = searchTerm.toLowerCase();
    return (
      v?.placa?.toLowerCase().includes(s) ||
      `${v?.marca || ""} ${v?.modelo || ""}`.toLowerCase().includes(s) ||
      c?.nombre_completo?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-xl shadow-lg">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inspecciones y Recepción</h1>
            <p className="text-gray-600">Panel de recepción de vehículos y métricas operativas</p>
          </div>
        </motion.div>

        {/* Toggle de vista */}
        <div className="flex items-center gap-2">
          <Button
            variant={vista === "lista" ? "default" : "outline"}
            onClick={() => setVista("lista")}
            className={vista === "lista" ? "bg-[#E31E24] hover:bg-[#B71C1C]" : "border-gray-200"}
          >
            <List className="w-4 h-4 mr-2" /> Lista
          </Button>
          <Button
            variant={vista === "reporte" ? "default" : "outline"}
            onClick={() => setVista("reporte")}
            className={vista === "reporte" ? "bg-[#E31E24] hover:bg-[#B71C1C]" : "border-gray-200"}
          >
            <BarChart3 className="w-4 h-4 mr-2" /> Reporte
          </Button>
        </div>

        {vista === "reporte" ? (
          <ReporteInspecciones
            inspecciones={inspecciones}
            expedientes={expedientes}
            vehiculos={vehiculos}
            clientes={clientes}
            trabajos={trabajos}
            vehiculoMap={vehiculoMap}
            clienteMap={clienteMap}
            expedienteMap={expedienteMap}
            inspSemana={inspSemana}
            inspMes={inspMes}
            inspTrimestre={inspTrimestre}
            inspAnio={inspAnio}
            vehiculosRecibidos={vehiculosRecibidos}
            diasPromedio={diasPromedio}
            totalPagado={totalPagado}
            ticketPromedio={ticketPromedio}
            expedientesConRepuesto={expedientesConRepuesto}
            expedientesSinRepuesto={expedientesSinRepuesto}
            inspeccionesConDaños={inspeccionesConDaños}
            totalDaños={totalDaños}
            topModelos={topModelos}
            trabajosPorTipo={trabajosPorTipo}
          />
        ) : (
        <>
        {/* Buscador */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar por placa, modelo o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-gray-200 focus:border-[#E31E24]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Listado de inspecciones */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-0 shadow-md animate-pulse">
                <CardContent className="p-6"><div className="h-24 bg-gray-200 rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : filteredInspecciones.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInspecciones.map((insp, idx) => {
              const v = vehiculoMap[insp.vehiculo_id];
              const c = clienteMap[insp.cliente_id];
              const exp = expedienteMap[insp.expediente_id];
              const dañosCount = insp.daños?.length || 0;
              return (
                <motion.div key={insp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {v?.marca?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{v?.marca} {v?.modelo}</p>
                            <p className="text-sm text-gray-500">Placa: {v?.placa || "—"}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedInsp(insp)} className="border-gray-200 hover:border-blue-500 hover:text-blue-600">
                          <Eye className="w-4 h-4 mr-1" /> Ver
                        </Button>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">Cliente: <span className="font-medium">{c?.nombre_completo || "—"}</span></p>
                      <p className="text-xs text-gray-400 mb-3">
                        {insp.fecha ? format(new Date(insp.fecha), "dd MMM yyyy 'a las' HH:mm", { locale: es }) : "—"} · {insp.realizada_por || "Sin técnico"}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {insp.estado_llantas && <Badge variant="outline" className={condicionColor[insp.estado_llantas]}>Llantas: {insp.estado_llantas}</Badge>}
                        {insp.estado_pintura && <Badge variant="outline" className={condicionColor[insp.estado_pintura]}>Pintura: {insp.estado_pintura}</Badge>}
                        {dañosCount > 0 && <Badge className="bg-red-100 text-red-800">{dañosCount} daño{dañosCount > 1 ? "s" : ""}</Badge>}
                        {exp && <Badge variant="outline" className="bg-gray-50">{exp.estado_interno}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay inspecciones</h3>
              <p className="text-gray-500">
                {searchTerm ? "Intenta con otra búsqueda" : "Las inspecciones se registran desde la pestaña Inspección dentro de cada Expediente."}
              </p>
            </CardContent>
          </Card>
        )}
        </>
        )}
      </div>

      {/* Dialog de detalle */}
      <Dialog open={!!selectedInsp} onOpenChange={() => setSelectedInsp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#E31E24]" />
              Detalle de Inspección
            </DialogTitle>
          </DialogHeader>
          {selectedInsp && <InspeccionDetalle inspeccion={selectedInsp} vehiculo={vehiculoMap[selectedInsp.vehiculo_id]} cliente={clienteMap[selectedInsp.cliente_id]} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InspeccionDetalle({ inspeccion, vehiculo, cliente }) {
  const condicionFields = [
    ["Llantas", inspeccion.estado_llantas],
    ["Luces", inspeccion.estado_luces],
    ["Vidrios", inspeccion.estado_vidrios],
    ["Pintura", inspeccion.estado_pintura],
    ["Tapicería", inspeccion.estado_tapiceria],
  ];
  const siNoFields = [
    ["Aire acondicionado", inspeccion.aire_acondicionado],
    ["Dirección hidráulica", inspeccion.direccion_hidraulica],
    ["Alarma", inspeccion.alarma],
  ];
  const accesorios = [
    ["Llanta de repuesto", inspeccion.llanta_repuesto],
    ["Herramientas", inspeccion.herramientas],
    ["Documentos", inspeccion.documentos],
  ];

  return (
    <div className="space-y-5">
      {/* Info vehículo */}
      <div className="bg-blue-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div><p className="text-gray-500 text-xs">Vehículo</p><p className="font-semibold">{vehiculo?.marca} {vehiculo?.modelo}</p></div>
        <div><p className="text-gray-500 text-xs">Placa</p><p className="font-semibold">{vehiculo?.placa}</p></div>
        <div><p className="text-gray-500 text-xs">Cliente</p><p className="font-semibold">{cliente?.nombre_completo}</p></div>
        <div><p className="text-gray-500 text-xs">Kilometraje</p><p className="font-semibold">{inspeccion.kilometraje?.toLocaleString() || "—"}</p></div>
      </div>

      <p className="text-xs text-gray-400">
        Realizada por <span className="font-medium text-gray-600">{inspeccion.realizada_por || "—"}</span> · {inspeccion.fecha ? format(new Date(inspeccion.fecha), "dd MMM yyyy HH:mm", { locale: es }) : "—"}
      </p>

      {/* Condición */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Condición del Vehículo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {condicionFields.map(([label, val]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span className="text-sm text-gray-600">{label}</span>
              {val ? (
                <Badge className={condicionColor[val] || "bg-gray-100 text-gray-700"}>{val}</Badge>
              ) : (
                <span className="text-xs text-gray-400">Sin evaluar</span>
              )}
            </div>
          ))}
          {siNoFields.map(([label, val]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span className="text-sm text-gray-600">{label}</span>
              {val ? (
                <Badge className={val === "Sí" || val === "Funciona" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{val}</Badge>
              ) : (
                <span className="text-xs text-gray-400">Sin evaluar</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Accesorios */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Accesorios y Documentos</h3>
        <div className="flex flex-wrap gap-3 mb-3">
          {accesorios.map(([label, val]) => (
            <Badge key={label} className={val ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}>
              {val ? "✓" : "✗"} {label}
            </Badge>
          ))}
        </div>
        {inspeccion.accesorios_recibidos && (
          <p className="text-sm text-gray-600 whitespace-pre-line">Otros: {inspeccion.accesorios_recibidos}</p>
        )}
      </div>

      {/* Daños */}
      {inspeccion.daños?.length > 0 && (
        <div className="bg-white border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Daños Encontrados ({inspeccion.daños.length})</h3>
          <div className="space-y-2">
            {inspeccion.daños.map((d, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                <Badge className="bg-red-100 text-red-800 text-xs flex-shrink-0">{d.tipo}</Badge>
                <div className="text-sm flex-1">
                  <span className="font-medium text-gray-800">{d.ubicacion}</span>
                  {d.descripcion && <span className="text-gray-500"> — {d.descripcion}</span>}
                </div>
                {d.foto_url && <img src={d.foto_url} alt={`Daño ${i + 1}`} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observaciones */}
      {inspeccion.observaciones && (
        <div className="bg-white border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Observaciones</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{inspeccion.observaciones}</p>
        </div>
      )}

      {/* Fotos de evidencia */}
      {inspeccion.fotos?.length > 0 && (
        <div className="bg-white border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Fotos de Evidencia ({inspeccion.fotos.length})</h3>
          <div className="grid grid-cols-3 gap-2">
            {inspeccion.fotos.map((url, i) => (
              <img key={i} src={url} alt={`Foto ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}