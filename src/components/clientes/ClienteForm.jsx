import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";

export default function ClienteForm({ cliente, onClose }) {
  const [formData, setFormData] = useState(cliente || {
    nombre_completo: "",
    telefono: "",
    email: "",
    dui: "",
    nit: "",
    direccion: "",
    notas: ""
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Cliente.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cliente?.id) {
      updateMutation.mutate({ id: cliente.id, data: formData });
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
          <Label htmlFor="nombre_completo" className="text-sm font-semibold text-gray-700">
            Nombre Completo *
          </Label>
          <Input
            id="nombre_completo"
            value={formData.nombre_completo}
            onChange={(e) => handleChange('nombre_completo', e.target.value)}
            placeholder="Ej: Juan Pérez García"
            required
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
            placeholder="Ej: 7777-7777"
            required
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="ejemplo@correo.com"
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dui" className="text-sm font-semibold text-gray-700">
            DUI
          </Label>
          <Input
            id="dui"
            value={formData.dui}
            onChange={(e) => handleChange('dui', e.target.value)}
            placeholder="00000000-0"
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nit" className="text-sm font-semibold text-gray-700">
            NIT
          </Label>
          <Input
            id="nit"
            value={formData.nit}
            onChange={(e) => handleChange('nit', e.target.value)}
            placeholder="0000-000000-000-0"
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
          <Label htmlFor="notas" className="text-sm font-semibold text-gray-700">
            Notas
          </Label>
          <Textarea
            id="notas"
            value={formData.notas}
            onChange={(e) => handleChange('notas', e.target.value)}
            placeholder="Información adicional sobre el cliente"
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
          {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar Cliente'}
        </Button>
      </div>
    </form>
  );
}