import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Esta página es pública - no requiere login
export const publicAccess = true;

import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Phone, MapPin, Clock, CheckCircle, Wrench,
  Cpu, Shield, Droplets, Car, ChevronDown,
  Instagram, Facebook, MessageCircle, Star, Zap, Heart, Settings } from
"lucide-react";

const logoUrl = "https://media.base44.com/images/public/691be028b7c98b3edbc7aec7/d4efbb649_paletadecoloresproauto1ai.png";
const teamUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691be028b7c98b3edbc7aec7/447e954a9_542751085_122113388192973884_7116183096071181930_n.jpg";

const TikTokIcon = ({ className }) =>
<svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
  </svg>;


const WhatsAppIcon = ({ className }) =>
<svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>;


export default function SitioWeb() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsLoggedIn);
  }, []);

  const handleGestion = () => {
    if (isLoggedIn) {
      window.location.href = "/Dashboard";
    } else {
      base44.auth.redirectToLogin("/Dashboard");
    }
  };

  const servicios = [
  { icon: Wrench, title: "Mantenimiento Preventivo y Correctivo", desc: "Mantenimientos periódicos por kilometraje: cambios de aceite, filtros, bujías y fluidos." },
  { icon: Cpu, title: "Diagnóstico Computarizado OBD-II", desc: "Contamos con tecnología avanzada para diagnosticar todas las marcas del mercado." },
  { icon: Shield, title: "Reparación de Frenos", desc: "Mantenimiento de sistemas de frenos, suspensión y dirección." },
  { icon: Droplets, title: "Reparación de Motor y Transmisión", desc: "Reparaciones completas de motor, transmisión y sistemas de inyección." },
  { icon: Zap, title: "Enderezado y Pintura", desc: "Restauración de chasis, pintura en cabina con secado térmico y colorimetría de precisión." },
  { icon: Car, title: "Servicios para Flotas", desc: "Mantenimiento especializado para flotas empresariales con eficiencia operativa." }];


  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* Navbar Flotante */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <motion.div
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-white flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}>
            <img src={logoUrl} alt="PROAUTO Taller" className="w-10 h-10 object-contain" />
          </motion.div>
          
          <div className="hidden md:flex items-center gap-8">
            {["Servicios", "Nosotros", "Contacto"].map((item) =>
            <motion.a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-white/80 hover:text-[#E31E24] transition-colors font-medium"
              whileHover={{ y: -2 }}>
              
                {item}
              </motion.a>
            )}
          </div>
          <button
            onClick={handleGestion}
            className="hidden md:flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            {isLoggedIn ? "Panel" : "Gestión"}
          </button>
          <motion.a
            href="tel:+50368660952"
            className="bg-[#E31E24] hover:bg-[#B71C1C] px-6 py-2 rounded-full font-bold transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}>
            
            ¡Llámanos!
          </motion.a>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="min-h-screen relative flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <iframe
            className="absolute top-1/2 left-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2"
            src="https://www.youtube.com/embed/XtUgYljaSVE?autoplay=1&mute=1&loop=1&playlist=XtUgYljaSVE&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
            allow="autoplay; fullscreen"
            frameBorder="0" />
          
          <div className="absolute inset-0 bg-black/60"></div>
          {/* Partículas decorativas animadas */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#E31E24]/10 rounded-full blur-3xl pointer-events-none" />
          
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#E31E24]/10 rounded-full blur-3xl pointer-events-none" />
          
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white/20 bg-white mx-auto mb-8 flex items-center justify-center shadow-2xl">
            <img src={logoUrl} alt="PROAUTO Taller" className="w-36 h-36 md:w-48 md:h-48 object-contain" />
          </motion.div>

          















          

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            
            <motion.a
              href="https://wa.me/50368660952"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-[#25D366] text-white text-xl px-12 py-5 rounded-xl font-bold shadow-lg shadow-[#25D366]/40"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}>
              
              <WhatsAppIcon className="w-7 h-7" />
              Escríbenos por WhatsApp
            </motion.a>
            <motion.a
              href="tel:+50368660952"
              className="flex items-center justify-center gap-3 bg-[#E31E24] text-white text-xl px-12 py-5 rounded-xl font-bold shadow-lg shadow-[#E31E24]/40"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}>
              
              <Phone className="w-7 h-7" />
              Llámanos ahora
            </motion.a>
          </motion.div>
        </div>

        <motion.div
          style={{ opacity }}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2">
          
          <ChevronDown className="w-10 h-10 text-white/50" />
        </motion.div>
      </section>

      {/* Trust Badges Ticker */}
      <section className="py-12 bg-gradient-to-r from-[#E31E24] to-[#B71C1C] relative overflow-hidden">
        <motion.div
          animate={{ x: [0, -1200] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="flex gap-16 whitespace-nowrap">
          
          {[...Array(4)].map((_, i) =>
          <div key={i} className="flex gap-16 items-center">
              <span className="flex items-center gap-2 text-xl font-bold"><Shield className="w-6 h-6" /> CONFIANZA</span>
              <span className="flex items-center gap-2 text-xl font-bold"><Star className="w-6 h-6" /> CALIDAD</span>
              <span className="flex items-center gap-2 text-xl font-bold"><Zap className="w-6 h-6" /> EFICIENCIA</span>
              <span className="flex items-center gap-2 text-xl font-bold"><CheckCircle className="w-6 h-6" /> TRANSPARENCIA</span>
              <span className="flex items-center gap-2 text-xl font-bold"><Heart className="w-6 h-6" /> INNOVACIÓN</span>
            </div>
          )}
        </motion.div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="py-24 bg-black relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            
            <p className="text-[#E31E24] font-bold mb-4 tracking-widest">NUESTROS SERVICIOS</p>
            <h2 className="text-4xl md:text-6xl font-black">
              SERVICIOS ESPECIALIZADOS DE <span className="text-[#E31E24]">ALTA CALIDAD</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((servicio, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.03, y: -8 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl border border-white/10 hover:border-[#E31E24]/50 transition-all group cursor-pointer">
              
                <motion.div
                whileHover={{ rotate: 12, scale: 1.15 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-16 h-16 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-[#E31E24]/30 transition-all">
                
                  <servicio.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-[#E31E24] transition-colors">{servicio.title}</h3>
                <p className="text-white/60">{servicio.desc}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Nosotros */}
      <section id="nosotros" className="py-24 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}>
              
              <p className="text-[#E31E24] font-bold mb-4 tracking-widest">¿QUIÉNES SOMOS?</p>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                PERSONAL ALTAMENTE <span className="text-[#E31E24]">CAPACITADO</span>
              </h2>
              <p className="text-xl text-white/70 mb-8">
                Especialistas en el mantenimiento preventivo y correctivo de vehículos, con un enfoque corporativo
                para flotas empresariales. <strong className="text-white">Nuestro compromiso es garantizar la productividad
                de tu empresa</strong> reduciendo tiempos de inactividad y optimizando la seguridad de tu flota.
              </p>

              <div className="space-y-4">
                {[
                "Técnicos certificados con amplia experiencia",
                "Tecnología de diagnóstico avanzada",
                "Control de calidad unificado",
                "Transparencia en presupuestos y gestión"].
                map((item, i) =>
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="flex items-center gap-3">
                  
                    <div className="w-8 h-8 bg-[#E31E24] rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="text-lg">{item}</span>
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative">
              
              <div className="absolute -inset-4 bg-gradient-to-r from-[#E31E24] to-[#B71C1C] rounded-3xl blur-2xl opacity-30"></div>
              <img src={teamUrl} alt="Equipo PROAUTO Taller" className="relative rounded-3xl shadow-2xl w-full" />

            </motion.div>
          </div>
        </div>
      </section>

      {/* Contacto — Sin formulario */}
      <section id="contacto" className="py-24 bg-black relative overflow-hidden">
        {/* Fondo decorativo */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-96 h-96 border border-[#E31E24]/10 rounded-full pointer-events-none" />
        
        <motion.div
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-80 h-80 border border-[#E31E24]/10 rounded-full pointer-events-none" />
        

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            
            <p className="text-[#E31E24] font-bold mb-4 tracking-widest">CONTÁCTANOS</p>
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              ¿LISTO PARA <span className="text-[#E31E24]">AGENDAR?</span>
            </h2>
            <p className="text-white/70 text-xl mb-12 max-w-2xl mx-auto">
              Comunícate con nosotros por el canal que prefieras. Estamos listos para atenderte.
            </p>
          </motion.div>

          {/* CTA Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* WhatsApp */}
            <motion.a
              href="https://wa.me/50368660952"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-br from-[#25D366]/20 to-[#128C7E]/20 border border-[#25D366]/30 hover:border-[#25D366] p-8 rounded-3xl flex flex-col items-center gap-4 cursor-pointer transition-all group">
              
              <motion.div
                whileHover={{ rotate: 15, scale: 1.2 }}
                className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:shadow-[#25D366]/40 transition-all">
                
                <WhatsAppIcon className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold">WhatsApp</h3>
              <p className="text-white/60 text-sm">Escríbenos directo</p>
              <p className="text-[#25D366] font-bold">+503 6866-0952</p>
            </motion.a>

            {/* Llamar */}
            <motion.a
              href="tel:+50224068129"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-br from-[#E31E24]/20 to-[#B71C1C]/20 border border-[#E31E24]/30 hover:border-[#E31E24] p-8 rounded-3xl flex flex-col items-center gap-4 cursor-pointer transition-all group">
              
              <motion.div
                whileHover={{ rotate: -15, scale: 1.2 }}
                className="w-16 h-16 bg-[#E31E24] rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:shadow-[#E31E24]/40 transition-all">
                
                <Phone className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold">Teléfono</h3>
              <p className="text-white/60 text-sm">Llámanos directo</p>

            </motion.a>

            {/* Ubicación */}
            <motion.a
              href="https://maps.app.goo.gl/hkRrKc9riE1U5xny8"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-white/30 p-8 rounded-3xl flex flex-col items-center gap-4 cursor-pointer transition-all group">
              
              <motion.div
                whileHover={{ rotate: 10, scale: 1.2 }}
                className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:shadow-lg transition-all">
                
                <MapPin className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold">Visítanos</h3>
              <p className="text-white/60 text-sm text-center">8a Av Sur, entre 27 y 29 Calle Pte</p>
              <p className="text-white font-bold">Santa Ana</p>
            </motion.a>
          </div>

          {/* Horario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3 text-white/60 mb-12">
            
            <Clock className="w-5 h-5 text-[#E31E24]" />
            <div className="text-lg text-left">
              <p>Lun – Vie: 8:00 AM – 5:00 PM</p>
              <p>Sáb: 8:00 AM – 12:00 PM</p>
              <p className="text-sm text-[#E31E24] font-semibold">¡Sin cerrar al medio día!</p>
            </div>
          </motion.div>

          {/* Redes sociales */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}>
            
            <p className="text-white/50 mb-6 text-sm tracking-widest uppercase">Síguenos en redes</p>
            <div className="flex gap-4 justify-center">
              {[
              { href: "https://www.instagram.com/proautotallersv/", icon: <Instagram className="w-6 h-6" />, label: "Instagram" },
              { href: "https://www.facebook.com/proautotallersv/", icon: <Facebook className="w-6 h-6" />, label: "Facebook" },
              { href: "https://www.tiktok.com/@proautotallersv", icon: <TikTokIcon className="w-6 h-6" />, label: "TikTok" },
              { href: "https://wa.me/50368660952", icon: <WhatsAppIcon className="w-6 h-6" />, label: "WhatsApp" }].
              map(({ href, icon, label }) =>
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#E31E24] transition-colors"
                whileHover={{ scale: 1.2, rotate: 8 }}
                whileTap={{ scale: 0.9 }}>
                
                  {icon}
                </motion.a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Burbuja flotante WhatsApp */}
      <motion.a
        href="https://wa.me/50368660952"
        target="_blank"
        rel="noopener noreferrer"
        title="Chatea por WhatsApp"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}>
        
        <WhatsAppIcon className="w-9 h-9 text-white" />
      </motion.a>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-white flex items-center justify-center">
                <img src={logoUrl} alt="PROAUTO Taller" className="w-10 h-10 object-contain" />
              </div>
            <div className="text-center space-y-2">
              <div className="flex gap-6 justify-center">
                <Link to="/Acerca" className="text-white/50 hover:text-[#E31E24] text-sm transition-colors">Nosotros</Link>
                <Link to="/Contacto" className="text-white/50 hover:text-[#E31E24] text-sm transition-colors">Contacto</Link>
              </div>
              <p className="text-white/50 text-sm">
                © 2026 PROAUTO Taller SV. Santa Ana, El Salvador.
              </p>
            </div>
            <div className="flex gap-4">
              {[
              { href: "https://www.instagram.com/proautotallersv/", icon: <Instagram className="w-5 h-5" /> },
              { href: "https://www.facebook.com/proautotallersv/", icon: <Facebook className="w-5 h-5" /> },
              { href: "https://www.tiktok.com/@proautotallersv", icon: <TikTokIcon className="w-5 h-5" /> },
              { href: "https://wa.me/50368660952", icon: <WhatsAppIcon className="w-5 h-5" /> }].
              map(({ href, icon }, i) =>
              <motion.a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-[#E31E24] transition-colors"
                whileHover={{ scale: 1.2 }}>
                
                  {icon}
                </motion.a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>);

}