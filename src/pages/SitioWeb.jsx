import React, { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { base44 } from "@/api/base44Client";

// Esta página es pública - no requiere login
export const publicAccess = true;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Phone, Mail, MapPin, Clock, CheckCircle, Wrench, 
  Cpu, Shield, Droplets, Car, ChevronDown, Send,
  Instagram, Facebook, MessageCircle, Star, Zap, Heart
} from "lucide-react";

const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691be028b7c98b3edbc7aec7/3eecc496c_527724637_10228100711375307_2433035938491200389_n.jpg";
const teamUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691be028b7c98b3edbc7aec7/447e954a9_542751085_122113388192973884_7116183096071181930_n.jpg";

export default function SitioWeb() {
  const [formData, setFormData] = useState({
    nombre: "", apellido: "", telefono: "", correo: "", mensaje: ""
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const servicios = [
    { icon: Wrench, title: "Mecánica General", desc: "Gasolina y Diesel. Lo arreglamos todo, sin excusas." },
    { icon: Cpu, title: "Diagnóstico Computarizado", desc: "Tecnología de punta para saber exactamente qué tiene tu auto." },
    { icon: Shield, title: "Sistema de Frenos", desc: "Tu seguridad es lo primero. Frenos que de verdad frenan." },
    { icon: Droplets, title: "Cambio de Aceite", desc: "Rápido, sin cita y con los mejores lubricantes del mercado." },
    { icon: Zap, title: "Sistema GDI", desc: "Especialistas en inyección directa. Sí, sabemos lo que es." },
    { icon: Car, title: "Avalúo de Vehículos", desc: "¿Vas a comprar o vender? Te decimos la verdad." },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await base44.entities.ContactoWeb.create(formData);
    setSending(false);
    setSent(true);
    setFormData({ nombre: "", apellido: "", telefono: "", correo: "", mensaje: "" });
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navbar Flotante */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src={logoUrl} alt="PROAUTO Taller" className="h-12 object-contain" />
          <div className="hidden md:flex items-center gap-8">
            <a href="#servicios" className="text-white/80 hover:text-[#E31E24] transition-colors">Servicios</a>
            <a href="#nosotros" className="text-white/80 hover:text-[#E31E24] transition-colors">Nosotros</a>
            <a href="#contacto" className="text-white/80 hover:text-[#E31E24] transition-colors">Contacto</a>
          </div>
          <a href="tel:68660952" className="bg-[#E31E24] hover:bg-[#B71C1C] px-6 py-2 rounded-full font-bold transition-all hover:scale-105">
            ¡Llámanos!
          </a>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="min-h-screen relative flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-[#E31E24]/20 to-transparent rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-[#E31E24]/10 to-transparent rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[#E31E24] font-bold text-lg md:text-xl mb-4 tracking-wider"
            >
              🔧 SANTA ANA, EL SALVADOR
            </motion.p>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
              <span className="text-white">¿CANSADO DE </span>
              <motion.span 
                animate={{ color: ["#E31E24", "#ff4444", "#E31E24"] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[#E31E24]"
              >
                MECÁNICOS
              </motion.span>
              <br />
              <span className="text-white">QUE TE </span>
              <span className="line-through text-white/50">MIENTEN</span>
              <span className="text-white">?</span>
            </h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-10"
            >
              Somos el taller donde tu auto <span className="text-[#E31E24] font-bold">SÍ está seguro</span>. 
              Sin sorpresas, sin excusas, sin "ya casi está".
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <a href="#contacto">
                <Button className="bg-[#E31E24] hover:bg-[#B71C1C] text-white text-lg px-10 py-6 rounded-full font-bold shadow-lg shadow-[#E31E24]/30 hover:shadow-[#E31E24]/50 transition-all hover:scale-105">
                  <Car className="w-6 h-6 mr-2" />
                  ¡TRAE TU VEHÍCULO!
                </Button>
              </a>
              <a href="https://wa.me/50368660952" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-2 border-white/30 text-white text-lg px-10 py-6 rounded-full font-bold hover:bg-white/10 transition-all hover:scale-105">
                  <MessageCircle className="w-6 h-6 mr-2" />
                  WhatsApp
                </Button>
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            style={{ opacity }}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="w-10 h-10 text-white/50" />
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-gradient-to-r from-[#E31E24] to-[#B71C1C] relative overflow-hidden">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-16 whitespace-nowrap"
        >
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-16 items-center">
              <span className="flex items-center gap-2 text-xl font-bold"><CheckCircle className="w-6 h-6" /> SIN SORPRESAS</span>
              <span className="flex items-center gap-2 text-xl font-bold"><Star className="w-6 h-6" /> +500 CLIENTES FELICES</span>
              <span className="flex items-center gap-2 text-xl font-bold"><Heart className="w-6 h-6" /> GARANTÍA EN TODO</span>
              <span className="flex items-center gap-2 text-xl font-bold"><Zap className="w-6 h-6" /> DIAGNÓSTICO GRATIS</span>
              <span className="flex items-center gap-2 text-xl font-bold"><Shield className="w-6 h-6" /> PROFESIONALES CERTIFICADOS</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="py-24 bg-black relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-[#E31E24] font-bold mb-4">NUESTROS SERVICIOS</p>
            <h2 className="text-4xl md:text-6xl font-black">
              TODO LO QUE TU AUTO <span className="text-[#E31E24]">NECESITA</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((servicio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl border border-white/10 hover:border-[#E31E24]/50 transition-all group cursor-pointer"
              >
                <motion.div 
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className="w-16 h-16 bg-gradient-to-br from-[#E31E24] to-[#B71C1C] rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-[#E31E24]/30 transition-all"
                >
                  <servicio.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-[#E31E24] transition-colors">{servicio.title}</h3>
                <p className="text-white/60">{servicio.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Nosotros / Equipo */}
      <section id="nosotros" className="py-24 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-[#E31E24] font-bold mb-4">CONOCE A NUESTRO EQUIPO</p>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                MECÁNICOS DE <span className="text-[#E31E24]">VERDAD</span>
              </h2>
              <p className="text-xl text-white/70 mb-8">
                No somos como los demás. Aquí no te vamos a inventar piezas que no necesitas, 
                ni te vamos a cobrar por arreglos fantasma. <strong className="text-white">Punto.</strong>
              </p>
              
              <div className="space-y-4">
                {[
                  "Diagnóstico honesto y transparente",
                  "Precios justos sin letra pequeña",
                  "Te explicamos TODO antes de tocar tu auto",
                  "Garantía en todos nuestros trabajos"
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-[#E31E24] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="text-lg">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-[#E31E24] to-[#B71C1C] rounded-3xl blur-2xl opacity-30"></div>
              <img 
                src={teamUrl} 
                alt="Equipo PROAUTO Taller" 
                className="relative rounded-3xl shadow-2xl w-full"
              />
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -bottom-6 -right-6 bg-[#E31E24] text-white p-6 rounded-2xl shadow-xl"
              >
                <p className="text-3xl font-black">+10</p>
                <p className="text-sm">Años de experiencia</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Formulario de Contacto */}
      <section id="contacto" className="py-24 bg-black relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-[#E31E24] font-bold mb-4">¿LISTO PARA VISITARNOS?</p>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                CONTÁCTANOS <span className="text-[#E31E24]">YA</span>
              </h2>
              <p className="text-xl text-white/70 mb-10">
                Deja tus datos y te contactamos. O mejor aún, 
                <strong className="text-[#E31E24]"> ¡ven a visitarnos!</strong>
              </p>

              <div className="space-y-6">
                <a href="tel:24068129" className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                  <div className="w-14 h-14 bg-[#E31E24] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Llámanos</p>
                    <p className="text-xl font-bold">2406-8129 / 6866-0952</p>
                  </div>
                </a>

                <a href="https://maps.google.com/?q=8a+Av+Sur+Santa+Ana+El+Salvador" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                  <div className="w-14 h-14 bg-[#E31E24] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Encuéntranos</p>
                    <p className="text-xl font-bold">8a Av Sur, entre 27 y 29 Calle Pte, Santa Ana</p>
                  </div>
                </a>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                  <div className="w-14 h-14 bg-[#E31E24] rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Horario</p>
                    <p className="text-xl font-bold">Lun - Sáb: 8:00 AM - 5:00 PM</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <a href="https://instagram.com/proautotaller" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#E31E24] transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="https://facebook.com/proautotaller" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#E31E24] transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
                <a href="https://wa.me/50368660952" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#E31E24] transition-colors">
                  <MessageCircle className="w-6 h-6" />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {sent ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-br from-green-900/50 to-green-800/50 p-12 rounded-3xl border border-green-500/30 text-center h-full flex flex-col items-center justify-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6"
                  >
                    <CheckCircle className="w-12 h-12" />
                  </motion.div>
                  <h3 className="text-3xl font-bold mb-4">¡Mensaje Enviado!</h3>
                  <p className="text-white/70 text-lg">Te contactaremos muy pronto. ¡Gracias por confiar en nosotros!</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 md:p-10 rounded-3xl border border-white/10">
                  <h3 className="text-2xl font-bold mb-6">Déjanos tu mensaje</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-white/50 text-sm mb-2 block">Nombre *</label>
                      <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        placeholder="Tu nombre"
                        required
                        className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus:border-[#E31E24]"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-sm mb-2 block">Apellido</label>
                      <Input
                        value={formData.apellido}
                        onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                        placeholder="Tu apellido"
                        className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus:border-[#E31E24]"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-white/50 text-sm mb-2 block">Teléfono *</label>
                    <Input
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      placeholder="0000-0000"
                      required
                      className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus:border-[#E31E24]"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="text-white/50 text-sm mb-2 block">Correo</label>
                    <Input
                      type="email"
                      value={formData.correo}
                      onChange={(e) => setFormData({...formData, correo: e.target.value})}
                      placeholder="tu@correo.com"
                      className="bg-white/5 border-white/10 h-12 text-white placeholder:text-white/30 focus:border-[#E31E24]"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="text-white/50 text-sm mb-2 block">¿Cómo podemos ayudarte? *</label>
                    <Textarea
                      value={formData.mensaje}
                      onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                      placeholder="Cuéntanos sobre tu vehículo o qué servicio necesitas..."
                      required
                      rows={4}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#E31E24] resize-none"
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={sending}
                    className="w-full bg-[#E31E24] hover:bg-[#B71C1C] text-white text-lg py-6 rounded-xl font-bold transition-all hover:scale-[1.02]"
                  >
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                          ⏳
                        </motion.div>
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        ENVIAR MENSAJE
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img src={logoUrl} alt="PROAUTO Taller" className="h-16 object-contain" />
            <p className="text-white/50 text-center">
              © 2024 PROAUTO Taller. Tu auto seguro, en tu taller de confianza.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com/proautotaller" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-[#E31E24] transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="https://facebook.com/proautotaller" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-[#E31E24] transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="https://wa.me/50368660952" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-[#E31E24] transition-colors">
                <MessageCircle className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}