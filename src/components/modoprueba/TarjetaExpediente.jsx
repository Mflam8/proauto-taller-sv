import React from "react";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { claseEstado, hitosExpediente } from "@/lib/modoPrueba";

export default function TarjetaExpediente({ expediente, seleccionado, onSelect }) {
  const hitos = hitosExpediente(expediente);
  return (
    <button
      type="button"
      onClick={() => onSelect(expediente.id)}
      className={cn(
        "w-full text-left rounded-xl border bg-white p-3.5 transition-all",
        seleccionado
          ? "border-[#C0392B] shadow-sm ring-1 ring-[#C0392B]/20"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-mono text-gray-400">{expediente.numero_prueba}</span>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap", claseEstado(expediente.estado_interno))}>
          {expediente.estado_interno}
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-gray-900 truncate">{expediente.cliente_nombre}</p>
      <p className="mt-0.5 text-xs text-gray-500 flex items-center gap-1.5 truncate">
        <Car className="w-3.5 h-3.5 shrink-0" />
        {[expediente.vehiculo_marca, expediente.vehiculo_modelo, expediente.vehiculo_placa].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {hitos.map((h) => (
          <span
            key={h.label}
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded",
              h.hecho ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
            )}
          >
            {h.label}
          </span>
        ))}
      </div>
    </button>
  );
}