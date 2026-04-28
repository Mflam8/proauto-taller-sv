import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Users, TrendingUp, TrendingDown, Eye, Clock, Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function StatChip({ label, value, prev }) {
  const pct = prev > 0 ? (((value - prev) / prev) * 100).toFixed(1) : null;
  const up = pct !== null && parseFloat(pct) >= 0;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' && value > 100 ? value.toLocaleString() : value}</p>
      {pct !== null && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {up ? '+' : ''}{pct}% vs semana ant.
        </div>
      )}
    </div>
  );
}

export default function AnalyticsWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke('analyticsData', {});
    setData(res.data);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds for realtime data
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <Card className="border-0 shadow-lg col-span-full">
        <CardContent className="p-8 flex items-center justify-center gap-3 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Cargando datos de Google Analytics...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg col-span-full">
        <CardContent className="p-8 text-center text-red-500">{error}</CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { realtimeActiveUsers, realtimeByCountry, trends, currentSummary, previousSummary, propertyName } = data;

  const last14 = trends.slice(-14);

  return (
    <div className="col-span-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl">
            <Globe className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Google Analytics</h2>
            <p className="text-xs text-gray-500">{propertyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="text-xs text-gray-400">Actualizado: {lastUpdated.toLocaleTimeString()}</p>
          )}
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Realtime + KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Realtime active users - highlighted */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-[#E31E24] to-[#B71C1C] text-white col-span-2 md:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <p className="text-xs text-white/80 font-medium">EN VIVO</p>
            </div>
            <p className="text-4xl font-black">{realtimeActiveUsers}</p>
            <p className="text-sm text-white/80 mt-1">Usuarios activos ahora</p>
          </CardContent>
        </Card>

        {/* KPIs */}
        <Card className="border-0 shadow-md bg-white col-span-2 md:col-span-1">
          <CardContent className="p-5">
            <StatChip
              label="Sesiones (7d)"
              value={currentSummary.sessions}
              prev={previousSummary.sessions}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white col-span-2 md:col-span-1">
          <CardContent className="p-5">
            <StatChip
              label="Usuarios (7d)"
              value={currentSummary.users}
              prev={previousSummary.users}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white col-span-2 md:col-span-1">
          <CardContent className="p-5">
            <StatChip
              label="Páginas vistas (7d)"
              value={currentSummary.pageViews}
              prev={previousSummary.pageViews}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white col-span-2 md:col-span-1">
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 mb-1">Duración media sesión</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.floor(currentSummary.avgDuration / 60)}m {Math.round(currentSummary.avgDuration % 60)}s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart + Top Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800">Sesiones y Usuarios — últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E31E24" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E31E24" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="sessions" stroke="#E31E24" fill="url(#gradSessions)" strokeWidth={2} name="Sesiones" />
                <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="url(#gradUsers)" strokeWidth={2} name="Usuarios" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800">Usuarios activos por país</CardTitle>
          </CardHeader>
          <CardContent>
            {realtimeByCountry.length > 0 ? (
              <div className="space-y-3">
                {realtimeByCountry.map((item, i) => {
                  const max = realtimeByCountry[0].users;
                  const pct = max > 0 ? (item.users / max) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{item.country}</span>
                        <span className="text-gray-900 font-bold">{item.users}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-[#E31E24] to-[#B71C1C] h-1.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Sin usuarios activos en este momento</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}