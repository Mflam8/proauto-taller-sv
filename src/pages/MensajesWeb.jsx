import React, { useCallback, useEffect, useState } from "react";
import { Bell, Inbox, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import MessageWebRow from "@/components/mensajes/MessageWebRow";

export default function MensajesWeb() {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);

  const loadMessages = useCallback(async (nextCursor = null, append = false) => {
    setError("");
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const response = await base44.functions.invoke("gestionarMensajesWeb", {
        action: "list",
        cursor: nextCursor,
      });
      const data = response.data;
      setMessages(current => append ? [...current, ...(data.items || [])] : (data.items || []));
      setUnreadCount(data.unread_count || 0);
      setCursor(data.next_cursor || null);
      setHasMore(Boolean(data.has_more));
    } catch (err) {
      setError(err.response?.data?.error || "No se pudieron cargar los mensajes. Intenta de nuevo.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const markRead = async (id) => {
    setMarkingId(id);
    setError("");
    try {
      await base44.functions.invoke("gestionarMensajesWeb", { action: "mark_read", id });
      setMessages(current => current.map(message => message.id === id ? { ...message, leido: true } : message));
      setUnreadCount(current => Math.max(0, current - 1));
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo marcar el mensaje como leído. Intenta de nuevo.");
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B71C1C]">Atención al cliente</p>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Mensajes web</h1>
          <p className="mt-1 text-sm text-gray-600">Consultas recibidas desde el formulario público de PROAUTO.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-[#7F171B]" aria-live="polite">
          <Bell className="h-5 w-5" aria-hidden="true" />
          <div><p className="text-xs font-medium">Sin leer</p><p className="text-xl font-bold tabular-nums">{unreadCount}</p></div>
        </div>
      </header>

      <section aria-label="Bandeja de mensajes" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
          <Inbox className="h-5 w-5 text-[#E31E24]" aria-hidden="true" />
          <h2 className="font-semibold text-gray-900">Más recientes primero</h2>
        </div>
        {error && <p role="alert" className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="space-y-2 p-3 sm:p-4">
          {loading ? <p className="py-10 text-center text-sm text-gray-600">Cargando mensajes…</p> : messages.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquareText className="mx-auto mb-3 h-10 w-10 text-gray-400" aria-hidden="true" />
              <p className="font-semibold text-gray-900">No hay mensajes todavía</p>
              <p className="mt-1 text-sm text-gray-600">Los mensajes enviados desde Contacto aparecerán aquí.</p>
            </div>
          ) : messages.map(message => (
            <MessageWebRow key={message.id} message={message} onMarkRead={markRead} marking={markingId === message.id} />
          ))}
        </div>
        {hasMore && !loading && (
          <div className="border-t border-gray-100 px-4 py-4 text-center">
            <Button variant="outline" disabled={loadingMore} onClick={() => loadMessages(cursor, true)}>
              {loadingMore ? "Cargando…" : "Ver mensajes anteriores"}
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-4 text-sm text-gray-600">
          <MessageSquareText className="h-4 w-4 text-gray-500" aria-hidden="true" />
          <span>Esta bandeja solo está disponible para gerencia y administración.</span>
        </div>
      </section>
    </main>
  );
}