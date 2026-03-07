import { useEffect, useRef } from 'react';

export default function Waveform({ state = 'idle', color = '#0ABAB5' }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const mid = h / 2;

      ctx.clearRect(0, 0, w, h);

      const barCount = 40;
      const barWidth = Math.max(2, (w / barCount) * 0.6);
      const gap = w / barCount;

      for (let i = 0; i < barCount; i++) {
        const x = i * gap + gap / 2 - barWidth / 2;
        let amplitude;

        if (state === 'idle') {
          amplitude = 3 + Math.sin(phaseRef.current + i * 0.3) * 2;
        } else if (state === 'listening') {
          amplitude = 5 + Math.sin(phaseRef.current * 2 + i * 0.4) * (12 + Math.sin(phaseRef.current + i * 0.15) * 8);
        } else {
          // speaking
          amplitude = 8 + Math.sin(phaseRef.current * 3 + i * 0.5) * (15 + Math.cos(phaseRef.current * 1.5 + i * 0.2) * 10);
        }

        const barHeight = Math.abs(amplitude);
        
        const gradient = ctx.createLinearGradient(x, mid - barHeight, x, mid + barHeight);
        gradient.addColorStop(0, color + '00');
        gradient.addColorStop(0.3, color + '80');
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(0.7, color + '80');
        gradient.addColorStop(1, color + '00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, mid - barHeight, barWidth, barHeight * 2, barWidth / 2);
        ctx.fill();
      }

      phaseRef.current += state === 'idle' ? 0.02 : 0.05;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [state, color]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-16"
      style={{ display: 'block' }}
    />
  );
}
