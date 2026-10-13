import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";

// Employee profiles are authoritative. Never trust a role supplied by the browser.
export const OWNERS = ["mayaflamenco89@gmail.com", "proautotallersv@gmail.com"];
export const PROFILES = ["sin_acceso", "tecnico", "pintura", "jefe_taller", "recepcion_cobros"];
export const normalize = (s) => String(s || "").trim().toLowerCase();
export const pick = (record, fields) => Object.fromEntries(fields.filter(k => record[k] !== undefined).map(k => [k, record[k]]));
export const fail = (message = "No tienes permiso para esta acción.", status = 403) => { throw Object.assign(new Error(message), { status }); };
const META = ["id", "created_date", "updated_date"];
export const PUBLIC_FIELDS = {
  TrabajoExpediente: [...META, "expediente_id", "descripcion", "tecnico_id", "tecnico_nombre", "tipo", "cantidad", "fecha_inicio", "fecha_fin", "evidencia_urls", "prueba_final", "estado", "notas"],
  Expediente: [...META, "numero_expediente", "cliente_id", "vehiculo_id", "fecha_ingreso", "fecha_promesa_entrega", "fecha_salida", "kilometraje_entrada", "kilometraje_salida", "motivo_visita", "sintomas_cliente", "indicaciones_cliente", "estado_interno", "estado_cliente", "observaciones", "fotos"],
  Vehiculo: [...META, "cliente_id", "placa", "marca", "modelo", "anio", "color", "tipo_vehiculo", "motor", "cilindrada", "tipo_combustible", "kilometraje_actual", "estado_actual", "fotos"],
  Cliente: [...META, "nombre_completo"],
  Empleado: [...META, "nombre_completo", "tipo", "cargo", "activo"],
  Inspeccion: null,
  Diagnostico: [...META, "expediente_id", "vehiculo_id", "tecnico_id", "tecnico_nombre", "fecha", "diagnostico_inicial", "diagnostico_final", "fallas_detectadas", "recomendaciones", "fotos", "estado"],
  MaterialTrabajo: [...META, "expediente_id", "trabajo_id", "descripcion", "numero_parte", "cantidad", "origen", "estado", "foto_urls"],
  Asistencia: [...META, "empleado_email", "empleado_nombre", "tipo", "fecha_hora", "fecha_sv", "distancia_metros", "verificado"],
};
export const SCHEMA_FIELDS = {"Asistencia":["empleado_email","empleado_nombre","tipo","fecha_hora","fecha_sv","latitud","longitud","distancia_metros","verificado","notas"],"ConfigTaller":["nombre","latitud","longitud","radio_metros","actualizado_por","fecha_actualizacion"],"AjustePrecioTrabajo":["trabajo_id","expediente_id","catalogo_precio_id","precio_sugerido","precio_aprobado","motivo","aprobado_por_id","aprobado_por_nombre","fecha"],"CajaChica":["expediente_id","concepto","tipo","categoria","monto","proveedor","registrado_por","fecha","comprobante_url","notas"],"CatalogoPrecio":["codigo_catalogo","rubro","descripcion","precio_base","precio_verificado","fuente","origen","activo"],"Cliente":["nombre_completo","telefono","whatsapp","email","dui","nit","direccion","tipo_cliente","nombre_empresa","notas","activo","legacy_customer_id","legacy_customer_code","legacy_nombre_legal","legacy_saldo","legacy_forma_pago","legacy_raw_table"],"ContactoWeb":["nombre","apellido","telefono","correo","mensaje","leido"],"ControlFactura":["numero_control","evento","factura_id","numero_factura","cliente_nombre","vehiculo_desc","expediente_id","monto_total","usuario_email","usuario_nombre","fecha_evento"],"Cotizacion":["numero_cotizacion","cliente_id","vehiculo_id","servicios","subtotal","descuento","total","estado","fecha_aprobacion","metodo_aprobacion","notas","vigencia_dias","legacy_quote_id","legacy_customer_id","legacy_series","legacy_raw_table"],"Diagnostico":["expediente_id","vehiculo_id","tecnico_id","tecnico_nombre","fecha","diagnostico_inicial","diagnostico_final","fallas_detectadas","recomendaciones","fotos","estado"],"Empleado":["nombre_completo","telefono","email","cargo","tipo","especialidad","fecha_ingreso","fecha_nacimiento","dui","activo","notas","perfil_acceso"],"Expediente":["numero_expediente","cliente_id","vehiculo_id","recibido_por_id","fecha_ingreso","fecha_promesa_entrega","fecha_salida","kilometraje_entrada","kilometraje_salida","motivo_visita","sintomas_cliente","indicaciones_cliente","estado_interno","estado_cliente","llaves_cantidad","llaves_observaciones","observaciones","fotos","total_cobrado","total_pagado","saldo_pendiente","trabajos_completados","diagnostico_documentado","evidencia_final","factura_generada","cierre_autorizado","recepcion_cliente"],"Factura":["numero_factura","expediente_id","orden_trabajo_id","cliente_id","vehiculo_id","forma_pago","aplica_iva","items","subtotal","importe_neto","iva","total","ganancia_mano_obra","estado_pago","motivo_cierre","monto_pagado","saldo_pendiente","fecha_vencimiento","fecha_emision","legacy_invoice_id","legacy_invoice_number","legacy_customer_id","legacy_job_id","legacy_series","legacy_raw_table"],"Inspeccion":["expediente_id","vehiculo_id","cliente_id","realizada_por","fecha","kilometraje","aseguradora","orden_trabajo_referencia","vehiculo_agencia_importado","tipo_croquis","aire_acondicionado","direccion_hidraulica","alarma","estado_llantas","estado_luces","estado_vidrios","estado_pintura","estado_tapiceria","llanta_repuesto","herramientas","caja_herramientas","gato_mecanico","cables_corriente","documentos","accesorios_recibidos","evaluaciones","daños","fotos","firma_ingreso","observaciones","estado"],"ItemInventario":["codigo","nombre","descripcion","categoria","stock_actual","stock_minimo","precio_compra","precio_venta","proveedor_principal","ubicacion_fisica","activo"],"MaterialTrabajo":["expediente_id","trabajo_id","origen","item_inventario_id","catalogo_precio_id","descripcion","numero_parte","cantidad","costo_unitario","costo_total","proveedor_nombre","estado","foto_urls","proveedor_id","comprobante_url","registrado_por","fecha_registro","notas"],"MovimientoInventario":["item_inventario_id","tipo_movimiento","cantidad","motivo","orden_trabajo_id","costo_unitario","responsable","notas"],"OrdenTrabajo":["numero_orden","cotizacion_id","cliente_id","vehiculo_id","tecnico_asignado_id","estado","progreso_porcentaje","servicios_realizados","fecha_entrada","fecha_estimada_entrega","fecha_entrega_real","kilometraje_entrada","notas_internas","legacy_job_id","legacy_job_number","legacy_customer_id","legacy_invoice_id","legacy_raw_table"],"Pago":["factura_id","monto","metodo_pago","referencia","fecha_pago","fecha_remesa","recibido_por","notas","legacy_payment_id","legacy_invoice_id","legacy_customer_id","legacy_raw_table"],"Proveedor":["nombre","contacto_principal","telefono","email","direccion","productos_suministrados","terminos_pago","notas","activo"],"Servicio":["nombre","descripcion","categoria","precio_base","tiempo_estimado_horas","activo","legacy_item_id","legacy_code_family","legacy_barcode","legacy_precio_lista1","legacy_raw_table"],"TrabajoExpediente":["expediente_id","descripcion","tecnico_id","tecnico_nombre","tipo","cantidad","precio_unitario","subtotal","catalogo_precio_id","precio_sugerido","origen_precio","precio_ajustado_por","motivo_ajuste_precio","fecha_ajuste_precio","fecha_inicio","fecha_fin","evidencia_urls","prueba_final","estado","aprobado_cliente","notas"],"Vehiculo":["cliente_id","placa","poliza","marca","modelo","anio","color","vin","tipo_vehiculo","motor","cilindrada","tipo_combustible","kilometraje_actual","estado_actual","fotos","notas"]};
PUBLIC_FIELDS.Inspeccion = [...META, ...SCHEMA_FIELDS.Inspeccion.filter(k => k !== "firma_ingreso")];
const READ = {
  jefe_taller: ["Cliente", "Vehiculo", "Expediente", "TrabajoExpediente", "Inspeccion", "Diagnostico", "OrdenTrabajo", "Factura", "Cotizacion", "Empleado", "CatalogoPrecio", "Servicio", "MaterialTrabajo", "ItemInventario", "Proveedor", "AjustePrecioTrabajo", "Asistencia"],
  recepcion_cobros: ["Cliente", "Vehiculo", "Expediente", "TrabajoExpediente", "Inspeccion", "Diagnostico", "OrdenTrabajo", "Factura", "Pago", "Empleado", "MaterialTrabajo"],
  tecnico: Object.keys(PUBLIC_FIELDS),
  pintura: Object.keys(PUBLIC_FIELDS),
};
export const isTechnician = p => ["tecnico", "pintura"].includes(p);
export function resolveActor(user, employees) {
  if (!user?.email) fail("Inicia sesión.", 401);
  if (OWNERS.includes(normalize(user.email))) return { profile: "gerencia", user, employee: null };
  const matches = employees.filter(e => normalize(e.email) === normalize(user.email));
  if (matches.length !== 1 || matches[0].activo !== true || !PROFILES.includes(matches[0].perfil_acceso) || matches[0].perfil_acceso === "sin_acceso") fail("Tu acceso no está habilitado. Contacta a la gerencia.");
  return { profile: matches[0].perfil_acceso, user, employee: matches[0] };
}
export async function allRecords(entity) {
  const rows = [];
  for (let skip = 0; skip < 100000; skip += 500) {
    const batch = await entity.list("id", 500, skip);
    rows.push(...batch);
    if (batch.length < 500) return rows;
  }
  fail("La consulta necesita paginación adicional.", 503);
}
const doneExp = e => ["Entregado", "Cerrado", "Cancelado"].includes(e.estado_interno);
export async function makeScope(db, actor) {
  if (!isTechnician(actor.profile)) return null;
  const jobs = await allRecords(db.TrabajoExpediente);
  const exps = await allRecords(db.Expediente);
  const assignedIds = new Set(jobs.filter(t => t.tecnico_id === actor.employee.id).map(t => t.expediente_id));
  const current = exps.filter(e => assignedIds.has(e.id) && !doneExp(e));
  const expIds = new Set(current.map(e => e.id));
  const vehicleIds = new Set(current.map(e => e.vehiculo_id));
  const history = exps.filter(e => vehicleIds.has(e.vehiculo_id));
  return { expIds, vehicleIds, historyIds: new Set(history.map(e => e.id)), clientIds: new Set(history.map(e => e.cliente_id)) };
}
export function inScope(entity, row, scope, actor) {
  if (!scope) return true;
  if (entity === "Empleado") return row.id === actor.employee.id;
  if (entity === "Asistencia") return normalize(row.empleado_email) === normalize(actor.user.email);
  if (entity === "Cliente") return scope.clientIds.has(row.id);
  if (entity === "Vehiculo") return scope.vehicleIds.has(row.id);
  if (entity === "Expediente") return scope.historyIds.has(row.id);
  return scope.historyIds.has(row.expediente_id);
}
export function sanitize(entity, row, actor) {
  if (actor.profile === "gerencia") return row;
  if (entity === "Empleado") return pick(row, PUBLIC_FIELDS.Empleado);
  if (isTechnician(actor.profile)) return pick(row, PUBLIC_FIELDS[entity] || []);
  return row;
}
export function validateQuery(query, fields) {
  if (!query || typeof query !== "object" || Array.isArray(query)) fail("Filtro inválido.", 400);
  for (const [k, v] of Object.entries(query)) {
    if (!fields.includes(k) || (v !== null && typeof v === "object")) fail("Filtro no permitido.", 400);
  }
}
const matchesQuery = (r, q) => Object.entries(q).every(([k,v]) => r[k] === v);
export function enforceWrite(actor, entity, operation, data, old, scope) {
  const p = actor.profile;
  if (p === "gerencia") return;
  if (entity === "Asistencia" || entity === "ConfigTaller") fail();
  if (operation === "delete") fail();
  const keys = Object.keys(data);
  if (isTechnician(p)) {
    const exp = old?.expediente_id || data.expediente_id;
    if (!scope?.expIds.has(exp)) fail();
    if (old && data.expediente_id && data.expediente_id !== old.expediente_id) fail();
    if (entity === "TrabajoExpediente") {
      if (operation !== "update" || old.tecnico_id !== actor.employee.id) fail();
      if (keys.some(k => !["estado","notas","evidencia_urls","prueba_final"].includes(k))) fail();
      if (data.estado && !["Pendiente","En Proceso","Completado"].includes(data.estado)) fail("Estado inválido.",400);
      return;
    }
    if (entity === "Inspeccion" || entity === "Diagnostico") return;
    fail();
  }
  if (["Cliente","Vehiculo","Inspeccion","Diagnostico"].includes(entity)) return;
  if (entity === "Expediente") {
    if (p === "jefe_taller" && keys.some(k => ["total_pagado","cierre_autorizado","recepcion_cliente"].includes(k))) fail();
    if (p === "recepcion_cobros" && keys.some(k => ["total_cobrado","factura_generada"].includes(k))) fail();
    return;
  }
  if (entity === "TrabajoExpediente") {
    if (p === "jefe_taller") return;
    if (operation === "update" && keys.every(k => ["tecnico_id","tecnico_nombre"].includes(k))) return;
    fail("Solo el jefe de taller define los trabajos y sus precios.");
  }
  if (entity === "Factura") {
    if (p === "jefe_taller") {
      if (operation === "update" && keys.some(k => ["monto_pagado","estado_pago","motivo_cierre"].includes(k))) fail();
      if (operation === "create" && ((data.monto_pagado || 0) !== 0 || (data.estado_pago && data.estado_pago !== "Pendiente"))) fail();
      return;
    }
    if (p === "recepcion_cobros" && operation === "update" && keys.every(k => ["monto_pagado","estado_pago","saldo_pendiente","motivo_cierre"].includes(k))) return;
    fail();
  }
  if (entity === "Pago" && p === "recepcion_cobros" && operation === "create") return;
  if (["Cotizacion","CatalogoPrecio","Servicio","AjustePrecioTrabajo","MaterialTrabajo","OrdenTrabajo"].includes(entity) && p === "jefe_taller") return;
  fail();
}
export async function handleTaller(db, user, body) {
  const employees = await allRecords(db.Empleado);
  const actor = resolveActor(user, employees);
  if (body.action === "perfil") return { perfil_acceso: actor.profile, empleado_id: actor.employee?.id || null, empleado_nombre: actor.employee?.nombre_completo || user.full_name };
  if (body.action === "autorizar") {
    const rules = { imprimir: ["gerencia","recepcion_cobros"], cobrar: ["gerencia","recepcion_cobros"], precios: ["gerencia","jefe_taller"], gestionar: ["gerencia"] };
    if (!rules[body.permission]?.includes(actor.profile)) fail();
    return { ok: true };
  }
  const { entity, operation, id } = body;
  if (!Object.hasOwn(SCHEMA_FIELDS, entity)) fail();
  if (!["list","filter","get","create","update","delete"].includes(operation)) fail();
  const read = ["list","filter","get"].includes(operation);
  if (actor.profile !== "gerencia" && !READ[actor.profile]?.includes(entity)) fail();
  const scope = await makeScope(db, actor);
  if (read) {
    const fields = isTechnician(actor.profile) ? PUBLIC_FIELDS[entity] : [...META,...SCHEMA_FIELDS[entity]];
    const query = operation === "get" ? { id } : (body.query || {});
    validateQuery(query, fields || []);
    const sort = body.sort || "-created_date";
    const field = sort.replace(/^-/, "");
    if (!fields?.includes(field)) fail("Orden no permitido.",400);
    const rows = (await allRecords(db[entity])).filter(r => inScope(entity,r,scope,actor) && matchesQuery(r,query));
    rows.sort((a,b) => { const x=a[field]??"", y=b[field]??""; return (x<y?-1:x>y?1:0)*(sort.startsWith("-")?-1:1); });
    if (operation === "get") { if (!rows[0]) fail("Registro no disponible.",404); return sanitize(entity,rows[0],actor); }
    const skip = Number.isInteger(body.skip) && body.skip >= 0 ? body.skip : 0;
    const limit = body.limit === undefined ? rows.length : Math.min(Math.max(Number(body.limit)||0,0),10000);
    return rows.slice(skip,skip+limit).map(r=>sanitize(entity,r,actor));
  }
  const original = body.data || {};
  if (typeof original !== "object" || Array.isArray(original)) fail("Datos inválidos.",400);
  const data = pick(original, SCHEMA_FIELDS[entity]);
  const old = operation === "create" ? null : await db[entity].get(id);
  if (operation !== "create" && !old) fail("Registro no disponible.",404);
  enforceWrite(actor,entity,operation,data,old,scope);
  if (entity === "Empleado") {
    if (operation === "delete") fail("Desactiva al empleado para conservar su historial.",400);
    const next = { ...old, ...data };
    next.email = normalize(next.email);
    if (!next.nombre_completo?.trim() || !PROFILES.includes(next.perfil_acceso)) fail("Selecciona un perfil de acceso válido.",400);
    if (next.perfil_acceso !== "sin_acceso" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) fail("El perfil necesita un correo válido.",400);
    if (next.email && employees.some(e=> e.id!==id && normalize(e.email)===next.email)) fail("Ese correo ya está asociado a otro empleado.",409);
    if (OWNERS.includes(next.email)) fail("La cuenta de gerencia no se asigna como empleado.",400);
    data.email = next.email;
  }
  if (data.tecnico_id) {
    const assigned = employees.find(e=>e.id===data.tecnico_id && e.activo===true && ["tecnico","pintura","jefe_taller"].includes(e.perfil_acceso));
    if (!assigned) fail("Selecciona un empleado activo con perfil de taller.",400);
    if (entity === "TrabajoExpediente") data.tecnico_nombre = assigned.nombre_completo;
  }
  if (entity === "TrabajoExpediente" && data.estado && actor.profile !== "gerencia") {
    if (data.estado === "En Proceso" && !old?.fecha_inicio) data.fecha_inicio = new Date().toISOString();
    if (data.estado === "Completado") data.fecha_fin = new Date().toISOString();
  }
  if (isTechnician(actor.profile) && ["Inspeccion","Diagnostico"].includes(entity)) {
    const exp = await db.Expediente.get(old?.expediente_id || data.expediente_id);
    data.expediente_id = exp.id; data.vehiculo_id = exp.vehiculo_id;
    data.fecha = new Date().toISOString();
    if (entity === "Inspeccion") { data.cliente_id = exp.cliente_id; data.realizada_por = actor.employee.nombre_completo; delete data.firma_ingreso; }
    else { data.tecnico_id = actor.employee.id; data.tecnico_nombre = actor.employee.nombre_completo; }
  }
  if (entity === "Factura" && actor.profile === "jefe_taller") {
    const total = Number(data.total ?? old?.total);
    if (!Number.isFinite(total) || total<0) fail("Total inválido.",400);
    data.saldo_pendiente = total - (old?.monto_pagado || 0);
    if (operation === "create") { data.monto_pagado=0; data.estado_pago="Pendiente"; }
  }
  if (entity === "Expediente" && actor.profile === "jefe_taller" && Object.hasOwn(data,"saldo_pendiente")) {
    data.saldo_pendiente = Number(data.total_cobrado ?? old?.total_cobrado ?? 0) - Number(old?.total_pagado || 0);
  }
  if (entity === "Pago") {
    if (!(Number(data.monto)>0) || !data.factura_id) fail("Pago inválido.",400);
    await db.Factura.get(data.factura_id);
    data.recibido_por = user.email;
  }
  if (operation === "delete") return await db[entity].delete(id);
  const saved = operation === "create" ? await db[entity].create(data) : await db[entity].update(id,data);
  return sanitize(entity,saved,actor);
}

Deno.serve(async req => {
  try {
    const sdk = createClientFromRequest(req);
    const user = await sdk.auth.me();
    const result = await handleTaller(sdk.asServiceRole.entities, user, await req.json());
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.status ? error.message : "No se pudo completar la operación." }, { status: error.status || 500 });
  }
});