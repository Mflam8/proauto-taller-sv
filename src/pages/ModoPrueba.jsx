import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { esDueno } from "@/lib/permissions";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, FlaskConical, ShieldAlert, Trash2, X } from "lucide-react";
import {
  guardarActorPrueba,
  guardarModoActivo,
  guardarPerfilPrueba,
  leerActorPrueba,
  leerModoActivo,
  leerPerfilPrueba,
  perfilPrueba,
} from "@/lib/modoPrueba";
import SelectorPerfilPrueba from "@/components/modoprueba/SelectorPerfilPrueba";
import TarjetaExpediente from "@/components/modoprueba/TarjetaExpediente";
import PanelPrueba from "@/components/modoprueba/PanelPrueba";
import BitacoraPrueba from "@/components/modoprueba/BitacoraPrueba";
import FormularioExpedientePrueba from "@/components/modoprueba/FormularioExpedientePrueba";

export default function ModoPrueba() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [activo, setActivo] = useState(() => leerModoActivo());
  const [perfil, setPerfil] = useState(() => leerPerfilPrueba());
  const [actor, setActor] = useState(() => leerActorPrueba(leerPerfilPrueba()));
  const [seleccion, setSeleccion] = useState(null);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);

  useEffect(() => {
    base44.auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCargando(false));
  }, []);

  const autorizado = esDueno(user);

  const { data, isLoading } = useQuery({
    queryKey: ["prueba-datos", perfil],
    queryFn: async () => {
      const res = await base44.functions.invoke("modoPrueba", { accion: "listar", perfil });
      return res.data;
    },
    enabled: activo && autorizado,
  });

  const accion = useMutation({
    mutationFn: async (payload) => {
      const res = await base44.functions.invoke("modoPrueba", { perfil, actor_nombre: actor, ...payload });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries(["prueba-datos"]),
    onError: (error) =>
      toast({
        title: "El modo de prueba no completó la acción",
        description: error?.message || "Intenta de nuevo.",
        variant: "destructive",
      }),
  });

  const expedientes = data?.expedientes || [];
  const facturas = data?.facturas || [];
  const eventos = data?.eventos || [];

  const expediente = useMemo(
    () => expedientes.find((e) => e.id === seleccion) || null,
    [expedientes, seleccion]
  );
  const factura = useMemo(
    () => facturas.find((f) => f.expediente_prueba_id === expediente?.id) || null,
    [facturas, expediente]
  );

  useEffect(() => {
    if (expedientes.length > 0 && !seleccion) setSeleccion(expedientes[0].id);
  }, [expedientes, seleccion]);

  useEffect(() => {
    if (activo && seleccion && !expedientes.some((e) => e.id === seleccion)) {
      setSeleccion(expedientes[0]?.id || null);
    }
  }, [expedientes, seleccion, activo]);

  const cambiarPerfil = (nuevo) => {
    const siguiente = perfilPrueba(nuevo);
    setPerfil(siguiente.value);
    guardarPerfilPrueba(siguiente.value);
    setActor(siguiente.defecto);
    guardarActorPrueba(siguiente.defecto);
    qc.invalidateQueries(["prueba-datos"]);
  };

  const cambiarActor = (valor) => {
    setActor(valor);
    guardarActorPrueba(valor);
  };

  const activar = () => {
    setActivo(true);
    guardarModoActivo(true);
  };

  const salir = () => {
    setActivo(false);
    guardarModoActivo(false);
  };

  const descartarTodo = () => {
    if (!window.confirm("Se borrarán todos los expedientes, inspecciones y facturas de prueba. No afecta datos reales. ¿Continuar?")) return;
    accion.mutate({ accion: "limpiar" }, { onSuccess: () => setSeleccion(null) });
  };

  if (cargando) {
    return (
      <div className="p-10 flex justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#C0392B] rounded-full animate-spin" />
      </div>
    );
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
          <h1 className="mt-4 text-lg font-bold text-gray-900">Modo de prueba restringido</h1>
          <p className="mt-2 text-sm text-gray-500">
            Solo el Super Admin puede activar y usar este entorno de prueba.
          </p>
        </div>
      </div>
    );
  }

  if (!activo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <div className="rounded-3xl border border-amber-200 bg-white overflow-hidden shadow-sm">
            <div className="bg-amber-400/90 px-6 py-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-950">Entorno aislado</p>
              <h1 className="mt-1 text-2xl font-bold text-amber-950 flex items-center gap-2">
                <FlaskConical className="w-6 h-6" /> Modo de prueba
              </h1>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Aquí puedes recorrer el flujo móvil propuesto antes de activarlo en el taller. Los expedientes,
                inspecciones, diagnósticos y facturas de este entorno viven separados: no crean ni modifican
                clientes, vehículos, expedientes, facturas ni cobros reales.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>· Yanira ingresa el expediente y decide si lleva revisión de pintura.</li>
                <li>· Los técnicos completan inspección y diagnóstico según su especialidad.</li>
                <li>· Solo Yanira o Mauricio preparan y emiten la factura.</li>
              </ul>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs text-gray-500">
                Solo el Super Admin puede activar el modo. Al salir, el sistema real sigue funcionando igual y
                los datos de prueba quedan disponibles para retomarlos o descartarlos.
              </div>
              <Button onClick={activar} className="w-full bg-[#C0392B] hover:bg-[#a93226]">
                Activar modo de prueba
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-amber-400 text-amber-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <p className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <FlaskConical className="w-4 h-4 shrink-0" />
            MODO DE PRUEBA ACTIVO · este entorno no afecta expedientes, facturas ni cobros reales
          </p>
          <Button size="sm" variant="ghost" onClick={salir} className="text-amber-950 hover:bg-amber-300/60 gap-1 shrink-0">
            <X className="w-3.5 h-3.5" /> Salir
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Simulación del flujo operativo</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Elige quién actúa para comprobar los accesos de cada especialidad.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={descartarTodo} className="gap-1.5 text-gray-600">
            <Trash2 className="w-3.5 h-3.5" /> Descartar datos de prueba
          </Button>
        </div>

        <SelectorPerfilPrueba
          perfil={perfil}
          actor={actor}
          onPerfil={cambiarPerfil}
          onActor={cambiarActor}
        />

        <div className="grid gap-5 lg:grid-cols-[320px,1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 h-fit">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Bandeja de trabajo · {expedientes.length}
              </p>
              {perfil === "facturacion" && (
                <Button size="sm" onClick={() => setNuevoAbierto(true)} className="bg-[#C0392B] hover:bg-[#a93226] gap-1 h-7 text-xs px-2">
                  <Plus className="w-3.5 h-3.5" /> Nuevo
                </Button>
              )}
            </div>
            <div className="mt-3 space-y-2 max-h-[70vh] overflow-y-auto pr-0.5">
              {isLoading ? (
                <p className="text-xs text-gray-400 py-6 text-center">Cargando expedientes de prueba…</p>
              ) : expedientes.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">
                  {perfil === "facturacion"
                    ? "Aún no hay expedientes de prueba. Ingresa el primero."
                    : "No hay expedientes visibles para este perfil."}
                </p>
              ) : (
                expedientes.map((e) => (
                  <TarjetaExpediente
                    key={e.id}
                    expediente={e}
                    seleccionado={e.id === seleccion}
                    onSelect={setSeleccion}
                  />
                ))
              )}
            </div>
          </div>

          <div className="space-y-5 min-w-0">
            <PanelPrueba
              expediente={expediente}
              factura={factura}
              perfil={perfil}
              guardando={accion.isPending}
              onAccion={(payload) => accion.mutate(payload)}
            />
            <BitacoraPrueba eventos={eventos} />
          </div>
        </div>
      </div>

      <FormularioExpedientePrueba
        open={nuevoAbierto}
        onClose={() => setNuevoAbierto(false)}
        guardando={accion.isPending}
        onGuardar={(payload) =>
          accion.mutate(payload, {
            onSuccess: (data) => {
              setNuevoAbierto(false);
              if (data?.id) setSeleccion(data.id);
            },
          })
        }
      />
    </div>
  );
}