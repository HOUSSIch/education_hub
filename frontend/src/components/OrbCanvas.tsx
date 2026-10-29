import { useRef, useEffect } from 'react';

interface OrbCanvasProps {
  morphState?: number;
  className?: string;
}

type Vec3 = [number, number, number];

function rotateY(p: Vec3, a: number): Vec3 {
  return [
    p[0] * Math.cos(a) + p[2] * Math.sin(a),
    p[1],
    -p[0] * Math.sin(a) + p[2] * Math.cos(a),
  ];
}

function rotateX(p: Vec3, a: number): Vec3 {
  return [
    p[0],
    p[1] * Math.cos(a) - p[2] * Math.sin(a),
    p[1] * Math.sin(a) + p[2] * Math.cos(a),
  ];
}

function project(p: Vec3, cx: number, cy: number, fov: number): { x: number; y: number; z: number; s: number } {
  const s = fov / (fov + p[2]);
  return { x: p[0] * s + cx, y: p[1] * s + cy, z: p[2], s };
}

function fibSphere(n: number, r: number): Vec3[] {
  const pts: Vec3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push([Math.cos(theta) * radius * r, y * r, Math.sin(theta) * radius * r]);
  }
  return pts;
}

function makeRing(n: number, r: number, tiltX: number, tiltZ: number): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const theta = (i / n) * Math.PI * 2;
    let x = Math.cos(theta) * r;
    let y = Math.sin(theta) * r;
    let z = 0;
    // tiltX
    const y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX);
    const z1 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
    y = y1; z = z1;
    // tiltZ
    const x2 = x * Math.cos(tiltZ) - y * Math.sin(tiltZ);
    const y2 = x * Math.sin(tiltZ) + y * Math.cos(tiltZ);
    pts.push([x2, y2, z]);
  }
  return pts;
}

export function OrbCanvas({ morphState = 0, className = '' }: OrbCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const rotYRef = useRef(0);
  const timeRef = useRef(0);
  const morphRef = useRef(morphState);

  useEffect(() => {
    morphRef.current = morphState;
  }, [morphState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, cx = 0, cy = 0, radius = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      cx = w / 2;
      cy = h / 2;
      radius = Math.min(w, h) * 0.26;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const spherePts = fibSphere(200, 1);
    const ring1Base = makeRing(100, 1.4, 0.25, 0.1);
    const ring2Base = makeRing(100, 1.65, 1.1, 0.4);
    const ring3Base = makeRing(100, 1.2, 0.7, -0.25);

    interface Particle { a: number; incl: number; dist: number; spd: number; size: number }
    const particles: Particle[] = Array.from({ length: 70 }, (_, i) => ({
      a: Math.random() * Math.PI * 2,
      incl: (i / 70) * Math.PI,
      dist: 1.7 + Math.random() * 1.1,
      spd: 0.001 + Math.random() * 0.003,
      size: 0.8 + Math.random() * 1.2,
    }));

    const draw = (time: number) => {
      const dt = Math.min(time - (timeRef.current || time), 50);
      timeRef.current = time;
      rotYRef.current += dt * 0.00025;
      const rotY = rotYRef.current;
      const rotXAng = 0.18;
      const ms = morphRef.current;

      ctx.clearRect(0, 0, w, h);

      // Ambient glow
      const amb = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.8);
      const glowAlpha = 0.06 + ms * 0.01;
      amb.addColorStop(0, `rgba(99,102,241,${glowAlpha + 0.04})`);
      amb.addColorStop(0.5, `rgba(139,92,246,${glowAlpha})`);
      amb.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = amb;
      ctx.fillRect(0, 0, w, h);

      // Scale factor from morphState
      const sc = radius * (0.9 + ms * 0.02);

      // Sphere dots
      const spts = spherePts.map(p => {
        const rp: Vec3 = [p[0] * sc, p[1] * sc, p[2] * sc];
        return project(rotateX(rotateY(rp, rotY), rotXAng), cx, cy, 550);
      });
      spts.sort((a, b) => b.z - a.z);
      spts.forEach(p => {
        const depth = Math.max(0, Math.min(1, (p.z + sc * 2.5) / (sc * 5)));
        const alpha = 0.05 + depth * 0.6;
        const size = 2 * p.s;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, size), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129,140,248,${alpha})`;
        ctx.fill();
      });

      // Rings
      const drawRing = (basePts: Vec3[], rY: number, color: [number, number, number], lw: number, alpha: number) => {
        const pts = basePts.map(p => {
          const rp: Vec3 = [p[0] * sc, p[1] * sc, p[2] * sc];
          return project(rotateX(rotateY(rp, rY), rotXAng), cx, cy, 550);
        });
        ctx.beginPath();
        pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
        ctx.lineWidth = lw;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${color[0]},${color[1]},${color[2]},0.6)`;
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      const ringGlow = 0.4 + ms * 0.05;
      drawRing(ring1Base, rotY * 1.4, [129, 140, 248], 1.5, ringGlow * 0.9);
      drawRing(ring2Base, rotY * -0.8, [167, 139, 250], 1, ringGlow * 0.7);
      drawRing(ring3Base, rotY * 1.1, [99, 102, 241], 1.2, ringGlow * 0.8);

      // Particles
      particles.forEach(p => {
        p.a += p.spd;
        const dist = p.dist * sc;
        const px = Math.sin(p.incl) * Math.cos(p.a) * dist;
        const py = Math.cos(p.incl) * dist;
        const pz = Math.sin(p.incl) * Math.sin(p.a) * dist;
        const pp = project(rotateX(rotateY([px, py, pz], rotY), rotXAng), cx, cy, 550);
        const alpha = Math.max(0.03, Math.min(0.5, (pp.z + sc * 2.5) / (sc * 5)));
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, p.size * pp.s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${alpha})`;
        ctx.fill();
      });

      // Core glow
      const pulse = Math.sin(time * 0.0008) * 0.5 + 0.5;
      const coreR = sc * 0.55;
      const coreG = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreG.addColorStop(0, `rgba(255,255,255,${0.75 + pulse * 0.15})`);
      coreG.addColorStop(0.15, `rgba(200,210,255,0.6)`);
      coreG.addColorStop(0.4, `rgba(99,102,241,0.3)`);
      coreG.addColorStop(0.7, `rgba(139,92,246,0.12)`);
      coreG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreG;
      ctx.fillRect(cx - coreR, cy - coreR, coreR * 2, coreR * 2);

      // Inner bright point
      const innerR = sc * 0.08;
      const innerG = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
      innerG.addColorStop(0, `rgba(255,255,255,${0.9 + pulse * 0.1})`);
      innerG.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = innerG;
      ctx.fillRect(cx - innerR, cy - innerR, innerR * 2, innerR * 2);

      // Morphstate extras
      if (ms >= 2) {
        // Doc-like floating elements
        const docAlpha = Math.min(1, (ms - 2) * 0.5) * 0.6;
        const docW = sc * 0.7;
        const docH = sc * 0.9;
        const docX = cx - docW * 1.8;
        const docY = cy - docH * 0.5;
        ctx.save();
        ctx.globalAlpha = docAlpha;
        ctx.fillStyle = 'rgba(99,102,241,0.08)';
        ctx.strokeStyle = 'rgba(99,102,241,0.3)';
        ctx.lineWidth = 1;
        roundRect(ctx, docX, docY, docW, docH, 8);
        ctx.fill();
        ctx.stroke();
        // Lines inside doc
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = 'rgba(129,140,248,0.25)';
          const lw = (0.6 + Math.random() * 0.3) * docW - 20;
          ctx.fillRect(docX + 10, docY + 20 + i * (docH - 30) / 5, lw, 3);
        }
        ctx.restore();
      }

      if (ms >= 4) {
        // Score ring
        const scoreAlpha = Math.min(1, (ms - 4) * 0.7) * 0.8;
        ctx.save();
        ctx.globalAlpha = scoreAlpha;
        ctx.beginPath();
        ctx.arc(cx, cy, sc * 1.85, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.4);
        ctx.strokeStyle = 'rgba(16,185,129,0.6)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
