import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, FileText, Package, Receipt, TrendingUp, Wallet } from "lucide-react";

const fmt = (n) => `$${(n || 0).toFixed(2)}`;

export default function ResumenCards({ facturado, repuestos, ganancia, cantidadFacturas, cobrado, efectivoTransfer, cantidadPagos }) {
  const cards = [
    { icon: DollarSign, value: fmt(facturado), label: `Total Facturado (${cantidadFacturas} facturas)`, cls: "from-green-500 to-green-600" },
    { icon: Package, value: fmt(repuestos), label: "Total Repuestos facturados", cls: "from-amber-500 to-orange-600" },
    { icon: TrendingUp, value: fmt(ganancia), label: "Ganancia del taller (mano de obra)", cls: "from-emerald-500 to-green-700" },
    { icon: Wallet, value: fmt(cobrado), label: "Total Cobrado (pagos)", cls: "from-emerald-600 to-teal-700" },
    { icon: Receipt, value: fmt(efectivoTransfer), label: "Efectivo + Transfer.", cls: "from-blue-500 to-blue-600" },
    { icon: FileText, value: cantidadPagos, label: "Pagos en el mes", cls: "from-[#E31E24] to-[#B71C1C]" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className={`border-0 shadow-md bg-gradient-to-br ${c.cls} text-white`}>
          <CardContent className="p-4">
            <c.icon className="w-6 h-6 opacity-80 mb-1" />
            <p className="text-xl font-bold">{c.value}</p>
            <p className="text-xs opacity-90">{c.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}