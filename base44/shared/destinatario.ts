// Valida un destinatario antes de escribirlo en una cabecera RFC 2822.
// Rechaza CR/LF y comas (inyección de cabeceras / destinatarios ocultos).
const CORREO_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function normalizarCorreo(valor: unknown): string | null {
  const texto = String(valor ?? "").trim();
  if (!texto || texto.length > 254) return null;
  if (/[\r\n\u0000]/.test(texto)) return null;
  if (!CORREO_RE.test(texto)) return null;
  return texto;
}