import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, User, Car, Calendar, CreditCard, DollarSign, Printer, Mail, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ReciboPrint from "@/components/facturacion/ReciboPrint";
import { useToast } from "@/components/ui/use-toast";

export default function FacturaDetalle({ factura }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [showCerrarDialog, setShowCerrarDialog] = useState(false);
  const [motivoCierre, setMotivoCierre] = useState("");
  const [cerrando, setCerrando] = useState(false);

  const handleCerrarFactura = async () => {
    setCerrando(true);
    try {
      await base44.entities.Factura.update(factura.id, {
        estado_pago: "Cerrada",
        motivo_cierre: motivoCierre || "Sin motivo especificado",
      });
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['pagos-factura', factura.id] });
      toast({ title: "Factura cerrada", description: "La factura se marcó como Cerrada." });
      setShowCerrarDialog(false);
      setMotivoCierre("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setCerrando(false);
    }
  };
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
      const res = await base44.functions.invoke('enviarFacturaPDF', {
        to: correo,
        factura: {
          id: factura.id,
          numero_factura: factura.numero_factura,
          fecha_emision: factura.fecha_emision,
          fecha_vencimiento: factura.fecha_vencimiento,
          forma_pago: factura.forma_pago,
          items: factura.items || [],
          subtotal: factura.subtotal || 0,
          importe_neto: factura.importe_neto,
          iva: factura.iva || 0,
          total: factura.total || 0,
          monto_pagado: factura.monto_pagado || 0,
          saldo_pendiente: factura.saldo_pendiente,
          estado_pago: factura.estado_pago,
        },
        cliente: cliente ? {
          nombre_completo: cliente.nombre_completo,
          telefono: cliente.telefono,
          email: cliente.email,
        } : null,
        vehiculo: vehiculo ? {
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          placa: vehiculo.placa,
          anio: vehiculo.anio,
          color: vehiculo.color,
        } : null,
      });
      if (res.data?.error) throw new Error(res.data.error);
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
              <div className="flex items-center gap-3">
                {factura.estado_pago !== 'Pagada' && factura.estado_pago !== 'Cerrada' && (
                  <Button
                    onClick={() => setShowCerrarDialog(true)}
                    className="bg-white text-slate-600 hover:bg-slate-100 gap-2 border border-slate-300"
                    size="sm"
                  >
                    <Lock className="w-4 h-4" />
                    Cerrar
                  </Button>
                )}
                <Badge className={`
                  ${factura.estado_pago === 'Pagada' ? 'bg-green-500' : 
                    factura.estado_pago === 'Parcial' ? 'bg-yellow-500' : 
                    factura.estado_pago === 'Cerrada' ? 'bg-slate-500' : 'bg-red-500'} 
                  text-white border-0 text-lg px-4 py-2
                `}>
                  {factura.estado_pago}
                </Badge>
              </div>
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

          {factura.estado_pago === 'Cerrada' && factura.motivo_cierre && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-slate-100 rounded-lg border border-slate-200">
              <Lock className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-600">Motivo de cierre</p>
                <p className="font-semibold text-slate-800">{factura.motivo_cierre}</p>
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

      {/* Dialog Cerrar Factura */}
      <Dialog open={showCerrarDialog} onOpenChange={setShowCerrarDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-600" />
              Cerrar Factura #{factura.numero_factura}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                Al cerrar esta factura, se marcará como <strong>Cerrada</strong> y no aparecerá como pendiente de cobro.
                El saldo pendiente actual es <strong>${saldoPendiente.toFixed(2)}</strong>.
                Esta acción deja un registro permanente del motivo.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Motivo del cierre</Label>
              <Textarea
                placeholder="Ej: Cliente se fue sin pagar, factura incobrable, acuerdo fuera del sistema..."
                value={motivoCierre}
                onChange={(e) => setMotivoCierre(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCerrarDialog(false)}>Cancelar</Button>
              <Button
                onClick={handleCerrarFactura}
                disabled={cerrando}
                className="bg-slate-600 hover:bg-slate-700 text-white gap-2"
              >
                {cerrando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {cerrando ? "Cerrando..." : "Cerrar Factura"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}