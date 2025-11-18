import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Save, X, Plus, Trash2 } from "lucide-react";

export default function CotizacionForm({ cotizacion, onClose }) {
  const [formData, setFormData] = useState(cotizacion || {
    numero_cotizacion: `COT-${Date.now().toString().slice(-6)}`,
    cliente_id: "",
    vehiculo_id: "",
    servicios: [],
    subtotal: 0,
    descuento: 0,
    total: 0,
    estado: "Pendiente",
    notas: "",
    vigencia_dias: 15
  });

  const queryClient = useQueryClient();

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

  const { data: servicios = [] } = useQuery({
    queryKey: ['servicios'],
    queryFn: () => base44.entities.Servicio.filter({ activo: true }),
    initialData: [],
  });

  const vehiculosFiltrados = formData.cliente_id 
    ? vehiculos.filter(v => v.cliente_id === formData.cliente_id)
    : [];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Cotizacion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cotizacion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
      onClose();
    },
  });

  const calcularTotales = (serviciosActualizados, descuento) => {
    const subtotal = serviciosActualizados.reduce((sum, s) => sum + (s.precio || 0), 0);
    const total = subtotal - (descuento || 0);
    return { subtotal, total };
  };

  const handleAgregarServicio = (servicioId) => {
    const servicio = servicios.find(s => s.id === servicioId);
    if (servicio) {
      const nuevoServicio = {
        servicio_id: servicio.id,
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        precio: servicio.precio_base
      };
      const nuevosServicios = [...formData.servicios, nuevoServicio];
      const { subtotal, total } = calcularTotales(nuevosServicios, formData.descuento);
      setFormData(prev => ({
        ...prev,
        servicios: nuevosServicios,
        subtotal,
        total
      }));
    }
  };

  const handleEliminarServicio = (index) => {
    const nuevosServicios = formData.servicios.filter((_, i) => i !== index);
    const { subtotal, total } = calcularTotales(nuevosServicios, formData.descuento);
    setFormData(prev => ({
      ...prev,
      servicios: nuevosServicios,
      subtotal,
      total
    }));
  };

  const handleCambiarPrecio = (index, nuevoPrecio) => {
    const nuevosServicios = [...formData.servicios];
    nuevosServicios[index].precio = parseFloat(nuevoPrecio) || 0;
    const { subtotal, total } = calcularTotales(nuevosServicios, formData.descuento);
    setFormData(prev => ({
      ...prev,
      servicios: nuevosServicios,
      subtotal,
      total
    }));
  };

  const handleCambiarDescuento = (descuento) => {
    const descuentoNum = parseFloat(descuento) || 0;
    const { subtotal, total } = calcularTotales(formData.servicios, descuentoNum);
    setFormData(prev => ({
      ...prev,
      descuento: descuentoNum,
      subtotal,
      total
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cotizacion?.id) {
      updateMutation.mutate({ id: cotizacion.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <Card className="border-gray-200">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Información General</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Número de Cotización</Label>
              <Input
                value={formData.numero_cotizacion}
                onChange={(e) => handleChange('numero_cotizacion', e.target.value)}
                className="h-11 border-gray-300 bg-gray-50"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Vigencia (días)</Label>
              <Input
                type="number"
                value={formData.vigencia_dias}
                onChange={(e) => handleChange('vigencia_dias', parseInt(e.target.value))}
                className="h-11 border-gray-300 focus:border-[#E31E24]"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Cliente *</Label>
              <Select
                value={formData.cliente_id}
                onValueChange={(value) => {
                  handleChange('cliente_id', value);
                  handleChange('vehiculo_id', ''); // Reset vehiculo
                }}
                required
              >
                <SelectTrigger className="h-11 border-gray-300 focus:border-[#E31E24]">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Vehículo *</Label>
              <Select
                value={formData.vehiculo_id}
                onValueChange={(value) => handleChange('vehiculo_id', value)}
                disabled={!formData.cliente_id}
                required
              >
                <SelectTrigger className="h-11 border-gray-300 focus:border-[#E31E24]">
                  <SelectValue placeholder={formData.cliente_id ? "Selecciona un vehículo" : "Primero selecciona un cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {vehiculosFiltrados.map(vehiculo => (
                    <SelectItem key={vehiculo.id} value={vehiculo.id}>
                      {vehiculo.marca} {vehiculo.modelo} - {vehiculo.placa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Servicios */}
      <Card className="border-gray-200">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-900">Servicios</h3>
            <Select onValueChange={handleAgregarServicio}>
              <SelectTrigger className="w-64 h-10 border-gray-300">
                <SelectValue placeholder="+ Agregar servicio" />
              </SelectTrigger>
              <SelectContent>
                {servicios.map(servicio => (
                  <SelectItem key={servicio.id} value={servicio.id}>
                    {servicio.nombre} - ${servicio.precio_base}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.servicios.length > 0 ? (
            <div className="space-y-3">
              {formData.servicios.map((servicio, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{servicio.nombre}</p>
                    {servicio.descripcion && (
                      <p className="text-sm text-gray-600 mt-1">{servicio.descripcion}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32">
                      <Input
                        type="number"
                        value={servicio.precio}
                        onChange={(e) => handleCambiarPrecio(index, e.target.value)}
                        className="h-9 text-right font-semibold"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEliminarServicio(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No hay servicios agregados</p>
              <p className="text-sm">Selecciona servicios del menú superior</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totales */}
      <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-white">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Resumen</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Subtotal:</span>
              <span className="text-xl font-semibold text-gray-900">
                ${formData.subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label className="text-gray-700">Descuento:</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">$</span>
                <Input
                  type="number"
                  value={formData.descuento}
                  onChange={(e) => handleCambiarDescuento(e.target.value)}
                  className="w-32 h-9 text-right"
                  step="0.01"
                  min="0"
                  max={formData.subtotal}
                />
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-3xl font-bold text-[#E31E24]">
                  ${formData.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Notas</Label>
          <Textarea
            value={formData.notas}
            onChange={(e) => handleChange('notas', e.target.value)}
            placeholder="Información adicional sobre la cotización"
            rows={3}
            className="border-gray-300 focus:border-[#E31E24] resize-none"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="border-gray-300 hover:bg-gray-50"
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending || formData.servicios.length === 0}
          className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] hover:from-[#B71C1C] hover:to-[#E31E24] text-white shadow-md"
        >
          <Save className="w-4 h-4 mr-2" />
          {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar Cotización'}
        </Button>
      </div>
    </form>
  );
}