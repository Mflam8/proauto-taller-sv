import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Vehiculos from './pages/Vehiculos';
import Cotizaciones from './pages/Cotizaciones';
import Reportes from './pages/Reportes';
import Facturacion from './pages/Facturacion';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clientes": Clientes,
    "Vehiculos": Vehiculos,
    "Cotizaciones": Cotizaciones,
    "Reportes": Reportes,
    "Facturacion": Facturacion,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};