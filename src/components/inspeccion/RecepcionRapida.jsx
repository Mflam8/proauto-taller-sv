import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import FotoRecepcion, { ANGULOS_FOTO } from "@/components/inspeccion/FotoRecepcion";
import { Camera, CheckCircle2, Loader2, Lock, Smartphone } from "lucide-react";

export default function RecepcionRapida({ expediente, vehiculo, cliente, inspeccionExistente, fotosIniciales = [], onContinue }) {
  const fotosBase = Array.isArray(fotosIniciales) && fotosIniciales.length
    ? fotosIniciales
    : (Array.isArray(inspeccionExistente?.fotos) ? inspeccionExistente.fotos : []);
  const [fotos, setFotos] = useState(() => ANGULOS_FOTO.map((_, index) => (typeof fotosBase[index] === "string" ? fotosBase[index] : "")));
  const [subiendo, setSubiendo] = useState(null);
  const [error, setError] = useState("");
  const guardadas = fotos.filter(foto => typeof foto === "string" && foto.trim()).length;
  const completa = guardadas === ANGULOS_FOTO.length;

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

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border bg-white p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#E31E24]">Paso 1 de 2 · Fotos</p>
        <h3 className="mt-1 font-semibold text-gray-900">Toma las cuatro fotos del vehículo</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 text-xs">
          <div><p className="text-gray-500">Vehículo</p><p className="break-words font-semibold text-gray-900">{vehiculo?.marca} {vehiculo?.modelo}</p></div>
          <div><p className="text-gray-500">Placa</p><p className="font-semibold text-gray-900">{vehiculo?.placa || "—"}</p></div>
          <div className="col-span-2"><p className="text-gray-500">Cliente</p><p className="break-words font-semibold text-gray-900">{cliente?.nombre_completo || "—"}</p></div>
          <div className="col-span-2"><p className="text-gray-500">Expediente</p><p className="font-semibold text-gray-900">{expediente?.numero_expediente || ""}</p></div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <div><p className="font-semibold text-gray-900">Fotos de recepción</p><p className="text-xs text-gray-500">Frontal, trasera y ambos lados.</p></div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${completa ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{Math.min(guardadas, 4)}/4</span>
        </div>
        <div className="mt-2 flex gap-1.5">{ANGULOS_FOTO.map((angulo, index) => <span key={angulo} className={`h-1.5 flex-1 rounded-full ${fotos[index] ? "bg-green-600" : "bg-gray-200"}`} />)}</div>
        <div className="mt-3 space-y-3">
          {ANGULOS_FOTO.map((angulo, index) => {
            const fileUri = fotos[index];
            const cargando = subiendo === index;
            return (
              <div key={angulo} className={`overflow-hidden rounded-2xl border ${fileUri ? "border-green-200" : "border-gray-200"}`}>
                {fileUri ? <FotoRecepcion fileUri={fileUri} alt={`Foto ${angulo}`} className="h-40 w-full object-cover" /> : <div className="flex h-24 items-center justify-center bg-gray-50"><Camera className="h-7 w-7 text-gray-300" /></div>}
                <div className="flex items-center justify-between gap-2 p-2.5">
                  <div><p className="text-sm font-semibold text-gray-900">{index + 1}. {angulo}</p><p className={`text-xs ${fileUri ? "text-green-700" : "text-amber-700"}`}>{fileUri ? "Guardada en el expediente" : "Pendiente"}</p></div>
                  <label className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold ${fileUri ? "border border-gray-300 text-gray-700" : "bg-[#E31E24] text-white"} ${subiendo !== null ? "pointer-events-none opacity-60" : ""}`}>
                    {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}{cargando ? "Subiendo…" : fileUri ? "Repetir" : "Abrir cámara"}
                    <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={e => subirFoto(index, e)} disabled={subiendo !== null} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-900">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Usa únicamente el teléfono o la tablet compartida del taller. Las fotos se envían directamente al expediente y no es necesario guardarlas en la galería personal.</p>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <Button onClick={() => completa && onContinue?.(fotos)} disabled={!completa || subiendo !== null} className="h-12 w-full gap-2 bg-gradient-to-r from-[#E31E24] to-[#B71C1C] text-white">
        <CheckCircle2 className="h-4 w-4" /> Continuar a las preguntas (2/2)
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400"><Lock className="h-3 w-3" /> Las fotos se guardan de forma privada en el expediente.</p>
    </div>
  );
}