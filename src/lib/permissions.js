// Control de accesos por rol del usuario de la app.
// El perfil se define en la ficha del empleado (campo "perfil_acceso") y se aplica al iniciar sesión.
// El nivel "admin" (administrador) nunca se asigna desde la ficha: se gestiona aparte.

const CORREOS_RESTRINGIDOS = [];

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

// Perfiles de acceso que se pueden asignar a un empleado (nunca administrador).
export const PERFILES_ACCESO = [
  { value: "sin_acceso", label: "Sin acceso a la app", description: "Ficha registrada, pero no puede usar la app." },
  { value: "tecnico", label: "Técnico", description: "Ve sus trabajos asignados, realiza inspecciones y marca su asistencia en el taller." },
  { value: "pintura", label: "Técnico de Pintura", description: "Igual que técnico, enfocado en trabajos de pintura." },
  { value: "jefe_taller", label: "Jefe de Taller", description: "Asigna trabajos, define costos y factura. No puede imprimir recibos ni cobrar." },
  { value: "recepcion_cobros", label: "Recepción y Cobros", description: "Registra clientes, vehículos y cobros. Sin reportes descargables." },
];

const PERFIL_A_ROL = {
  gerencia: "admin",
  jefe_taller: "jefe_taller",
  tecnico: "tecnico",
  pintura: "tecnico",
  recepcion_cobros: "recepcion_cobros",
  sin_acceso: "user",
};

// Rol efectivo: el perfil de la ficha manda; sin perfil se usa el rol de la app.
export const rolEfectivo = (user) => {
  if (user?.perfil_acceso && PERFIL_A_ROL[user.perfil_acceso]) return PERFIL_A_ROL[user.perfil_acceso];
  if (user?.role === "admin" || esDueno(user)) return "admin";
  return user?.role || "user";
};

export const esAdmin = (user) => rolEfectivo(user) === "admin";
export const esJefeTaller = (user) => rolEfectivo(user) === "jefe_taller";
export const esTecnico = (user) => rolEfectivo(user) === "tecnico";

// Cobrar pagos e imprimir recibos: administración y recepción de cobros.
export const puedeCobrar = (user) => esAdmin(user) || user?.perfil_acceso === "recepcion_cobros";
export const puedeImprimirFactura = (user) => esAdmin(user) || user?.perfil_acceso === "recepcion_cobros";

// Definir costos, facturar y revisar precios de trabajos: jefe de taller o administración.
export const puedeDefinirCostos = (user) => esAdmin(user) || esJefeTaller(user);

// Páginas visibles por rol (administración ve todo).
const PAGINAS_POR_ROL = {
  jefe_taller: [
    "MiTaller", "MisTrabajos", "Clientes", "Vehiculos", "Cotizaciones",
    "OrdenesTrabajos", "Inspecciones", "Inventario", "Proveedores",
    "Facturacion", "Expedientes", "ExpedienteVista",
  ],
  tecnico: ["MiTaller", "MisTrabajos", "Expedientes", "ExpedienteVista", "Inspecciones"],
  recepcion_cobros: [
    "MiTaller", "Clientes", "Vehiculos", "Cotizaciones",
    "OrdenesTrabajos", "Inspecciones", "Facturacion", "Expedientes", "ExpedienteVista",
    "Reportes", "InformeRemesas",
  ],
  user: ["MiTaller"],
};

export const puedeVerPagina = (user, pageName) => {
  if (esAdmin(user)) return true;
  const paginas = PAGINAS_POR_ROL[rolEfectivo(user)] || PAGINAS_POR_ROL.user;
  return paginas.includes(pageName);
};

export const paginaInicio = (user) => (esAdmin(user) ? "/Dashboard" : "/MiTaller");

export const nombrePerfil = (user) => {
  const porPerfil = {
    gerencia: "Gerencia",
    jefe_taller: "Jefe de Taller",
    tecnico: "Técnico",
    pintura: "Técnico de Pintura",
    recepcion_cobros: "Recepción y Cobros",
  };
  if (porPerfil[user?.perfil_acceso]) return porPerfil[user.perfil_acceso];
  if (esAdmin(user)) return "Administración";
  if (esJefeTaller(user)) return "Jefe de Taller";
  if (esTecnico(user)) return "Técnico";
  return "Invitado";
};