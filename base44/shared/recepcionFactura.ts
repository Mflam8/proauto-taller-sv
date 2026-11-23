export async function validarRecepcionFactura(db, expediente, user, perfil, motivoEntrada) {
  if (expediente.vehiculo_id) {
    const inspecciones = await db.Inspeccion.filter({ expediente_id: expediente.id });
    const fecha = inspeccion => new Date(inspeccion.fecha || inspeccion.created_date || 0).getTime();
    const inspeccion = [...inspecciones].sort((a, b) => fecha(b) - fecha(a))[0];
    const fotos = Array.isArray(inspeccion?.fotos)
      ? inspeccion.fotos.filter(foto => typeof foto === "string" && foto.trim()).length
      : 0;
    if (inspeccion?.estado !== "Completada" || fotos < 4) {
      return {
        ok: false,
        status: 409,
        error: `Completa la inspección de recepción y guarda 4 fotos, una por cada ángulo, antes de facturar. (${Math.min(fotos, 4)}/4)`,
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