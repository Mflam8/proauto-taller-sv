import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, DollarSign } from "lucide-react";

export default function PagoForm({ factura, onClose }) {
  const [user, setUser] = useState(null);
  const saldoPendiente = (factura.total || 0) - (factura.monto_pagado || 0);
  
  const [formData, setFormData] = useState({
    factura_id: factura.id,
    monto: saldoPendiente,
    metodo_pago: "Efectivo",
    referencia: "",
    fecha_pago: new Date().toISOString().split('T')[0],
    recibido_por: "",
    notas: ""
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setFormData(prev => ({ ...prev, recibido_por: currentUser.full_name }));
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const createPagoMutation = useMutation({
    mutationFn: async (data) => {
      const pago = await base44.entities.Pago.create(data);

      const nuevoMontoPagado = (factura.monto_pagado || 0) + data.monto;
      const nuevoSaldo = factura.total - nuevoMontoPagado;
      const nuevoEstado = nuevoSaldo <= 0.01 ? 'Pagada' : nuevoSaldo < factura.total ? 'Parcial' : 'Pendiente';

      await base44.entities.Factura.update(factura.id, {
        monto_pagado: nuevoMontoPagado,
        saldo_pendiente: nuevoSaldo,
        estado_pago: nuevoEstado
      });

      // Sincronizar el expediente asociado (si existe)
      if (factura.expediente_id) {
        const facturasExp = await base44.entities.Factura.filter({ expediente_id: factura.expediente_id });
        const totalCobrado = facturasExp.reduce((sum, f) => sum + (f.total || 0), 0);
        const totalPagado = facturasExp.reduce((sum, f) => sum + (f.monto_pagado || 0), 0);
        const saldoExp = Math.max(0, totalCobrado - totalPagado);
        await base44.entities.Expediente.update(factura.expediente_id, {
          total_cobrado: totalCobrado,
          total_pagado: totalPagado,
          saldo_pendiente: saldoExp
        });
      }

      return pago;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['pagos'] });
      queryClient.invalidateQueries({ queryKey: ['pagos-factura', factura.id] });
      queryClient.invalidateQueries({ queryKey: ['expedientes'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.monto > saldoPendiente) {
      alert(`El monto no puede exceder el saldo pendiente de $${saldoPendiente.toFixed(2)}`);
      return;
    }
    if (formData.monto <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }
    createPagoMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información de la Factura */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Factura #{factura.numero_factura || factura.id.slice(0, 8)}</span>
          <span className="text-sm font-semibold text-gray-900">Total: ${factura.total?.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Pagado: ${(factura.monto_pagado || 0).toFixed(2)}</span>
          <span className="text-lg font-bold text-red-600">
            Pendiente: ${saldoPendiente.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="monto" className="text-sm font-semibold text-gray-700">
            Monto a Pagar *
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0.01"
              max={saldoPendiente}
              value={formData.monto}
              onChange={(e) => handleChange('monto', parseFloat(e.target.value))}
              required
              className="pl-10 h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
            />
          </div>
          <p className="text-xs text-gray-500">Máximo: ${saldoPendiente.toFixed(2)}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="metodo_pago" className="text-sm font-semibold text-gray-700">
            Método de Pago *
          </Label>
          <Select 
            value={formData.metodo_pago} 
            onValueChange={(value) => handleChange('metodo_pago', value)}
          >
            <SelectTrigger className="h-11 border-gray-300 focus:border-[#E31E24]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Efectivo">💵 Efectivo</SelectItem>
              <SelectItem value="Transferencia">🏦 Transferencia</SelectItem>
              <SelectItem value="Tarjeta Débito">💳 Tarjeta Débito</SelectItem>
              <SelectItem value="Tarjeta Crédito">💳 Tarjeta Crédito</SelectItem>
              <SelectItem value="Cheque">📝 Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="referencia" className="text-sm font-semibold text-gray-700">
            Número de Referencia/Comprobante
          </Label>
          <Input
            id="referencia"
            value={formData.referencia}
            onChange={(e) => handleChange('referencia', e.target.value)}
            placeholder="Ej: 1234567890"
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha_pago" className="text-sm font-semibold text-gray-700">
            Fecha de Pago *
          </Label>
          <Input
            id="fecha_pago"
            type="date"
            value={formData.fecha_pago}
            onChange={(e) => handleChange('fecha_pago', e.target.value)}
            required
            className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recibido_por" className="text-sm font-semibold text-gray-700">
          Recibido Por
        </Label>
        <Input
          id="recibido_por"
          value={formData.recibido_por}
          onChange={(e) => handleChange('recibido_por', e.target.value)}
          placeholder="Nombre de quien recibe el pago"
          className="h-11 border-gray-300 focus:border-[#E31E24] transition-colors"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notas" className="text-sm font-semibold text-gray-700">
          Notas
        </Label>
        <Textarea
          id="notas"
          value={formData.notas}
          onChange={(e) => handleChange('notas', e.target.value)}
          placeholder="Información adicional sobre el pago"
          rows={3}
          className="border-gray-300 focus:border-[#E31E24] transition-colors resize-none"
        />
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
          disabled={createPagoMutation.isPending}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md"
        >
          <Save className="w-4 h-4 mr-2" />
          {createPagoMutation.isPending ? 'Registrando...' : 'Registrar Pago'}
        </Button>
      </div>
    </form>
  );
}