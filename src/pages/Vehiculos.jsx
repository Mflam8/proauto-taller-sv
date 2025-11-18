import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Search, Plus, Edit, Trash2, Calendar, Fuel, Hash, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VehiculoForm from "../components/vehiculos/VehiculoForm.jsx";
import VehiculoDetalle from "../components/vehiculos/VehiculoDetalle.jsx";
import { Badge } from "@/components/ui/badge";

export default function Vehiculos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCliente, setFilterCliente] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const queryClient = useQueryClient();

  const { data: vehiculos = [], isLoading } = useQuery({
    queryKey: ['vehiculos'],
    queryFn: () => base44.entities.Vehiculo.list('-created_date'),
    initialData: [],
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vehiculo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
    },
  });

  const getClienteNombre = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nombre_completo || 'Cliente no encontrado';
  };

  const filteredVehiculos = vehiculos.filter(vehiculo => {
    const matchesSearch = 
      vehiculo.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehiculo.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehiculo.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClienteNombre(vehiculo.cliente_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCliente = filterCliente === "all" || vehiculo.cliente_id === filterCliente;
    
    return matchesSearch && matchesCliente;
  });

  const handleEdit = (vehiculo) => {
    setEditingVehiculo(vehiculo);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este vehículo?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingVehiculo(null);
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
              <Car className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vehículos</h1>
              <p className="text-gray-600">Gestiona los vehículos de tus clientes</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] hover:from-[#B71C1C] hover:to-[#E31E24] text-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Vehículo
          </Button>
        </motion.div>

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
                    placeholder="Buscar por placa, marca, modelo o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-[#E31E24] transition-colors"
                  />
                </div>
                <Select value={filterCliente} onValueChange={setFilterCliente}>
                  <SelectTrigger className="h-11 border-gray-200 focus:border-[#E31E24]">
                    <SelectValue placeholder="Filtrar por cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Vehículos</p>
                  <p className="text-3xl font-bold text-gray-900">{vehiculos.length}</p>
                </div>
                <Car className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gasolina</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {vehiculos.filter(v => v.tipo_combustible === 'Gasolina').length}
                  </p>
                </div>
                <Fuel className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Diesel</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {vehiculos.filter(v => v.tipo_combustible === 'Diesel').length}
                  </p>
                </div>
                <Fuel className="w-10 h-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Híbridos/Eléctricos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {vehiculos.filter(v => ['Híbrido', 'Eléctrico'].includes(v.tipo_combustible)).length}
                  </p>
                </div>
                <Fuel className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehículos List */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-0 shadow-md animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredVehiculos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehiculos.map((vehiculo, index) => (
                <motion.div
                  key={vehiculo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {vehiculo.marca?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                              {vehiculo.marca} {vehiculo.modelo}
                            </h3>
                            <p className="text-sm text-gray-500">{getClienteNombre(vehiculo.cliente_id)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Placa</span>
                          </div>
                          <span className="font-bold text-gray-900">{vehiculo.placa}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Año: {vehiculo.anio}</span>
                          </div>
                          {vehiculo.color && (
                            <Badge variant="outline" className="capitalize">
                              {vehiculo.color}
                            </Badge>
                          )}
                        </div>

                        {vehiculo.tipo_combustible && (
                          <div className="flex items-center gap-2">
                            <Fuel className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{vehiculo.tipo_combustible}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedVehiculo(vehiculo)}
                          className="flex-1 border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(vehiculo)}
                          className="border-gray-200 hover:border-[#E31E24] hover:text-[#E31E24] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(vehiculo.id)}
                          className="border-gray-200 hover:border-red-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="p-12 text-center">
                <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron vehículos</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterCliente !== "all" ? 'Intenta con otros filtros' : 'Comienza registrando el primer vehículo'}
                </p>
                {!searchTerm && filterCliente === "all" && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] text-white"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Registrar Primer Vehículo
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
            </DialogTitle>
          </DialogHeader>
          <VehiculoForm vehiculo={editingVehiculo} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>

      {/* Detalle Dialog */}
      <Dialog open={!!selectedVehiculo} onOpenChange={() => setSelectedVehiculo(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detalle del Vehículo</DialogTitle>
          </DialogHeader>
          {selectedVehiculo && <VehiculoDetalle vehiculo={selectedVehiculo} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}