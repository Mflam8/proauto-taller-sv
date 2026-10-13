// Control de accesos por rol del usuario de la app.
// Roles disponibles: "admin" (solo Yanira y los dueños), "jefe_taller", "tecnico", "user" (sin acceso especial).
// El rol de cada empleado se define en su ficha (campo "rol_sistema") y se aplica al iniciar sesión.

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

export const esAdmin = (user) => user?.role === "admin";
export const esJefeTaller = (user) => user?.role === "jefe_taller";
export const esTecnico = (user) => user?.role === "tecnico";

// Cobrar pagos e imprimir/enviar recibos: solo administración.
export const puedeCobrar = (user) => esAdmin(user);
export const puedeImprimirFactura = (user) => esAdmin(user);

// Definir costos, facturar y revisar precios de trabajos: jefe de taller o administración.
export const puedeDefinirCostos = (user) => esAdmin(user) || esJefeTaller(user);

// Mapeo del campo rol_sistema de la ficha de empleado al rol de la app.
// Nunca asigna "admin": ese nivel se otorga solo desde la administración de la app.
export const ROL_SISTEMA_A_ROL = {
  "Técnico": "tecnico",
  "Auxiliar de Pintura": "tecnico",
  "Jefe de Taller": "jefe_taller",
  "Sin acceso": "user",
};