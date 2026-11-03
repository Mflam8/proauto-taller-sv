import React from "react";
import { Car, ClipboardCheck, FileText, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { claseEstado } from "@/lib/modoPrueba";
import SeccionPintura from "@/components/modoprueba/SeccionPintura";
import SeccionInspeccion from "@/components/modoprueba/SeccionInspeccion";
import SeccionDiagnostico from "@/components/modoprueba/SeccionDiagnostico";
import SeccionFactura from "@/components/modoprueba/SeccionFactura";

function Bloque({ numero, titulo, icono: Icono, completa, children }) {
  return (
    <section className="border-t border-gray-100 pt-5 first:border-0 first:pt-0">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={cn(
            "w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0",
            completa ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
          )}
        >
          {completa ? "✓" : numero}
        </span>
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          {Icono && <Icono className="w-3.5 h-3.5 text-gray-400" />} {titulo}
        </h3>
      </div>
      {children}
    </section>
  );
}

export default function PanelPrueba({ expediente, factura, perfil, onAccion, guardando }) {
  if (!expediente) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <ClipboardCheck className="w-8 h-8 text-gray-300 mx-auto" />
        <p className="mt-3 text-sm text-gray-500">
          Selecciona un expediente de prueba para recorrer el flujo completo.
        </p>
      </div>
    );
  }

  const facturado = expediente.estado_interno === "Facturado";
  const puedeGestionar = perfil === "facturacion";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-400">{expediente.numero_prueba}</span>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", claseEstado(expediente.estado_interno))}>
              {expediente.estado_interno}
            </span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-gray-900 leading-tight">{expediente.cliente_nombre}</h2>
          <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
            <Car className="w-3.5 h-3.5" />
            {[expediente.vehiculo_marca, expediente.vehiculo_modelo, expediente.vehiculo_anio, expediente.vehiculo_placa]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {puedeGestionar && !facturado && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAccion({ accion: "eliminar_expediente", expediente_id: expediente.id })}
            className="text-gray-400 hover:text-red-600 gap-1 text-xs"
            disabled={guardando}
          >
            <Trash2 className="w-3.5 h-3.5" /> Descartar
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-5">
        <Bloque numero={1} titulo="Ingreso del expediente" icono={User} completa>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 space-y-1">
            <p>
              <span className="font-semibold text-gray-800">Motivo:</span> {expediente.motivo_visita}
            </p>
            {expediente.cliente_telefono && (
              <p>
                <span className="font-semibold text-gray-800">Teléfono:</span> {expediente.cliente_telefono}
              </p>
            )}
            <p>
              <span className="font-semibold text-gray-800">Ingresado por:</span> {expediente.registrado_por || "Yanira"}
            </p>
          </div>
        </Bloque>

        <Bloque numero={2} titulo="Habilitación de pintura (Tablero Diario)" icono={ClipboardCheck} completa={!!expediente.pintura_habilitada}>
          <SeccionPintura
            expediente={expediente}
            perfil={perfil}
            guardando={guardando}
            onCambiar={(habilitar) =>
              onAccion({ accion: "habilitar_pintura", expediente_id: expediente.id, habilitar })
            }
          />
        </Bloque>

        <Bloque numero={3} titulo="Inspección de mecánica" completa={!!expediente.inspeccion_mecanica}>
          <SeccionInspeccion
            especialidad="mecanica"
            expediente={expediente}
            perfil={perfil}
            guardando={guardando}
            onRegistrar={onAccion}
          />
        </Bloque>

        {expediente.pintura_habilitada && (
          <Bloque numero={4} titulo="Inspección de pintura" completa={!!expediente.inspeccion_pintura}>
            <SeccionInspeccion
              especialidad="pintura"
              expediente={expediente}
              perfil={perfil}
              guardando={guardando}
              onRegistrar={onAccion}
            />
          </Bloque>
        )}

        <Bloque numero={5} titulo="Diagnóstico de mecánica" completa={!!expediente.diagnostico_mecanica}>
          <SeccionDiagnostico
            especialidad="mecanica"
            expediente={expediente}
            perfil={perfil}
            guardando={guardando}
            onRegistrar={onAccion}
          />
        </Bloque>

        {expediente.pintura_habilitada && (
          <Bloque numero={6} titulo="Diagnóstico de pintura" completa={!!expediente.diagnostico_pintura}>
            <SeccionDiagnostico
              especialidad="pintura"
              expediente={expediente}
              perfil={perfil}
              guardando={guardando}
              onRegistrar={onAccion}
            />
          </Bloque>
        )}

        <Bloque numero={7} titulo="Cotización y factura" icono={FileText} completa={!!expediente.factura_emitida}>
          <SeccionFactura
            key={factura?.id || "nueva"}
            expediente={expediente}
            factura={factura}
            perfil={perfil}
            guardando={guardando}
            onAccion={onAccion}
          />
        </Bloque>
      </div>
    </div>
  );
}