import React, { useState } from "react";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { fechaCorta } from "@/lib/modoPrueba";

export default function SeccionInspeccion({ especialidad, expediente, perfil, onRegistrar, guardando }) {
  const esPintura = especialidad === "pintura";
  const registro = esPintura ? expediente.inspeccion_pintura : expediente.inspeccion_mecanica;
  const habilitada = !esPintura || expediente.pintura_habilitada;
  const autorizado = perfil === (esPintura ? "tecnico_pintura" : "tecnico_mecanica");
  const [hallazgos, setHallazgos] = useState("");
  const [kilometraje, setKilometraje] = useState("");

  if (registro) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
        <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Completada por {registro.realizada_por}
        </p>
        <p className="text-[11px] text-emerald-700 mt-0.5">
          {fechaCorta(registro.fecha)}
          {registro.kilometraje ? ` · ${registro.kilometraje} km` : ""}
        </p>
        <p className="text-xs text-gray-700 mt-2 whitespace-pre-line">{registro.hallazgos}</p>
      </div>
    );
  }

  if (!habilitada) {
    return (
      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5" /> Yanira aún no habilita pintura para este expediente.
      </p>
    );
  }

  if (!autorizado) {
    return (
      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5" /> Solo el técnico de {esPintura ? "pintura" : "mecánica"} registra esta inspección.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={hallazgos}
        onChange={(e) => setHallazgos(e.target.value)}
        placeholder={esPintura ? "Estado de pintura, daños y trabajos requeridos" : "¿Qué se encontró al recibir el vehículo?"}
        className="text-sm min-h-[80px]"
        maxLength={2000}
      />
      {!esPintura && (
        <Input
          type="number"
          value={kilometraje}
          onChange={(e) => setKilometraje(e.target.value)}
          placeholder="Kilometraje"
          className="h-9 text-sm"
        />
      )}
      <Button
        size="sm"
        disabled={guardando || !hallazgos.trim()}
        onClick={() => onRegistrar({ accion: "registrar_inspeccion", expediente_id: expediente.id, especialidad, hallazgos, kilometraje })}
        className="bg-[#C0392B] hover:bg-[#a93226] gap-1.5"
      >
        {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Registrar inspección
      </Button>
    </div>
  );
}