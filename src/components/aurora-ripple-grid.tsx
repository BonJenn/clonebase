'use client';

import { useEffect, useRef } from 'react';

export function AuroraRippleGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const dpr = window.devicePixelRatio || 1;
    let w = 0;
    let h = 0;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function render(timestamp: number) {
      const t = timestamp;

      // Transparent — only grid is drawn so existing background shows through
      ctx!.clearRect(0, 0, w, h);

      const gridSpacing = 60;
      const amplitude = 6;
      const waveSpeed = 0.0012;
      const waveFreq = 0.01;
      const step = 5;

      const cx = w * 0.5;
      const cy = h * 0.5;
      const maxDist = Math.sqrt(w * w + h * h) * 0.5;

      ctx!.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx!.lineWidth = 0.5;

      // Horizontal lines
      for (let gy = 0; gy <= h; gy += gridSpacing) {
        ctx!.beginPath();
        let started = false;
        for (let x = 0; x <= w; x += step) {
          const dist = Math.sqrt((x - cx) ** 2 + (gy - cy) ** 2);
          const falloff = Math.max(0, 1 - dist / maxDist);
          const offset = Math.sin(dist * waveFreq - t * waveSpeed) * amplitude * falloff;

          if (!started) {
            ctx!.moveTo(x, gy + offset);
            started = true;
          } else {
            ctx!.lineTo(x, gy + offset);
          }
        }
        ctx!.stroke();
      }

      // Vertical lines
      for (let gx = 0; gx <= w; gx += gridSpacing) {
        ctx!.beginPath();
        let started = false;
        for (let y = 0; y <= h; y += step) {
          const dist = Math.sqrt((gx - cx) ** 2 + (y - cy) ** 2);
          const falloff = Math.max(0, 1 - dist / maxDist);
          const offset = Math.sin(dist * waveFreq - t * waveSpeed) * amplitude * falloff;

          if (!started) {
            ctx!.moveTo(gx + offset, y);
            started = true;
          } else {
            ctx!.lineTo(gx + offset, y);
          }
        }
        ctx!.stroke();
      }

      animationId = requestAnimationFrame(render);
    }

    resize();
    animationId = requestAnimationFrame(render);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
