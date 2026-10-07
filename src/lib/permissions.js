// Permisos temporales mientras se define el rol de supervisor.
// Cuentas con acceso admin pero SIN descarga de PDFs ni reportes anuales.
const CORREOS_RESTRINGIDOS = ["yaniraproautotaller@gmail.com"];

const estaRestringido = (user) =>
  !!user?.email && CORREOS_RESTRINGIDOS.includes(user.email.toLowerCase());

export const puedeDescargarPDFs = (user) => !estaRestringido(user);
export const puedeVerReportesAnuales = (user) => !estaRestringido(user);

// Cuentas con acceso total (control interno de facturas incluido).
const CORREOS_ACCESO_TOTAL = [
  "proautotallersv@gmail.com",
  "mayaflamenco89@gmail.com",
];

export const esDueno = (user) =>
  !!user?.email && CORREOS_ACCESO_TOTAL.includes(user.email.toLowerCase());