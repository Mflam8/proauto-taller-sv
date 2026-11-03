import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const INICIAL = {
  cliente_nombre: "",
  cliente_telefono: "",
  vehiculo_marca: "",
  vehiculo_modelo: "",
  vehiculo_placa: "",
  vehiculo_anio: "",
  motivo_visita: "",
};

export default function FormularioExpedientePrueba({ open, onClose, onGuardar, guardando }) {
  const [form, setForm] = useState(INICIAL);

  useEffect(() => {
    if (open) setForm(INICIAL);
  }, [open]);

  const campo = (clave) => (e) => setForm((prev) => ({ ...prev, [clave]: e.target.value }));
  const valido =
    form.cliente_nombre.trim() &&
    form.vehiculo_marca.trim() &&
    form.vehiculo_modelo.trim() &&
    form.motivo_visita.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo expediente de prueba</DialogTitle>
          <DialogDescription>
            Solo existe en el entorno de prueba. No crea expediente, cliente ni vehículo reales.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="cliente" className="text-xs">Cliente</Label>
            <Input id="cliente" value={form.cliente_nombre} onChange={campo("cliente_nombre")} maxLength={160} />
          </div>
          <div>
            <Label htmlFor="telefono" className="text-xs">Teléfono</Label>
            <Input id="telefono" value={form.cliente_telefono} onChange={campo("cliente_telefono")} maxLength={40} />
          </div>
          <div>
            <Label htmlFor="placa" className="text-xs">Placa</Label>
            <Input id="placa" value={form.vehiculo_placa} onChange={campo("vehiculo_placa")} maxLength={20} />
          </div>
          <div>
            <Label htmlFor="marca" className="text-xs">Marca</Label>
            <Input id="marca" value={form.vehiculo_marca} onChange={campo("vehiculo_marca")} maxLength={60} />
          </div>
          <div>
            <Label htmlFor="modelo" className="text-xs">Modelo</Label>
            <Input id="modelo" value={form.vehiculo_modelo} onChange={campo("vehiculo_modelo")} maxLength={60} />
          </div>
          <div>
            <Label htmlFor="anio" className="text-xs">Año</Label>
            <Input id="anio" type="number" value={form.vehiculo_anio} onChange={campo("vehiculo_anio")} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="motivo" className="text-xs">Motivo de la visita</Label>
            <Input id="motivo" value={form.motivo_visita} onChange={campo("motivo_visita")} maxLength={400} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={guardando}>Cancelar</Button>
          <Button
            disabled={!valido || guardando}
            onClick={() => onGuardar({ accion: "crear_expediente", ...form })}
            className="bg-[#C0392B] hover:bg-[#a93226]"
          >
            Ingresar a la prueba
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}