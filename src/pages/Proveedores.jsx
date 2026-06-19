import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Truck, Search, Plus, Phone, Mail, MapPin, Edit, Trash2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProveedorForm from "@/components/proveedores/ProveedorForm";
import ProveedorDetalle from "@/components/proveedores/ProveedorDetalle";

export default function Proveedores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const queryClient = useQueryClient();

  const { data: proveedores = [], isLoading } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => base44.entities.Proveedor.list('-created_date'),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Proveedor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
  });

  const filteredProveedores = proveedores.filter(proveedor =>
    proveedor.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.contacto_principal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.telefono?.includes(searchTerm)
  );

  const handleEdit = (proveedor) => {
    setEditingProveedor(proveedor);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este proveedor?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProveedor(null);
  };

  const proveedoresActivos = proveedores.filter(p => p.activo !== false).length;

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
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
              <p className="text-gray-600">Gestiona tus proveedores de repuestos</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] hover:from-[#B71C1C] hover:to-[#E31E24] text-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Proveedor
          </Button>
        </motion.div>

        {/* Search */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar por nombre, contacto o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 border-gray-200 focus:border-[#E31E24] transition-colors"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Proveedores</p>
                  <p className="text-3xl font-bold text-gray-900">{proveedores.length}</p>
                </div>
                <Truck className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Activos</p>
                  <p className="text-3xl font-bold text-gray-900">{proveedoresActivos}</p>
                </div>
                <Truck className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactivos</p>
                  <p className="text-3xl font-bold text-gray-900">{proveedores.length - proveedoresActivos}</p>
                </div>
                <Truck className="w-10 h-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Proveedores List */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-0 shadow-md animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-24 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProveedores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProveedores.map((proveedor, index) => (
                <motion.div
                  key={proveedor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <div className={`h-2 ${proveedor.activo !== false ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-400'}`}></div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {proveedor.nombre?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {proveedor.nombre}
                            </h3>
                            <Badge variant={proveedor.activo !== false ? "default" : "secondary"} className="text-xs mt-1">
                              {proveedor.activo !== false ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {proveedor.contacto_principal && (
                          <p className="text-sm text-gray-600 font-medium">
                            👤 {proveedor.contacto_principal}
                          </p>
                        )}
                        {proveedor.telefono && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{proveedor.telefono}</span>
                          </div>
                        )}
                        {proveedor.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{proveedor.email}</span>
                          </div>
                        )}
                        {proveedor.productos_suministrados && proveedor.productos_suministrados.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {proveedor.productos_suministrados.slice(0, 2).map((prod, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {prod}
                              </Badge>
                            ))}
                            {proveedor.productos_suministrados.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{proveedor.productos_suministrados.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProveedor(proveedor)}
                          className="flex-1 border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(proveedor)}
                          className="border-gray-200 hover:border-[#E31E24] hover:text-[#E31E24] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(proveedor.id)}
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
                <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron proveedores</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Intenta con otros términos' : 'Comienza agregando tu primer proveedor'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] text-white"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Agregar Primer Proveedor
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
          </DialogHeader>
          <ProveedorForm proveedor={editingProveedor} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>

      {/* Detalle Dialog */}
      <Dialog open={!!selectedProveedor} onOpenChange={() => setSelectedProveedor(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detalle del Proveedor</DialogTitle>
          </DialogHeader>
          {selectedProveedor && <ProveedorDetalle proveedor={selectedProveedor} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}