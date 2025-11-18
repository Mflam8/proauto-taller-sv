import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Plus, Edit, Eye, CheckCircle, XCircle, Clock, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CotizacionForm from "../components/cotizaciones/CotizacionForm";
import CotizacionDetalle from "../components/cotizaciones/CotizacionDetalle";

export default function Cotizaciones() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingCotizacion, setEditingCotizacion] = useState(null);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const queryClient = useQueryClient();

  const { data: cotizaciones = [], isLoading } = useQuery({
    queryKey: ['cotizaciones'],
    queryFn: () => base44.entities.Cotizacion.list('-created_date'),
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

  const aprobarMutation = useMutation({
    mutationFn: ({ id, metodo }) => base44.entities.Cotizacion.update(id, {
      estado: 'Aprobada',
      fecha_aprobacion: new Date().toISOString(),
      metodo_aprobacion: metodo
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
    },
  });

  const getClienteNombre = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nombre_completo || 'N/A';
  };

  const getVehiculoInfo = (vehiculoId) => {
    const vehiculo = vehiculos.find(v => v.id === vehiculoId);
    return vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.placa}` : 'N/A';
  };

  const filteredCotizaciones = cotizaciones.filter(cotizacion => {
    const matchesSearch = 
      cotizacion.numero_cotizacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClienteNombre(cotizacion.cliente_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehiculoInfo(cotizacion.vehiculo_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === "all" || cotizacion.estado === filterEstado;
    
    return matchesSearch && matchesEstado;
  });

  const handleEdit = (cotizacion) => {
    setEditingCotizacion(cotizacion);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCotizacion(null);
  };

  const handleAprobar = async (id, metodo) => {
    if (window.confirm(`¿Aprobar esta cotización por ${metodo}?`)) {
      aprobarMutation.mutate({ id, metodo });
    }
  };

  const getEstadoBadge = (estado) => {
    const configs = {
      'Pendiente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      'Aprobada': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      'Rechazada': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      'Vencida': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle }
    };
    return configs[estado] || configs['Pendiente'];
  };

  const estadisticas = {
    total: cotizaciones.length,
    pendientes: cotizaciones.filter(c => c.estado === 'Pendiente').length,
    aprobadas: cotizaciones.filter(c => c.estado === 'Aprobada').length,
    montoTotal: cotizaciones.reduce((sum, c) => sum + (c.total || 0), 0)
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cotizaciones</h1>
              <p className="text-gray-600">Gestiona cotizaciones y aprobaciones</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] hover:from-[#B71C1C] hover:to-[#E31E24] text-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nueva Cotización
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.total}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.pendientes}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aprobadas</p>
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.aprobadas}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monto Total</p>
                  <p className="text-2xl font-bold text-gray-900">${estadisticas.montoTotal.toFixed(2)}</p>
                </div>
                <FileText className="w-10 h-10 text-[#E31E24]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Buscar por número, cliente o vehículo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-[#E31E24] transition-colors"
                  />
                </div>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger className="h-11 border-gray-200 focus:border-[#E31E24]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Aprobada">Aprobada</SelectItem>
                    <SelectItem value="Rechazada">Rechazada</SelectItem>
                    <SelectItem value="Vencida">Vencida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cotizaciones List */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-0 shadow-md animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCotizaciones.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCotizaciones.map((cotizacion, index) => {
                const estadoBadge = getEstadoBadge(cotizacion.estado);
                const EstadoIcon = estadoBadge.icon;
                
                return (
                  <motion.div
                    key={cotizacion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className="h-2 bg-gradient-to-r from-[#E31E24] to-[#B71C1C]"></div>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              COT-{cotizacion.numero_cotizacion || cotizacion.id.slice(0, 8)}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(cotizacion.created_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={`${estadoBadge.color} border flex items-center gap-1`}>
                            <EstadoIcon className="w-3 h-3" />
                            {cotizacion.estado}
                          </Badge>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">Cliente</p>
                            <p className="font-semibold text-gray-900">
                              {getClienteNombre(cotizacion.cliente_id)}
                            </p>
                          </div>

                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">Vehículo</p>
                            <p className="font-semibold text-gray-900">
                              {getVehiculoInfo(cotizacion.vehiculo_id)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Total</span>
                            <span className="text-xl font-bold text-green-700">
                              ${cotizacion.total?.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCotizacion(cotizacion)}
                            className="flex-1 border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          
                          {cotizacion.estado === 'Pendiente' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(cotizacion)}
                                className="border-gray-200 hover:border-[#E31E24] hover:text-[#E31E24] transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAprobar(cotizacion.id, 'Digital')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
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
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron cotizaciones</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterEstado !== "all" 
                    ? 'Intenta con otros filtros' 
                    : 'Comienza creando tu primera cotización'}
                </p>
                {!searchTerm && filterEstado === "all" && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] text-white"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Crear Primera Cotización
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingCotizacion ? 'Editar Cotización' : 'Nueva Cotización'}
            </DialogTitle>
          </DialogHeader>
          <CotizacionForm cotizacion={editingCotizacion} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>

      {/* Detalle Dialog */}
      <Dialog open={!!selectedCotizacion} onOpenChange={() => setSelectedCotizacion(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detalle de Cotización</DialogTitle>
          </DialogHeader>
          {selectedCotizacion && <CotizacionDetalle cotizacion={selectedCotizacion} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}