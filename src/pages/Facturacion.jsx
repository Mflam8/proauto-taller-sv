import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Search, Plus, Eye, Receipt, CreditCard, AlertCircle, CheckCircle, Clock, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FacturaDetalle from "../components/facturacion/FacturaDetalle.jsx";
import PagoForm from "../components/facturacion/PagoForm.jsx";

export default function Facturacion() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [facturaParaPago, setFacturaParaPago] = useState(null);
  const queryClient = useQueryClient();

  const { data: facturas = [], isLoading } = useQuery({
    queryKey: ['facturas'],
    queryFn: () => base44.entities.Factura.list('-fecha_emision'),
    initialData: [],
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    initialData: [],
  });

  const { data: pagos = [] } = useQuery({
    queryKey: ['pagos'],
    queryFn: () => base44.entities.Pago.list('-created_date'),
    initialData: [],
  });

  const getClienteNombre = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nombre_completo || 'N/A';
  };

  const getPagosFactura = (facturaId) => {
    return pagos.filter(p => p.factura_id === facturaId);
  };

  const filteredFacturas = facturas.filter(factura => {
    const matchesSearch = 
      factura.numero_factura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClienteNombre(factura.cliente_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === "all" || factura.estado_pago === filterEstado;
    
    return matchesSearch && matchesEstado;
  });

  const handleRegistrarPago = (factura) => {
    setFacturaParaPago(factura);
    setShowPagoForm(true);
  };

  const handleClosePagoForm = () => {
    setShowPagoForm(false);
    setFacturaParaPago(null);
  };

  const getEstadoBadge = (estado) => {
    const configs = {
      'Pendiente': { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle },
      'Parcial': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      'Pagada': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      'Vencida': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle },
      'Cerrada': { color: 'bg-slate-200 text-slate-700 border-slate-300', icon: Lock }
    };
    return configs[estado] || configs['Pendiente'];
  };

  // Estadísticas
  const totalFacturado = facturas.reduce((sum, f) => sum + (f.total || 0), 0);
  const totalCobrado = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
  const facturasConDeuda = facturas.filter(f => (f.saldo_pendiente || 0) > 0 && f.estado_pago !== 'Pagada' && f.estado_pago !== 'Cerrada');
  const pendienteCobro = facturasConDeuda.reduce((sum, f) => sum + (f.saldo_pendiente || 0), 0);
  const facturasPendientes = facturasConDeuda.length;

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
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Facturación y Pagos</h1>
            <p className="text-gray-600">Control de facturas y registro de pagos</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Facturado</p>
                  <p className="text-3xl font-bold text-gray-900">${totalFacturado.toFixed(2)}</p>
                </div>
                <Receipt className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cobrado</p>
                  <p className="text-3xl font-bold text-gray-900">${totalCobrado.toFixed(2)}</p>
                </div>
                <CreditCard className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Por Cobrar</p>
                  <p className="text-3xl font-bold text-gray-900">${pendienteCobro.toFixed(2)}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Facturas Pendientes</p>
                  <p className="text-3xl font-bold text-gray-900">{facturasPendientes}</p>
                </div>
                <Clock className="w-10 h-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por número de factura o cliente..."
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
                  <SelectItem value="Parcial">Parcial</SelectItem>
                  <SelectItem value="Pagada">Pagada</SelectItem>
                  <SelectItem value="Vencida">Vencida</SelectItem>
                  <SelectItem value="Cerrada">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Facturas List */}
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
          ) : filteredFacturas.length > 0 ? (
            <div className="space-y-4">
              {filteredFacturas.map((factura, index) => {
                const estadoBadge = getEstadoBadge(factura.estado_pago);
                const EstadoIcon = estadoBadge.icon;
                const pagosFactura = getPagosFactura(factura.id);
                
                return (
                  <motion.div
                    key={factura.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-bold text-lg text-gray-900">
                                    Factura #{factura.numero_factura || factura.id.slice(0, 8)}
                                  </h3>
                                  <Badge className={`${estadoBadge.color} border flex items-center gap-1`}>
                                    <EstadoIcon className="w-3 h-3" />
                                    {factura.estado_pago}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 font-medium mb-1">
                                  Cliente: {getClienteNombre(factura.cliente_id)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Fecha emisión: {factura.fecha_emision ? new Date(factura.fecha_emision).toLocaleDateString() : '—'}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600">Total Factura</p>
                                <p className="text-xl font-bold text-gray-900">
                                  ${factura.total?.toFixed(2)}
                                </p>
                              </div>

                              <div className="p-3 bg-green-50 rounded-lg">
                                <p className="text-xs text-gray-600">Monto Pagado</p>
                                <p className="text-xl font-bold text-green-700">
                                  ${(factura.monto_pagado || 0).toFixed(2)}
                                </p>
                              </div>

                              <div className="p-3 bg-red-50 rounded-lg">
                                <p className="text-xs text-gray-600">Saldo Pendiente</p>
                                <p className="text-xl font-bold text-red-700">
                                  ${((factura.total || 0) - (factura.monto_pagado || 0)).toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {pagosFactura.length > 0 && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-xs text-gray-600 mb-2">Pagos Registrados: {pagosFactura.length}</p>
                                <div className="flex flex-wrap gap-2">
                                  {pagosFactura.slice(0, 3).map(pago => (
                                    <Badge key={pago.id} variant="outline" className="bg-white">
                                      {pago.metodo_pago}: ${pago.monto.toFixed(2)}
                                    </Badge>
                                  ))}
                                  {pagosFactura.length > 3 && (
                                    <Badge variant="outline" className="bg-white">
                                      +{pagosFactura.length - 3} más
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex md:flex-col gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedFactura(factura)}
                              className="flex-1 md:w-32 border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </Button>
                            
                            {factura.estado_pago !== 'Pagada' && (
                              <Button
                                onClick={() => handleRegistrarPago(factura)}
                                className="flex-1 md:w-32 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Pagar
                              </Button>
                            )}
                          </div>
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
                <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron facturas</h3>
                <p className="text-gray-600">
                  {searchTerm || filterEstado !== "all" 
                    ? 'Intenta con otros filtros' 
                    : 'Las facturas aparecerán aquí cuando se completen órdenes de trabajo'}
                </p>
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
      </div>

      {/* Detalle Dialog */}
      <Dialog open={!!selectedFactura} onOpenChange={() => setSelectedFactura(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detalle de Factura</DialogTitle>
          </DialogHeader>
          {selectedFactura && <FacturaDetalle factura={selectedFactura} />}
        </DialogContent>
      </Dialog>

      {/* Pago Form Dialog */}
      <Dialog open={showPagoForm} onOpenChange={setShowPagoForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Registrar Pago</DialogTitle>
          </DialogHeader>
          {facturaParaPago && <PagoForm factura={facturaParaPago} onClose={handleClosePagoForm} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}