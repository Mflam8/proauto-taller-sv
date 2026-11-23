import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, CheckCircle2, Loader2, Lock, ShieldCheck, Smartphone } from "lucide-react";
import FotoRecepcion, { ANGULOS_FOTO } from "@/components/inspeccion/FotoRecepcion";

export default function RecepcionRapida({ expediente, vehiculo, cliente, empleados, inspeccionExistente, onSave, onAbrirCompleta }) {
  const fotosIniciales = () => {
    const previas = Array.isArray(inspeccionExistente?.fotos) ? inspeccionExistente.fotos : [];
    return ANGULOS_FOTO.map((_, index) => (typeof previas[index] === "string" ? previas[index] : ""));
  };

  const [fotos, setFotos] = useState(fotosIniciales);
  const [realizadaPor, setRealizadaPor] = useState(inspeccionExistente?.realizada_por || "");
  const [kilometraje, setKilometraje] = useState(inspeccionExistente?.kilometraje ?? vehiculo?.kilometraje_actual ?? "");
  const [subiendo, setSubiendo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardadas = fotos.filter(foto => typeof foto === "string" && foto.trim()).length;
  const completa = guardadas >= ANGULOS_FOTO.length;
  const tecnicos = empleados.filter(empleado => empleado.activo !== false);

  const subirFoto = async (index, event) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setError("");
    setSubiendo(index);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setFotos(prev => prev.map((foto, i) => (i === index ? file_uri : foto)));
    } catch {
      setError("No se pudo subir la foto. Revisa la conexión e inténtalo de nuevo.");
    } finally {
      setSubiendo(null);
    }
  };

  const guardar = async () => {
    if (subiendo !== null || guardando) return;
    setGuardando(true);
    setError("");
    try {
      const { id, created_date, updated_date, created_by_id, ...previos } = inspeccionExistente || {};
      const data = {
        ...previos,
        expediente_id: expediente.id,
        vehiculo_id: vehiculo?.id,
        cliente_id: cliente?.id,
        realizada_por: realizadaPor,
        kilometraje: kilometraje === "" ? undefined : Number(kilometraje),
        fotos,
        fecha: new Date().toISOString(),
        estado: completa ? "Completada" : "Pendiente",
      };
      if (inspeccionExistente?.id) {
        await base44.entities.Inspeccion.update(inspeccionExistente.id, data);
      } else {
        await base44.entities.Inspeccion.create(data);
      }
      onSave?.(completa);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "No se pudo guardar la recepción.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border bg-white p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E31E24]/10">
            <Camera className="h-5 w-5 text-[#E31E24]" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">Recepción del vehículo</p>
            <p className="text-xs text-gray-500">Solo lo esencial: quién recibe, kilometraje y las 4 fotos.</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 text-xs">
          <div>
            <p className="text-gray-500">Vehículo</p>
            <p className="break-words font-semibold text-gray-900">{vehiculo?.marca} {vehiculo?.modelo}</p>
          </div>
          <div>
            <p className="text-gray-500">Placa</p>
            <p className="font-semibold text-gray-900">{vehiculo?.placa || "—"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Cliente</p>
            <p className="break-words font-semibold text-gray-900">{cliente?.nombre_completo || "—"}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border bg-white p-3">
        <div>
          <Label className="text-xs text-gray-600">¿Quién recibe el vehículo?</Label>
          <Select value={realizadaPor} onValueChange={setRealizadaPor}>
            <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Selecciona al técnico o recepcionista" /></SelectTrigger>
            <SelectContent>
              {tecnicos.map(empleado => (
                <SelectItem key={empleado.id} value={empleado.nombre_completo}>{empleado.nombre_completo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-600">Kilometraje de entrada</Label>
          <Input type="number" inputMode="numeric" className="mt-1 h-11" value={kilometraje}
            onChange={e => setKilometraje(e.target.value)} placeholder="Km del tablero" />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">Fotos de recepción</p>
            <p className="text-xs text-gray-500">Los cuatro ángulos son obligatorios para facturar.</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${completa ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
            {Math.min(guardadas, ANGULOS_FOTO.length)}/4
          </span>
        </div>

        <div className="mt-2 flex gap-1.5">
          {ANGULOS_FOTO.map((angulo, index) => (
            <span key={angulo} className={`h-1.5 flex-1 rounded-full ${fotos[index] ? "bg-green-600" : "bg-gray-200"}`} />
          ))}
        </div>

        <div className="mt-3 space-y-3">
          {ANGULOS_FOTO.map((angulo, index) => {
            const fileUri = fotos[index];
            const cargando = subiendo === index;
            return (
              <div key={angulo} className={`overflow-hidden rounded-2xl border ${fileUri ? "border-green-200" : "border-gray-200"}`}>
                {fileUri ? (
                  <FotoRecepcion fileUri={fileUri} alt={`Foto ${angulo}`} className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-24 items-center justify-center bg-gray-50">
                    <Camera className="h-7 w-7 text-gray-300" />
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 p-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{index + 1}. {angulo}</p>
                    <p className={`text-xs ${fileUri ? "text-green-700" : "text-amber-700"}`}>
                      {fileUri ? "Guardada en el expediente" : "Pendiente"}
                    </p>
                  </div>
                  <label className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold ${fileUri ? "border border-gray-300 text-gray-700" : "bg-[#E31E24] text-white"} ${subiendo !== null ? "pointer-events-none opacity-60" : ""}`}>
                    {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    {cargando ? "Subiendo…" : fileUri ? "Repetir" : "Abrir cámara"}
                    <input type="file" accept="image/*" capture="environment" className="sr-only"
                      onChange={e => subirFoto(index, e)} disabled={subiendo !== null} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-900">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Usa el teléfono o la tablet del taller. Cada foto va directo al expediente y queda guardada de forma privada: la app no abre la galería ni deja copias en el dispositivo.</p>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <Button onClick={guardar} disabled={guardando || subiendo !== null}
        className="h-12 w-full gap-2 bg-gradient-to-r from-[#E31E24] to-[#B71C1C] text-white">
        {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {guardando ? "Guardando recepción…" : completa ? "Guardar recepción completa" : `Guardar recepción (${Math.min(guardadas, 4)}/4 fotos)`}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Lock className="h-3 w-3" /> Las fotos quedan ligadas a este expediente.
      </p>

      {onAbrirCompleta && (
        <Button variant="outline" className="h-11 w-full gap-2" onClick={onAbrirCompleta}>
          <ShieldCheck className="h-4 w-4" /> Hacer la inspección completa
        </Button>
      )}
    </div>
  );
}