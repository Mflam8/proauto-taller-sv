import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Calendar, FileText, Users, Car, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Reportes() {
  const [periodoFacturas, setPeriodoFacturas] = useState("mes");
  const [periodoOrdenes, setPeriodoOrdenes] = useState("mes");

  const { data: facturas = [] } = useQuery({
    queryKey: ['facturas'],
    queryFn: () => base44.entities.Factura.list('-fecha_emision'),
    initialData: [],
  });

  const { data: ordenes = [] } = useQuery({
    queryKey: ['ordenes'],
    queryFn: () => base44.entities.OrdenTrabajo.list('-created_date'),
    initialData: [],
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    initialData: [],
  });

  const { data: vehiculos = [] } = useQuery({
    queryKey: ['vehiculos'],
    queryFn: () => base44.entities.Vehiculo.list(),
    initialData: [],
  });

  const { data: pagos = [] } = useQuery({
    queryKey: ['pagos'],
    queryFn: () => base44.entities.Pago.list('-created_date'),
    initialData: [],
  });

  const { data: inventario = [] } = useQuery({
    queryKey: ['inventario'],
    queryFn: () => base44.entities.ItemInventario.list(),
    initialData: [],
  });

  // Filtrar por periodo
  const filtrarPorPeriodo = (items, periodo, dateField = 'created_date') => {
    const ahora = new Date();
    const inicio = new Date();
    
    if (periodo === 'semana') {
      inicio.setDate(ahora.getDate() - 7);
    } else if (periodo === 'mes') {
      inicio.setMonth(ahora.getMonth() - 1);
    } else if (periodo === 'trimestre') {
      inicio.setMonth(ahora.getMonth() - 3);
    } else if (periodo === 'anio') {
      inicio.setFullYear(ahora.getFullYear() - 1);
    }

    return items.filter(item => {
      const fecha = item[dateField] || item.created_date;
      return new Date(fecha) >= inicio;
    });
  };

  const facturasFiltradasPeriodo = filtrarPorPeriodo(facturas, periodoFacturas, 'fecha_emision');
  const ordenesFiltradasPeriodo = filtrarPorPeriodo(ordenes, periodoOrdenes);

  // Métricas Financieras
  const totalFacturado = facturas.reduce((sum, f) => sum + (f.total || 0), 0);
  const totalCobrado = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
  const facturasConDeuda = facturas.filter(f => (f.saldo_pendiente || 0) > 0 && f.estado_pago !== 'Pagada');
  const pendienteCobro = facturasConDeuda.reduce((sum, f) => sum + (f.saldo_pendiente || 0), 0);
  const promedioFactura = facturas.length > 0 ? totalFacturado / facturas.length : 0;

  // Facturación por periodo
  const facturacionPeriodo = facturasFiltradasPeriodo.reduce((sum, f) => sum + (f.total || 0), 0);
  const facturasPendientes = facturasConDeuda.length;

  // Métricas Operativas
  const ordenesActivas = ordenes.filter(o => !['Completado', 'Entregado'].includes(o.estado)).length;
  const ordenesCompletadas = ordenes.filter(o => o.estado === 'Completado' || o.estado === 'Entregado').length;
  const tasaCompletado = ordenes.length > 0 ? (ordenesCompletadas / ordenes.length * 100).toFixed(1) : 0;

  // Datos para gráficas
  const facturacionMensual = Array.from({ length: 6 }, (_, i) => {
    const mes = new Date();
    mes.setMonth(mes.getMonth() - (5 - i));
    const mesNombre = mes.toLocaleDateString('es', { month: 'short' });
    const facturasMes = facturas.filter(f => {
      const fechaFactura = new Date(f.fecha_emision || f.created_date);
      return fechaFactura.getMonth() === mes.getMonth() && fechaFactura.getFullYear() === mes.getFullYear();
    });
    return {
      mes: mesNombre,
      monto: facturasMes.reduce((sum, f) => sum + (f.total || 0), 0)
    };
  });

  const estadosOrdenes = [
    { name: 'Completado', value: ordenes.filter(o => o.estado === 'Completado').length, color: '#10B981' },
    { name: 'En Reparación', value: ordenes.filter(o => o.estado === 'En Reparación').length, color: '#F59E0B' },
    { name: 'Diagnóstico', value: ordenes.filter(o => o.estado === 'En Diagnóstico').length, color: '#3B82F6' },
    { name: 'Esperando', value: ordenes.filter(o => o.estado === 'Esperando Repuestos').length, color: '#EF4444' },
    { name: 'Otros', value: ordenes.filter(o => !['Completado', 'En Reparación', 'En Diagnóstico', 'Esperando Repuestos'].includes(o.estado)).length, color: '#6B7280' }
  ].filter(item => item.value > 0);

  const estadosFacturas = [
    { name: 'Pagada', value: facturas.filter(f => f.estado_pago === 'Pagada').length, color: '#10B981' },
    { name: 'Pendiente', value: facturas.filter(f => f.estado_pago === 'Pendiente').length, color: '#EF4444' },
    { name: 'Parcial', value: facturas.filter(f => f.estado_pago === 'Parcial').length, color: '#F59E0B' }
  ].filter(item => item.value > 0);

  const COLORS = ['#E31E24', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-3 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-xl shadow-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
            <p className="text-gray-600">Métricas financieras y operativas del taller</p>
          </div>
        </motion.div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-10 h-10 opacity-80" />
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p className="text-sm opacity-90 mb-1">Facturación Total</p>
                <p className="text-3xl font-bold">${totalFacturado.toFixed(2)}</p>
                <p className="text-xs opacity-80 mt-2">{facturas.length} facturas emitidas</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-10 h-10 opacity-80" />
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p className="text-sm opacity-90 mb-1">Total Cobrado</p>
                <p className="text-3xl font-bold">${totalCobrado.toFixed(2)}</p>
                <p className="text-xs opacity-80 mt-2">{pagos.length} pagos recibidos</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-10 h-10 opacity-80" />
                  <TrendingDown className="w-6 h-6" />
                </div>
                <p className="text-sm opacity-90 mb-1">Pendiente de Cobro</p>
                <p className="text-3xl font-bold">${pendienteCobro.toFixed(2)}</p>
                <p className="text-xs opacity-80 mt-2">{facturasPendientes} facturas pendientes</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Wrench className="w-10 h-10 opacity-80" />
                  <Calendar className="w-6 h-6" />
                </div>
                <p className="text-sm opacity-90 mb-1">Órdenes Activas</p>
                <p className="text-3xl font-bold">{ordenesActivas}</p>
                <p className="text-xs opacity-80 mt-2">{tasaCompletado}% tasa completado</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gráficas Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Facturación Mensual */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Facturación Últimos 6 Meses</CardTitle>
                <Select value={periodoFacturas} onValueChange={setPeriodoFacturas}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semana">Semana</SelectItem>
                    <SelectItem value="mes">Mes</SelectItem>
                    <SelectItem value="trimestre">Trimestre</SelectItem>
                    <SelectItem value="anio">Año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={facturacionMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="monto" fill="#E31E24" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Estado de Órdenes */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <CardTitle>Estado de Órdenes de Trabajo</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={estadosOrdenes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadosOrdenes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas Adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-600" />
                Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Clientes</span>
                  <span className="font-bold text-xl">{clientes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Promedio Factura</span>
                  <span className="font-semibold text-green-600">${promedioFactura.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="w-5 h-5 text-purple-600" />
                Vehículos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Registrados</span>
                  <span className="font-bold text-xl">{vehiculos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">En Servicio</span>
                  <span className="font-semibold text-orange-600">{ordenesActivas}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="w-5 h-5 text-red-600" />
                Operaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Órdenes Completadas</span>
                  <span className="font-bold text-xl">{ordenesCompletadas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">En Proceso</span>
                  <span className="font-semibold text-blue-600">{ordenesActivas}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estado de Facturas */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <CardTitle>Estado de Facturas</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {estadosFacturas.map((estado, index) => (
                <div key={index} className="p-6 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-700 font-medium">{estado.name}</span>
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: estado.color }}
                    ></div>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: estado.color }}>
                    {estado.value}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {((estado.value / facturas.length) * 100).toFixed(1)}% del total
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}