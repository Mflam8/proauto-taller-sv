import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Clock } from "lucide-react";

const horaSV = (valor) => new Date(valor).toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit", timeZone: "America/El_Salvador" });
const fechaSV = (valor) => new Date(valor).toLocaleDateString("es-SV", { day: "2-digit", month: "short", timeZone: "America/El_Salvador" });

export default function HistorialAsistencia({ registros = [], cargando = false }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg"><History className="h-5 w-5 text-[#E31E24]" />Mi historial de asistencia</CardTitle>
      </CardHeader>
      <CardContent>
        {cargando ? <p className="py-3 text-sm text-gray-400">Cargando registros...</p> : registros.length === 0 ? (
          <p className="py-3 text-sm text-gray-400">Todavía no hay registros de asistencia.</p>
        ) : (
          <div className="space-y-2">
            {registros.map((registro) => (
              <div key={registro.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
                <div className="min-w-0"><p className="text-sm font-medium text-gray-800">{registro.tipo}</p><p className="text-xs text-gray-500">{fechaSV(registro.fecha_hora)}</p></div>
                <Badge className="shrink-0 gap-1 bg-white text-gray-700"><Clock className="h-3 w-3" />{horaSV(registro.fecha_hora)}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}