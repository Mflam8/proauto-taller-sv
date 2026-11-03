// Modo de prueba del flujo operativo: datos y reglas aislados del taller real.
// Solo Super Admin lo activa; el servidor valida el perfil de cada acción.
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export const PERFILES_PRUEBA = [
  {
    value: "facturacion",
    label: "Yanira / Mauricio",
    area: "Facturación",
    defecto: "Yanira",
    descripcion: "Ingresa el expediente, habilita pintura y prepara o emite la factura.",
  },
  {
    value: "tecnico_mecanica",
    label: "Técnico de Mecánica",
    area: "Inspección y diagnóstico",
    defecto: "Técnico de mecánica",
    descripcion: "Completa la inspección inicial y el diagnóstico de mecánica.",
  },
  {
    value: "tecnico_pintura",
    label: "Técnico de Pintura",
    area: "Revisión de pintura",
    defecto: "Técnico de pintura",
    descripcion: "Solo ve los expedientes con pintura habilitada en el Tablero.",
  },
];

export const perfilPrueba = (value) =>
  PERFILES_PRUEBA.find((p) => p.value === value) || PERFILES_PRUEBA[0];

const CLAVE_ACTIVO = "proauto_modo_prueba_activo";
const CLAVE_PERFIL = "proauto_modo_prueba_perfil";
const CLAVE_ACTOR = "proauto_modo_prueba_actor";

const leer = (clave) => {
  try { return window.localStorage.getItem(clave); } catch { return null; }
};
const guardar = (clave, valor) => {
  try {
    if (valor) window.localStorage.setItem(clave, valor);
    else window.localStorage.removeItem(clave);
  } catch {}
};

export const leerModoActivo = () => leer(CLAVE_ACTIVO) === "1";
export const guardarModoActivo = (activo) => guardar(CLAVE_ACTIVO, activo ? "1" : null);

export const leerPerfilPrueba = () => perfilPrueba(leer(CLAVE_PERFIL)).value;
export const guardarPerfilPrueba = (valor) => guardar(CLAVE_PERFIL, valor);

export const leerActorPrueba = (perfil) => leer(CLAVE_ACTOR) || perfilPrueba(perfil).defecto;
export const guardarActorPrueba = (valor) => guardar(CLAVE_ACTOR, valor);

export const fechaCorta = (valor) => {
  try { return format(parseISO(valor), "d MMM yyyy · HH:mm", { locale: es }); } catch { return ""; }
};

// Un expediente puede facturarse solo cuando cada especialidad habilitada tiene
// inspección y diagnóstico registrados.
export const faltantes = (expediente) => {
  if (!expediente) return ["Selecciona un expediente de prueba"];
  const pendientes = [];
  if (!expediente.inspeccion_mecanica) pendientes.push("Inspección de mecánica");
  if (!expediente.diagnostico_mecanica) pendientes.push("Diagnóstico de mecánica");
  if (expediente.pintura_habilitada && !expediente.inspeccion_pintura) pendientes.push("Revisión de pintura");
  if (expediente.pintura_habilitada && !expediente.diagnostico_pintura) pendientes.push("Diagnóstico de pintura");
  return pendientes;
};

export const listoParaFacturar = (expediente) => faltantes(expediente).length === 0;

const CLASES_ESTADO = {
  Recibido: "bg-slate-100 text-slate-700 border-slate-200",
  "En Diagnóstico": "bg-amber-100 text-amber-800 border-amber-200",
  "Listo para Facturar": "bg-purple-100 text-purple-800 border-purple-200",
  Facturado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Cerrado: "bg-gray-100 text-gray-600 border-gray-200",
  Cancelado: "bg-red-100 text-red-700 border-red-200",
};

export const claseEstado = (estado) => CLASES_ESTADO[estado] || CLASES_ESTADO.Recibido;

export const hitosExpediente = (expediente) => {
  const hitos = [
    { label: "Inspección", hecho: !!expediente.inspeccion_mecanica },
    { label: "Pintura", hecho: !!expediente.pintura_habilitada },
    { label: "Diagnóstico", hecho: !!expediente.diagnostico_mecanica },
  ];
  if (expediente.pintura_habilitada) {
    hitos.push(
      { label: "Insp. pintura", hecho: !!expediente.inspeccion_pintura },
      { label: "Diag. pintura", hecho: !!expediente.diagnostico_pintura }
    );
  }
  hitos.push({ label: "Factura", hecho: !!expediente.factura_emitida });
  return hitos;
};

export const ETIQUETAS_ACCION = {
  expediente_creado: "Expediente de prueba creado",
  pintura_habilitada: "Pintura habilitada en el Tablero",
  pintura_deshabilitada: "Pintura deshabilitada",
  inspeccion_mecanica: "Inspección de mecánica",
  inspeccion_pintura: "Inspección de pintura",
  diagnostico_mecanica: "Diagnóstico de mecánica",
  diagnostico_pintura: "Diagnóstico de pintura",
  factura_preparada: "Factura preparada",
  factura_emitida: "Factura emitida",
  expediente_cerrado: "Expediente cerrado",
};