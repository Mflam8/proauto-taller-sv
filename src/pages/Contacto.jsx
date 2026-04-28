import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, Clock, Instagram, Facebook, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const publicAccess = true;

const logoUrl = "https://media.base44.com/images/public/691be028b7c98b3edbc7aec7/d4efbb649_paletadecoloresproauto1ai.png";

const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const TikTokIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
  </svg>
);

export default function Contacto() {
  const [form, setForm] = useState({ nombre: "", telefono: "", mensaje: "" });
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.ContactoWeb.create({ ...form });
    setEnviado(true);
    setLoading(false);
  };

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
            <Link to="/Acerca" className="text-white/80 hover:text-[#E31E24] transition-colors font-medium">Nosotros</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-[#E31E24] font-bold mb-4 tracking-widest text-sm">COMUNÍCATE</p>
          <h1 className="text-4xl md:text-6xl font-black mb-12">
            CONTÁCTANOS
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Info de contacto */}
            <div className="space-y-6">
              <motion.a
                href="https://wa.me/50368660952"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-4 p-5 bg-gradient-to-br from-[#25D366]/20 to-[#128C7E]/20 border border-[#25D366]/30 hover:border-[#25D366] rounded-2xl transition-all"
              >
                <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
                  <WhatsAppIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg">WhatsApp</p>
                  <p className="text-white/70">+503 6866-0952</p>
                </div>
              </motion.a>

              <motion.a
                href="tel:+50224068129"
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-4 p-5 bg-gradient-to-br from-[#E31E24]/20 to-[#B71C1C]/20 border border-[#E31E24]/30 hover:border-[#E31E24] rounded-2xl transition-all"
              >
                <div className="w-12 h-12 bg-[#E31E24] rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg">Teléfono</p>
                  <p className="text-white/70">Llámanos directo</p>
                </div>
              </motion.a>

              <motion.a
                href="https://maps.app.goo.gl/hkRrKc9riE1U5xny8"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 hover:border-white/30 rounded-2xl transition-all"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg">Ubicación</p>
                  <p className="text-white/70">8a Av Sur, entre 27 y 29 Calle Pte, Santa Ana</p>
                </div>
              </motion.a>

              <div className="flex items-center gap-3 text-white/60 px-2">
                <Clock className="w-5 h-5 text-[#E31E24] flex-shrink-0" />
                <div>
                <p>Lun – Vie: 8:00 AM – 5:00 PM</p>
                <p>Sáb: 8:00 AM – 12:00 PM</p>
                <p className="text-sm text-[#E31E24] font-semibold">¡Sin cerrar al medio día!</p>
              </div>
              </div>

              {/* Redes sociales */}
              <div className="pt-4">
                <p className="text-white/50 text-sm mb-4 tracking-widest uppercase">Síguenos</p>
                <div className="flex gap-3">
                  {[
                    { href: "https://www.instagram.com/proautotallersv/", icon: <Instagram className="w-5 h-5" /> },
                    { href: "https://www.facebook.com/proautotallersv/", icon: <Facebook className="w-5 h-5" /> },
                    { href: "https://www.tiktok.com/@proautotallersv", icon: <TikTokIcon className="w-5 h-5" /> },
                    { href: "https://wa.me/50368660952", icon: <WhatsAppIcon className="w-5 h-5" /> },
                  ].map(({ href, icon }, i) => (
                    <motion.a
                      key={i}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#E31E24] transition-colors"
                      whileHover={{ scale: 1.15 }}
                    >
                      {icon}
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl border border-white/10">
              {enviado ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">¡Mensaje enviado!</h3>
                  <p className="text-white/60">Nos pondremos en contacto contigo pronto.</p>
                </motion.div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-6">Envíanos un mensaje</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm text-white/60 mb-1 block">Nombre *</label>
                      <Input
                        required
                        value={form.nombre}
                        onChange={e => setForm({ ...form, nombre: e.target.value })}
                        placeholder="Tu nombre"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#E31E24]"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-1 block">Teléfono *</label>
                      <Input
                        required
                        value={form.telefono}
                        onChange={e => setForm({ ...form, telefono: e.target.value })}
                        placeholder="Tu teléfono"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#E31E24]"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-1 block">Mensaje *</label>
                      <textarea
                        required
                        value={form.mensaje}
                        onChange={e => setForm({ ...form, mensaje: e.target.value })}
                        placeholder="¿En qué podemos ayudarte?"
                        rows={4}
                        className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-[#E31E24] rounded-md px-3 py-2 text-sm outline-none resize-none focus:ring-1 focus:ring-[#E31E24]"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#E31E24] to-[#B71C1C] hover:from-[#B71C1C] hover:to-[#E31E24] text-white font-bold py-3 rounded-xl"
                    >
                      {loading ? "Enviando..." : "Enviar Mensaje"}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <footer className="py-8 bg-gray-900 border-t border-white/10 text-center">
        <p className="text-white/50 text-sm">© 2026 PROAUTO Taller SV. Santa Ana, El Salvador.</p>
      </footer>
    </div>
  );
}