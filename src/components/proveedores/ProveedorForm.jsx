import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, X, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProveedorForm({ proveedor, onClose }) {
  const [formData, setFormData] = useState(proveedor || {
    nombre: "",
    contacto_principal: "",
    telefono: "",
    email: "",
    direccion: "",
    productos_suministrados: [],
    terminos_pago: "",
    notas: "",
    activo: true
  });

  const [nuevoProducto, setNuevoProducto] = useState("");

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Proveedor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Proveedor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (proveedor?.id) {
      updateMutation.mutate({ id: proveedor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const agregarProducto = () => {
    if (nuevoProducto.trim()) {
      setFormData(prev => ({
        ...prev,
        productos_suministrados: [...(prev.productos_suministrados || []), nuevoProducto.trim()]
      }));
      setNuevoProducto("");
    }
  };

  const eliminarProducto = (index) => {
    setFormData(prev => ({
      ...prev,
      productos_suministrados: prev.productos_suministrados.filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nombre" className="text-sm font-semibold text-gray-700">
            Nombre del Proveedor *
          </Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Ej: Repuestos El Salvador S.A."
            required
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contacto_principal" className="text-sm font-semibold text-gray-700">
            Contacto Principal
          </Label>
          <Input
            id="contacto_principal"
            value={formData.contacto_principal}
            onChange={(e) => handleChange('contacto_principal', e.target.value)}
            placeholder="Nombre del contacto"
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono" className="text-sm font-semibold text-gray-700">
            Teléfono *
          </Label>
          <Input
            id="telefono"
            value={formData.telefono}
            onChange={(e) => handleChange('telefono', e.target.value)}
            placeholder="7777-7777"
            required
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="proveedor@ejemplo.com"
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="direccion" className="text-sm font-semibold text-gray-700">
            Dirección
          </Label>
          <Input
            id="direccion"
            value={formData.direccion}
            onChange={(e) => handleChange('direccion', e.target.value)}
            placeholder="Dirección completa"
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className="text-sm font-semibold text-gray-700">
            Productos que Suministra
          </Label>
          <div className="flex gap-2">
            <Input
              value={nuevoProducto}
              onChange={(e) => setNuevoProducto(e.target.value)}
              placeholder="Ej: Filtros de aceite"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarProducto())}
              className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
            />
            <Button type="button" onClick={agregarProducto} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.productos_suministrados && formData.productos_suministrados.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.productos_suministrados.map((prod, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {prod}
                  <button
                    type="button"
                    onClick={() => eliminarProducto(index)}
                    className="ml-2 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="terminos_pago" className="text-sm font-semibold text-gray-700">
            Términos de Pago
          </Label>
          <Input
            id="terminos_pago"
            value={formData.terminos_pago}
            onChange={(e) => handleChange('terminos_pago', e.target.value)}
            placeholder="Ej: 30 días crédito"
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
            placeholder="Información adicional"
            rows={3}
            className="border-gray-300 focus:border-[#E31E24] transition-colors resize-none"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="activo" className="text-sm font-semibold text-gray-700">
              Proveedor Activo
            </Label>
            <Switch
              id="activo"
              checked={formData.activo !== false}
              onCheckedChange={(checked) => handleChange('activo', checked)}
            />
          </div>
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
          {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar Proveedor'}
        </Button>
      </div>
    </form>
  );
}