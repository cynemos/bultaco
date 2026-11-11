import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatDateFr, formatEuro } from '../lib/format';

export interface BudgetPoint {
  date: string;
  amount: number;
  cumulative: number;
  part_name: string;
}

interface BudgetChartProps {
  points: BudgetPoint[];
}

const HEIGHT = 260;
const PAD = { top: 16, right: 16, bottom: 32, left: 64 };

// Arrondit l'échelle verticale à une valeur « ronde » (500, 1 000, 2 500…)
const niceMax = (value: number) => {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const step = [1, 2, 2.5, 5, 10].find(s => s * magnitude >= value) ?? 10;
  return step * magnitude;
};

const toTime = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() : new Date(iso).getTime();
};

// Évolution cumulée du coût de restauration (pièces + main d'œuvre) au fil des achats.
// Une seule série : pas de légende, le titre la nomme. Survol = repère vertical + infobulle.
const BudgetChart: React.FC<BudgetChartProps> = ({ points }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => setWidth(Math.max(280, entries[0].contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => points.map(p => ({ ...p, t: toTime(p.date) })).filter(p => !Number.isNaN(p.t)), [points]);

  if (data.length < 2) return null;

  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const tMin = data[0].t;
  const tMax = data[data.length - 1].t || tMin + 1;
  const yMax = niceMax(Math.max(...data.map(d => d.cumulative)));
  const x = (t: number) => PAD.left + ((t - tMin) / Math.max(1, tMax - tMin)) * innerW;
  const y = (v: number) => PAD.top + innerH - (Math.max(0, v) / yMax) * innerH;

  // Courbe en escalier : le total ne change qu'au moment de chaque achat
  let path = `M ${x(data[0].t)} ${y(data[0].cumulative)}`;
  for (let i = 1; i < data.length; i++) {
    path += ` H ${x(data[i].t)} V ${y(data[i].cumulative)}`;
  }
  const area = `${path} V ${y(0)} H ${x(data[0].t)} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => f * yMax);

  // Repères de mois (au plus 6, pour éviter les chevauchements)
  const months: number[] = [];
  const start = new Date(tMin);
  const cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  while (cursor.getTime() <= tMax) {
    months.push(cursor.getTime());
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const every = Math.max(1, Math.ceil(months.length / Math.max(2, Math.floor(innerW / 90))));
  const monthTicks = months.filter((_, i) => i % every === 0);

  const handleMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = tMin + ((e.clientX - rect.left) / rect.width) * (tMax - tMin);
    // Dernier achat à cette date ou avant
    let index = 0;
    for (let i = 0; i < data.length; i++) if (data[i].t <= t) index = i;
    setHover(index);
  };

  const hovered = hover !== null ? data[hover] : null;
  const last = data[data.length - 1];
  const tooltipLeft = hovered ? Math.min(Math.max(x(hovered.t), 110), width - 110) : 0;

  return (
    <figure className="bg-zinc-900 rounded-xl p-5 sm:p-6 border border-zinc-800 mb-12">
      <figcaption className="mb-4">
        <h2 className="text-xl font-semibold text-white">Évolution du coût de restauration</h2>
        <p className="text-sm text-zinc-400">
          Total cumulé des pièces et de la main d'œuvre, achat après achat — {formatEuro(last.cumulative)} au{' '}
          {formatDateFr(last.date)}
        </p>
      </figcaption>

      <div ref={wrapperRef} className="relative">
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Courbe du coût cumulé de restauration, de ${formatEuro(data[0].cumulative)} le ${formatDateFr(data[0].date)} à ${formatEuro(last.cumulative)} le ${formatDateFr(last.date)}.`}
          className="block"
        >
          {/* Grille et axe vertical (discrets) */}
          {yTicks.map(v => (
            <g key={v}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke="#27272a" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#a1a1aa">
                {formatEuro(v, 0)}
              </text>
            </g>
          ))}
          {monthTicks.map(t => (
            <text key={t} x={x(t)} y={HEIGHT - 10} textAnchor="middle" fontSize={11} fill="#a1a1aa">
              {new Date(t).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
            </text>
          ))}

          {/* Série */}
          <path d={area} fill="#f97316" opacity={0.12} />
          <path d={path} fill="none" stroke="#f97316" strokeWidth={2} strokeLinejoin="round" />
          <circle cx={x(last.t)} cy={y(last.cumulative)} r={4} fill="#f97316" stroke="#18181b" strokeWidth={2} />

          {/* Survol */}
          {hovered && (
            <g pointerEvents="none">
              <line x1={x(hovered.t)} x2={x(hovered.t)} y1={PAD.top} y2={PAD.top + innerH} stroke="#71717a" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={x(hovered.t)} cy={y(hovered.cumulative)} r={5} fill="#f97316" stroke="#18181b" strokeWidth={2} />
            </g>
          )}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={handleMove}
            onPointerDown={handleMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {hovered && (
          <div
            className="absolute top-0 -translate-x-1/2 pointer-events-none bg-zinc-950/95 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl w-[200px]"
            style={{ left: tooltipLeft }}
          >
            <div className="text-zinc-400">{formatDateFr(hovered.date)}</div>
            <div className="text-white font-semibold text-sm">{formatEuro(hovered.cumulative)}</div>
            <div className="text-zinc-400 truncate">
              {hovered.part_name} · {hovered.amount >= 0 ? '+' : ''}{formatEuro(hovered.amount)}
            </div>
          </div>
        )}
      </div>

      {/* Version tableau pour les lecteurs d'écran */}
      <table className="sr-only">
        <caption>Coût cumulé de restauration par achat</caption>
        <thead>
          <tr><th>Date</th><th>Achat</th><th>Montant</th><th>Cumul</th></tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td>{formatDateFr(d.date)}</td>
              <td>{d.part_name}</td>
              <td>{formatEuro(d.amount)}</td>
              <td>{formatEuro(d.cumulative)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

export default BudgetChart;
