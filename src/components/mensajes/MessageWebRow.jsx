import React from "react";
import { Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const whatsappUrl = (message) => {
  let digits = String(message.telefono || "").replace(/\D/g, "");
  if (digits.length === 8) digits = `503${digits}`;
  else if (digits.length === 9 && digits.startsWith("0")) digits = `503${digits.slice(1)}`;
  if (!digits) return "";
  const text = `Hola ${message.nombre}, te respondemos desde PROAUTO Taller SV sobre tu consulta.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

export default function MessageWebRow({ message, onMarkRead, marking = false }) {
  const fecha = new Date(message.created_date).toLocaleString("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const replyUrl = whatsappUrl(message);

  return (
    <article data-state={message.leido ? "read" : "unread"} className={`rounded-xl border p-4 transition-colors ${message.leido ? "border-gray-200 bg-white" : "border-red-100 bg-red-50"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#8E1B20]">WEB</span>
            <h3 className="break-words font-semibold text-gray-900">{message.nombre}</h3>
            {!message.leido && <span className="h-2 w-2 rounded-full bg-[#E31E24]" aria-label="No leído" />}
            {message.leido && <span className="text-xs font-medium text-gray-600">Leído</span>}
          </div>
          <p className="mb-1 break-all text-sm text-gray-700">{message.telefono}</p>
          <p className="line-clamp-2 break-words text-sm leading-6 text-gray-800">{message.mensaje}</p>
          <p className="mt-2 text-xs text-gray-600">{fecha} · Formulario de contacto</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {!message.leido && <Button type="button" variant="outline" className="min-h-11 gap-2" disabled={marking} onClick={() => onMarkRead(message.id)}>
            <Check className="h-4 w-4" aria-hidden="true" />{marking ? "Guardando…" : "Marcar leído"}
          </Button>}
          {replyUrl ? <a href={replyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#128C4A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0D713B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128C4A] focus-visible:ring-offset-2">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />Responder por WhatsApp
          </a> : <Button type="button" className="min-h-11 gap-2 bg-[#128C4A] text-white" disabled>
            <MessageCircle className="h-4 w-4" aria-hidden="true" />Teléfono no válido
          </Button>}
        </div>
      </div>
    </article>
  );
}