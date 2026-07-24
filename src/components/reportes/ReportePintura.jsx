import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, TrendingUp, DollarSign } from "lucide-react";

export default function ReportePintura({ totalVendido, totalCobrado }) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-700 text-white">
      <CardHeader className="border-b border-white/20">
        <CardTitle className="flex items-center gap-2 text-white">
          <Palette className="w-5 h-5" />
          Reporte de Pintura
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <TrendingUp className="w-4 h-4" />
              <p className="text-sm">Total Vendido</p>
            </div>
            <p className="text-3xl font-bold">${totalVendido.toFixed(2)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <DollarSign className="w-4 h-4" />
              <p className="text-sm">Total Cobrado</p>
            </div>
            <p className="text-3xl font-bold">${totalCobrado.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}