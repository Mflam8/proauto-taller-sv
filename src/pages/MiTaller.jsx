import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { esAdmin, esDueno, puede } from "@/lib/permissions";
import {
  LogIn, LogOut, MapPin, Wrench, Loader2, Clock,
  Play, CheckCircle2, Users, Save, AlertTriangle, CheckCircle,
} from "lucide-react";

const hoySV = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/El_Salvador" });

const horaSV = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit", timeZone: "America/El_Salvador" }) : "";

const estadoColor = {
  "Pendiente": "bg-yellow-100 text-yellow-800",
  "En Proceso": "bg-blue-100 text-blue-800",
  "Completado": "bg-green-100 text-green-800",
};

export default function MiTaller() {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [marcando, setMarcando] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [guardandoUbicacion, setGuardandoUbicacion] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => setUser(u)).catch(() => {});
  }, []);

  const miEmail = user?.email ? user.email.toLowerCase() : null;
  const esAdminRol = esAdmin(user);
  const puedeGestionarAsistencia = puede(user, "gestionar_asistencia");
  const soyDueno = esDueno(user);

  // Asistencia propia de hoy
  const { data: miDia = [] } = useQuery({
    queryKey: ["asistencia-hoy", miEmail],
    queryFn: () => base44.entities.Asistencia.filter({ empleado_email: miEmail, fecha_sv: hoySV() }),
    enabled: !!miEmail,
  });

  // Asistencia de todos (solo admin y jefe de taller)
  const { data: diaTodos = [] } = useQuery({
    queryKey: ["asistencia-dia"],
    queryFn: () => base44.entities.Asistencia.filter({ fecha_sv: hoySV() }),
    enabled: !!miEmail && puedeGestionarAsistencia,
  });

  // Ubicación del taller (solo Super Admin puede configurarla)
  const { data: config = [] } = useQuery({
    queryKey: ["config-taller"],
    queryFn: () => base44.entities.ConfigTaller.list(),
    enabled: soyDueno,
  });

  // Mis trabajos asignados (por ficha de empleado)
  const { data: misTrabajos = [] } = useQuery({
    queryKey: ["mis-trabajos", user?.empleado_id],
    queryFn: () => base44.entities.TrabajoExpediente.filter({ tecnico_id: user.empleado_id }, "-created_date", 50),
    enabled: !!user?.empleado_id,
  });

  const entradaHoy = miDia.find((r) => r.tipo === "Entrada");
  const salidaHoy = miDia.find((r) => r.tipo === "Salida");

  const marcar = (tipo) => {
    setMarcando(tipo);
    setMensaje(null);
    if (!navigator.geolocation) {
      setMensaje({ tipo: "error", texto: "Tu navegador no permite ubicación. Actívalo para marcar tu asistencia." });
      setMarcando(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await base44.functions.invoke("marcarAsistencia", {
            tipo,
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
          });
          if (res.data?.ok) {
            setMensaje({ tipo: "ok", texto: tipo === "Entrada" ? "Entrada registrada. ¡Buen trabajo!" : "Salida registrada. ¡Buen día!" });
            qc.invalidateQueries({ queryKey: ["asistencia-hoy"] });
            qc.invalidateQueries({ queryKey: ["asistencia-dia"] });
          } else {
            setMensaje({ tipo: "error", texto: res.data?.error || "No se pudo registrar." });
          }
        } catch (e) {
          setMensaje({ tipo: "error", texto: e.response?.data?.error || e.message || "No se pudo registrar." });
        } finally {
          setMarcando(null);
        }
      },
      () => {
        setMensaje({ tipo: "error", texto: "No pudimos obtener tu ubicación. Permite el acceso a la ubicación en tu navegador." });
        setMarcando(null);
      },
      { enableHighAccuracy: true, timeout: 20000 }
    );
  };

  const guardarUbicacion = () => {
    if (!navigator.geolocation) return;
    setGuardandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const actual = config[0];
          const datos = {
            nombre: "Taller Santa Ana",
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
            radio_metros: actual?.radio_metros || 150,
            actualizado_por: user.full_name,
            fecha_actualizacion: new Date().toISOString(),
          };
          if (actual) {
            await base44.entities.ConfigTaller.update(actual.id, datos);
          } else {
            await base44.entities.ConfigTaller.create(datos);
          }
          setMensaje({ tipo: "ok", texto: "Ubicación del taller actualizada." });
          qc.invalidateQueries({ queryKey: ["config-taller"] });
        } catch (e) {
          setMensaje({ tipo: "error", texto: e.message || "No se pudo guardar." });
        } finally {
          setGuardandoUbicacion(false);
        }
      },
      () => {
        setMensaje({ tipo: "error", texto: "No pudimos obtener tu ubicación." });
        setGuardandoUbicacion(false);
      },
      { enableHighAccuracy: true, timeout: 20000 }
    );
  };

  // Las horas de inicio y fin las registra el sistema al cambiar el estado
  const cambiarEstado = async (t, estado) => {
    await base44.entities.TrabajoExpediente.update(t.id, { estado });
    qc.invalidateQueries({ queryKey: ["mis-trabajos"] });
  };

  const activos = misTrabajos.filter((t) => t.estado !== "Completado");

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Taller</h1>
        <p className="text-sm text-gray-500">Hola {user?.full_name?.split(" ")[0] || ""}, registra tu asistencia y avanza tus trabajos.</p>
      </div>

      {/* Mensaje de resultado */}
      {mensaje && (
        <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${mensaje.tipo === "ok" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {mensaje.tipo === "ok" ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Asistencia */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-[#E31E24]" />
            Asistencia de hoy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge className={entradaHoy ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}>
              Entrada: {entradaHoy ? horaSV(entradaHoy.fecha_hora) : "sin registrar"}
            </Badge>
            <Badge className={salidaHoy ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}>
              Salida: {salidaHoy ? horaSV(salidaHoy.fecha_hora) : "sin registrar"}
            </Badge>
            {entradaHoy?.distancia_metros != null && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Verificado en el taller
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {!entradaHoy && (
              <Button
                onClick={() => marcar("Entrada")}
                disabled={!!marcando || !!salidaHoy}
                className="flex-1 h-14 text-base bg-[#E31E24] hover:bg-[#B71C1C] gap-2"
              >
                {marcando === "Entrada" ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                Marcar Entrada
              </Button>
            )}
            {entradaHoy && !salidaHoy && (
              <Button
                onClick={() => marcar("Salida")}
                disabled={!!marcando}
                className="flex-1 h-14 text-base bg-gray-900 hover:bg-gray-800 gap-2"
              >
                {marcando === "Salida" ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                Marcar Salida
              </Button>
            )}
            {entradaHoy && salidaHoy && (
              <div className="flex-1 h-14 flex items-center justify-center rounded-xl bg-green-50 border border-green-200 text-sm font-medium text-green-800 gap-2">
                <CheckCircle2 className="w-5 h-5" /> Jornada completa registrada
              </div>
            )}
          </div>

          {soyDueno && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 border p-3">
              <div className="text-xs text-gray-600">
                <p className="font-semibold text-gray-800">Ubicación del taller</p>
                <p>
                  {config[0]?.latitud != null
                    ? `Configurada (radio ${config[0]?.radio_metros || 150} m)`
                    : "Sin configurar: los empleados no pueden marcar asistencia"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={guardarUbicacion} disabled={guardandoUbicacion} className="gap-2 shrink-0">
                {guardandoUbicacion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar desde aquí
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asistencia del día (con capacidad de gestionar asistencia) */}
      {puedeGestionarAsistencia && diaTodos.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-[#E31E24]" />
              Asistencia del equipo hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {diaTodos
                .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50">
                    <span className="font-medium text-gray-800">{r.empleado_nombre || r.empleado_email}</span>
                    <span className="flex items-center gap-2 text-gray-600">
                      <Badge className={r.tipo === "Entrada" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}>{r.tipo}</Badge>
                      {horaSV(r.fecha_hora)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mis trabajos */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="w-5 h-5 text-[#E31E24]" />
            Mis trabajos asignados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {misTrabajos.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tienes trabajos asignados</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                {activos.length} activo(s) de {misTrabajos.length} en total
              </p>
              {misTrabajos.slice(0, 15).map((t) => (
                <div key={t.id} className="p-3 bg-gray-50 rounded-xl border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900">{t.descripcion}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.tipo}</p>
                    </div>
                    <Badge className={`text-xs shrink-0 ${estadoColor[t.estado] || ""}`}>{t.estado}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {t.fecha_fin && t.estado === "Completado"
                        ? `Completado ${horaSV(t.fecha_fin)}`
                        : t.fecha_inicio
                          ? `Iniciado ${horaSV(t.fecha_inicio)}`
                          : "Sin iniciar"}
                    </span>
                    {t.estado === "Pendiente" && (
                      <Button size="sm" variant="outline" onClick={() => cambiarEstado(t, "En Proceso")} className="h-8 gap-1 text-xs">
                        <Play className="w-3 h-3" /> Iniciar
                      </Button>
                    )}
                    {t.estado === "En Proceso" && (
                      <Button size="sm" onClick={() => cambiarEstado(t, "Completado")} className="h-8 gap-1 text-xs bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="w-3 h-3" /> Completar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}