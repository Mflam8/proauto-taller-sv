import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Wrench } from "lucide-react";
import TarjetaExpedienteTecnico from "@/components/tecnico/TarjetaExpedienteTecnico";

const FILTROS = [
  { id: "activos", label: "Activos" },
  { id: "todos", label: "Todos" },
];

const ORDEN_ESTADO = { "En Proceso": 0, "Pendiente": 1, "Completado": 2 };

export default function MisTrabajos() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState("activos");
  const [guardando, setGuardando] = useState(null);
  const [error, setError] = useState(null);

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const empleadoId = user?.empleado_id;

  const { data: trabajos = [], isLoading } = useQuery({
    queryKey: ["mis-trabajos", empleadoId],
    queryFn: () => base44.entities.TrabajoExpediente.filter({ tecnico_id: empleadoId }),
    enabled: !!empleadoId,
  });

  const { data: expedientes = [] } = useQuery({
    queryKey: ["expedientes-tecnico"],
    queryFn: () => base44.entities.Expediente.list(),
    enabled: !!empleadoId,
  });

  const { data: vehiculos = [] } = useQuery({
    queryKey: ["vehiculos-tecnico"],
    queryFn: () => base44.entities.Vehiculo.list(),
    enabled: !!empleadoId,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-tecnico"],
    queryFn: () => base44.entities.Cliente.list(),
    enabled: !!empleadoId,
  });

  const grupos = useMemo(() => {
    const expMap = Object.fromEntries(expedientes.map((e) => [e.id, e]));
    const vehMap = Object.fromEntries(vehiculos.map((v) => [v.id, v]));
    const cliMap = Object.fromEntries(clientes.map((c) => [c.id, c]));
    const porExpediente = new Map();

    trabajos.forEach((t) => {
      const exp = expMap[t.expediente_id];
      if (!exp) return;
      if (!porExpediente.has(t.expediente_id)) {
        porExpediente.set(t.expediente_id, {
          expediente: exp,
          vehiculo: vehMap[exp.vehiculo_id],
          cliente: cliMap[exp.cliente_id],
          items: [],
        });
      }
      porExpediente.get(t.expediente_id).items.push(t);
    });

    return Array.from(porExpediente.values())
      .map((g) => {
        const items = [...g.items].sort((a, b) => {
          const diff = (ORDEN_ESTADO[a.estado] ?? 3) - (ORDEN_ESTADO[b.estado] ?? 3);
          return diff !== 0 ? diff : String(a.descripcion || "").localeCompare(String(b.descripcion || ""));
        });
        return { ...g, items, activos: items.filter((i) => i.estado !== "Completado").length };
      })
      .sort((a, b) => {
        const diff = b.activos - a.activos;
        if (diff !== 0) return diff;
        return String(a.expediente.numero_expediente || "").localeCompare(String(b.expediente.numero_expediente || ""));
      });
  }, [trabajos, expedientes, vehiculos, clientes]);

  const totalActivos = trabajos.filter((t) => t.estado !== "Completado").length;
  const totalEnProceso = trabajos.filter((t) => t.estado === "En Proceso").length;
  const visibles = filtro === "activos" ? grupos.filter((g) => g.activos > 0) : grupos;

  const cambiarEstado = async (trabajo, estado) => {
    setGuardando(trabajo.id);
    setError(null);
    try {
      await base44.entities.TrabajoExpediente.update(trabajo.id, { estado });
      qc.invalidateQueries({ queryKey: ["mis-trabajos"] });
      qc.invalidateQueries({ queryKey: ["trabajos"] });
      qc.invalidateQueries({ queryKey: ["expediente"] });
    } catch (e) {
      setError(e.message || "No se pudo actualizar el trabajo.");
    } finally {
      setGuardando(null);
    }
  };

  if (!user) {
    return <div className="p-6 text-sm text-gray-400">Cargando tus trabajos…</div>;
  }

  if (!empleadoId) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Tu cuenta no está vinculada a una ficha de empleado. Pide a gerencia que la vincule para ver tus trabajos.
      </div>
    );
  }

  return (
    <div className="p-4 pb-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mis trabajos</h1>
        <p className="text-sm text-gray-500">
          Hola {user?.full_name?.split(" ")[0] || ""}, marca el avance de lo que tienes asignado.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Pendientes</p>
          <p className="text-2xl font-bold text-gray-900">{totalActivos}</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-200 p-3">
          <p className="text-xs text-gray-500">En proceso</p>
          <p className="text-2xl font-bold text-[#E31E24]">{totalEnProceso}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`px-3.5 py-2 rounded-full text-xs font-medium transition-colors ${
              filtro === f.id ? "bg-[#E31E24] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
            {f.id === "activos" && totalActivos > 0 ? ` (${totalActivos})` : ""}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && <p className="text-center text-sm text-gray-400 py-10">Cargando tus trabajos…</p>}

      {!isLoading && visibles.length === 0 && (
        <div className="text-center py-14 text-gray-400">
          <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            {filtro === "activos" ? "No tienes trabajos activos" : "No tienes trabajos asignados"}
          </p>
          <p className="text-xs mt-1">Pide a tu supervisor que te asigne un trabajo.</p>
        </div>
      )}

      <div className="space-y-3">
        {visibles.map((grupo) => (
          <TarjetaExpedienteTecnico
            key={grupo.expediente.id}
            grupo={grupo}
            guardando={guardando}
            onEstado={cambiarEstado}
            onOpen={() => navigate(`/Expedientes/${grupo.expediente.id}`)}
          />
        ))}
      </div>
    </div>
  );
}