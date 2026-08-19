import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, FileSignature, Download, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import SignaturePad from "./SignaturePad";
import generarRecepcionPDF from "./RecepcionPDF";

export default function RecepcionTab({ expediente, cliente, vehiculo, inspeccion }) {
  const qc = useQueryClient();
  const rec = expediente.recepcion_cliente || {};
  const yaRecibido = !!rec.fecha_recepcion;

  const [recibido, setRecibido] = useState(!!rec.vehiculo_recibido);
  const [probado, setProbado] = useState(!!rec.vehiculo_probado);
  const [conforme, setConforme] = useState(!!rec.conforme_estado);
  const [nombre, setNombre] = useState(rec.nombre_firma || cliente?.nombre_completo || "");
  const [firma, setFirma] = useState(rec.firma_data_url || "");
  const [saving, setSaving] = useState(false);

  const { data: trabajos = [] } = useQuery({
    queryKey: ["trabajos", expediente.id],
    queryFn: () => base44.entities.TrabajoExpediente.filter({ expediente_id: expediente.id }),
  });

  const handleSave = async () => {
    if (!recibido || !probado || !conforme) {
      alert("Confirme las tres casillas: recibi\u00f3 el veh\u00edculo, lo prob\u00f3 y est\u00e1 conforme con el estado.");
      return;
    }
    if (!nombre.trim()) {
      alert("Ingrese el nombre de quien retira el veh\u00edculo.");
      return;
    }
    if (!firma) {
      alert("Capture la firma del cliente en el recuadro.");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Expediente.update(expediente.id, {
        recepcion_cliente: {
          vehiculo_recibido: recibido,
          vehiculo_probado: probado,
          conforme_estado: conforme,
          fecha_recepcion: new Date().toISOString(),
          nombre_firma: nombre.trim(),
          firma_data_url: firma,
          metodo: "Digital",
        },
      });
      qc.invalidateQueries(["expediente", expediente.id]);
    } catch (e) {
      alert("Error al guardar la conformidad de recepci\u00f3n.");
    }
    setSaving(false);
  };

  const handleDownload = () => {
    generarRecepcionPDF({
      expediente,
      cliente,
      vehiculo,
      inspeccion,
      trabajos,
      recepcion: rec,
    });
  };

  return (
    <div className="space-y-5">
      {/* Banner de estado */}
      {yaRecibido ? (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-green-900">Recepci\u00f3n confirmada</p>
            <p className="text-sm text-green-800">
              El veh\u00edculo fue retirado por <strong>{rec.nombre_firma}</strong> el{" "}
              {new Date(rec.fecha_recepcion).toLocaleString("es-SV")}. M\u00e9todo: {rec.metodo}.
            </p>
          </div>
          <Button onClick={handleDownload} className="gap-1.5 bg-[#E31E24] hover:bg-[#B71C1C]">
            <Download className="w-4 h-4" /> Descargar PDF
          </Button>
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">Pendiente de conformidad de recepci\u00f3n</p>
            <p className="text-sm text-amber-800">
              Seg\u00fan recomendaci\u00f3n legal, el cliente debe firmar que recibi\u00f3 el veh\u00edculo, lo prob\u00f3
              y est\u00e1 satisfecho al momento del retiro, para evitar reclamos o demandas posteriores.
            </p>
          </div>
        </div>
      )}

      {/* Resumen r\u00e1pido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border rounded-xl p-3">
          <p className="text-xs text-gray-500">Trabajos realizados</p>
          <p className="text-lg font-bold text-gray-900">{trabajos.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-3">
          <p className="text-xs text-gray-500">Inspecci\u00f3n de ingreso</p>
          <p className="text-lg font-bold text-gray-900">
            {inspeccion ? (
              <Badge className="bg-green-100 text-green-800">{inspeccion.estado || "Completada"}</Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-600">Sin registrar</Badge>
            )}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-3">
          <p className="text-xs text-gray-500">Da\u00f1os preexistentes</p>
          <p className="text-lg font-bold text-gray-900">{inspeccion?.da\u00f1os?.length || 0}</p>
        </div>
      </div>

      {/* Formulario de recepci\u00f3n */}
      <div className="bg-white border rounded-xl p-5 space-y-5">
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-[#E31E24]" />
          <h3 className="font-semibold text-gray-900">
            {yaRecibido ? "Conformidad de recepci\u00f3n registrada" : "Registrar conformidad de recepci\u00f3n"}
          </h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={recibido}
              disabled={yaRecibido}
              onChange={(e) => setRecibido(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-[#E31E24] disabled:opacity-50"
            />
            <div>
              <p className="font-medium text-gray-900">Recibi\u00f3 el veh\u00edculo</p>
              <p className="text-sm text-gray-500">El cliente confirma haber recibido la unidad y las llaves.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={probado}
              disabled={yaRecibido}
              onChange={(e) => setProbado(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-[#E31E24] disabled:opacity-50"
            />
            <div>
              <p className="font-medium text-gray-900">Lo prob\u00f3 y est\u00e1 satisfecho</p>
              <p className="text-sm text-gray-500">El cliente prob\u00f3/manej\u00f3 el veh\u00edculo y est\u00e1 conforme hasta este momento.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={conforme}
              disabled={yaRecibido}
              onChange={(e) => setConforme(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-[#E31E24] disabled:opacity-50"
            />
            <div>
              <p className="font-medium text-gray-900">Conforme con el estado al recibirlo</p>
              <p className="text-sm text-gray-500">El cliente est\u00e1 de acuerdo con el estado en que recibe la unidad.</p>
            </div>
          </label>
        </div>

        <div>
          <Label className="mb-1.5 block">Nombre de quien retira el veh\u00edculo *</Label>
          <Input
            value={nombre}
            disabled={yaRecibido}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre completo del cliente o representante"
            className="h-11 border-gray-300 focus:border-[#E31E24]"
          />
        </div>

        <div>
          <Label className="mb-1.5 block">Firma del cliente *</Label>
          {yaRecibido && rec.firma_data_url ? (
            <div className="border-2 border-gray-200 rounded-xl bg-white p-2">
              <img src={rec.firma_data_url} alt="Firma del cliente" className="w-full h-40 object-contain" />
            </div>
          ) : (
            <SignaturePad value={firma} onChange={setFirma} disabled={yaRecibido} />
          )}
        </div>

        {!yaRecibido && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gap-2 bg-gradient-to-r from-[#E31E24] to-[#B71C1C] hover:from-[#B71C1C] hover:to-[#E31E24] text-white"
            >
              <ShieldCheck className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar conformidad de recepci\u00f3n"}
            </Button>
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" /> Previsualizar PDF
            </Button>
          </div>
        )}
      </div>

      {yaRecibido && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5 justify-center">
          <Lock className="w-3 h-3" /> La conformidad est\u00e1 bloqueada. Para corregir, contacte al administrador.
        </p>
      )}
    </div>
  );
}