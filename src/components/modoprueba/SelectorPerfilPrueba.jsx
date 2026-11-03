import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PERFILES_PRUEBA, perfilPrueba } from "@/lib/modoPrueba";

export default function SelectorPerfilPrueba({ perfil, actor, onPerfil, onActor }) {
  const actual = perfilPrueba(perfil);
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
        ¿Quién usa la app en esta prueba?
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {PERFILES_PRUEBA.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onPerfil(p.value)}
            className={cn(
              "rounded-xl border px-3 py-2 text-left transition-all",
              p.value === perfil
                ? "border-amber-400 bg-white shadow-sm"
                : "border-amber-200/80 bg-white/50 hover:bg-white"
            )}
          >
            <span className="block text-sm font-semibold text-gray-900">{p.label}</span>
            <span className="block text-[11px] text-gray-500">{p.area}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
        <label htmlFor="actor-prueba" className="text-xs font-medium text-amber-900 whitespace-nowrap">
          Nombre de quien actúa
        </label>
        <Input
          id="actor-prueba"
          value={actor}
          onChange={(e) => onActor(e.target.value)}
          className="h-8 max-w-xs bg-white text-sm"
          maxLength={120}
        />
      </div>
      <p className="mt-2 text-[11px] text-amber-800/90">{actual.descripcion}</p>
    </div>
  );
}