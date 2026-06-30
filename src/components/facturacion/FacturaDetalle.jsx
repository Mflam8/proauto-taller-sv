import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, User, Car, Calendar, CreditCard, DollarSign, Printer, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReciboPrint from "@/components/facturacion/ReciboPrint";
import { useToast } from "@/components/ui/use-toast";

export default function FacturaDetalle({ factura }) {
  const { toast } = useToast();
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const { data: cliente } = useQuery({
    queryKey: ['cliente', factura.cliente_id],
    queryFn: () => base44.entities.Cliente.list().then(clientes => clientes.find(c => c.id === factura.cliente_id)),
    enabled: !!factura.cliente_id,
  });

  const { data: vehiculo } = useQuery({
    queryKey: ['vehiculo', factura.vehiculo_id],
    queryFn: () => base44.entities.Vehiculo.list().then(vehiculos => vehiculos.find(v => v.id === factura.vehiculo_id)),
    enabled: !!factura.vehiculo_id,
  });

  const { data: pagos = [] } = useQuery({
    queryKey: ['pagos-factura', factura.id],
    queryFn: () => base44.entities.Pago.filter({ factura_id: factura.id }),
    initialData: [],
  });

  const saldoCalculado = factura.saldo_pendiente != null ? factura.saldo_pendiente : (factura.total || 0) - (factura.monto_pagado || 0);
  const saldoPendiente = factura.estado_pago === 'Pagada' ? 0 : saldoCalculado;

  const handlePrintRecibo = ReciboPrint({ factura, cliente, vehiculo });

  const handleEnviarCorreo = async () => {
    const correo = cliente?.email;
    if (!correo) {
      toast({
        variant: "destructive",
        title: "Sin correo electrónico",
        description: "Este cliente no tiene correo registrado. Agrégalo en su perfil.",
      });
      return;
    }

    setEnviandoCorreo(true);
    try {
      const items = (factura.items || []).map(it => ({
        descripcion: it.descripcion || "",
        cantidad: it.cantidad || 0,
        precio_unitario: it.precio_unitario || 0,
        subtotal: it.subtotal || (it.cantidad || 0) * (it.precio_unitario || 0),
      }));
      await base44.integrations.Core.SendEmail({
        to: correo,
        subject: `Recibo ${factura.numero_factura || factura.id.slice(0, 8)} - PROAUTO Taller SV`,
        body: `Estimado/a ${cliente?.nombre_completo || ""},\n\nAdjunto el detalle de su recibo:\n\n` +
          `Recibo: ${factura.numero_factura || factura.id.slice(0, 8)}\n` +
          `Fecha: ${factura.fecha_emision ? new Date(factura.fecha_emision).toLocaleDateString("es-SV") : new Date().toLocaleDateString("es-SV")}\n` +
          `Forma de Pago: ${factura.forma_pago || "Contado"}\n` +
          `Vehículo: ${vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.placa}` : "N/A"}\n\n` +
          `DETALLE DE SERVICIOS:\n` +
          items.map(it => `  ${it.cantidad}x ${it.descripcion} — $${it.precio_unitario.toFixed(2)} = $${it.subtotal.toFixed(2)}`).join("\n") +
          `\n\nSubtotal: $${(factura.subtotal || 0).toFixed(2)}\n` +
          (factura.iva > 0 ? `IVA (13%): $${(factura.iva || 0).toFixed(2)}\n` : "") +
          `TOTAL: $${(factura.total || 0).toFixed(2)}\n` +
          `Pagado: $${(factura.monto_pagado || 0).toFixed(2)}\n` +
          `Saldo: $${factura.estado_pago === "Pagada" ? "0.00" : ((factura.saldo_pendiente != null ? factura.saldo_pendiente : (factura.total || 0) - (factura.monto_pagado || 0))).toFixed(2)}\n\n` +
          `Estado: ${factura.estado_pago}\n\n` +
          `¡Gracias por preferirnos!\n\nPROAUTO Taller SV\n8 Av Sur Entre 27 y 29 Calle Pte, Santa Ana\nTel: 6866-0952 / 2406-8129`,
      });
      toast({
        title: "Correo enviado",
        description: `El recibo se envió a ${correo}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al enviar",
        description: error.message || "No se pudo enviar el correo.",
      });
    } finally {
      setEnviandoCorreo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="w-8 h-8" />
              <div>
                <CardTitle className="text-xl">Factura #{factura.numero_factura || factura.id.slice(0, 8)}</CardTitle>
                <p className="text-sm opacity-90">
                  Fecha emisión: {factura.fecha_emision ? new Date(factura.fecha_emision).toLocaleDateString() : '—'}
                </p>
                {factura.legacy_invoice_id && (
                  <p className="text-xs opacity-70">
                    Importado al sistema: {new Date(factura.created_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handlePrintRecibo}
                className="bg-white text-[#E31E24] hover:bg-gray-100 gap-2"
                size="sm"
              >
                <Printer className="w-4 h-4" />
                Imprimir Recibo
              </Button>
              <Button
                onClick={handleEnviarCorreo}
                disabled={enviandoCorreo}
                className="bg-white text-blue-600 hover:bg-blue-50 gap-2"
                size="sm"
              >
                {enviandoCorreo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {enviandoCorreo ? "Enviando..." : "Enviar Correo"}
              </Button>
              <Badge className={`
                ${factura.estado_pago === 'Pagada' ? 'bg-green-500' : 
                  factura.estado_pago === 'Parcial' ? 'bg-yellow-500' : 'bg-red-500'} 
                text-white border-0 text-lg px-4 py-2
              `}>
                {factura.estado_pago}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Cliente</p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">{cliente?.nombre_completo || 'N/A'}</p>
                  {cliente?.telefono && (
                    <p className="text-sm text-gray-600">{cliente.telefono}</p>
                  )}
                </div>
              </div>
            </div>

            {vehiculo && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Vehículo</p>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Car className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {vehiculo.marca} {vehiculo.modelo}
                    </p>
                    <p className="text-sm text-gray-600">Placa: {vehiculo.placa}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {factura.fecha_vencimiento && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                <p className="font-semibold text-gray-900">
                  {new Date(factura.fecha_vencimiento).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Facturados */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Items Facturados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {factura.items?.map((item, index) => (
              <div key={index} className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.descripcion}</p>
                  <p className="text-sm text-gray-600">
                    Cantidad: {item.cantidad} × ${item.precio_unitario?.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${item.subtotal?.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span className="font-semibold">${factura.subtotal?.toFixed(2)}</span>
            </div>
            {factura.iva > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>IVA:</span>
                <span className="font-semibold">${factura.iva?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
              <span>Total:</span>
              <span>${factura.total?.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado de Pago */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Estado de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Monto Pagado</p>
              <p className="text-2xl font-bold text-green-700">
                ${(factura.monto_pagado || 0).toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Saldo Pendiente</p>
              <p className="text-2xl font-bold text-red-700">
                ${saldoPendiente.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Progreso</p>
              <p className="text-2xl font-bold text-blue-700">
                {factura.total > 0 ? ((factura.monto_pagado / factura.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${factura.total > 0 ? ((factura.monto_pagado / factura.total) * 100) : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Pagos */}
      {pagos.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Historial de Pagos ({pagos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pagos.map((pago) => (
                <div key={pago.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="bg-white">
                        {pago.metodo_pago}
                      </Badge>
                      <p className="text-sm text-gray-600">
                        {new Date(pago.fecha_pago || pago.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    {pago.referencia && (
                      <p className="text-sm text-gray-600">
                        Referencia: {pago.referencia}
                      </p>
                    )}
                    {pago.notas && (
                      <p className="text-sm text-gray-500 mt-1">{pago.notas}</p>
                    )}
                    {pago.recibido_por && (
                      <p className="text-xs text-gray-500 mt-1">
                        Recibido por: {pago.recibido_por}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      ${pago.monto?.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}