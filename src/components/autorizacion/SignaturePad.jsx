import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

// SignaturePad: usa Pointer Events (mouse, touch y l\u00e1piz unificados) + canvas
// de alta resoluci\u00f3n para firmas n\u00edtidas en celular y laptop.
export default function SignaturePad({ value, onChange, disabled }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [hasContent, setHasContent] = useState(false);

  // (Re)dibuja la firma guardada cuando cambia el valor externo (p.ej. al cargar).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasContent(true);
      };
      img.src = value;
    }
  }, [value]);

  // Ajusta el canvas al tama\u00f1o real del contenedor con devicePixelRatio para nitidez.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = wrapper.getBoundingClientRect();
      const w = Math.max(rect.width, 200);
      const h = 160;
      // Guarda contenido previo
      const prev = canvas.toDataURL("image/png");
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1A1A1A";
      if (prev && prev !== "data:,") {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, w, h);
        };
        img.src = prev;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e) => {
    if (disabled) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handlePointerMove = (e) => {
    if (disabled || !e.buttons || !e.pressure) {
      // pressure 0 cuando no presiona; permite mouse sin bot\u00f3n
    }
    if (disabled) return;
    if (e.buttons === 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (!hasContent) setHasContent(true);
  };

  const handlePointerUp = (e) => {
    if (disabled) return;
    e.preventDefault();
    try {
      canvasRef.current.releasePointerCapture(e.pointerId);
    } catch (_) { /* noop */ }
    const ctx = canvasRef.current.getContext("2d");
    ctx.closePath();
    onChange && onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    onChange && onChange("");
  }, [onChange]);

  return (
    <div className="w-full">
      <div
        ref={wrapperRef}
        className="relative border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden touch-none select-none"
        style={{ height: 160 }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full touch-none"
          style={{ touchAction: "none", height: 160 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        {!hasContent && !disabled && (
          <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none select-none">
            Firme aqu\u00ed
          </span>
        )}
      </div>
      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={clear} className="mt-2 gap-1.5">
          <Eraser className="w-3.5 h-3.5" /> Limpiar firma
        </Button>
      )}
    </div>
  );
}