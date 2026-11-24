export async function validarRecepcionFactura(db, expediente, user, perfil, motivoEntrada) {
  if (expediente.vehiculo_id) return { ok: true, metadata: {} };

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