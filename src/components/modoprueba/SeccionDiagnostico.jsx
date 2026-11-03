import React, { useState } from "react";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fechaCorta } from "@/lib/modoPrueba";

export default function SeccionDiagnostico({ especialidad, expediente, perfil, onRegistrar, guardando }) {
  const esPintura = especialidad === "pintura";
  const registro = esPintura ? expediente.diagnostico_pintura : expediente.diagnostico_mecanica;
  const inspeccion = esPintura ? expediente.inspeccion_pintura : expediente.inspeccion_mecanica;
  const habilitada = !esPintura || expediente.pintura_habilitada;
  const autorizado = perfil === (esPintura ? "tecnico_pintura" : "tecnico_mecanica");
  const [diagnostico, setDiagnostico] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");

  if (registro) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
        <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Registrado por {registro.registrado_por}
        </p>
        <p className="text-[11px] text-emerald-700 mt-0.5">{fechaCorta(registro.fecha)}</p>
        <p className="text-xs text-gray-700 mt-2 whitespace-pre-line">{registro.diagnostico}</p>
        {registro.recomendaciones && (
          <p className="text-[11px] text-gray-500 mt-1.5">
            <span className="font-semibold">Recomendaciones:</span> {registro.recomendaciones}
          </p>
        )}
      </div>
    );
  }

  if (!habilitada) {
    return (
      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5" /> Pintura no está habilitada para este expediente.
      </p>
    );
  }

  if (!inspeccion) {
    return (
      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5" /> Primero se completa la inspección de {esPintura ? "pintura" : "mecánica"}.
      </p>
    );
  }

  if (!autorizado) {
    return (
      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5" /> Puede registrarlo cualquier técnico de {esPintura ? "pintura" : "mecánica"}, no necesariamente quien inspeccionó.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={diagnostico}
        onChange={(e) => setDiagnostico(e.target.value)}
        placeholder={esPintura ? "Diagnóstico de pintura" : "Diagnóstico técnico y trabajos necesarios"}
        className="text-sm min-h-[80px]"
        maxLength={3000}
      />
      <Textarea
        value={recomendaciones}
        onChange={(e) => setRecomendaciones(e.target.value)}
        placeholder="Recomendaciones para el cliente (opcional)"
        className="text-sm min-h-[60px]"
        maxLength={2000}
      />
      <Button
        size="sm"
        disabled={guardando || !diagnostico.trim()}
        onClick={() => onRegistrar({ accion: "registrar_diagnostico", expediente_id: expediente.id, especialidad, diagnostico, recomendaciones })}
        className="bg-gray-900 hover:bg-black gap-1.5"
      >
        {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Registrar diagnóstico
      </Button>
    </div>
  );
}