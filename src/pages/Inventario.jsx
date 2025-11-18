import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Plus, AlertCircle, TrendingUp, TrendingDown, Eye, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ItemInventarioForm from "../components/inventario/ItemInventarioForm.jsx";
import ItemInventarioDetalle from "../components/inventario/ItemInventarioDetalle.jsx";
import MovimientoForm from "../components/inventario/MovimientoForm.jsx";

export default function Inventario() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [showItemForm, setShowItemForm] = useState(false);
  const [showMovimientoForm, setShowMovimientoForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemParaMovimiento, setItemParaMovimiento] = useState(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventario'],
    queryFn: () => base44.entities.ItemInventario.list('-created_date'),
    initialData: [],
  });

  const { data: movimientos = [] } = useQuery({
    queryKey: ['movimientos'],
    queryFn: () => base44.entities.MovimientoInventario.list('-created_date'),
    initialData: [],
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.ItemInventario.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
    },
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategoria = filterCategoria === "all" || item.categoria === filterCategoria;
    
    return matchesSearch && matchesCategoria;
  });

  const itemsStockBajo = items.filter(item => item.stock_actual <= item.stock_minimo);
  const valorInventario = items.reduce((sum, item) => sum + ((item.precio_compra || 0) * (item.stock_actual || 0)), 0);

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este item?')) {
      deleteItemMutation.mutate(id);
    }
  };

  const handleRegistrarMovimiento = (item) => {
    setItemParaMovimiento(item);
    setShowMovimientoForm(true);
  };

  const handleCloseItemForm = () => {
    setShowItemForm(false);
    setEditingItem(null);
  };

  const handleCloseMovimientoForm = () => {
    setShowMovimientoForm(false);
    setItemParaMovimiento(null);
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
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
              <p className="text-gray-600">Control de repuestos e insumos</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowMovimientoForm(true)}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Movimiento
            </Button>
            <Button
              onClick={() => setShowItemForm(true)}
              className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] hover:from-[#B71C1C] hover:to-[#E31E24] text-white shadow-md"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Item
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-3xl font-bold text-gray-900">{items.length}</p>
                </div>
                <Package className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock Bajo</p>
                  <p className="text-3xl font-bold text-gray-900">{itemsStockBajo.length}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valor Inventario</p>
                  <p className="text-2xl font-bold text-gray-900">${valorInventario.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Movimientos</p>
                  <p className="text-3xl font-bold text-gray-900">{movimientos.length}</p>
                </div>
                <TrendingDown className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts de Stock Bajo */}
        {itemsStockBajo.length > 0 && (
          <Card className="border-0 shadow-md bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">
                    {itemsStockBajo.length} items con stock bajo
                  </p>
                  <p className="text-sm text-red-700">
                    Se recomienda realizar pedidos a proveedores
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-gray-200 focus:border-[#E31E24] transition-colors"
                />
              </div>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-[#E31E24]">
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="Repuestos">Repuestos</SelectItem>
                  <SelectItem value="Aceites y Lubricantes">Aceites y Lubricantes</SelectItem>
                  <SelectItem value="Filtros">Filtros</SelectItem>
                  <SelectItem value="Frenos">Frenos</SelectItem>
                  <SelectItem value="Suspensión">Suspensión</SelectItem>
                  <SelectItem value="Sistema Eléctrico">Sistema Eléctrico</SelectItem>
                  <SelectItem value="Herramientas">Herramientas</SelectItem>
                  <SelectItem value="Insumos">Insumos</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Items List */}
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
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => {
                const stockBajo = item.stock_actual <= item.stock_minimo;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className={`border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${stockBajo ? 'ring-2 ring-red-300' : ''}`}>
                      <div className={`h-2 ${stockBajo ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}></div>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-gray-900">{item.nombre}</h3>
                              {stockBajo && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Bajo
                                </Badge>
                              )}
                            </div>
                            {item.codigo && (
                              <p className="text-sm text-gray-600">Código: {item.codigo}</p>
                            )}
                            <Badge variant="outline" className="mt-2">
                              {item.categoria}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-gray-600">Stock</p>
                            <p className="text-xl font-bold text-blue-700">{item.stock_actual || 0}</p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-gray-600">Precio</p>
                            <p className="text-lg font-bold text-green-700">${(item.precio_venta || 0).toFixed(2)}</p>
                          </div>
                        </div>

                        {item.ubicacion_fisica && (
                          <p className="text-sm text-gray-600 mb-3">📍 {item.ubicacion_fisica}</p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                            className="flex-1 border-gray-200 hover:border-blue-500 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegistrarMovimiento(item)}
                            className="border-gray-200 hover:border-green-500 hover:text-green-600"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="border-gray-200 hover:border-[#E31E24] hover:text-[#E31E24]"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="border-gray-200 hover:border-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron items</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterCategoria !== "all" 
                    ? 'Intenta con otros filtros' 
                    : 'Comienza agregando items al inventario'}
                </p>
                {!searchTerm && filterCategoria === "all" && (
                  <Button
                    onClick={() => setShowItemForm(true)}
                    className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] text-white"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Agregar Primer Item
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
      </div>

      {/* Item Form Dialog */}
      <Dialog open={showItemForm} onOpenChange={setShowItemForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingItem ? 'Editar Item' : 'Nuevo Item de Inventario'}
            </DialogTitle>
          </DialogHeader>
          <ItemInventarioForm item={editingItem} onClose={handleCloseItemForm} />
        </DialogContent>
      </Dialog>

      {/* Movimiento Form Dialog */}
      <Dialog open={showMovimientoForm} onOpenChange={setShowMovimientoForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Registrar Movimiento</DialogTitle>
          </DialogHeader>
          <MovimientoForm item={itemParaMovimiento} onClose={handleCloseMovimientoForm} />
        </DialogContent>
      </Dialog>

      {/* Detalle Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detalle del Item</DialogTitle>
          </DialogHeader>
          {selectedItem && <ItemInventarioDetalle item={selectedItem} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}