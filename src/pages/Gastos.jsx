import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";
import GastoForm, { CATEGORIAS_GASTO } from "@/components/gastos/GastoForm";
import PagoGastoDialog from "@/components/gastos/PagoGastoDialog";
import PagosGastoDetalle from "@/components/gastos/PagosGastoDetalle";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const aFecha = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const usd = (n) => `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const redondear = (n) => Math.round((n || 0) * 100) / 100;
const diaCorto = (s) => {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${Number(d)} ${MESES[Number(m) - 1]} ${y}`;
};

const COLOR_CATEGORIA = {
  "Gasto de Taller": "bg-blue-100 text-blue-800",
  "Servicio del Local": "bg-purple-100 text-purple-800",
  "Suministros y Limpieza": "bg-teal-100 text-teal-800",
  "Otro": "bg-gray-100 text-gray-800",
};

const COLOR_ESTADO = {
  Pagada: "bg-green-100 text-green-800",
  Parcial: "bg-amber-100 text-amber-800",
  Pendiente: "bg-red-100 text-red-800",
};

export default function Gastos() {
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [formAbierto, setFormAbierto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [gastoPago, setGastoPago] = useState(null);
  const [gastoDetalle, setGastoDetalle] = useState(null);
  const [entradasEfectivo, setEntradasEfectivo] = useState(null);

  const semana = useMemo(() => {
    const base = new Date();
    const dia = (base.getDay() + 6) % 7; // lunes = 0
    const ini = new Date(base);
    ini.setDate(base.getDate() - dia + semanaOffset * 7);
    const fin = new Date(ini);
    fin.setDate(ini.getDate() + 6);
    return { inicio: aFecha(ini), fin: aFecha(fin) };
  }, [semanaOffset]);

  const cargar = async () => {
    setCargando(true);
    try {
      const page = await base44.entities.Gasto.list({ sort: "-fecha_compra", limit: 500 });
      setGastos(page.items);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    let activo = true;
    base44.entities.Pago
      .filter(
        { metodo_pago: "Efectivo", fecha_pago: { $gte: `${semana.inicio}T00:00:00`, $lte: `${semana.fin}T23:59:59` } },
        { limit: 500 }
      )
      .then((p) => { if (activo) setEntradasEfectivo(redondear(p.items.reduce((s, x) => s + (Number(x.monto) || 0), 0))); })
      .catch(() => { if (activo) setEntradasEfectivo(null); });
    return () => { activo = false; };
  }, [semana, gastos]);

  // Métricas de la semana
  const gastosSemana = gastos.filter((g) => g.fecha_compra >= semana.inicio && g.fecha_compra <= semana.fin);
  const compradoSemana = redondear(gastosSemana.reduce((s, g) => s + (Number(g.monto) || 0), 0));
  const pagosSemana = gastos
    .flatMap((g) => (Array.isArray(g.pagos) ? g.pagos : []).map((p) => ({ ...p, metodo: p.metodo_pago })))
    .filter((p) => (p.fecha_pago || "").slice(0, 10) >= semana.inicio && (p.fecha_pago || "").slice(0, 10) <= semana.fin);
  const pagadoSemana = redondear(pagosSemana.reduce((s, p) => s + (Number(p.monto) || 0), 0));
  const salidasEfectivo = redondear(pagosSemana.filter((p) => p.metodo === "Efectivo").reduce((s, p) => s + (Number(p.monto) || 0), 0));
  const pendienteTotal = redondear(gastos.filter((g) => g.estado_pago !== "Pagada").reduce((s, g) => s + (Number(g.saldo_pendiente) || 0), 0));

  const etiquetaSemana = `${diaCorto(semana.inicio)} al ${diaCorto(semana.fin)}`;

  const lista = gastosSemana
    .filter((g) => categoriaFiltro === "todas" || g.categoria === categoriaFiltro)
    .filter((g) => {
      const t = busqueda.trim().toLowerCase();
      if (!t) return true;
      return [g.concepto, g.proveedor, g.numero_factura, g.categoria].some((v) => (v || "").toLowerCase().includes(t));
    });

  const eliminar = async (g) => {
    if (!window.confirm(`¿Eliminar el gasto "${g.concepto}"? Esta acción no se puede deshacer.`)) return;
    await base44.entities.Gasto.delete(g.id);
    cargar();
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos del Taller</h1>
          <p className="text-sm text-gray-500">Compras, servicios del local y suministros, con control de crédito y caja</p>
        </div>
        <Button
          onClick={() => { setGastoEditando(null); setFormAbierto(true); }}
          className="bg-[#E31E24] hover:bg-[#B71C1C] text-white"
        >
          <Plus className="w-4 h-4 mr-1" /> Registrar gasto
        </Button>
      </div>

      {/* Navegación por semana */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setSemanaOffset((o) => o - 1)}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="text-sm font-semibold text-gray-700">Semana del {etiquetaSemana}</span>
        <Button variant="outline" size="icon" onClick={() => setSemanaOffset((o) => o + 1)}><ChevronRight className="w-4 h-4" /></Button>
        {semanaOffset !== 0 && (
          <Button variant="ghost" size="sm" onClick={() => setSemanaOffset(0)}>Volver a hoy</Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">Comprado esta semana</p>
            <p className="text-2xl font-bold text-gray-900">{usd(compradoSemana)}</p>
            <p className="text-xs text-gray-500">{gastosSemana.length} gastos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">Pagado esta semana</p>
            <p className="text-2xl font-bold text-gray-900">{usd(pagadoSemana)}</p>
            <p className="text-xs text-gray-500">Efectivo: {usd(salidasEfectivo)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">Pendiente de crédito (total)</p>
            <p className="text-2xl font-bold text-red-600">{usd(pendienteTotal)}</p>
            <p className="text-xs text-gray-500">Comprado pero aún en caja</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">Caja (efectivo de la semana)</p>
            {entradasEfectivo === null ? (
              <p className="text-sm text-gray-500">Las entradas de efectivo solo las ve el Super Admin.</p>
            ) : (
              <>
                <p className={`text-2xl font-bold ${entradasEfectivo - salidasEfectivo >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {usd(entradasEfectivo - salidasEfectivo)}
                </p>
                <p className="text-xs text-gray-500">Entradas: {usd(entradasEfectivo)} · Salidas: {usd(salidasEfectivo)}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Buscar concepto, proveedor o factura…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="sm:max-w-xs" />
        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {CATEGORIAS_GASTO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Factura N°</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando && (
              <TableRow><TableCell colSpan={9} className="py-8 text-center text-gray-500">Cargando gastos…</TableCell></TableRow>
            )}
            {!cargando && lista.length === 0 && (
              <TableRow><TableCell colSpan={9} className="py-8 text-center text-gray-500">No hay gastos registrados en esta semana.</TableCell></TableRow>
            )}
            {!cargando && lista.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="whitespace-nowrap">{diaCorto(g.fecha_compra)}</TableCell>
                <TableCell className="font-medium">{g.concepto}</TableCell>
                <TableCell>
                  <Badge className={COLOR_CATEGORIA[g.categoria] || "bg-gray-100 text-gray-800"}>{g.categoria}</Badge>
                </TableCell>
                <TableCell>{g.proveedor || "—"}</TableCell>
                <TableCell>{g.numero_factura || "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {g.forma_pago === "Crédito" ? `Crédito` : `Contado · ${g.metodo_pago || ""}`}
                </TableCell>
                <TableCell>
                  <Badge className={COLOR_ESTADO[g.estado_pago] || "bg-gray-100 text-gray-800"}>
                    {g.estado_pago}
                    {g.estado_pago !== "Pagada" && Number(g.saldo_pendiente) > 0 ? ` · ${usd(g.saldo_pendiente)}` : ""}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">{usd(g.monto)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {g.estado_pago !== "Pagada" && Number(g.saldo_pendiente) > 0 && (
                      <Button variant="outline" size="sm" onClick={() => setGastoPago(g)}>Registrar pago</Button>
                    )}
                    {(g.pagos?.length || 0) > 0 && (
                      <Button variant="ghost" size="icon" title="Ver pagos" onClick={() => setGastoDetalle(g)}>
                        <ReceiptText className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title="Editar" onClick={() => { setGastoEditando(g); setFormAbierto(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Eliminar" onClick={() => eliminar(g)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <GastoForm
        open={formAbierto}
        gasto={gastoEditando}
        onClose={() => { setFormAbierto(false); setGastoEditando(null); }}
        onSaved={cargar}
      />
      <PagoGastoDialog
        gasto={gastoPago}
        open={!!gastoPago}
        onClose={() => setGastoPago(null)}
        onSaved={cargar}
      />
      <PagosGastoDetalle
        gasto={gastoDetalle}
        open={!!gastoDetalle}
        onClose={() => setGastoDetalle(null)}
      />
    </div>
  );
}