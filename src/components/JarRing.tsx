'use client';

import { useEffect, useState } from 'react';

import type { ContribStatus } from '@/lib/types';

export type RingMember = { id: string; label: string; initial: string; status: ContribStatus; isBeneficiary: boolean };

const CX = 160;
const CY = 172;
const RR = 124;
const AR = 19;
const JAR = { x: 114, y: 132, w: 92, h: 98 };

/** Les membres autour du bocal ; le bocal se remplit avec les versements validés. */
export function JarRing({ members, onSelect }: { members: RingMember[]; onSelect?: (m: RingMember) => void }) {
  const n = members.length;
  const benI = Math.max(0, members.findIndex((m) => m.isBeneficiary));
  const ratio = n ? members.filter((m) => m.status === 'paid').length / n : 0;

  // Le bocal part vide puis se remplit, pour montrer le mouvement à l'arrivée sur l'écran.
  const [fill, setFill] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setFill(ratio)));
    return () => cancelAnimationFrame(t);
  }, [ratio]);

  return (
    <svg viewBox="0 0 320 340" role="img" aria-label="Les membres du cercle autour du bocal de la cagnotte">
      <defs>
        <clipPath id="jarclip">
          <rect x={JAR.x} y={JAR.y} width={JAR.w} height={JAR.h} rx="22" />
        </clipPath>
        <pattern id="coins" width="16" height="9" patternUnits="userSpaceOnUse">
          <ellipse cx="8" cy="4.5" rx="6.5" ry="2.6" className="coin" />
        </pattern>
      </defs>
      <circle cx={CX} cy={CY} r={RR} className="guide" />
      <rect x="124" y="108" width="72" height="12" rx="5" className="lid" />
      <rect x="132" y="118" width="56" height="16" rx="4" className="neck" />
      <rect x={JAR.x} y={JAR.y} width={JAR.w} height={JAR.h} rx="22" className="jar" />
      <g clipPath="url(#jarclip)">
        <g className="fill" style={{ transform: `translateY(${((1 - fill) * JAR.h).toFixed(1)}px)` }}>
          <rect x={JAR.x - 4} y={JAR.y} width={JAR.w + 8} height={JAR.h + 4} className="liquid" />
          <rect x={JAR.x - 4} y={JAR.y} width={JAR.w + 8} height={JAR.h + 4} fill="url(#coins)" />
        </g>
      </g>
      <rect x={JAR.x} y={JAR.y} width={JAR.w} height={JAR.h} rx="22" className="jar-line" />
      {members.map((m, i) => {
        const a = -Math.PI / 2 + ((i - benI) * 2 * Math.PI) / n;
        const x = +(CX + RR * Math.cos(a)).toFixed(1);
        const y = +(CY + RR * Math.sin(a)).toFixed(1);
        const clickable = !!onSelect && m.status === 'due';
        return (
          <g
            key={m.id}
            className={`mem m-${m.status}${clickable ? ' clickable' : ''}`}
            onClick={clickable ? () => onSelect(m) : undefined}
          >
            {m.isBeneficiary && (
              <>
                <circle cx={x} cy={y} r={AR + 5} className="ben-ring" />
                <text x={x} y={y - AR - 10} className="ben-t">
                  REÇOIT
                </text>
              </>
            )}
            <circle cx={x} cy={y} r={AR} className="av-c" />
            <text x={x} y={y + 5} className="av-t">
              {m.initial}
            </text>
            {m.status === 'paid' && (
              <g transform={`translate(${x + 14},${y - 14})`}>
                <circle r="7" className="badge" />
                <path d="M-3 0.2l2 2 4-4.2" className="badge-k" />
              </g>
            )}
            <text x={x} y={y + AR + 15} className="av-l">
              {m.label.length > 9 ? m.label.slice(0, 8) + '.' : m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
