import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users,
  Car,
  FileText,
  ClipboardList,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench
} from "lucide-react";
import StatsCard from "../components/dashboard/StatsCard";
import { motion } from "framer-motion";

export default function Dashboard() {
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

  const { data: ordenes = [] } = useQuery({
    queryKey: ['ordenes'],
    queryFn: () => base44.entities.OrdenTrabajo.list('-created_date'),
    initialData: [],
  });

  const { data: cotizaciones = [] } = useQuery({
    queryKey: ['cotizaciones'],
    queryFn: () => base44.entities.Cotizacion.list('-created_date'),
    initialData: [],
  });

  const { data: facturas = [] } = useQuery({
    queryKey: ['facturas'],
    queryFn: () => base44.entities.Factura.list('-created_date'),
    initialData: [],
  });

  // Calcular métricas
  const ordenesActivas = ordenes.filter(o => 
    !['Completado', 'Entregado'].includes(o.estado)
  ).length;

  const cotizacionesPendientes = cotizaciones.filter(c => 
    c.estado === 'Pendiente'
  ).length;

  const facturasTotal = facturas.reduce((sum, f) => sum + (f.total || 0), 0);
  const facturasPendientes = facturas.filter(f => 
    f.estado_pago === 'Pendiente' || f.estado_pago === 'Parcial'
  ).length;

  const ordenesRecientes = ordenes.slice(0, 5);

  const getEstadoColor = (estado) => {
    const colors = {
      'Recibido': 'bg-blue-100 text-blue-800',
      'En Diagnóstico': 'bg-purple-100 text-purple-800',
      'Esperando Repuestos': 'bg-yellow-100 text-yellow-800',
      'En Reparación': 'bg-orange-100 text-orange-800',
      'Control de Calidad': 'bg-indigo-100 text-indigo-800',
      'Completado': 'bg-green-100 text-green-800',
      'Entregado': 'bg-gray-100 text-gray-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Bienvenido a PROAUTO Taller SV</p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl("Cotizaciones")}>
              <Button className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] hover:from-[#B71C1C] hover:to-[#E31E24] text-white shadow-md hover:shadow-lg transition-all duration-300">
                <FileText className="w-4 h-4 mr-2" />
                Nueva Cotización
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Clientes"
            value={clientes.length}
            icon={Users}
            color="blue"
            trend="12%"
            trendUp={true}
          />
          <StatsCard
            title="Vehículos Registrados"
            value={vehiculos.length}
            icon={Car}
            color="green"
          />
          <StatsCard
            title="Órdenes Activas"
            value={ordenesActivas}
            icon={Wrench}
            color="orange"
            trend="5%"
            trendUp={true}
          />
          <StatsCard
            title="Facturación Total"
            value={`$${facturasTotal.toFixed(2)}`}
            icon={DollarSign}
            color="red"
            trend="18%"
            trendUp={true}
          />
        </div>

        {/* Alerts & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{cotizacionesPendientes}</p>
                    <p className="text-sm text-gray-600">Cotizaciones Pendientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-red-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{facturasPendientes}</p>
                    <p className="text-sm text-gray-600">Facturas Pendientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {ordenes.filter(o => o.estado === 'Completado').length}
                    </p>
                    <p className="text-sm text-gray-600">Trabajos Completados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Órdenes Recientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-white">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">Órdenes de Trabajo Recientes</CardTitle>
                <Link to={createPageUrl("OrdenesTrabajos")}>
                  <Button variant="ghost" className="text-[#E31E24] hover:bg-red-50">
                    Ver Todas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {ordenesRecientes.length > 0 ? (
                <div className="space-y-4">
                  {ordenesRecientes.map((orden, index) => (
                    <motion.div
                      key={orden.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-xl flex items-center justify-center shadow-md">
                          <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Orden #{orden.numero_orden || orden.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(orden.created_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(orden.estado)}`}>
                          {orden.estado}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay órdenes de trabajo aún</p>
                  <Link to={createPageUrl("OrdenesTrabajos")}>
                    <Button className="mt-4 bg-gradient-to-r from-[#E31E24] to-[#B71C1C] text-white">
                      Crear Primera Orden
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to={createPageUrl("Clientes")} className="block">
                  <div className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-sm">
                    <Users className="w-8 h-8 mb-2" />
                    <p className="font-semibold">Nuevo Cliente</p>
                  </div>
                </Link>
                <Link to={createPageUrl("Vehiculos")} className="block">
                  <div className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-sm">
                    <Car className="w-8 h-8 mb-2" />
                    <p className="font-semibold">Registrar Vehículo</p>
                  </div>
                </Link>
                <Link to={createPageUrl("Inspecciones")} className="block">
                  <div className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-sm">
                    <FileText className="w-8 h-8 mb-2" />
                    <p className="font-semibold">Nueva Inspección</p>
                  </div>
                </Link>
                <Link to={createPageUrl("Inventario")} className="block">
                  <div className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-sm">
                    <TrendingUp className="w-8 h-8 mb-2" />
                    <p className="font-semibold">Ver Inventario</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}