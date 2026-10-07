import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RemesaTable } from "@/components/informe/RemesaTable";
import { FileText, Package } from "lucide-react";
import ResumenCards from "@/components/informe/ResumenCards";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const emptyTotals = () => ({
  monto: 0, totalRepuestos: 0, tarjeta: 0, efectivo: 0, cheque: 0, transferencia: 0,
  proveedores: {}
});

const addToTotals = (totals, row) => {
  totals.monto += row.monto;
  totals.totalRepuestos += row.totalRepuestos;
  totals.tarjeta += row.tarjeta;
  totals.efectivo += row.efectivo;
  totals.cheque += row.cheque;
  totals.transferencia += row.transferencia;
  Object.entries(row.proveedores).forEach(([prov, val]) => {
    totals.proveedores[prov] = (totals.proveedores[prov] || 0) + val;
  });
};

// Fechas "YYYY-MM-DD" se leen como hora local para no caer en el mes anterior
const enMes = (valor, mes, anio) => {
  if (!valor) return false;
  const fecha = new Date(valor.length === 10 ? `${valor}T00:00:00` : valor);
  return fecha.getMonth() === mes && fecha.getFullYear() === anio;
};

const metodoToColumn = (metodo) => {
  if (!metodo) return null;
  const m = metodo.toLowerCase();
  if (m.includes("tarjeta")) return "tarjeta";
  if (m.includes("efectivo")) return "efectivo";
  if (m.includes("cheque")) return "cheque";
  if (m.includes("transfer")) return "transferencia";
  return null;
};

export default function InformeRemesas() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth());
  const [anio, setAnio] = useState(now.getFullYear());

  const { data: pagos = [], isLoading: loadingPagos } = useQuery({
    queryKey: ['pagos-informe'],
    queryFn: () => base44.entities.Pago.list('-fecha_pago', 5000),
  });
  const { data: facturas = [], isLoading: loadingFacturas } = useQuery({
    queryKey: ['facturas-informe'],
    queryFn: () => base44.entities.Factura.list('-created_date', 5000),
  });
  const { data: expedientes = [] } = useQuery({
    queryKey: ['expedientes-informe'],
    queryFn: () => base44.entities.Expediente.list('-created_date', 5000),
  });
  const { data: cajaChica = [] } = useQuery({
    queryKey: ['cajaChica-informe'],
    queryFn: () => base44.entities.CajaChica.list('-created_date', 5000),
  });
  const { data: materiales = [] } = useQuery({
    queryKey: ['materiales-informe'],
    queryFn: () => base44.entities.MaterialTrabajo.list('-created_date', 5000),
  });
  const { data: trabajos = [], isLoading: loadingTrabajos } = useQuery({
    queryKey: ['trabajos-informe'],
    queryFn: () => base44.entities.TrabajoExpediente.list('-created_date', 10000),
  });
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-informe'],
    queryFn: () => base44.entities.Cliente.list('-created_date', 10000),
  });

  const isLoading = loadingPagos || loadingFacturas || loadingTrabajos;

  // Build lookup maps
  const facturaMap = useMemo(() => Object.fromEntries(facturas.map(f => [f.id, f])), [facturas]);
  const expedienteMap = useMemo(() => Object.fromEntries(expedientes.map(e => [e.id, e])), [expedientes]);
  const clienteMap = useMemo(() => Object.fromEntries(clientes.map(c => [c.id, c])), [clientes]);
  const cajaChicaByExpediente = useMemo(() => {
    const map = {};
    cajaChica.forEach(cc => {
      if (!cc.expediente_id) return;
      if (!map[cc.expediente_id]) map[cc.expediente_id] = [];
      map[cc.expediente_id].push(cc);
    });
    return map;
  }, [cajaChica]);
  const materialesByExpediente = useMemo(() => {
    const map = {};
    materiales.forEach(m => {
      if (!m.expediente_id) return;
      if (!map[m.expediente_id]) map[m.expediente_id] = [];
      map[m.expediente_id].push(m);
    });
    return map;
  }, [materiales]);
  const trabajosByExpediente = useMemo(() => {
    const map = {};
    trabajos.forEach(t => {
      if (!t.expediente_id) return;
      if (!map[t.expediente_id]) map[t.expediente_id] = [];
      map[t.expediente_id].push(t);
    });
    return map;
  }, [trabajos]);

  // Filter pagos by selected month/year
  const pagosDelMes = useMemo(() => {
    return pagos.filter(p => enMes(p.fecha_pago || p.created_date, mes, anio));
  }, [pagos, mes, anio]);

  // Facturas emitidas en el mes: total facturado y repuestos incluidos en ellas
  const resumenFacturas = useMemo(() => {
    const delMes = facturas.filter(f => enMes(f.fecha_emision || f.created_date, mes, anio));
    let facturado = 0;
    let repuestos = 0;
    delMes.forEach(f => {
      facturado += Number(f.total) || 0;
      (trabajosByExpediente[f.expediente_id] || []).forEach(t => {
        if (t.tipo === "Repuesto" || t.tipo === "Insumo") repuestos += Number(t.subtotal) || 0;
      });
    });
    return { facturado, repuestos, cantidad: delMes.length };
  }, [facturas, trabajosByExpediente, mes, anio]);

  // Build report rows and group by fecha_remesa
  const { groups, suppliers, monthlyTotals, margenes } = useMemo(() => {
    const rows = pagosDelMes.map(pago => {
      const factura = facturaMap[pago.factura_id];
      const expediente = expedienteMap[factura?.expediente_id];
      const cliente = clienteMap[factura?.cliente_id || expediente?.cliente_id];
      const gastosExpediente = cajaChicaByExpediente[expediente?.id] || [];

      // Group parts costs by supplier
      const proveedores = {};
      let totalRepuestos = 0;
      gastosExpediente.forEach(g => {
        if (g.tipo !== "Gasto") return;
        const prov = (g.proveedor || "VARIOS").trim();
        const monto = g.monto || 0;
        proveedores[prov] = (proveedores[prov] || 0) + monto;
        totalRepuestos += monto;
      });

      // Costos de materiales y repuestos registrados por los trabajadores
      const materialesExpediente = materialesByExpediente[expediente?.id] || [];
      materialesExpediente.forEach(m => {
        if (m.origen === "Proporcionado por el cliente") return;
        const costo = Number(m.costo_total) || 0;
        if (!costo) return;
        const prov = (m.proveedor_nombre || "VARIOS").trim();
        proveedores[prov] = (proveedores[prov] || 0) + costo;
        totalRepuestos += costo;
      });

      // Repuestos e insumos que los técnicos registraron en las líneas de trabajo
      const trabajosExpediente = trabajosByExpediente[expediente?.id] || [];
      trabajosExpediente.forEach(t => {
        if (t.tipo !== "Repuesto" && t.tipo !== "Insumo") return;
        const costo = Number(t.subtotal) || 0;
        if (!costo) return;
        proveedores["REPUESTOS/INSUMOS"] = (proveedores["REPUESTOS/INSUMOS"] || 0) + costo;
        totalRepuestos += costo;
      });

      const fechaPago = pago.fecha_pago || expediente?.fecha_ingreso || pago.created_date;
      const fechaStr = fechaPago ? new Date(fechaPago).toISOString().split("T")[0] : null;
      const col = metodoToColumn(pago.metodo_pago);
      const monto = pago.monto || 0;

      return {
        fecha: fechaStr,
        cliente: cliente?.nombre_completo || "N/A",
        monto,
        proveedores,
        totalRepuestos,
        tarjeta: col === "tarjeta" ? monto : 0,
        efectivo: col === "efectivo" ? monto : 0,
        cheque: col === "cheque" ? monto : 0,
        transferencia: col === "transferencia" ? monto : 0,
        fechaRemesa: pago.fecha_remesa,
        trabajo: expediente?.motivo_visita || factura?.items?.[0]?.descripcion || "—"
      };
    }).sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0));

    // Group by fecha_remesa
    const groupMap = {};
    rows.forEach(row => {
      const key = row.fechaRemesa || "PENDIENTE";
      if (!groupMap[key]) {
        groupMap[key] = { remesaDate: key, rows: [], totals: emptyTotals() };
      }
      groupMap[key].rows.push(row);
      groupMap[key].rows[groupMap[key].rows.length - 1].num = groupMap[key].rows.length;
      addToTotals(groupMap[key].totals, row);
    });

    // Build groups array with labels
    const groups = Object.values(groupMap).map(group => {
      const fechas = group.rows.map(r => r.fecha).filter(Boolean).sort();
      const fechaMin = fechas[0] ? new Date(fechas[0] + "T00:00:00") : null;
      const fechaMax = fechas[fechas.length - 1] ? new Date(fechas[fechas.length - 1] + "T00:00:00") : null;
      let label;
      if (group.remesaDate === "PENDIENTE") {
        label = "PENDIENTE DE REMESA";
      } else if (fechaMin && fechaMax) {
        label = `SEMANA DEL ${fechaMin.getDate()}/${String(fechaMin.getMonth() + 1).padStart(2, "0")} AL ${fechaMax.getDate()}/${String(fechaMax.getMonth() + 1).padStart(2, "0")}`;
      } else {
        label = `REMESA ${group.remesaDate}`;
      }
      return { ...group, label };
    });

    // Sort groups by remesa date
    groups.sort((a, b) => {
      if (a.remesaDate === "PENDIENTE") return 1;
      if (b.remesaDate === "PENDIENTE") return -1;
      return new Date(a.remesaDate) - new Date(b.remesaDate);
    });

    // Collect unique suppliers
    const suppliers = [...new Set(rows.flatMap(r => Object.keys(r.proveedores)))].sort();

    // Monthly totals
    const monthlyTotals = emptyTotals();
    rows.forEach(row => addToTotals(monthlyTotals, row));

    // Margen de ganancia por cliente: ingresos cobrados vs costos de repuestos
    const margenMap = {};
    rows.forEach(r => {
      if (!margenMap[r.cliente]) margenMap[r.cliente] = { cliente: r.cliente, ingresos: 0, costos: 0 };
      margenMap[r.cliente].ingresos += r.monto;
      margenMap[r.cliente].costos += r.totalRepuestos;
    });
    const margenes = Object.values(margenMap)
      .map(m => ({ ...m, margen: m.ingresos - m.costos }))
      .sort((a, b) => b.margen - a.margen);

    return { groups, suppliers, monthlyTotals, margenes };
  }, [pagosDelMes, facturaMap, expedienteMap, clienteMap, cajaChicaByExpediente, materialesByExpediente, trabajosByExpediente]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Informe de Remesas</h1>
          <p className="text-sm text-gray-500">Pagos, gastos de repuestos y remesas por semana</p>
        </div>
        <div className="flex gap-3">
          <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#E31E24] rounded-full animate-spin"></div>
        </div>
      ) : (
        <ResumenCards
          facturado={resumenFacturas.facturado}
          repuestos={resumenFacturas.repuestos}
          cantidadFacturas={resumenFacturas.cantidad}
          cobrado={monthlyTotals.monto}
          efectivoTransfer={monthlyTotals.efectivo + monthlyTotals.transferencia}
          cantidadPagos={pagosDelMes.length}
        />
      )}

      {/* Margen por cliente */}
      {margenes.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-[#E31E24]" />
              Margen de Ganancia por Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b">
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3 text-right">Ingresos (cobrado)</th>
                    <th className="py-2 pr-3 text-right">Costos de repuestos</th>
                    <th className="py-2 text-right">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {margenes.map(m => (
                    <tr key={m.cliente} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-3 font-medium text-gray-900">{m.cliente}</td>
                      <td className="py-2.5 pr-3 text-right text-gray-900">${m.ingresos.toFixed(2)}</td>
                      <td className="py-2.5 pr-3 text-right text-amber-700">${m.costos.toFixed(2)}</td>
                      <td className={`py-2.5 text-right font-bold ${m.margen >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ${m.margen.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#E31E24]" />
            {MESES[mes]} {anio}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[#E31E24] rounded-full animate-spin"></div>
            </div>
          ) : (
            <RemesaTable groups={groups} suppliers={suppliers} monthlyTotals={monthlyTotals} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}