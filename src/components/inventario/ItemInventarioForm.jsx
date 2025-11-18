import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";

export default function ItemInventarioForm({ item, onClose }) {
  const [formData, setFormData] = useState(item || {
    codigo: "",
    nombre: "",
    descripcion: "",
    categoria: "Repuestos",
    stock_actual: 0,
    stock_minimo: 5,
    precio_compra: 0,
    precio_venta: 0,
    proveedor_principal: "",
    ubicacion_fisica: "",
    activo: true
  });

  const queryClient = useQueryClient();

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => base44.entities.Proveedor.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ItemInventario.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ItemInventario.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (item?.id) {
      updateMutation.mutate({ id: item.id, data: formData });
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
        <div className="space-y-2">
          <Label htmlFor="codigo" className="text-sm font-semibold text-gray-700">
            Código
          </Label>
          <Input
            id="codigo"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Código único del item"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombre" className="text-sm font-semibold text-gray-700">
            Nombre *
          </Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Nombre del item"
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descripcion" className="text-sm font-semibold text-gray-700">
            Descripción
          </Label>
          <Textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Descripción detallada"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria" className="text-sm font-semibold text-gray-700">
            Categoría *
          </Label>
          <Select value={formData.categoria} onValueChange={(value) => handleChange('categoria', value)}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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

        <div className="space-y-2">
          <Label htmlFor="ubicacion_fisica" className="text-sm font-semibold text-gray-700">
            Ubicación Física
          </Label>
          <Input
            id="ubicacion_fisica"
            value={formData.ubicacion_fisica}
            onChange={(e) => handleChange('ubicacion_fisica', e.target.value)}
            placeholder="Ej: Estante A-3"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_actual" className="text-sm font-semibold text-gray-700">
            Stock Actual *
          </Label>
          <Input
            id="stock_actual"
            type="number"
            min="0"
            value={formData.stock_actual}
            onChange={(e) => handleChange('stock_actual', parseInt(e.target.value) || 0)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_minimo" className="text-sm font-semibold text-gray-700">
            Stock Mínimo *
          </Label>
          <Input
            id="stock_minimo"
            type="number"
            min="0"
            value={formData.stock_minimo}
            onChange={(e) => handleChange('stock_minimo', parseInt(e.target.value) || 0)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="precio_compra" className="text-sm font-semibold text-gray-700">
            Precio Compra
          </Label>
          <Input
            id="precio_compra"
            type="number"
            step="0.01"
            min="0"
            value={formData.precio_compra}
            onChange={(e) => handleChange('precio_compra', parseFloat(e.target.value) || 0)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="precio_venta" className="text-sm font-semibold text-gray-700">
            Precio Venta
          </Label>
          <Input
            id="precio_venta"
            type="number"
            step="0.01"
            min="0"
            value={formData.precio_venta}
            onChange={(e) => handleChange('precio_venta', parseFloat(e.target.value) || 0)}
            className="h-11"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="proveedor_principal" className="text-sm font-semibold text-gray-700">
            Proveedor Principal
          </Label>
          <Select value={formData.proveedor_principal} onValueChange={(value) => handleChange('proveedor_principal', value)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Seleccionar proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Sin proveedor</SelectItem>
              {proveedores.map(prov => (
                <SelectItem key={prov.id} value={prov.id}>
                  {prov.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar Item'}
        </Button>
      </div>
    </form>
  );
}