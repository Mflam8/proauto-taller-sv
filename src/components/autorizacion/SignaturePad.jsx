import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

export default function SignaturePad({ value, onChange, disabled }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1A1A1A";
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasContent(true);
      };
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const start = (e) => {
    if (disabled) return;
    e.preventDefault();
    setDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!drawing || disabled) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasContent(true);
  };

  const end = (e) => {
    if (!drawing) return;
    if (e.preventDefault) e.preventDefault();
    setDrawing(false);
    const canvas = canvasRef.current;
    onChange && onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    onChange && onChange("");
  };

  return (
    <div className="w-full">
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={640}
          height={200}
          className="w-full h-40 touch-none block"
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={end}
        />
        {!hasContent && !disabled && (
          <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none select-none">
            Firme aquí
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