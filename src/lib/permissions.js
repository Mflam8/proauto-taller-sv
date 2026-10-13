export const PERFILES_ACCESO = [
 { value: "sin_acceso", label: "Sin acceso", description: "Conserva la ficha sin permitir el ingreso al sistema." },
 { value: "tecnico", label: "Técnico mecánico", description: "Trabajos asignados, revisiones, fotos, avances e historial sin importes." },
 { value: "pintura", label: "Pintura", description: "El mismo acceso operativo para pintores y auxiliares de pintura." },
 { value: "jefe_taller", label: "Jefe de taller", description: "Clientes, vehículos, asignaciones, costos, precios y facturas. Sin cobros ni impresión." },
 { value: "recepcion_cobros", label: "Recepción y cobros", description: "Clientes, vehículos, asignaciones, cobros e impresión. Sin cambiar precios ni gestionar permisos." },
];
export const perfil = u => u?.perfil_acceso || "sin_acceso";
export const esDueno = u => perfil(u) === "gerencia";
export const esTecnico = u => ["tecnico","pintura"].includes(perfil(u));
export const puedeCobrar = u => ["gerencia","recepcion_cobros"].includes(perfil(u));
export const puedeImprimirFactura = puedeCobrar;
export const puedeDefinirCostos = u => ["gerencia","jefe_taller"].includes(perfil(u));
export const puedeAsignar = u => ["gerencia","jefe_taller","recepcion_cobros"].includes(perfil(u));
export const puedeDescargarPDFs = esDueno;
export const puedeVerReportesAnuales = esDueno;
export const nombrePerfil = u => perfil(u) === "gerencia" ? "Gerencia" : PERFILES_ACCESO.find(p=>p.value===perfil(u))?.label || "Sin acceso";
export const paginaInicio = u => esTecnico(u) ? "/MisTrabajos" : esDueno(u) ? "/OperacionDiaria" : "/Expedientes";
export function puedeVerPagina(u, page) {
 if (["SitioWeb","Acerca","Contacto","LinkTree","OAuthConsent"].includes(page)) return true;
 if (esDueno(u)) return true;
 if (esTecnico(u)) return page === "MisTrabajos";
 if (puedeAsignar(u)) return ["Clientes","Vehiculos","Expedientes","ExpedienteVista","OrdenesTrabajos","Facturacion", ...(puedeDefinirCostos(u)?["Cotizaciones"]:[])].includes(page);
 return false;
}
