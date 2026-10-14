// Control de accesos por perfil del empleado.
// SUPER ADMIN (gerencia): los correos propietarios, control total del sistema.
// ADMIN: gestión del taller; capacidades ajustables una a una (solo SUPER ADMIN las cambia).
// TÉCNICO DE MECÁNICA y TÉCNICO DE PINTURA: acceso operativo a sus trabajos.

const CORREOS_RESTRINGIDOS = [];

const estaRestringido = (user) =>
  !!user?.email && CORREOS_RESTRINGIDOS.includes(user.email.toLowerCase());

export const puedeDescargarPDFs = (user) => !estaRestringido(user);
export const puedeVerReportesAnuales = (user) => !estaRestringido(user);

// SUPER ADMIN: cuentas con acceso total (control interno de facturas incluido).
const CORREOS_ACCESO_TOTAL = [
  "proautotallersv@gmail.com",
  "mayaflamenco89@gmail.com",
];

export const esDueno = (user) =>
  !!user?.email && CORREOS_ACCESO_TOTAL.includes(user.email.toLowerCase());

// Perfiles que se asignan en la ficha del empleado (nunca SUPER ADMIN: se reconoce por correo).
export const PERFILES_ACCESO = [
  { value: "sin_acceso", label: "Sin acceso a la app", description: "Ficha registrada, pero no puede usar la app." },
  { value: "admin", label: "Admin", description: "Gestión del taller: empleados, asistencia, clientes, vehículos, asignaciones, facturación, cobros y reportes. Cada capacidad se ajusta por persona." },
  { value: "tecnico", label: "Técnico de Mecánica", description: "Vehículos y trabajos asignados, revisiones, fotos, avances y horas. Sin precios, facturas ni reportes." },
  { value: "pintura", label: "Técnico de Pintura", description: "Los mismos permisos operativos, orientados a trabajos de pintura." },
];

// Valores anteriores que ahora equivalen a Admin (se aceptan por compatibilidad).
const PERFIL_NORMALIZADO = { jefe_taller: "admin", recepcion_cobros: "admin", gerencia: "admin" };
const perfilNormalizado = (p) => PERFIL_NORMALIZADO[p] || p;

const PERFIL_A_ROL = {
  admin: "admin",
  tecnico: "tecnico",
  pintura: "tecnico",
  sin_acceso: "user",
};

// Rol efectivo: el perfil de la ficha manda; sin perfil se usa el rol de la app.
export const rolEfectivo = (user) => {
  const p = perfilNormalizado(user?.perfil_acceso);
  if (p && PERFIL_A_ROL[p]) return PERFIL_A_ROL[p];
  if (user?.role === "admin" || user?.role === "jefe_taller" || esDueno(user)) return "admin";
  return user?.role || "user";
};

export const esAdmin = (user) => rolEfectivo(user) === "admin";
export const esJefeTaller = (user) => rolEfectivo(user) === "admin"; // compatibilidad con el modelo anterior
export const esTecnico = (user) => rolEfectivo(user) === "tecnico";

// Capacidades individuales (interruptores por persona, agrupados por área).
export const CAPACIDADES = [
  { grupo: "Empleados", key: "gestionar_empleados", label: "Crear y actualizar empleados" },
  { grupo: "Asistencia", key: "gestionar_asistencia", label: "Registrar o corregir asistencia del personal" },
  { grupo: "Trabajos", key: "gestionar_clientes", label: "Crear y actualizar clientes y vehículos" },
  { grupo: "Trabajos", key: "asignar_trabajos", label: "Asignar vehículos y trabajos" },
  { grupo: "Trabajos", key: "aprobar_trabajos", label: "Revisar avances y aprobar trabajos terminados" },
  { grupo: "Trabajos", key: "definir_precios", label: "Definir costos y modificar precios" },
  { grupo: "Facturación y cobros", key: "crear_facturas", label: "Crear facturas" },
  { grupo: "Facturación y cobros", key: "editar_facturas", label: "Editar facturas antes de cobrarse" },
  { grupo: "Facturación y cobros", key: "registrar_cobros", label: "Registrar cobros de clientes" },
  { grupo: "Facturación y cobros", key: "imprimir_facturas", label: "Imprimir facturas en la térmica" },
  { grupo: "Reportes", key: "ver_reportes", label: "Consultar reportes" },
];

// Capacidades iniciales según el perfil (los interruptores individuales las ajustan después).
export const capacidadesPerfil = (perfil) => {
  if (perfilNormalizado(perfil) !== "admin") return {};
  return Object.fromEntries(CAPACIDADES.map((c) => [c.key, true]));
};

// Capacidad efectiva: el interruptor individual manda; si no se ha tocado, el perfil la habilita.
export const puede = (user, capacidad) => {
  if (esDueno(user)) return true;
  if (rolEfectivo(user) !== "admin") return false;
  const caps = user?.capacidades;
  if (caps && typeof caps === "object" && Object.hasOwn(caps, capacidad)) return caps[capacidad] === true;
  return true;
};

export const puedeCobrar = (user) => puede(user, "registrar_cobros");
export const puedeImprimirFactura = (user) => puede(user, "imprimir_facturas");
export const puedeDefinirCostos = (user) => puede(user, "definir_precios");

// Páginas visibles por rol (admin ve la gestión completa; reportes según capacidad).
const PAGINAS_POR_ROL = {
  admin: [
    "MiTaller", "MisTrabajos", "Clientes", "Vehiculos", "Cotizaciones",
    "OrdenesTrabajos", "Inspecciones", "Inventario", "Proveedores",
    "Facturacion", "Expedientes", "ExpedienteVista",
  ],
  tecnico: ["MiTaller", "MisTrabajos", "Expedientes", "ExpedienteVista", "Inspecciones"],
  user: ["MiTaller"],
};

export const puedeVerPagina = (user, pageName) => {
  if (esAdmin(user)) {
    if ((pageName === "Reportes" || pageName === "InformeRemesas") && !puede(user, "ver_reportes")) return false;
    return true;
  }
  const paginas = PAGINAS_POR_ROL[rolEfectivo(user)] || PAGINAS_POR_ROL.user;
  return paginas.includes(pageName);
};

export const paginaInicio = (user) => (esAdmin(user) ? "/Dashboard" : "/MiTaller");

export const nombrePerfil = (user) => {
  if (user?.perfil_acceso === "gerencia") return "Gerencia";
  const porPerfil = {
    admin: "Admin",
    tecnico: "Técnico de Mecánica",
    pintura: "Técnico de Pintura",
    jefe_taller: "Admin",
    recepcion_cobros: "Admin",
  };
  const p = porPerfil[user?.perfil_acceso];
  if (p) return p;
  if (esDueno(user)) return "Super Admin";
  if (esAdmin(user)) return "Administración";
  if (esTecnico(user)) return "Técnico";
  return "Invitado";
};