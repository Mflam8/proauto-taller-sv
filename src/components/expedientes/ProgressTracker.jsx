import React from "react";

export default function ProgressTracker({ stages, nextStep }) {
  const completed = stages.filter(stage => stage.complete).length;
  const percent = stages.length ? Math.round(completed / stages.length * 100) : 0;

  return (
    <section aria-label="Avance del expediente" className="mb-3 w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight text-gray-900 sm:text-xl">Avance del expediente</h2>
          <span className="mt-2 inline-flex max-w-full rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800">
            <span className="truncate">{nextStep ? `Siguiente: ${nextStep}` : "Todas las etapas completas"}</span>
          </span>
        </div>
        <p className="shrink-0 text-3xl font-light leading-none tracking-tight text-[#E31E24] sm:text-4xl" aria-label={`${percent}% resuelto`}>
          {percent}%
        </p>
      </div>
      <div className="flex gap-2" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${completed} de ${stages.length} etapas resueltas`}>
        {stages.map(stage => (
          <span key={stage.label} aria-hidden="true" className={`h-3 min-w-0 flex-1 rounded-full border transition-colors duration-300 sm:h-4 ${stage.complete ? "border-[#E31E24] bg-[#E31E24]" : "border-gray-300 bg-gray-100"}`} />
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-600">{completed} de {stages.length} secciones resueltas</p>
    </section>
  );
}