import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Package, FileText, CheckCircle, XCircle } from "lucide-react";

export default function ProveedorDetalle({ proveedor }) {
  return (
    <div className="space-y-6">
      {/* Información Principal */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{proveedor.nombre}</CardTitle>
            {proveedor.activo !== false ? (
              <Badge className="bg-green-500 text-white border-0">
                <CheckCircle className="w-4 h-4 mr-1" />
                Activo
              </Badge>
            ) : (
              <Badge className="bg-gray-500 text-white border-0">
                <XCircle className="w-4 h-4 mr-1" />
                Inactivo
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {proveedor.contacto_principal && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Contacto Principal</p>
              <p className="font-semibold text-gray-900">{proveedor.contacto_principal}</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            {proveedor.telefono && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-blue-600" />
                <span className="text-gray-900">{proveedor.telefono}</span>
              </div>
            )}
            {proveedor.email && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="text-gray-900">{proveedor.email}</span>
              </div>
            )}
            {proveedor.direccion && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="text-gray-900">{proveedor.direccion}</span>
              </div>
            )}
          </div>

          {proveedor.terminos_pago && (
            <div className="pt-2">
              <p className="text-sm text-gray-500 mb-1">Términos de Pago</p>
              <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{proveedor.terminos_pago}</p>
            </div>
          )}

          {proveedor.notas && (
            <div className="pt-2">
              <p className="text-sm text-gray-500 mb-1">Notas</p>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{proveedor.notas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Productos Suministrados */}
      {proveedor.productos_suministrados && proveedor.productos_suministrados.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Productos que Suministra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {proveedor.productos_suministrados.map((producto, index) => (
                <Badge key={index} variant="outline" className="px-4 py-2 text-sm">
                  {producto}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}