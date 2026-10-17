"use client";
// =====================================================================
// PARALLAX PELO MOUSE (computador) E PELO GIRO DO CELULAR (Android)
// O conteúdo de dentro se move um pouquinho para o lado OPOSTO do
// mouse / da inclinação do aparelho → sensação de profundidade 3D.
// =====================================================================
import { useEffect, useRef, type ReactNode } from "react";

export default function ParallaxMouse({ children, forca = 18, className = "" }: { children: ReactNode; forca?: number; className?: string }) {
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mover = (x: number, y: number) => {
      if (caixa.current) caixa.current.style.transform = `translate3d(${-x * forca}px, ${-y * forca}px, 0)`;
    };
    // Mouse: posição de -0,5 a 0,5 em cada eixo
    const aoMover = (e: PointerEvent) => mover(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
    // Celular: inclinação (só onde o aparelho libera sem pedir permissão)
    const aoGirar = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      mover(Math.max(-1, Math.min(1, e.gamma / 30)) / 2, Math.max(-1, Math.min(1, (e.beta - 45) / 30)) / 2);
    };
    window.addEventListener("pointermove", aoMover, { passive: true });
    window.addEventListener("deviceorientation", aoGirar, { passive: true });
    return () => {
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("deviceorientation", aoGirar);
    };
  }, [forca]);

  return (
    <div ref={caixa} className={className} style={{ transition: "transform 0.25s ease-out", willChange: "transform" }}>
      {children}
    </div>
  );
}
