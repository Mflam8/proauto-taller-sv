import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, FileSignature, Download, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import SignaturePad from "./SignaturePad";
import generarAutorizacionPDF from "./AutorizacionPDF";

export default function AutorizacionTab({ expediente, cliente, vehiculo, inspeccion }) {
  const qc = useQueryClient();
  const auth = expediente.autorizacion_cliente || {};
  const yaAutorizado = !!auth.fecha_autorizacion;

  const [presupuesto, setPresupuesto] = useState(!!auth.presupuesto_aprobado);
  const [estadoVeh, setEstadoVeh] = useState(!!auth.estado_vehiculo_aprobado);
  const [nombre, setNombre] = useState(auth.nombre_firma || cliente?.nombre_completo || "");
  const [firma, setFirma] = useState(auth.firma_data_url || "");
  const [saving, setSaving] = useState(false);

  const { data: trabajos = [] } = useQuery({
    queryKey: ["trabajos", expediente.id],
    queryFn: () => base44.entities.TrabajoExpediente.filter({ expediente_id: expediente.id }),
  });

  const totalPresupuesto = trabajos.reduce(
    (sum, t) => sum + (t.subtotal || (t.cantidad || 1) * (t.precio_unitario || 0)),
    0
  );

  const handleSave = async () => {
    if (!presupuesto || !estadoVeh) {
      alert("Debe marcar la aprobaci\u00f3n del presupuesto y la conformidad con el estado del veh\u00edculo.");
      return;
    }
    if (!nombre.trim()) {
      alert("Ingrese el nombre de quien autoriza.");
      return;
    }
    if (!firma) {
      alert("Capture la firma del cliente en el recuadro.");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Expediente.update(expediente.id, {
        autorizacion_cliente: {
          presupuesto_aprobado: presupuesto,
          estado_vehiculo_aprobado: estadoVeh,
          fecha_autorizacion: new Date().toISOString(),
          nombre_firma: nombre.trim(),
          firma_data_url: firma,
          metodo: "Digital",
        },
      });
      qc.invalidateQueries(["expediente", expediente.id]);
    } catch (e) {
      alert("Error al guardar la autorizaci\u00f3n.");
    }
    setSaving(false);
  };

  const handleDownload = () => {
    generarAutorizacionPDF({
      expediente,
      cliente,
      vehiculo,
      inspeccion,
      trabajos,
      autorizacion: auth,
    });
  };

  return (
    <div className="space-y-5">
      {/* Banner de estado */}
      {yaAutorizado ? (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-green-900">Autorizaci\u00f3n registrada</p>
            <p className="text-sm text-green-800">
              Firmada por <strong>{auth.nombre_firma}</strong> el{" "}
              {new Date(auth.fecha_autorizacion).toLocaleString("es-SV")}. M\u00e9todo: {auth.metodo}.
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
            <p className="font-semibold text-amber-900">Pendiente de autorizaci\u00f3n</p>
            <p className="text-sm text-amber-800">
              Seg\u00fan recomendaci\u00f3n legal, el cliente debe aprobar el presupuesto y firmar conforme con el
              estado del veh\u00edculo para evitar reclamos o demandas posteriores.
            </p>
          </div>
        </div>
      )}

      {/* Resumen r\u00e1pido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border rounded-xl p-3">
          <p className="text-xs text-gray-500">Trabajos del presupuesto</p>
          <p className="text-lg font-bold text-gray-900">{trabajos.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-3">
          <p className="text-xs text-gray-500">Total presupuestado</p>
          <p className="text-lg font-bold text-[#E31E24]">${totalPresupuesto.toFixed(2)}</p>
        </div>
        <div className="bg-white border rounded-xl p-3">
          <p className="text-xs text-gray-500">Inspecci\u00f3n</p>
          <p className="text-lg font-bold text-gray-900">
            {inspeccion ? (
              <Badge className="bg-green-100 text-green-800">{inspeccion.estado || "Completada"}</Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-600">Sin registrar</Badge>
            )}
          </p>
        </div>
      </div>

      {/* Formulario de aprobaci\u00f3n */}
      <div className="bg-white border rounded-xl p-5 space-y-5">
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-[#E31E24]" />
          <h3 className="font-semibold text-gray-900">
            {yaAutorizado ? "Autorizaci\u00f3n registrada" : "Registrar autorizaci\u00f3n del cliente"}
          </h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={presupuesto}
              disabled={yaAutorizado}
              onChange={(e) => setPresupuesto(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-[#E31E24] disabled:opacity-50"
            />
            <div>
              <p className="font-medium text-gray-900">Aprobaci\u00f3n del presupuesto</p>
              <p className="text-sm text-gray-500">
                El cliente revis\u00f3 y aprueba el presupuesto de trabajos (${totalPresupuesto.toFixed(2)}).
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={estadoVeh}
              disabled={yaAutorizado}
              onChange={(e) => setEstadoVeh(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-[#E31E24] disabled:opacity-50"
            />
            <div>
              <p className="font-medium text-gray-900">Conformidad con el estado del veh\u00edculo</p>
              <p className="text-sm text-gray-500">
                El cliente est\u00e1 conforme con el estado del veh\u00edculo seg\u00fan la inspecci\u00f3n
                {inspeccion ? ` (${inspeccion.daños?.length || 0} da\u00f1os registrados)` : " (a\u00fan sin inspecci\u00f3n)"}.
              </p>
            </div>
          </label>
        </div>

        <div>
          <Label className="mb-1.5 block">Nombre de quien autoriza *</Label>
          <Input
            value={nombre}
            disabled={yaAutorizado}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre completo del cliente o representante"
            className="h-11 border-gray-300 focus:border-[#E31E24]"
          />
        </div>

        <div>
          <Label className="mb-1.5 block">Firma del cliente *</Label>
          {yaAutorizado && auth.firma_data_url ? (
            <div className="border-2 border-gray-200 rounded-xl bg-white p-2">
              <img src={auth.firma_data_url} alt="Firma del cliente" className="w-full h-40 object-contain" />
            </div>
          ) : (
            <SignaturePad value={firma} onChange={setFirma} disabled={yaAutorizado} />
          )}
        </div>

        {!yaAutorizado && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gap-2 bg-gradient-to-r from-[#E31E24] to-[#B71C1C] hover:from-[#B71C1C] hover:to-[#E31E24] text-white"
            >
              <ShieldCheck className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar autorizaci\u00f3n"}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={trabajos.length === 0}
              className="gap-2"
              title={trabajos.length === 0 ? "Agregue trabajos antes de generar el PDF" : ""}
            >
              <Download className="w-4 h-4" /> Previsualizar PDF
            </Button>
          </div>
        )}
      </div>

      {yaAutorizado && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5 justify-center">
          <Lock className="w-3 h-3" /> La autorizaci\u00f3n est\u00e1 bloqueada. Para corregir, contacte al administrador.
        </p>
      )}
    </div>
  );
}