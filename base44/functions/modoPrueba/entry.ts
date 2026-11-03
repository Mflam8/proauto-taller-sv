import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// MODO DE PRUEBA: entorno aislado para ensayar el flujo móvil.
// Solo Super Admin lo usa y cada regla se valida aquí, nunca con lo que manda el navegador.
// No escribe sobre clientes, vehículos, expedientes, facturas ni cobros reales.
const SUPER_ADMIN = ["proautotallersv@gmail.com", "mayaflamenco89@gmail.com"];
const PERFILES = ["facturacion", "tecnico_mecanica", "tecnico_pintura"];
const CERRADOS = ["Facturado", "Cerrado", "Cancelado"];
const IVA = 0.13;

const fail = (mensaje: string, status = 400) => {
  throw Object.assign(new Error(mensaje), { status });
};
const texto = (valor: unknown, max = 400) => String(valor ?? "").trim().slice(0, max);
const num = (valor: unknown) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};
const redondear = (n: number) => Math.round(n * 100) / 100;

async function todos(entidad: any) {
  const filas: any[] = [];
  for (let salto = 0; salto < 20000; salto += 200) {
    const lote = await entidad.list("-created_date", 200, salto);
    filas.push(...lote);
    if (lote.length < 200) break;
  }
  return filas;
}

function actorDe(body: any) {
  const perfil = String(body?.perfil || "");
  if (!PERFILES.includes(perfil)) fail("Selecciona un perfil de prueba válido.");
  const nombre = texto(body?.actor_nombre, 120);
  if (!nombre) fail("Indica quién realiza la acción en la prueba.");
  return { perfil, nombre };
}

function especialidadDe(valor: unknown) {
  const esp = String(valor || "");
  if (!["mecanica", "pintura"].includes(esp)) fail("Especialidad inválida.");
  return esp;
}

const perfilDeEspecialidad = (esp: string) =>
  esp === "pintura" ? "tecnico_pintura" : "tecnico_mecanica";
const nombreEspecialidad = (esp: string) => (esp === "pintura" ? "pintura" : "mecánica");

function completos(exp: any) {
  if (!exp?.inspeccion_mecanica || !exp?.diagnostico_mecanica) return false;
  if (exp?.pintura_habilitada && (!exp?.inspeccion_pintura || !exp?.diagnostico_pintura)) return false;
  return true;
}

function estadoDerivado(exp: any) {
  if (["Cancelado", "Cerrado"].includes(exp?.estado_interno)) return exp.estado_interno;
  if (exp?.factura_emitida) return "Facturado";
  if (completos(exp)) return "Listo para Facturar";
  if (exp?.inspeccion_mecanica || exp?.inspeccion_pintura) return "En Diagnóstico";
  return "Recibido";
}

async function obtenerExpediente(db: any, id: unknown) {
  const limpio = texto(id, 60);
  if (!limpio) fail("Selecciona un expediente de prueba.");
  const exp = await db.PruebaExpediente.get(limpio).catch((e: any) =>
    e?.status === 404 ? null : Promise.reject(e)
  );
  if (!exp) fail("El expediente de prueba no existe.", 404);
  return exp;
}

async function registrarEvento(db: any, expedienteId: string, accion: string, actor: any, detalle = "") {
  await db.PruebaEvento.create({
    expediente_prueba_id: expedienteId,
    accion,
    actor_nombre: actor.nombre,
    actor_perfil: actor.perfil,
    detalle: String(detalle || "").slice(0, 300),
    fecha: new Date().toISOString(),
  });
}

// Visibilidad por especialidad: se aplica en el servidor, no en el navegador.
async function listar(db: any, body: any) {
  const perfil = PERFILES.includes(String(body?.perfil)) ? String(body.perfil) : "facturacion";
  const expedientes = await todos(db.PruebaExpediente);
  const facturas = await todos(db.PruebaFactura);
  const eventos = await todos(db.PruebaEvento);

  const visibles = expedientes.filter((e: any) => {
    if (perfil === "tecnico_pintura") {
      return e.pintura_habilitada === true && !CERRADOS.includes(e.estado_interno);
    }
    if (perfil === "tecnico_mecanica") {
      return !CERRADOS.includes(e.estado_interno);
    }
    return true;
  });

  const ids = new Set(visibles.map((e: any) => e.id));
  return {
    expedientes: visibles,
    facturas: perfil === "facturacion"
      ? facturas.filter((f: any) => ids.has(f.expediente_prueba_id))
      : [],
    eventos: (perfil === "facturacion"
      ? eventos
      : eventos.filter((ev: any) => ids.has(ev.expediente_prueba_id))
    ).slice(0, 40),
  };
}

async function crearExpediente(db: any, actor: any, body: any) {
  if (actor.perfil !== "facturacion") {
    fail("Solo Yanira o Mauricio ingresan expedientes, incluso en la prueba.", 403);
  }
  const cliente = texto(body.cliente_nombre, 160);
  const marca = texto(body.vehiculo_marca, 60);
  const modelo = texto(body.vehiculo_modelo, 60);
  const motivo = texto(body.motivo_visita, 400);
  if (!cliente || !marca || !modelo || !motivo) fail("Completa cliente, vehículo y motivo de la visita.");

  const existentes = await todos(db.PruebaExpediente);
  const usados = new Set(existentes.map((e: any) => e.numero_prueba));
  let consecutivo = existentes.length + 1;
  while (usados.has(`PRB-${String(consecutivo).padStart(4, "0")}`)) consecutivo += 1;

  const creado = await db.PruebaExpediente.create({
    numero_prueba: `PRB-${String(consecutivo).padStart(4, "0")}`,
    cliente_nombre: cliente,
    cliente_telefono: texto(body.cliente_telefono, 40),
    vehiculo_marca: marca,
    vehiculo_modelo: modelo,
    vehiculo_placa: texto(body.vehiculo_placa, 20).toUpperCase(),
    vehiculo_anio: num(body.vehiculo_anio),
    motivo_visita: motivo,
    estado_interno: "Recibido",
    pintura_habilitada: false,
    factura_emitida: false,
    registrado_por: actor.nombre,
  });
  await registrarEvento(db, creado.id, "expediente_creado", actor, `${cliente} · ${marca} ${modelo}`);
  return creado;
}

async function habilitarPintura(db: any, actor: any, body: any) {
  if (actor.perfil !== "facturacion") {
    fail("Solo Yanira o Mauricio habilitan la revisión de pintura.", 403);
  }
  const exp = await obtenerExpediente(db, body.expediente_id);
  if (CERRADOS.includes(exp.estado_interno)) fail("El expediente de prueba ya está cerrado.");

  const habilitar = body.habilitar === true;
  if (!habilitar && (exp.inspeccion_pintura || exp.diagnostico_pintura)) {
    fail("La revisión de pintura ya tiene registros; no se puede deshabilitar.");
  }

  const cambios: Record<string, unknown> = habilitar
    ? {
        pintura_habilitada: true,
        habilitado_por: actor.nombre,
        fecha_habilitacion_pintura: new Date().toISOString(),
      }
    : { pintura_habilitada: false, habilitado_por: "" };
  cambios.estado_interno = estadoDerivado({ ...exp, pintura_habilitada: habilitar });

  const actualizado = await db.PruebaExpediente.update(exp.id, cambios);
  await registrarEvento(
    db,
    exp.id,
    habilitar ? "pintura_habilitada" : "pintura_deshabilitada",
    actor,
    habilitar ? "Solo para este expediente" : ""
  );
  return actualizado;
}

async function registrarInspeccion(db: any, actor: any, body: any) {
  const esp = especialidadDe(body.especialidad);
  if (actor.perfil !== perfilDeEspecialidad(esp)) {
    fail(`Solo el técnico de ${nombreEspecialidad(esp)} registra esta inspección.`, 403);
  }
  const exp = await obtenerExpediente(db, body.expediente_id);
  if (CERRADOS.includes(exp.estado_interno)) fail("El expediente de prueba ya está cerrado.");
  if (esp === "pintura" && !exp.pintura_habilitada) {
    fail("Pintura no está habilitada para este expediente. Yanira debe marcarla en el Tablero.", 403);
  }

  const campo = esp === "pintura" ? "inspeccion_pintura" : "inspeccion_mecanica";
  if (exp[campo]) fail("Esta inspección ya fue completada en la prueba.", 409);

  const hallazgos = texto(body.hallazgos, 2000);
  if (!hallazgos) fail("Describe lo encontrado en la inspección.");

  const registro: Record<string, unknown> = {
    realizada_por: actor.nombre,
    fecha: new Date().toISOString(),
    hallazgos,
  };
  if (esp === "mecanica" && num(body.kilometraje) > 0) registro.kilometraje = num(body.kilometraje);

  const cambios: Record<string, unknown> = { [campo]: registro };
  cambios.estado_interno = estadoDerivado({ ...exp, [campo]: registro });

  const actualizado = await db.PruebaExpediente.update(exp.id, cambios);
  await registrarEvento(db, exp.id, `inspeccion_${esp}`, actor, hallazgos.slice(0, 120));
  return actualizado;
}

async function registrarDiagnostico(db: any, actor: any, body: any) {
  const esp = especialidadDe(body.especialidad);
  if (actor.perfil !== perfilDeEspecialidad(esp)) {
    fail(`Solo el técnico de ${nombreEspecialidad(esp)} registra este diagnóstico.`, 403);
  }
  const exp = await obtenerExpediente(db, body.expediente_id);
  if (CERRADOS.includes(exp.estado_interno)) fail("El expediente de prueba ya está cerrado.");
  if (esp === "pintura" && !exp.pintura_habilitada) {
    fail("Pintura no está habilitada para este expediente.", 403);
  }

  const campoInspeccion = esp === "pintura" ? "inspeccion_pintura" : "inspeccion_mecanica";
  if (!exp[campoInspeccion]) fail("Primero debe completarse la inspección correspondiente.");

  const campo = esp === "pintura" ? "diagnostico_pintura" : "diagnostico_mecanica";
  if (exp[campo]) fail("Este diagnóstico ya fue registrado en la prueba.", 409);

  const diagnostico = texto(body.diagnostico, 3000);
  if (!diagnostico) fail("Escribe el diagnóstico.");

  const registro = {
    registrado_por: actor.nombre,
    fecha: new Date().toISOString(),
    diagnostico,
    recomendaciones: texto(body.recomendaciones, 2000),
  };

  const cambios: Record<string, unknown> = { [campo]: registro };
  cambios.estado_interno = estadoDerivado({ ...exp, [campo]: registro });

  const actualizado = await db.PruebaExpediente.update(exp.id, cambios);
  await registrarEvento(db, exp.id, `diagnostico_${esp}`, actor, diagnostico.slice(0, 120));
  return actualizado;
}

async function prepararFactura(db: any, actor: any, body: any) {
  if (actor.perfil !== "facturacion") {
    fail("Solo Yanira o Mauricio preparan la factura. Los perfiles técnicos no tienen acceso.", 403);
  }
  const exp = await obtenerExpediente(db, body.expediente_id);
  if (exp.factura_emitida) fail("La factura de prueba ya fue emitida.");
  if (!completos(exp)) fail("Faltan inspección o diagnóstico de una especialidad habilitada.");

  const crudos = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
  const items = crudos
    .map((i: any) => {
      const descripcion = texto(i?.descripcion, 200);
      const cantidad = Math.max(num(i?.cantidad), 0);
      const precio = Math.max(num(i?.precio_unitario), 0);
      return {
        descripcion,
        cantidad,
        precio_unitario: redondear(precio),
        subtotal: redondear(cantidad * precio),
      };
    })
    .filter((i: any) => i.descripcion && i.cantidad > 0);
  if (!items.length) fail("Agrega al menos una línea con descripción y cantidad.");

  const subtotal = redondear(items.reduce((s: number, i: any) => s + i.subtotal, 0));
  const aplica_iva = body.aplica_iva !== false;
  const iva = aplica_iva ? redondear(subtotal * IVA) : 0;
  const total = redondear(subtotal + iva);
  if (total <= 0) fail("El total debe ser mayor que cero.");

  const facturas = await todos(db.PruebaFactura);
  const borrador = facturas.find(
    (f: any) => f.expediente_prueba_id === exp.id && f.estado === "Borrador"
  );

  let numero = borrador?.numero_prueba_factura;
  if (!numero) {
    const usados = new Set(facturas.map((f: any) => f.numero_prueba_factura));
    let consecutivo = facturas.length + 1;
    while (usados.has(`PRB-F-${String(consecutivo).padStart(4, "0")}`)) consecutivo += 1;
    numero = `PRB-F-${String(consecutivo).padStart(4, "0")}`;
  }

  const datos = {
    expediente_prueba_id: exp.id,
    numero_prueba_factura: numero,
    items,
    subtotal,
    iva,
    total,
    aplica_iva,
    estado: "Borrador",
    preparada_por: actor.nombre,
  };

  const guardada = borrador
    ? await db.PruebaFactura.update(borrador.id, datos)
    : await db.PruebaFactura.create(datos);

  await db.PruebaExpediente.update(exp.id, { estado_interno: estadoDerivado(exp) });
  await registrarEvento(db, exp.id, "factura_preparada", actor, `$${total.toFixed(2)}`);
  return guardada;
}

async function emitirFactura(db: any, actor: any, body: any) {
  if (actor.perfil !== "facturacion") {
    fail("Solo Yanira o Mauricio emiten la factura. Los perfiles técnicos no pueden hacerlo.", 403);
  }
  const exp = await obtenerExpediente(db, body.expediente_id);
  if (exp.factura_emitida) fail("La factura de prueba ya fue emitida.");
  if (!completos(exp)) fail("Faltan inspección o diagnóstico antes de emitir.");

  const facturas = await todos(db.PruebaFactura);
  const borrador = facturas.find(
    (f: any) => f.expediente_prueba_id === exp.id && f.estado === "Borrador"
  );
  if (!borrador) fail("Primero prepara el borrador de la factura.");

  const emitida = await db.PruebaFactura.update(borrador.id, {
    estado: "Emitida",
    emitida_por: actor.nombre,
    fecha_emision: new Date().toISOString(),
  });
  await db.PruebaExpediente.update(exp.id, { factura_emitida: true, estado_interno: "Facturado" });
  await registrarEvento(db, exp.id, "factura_emitida", actor, borrador.numero_prueba_factura);
  return emitida;
}

async function cerrarExpediente(db: any, actor: any, body: any) {
  if (actor.perfil !== "facturacion") {
    fail("Solo Yanira o Mauricio cierran el expediente.", 403);
  }
  const exp = await obtenerExpediente(db, body.expediente_id);
  if (!exp.factura_emitida) fail("Solo se cierra un expediente ya facturado en la prueba.");
  if (exp.estado_interno === "Cerrado") fail("El expediente de prueba ya está cerrado.");
  const actualizado = await db.PruebaExpediente.update(exp.id, { estado_interno: "Cerrado" });
  await registrarEvento(db, exp.id, "expediente_cerrado", actor, "");
  return actualizado;
}

async function eliminarExpediente(db: any, actor: any, body: any) {
  if (actor.perfil !== "facturacion") {
    fail("Solo Yanira o Mauricio descartan expedientes de prueba.", 403);
  }
  const exp = await obtenerExpediente(db, body.expediente_id);
  const facturas = (await todos(db.PruebaFactura)).filter(
    (f: any) => f.expediente_prueba_id === exp.id
  );
  const eventos = (await todos(db.PruebaEvento)).filter(
    (ev: any) => ev.expediente_prueba_id === exp.id
  );
  await Promise.all(facturas.map((f: any) => db.PruebaFactura.delete(f.id)));
  await Promise.all(eventos.map((ev: any) => db.PruebaEvento.delete(ev.id)));
  await db.PruebaExpediente.delete(exp.id);
  return { ok: true };
}

async function limpiar(db: any) {
  await db.PruebaEvento.deleteMany({});
  await db.PruebaFactura.deleteMany({});
  await db.PruebaExpediente.deleteMany({});
  return { ok: true };
}

async function ejecutar(db: any, body: any) {
  const accion = String(body?.accion || "");
  if (accion === "listar") return listar(db, body);
  if (accion === "limpiar") return limpiar(db);

  const actor = actorDe(body);
  switch (accion) {
    case "crear_expediente":
      return crearExpediente(db, actor, body);
    case "habilitar_pintura":
      return habilitarPintura(db, actor, body);
    case "registrar_inspeccion":
      return registrarInspeccion(db, actor, body);
    case "registrar_diagnostico":
      return registrarDiagnostico(db, actor, body);
    case "preparar_factura":
      return prepararFactura(db, actor, body);
    case "emitir_factura":
      return emitirFactura(db, actor, body);
    case "cerrar_expediente":
      return cerrarExpediente(db, actor, body);
    case "eliminar_expediente":
      return eliminarExpediente(db, actor, body);
    default:
      fail("Acción no reconocida en el modo de prueba.");
  }
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e: any) => (e?.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Inicia sesión para usar el modo de prueba." }, { status: 401 });

    const correo = String(user.email || "").trim().toLowerCase();
    if (!SUPER_ADMIN.includes(correo)) {
      return Response.json({ error: "El modo de prueba es exclusivo del Super Admin." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const resultado = await ejecutar(base44.asServiceRole.entities, body);
    return Response.json(resultado);
  } catch (error: any) {
    return Response.json(
      { error: error?.status ? error.message : "No se pudo completar la operación del modo de prueba." },
      { status: error?.status || 500 }
    );
  }
}