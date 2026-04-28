import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Wrench, Users, Shield, Zap, Star } from "lucide-react";
import { Link } from "react-router-dom";

export const publicAccess = true;

const logoUrl = "https://media.base44.com/images/public/691be028b7c98b3edbc7aec7/d4efbb649_paletadecoloresproauto1ai.png";

export default function Acerca() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-white flex items-center justify-center">
              <img src={logoUrl} alt="PROAUTO Taller" className="w-10 h-10 object-contain" />
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-white/80 hover:text-[#E31E24] transition-colors font-medium">Inicio</Link>
            <Link to="/Contacto" className="text-white/80 hover:text-[#E31E24] transition-colors font-medium">Contacto</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[#E31E24] font-bold mb-4 tracking-widest text-sm">QUIÉNES SOMOS</p>
          <h1 className="text-4xl md:text-6xl font-black mb-8">
            SOBRE <span className="text-[#E31E24]">PROAUTO TALLER SV</span>
          </h1>

          <div className="prose prose-lg prose-invert max-w-none space-y-6 text-white/80 leading-relaxed">
            <p className="text-xl">
              PROAUTO Taller SV es un taller automotriz especializado ubicado en Santa Ana, El Salvador, 
              dedicado a ofrecer servicios de mantenimiento preventivo y correctivo para todo tipo de vehículos.
            </p>
            <p>
              Nuestro equipo está conformado por técnicos altamente capacitados con amplia experiencia en 
              diagnóstico computarizado, reparación de motores, sistemas de frenos, suspensión y transmisión. 
              Contamos con tecnología OBD-II de última generación que nos permite diagnosticar con precisión 
              cualquier falla en todas las marcas del mercado.
            </p>
            <p>
              Atendemos tanto a propietarios de vehículos particulares como a empresas con flotas vehiculares, 
              ofreciendo soluciones integrales que reducen los tiempos de inactividad y garantizan la seguridad 
              operativa. Nuestro enfoque corporativo nos permite gestionar flotas con eficiencia, control de 
              calidad unificado y total transparencia en presupuestos.
            </p>
            <p>
              Nos diferenciamos por nuestra honestidad, transparencia y compromiso con la calidad. Cada 
              servicio que realizamos pasa por un riguroso control de calidad antes de ser entregado al cliente. 
              Creemos que la confianza se construye con resultados, y por eso cada trabajo que sale de nuestro 
              taller lleva el sello de excelencia de PROAUTO.
            </p>
            <p>
              Esta plataforma digital fue desarrollada para facilitar la gestión interna del taller: desde 
              cotizaciones y órdenes de trabajo hasta inventario y facturación, todo en un solo lugar. 
              Construida sobre tecnología moderna, permite a nuestro equipo brindar un servicio más rápido, 
              organizado y transparente a cada uno de nuestros clientes.
            </p>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              { icon: Shield, title: "Confianza", desc: "Transparencia total en cada presupuesto y diagnóstico." },
              { icon: Star, title: "Calidad", desc: "Control de calidad riguroso en cada servicio realizado." },
              { icon: Zap, title: "Eficiencia", desc: "Tecnología avanzada para diagnósticos rápidos y precisos." },
            ].map((val, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-white/10"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-xl flex items-center justify-center mb-4">
                  <val.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{val.title}</h3>
                <p className="text-white/60 text-sm">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 border-t border-white/10 text-center">
        <p className="text-white/50 text-sm">© 2026 PROAUTO Taller SV. Santa Ana, El Salvador.</p>
      </footer>
    </div>
  );
}