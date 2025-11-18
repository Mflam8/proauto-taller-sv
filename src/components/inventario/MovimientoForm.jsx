import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tantml:react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";

export default function MovimientoForm({ item: itemProp, onClose }) {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    item_inventario_id: itemProp?.id || "",
    tipo_movimiento: "Entrada",
    cantidad: 0,
    motivo: "",
    orden_trabajo_id: "",
    costo_unitario: itemProp?.precio_compra || 0,
    responsable: "",
    notas: ""
  });

  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['inventario'],
    queryFn: () => base44.entities.ItemInventario.list(),
    initialData: [],
    enabled: !itemProp
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setFormData(prev => ({ ...prev, responsable: currentUser.full_name }));
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const createMovimientoMutation = useMutation({
    mutationFn: async (data) => {
      const movimiento = await base44.entities.MovimientoInventario.create(data);
      
      const itemId = data.item_inventario_id;
      const itemsList = itemProp ? [itemProp] : items;
      const item = itemsList.find(i => i.id === itemId);
      
      if (item) {
        const nuevoStock = data.tipo_movimiento === 'Entrada' 
          ? (item.stock_actual || 0) + data.cantidad
          : (item.stock_actual || 0) - data.cantidad;
        
        await base44.entities.ItemInventario.update(itemId, {
          stock_actual: Math.max(0, nuevoStock)
        });
      }
      
      return movimiento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    createMovimientoMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedItem = itemProp || items.find(i => i.id === formData.item_inventario_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!itemProp && (
        <div className="space-y-2">
          <Label htmlFor="item_inventario_id" className="text-sm font-semibold text-gray-700">
            Item *
          </Label>
          <Select 
            value={formData.item_inventario_id} 
            onValueChange={(value) => {
              const item = items.find(i => i.id === value);
              handleChange('item_inventario_id', value);
              handleChange('costo_unitario', item?.precio_compra || 0);
            }}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Seleccionar item" />
            </SelectTrigger>
            <SelectContent>
              {items.map(item => (
                <SelectItem key={item.id} value={item.id}>
                  {item.nombre} (Stock: {item.stock_actual})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedItem && (
        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between">
            <span className="font-semibold">{selectedItem.nombre}</span>
            <span className="text-sm text-gray-600">Stock actual: {selectedItem.stock_actual}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="tipo_movimiento" className="text-sm font-semibold text-gray-700">
            Tipo de Movimiento *
          </Label>
          <Select value={formData.tipo_movimiento} onValueChange={(value) => handleChange('tipo_movimiento', value)}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Entrada">📦 Entrada (Compra)</SelectItem>
              <SelectItem value="Salida">📤 Salida (Uso/Venta)</SelectItem>
              <SelectItem value="Ajuste">⚙️ Ajuste de Inventario</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cantidad" className="text-sm font-semibold text-gray-700">
            Cantidad *
          </Label>
          <Input
            id="cantidad"
            type="number"
            min="1"
            value={formData.cantidad}
            onChange={(e) => handleChange('cantidad', parseInt(e.target.value) || 0)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="costo_unitario" className="text-sm font-semibold text-gray-700">
            Costo Unitario
          </Label>
          <Input
            id="costo_unitario"
            type="number"
            step="0.01"
            min="0"
            value={formData.costo_unitario}
            onChange={(e) => handleChange('costo_unitario', parseFloat(e.target.value) || 0)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsable" className="text-sm font-semibold text-gray-700">
            Responsable
          </Label>
          <Input
            id="responsable"
            value={formData.responsable}
            onChange={(e) => handleChange('responsable', e.target.value)}
            placeholder="Nombre del responsable"
            className="h-11"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="motivo" className="text-sm font-semibold text-gray-700">
            Motivo *
          </Label>
          <Input
            id="motivo"
            value={formData.motivo}
            onChange={(e) => handleChange('motivo', e.target.value)}
            placeholder="Ej: Compra a proveedor, Usado en orden #123"
            required
            className="h-11"
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
          />
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Nuevo stock estimado:</strong> {
            formData.tipo_movimiento === 'Entrada' 
              ? (selectedItem?.stock_actual || 0) + (formData.cantidad || 0)
              : Math.max(0, (selectedItem?.stock_actual || 0) - (formData.cantidad || 0))
          }
        </p>
        {formData.costo_unitario > 0 && formData.cantidad > 0 && (
          <p className="text-sm text-gray-700 mt-1">
            <strong>Costo total:</strong> ${(formData.costo_unitario * formData.cantidad).toFixed(2)}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={createMovimientoMutation.isPending}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {createMovimientoMutation.isPending ? 'Registrando...' : 'Registrar Movimiento'}
        </Button>
      </div>
    </form>
  );
}