import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, ChevronRight, Play, CheckCircle2, Loader2 } from "lucide-react";

const estadoColor = {
  "Recibido": "bg-gray-100 text-gray-700",
  "En Diagnóstico": "bg-blue-100 text-blue-800",
  "Esperando Aprobación": "bg-yellow-100 text-yellow-800",
  "Aprobado": "bg-green-100 text-green-800",
  "En Reparación": "bg-orange-100 text-orange-800",
  "Esperando Repuesto": "bg-red-100 text-red-800",
  "En Pintura": "bg-purple-100 text-purple-800",
  "En Lavado": "bg-cyan-100 text-cyan-800",
  "Listo para Entrega": "bg-emerald-100 text-emerald-800",
  "Entregado": "bg-teal-100 text-teal-800",
  "Cerrado": "bg-gray-200 text-gray-600",
  "Cancelado": "bg-red-200 text-red-700",
};

const horaSV = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit", timeZone: "America/El_Salvador" })
    : "";

export default function TarjetaExpedienteTecnico({ grupo, onEstado, guardando, onOpen }) {
  const { expediente, vehiculo, cliente, items, activos } = grupo;

  const referencia = expediente.numero_expediente || `EXP-${expediente.id?.slice(-6)?.toUpperCase()}`;
  const subtitulo = [vehiculo?.placa, referencia, cliente?.nombre_completo].filter(Boolean).join(" · ");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button onClick={onOpen} className="w-full text-left p-4 flex items-start gap-3 active:bg-gray-50 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-[#E31E24]/10 flex items-center justify-center shrink-0">
          <Car className="w-5 h-5 text-[#E31E24]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">
            {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : "Servicio sin vehículo"}
          </p>
          <p className="text-xs text-gray-500 truncate">{subtitulo}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 mt-2 shrink-0" />
      </button>

      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        <Badge className={`text-[11px] ${estadoColor[expediente.estado_interno] || "bg-gray-100 text-gray-700"}`}>
          {expediente.estado_interno}
        </Badge>
        <span className="text-[11px] text-gray-500">
          {activos} pendiente(s) de {items.length}
        </span>
      </div>

      <div className="divide-y divide-gray-100 border-t border-gray-100">
        {items.map((t) => (
          <div key={t.id} className="px-4 py-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 leading-snug">{t.descripcion}</p>
              <p className="text-[11px] text-gray-500">
                {t.tipo}
                {t.estado === "Completado" && t.fecha_fin
                  ? ` · Terminado ${horaSV(t.fecha_fin)}`
                  : t.fecha_inicio
                    ? ` · Iniciado ${horaSV(t.fecha_inicio)}`
                    : ""}
              </p>
            </div>
            {t.estado === "Pendiente" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEstado(t, "En Proceso")}
                disabled={guardando === t.id}
                className="h-9 gap-1 text-xs shrink-0"
              >
                {guardando === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Iniciar
              </Button>
            )}
            {t.estado === "En Proceso" && (
              <Button
                size="sm"
                onClick={() => onEstado(t, "Completado")}
                disabled={guardando === t.id}
                className="h-9 gap-1 text-xs shrink-0 bg-green-600 hover:bg-green-700"
              >
                {guardando === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Completar
              </Button>
            )}
            {t.estado === "Completado" && (
              <Badge className="bg-green-100 text-green-800 text-[11px] shrink-0 gap-1">
                <CheckCircle2 className="w-3 h-3" /> Hecho
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}