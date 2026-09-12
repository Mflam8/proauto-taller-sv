// Permisos temporales mientras se define el rol de supervisor.
// Cuentas con acceso admin pero SIN descarga de PDFs ni reportes anuales.
const CORREOS_RESTRINGIDOS = ["yaniraproautotaller@gmail.com"];

const estaRestringido = (user) =>
  !!user?.email && CORREOS_RESTRINGIDOS.includes(user.email.toLowerCase());

export const puedeDescargarPDFs = (user) => !estaRestringido(user);
export const puedeVerReportesAnuales = (user) => !estaRestringido(user);