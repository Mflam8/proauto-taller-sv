import React from "react";

const formatMoney = (val) => {
  const num = Number(val) || 0;
  return num === 0 ? "—" : `$${num.toFixed(2)}`;
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

function RowTotal({ label, totals, suppliers }) {
  return (
    <tr className="bg-gray-800 text-white font-bold text-xs">
      <td colSpan={3} className="px-2 py-2 text-right uppercase tracking-wide">{label}</td>
      <td className="px-2 py-2 text-right text-green-300">{formatMoney(totals.monto)}</td>
      {suppliers.map((s) => (
        <td key={s} className="px-2 py-2 text-right text-red-300">{formatMoney(totals.proveedores[s] || 0)}</td>
      ))}
      <td className="px-2 py-2 text-right text-amber-300">{formatMoney(totals.totalRepuestos)}</td>
      <td className="px-2 py-2 text-right text-blue-300">{formatMoney(totals.tarjeta)}</td>
      <td className="px-2 py-2 text-right text-green-300">{formatMoney(totals.efectivo)}</td>
      <td className="px-2 py-2 text-right text-purple-300">{formatMoney(totals.cheque)}</td>
      <td className="px-2 py-2 text-right text-cyan-300">{formatMoney(totals.transferencia)}</td>
      <td className="px-2 py-2"></td>
      <td className="px-2 py-2"></td>
    </tr>
  );
}

export function RemesaTable({ groups, suppliers, monthlyTotals }) {
  if (!groups || groups.length === 0) {
    return <p className="text-center text-gray-500 py-12">No hay pagos registrados en este periodo</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#1A1A1A] text-white">
            <th className="px-2 py-2 text-left border-r border-gray-700 whitespace-nowrap">FECHA</th>
            <th className="px-2 py-2 text-center border-r border-gray-700 w-8">#</th>
            <th className="px-2 py-2 text-left border-r border-gray-700 whitespace-nowrap">CLIENTE</th>
            <th className="px-2 py-2 text-right border-r border-gray-700 whitespace-nowrap">CANTIDAD</th>
            {suppliers.map((s) => (
              <th key={s} className="px-2 py-2 text-right border-r border-gray-700 whitespace-nowrap min-w-[90px]" title={s}>
                {s}
              </th>
            ))}
            <th className="px-2 py-2 text-right border-r border-gray-700 whitespace-nowrap bg-amber-900/40">TOTAL REPUESTOS</th>
            <th className="px-2 py-2 text-right border-r border-gray-700 whitespace-nowrap">TARJETA</th>
            <th className="px-2 py-2 text-right border-r border-gray-700 whitespace-nowrap">EFECTIVO</th>
            <th className="px-2 py-2 text-right border-r border-gray-700 whitespace-nowrap">CHEQUE</th>
            <th className="px-2 py-2 text-right border-r border-gray-700 whitespace-nowrap">TRANSFER.</th>
            <th className="px-2 py-2 text-right border-r border-gray-700 whitespace-nowrap">FECHA REMESA</th>
            <th className="px-2 py-2 text-left whitespace-nowrap min-w-[200px]">TRABAJO REALIZADO</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group, gi) => (
            <React.Fragment key={gi}>
              {group.rows.map((row, ri) => (
                <tr key={ri} className={`${ri % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 border-b border-gray-100`}>
                  <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">
                    {row.fecha ? new Date(row.fecha + "T00:00:00").toLocaleDateString("es-SV", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-center text-gray-400">{row.num}</td>
                  <td className="px-2 py-1.5 font-medium text-gray-900 whitespace-nowrap max-w-[180px] truncate" title={row.cliente}>
                    {row.cliente}
                  </td>
                  <td className="px-2 py-1.5 text-right font-semibold text-gray-900 whitespace-nowrap">{formatMoney(row.monto)}</td>
                  {suppliers.map((s) => (
                    <td key={s} className="px-2 py-1.5 text-right text-red-600 whitespace-nowrap">
                      {row.proveedores[s] ? formatMoney(row.proveedores[s]) : "—"}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right font-semibold text-amber-700 bg-amber-50 whitespace-nowrap">{formatMoney(row.totalRepuestos)}</td>
                  <td className="px-2 py-1.5 text-right text-blue-600 whitespace-nowrap">{formatMoney(row.tarjeta)}</td>
                  <td className="px-2 py-1.5 text-right text-green-600 whitespace-nowrap">{formatMoney(row.efectivo)}</td>
                  <td className="px-2 py-1.5 text-right text-purple-600 whitespace-nowrap">{formatMoney(row.cheque)}</td>
                  <td className="px-2 py-1.5 text-right text-cyan-600 whitespace-nowrap">{formatMoney(row.transferencia)}</td>
                  <td className="px-2 py-1.5 text-center text-gray-500 whitespace-nowrap">
                    {row.fechaRemesa ? new Date(row.fechaRemesa + "T00:00:00").toLocaleDateString("es-SV", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-gray-600 max-w-[250px] truncate" title={row.trabajo}>
                    {row.trabajo}
                  </td>
                </tr>
              ))}
              <RowTotal label={group.label} totals={group.totals} suppliers={suppliers} />
            </React.Fragment>
          ))}
        </tbody>
        <tfoot>
          <RowTotal label="TOTAL FACTURADO EN EL MES" totals={monthlyTotals} suppliers={suppliers} />
        </tfoot>
      </table>
    </div>
  );
}