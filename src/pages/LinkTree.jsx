import React from "react";
import { motion } from "framer-motion";
import { Instagram, Facebook, Phone } from "lucide-react";

export const publicAccess = true;

const logoUrl = "https://media.base44.com/images/public/691be028b7c98b3edbc7aec7/d4efbb649_paletadecoloresproauto1ai.png";

const TikTokIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
  </svg>
);

const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const links = [
  {
    label: "Síguenos en TikTok",
    href: "https://www.tiktok.com/@proautotallersv",
    icon: TikTokIcon,
    bg: "bg-black",
    border: "border-white/30",
    hover: "hover:border-white hover:bg-white/10",
  },
  {
    label: "Síguenos en Instagram",
    href: "https://www.instagram.com/proautotallersv/",
    icon: Instagram,
    bg: "bg-gradient-to-r from-[#833ab4]/30 via-[#fd1d1d]/30 to-[#fcb045]/30",
    border: "border-[#fd1d1d]/40",
    hover: "hover:border-[#fd1d1d] hover:brightness-110",
  },
  {
    label: "Síguenos en Facebook",
    href: "https://www.facebook.com/proautotallersv/",
    icon: Facebook,
    bg: "bg-[#1877F2]/20",
    border: "border-[#1877F2]/40",
    hover: "hover:border-[#1877F2] hover:bg-[#1877F2]/30",
  },
  {
    label: "Escríbenos por WhatsApp",
    href: "https://wa.me/50368660952",
    icon: WhatsAppIcon,
    bg: "bg-[#25D366]/20",
    border: "border-[#25D366]/40",
    hover: "hover:border-[#25D366] hover:bg-[#25D366]/30",
  },
];

export default function LinkTree() {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black">
      {/* Video de fondo */}
      <div className="absolute inset-0">
        <iframe
          className="absolute top-1/2 left-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2"
          src={`https://www.youtube-nocookie.com/embed/XtUgYljaSVE?autoplay=1&mute=1&loop=1&playlist=XtUgYljaSVE&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
          allow="autoplay; fullscreen"
          frameBorder="0"
        />
        <div className="absolute inset-0 bg-black/65" />
      </div>

      {/* Contenido */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-16 flex flex-col items-center">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/20 bg-white flex items-center justify-center shadow-2xl mb-4"
        >
          <img src={logoUrl} alt="PROAUTO Taller" className="w-24 h-24 object-contain" />
        </motion.div>

        {/* Nombre */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white font-black text-2xl mb-1 tracking-wide"
        >
          PROAUTO Taller SV
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[#E31E24] font-semibold text-sm mb-10 tracking-widest uppercase"
        >
          Santa Ana, El Salvador
        </motion.p>

        {/* Botones */}
        <div className="w-full space-y-4">
          {links.map(({ label, href, icon: Icon, bg, border, hover }, i) => (
            <motion.a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-4 w-full px-6 py-4 rounded-2xl border text-white font-bold text-lg transition-all ${bg} ${border} ${hover}`}
            >
              <Icon className="w-6 h-6 flex-shrink-0" />
              {label}
            </motion.a>
          ))}
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-white/30 text-xs mt-12"
        >
          © 2026 PROAUTO Taller SV
        </motion.p>
      </div>
    </div>
  );
}