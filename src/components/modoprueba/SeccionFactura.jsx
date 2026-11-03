import React, { useState } from "react";
import { CheckCircle2, Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { faltantes, fechaCorta } from "@/lib/modoPrueba";

const IVA = 0.13;
const lineaVacia = () => ({ descripcion: "", cantidad: 1, precio_unitario: 0 });

export default function SeccionFactura({ expediente, factura, perfil, onAccion, guardando }) {
  const autorizado = perfil === "facturacion";
  const pendientes = faltantes(expediente);
  const emitida = factura?.estado === "Emitida";
  const editando = !emitida;

  const [items, setItems] = useState(() =>
    factura?.items?.length
      ? factura.items.map((i) => ({
          descripcion: i.descripcion || "",
          cantidad: i.cantidad || 1,
          precio_unitario: i.precio_unitario || 0,
        }))
      : [{ descripcion: "Mano de obra", cantidad: 1, precio_unitario: 0 }]
  );
  const [aplicaIva, setAplicaIva] = useState(factura?.aplica_iva !== false);

  const subtotal = items.reduce(
    (s, i) => s + (Number(i.cantidad) || 0) * (Number(i.precio_unitario) || 0),
    0
  );
  const iva = aplicaIva ? subtotal * IVA : 0;
  const total = subtotal + iva;

  const cambiar = (indice, campo, valor) =>
    setItems((prev) => prev.map((it, i) => (i === indice ? { ...it, [campo]: valor } : it)));

  if (emitida) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
        <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Factura {factura.numero_prueba_factura} emitida por {factura.emitida_por}
        </p>
        <p className="text-[11px] text-emerald-700 mt-0.5">{fechaCorta(factura.fecha_emision)}</p>
        <div className="mt-2 space-y-1">
          {(factura.items || []).map((i, idx) => (
            <div key={idx} className="flex justify-between text-xs text-gray-700">
              <span className="truncate pr-2">
                {i.cantidad} × {i.descripcion}
              </span>
              <span className="font-mono">${Number(i.subtotal || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 border-t border-emerald-200 pt-2 text-xs text-gray-700 space-y-0.5">
          <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">${Number(factura.subtotal || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>IVA</span><span className="font-mono">${Number(factura.iva || 0).toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span className="font-mono">${Number(factura.total || 0).toFixed(2)}</span></div>
        </div>
      </div>
    );
  }

  if (!autorizado) {
    return (
      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5" /> Solo Yanira o Mauricio preparan y emiten la factura. Los perfiles técnicos no tienen acceso a precios ni facturación.
      </p>
    );
  }

  if (pendientes.length > 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
        <p className="text-xs font-semibold text-amber-900">Falta completar antes de facturar</p>
        <ul className="mt-1.5 space-y-0.5">
          {pendientes.map((p) => (
            <li key={p} className="text-[11px] text-amber-800">· {p}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, indice) => (
        <div key={indice} className="grid grid-cols-12 gap-1.5 items-center">
          <Input
            value={item.descripcion}
            onChange={(e) => cambiar(indice, "descripcion", e.target.value)}
            placeholder="Repuesto o servicio"
            className="col-span-6 h-9 text-sm"
            maxLength={200}
          />
          <Input
            type="number"
            value={item.cantidad}
            onChange={(e) => cambiar(indice, "cantidad", e.target.value)}
            className="col-span-2 h-9 text-sm"
            min="0"
          />
          <Input
            type="number"
            value={item.precio_unitario}
            onChange={(e) => cambiar(indice, "precio_unitario", e.target.value)}
            className="col-span-3 h-9 text-sm"
            min="0"
            step="0.01"
          />
          <button
            type="button"
            onClick={() => setItems((prev) => (prev.length === 1 ? [lineaVacia()] : prev.filter((_, i) => i !== indice)))}
            className="col-span-1 flex justify-center text-gray-400 hover:text-red-600"
            aria-label="Quitar línea"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <Button type="button" variant="ghost" size="sm" onClick={() => setItems((prev) => [...prev, lineaVacia()])} className="gap-1 text-xs">
        <Plus className="w-3.5 h-3.5" /> Agregar línea
      </Button>

      <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 space-y-1">
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <Checkbox checked={aplicaIva} onCheckedChange={(v) => setAplicaIva(v === true)} /> Aplicar IVA (13%)
        </label>
        <div className="flex justify-between text-xs text-gray-600"><span>Subtotal</span><span className="font-mono">${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-xs text-gray-600"><span>IVA</span><span className="font-mono">${iva.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm font-bold text-gray-900"><span>Total</span><span className="font-mono">${total.toFixed(2)}</span></div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={guardando}
          onClick={() => onAccion({ accion: "preparar_factura", expediente_id: expediente.id, items, aplica_iva: aplicaIva })}
          className="gap-1.5"
        >
          {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {factura ? "Guardar borrador" : "Preparar factura"}
        </Button>
        <Button
          size="sm"
          disabled={guardando || !factura}
          onClick={() => onAccion({ accion: "emitir_factura", expediente_id: expediente.id })}
          className="bg-[#C0392B] hover:bg-[#a93226] gap-1.5"
        >
          Emitir factura
        </Button>
      </div>
      {!factura && (
        <p className="text-[11px] text-gray-400">Prepara el borrador para poder emitirlo.</p>
      )}
    </div>
  );
}