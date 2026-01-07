import Clientes from './pages/Clientes';
import Cotizaciones from './pages/Cotizaciones';
import Dashboard from './pages/Dashboard';
import Facturacion from './pages/Facturacion';
import Home from './pages/Home';
import Inventario from './pages/Inventario';
import Proveedores from './pages/Proveedores';
import Reportes from './pages/Reportes';
import SitioWeb from './pages/SitioWeb';
import Vehiculos from './pages/Vehiculos';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Clientes": Clientes,
    "Cotizaciones": Cotizaciones,
    "Dashboard": Dashboard,
    "Facturacion": Facturacion,
    "Home": Home,
    "Inventario": Inventario,
    "Proveedores": Proveedores,
    "Reportes": Reportes,
    "SitioWeb": SitioWeb,
    "Vehiculos": Vehiculos,
}

export const pagesConfig = {
    mainPage: "SitioWeb",
    Pages: PAGES,
    Layout: __Layout,
};