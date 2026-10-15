import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  Users,
  Car,
  FileText,
  ClipboardList,
  Camera,
  Package,
  Truck,
  DollarSign,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  FolderOpen,
  LayoutGrid,
  Receipt,
  ShieldCheck,
  Clock
} from "lucide-react";
import {
  esDueno, puedeVerPagina, paginaInicio, nombrePerfil, rolEfectivo, puede,
  PERFILES_ACCESO, leerPerfilSimulado, guardarPerfilSimulado, usuarioSimulado,
} from "@/lib/permissions";
import { Navigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const navigationItems = [
  { title: "Mi Taller", url: "/MiTaller", icon: Clock },
  { title: "Mis trabajos", url: "/MisTrabajos", icon: ClipboardList },
  {
    title: "Tablero Diario",
    url: "/OperacionDiaria",
    icon: LayoutGrid,
    roles: ["admin"],
  },
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    title: "Clientes",
    url: createPageUrl("Clientes"),
    icon: Users,
    roles: ["admin", "jefe_taller"],
    caps: ["gestionar_clientes"],
  },
  {
    title: "Vehículos",
    url: createPageUrl("Vehiculos"),
    icon: Car,
    roles: ["admin", "jefe_taller"],
    caps: ["gestionar_clientes"],
  },
  {
    title: "Cotizaciones",
    url: createPageUrl("Cotizaciones"),
    icon: FileText,
    roles: ["admin", "jefe_taller"],
    caps: ["asignar_trabajos"],
  },
  {
    title: "Órdenes de Trabajo",
    url: createPageUrl("OrdenesTrabajos"),
    icon: ClipboardList,
    roles: ["admin", "jefe_taller"],
  },
  {
    title: "Inspecciones",
    url: createPageUrl("Inspecciones"),
    icon: Camera,
  },
  {
    title: "Inventario",
    url: createPageUrl("Inventario"),
    icon: Package,
    roles: ["admin", "jefe_taller"],
  },
  {
    title: "Proveedores",
    url: createPageUrl("Proveedores"),
    icon: Truck,
    roles: ["admin", "jefe_taller"],
  },
  {
    title: "Facturación",
    url: createPageUrl("Facturacion"),
    icon: DollarSign,
    roles: ["admin", "jefe_taller"],
    caps: ["crear_facturas", "editar_facturas", "registrar_cobros"],
  },
  {
    title: "Empleados",
    url: createPageUrl("Empleados"),
    icon: Users,
    roles: ["admin"],
    caps: ["gestionar_empleados"],
  },
  {
    title: "Expedientes",
    url: "/Expedientes",
    icon: FolderOpen,
  },
  {
    title: "Reportes",
    url: createPageUrl("Reportes"),
    icon: BarChart3,
    roles: ["admin", "recepcion_cobros"],
  },
  {
    title: "Informe Remesas",
    url: "/InformeRemesas",
    icon: Receipt,
    roles: ["admin", "recepcion_cobros"],
  },
  {
    title: "Control Interno",
    url: "/ControlFacturas",
    icon: ShieldCheck,
    soloDueno: true,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  // Vista previa de perfiles: solo Super Admin, afecta lo que se ve en pantalla (los permisos reales no cambian).
  const perfilSimulado = esDueno(user) ? leerPerfilSimulado() : null;
  const usuarioVista = perfilSimulado ? usuarioSimulado(user, perfilSimulado) : user;
  const miRol = rolEfectivo(usuarioVista);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
    const timer = setInterval(loadUser, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  // Si es la página pública (SitioWeb), mostrar sin layout
  if (currentPageName === "SitioWeb") {
    return <>{children}</>;
  }

  if (!user) return <div className="p-6">Verificando tu acceso…</div>;
  if (user.perfil_acceso === "sin_acceso") return <div className="p-6 space-y-4"><h1 className="text-xl font-bold">Acceso no habilitado</h1><p>{user.error_acceso || "Solicita a gerencia que revise tu perfil de empleado."}</p><Button onClick={handleLogout}>Cerrar sesión</Button></div>;
  if (currentPageName === "Home" || !puedeVerPagina(usuarioVista, currentPageName)) return <Navigate to={paginaInicio(usuarioVista)} replace />;
  return (
    <SidebarProvider>
      <style>{`
        :root {
          --color-primary: #E31E24;
          --color-primary-dark: #B71C1C;
          --color-secondary: #1A1A1A;
          --color-gray-dark: #424242;
          --color-gray-medium: #757575;
          --color-gray-light: #BDBDBD;
          --color-background: #F5F5F5;
        }
      `}</style>
      
      <div className="min-h-screen flex w-full bg-[#F5F5F5]">
        <Sidebar className="border-r border-gray-200 bg-white">
          <SidebarHeader className="border-b border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-lg blur-sm opacity-75"></div>
                  <div className="relative bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-lg p-2 shadow-lg">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-900">PROAUTO</h2>
                <p className="text-xs text-[#E31E24] font-semibold">Taller SV</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">
                Navegación
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.filter((item) => {
                    if (!puedeVerPagina(usuarioVista, item.url.slice(1))) return false;
                    if (item.soloDueno && !esDueno(usuarioVista)) return false;
                    if (item.caps && !item.caps.some((c) => puede(usuarioVista, c))) return false;
                    if (item.roles && miRol !== "admin" && !item.roles.includes(miRol)) return false;
                    return true;
                  }).map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`
                            group relative overflow-hidden rounded-xl mb-1 transition-all duration-300
                            ${isActive 
                              ? 'bg-gradient-to-r from-[#E31E24] to-[#B71C1C] text-white shadow-md' 
                              : 'hover:bg-gray-50 text-gray-700'
                            }
                          `}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className="font-medium text-sm">{item.title}</span>
                            {isActive && (
                              <ChevronRight className="w-4 h-4 ml-auto" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-100 p-4">
            <div className="space-y-3">
              {user && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">
                      {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {user.full_name || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {perfilSimulado ? `Vista: ${nombrePerfil(usuarioVista)}` : nombrePerfil(user)}
                    </p>
                  </div>
                </div>
              )}
              {esDueno(user) && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 px-1">
                    Vista previa de perfiles
                  </p>
                  <Select
                    value={perfilSimulado || "real"}
                    onValueChange={(v) => {
                      guardarPerfilSimulado(v === "real" ? null : v);
                      window.location.reload();
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real">Mi cuenta (Super Admin)</SelectItem>
                      {PERFILES_ACCESO.filter((p) => p.value !== "sin_acceso").map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-2 text-gray-600 hover:text-[#E31E24] hover:bg-red-50 rounded-xl transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col bg-[#F5F5F5]">
          <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-all duration-200" />
              <h1 className="text-xl font-bold text-gray-900">PROAUTO Taller</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}