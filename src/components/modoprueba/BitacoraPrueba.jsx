import React from "react";
import { History } from "lucide-react";
import { ETIQUETAS_ACCION, fechaCorta } from "@/lib/modoPrueba";

export default function BitacoraPrueba({ eventos = [] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
        <History className="w-3.5 h-3.5" /> Bitácora de la prueba
      </p>
      {eventos.length === 0 ? (
        <p className="text-xs text-gray-400 mt-3">Aún no hay acciones registradas en este entorno.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {eventos.slice(0, 10).map((evento) => (
            <li key={evento.id} className="flex gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-800 leading-snug">
                  <span className="font-semibold">{ETIQUETAS_ACCION[evento.accion] || evento.accion}</span>
                  {" · "}
                  {evento.actor_nombre}
                </p>
                <p className="text-[11px] text-gray-400">
                  {fechaCorta(evento.fecha)}
                  {evento.detalle ? ` · ${evento.detalle}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}