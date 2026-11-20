import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Clock, Wrench, FolderOpen, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ITEMS = [
  { label: "Mi taller", to: "/MiTaller", icon: Clock },
  { label: "Mis trabajos", to: "/MisTrabajos", icon: Wrench },
  { label: "Expedientes", to: "/Expedientes", icon: FolderOpen },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const activo = (to) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4">
        {ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[11px] font-medium transition-colors ${
              activo(item.to) ? "text-[#E31E24]" : "text-gray-500"
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => base44.auth.logout()}
          className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[11px] font-medium text-gray-500"
        >
          <LogOut className="w-5 h-5" />
          Salir
        </button>
      </div>
    </nav>
  );
}