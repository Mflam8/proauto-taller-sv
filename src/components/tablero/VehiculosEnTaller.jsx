import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Car, ChevronDown, Check, X } from "lucide-react";

const ESTADOS = [
  "Recibido", "En Diagnóstico", "Esperando Aprobación", "Aprobado",
  "En Reparación", "Esperando Repuesto", "En Pintura", "En Lavado",
  "Listo para Entrega", "Entregado", "Cerrado", "Cancelado"
];

const estadoBadge = {
  "Recibido":              "bg-gray-100 text-gray-700 border-gray-200",
  "En Diagnóstico":        "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Esperando Aprobación":  "bg-amber-100 text-amber-800 border-amber-200",
  "Aprobado":              "bg-blue-100 text-blue-800 border-blue-200",
  "En Reparación":         "bg-blue-200 text-blue-900 border-blue-300",
  "Esperando Repuesto":    "bg-orange-100 text-orange-800 border-orange-200",
  "En Pintura":            "bg-purple-100 text-purple-800 border-purple-200",
  "En Lavado":             "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Listo para Entrega":    "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Entregado":             "bg-slate-100 text-slate-700 border-slate-200",
  "Cerrado":               "bg-gray-200 text-gray-600 border-gray-300",
  "Cancelado":             "bg-red-100 text-red-700 border-red-200",
};

function EstadoDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition-all hover:opacity-80 ${estadoBadge[value] || "bg-gray-100 text-gray-700 border-gray-200"}`}
      >
        {value}
        <ChevronDown className="w-3 h-3 ml-0.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 min-w-[200px] py-1 overflow-hidden">
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => { onChange(e); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${value === e ? "font-semibold text-[#C0392B]" : "text-gray-700"}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${estadoBadge[e]?.includes("emerald") ? "bg-emerald-400" : estadoBadge[e]?.includes("blue") ? "bg-blue-400" : estadoBadge[e]?.includes("yellow") ? "bg-yellow-400" : estadoBadge[e]?.includes("orange") ? "bg-orange-400" : estadoBadge[e]?.includes("purple") ? "bg-purple-400" : "bg-gray-300"}`} />
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InlineEdit({ value, onSave, type = "text", placeholder = "" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(value ?? ""); setEditing(true); }}
        className="text-left text-sm text-gray-700 hover:text-[#C0392B] hover:underline transition-colors min-w-[60px] truncate max-w-[200px]"
        title="Click para editar"
      >
        {value || <span className="text-gray-300 italic">—</span>}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type={type}
        value={draft}
        min={type === "number" ? 0 : undefined}
        max={type === "number" ? 100 : undefined}
        onChange={e => setDraft(e.target.value)}
        autoFocus
        placeholder={placeholder}
        className="border border-[#C0392B] rounded px-1.5 py-0.5 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-[#C0392B]"
        onKeyDown={e => {
          if (e.key === "Enter") { onSave(draft); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <button onClick={() => { onSave(draft); setEditing(false); }} className="text-emerald-600 hover:text-emerald-700"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

export default function VehiculosEnTaller({ expedientes, clienteMap, vehiculoMap, onUpdate, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
        Cargando vehículos...
      </div>
    );
  }

  if (expedientes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
        <Car className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="font-medium">No hay vehículos en taller actualmente</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ingreso</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehículo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Motivo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nota</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">% Avance</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entrega Est.</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {expedientes.map((exp) => {
              const cliente = clienteMap[exp.cliente_id];
              const vehiculo = vehiculoMap[exp.vehiculo_id];
              const progreso = exp.progreso_porcentaje ?? 0;
              return (
                <tr key={exp.id} className="hover:bg-gray-50/70 transition-colors group">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {exp.fecha_ingreso
                      ? format(new Date(exp.fecha_ingreso), "dd/MM/yy", { locale: es })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 text-sm">
                      {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : "—"}
                    </div>
                    {vehiculo?.placa && (
                      <div className="text-xs text-gray-400 font-mono">{vehiculo.placa}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-800 text-sm">
                    {cliente?.nombre_completo || "—"}
                    {cliente?.telefono && (
                      <div className="text-xs text-gray-400">{cliente.telefono}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px]">
                    <p className="line-clamp-2">{exp.motivo_visita || "—"}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[160px]">
                    <InlineEdit
                      value={exp.observaciones}
                      placeholder="Agregar nota..."
                      onSave={(v) => onUpdate(exp.id, { observaciones: v })}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${progreso >= 100 ? "bg-emerald-500" : progreso >= 60 ? "bg-blue-500" : progreso >= 30 ? "bg-yellow-500" : "bg-[#C0392B]"}`}
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                      <InlineEdit
                        value={String(progreso)}
                        type="number"
                        placeholder="0-100"
                        onSave={(v) => onUpdate(exp.id, { progreso_porcentaje: Math.min(100, Math.max(0, parseInt(v) || 0)) })}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {exp.fecha_promesa_entrega
                      ? format(new Date(exp.fecha_promesa_entrega), "dd/MM/yy", { locale: es })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoDropdown
                      value={exp.estado_interno}
                      onChange={(v) => onUpdate(exp.id, { estado_interno: v })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet cards */}
      <div className="lg:hidden divide-y divide-gray-100">
        {expedientes.map((exp) => {
          const cliente = clienteMap[exp.cliente_id];
          const vehiculo = vehiculoMap[exp.vehiculo_id];
          const progreso = exp.progreso_porcentaje ?? 0;
          return (
            <div key={exp.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900">
                    {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : "—"}
                  </p>
                  {vehiculo?.placa && <p className="text-xs font-mono text-gray-400">{vehiculo.placa}</p>}
                </div>
                <EstadoDropdown
                  value={exp.estado_interno}
                  onChange={(v) => onUpdate(exp.id, { estado_interno: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Cliente</p>
                  <p className="text-gray-800">{cliente?.nombre_completo || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Ingreso</p>
                  <p className="text-gray-800">
                    {exp.fecha_ingreso ? format(new Date(exp.fecha_ingreso), "dd/MM/yy") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Motivo</p>
                  <p className="text-gray-700 text-xs">{exp.motivo_visita || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Entrega est.</p>
                  <p className="text-gray-800">
                    {exp.fecha_promesa_entrega ? format(new Date(exp.fecha_promesa_entrega), "dd/MM/yy") : "—"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Avance — {progreso}%</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${progreso >= 100 ? "bg-emerald-500" : progreso >= 60 ? "bg-blue-500" : progreso >= 30 ? "bg-yellow-500" : "bg-[#C0392B]"}`}
                    style={{ width: `${progreso}%` }}
                  />
                </div>
              </div>
              {exp.observaciones && (
                <p className="text-xs text-gray-500 italic">Nota: {exp.observaciones}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}