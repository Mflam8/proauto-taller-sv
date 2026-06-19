import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Receipt, User, Car, Trash2, Plus } from "lucide-react";

const IVA_RATE = 0.13;

export default function GenerarFacturaForm({ expediente, cliente, vehiculo, onSuccess, onClose }) {
  const queryClient = useQueryClient();

  const { data: trabajos = [] } = useQuery({
    queryKey: ["trabajos", expediente.id],
    queryFn: () => base44.entities.TrabajoExpediente.filter({ expediente_id: expediente.id }),
    enabled: !!expediente.id,
  });

  // Build items from trabajos
  const initialItems = trabajos.map(t => ({
    descripcion: t.descripcion,
    cantidad: t.cantidad || 1,
    precio_unitario: t.precio_unitario || 0,
    subtotal: t.subtotal || 0,
  }));

  const [items, setItems] = useState(null); // null = not yet initialized
  const [formaPago, setFormaPago] = useState("Contado");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [newItem, setNewItem] = useState({ descripcion: "", cantidad: 1, precio_unitario: 0 });

  // Initialize items from trabajos once loaded
  const displayItems = items ?? initialItems;

  const importeBruto = displayItems.reduce((sum, item) => sum + (item.subtotal || item.cantidad * item.precio_unitario), 0);
  const importeNeto = importeBruto; // In this case, same as bruto
  const iva = Math.round(importeNeto * IVA_RATE * 100) / 100;
  const totalFactura = Math.round((importeNeto + iva) * 100) / 100;

  const handleRemoveItem = (index) => {
    const current = items ?? [...initialItems];
    setItems(current.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (!newItem.descripcion) return;
    const sub = newItem.cantidad * newItem.precio_unitario;
    const current = items ?? [...initialItems];
    setItems([...current, { ...newItem, subtotal: sub }]);
    setNewItem({ descripcion: "", cantidad: 1, precio_unitario: 0 });
  };

  const createFacturaMutation = useMutation({
    mutationFn: async () => {
      const facturaData = {
        numero_factura: numeroFactura || `FAC-${Date.now().toString().slice(-8)}`,
        expediente_id: expediente.id,
        cliente_id: expediente.cliente_id,
        vehiculo_id: expediente.vehiculo_id,
        forma_pago: formaPago,
        items: displayItems,
        subtotal: importeBruto,
        importe_neto: importeNeto,
        iva: iva,
        total: totalFactura,
        estado_pago: "Pendiente",
        monto_pagado: 0,
        saldo_pendiente: totalFactura,
      };

      const factura = await base44.entities.Factura.create(facturaData);

      // Update expediente with financial totals and flag
      await base44.entities.Expediente.update(expediente.id, {
        total_cobrado: totalFactura,
        saldo_pendiente: totalFactura - (expediente.total_pagado || 0),
        factura_generada: true,
      });

      return factura;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      queryClient.invalidateQueries({ queryKey: ["expediente", expediente.id] });
      if (onSuccess) onSuccess();
    },
  });

  return (
    <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
      {/* Header info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
          <User className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Cliente</p>
            <p className="font-semibold text-sm">{cliente?.nombre_completo || "N/A"}</p>
            {cliente?.direccion && <p className="text-xs text-gray-500">{cliente.direccion}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
          <Car className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Vehículo</p>
            <p className="font-semibold text-sm">
              {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio || ""}` : "N/A"}
            </p>
            {vehiculo?.placa && <p className="text-xs text-gray-500">Placa: {vehiculo.placa}</p>}
          </div>
        </div>
      </div>

      {/* Factura fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-600">N° Factura</Label>
          <Input
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value)}
            placeholder="Ej: 201600415 (auto si vacío)"
            className="h-10"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-600">Forma de Pago</Label>
          <Select value={formaPago} onValueChange={setFormaPago}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Contado">Contado</SelectItem>
              <SelectItem value="Crédito">Crédito</SelectItem>
              <SelectItem value="Mixto">Mixto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items table */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalle de Servicios</h4>
        
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 px-3 py-2 bg-gray-100 rounded-t-lg">
          <span className="col-span-1">Cant</span>
          <span className="col-span-6">Descripción</span>
          <span className="col-span-2 text-right">Precio</span>
          <span className="col-span-2 text-right">Total</span>
          <span className="col-span-1"></span>
        </div>

        <div className="space-y-1 border rounded-b-lg divide-y">
          {displayItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 text-sm">
              <span className="col-span-1 text-gray-700">{item.cantidad}</span>
              <span className="col-span-6 text-gray-900 font-medium">{item.descripcion}</span>
              <span className="col-span-2 text-right text-gray-700">${(item.precio_unitario || 0).toFixed(2)}</span>
              <span className="col-span-2 text-right font-semibold text-gray-900">
                ${(item.subtotal || item.cantidad * item.precio_unitario).toFixed(2)}
              </span>
              <div className="col-span-1 text-right">
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600"
                  onClick={() => handleRemoveItem(index)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add extra item */}
        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-semibold text-blue-700 mb-2">Agregar ítem adicional</p>
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-1">
              <Input type="number" min="1" value={newItem.cantidad} className="h-8 text-xs"
                onChange={(e) => setNewItem({ ...newItem, cantidad: parseFloat(e.target.value) || 1 })} />
            </div>
            <div className="col-span-6">
              <Input placeholder="Descripción" value={newItem.descripcion} className="h-8 text-xs"
                onChange={(e) => setNewItem({ ...newItem, descripcion: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Input type="number" step="0.01" min="0" placeholder="Precio" value={newItem.precio_unitario || ""} className="h-8 text-xs"
                onChange={(e) => setNewItem({ ...newItem, precio_unitario: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="col-span-3">
              <Button size="sm" variant="outline" className="h-8 text-xs w-full" onClick={handleAddItem}>
                <Plus className="w-3 h-3 mr-1" /> Agregar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Totals - mimicking POS ticket */}
      <div className="bg-gray-900 text-white rounded-xl p-5 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">Importe Bruto</span>
          <span className="font-medium">${importeBruto.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">Importe Neto</span>
          <span className="font-medium">${importeNeto.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">IVA (13%)</span>
          <span className="font-medium">${iva.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between text-lg">
          <span className="font-bold">Total Factura</span>
          <span className="font-bold text-green-400">${totalFactura.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={() => createFacturaMutation.mutate()}
          disabled={createFacturaMutation.isPending || displayItems.length === 0}
          className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] hover:from-[#B71C1C] hover:to-[#8B0000] text-white shadow-md gap-2"
        >
          <Receipt className="w-4 h-4" />
          {createFacturaMutation.isPending ? "Generando..." : "Generar Factura"}
        </Button>
      </div>
    </div>
  );
}