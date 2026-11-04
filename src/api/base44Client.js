import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, serverUrl, token, functionsVersion } = appParams;

//Create a client with authentication required
const sdk = createClient({
  appId,
  serverUrl,
  token,
  functionsVersion,
  requiresAuth: false
});

async function access(body) {
  try {
    const response = await sdk.functions.invoke("tallerAccess", body);
    return response.data;
  } catch (error) {
    // El servidor devuelve el motivo real (permiso, técnico sin perfil, factura duplicada…).
    // Sin esto el navegador solo mostraba "Request failed with status code 400".
    const detalle = error?.response?.data?.error || error?.response?.data?.message;
    throw Object.assign(new Error(detalle || error?.message || "No se pudo completar la operación."), {
      status: error?.response?.status,
      response: error?.response,
    });
  }
}
const entities = new Proxy({}, {
  get: (_, entity) => {
    if (entity === "ContactoWeb") return sdk.entities.ContactoWeb;
    return {
      list: (sort, limit, skip) => access({ entity, operation: "list", sort, limit, skip }),
      filter: (query, sort, limit, skip) => access({ entity, operation: "filter", query, sort, limit, skip }),
      get: id => access({ entity, operation: "get", id }),
      create: data => access({ entity, operation: "create", data }),
      update: (id, data) => access({ entity, operation: "update", id, data }),
      delete: id => access({ entity, operation: "delete", id }),
    };
  },
});
// Copiamos el SDK sin tocar "asServiceRole" (solo existe en el servidor y rompe el navegador).
const sdkPublico = {};
for (const key of Object.getOwnPropertyNames(sdk)) {
  if (key === "asServiceRole") continue;
  try { sdkPublico[key] = sdk[key]; } catch { /* omitir propiedades del servidor */ }
}

export const base44 = {
  ...sdkPublico,
  entities,
  auth: {
    ...sdk.auth,
    me: async () => {
      const user = await sdk.auth.me();
      try { return { ...user, ...(await access({ action: "perfil" })) }; }
      catch (error) { return { ...user, perfil_acceso: "sin_acceso", error_acceso: error.response?.data?.error || "Acceso no disponible" }; }
    },
  },
};
export const autorizarAccion = permission => access({ action: "autorizar", permission });