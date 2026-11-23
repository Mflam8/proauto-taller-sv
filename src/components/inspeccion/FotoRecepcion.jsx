import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const ANGULOS_FOTO = ["Frontal", "Lateral izquierdo", "Trasera", "Lateral derecho"];

export default function FotoRecepcion({ fileUri, alt, className = "" }) {
  const { data: imageUrl, isLoading } = useQuery({
    queryKey: ["foto-recepcion-firmada", fileUri],
    queryFn: async () => {
      if (/^https?:\/\//i.test(fileUri)) return fileUri;
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 3600 });
      return signed_url;
    },
    enabled: Boolean(fileUri),
    staleTime: 50 * 60 * 1000,
  });

  if (!fileUri) return null;
  if (!imageUrl) return <div className={`flex items-center justify-center bg-gray-100 text-xs text-gray-500 ${className}`}>{isLoading ? "Cargando foto…" : "Foto no disponible"}</div>;
  return <img src={imageUrl} alt={alt} className={className} />;
}