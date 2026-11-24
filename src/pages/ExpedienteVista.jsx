import React, { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, FolderOpen, ClipboardList, Stethoscope, Wrench,
  DollarSign, Package, TruckIcon, Receipt, ShieldCheck, Camera,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import InspeccionForm from "@/components/inspeccion/InspeccionForm";
import RecepcionRapida from "@/components/inspeccion/RecepcionRapida";
import FotoRecepcion, { ANGULOS_FOTO } from "@/components/inspeccion/FotoRecepcion";
import { esAdmin, esDueno, puede } from "@/lib/permissions";
import DiagnosticoForm from "@/components/diagnostico/DiagnosticoForm";
import TrabajosTab from "@/components/trabajos/TrabajosTab";
import MaterialesTab from "@/components/materiales/MaterialesTab";
import CajaChicaTab from "@/components/caja/CajaChicaTab";
import CierreTab from "@/components/cierre/CierreTab";
import GenerarFacturaForm from "@/components/facturacion/GenerarFacturaForm";
import RecepcionTab from "@/components/autorizacion/RecepcionTab";
import ResumenExpediente from "@/components/expedientes/ResumenExpediente";

const TABS = [
  { id: "resumen", label: "Resumen", icon: FolderOpen },
  { id: "inspeccion", label: "Recepción", icon: ClipboardList },
  { id: "diagnostico", label: "Diagnóstico", icon: Stethoscope },
  { id: "trabajos", label: "Trabajos", icon: Wrench },
  { id: "materiales", label: "Materiales", icon: Package },
  { id: "recepcion", label: "Conformidad", icon: ShieldCheck },
  { id: "caja", label: "Caja", icon: DollarSign },
  { id: "cierre", label: "Cierre", icon: TruckIcon },
];

const ESTADOS = [
  "Recibido", "En Diagnóstico", "Esperando Aprobación", "Aprobado",
  "En Reparación", "Esperando Repuesto", "En Pintura", "En Lavado",
  "Listo para Entrega", "Entregado", "Cerrado", "Cancelado"
];

const estadoColor = {
  "Recibido": "bg-gray-100 text-gray-800",
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

export default function ExpedienteVista() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("resumen");
  const [pasoRecepcion, setPasoRecepcion] = useState(1);
  const [fotosPasoRecepcion, setFotosPasoRecepcion] = useState(null);
  const [showFacturaForm, setShowFacturaForm] = useState(false);
  const contenidoRef = useRef(null);

  const { data: expediente, isLoading } = useQuery({
    queryKey: ["expediente", id],
    queryFn: () => base44.entities.Expediente.filter({ id }),
    select: data => data[0],
  });

  const { data: cliente } = useQuery({
    queryKey: ["cliente", expediente?.cliente_id],
    queryFn: () => base44.entities.Cliente.filter({ id: expediente.cliente_id }),
    select: data => data[0],
    enabled: !!expediente?.cliente_id,
  });

  const { data: vehiculo } = useQuery({
    queryKey: ["vehiculo", expediente?.vehiculo_id],
    queryFn: () => base44.entities.Vehiculo.filter({ id: expediente.vehiculo_id }),
    select: data => data[0],
    enabled: !!expediente?.vehiculo_id,
  });

  const { data: empleados = [] } = useQuery({
    queryKey: ["empleados"],
    queryFn: () => base44.entities.Empleado.list(),
  });

  const { data: usuario } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  const { data: inspecciones = [], refetch: refetchInsp } = useQuery({
    queryKey: ["inspecciones", id],
    queryFn: () => base44.entities.Inspeccion.filter({ expediente_id: id }),
    enabled: !!id,
  });

  const { data: diagnosticos = [], refetch: refetchDiag } = useQuery({
    queryKey: ["diagnosticos", id],
    queryFn: () => base44.entities.Diagnostico.filter({ expediente_id: id }),
    enabled: !!id,
  });

  const updateEstado = async (nuevoEstado) => {
    await base44.entities.Expediente.update(id, { estado_interno: nuevoEstado });
    qc.invalidateQueries(["expediente", id]);
    qc.invalidateQueries(["expedientes"]);
  };

  const abrirSeccion = (nueva) => {
    setTab(nueva);
    requestAnimationFrame(() => contenidoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  if (isLoading || !expediente) {
    return <div className="p-6 text-gray-400">Cargando expediente...</div>;
  }

  const inspeccion = [...inspecciones].sort((a, b) => new Date(b.fecha || b.created_date || 0) - new Date(a.fecha || a.created_date || 0))[0];
  const fotosRecepcion = inspeccion?.fotos || [];
  const fotosRecepcionCount = fotosRecepcion.filter(foto => typeof foto === "string" && foto.trim()).length;
  const inspeccionCompletada = inspeccion?.estado === "Completada" && fotosRecepcionCount >= ANGULOS_FOTO.length;
  const esGerencia = esDueno(usuario);
  const puedeFacturar = esGerencia || (esAdmin(usuario) && puede(usuario, "crear_facturas"));
  const diagnostico = diagnosticos[0];
  const numeroExpediente = expediente.numero_expediente || `EXP-${id?.slice(-6)?.toUpperCase()}`;
  const facturaBloqueada = !puedeFacturar || (vehiculo ? !inspeccionCompletada : !esGerencia);
  const motivoBloqueo = vehiculo && !inspeccionCompletada
    ? "Completa la recepción y guarda las 4 fotos"
    : !vehiculo && !esGerencia
      ? "Solo Gerencia puede autorizar una excepción para servicios sin vehículo"
      : undefined;

  const tabsVisibles = TABS.filter(t => t.id !== "inspeccion" || expediente.vehiculo_id);
  const pistaTab = (tabId) => {
    if (tabId === "inspeccion") return `${Math.min(fotosRecepcionCount, ANGULOS_FOTO.length)}/4 fotos`;
    if (tabId === "diagnostico") return diagnostico ? "Registrado" : "Pendiente";
    return null;
  };

  const botonFactura = (
    <Button size="sm" onClick={() => setShowFacturaForm(true)} disabled={facturaBloqueada} title={motivoBloqueo}
      className="gap-1 bg-gradient-to-r from-[#E31E24] to-[#B71C1C] text-xs text-white">
      <Receipt className="h-3.5 w-3.5" /> Generar Factura
    </Button>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-28 sm:pb-6">
      {/* Encabezado fijo para teléfono */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5 sm:px-6">
          <button onClick={() => navigate("/Expedientes")} aria-label="Volver a Expedientes"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg">{numeroExpediente}</h1>
              <Badge className={`${estadoColor[expediente.estado_interno]} shrink-0 text-[11px]`}>{expediente.estado_interno}</Badge>
            </div>
            <p className="truncate text-xs text-gray-500 sm:text-sm">{expediente.motivo_visita}</p>
          </div>
          <div className="hidden shrink-0 sm:block">
            {!expediente.factura_generada ? botonFactura : (
              <Badge className="border border-green-200 bg-green-100 text-green-800">
                <Receipt className="mr-1 h-3 w-3" /> Facturado
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-6">
        {/* Estado de la recepción fotográfica */}
        {vehiculo ? (
          <button onClick={() => abrirSeccion("inspeccion")}
            className={`mb-3 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${inspeccionCompletada ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 ${inspeccionCompletada ? "text-green-700" : "text-amber-700"}`}>
              <Camera className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">Recepción fotográfica</p>
              <p className="text-xs text-gray-700">
                {inspeccionCompletada
                  ? `Completa: ${ANGULOS_FOTO.length}/4 ángulos guardados.`
                  : `Pendiente: ${Math.min(fotosRecepcionCount, ANGULOS_FOTO.length)}/4 ángulos. La factura requiere los cuatro.`}
              </p>
              <div className="mt-1.5 flex gap-1.5">
                {ANGULOS_FOTO.map((angulo, index) => (
                  <span key={angulo} className={`h-1.5 flex-1 rounded-full ${index < fotosRecepcionCount ? "bg-green-600" : "bg-gray-300"}`} />
                ))}
              </div>
            </div>
            {!inspeccionCompletada && (
              <span className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 shadow-sm">
                Tomar fotos
              </span>
            )}
          </button>
        ) : (
          <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Servicio sin vehículo: Gerencia debe registrar una excepción con su motivo para poder facturar.
          </div>
        )}

        {/* Secciones del expediente */}
        <nav aria-label="Secciones del expediente" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tabsVisibles.map(t => {
            const activo = tab === t.id;
            const pista = pistaTab(t.id);
            return (
              <button key={t.id} onClick={() => abrirSeccion(t.id)}
                className={`flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2.5 text-center transition-all ${activo
                  ? "border-transparent bg-gradient-to-br from-[#E31E24] to-[#B71C1C] text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm"}`}>
                <t.icon className={`h-5 w-5 ${activo ? "text-white" : "text-[#E31E24]"}`} />
                <span className="text-xs font-semibold leading-tight">{t.label}</span>
                {pista && (
                  <span className={`text-[10px] font-medium leading-none ${activo ? "text-white/80" : "text-gray-400"}`}>{pista}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Estado del expediente */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl border bg-white p-3">
          <span className="shrink-0 text-sm font-medium text-gray-700">Estado</span>
          <Select value={expediente.estado_interno} onValueChange={updateEstado}>
            <SelectTrigger className="h-11 flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div ref={contenidoRef} className="scroll-mt-24">
          {/* TAB: Resumen */}
          {tab === "resumen" && (
            <ResumenExpediente expediente={expediente} cliente={cliente} vehiculo={vehiculo} />
          )}

          {/* TAB: Recepción / Inspección */}
          {tab === "inspeccion" && (
            <div className="rounded-2xl border bg-white p-3 sm:p-5">
              {inspeccionCompletada ? (
                <div>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-800">Inspección registrada</h3>
                    <Badge className="bg-green-100 text-green-800">Completada</Badge>
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      ["Llantas", inspeccion.estado_llantas],
                      ["Luces", inspeccion.estado_luces],
                      ["Vidrios", inspeccion.estado_vidrios],
                      ["Pintura", inspeccion.estado_pintura],
                      ["Tapicería", inspeccion.estado_tapiceria],
                      ["A/C", inspeccion.aire_acondicionado],
                    ].map(([label, val]) => val && (
                      <div key={label} className="rounded-lg bg-gray-50 p-2 text-center">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-sm font-medium">{val}</p>
                      </div>
                    ))}
                  </div>
                  {inspeccion.daños?.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-2 text-sm font-semibold text-gray-700">Daños ({inspeccion.daños.length})</p>
                      {inspeccion.daños.map((d, i) => (
                        <div key={i} className="mb-1 flex flex-wrap items-center gap-2">
                          <Badge className="bg-red-100 text-xs text-red-800">{d.tipo}</Badge>
                          <span className="text-sm text-gray-700">{d.ubicacion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-gray-400">Realizada por: {inspeccion.realizada_por} · {inspeccion.fecha ? format(new Date(inspeccion.fecha), "dd MMM yyyy HH:mm", { locale: es }) : ""}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {ANGULOS_FOTO.map((angulo, index) => fotosRecepcion[index] && (
                      <div key={angulo} className="space-y-1">
                        <p className="text-xs font-medium text-gray-600">{angulo}</p>
                        <FotoRecepcion fileUri={fotosRecepcion[index]} alt={`Foto ${angulo}`} className="h-32 w-full rounded-lg object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pasoRecepcion === 1 ? (
                    <RecepcionRapida
                      expediente={expediente}
                      vehiculo={vehiculo}
                      cliente={cliente}
                      inspeccionExistente={inspeccion}
                      fotosIniciales={fotosPasoRecepcion ?? inspeccion?.fotos ?? []}
                      onContinue={(fotos) => { setFotosPasoRecepcion(fotos); setPasoRecepcion(2); }}
                    />
                  ) : (
                    <InspeccionForm
                      expediente={expediente}
                      vehiculo={vehiculo}
                      cliente={cliente}
                      empleados={empleados}
                      inspeccionExistente={inspeccion}
                      fotosIniciales={fotosPasoRecepcion ?? inspeccion?.fotos ?? []}
                      mostrarFotos={false}
                      onBack={() => setPasoRecepcion(1)}
                      onSave={(completa) => {
                        refetchInsp();
                        qc.invalidateQueries(["expediente", id]);
                        setFotosPasoRecepcion(null);
                        setPasoRecepcion(1);
                        if (completa) setTab("diagnostico");
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: Diagnóstico */}
          {tab === "diagnostico" && (
            <div className="rounded-2xl border bg-white p-3 sm:p-5">
              {diagnostico ? (
                <div>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-800">Diagnóstico registrado</h3>
                    <Badge className="bg-blue-100 text-blue-800">{diagnostico.estado}</Badge>
                  </div>
                  <p className="mb-1 text-sm text-gray-500">Técnico: <span className="font-medium text-gray-900">{diagnostico.tecnico_nombre}</span></p>
                  {diagnostico.diagnostico_inicial && <div className="mb-3 rounded-lg bg-gray-50 p-3"><p className="mb-1 text-xs text-gray-500">Diagnóstico inicial</p><p className="text-sm">{diagnostico.diagnostico_inicial}</p></div>}
                  {diagnostico.diagnostico_final && <div className="mb-3 rounded-lg bg-blue-50 p-3"><p className="mb-1 text-xs text-gray-500">Diagnóstico final</p><p className="text-sm">{diagnostico.diagnostico_final}</p></div>}
                  {diagnostico.fallas_detectadas?.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-2 text-sm font-semibold text-gray-700">Fallas ({diagnostico.fallas_detectadas.length})</p>
                      {diagnostico.fallas_detectadas.map((f, i) => (
                        <div key={i} className="mb-1 flex flex-wrap items-center gap-2">
                          <Badge className="bg-blue-100 text-xs text-blue-800">{f.sistema}</Badge>
                          <span className="flex-1 text-sm text-gray-700">{f.descripcion}</span>
                          <Badge className="text-xs">{f.severidad}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {diagnostico.recomendaciones && <div className="rounded-lg bg-green-50 p-3"><p className="mb-1 text-xs text-gray-500">Recomendaciones</p><p className="text-sm">{diagnostico.recomendaciones}</p></div>}
                </div>
              ) : (
                <DiagnosticoForm
                  expediente={expediente}
                  empleados={empleados}
                  onSave={() => { refetchDiag(); qc.invalidateQueries(["expediente", id]); }}
                />
              )}
            </div>
          )}

          {/* TAB: Trabajos */}
          {tab === "trabajos" && (
            <div className="rounded-2xl border bg-white p-3 sm:p-5">
              <TrabajosTab expediente={expediente} empleados={empleados} />
            </div>
          )}

          {/* TAB: Materiales */}
          {tab === "materiales" && (
            <div className="rounded-2xl border bg-white p-3 sm:p-5">
              <MaterialesTab expediente={expediente} />
            </div>
          )}

          {/* TAB: Conformidad del cliente */}
          {tab === "recepcion" && (
            <div className="rounded-2xl border bg-white p-3 sm:p-5">
              <RecepcionTab
                expediente={expediente}
                cliente={cliente}
                vehiculo={vehiculo}
                inspeccion={inspeccion}
              />
            </div>
          )}

          {/* TAB: Caja Chica */}
          {tab === "caja" && (
            <div className="rounded-2xl border bg-white p-3 sm:p-5">
              <CajaChicaTab expediente={expediente} />
            </div>
          )}

          {/* TAB: Cierre */}
          {tab === "cierre" && (
            <CierreTab
              expediente={expediente}
              onCerrar={() => qc.invalidateQueries(["expediente", id])}
            />
          )}
        </div>
      </main>

      {/* Acciones fijas en el teléfono */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 p-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-5xl gap-2">
          {vehiculo && (
            <Button variant="outline" className="h-12 flex-1 gap-2" onClick={() => abrirSeccion("inspeccion")}>
              <Camera className="h-4 w-4" /> Fotos {Math.min(fotosRecepcionCount, ANGULOS_FOTO.length)}/4
            </Button>
          )}
          {!expediente.factura_generada ? (
            <Button className="h-12 flex-[1.4] gap-2 bg-gradient-to-r from-[#E31E24] to-[#B71C1C] text-white"
              disabled={facturaBloqueada} title={motivoBloqueo} onClick={() => setShowFacturaForm(true)}>
              <Receipt className="h-4 w-4" /> Facturar
            </Button>
          ) : (
            <div className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md border border-green-200 bg-green-50 text-sm font-semibold text-green-800">
              <Receipt className="h-4 w-4" /> Facturado
            </div>
          )}
        </div>
      </div>

      {/* Dialog Generar Factura */}
      <Dialog open={showFacturaForm} onOpenChange={setShowFacturaForm}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-6 text-left text-lg font-bold">
              <Receipt className="h-5 w-5 shrink-0 text-[#E31E24]" />
              <span className="min-w-0 break-words">Generar factura — {numeroExpediente}</span>
            </DialogTitle>
          </DialogHeader>
          <GenerarFacturaForm
            expediente={expediente}
            cliente={cliente}
            vehiculo={vehiculo}
            onSuccess={() => {
              setShowFacturaForm(false);
              qc.invalidateQueries(["expediente", id]);
            }}
            onClose={() => setShowFacturaForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}