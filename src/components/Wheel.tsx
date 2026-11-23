'use client';

import { useCallback, useEffect, useRef } from 'react';

import { Dices } from './icons';

/**
 * Roue du tirage de l'ordre. Quand `target` change, elle tourne et s'arrête sur
 * ce membre, puis appelle onDone. Le résultat vient toujours du serveur.
 */
export function Wheel({
  names,
  meIndex,
  target,
  onDone,
}: {
  names: string[];
  meIndex: number;
  target: number | null;
  onDone?: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // La rotation est appliquée directement au canvas : pas de re-rendu pendant l'animation.
  const rot = useRef(0);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  const draw = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const size = c.offsetWidth || 290;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    c.width = Math.round(size * dpr);
    c.height = Math.round(size * dpr);
    const g = c.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(document.documentElement);
    const v = (k: string) => cs.getPropertyValue(k).trim();
    const fills = [v('--brand-soft'), v('--gold-soft')];
    const n = Math.max(names.length, 1);
    const seg = (Math.PI * 2) / n;
    const R = size / 2;
    g.clearRect(0, 0, size, size);
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i * seg;
      g.beginPath();
      g.moveTo(R, R);
      g.arc(R, R, R - 1.5, a0, a0 + seg);
      g.closePath();
      g.fillStyle = fills[i % 2];
      g.fill();
      g.strokeStyle = v('--card');
      g.lineWidth = 2;
      g.stroke();
    }
    g.beginPath();
    g.arc(R, R, R - 1.5, 0, Math.PI * 2);
    g.strokeStyle = v('--line');
    g.lineWidth = 3;
    g.stroke();
    g.textAlign = 'right';
    g.textBaseline = 'middle';
    for (let i = 0; i < names.length; i++) {
      const a = -Math.PI / 2 + i * seg + seg / 2;
      g.save();
      g.translate(R, R);
      g.rotate(a);
      const me = i === meIndex;
      g.fillStyle = me ? v('--gold-deep') : v('--ink');
      g.font = `${me ? 700 : 600} ${Math.round(size * (n > 12 ? 0.04 : 0.05))}px ${v('--f-body')}`;
      const label = names[i].length > 10 ? names[i].slice(0, 9) + '.' : names[i];
      g.fillText(label, R - 16, 0);
      g.restore();
    }
  }, [names, meIndex]);

  useEffect(() => {
    draw();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    window.addEventListener('resize', draw);
    mq.addEventListener('change', draw);
    document.fonts?.ready.then(draw);
    return () => {
      window.removeEventListener('resize', draw);
      mq.removeEventListener('change', draw);
    };
  }, [draw]);

  useEffect(() => {
    if (target === null || target < 0) return;
    const n = names.length;
    const segDeg = 360 / n;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const jitter = (Math.random() - 0.5) * segDeg * 0.6;
    const goal = (((360 - (target * segDeg + segDeg / 2) + jitter) % 360) + 360) % 360;
    const cur = ((rot.current % 360) + 360) % 360;
    rot.current += 360 * 5 + ((goal - cur + 360) % 360);
    if (canvas.current) canvas.current.style.transform = `rotate(${rot.current}deg)`;
    const t = setTimeout(() => done.current?.(), reduce ? 80 : 4350);
    return () => clearTimeout(t);
  }, [target, names.length]);

  return (
    <div className="wheelbox">
      <div className="pointer" aria-hidden />
      <canvas
        ref={canvas}
        width={290}
        height={290}
        aria-label={`Roue du tirage avec les ${names.length} membres`}
      />
      <div className="hub" aria-hidden>
        <Dices strokeWidth={1.9} />
      </div>
    </div>
  );
}
