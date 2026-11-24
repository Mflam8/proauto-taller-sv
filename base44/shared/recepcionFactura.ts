export async function validarRecepcionFactura(db, expediente, user, perfil, motivoEntrada) {
  if (expediente.vehiculo_id) {
    const inspecciones = await db.Inspeccion.filter({ expediente_id: expediente.id });
    const fecha = inspeccion => new Date(inspeccion.fecha || inspeccion.created_date || 0).getTime();
    const inspeccion = [...inspecciones].sort((a, b) => fecha(b) - fecha(a))[0];
    if (inspeccion?.estado !== "Completada") {
      return {
        ok: false,
        status: 409,
        error: "Completa y guarda la inspección de recepción antes de facturar.",
      };
    }
    return { ok: true, metadata: {} };
  }

  if (perfil !== "gerencia") {
    return { ok: false, status: 403, error: "Solo Gerencia puede autorizar la excepción para un servicio sin vehículo." };
  }
  const motivo = String(motivoEntrada || "").trim();
  if (!motivo || motivo.length > 1000) {
    return { ok: false, status: 400, error: "Explica el motivo de la excepción gerencial (máximo 1000 caracteres)." };
  }
  return {
    ok: true,
    metadata: {
      excepcion_recepcion_motivo: motivo,
      excepcion_recepcion_autorizada_por: user.email,
      excepcion_recepcion_fecha: new Date().toISOString(),
    },
  };
}