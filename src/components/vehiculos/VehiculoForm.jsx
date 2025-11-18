import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";

export default function VehiculoForm({ vehiculo, onClose }) {
  const [formData, setFormData] = useState(vehiculo || {
    cliente_id: "",
    placa: "",
    marca: "",
    modelo: "",
    anio: new Date().getFullYear(),
    color: "",
    vin: "",
    tipo_combustible: "Gasolina",
    kilometraje_actual: 0,
    notas: ""
  });

  const queryClient = useQueryClient();

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vehiculo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vehiculo.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (vehiculo?.id) {
      updateMutation.mutate({ id: vehiculo.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cliente_id" className="text-sm font-semibold text-gray-700">
            Cliente *
          </Label>
          <Select
            value={formData.cliente_id}
            onValueChange={(value) => handleChange('cliente_id', value)}
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
          <Label htmlFor="placa" className="text-sm font-semibold text-gray-700">
            Placa *
          </Label>
          <Input
            id="placa"
            value={formData.placa}
            onChange={(e) => handleChange('placa', e.target.value.toUpperCase())}
            placeholder="Ej: P123456"
            required
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors uppercase"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vin" className="text-sm font-semibold text-gray-700">
            VIN
          </Label>
          <Input
            id="vin"
            value={formData.vin}
            onChange={(e) => handleChange('vin', e.target.value.toUpperCase())}
            placeholder="Número VIN"
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors uppercase"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="marca" className="text-sm font-semibold text-gray-700">
            Marca *
          </Label>
          <Input
            id="marca"
            value={formData.marca}
            onChange={(e) => handleChange('marca', e.target.value)}
            placeholder="Ej: Toyota"
            required
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="modelo" className="text-sm font-semibold text-gray-700">
            Modelo *
          </Label>
          <Input
            id="modelo"
            value={formData.modelo}
            onChange={(e) => handleChange('modelo', e.target.value)}
            placeholder="Ej: Corolla"
            required
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="anio" className="text-sm font-semibold text-gray-700">
            Año *
          </Label>
          <Input
            id="anio"
            type="number"
            value={formData.anio}
            onChange={(e) => handleChange('anio', parseInt(e.target.value))}
            min="1900"
            max={new Date().getFullYear() + 1}
            required
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color" className="text-sm font-semibold text-gray-700">
            Color
          </Label>
          <Input
            id="color"
            value={formData.color}
            onChange={(e) => handleChange('color', e.target.value)}
            placeholder="Ej: Rojo"
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo_combustible" className="text-sm font-semibold text-gray-700">
            Tipo de Combustible
          </Label>
          <Select
            value={formData.tipo_combustible}
            onValueChange={(value) => handleChange('tipo_combustible', value)}
          >
            <SelectTrigger className="h-11 border-gray-300 focus:border-[#E31E24]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Gasolina">Gasolina</SelectItem>
              <SelectItem value="Diesel">Diesel</SelectItem>
              <SelectItem value="Híbrido">Híbrido</SelectItem>
              <SelectItem value="Eléctrico">Eléctrico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kilometraje_actual" className="text-sm font-semibold text-gray-700">
            Kilometraje Actual
          </Label>
          <Input
            id="kilometraje_actual"
            type="number"
            value={formData.kilometraje_actual}
            onChange={(e) => handleChange('kilometraje_actual', parseInt(e.target.value) || 0)}
            min="0"
            placeholder="0"
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notas" className="text-sm font-semibold text-gray-700">
            Notas
          </Label>
          <Textarea
            id="notas"
            value={formData.notas}
            onChange={(e) => handleChange('notas', e.target.value)}
            placeholder="Información adicional sobre el vehículo"
            rows={3}
            className="border-gray-300 focus:border-[#E31E24] transition-colors resize-none"
          />
        </div>
      </div>

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
          disabled={createMutation.isPending || updateMutation.isPending}
          className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] hover:from-[#B71C1C] hover:to-[#E31E24] text-white shadow-md"
        >
          <Save className="w-4 h-4 mr-2" />
          {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar Vehículo'}
        </Button>
      </div>
    </form>
  );
}