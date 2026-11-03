import React from "react";
import { Lock, Paintbrush } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { fechaCorta } from "@/lib/modoPrueba";

export default function SeccionPintura({ expediente, perfil, onCambiar, guardando }) {
  const habilitada = !!expediente.pintura_habilitada;
  return (
    <div
      className={cn(
        "rounded-xl border p-3 flex items-start justify-between gap-3",
        habilitada ? "border-amber-200 bg-amber-50/60" : "border-gray-200 bg-gray-50"
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
          <Paintbrush className="w-3.5 h-3.5 text-amber-700" /> Revisión de pintura
        </p>
        <p className="text-[11px] text-gray-600 mt-0.5">
          {habilitada
            ? `Habilitada por ${expediente.habilitado_por || "Yanira"}${expediente.fecha_habilitacion_pintura ? ` · ${fechaCorta(expediente.fecha_habilitacion_pintura)}` : ""}. Solo aplica a este expediente.`
            : "Apagada: los técnicos de pintura no ven este expediente."}
        </p>
      </div>
      {perfil === "facturacion" ? (
        <Switch checked={habilitada} disabled={guardando} onCheckedChange={(v) => onCambiar(v)} />
      ) : (
        <span className="text-[10px] text-gray-500 flex items-center gap-1 whitespace-nowrap">
          <Lock className="w-3 h-3" /> Yanira
        </span>
      )}
    </div>
  );
}