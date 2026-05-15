'use client';

import { useState, useEffect, useRef } from 'react';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function Error({ reset }) {
  const settings = useStoreSettings();
  const [reloading, setReloading] = useState(false);

  const handleReload = () => {
    setReloading(true);
    setTimeout(() => window.location.reload(), 2800);
  };

  return (
    <>
      {reloading && <ReloadOverlay logo={settings.logo_url} name={settings.store_name} />}

      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-display font-bold text-2xl text-foreground">Ops, algo deu errado</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Ocorreu um erro inesperado. Você pode tentar novamente ou recarregar a página.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-full h-11 px-6 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
            >
              Tentar novamente
            </button>
            <button
              onClick={handleReload}
              className="inline-flex items-center justify-center rounded-full h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
            >
              Recarregar página
            </button>
          </div>
          <button
            onClick={() => (window.location.href = '/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Ir para o catálogo
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Overlay de recarga com burnout ──────────────────────────────────── */
function ReloadOverlay({ logo, name }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const stateRef  = useRef({ tick: 0, particles: [], sparks: [] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const cx = () => canvas.width  / 2;
    const cy = () => canvas.height / 2 + 80; // centro da roda

    // Cria partícula de fumaça
    const addSmoke = () => {
      const s = stateRef.current;
      for (let i = 0; i < 3; i++) {
        s.particles.push({
          x: cx() + (Math.random() - 0.5) * 60,
          y: cy() + 55,
          vx: (Math.random() - 0.5) * 2.5,
          vy: -(Math.random() * 2 + 0.8),
          r: Math.random() * 18 + 10,
          alpha: Math.random() * 0.35 + 0.15,
          life: 1,
        });
      }
    };

    // Cria faísca
    const addSparks = () => {
      const s = stateRef.current;
      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        s.sparks.push({
          x: cx() + Math.cos(angle) * 55,
          y: cy() + Math.sin(angle) * 55,
          vx: Math.cos(angle) * (Math.random() * 4 + 2),
          vy: Math.sin(angle) * (Math.random() * 4 + 2),
          life: 1,
          color: Math.random() > 0.5 ? '#f97316' : '#fbbf24',
        });
      }
    };

    const draw = () => {
      const s    = stateRef.current;
      const W    = canvas.width;
      const H    = canvas.height;
      const tick = s.tick;
      const RX   = cx();
      const RY   = cy();
      const R    = 70; // raio da roda

      ctx.clearRect(0, 0, W, H);

      // Fundo semi-transparente
      ctx.fillStyle = 'rgba(0,0,0,0.92)';
      ctx.fillRect(0, 0, W, H);

      // ── Sombra no chão ──────────────────────────────────────
      const grd = ctx.createRadialGradient(RX, RY + R + 12, 5, RX, RY + R + 12, 90);
      grd.addColorStop(0, 'rgba(249,115,22,0.35)');
      grd.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.beginPath();
      ctx.ellipse(RX, RY + R + 12, 85, 18, 0, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // ── Partículas de fumaça ────────────────────────────────
      if (tick % 3 === 0) addSmoke();
      s.particles = s.particles.filter(p => p.life > 0);
      for (const p of s.particles) {
        p.x    += p.vx;
        p.y    += p.vy;
        p.r    += 0.4;
        p.life -= 0.018;
        p.vx   *= 0.98;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,180,180,${Math.max(0, p.alpha * p.life)})`;
        ctx.fill();
      }

      // ── Faíscas ─────────────────────────────────────────────
      if (tick % 8 === 0) addSparks();
      s.sparks = s.sparks.filter(sp => sp.life > 0);
      for (const sp of s.sparks) {
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        sp.x    += sp.vx;
        sp.y    += sp.vy;
        sp.vy   += 0.15;
        sp.life -= 0.06;
        ctx.lineTo(sp.x, sp.y);
        ctx.strokeStyle = sp.color + Math.round(sp.life * 255).toString(16).padStart(2, '0');
        ctx.lineWidth   = 2;
        ctx.stroke();
      }

      // ── Trilha de borracha no chão ──────────────────────────
      ctx.save();
      ctx.globalAlpha = Math.min(1, tick / 30) * 0.7;
      const skid = ctx.createLinearGradient(RX - 65, RY + R, RX + 65, RY + R);
      skid.addColorStop(0,   'rgba(20,20,20,0)');
      skid.addColorStop(0.2, 'rgba(20,20,20,0.9)');
      skid.addColorStop(0.8, 'rgba(20,20,20,0.9)');
      skid.addColorStop(1,   'rgba(20,20,20,0)');
      ctx.fillStyle = skid;
      ctx.fillRect(RX - 65, RY + R + 4, 130, 14);
      ctx.restore();

      // ── Roda girando ────────────────────────────────────────
      ctx.save();
      ctx.translate(RX, RY);

      // Sombra suave da roda
      ctx.shadowColor = 'rgba(249,115,22,0.5)';
      ctx.shadowBlur  = 22;

      const rpm     = tick * 0.18;
      const SPOKES  = 5;
      const RIM_W   = 6;
      const SPOKE_W = 4;

      // Pneu externo
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth   = 14;
      ctx.stroke();

      // Aro cromado
      ctx.beginPath();
      ctx.arc(0, 0, R - 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth   = RIM_W;
      ctx.stroke();

      // Raios
      ctx.save();
      ctx.rotate(rpm);
      for (let i = 0; i < SPOKES; i++) {
        const a = (i / SPOKES) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
        ctx.lineTo(Math.cos(a) * (R - 10), Math.sin(a) * (R - 10));
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth   = SPOKE_W;
        ctx.lineCap     = 'round';
        ctx.stroke();

        // Segundo raio ligeiramente deslocado (visual de roda esportiva)
        const a2 = a + 0.22;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a2) * 18, Math.sin(a2) * 18);
        ctx.lineTo(Math.cos(a2) * (R - 12), Math.sin(a2) * (R - 12));
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth   = 2;
        ctx.stroke();
      }
      ctx.restore();

      // Calota central (hub)
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fillStyle   = '#111827';
      ctx.shadowBlur  = 0;
      ctx.fill();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth   = 2;
      ctx.stroke();

      ctx.restore(); // fim da roda

      // ── Logo / texto no hub (contra-gira) ───────────────────
      ctx.save();
      ctx.translate(RX, RY);
      if (logo) {
        // Desenhamos via elemento img — usamos clip circular
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.clip();
        // (o drawImage com Image é feito abaixo)
      } else {
        ctx.fillStyle = '#f97316';
        ctx.font      = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((name || 'PM').slice(0, 3).toUpperCase(), 0, 0);
      }
      ctx.restore();

      // ── Texto de status ──────────────────────────────────────
      const dots = '.'.repeat((Math.floor(tick / 18) % 3) + 1);
      ctx.fillStyle    = 'rgba(255,255,255,0.7)';
      ctx.font         = '14px sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Carregando${dots}`, RX, RY - R - 28);

      s.tick++;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [logo, name]);

  // Overlay com canvas de fundo e logo via img sobreposta no hub
  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'all' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {logo && (
        <HubLogo logo={logo} name={name} canvasRef={canvasRef} />
      )}
    </div>
  );
}

// Overlay do logo no hub — posicionado sobre o canvas, contra-girando via CSS
function HubLogo({ logo, name, canvasRef }) {
  const [pos, setPos] = useState({ x: '50%', y: 'calc(50% + 80px)' });

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top:  pos.y,
        transform: 'translate(-50%, -50%)',
        width:  36,
        height: 36,
        borderRadius: '50%',
        overflow: 'hidden',
        border: '2px solid #374151',
        background: '#111827',
        pointerEvents: 'none',
        animation: 'hub-counter-css 0.55s linear infinite',
      }}
    >
      <style>{`
        @keyframes hub-counter-css {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(-360deg); }
        }
      `}</style>
      <img src={logo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} />
    </div>
  );
}
