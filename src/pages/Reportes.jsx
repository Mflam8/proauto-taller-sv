import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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

  const { data: trabajos = [] } = useQuery({
    queryKey: ['trabajos-reportes'],
    queryFn: () => base44.entities.TrabajoExpediente.list(),
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

  // === MÉTRICAS OPERATIVAS ===
  const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c]));

  // Ventas por semana (últimas 8 semanas)
  const ventasPorSemana = Array.from({ length: 8 }, (_, i) => {
    const fin = new Date();
    fin.setDate(fin.getDate() - (7 - i - 1) * 7);
    fin.setHours(23, 59, 59, 999);
    const inicio = new Date(fin);
    inicio.setDate(inicio.getDate() - 6);
    inicio.setHours(0, 0, 0, 0);
    const monto = facturas.filter(f => {
      const fecha = new Date(f.fecha_emision || f.created_date);
      return fecha >= inicio && fecha <= fin;
    }).reduce((sum, f) => sum + (f.total || 0), 0);
    return { semana: `${inicio.getDate()}/${inicio.getMonth() + 1} - ${fin.getDate()}/${fin.getMonth() + 1}`, monto };
  });

  // Ventas por día (últimos 14 días)
  const ventasPorDia = Array.from({ length: 14 }, (_, i) => {
    const dia = new Date();
    dia.setDate(dia.getDate() - (13 - i));
    dia.setHours(0, 0, 0, 0);
    const diaFin = new Date(dia);
    diaFin.setHours(23, 59, 59, 999);
    const monto = facturas.filter(f => {
      const fecha = new Date(f.fecha_emision || f.created_date);
      return fecha >= dia && fecha <= diaFin;
    }).reduce((sum, f) => sum + (f.total || 0), 0);
    return { dia: dia.toLocaleDateString('es', { day: '2-digit', month: '2-digit' }), monto };
  });

  // Top clientes por facturación
  const gastoPorCliente = {};
  facturas.forEach(f => {
    if (f.cliente_id) gastoPorCliente[f.cliente_id] = (gastoPorCliente[f.cliente_id] || 0) + (f.total || 0);
  });
  const topClientes = Object.entries(gastoPorCliente)
    .map(([id, total]) => ({
      nombre: clienteMap[id]?.nombre_completo || 'N/A',
      total,
      facturas: facturas.filter(f => f.cliente_id === id).length,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Ventas por tipo de trabajo (mano de obra vs repuestos)
  const ventasPorTipo = {};
  trabajos.forEach(t => {
    const tipo = t.tipo || 'Otro';
    ventasPorTipo[tipo] = (ventasPorTipo[tipo] || 0) + (t.subtotal || (t.cantidad || 1) * (t.precio_unitario || 0));
  });
  const manoObraVsRepuestos = [
    { name: 'Mano de Obra', value: ventasPorTipo['Mano de Obra'] || 0, color: '#3B82F6' },
    { name: 'Repuestos', value: ventasPorTipo['Repuesto'] || 0, color: '#E31E24' },
    { name: 'Insumos', value: ventasPorTipo['Insumo'] || 0, color: '#F59E0B' },
    { name: 'Diagnóstico', value: ventasPorTipo['Diagnóstico'] || 0, color: '#8B5CF6' },
    { name: 'Otros', value: ventasPorTipo['Otro'] || 0, color: '#6B7280' },
  ].filter(i => i.value > 0);

  const montoManoObra = ventasPorTipo['Mano de Obra'] || 0;
  const montoRepuestos = ventasPorTipo['Repuesto'] || 0;
  const piezasCompradas = trabajos.filter(t => t.tipo === 'Repuesto').length;

  // Qué se vende más (top trabajos por frecuencia)
  const trabajosCount = {};
  trabajos.forEach(t => {
    const desc = t.descripcion || 'Sin descripción';
    if (!trabajosCount[desc]) trabajosCount[desc] = { count: 0, monto: 0 };
    trabajosCount[desc].count++;
    trabajosCount[desc].monto += (t.subtotal || (t.cantidad || 1) * (t.precio_unitario || 0));
  });
  const topTrabajos = Object.entries(trabajosCount)
    .map(([desc, data]) => ({ descripcion: desc, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

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

        {/* Métricas Operativas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardContent className="p-5">
              <DollarSign className="w-8 h-8 opacity-80 mb-2" />
              <p className="text-2xl font-bold">${promedioFactura.toFixed(2)}</p>
              <p className="text-xs opacity-90 mt-1">Factura promedio</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-5">
              <Wrench className="w-8 h-8 opacity-80 mb-2" />
              <p className="text-2xl font-bold">${montoManoObra.toFixed(2)}</p>
              <p className="text-xs opacity-90 mt-1">Venta mano de obra</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-[#E31E24] to-[#B71C1C] text-white">
            <CardContent className="p-5">
              <DollarSign className="w-8 h-8 opacity-80 mb-2" />
              <p className="text-2xl font-bold">${montoRepuestos.toFixed(2)}</p>
              <p className="text-xs opacity-90 mt-1">Venta en repuestos</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-5">
              <FileText className="w-8 h-8 opacity-80 mb-2" />
              <p className="text-2xl font-bold">{piezasCompradas}</p>
              <p className="text-xs opacity-90 mt-1">Piezas compradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Ventas por semana y por día */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#E31E24]" /> Ventas por Semana (8 semanas)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={ventasPorSemana}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semana" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Line type="monotone" dataKey="monto" stroke="#E31E24" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600" /> Ventas por Día (14 días)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ventasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="monto" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Mano de obra vs repuestos + Top clientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5 text-[#E31E24]" /> Mano de Obra vs Repuestos</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {manoObraVsRepuestos.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={manoObraVsRepuestos} cx="50%" cy="50%" labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100} dataKey="value">
                      {manoObraVsRepuestos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-400 py-12">Sin trabajos registrados</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Top Clientes</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {topClientes.length > 0 ? (
                <div className="space-y-3">
                  {topClientes.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{c.nombre}</p>
                        <p className="text-xs text-gray-500">{c.facturas} factura{c.facturas !== 1 ? "s" : ""}</p>
                      </div>
                      <p className="font-bold text-green-600">${c.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-12">Sin clientes con facturas</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Qué se vende más */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#E31E24]" /> Qué se vende más (top 10)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {topTrabajos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Veces</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Monto total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topTrabajos.map((t, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 text-gray-400 font-medium">{i + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-900">{t.descripcion}</td>
                        <td className="py-2.5 px-3 text-right">
                          <Badge className="bg-blue-100 text-blue-800">{t.count}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900">${t.monto.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-400 py-12">Sin trabajos registrados</p>
            )}
          </CardContent>
        </Card>

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