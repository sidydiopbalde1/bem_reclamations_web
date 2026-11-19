'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { reclamationsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardStats, DashboardMonthlyStat, DashboardCategoryStat, Reclamation } from '@/lib/types';
import { NewReclamationsBanner } from '@/components/NewReclamationsBanner';

/* ─── Area chart ─────────────────────────────────────────────────────────── */

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const tension = 0.4;
    d += ` C ${px + (cx - px) * tension},${py} ${cx - (cx - px) * tension},${cy} ${cx},${cy}`;
  }
  return d;
}

function niceMax(v: number) {
  if (v === 0) return 5;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  if (n <= 1) return mag;
  if (n <= 2) return 2 * mag;
  if (n <= 5) return 5 * mag;
  return 10 * mag;
}

function AreaChart({ data }: { data: DashboardMonthlyStat[] }) {
  const W = 800, H = 220, padL = 36, padR = 16, padT = 28, padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxVal = niceMax(Math.max(...data.map((d) => d.count), 1));
  const steps = 4;
  const gridValues = Array.from({ length: steps + 1 }, (_, i) => Math.round((maxVal / steps) * i));

  const pts: [number, number][] = data.map((d, i) => [
    padL + (i / (data.length - 1)) * innerW,
    padT + innerH - (d.count / maxVal) * innerH,
  ]);

  const linePath = smoothPath(pts);
  const areaPath = pts.length
    ? `${linePath} L ${pts[pts.length - 1][0]},${padT + innerH} L ${pts[0][0]},${padT + innerH} Z`
    : '';

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="relative w-full" style={{ aspectRatio: `${W}/${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CC0000" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#CC0000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#CC0000" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y labels */}
        {gridValues.map((val) => {
          const y = padT + innerH - (val / maxVal) * innerH;
          return (
            <g key={val}>
              <line x1={padL} y1={y} x2={W - padR} y2={y}
                stroke={val === 0 ? '#CBD5E1' : '#F1F5F9'} strokeWidth={val === 0 ? 1.5 : 1} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94A3B8" fontFamily="system-ui">
                {val}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots + labels + X axis */}
        {pts.map(([x, y], i) => {
          const d = data[i];
          const isHovered = hovered === i;
          const isLast = i === data.length - 1;
          return (
            <g key={i}>
              {/* X label */}
              <text
                x={x} y={H - 4} textAnchor="middle" fontSize={10}
                fill={isLast ? '#CC0000' : '#94A3B8'}
                fontWeight={isLast ? '700' : '400'}
                fontFamily="system-ui"
              >
                {d.month.split(' ')[0]}
              </text>

              {/* Hover zone */}
              <rect
                x={x - 20} y={padT} width={40} height={innerH + padB}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'default' }}
              />

              {/* Vertical guideline on hover */}
              {isHovered && (
                <line x1={x} y1={padT} x2={x} y2={padT + innerH}
                  stroke="#CC0000" strokeWidth={1} strokeDasharray="4 3" opacity={0.4} />
              )}

              {/* Dot */}
              <circle cx={x} cy={y} r={isHovered ? 6 : (isLast ? 5 : 3.5)}
                fill={isLast ? '#CC0000' : '#fff'}
                stroke="#CC0000"
                strokeWidth={isLast ? 0 : 2}
                style={{ transition: 'r 0.15s' }}
              />

              {/* Value label (hover or non-zero last) */}
              {(isHovered || (isLast && d.count > 0)) && (
                <g>
                  <rect
                    x={x - 18} y={y - 26} width={36} height={18} rx={5}
                    fill="#CC0000"
                  />
                  <text x={x} y={y - 13} textAnchor="middle" fontSize={11}
                    fill="#fff" fontWeight="700" fontFamily="system-ui">
                    {d.count}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Donut chart ─────────────────────────────────────────────────────────── */

function DonutChart({ stats }: { stats: DashboardStats }) {
  const R = 72, stroke = 22;
  const C = 2 * Math.PI * R;
  const [hovered, setHovered] = useState<string | null>(null);

  const segments = [
    { key: 'OUVERTE',   label: 'Ouvertes',   value: stats.open,                           color: '#3B82F6' },
    { key: 'EN_COURS',  label: 'En cours',   value: stats.inProgress,                     color: '#F97316' },
    { key: 'RESOLUE',   label: 'Résolues',   value: stats.resolved,                       color: '#22C55E' },
    { key: 'REJETEE',   label: 'Rejetées',   value: stats.statusSummary?.REJETEE ?? 0,    color: '#94A3B8' },
  ];

  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  let offset = 0;
  const slices = segments.map((seg) => {
    const len = (seg.value / total) * C;
    const slice = { ...seg, len, offset };
    offset += len;
    return slice;
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5" style={{ boxShadow: '0 12px 28px rgba(15,23,42,0.04)' }}>
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: '#CC0000' }}>STATUTS</p>
        <h3 className="text-xl font-black" style={{ color: '#0F172A' }}>Répartition</h3>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {/* SVG donut */}
        <div className="relative flex-shrink-0 w-36 h-36 sm:w-40 sm:h-40">
          <svg viewBox="0 0 160 160" className="w-full h-full">
            {/* Background ring */}
            <circle cx={80} cy={80} r={R} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />

            {slices.map((s) => (
              <circle key={s.key} cx={80} cy={80} r={R} fill="none"
                stroke={s.color}
                strokeWidth={hovered === s.key ? stroke + 4 : stroke}
                strokeDasharray={`${s.len} ${C - s.len}`}
                strokeDashoffset={-s.offset + C / 4}
                strokeLinecap="butt"
                onMouseEnter={() => setHovered(s.key)}
                onMouseLeave={() => setHovered(null)}
                style={{ transition: 'stroke-width 0.2s', cursor: 'default', transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
              />
            ))}

            {/* Center label */}
            <text x={80} y={74} textAnchor="middle" fontSize={26} fontWeight="900" fill="#0F172A" fontFamily="system-ui">
              {total}
            </text>
            <text x={80} y={92} textAnchor="middle" fontSize={10} fontWeight="600" fill="#94A3B8" fontFamily="system-ui">
              {hovered ? segments.find(s => s.key === hovered)?.label : 'total'}
            </text>
            {hovered && (
              <text x={80} y={108} textAnchor="middle" fontSize={18} fontWeight="900"
                fill={segments.find(s => s.key === hovered)?.color} fontFamily="system-ui">
                {segments.find(s => s.key === hovered)?.value}
              </text>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 flex-1">
          {segments.map((s) => (
            <div key={s.key}
              className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 transition-colors"
              style={{
                background: hovered === s.key ? `${s.color}15` : '#F8FAFC',
                border: hovered === s.key ? `1px solid ${s.color}40` : '1px solid transparent',
              }}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-xs font-semibold text-slate-600">{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[10px] text-slate-400 font-medium w-9 text-right">
                  {total > 0 ? Math.round((s.value / total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Categories chart ───────────────────────────────────────────────────── */

const CAT_COLORS = ['#CC0000', '#E05252', '#EF8080', '#F4AAAA', '#F9C9C9'];
const CAT_LABELS: Record<string, string> = {
  CLIMATISATION: 'Climatisation', MOBILIER: 'Mobilier', ECLAIRAGE: 'Éclairage',
  ELECTRICITE: 'Électricité', EQUIPEMENT: 'Équipement', PLOMBERIE: 'Plomberie',
  PROPRETE: 'Propreté', AUTRE: 'Autre',
};

function CategoriesChart({ data, total }: { data: DashboardCategoryStat[]; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5" style={{ boxShadow: '0 12px 28px rgba(15,23,42,0.04)' }}>
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: '#CC0000' }}>CATÉGORIES</p>
        <h3 className="text-xl font-black" style={{ color: '#0F172A' }}>Top signalements</h3>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-slate-400">Aucune donnée</p>
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            const barPct = Math.round((item.count / maxCount) * 100);
            const color = CAT_COLORS[i] ?? '#CC0000';
            const isHov = hovered === item.category;

            return (
              <div key={item.category}
                className="rounded-xl p-3 transition-colors"
                style={{ background: isHov ? `${color}10` : '#F8FAFC', cursor: 'default' }}
                onMouseEnter={() => setHovered(item.category)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex w-5 h-5 rounded-md items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                      style={{ background: color }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {CAT_LABELS[item.category] ?? item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black" style={{ color }}>{item.count}</span>
                    <span className="text-[10px] font-semibold text-slate-400 w-8 text-right">{pct}%</span>
                  </div>
                </div>
                {/* Bar */}
                <div className="h-1.5 w-full rounded-full" style={{ background: `${color}20` }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barPct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItems, setNewItems] = useState<Reclamation[]>([]);
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderResult, setReminderResult] = useState<{ sent: number; total: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN' && user.role !== 'MOYENS_GENERAUX') {
      router.replace('/reclamations/list');
      return;
    }
    reclamationsApi.stats()
      .then(setDashboardStats)
      .catch(() => setDashboardStats(null))
      .finally(() => setLoading(false));

    // Nouvelles réclamations (< 24h) pour la bannière
    reclamationsApi
      .list({ status: 'OUVERTE', limit: 10, page: 1 })
      .then((res) => {
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        setNewItems(res.items.filter((r) => new Date(r.createdAt).getTime() > cutoff));
      })
      .catch(() => {});
  }, [user, router]);

  async function sendReminder() {
    setReminderSending(true);
    setReminderResult(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'}/reclamations/send-reminder`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
          },
        },
      );
      const data = await res.json() as { sent: number; total: number };
      setReminderResult(data);
    } catch {
      setReminderResult({ sent: 0, total: 0 });
    } finally {
      setReminderSending(false);
    }
  }


  const exportDashboardPdf = () => {
    if (typeof window === 'undefined' || !dashboardStats) return;

    const now = new Date();
    const generatedAt = now.toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }) + ' à ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const rejected = dashboardStats.statusSummary?.REJETEE ?? 0;

    const categoryRows = (dashboardStats.categories ?? []).map((item, index) => `
      <tr>
        <td style="text-align:center;font-weight:700;color:#CC0000;">${index + 1}</td>
        <td>${item.category}</td>
        <td style="text-align:center;font-weight:700;">${item.count}</td>
        <td style="text-align:center;">
          <div style="background:#e2e8f0;border-radius:4px;height:8px;width:100%;overflow:hidden;">
            <div style="background:#CC0000;height:8px;width:${Math.round((item.count / (dashboardStats.total || 1)) * 100)}%;"></div>
          </div>
          <span style="font-size:10px;color:#64748b;">${Math.round((item.count / (dashboardStats.total || 1)) * 100)}%</span>
        </td>
      </tr>
    `).join('');

    const monthRows = (dashboardStats.monthly ?? []).map((item) => `
      <tr>
        <td>${item.month}</td>
        <td style="text-align:center;font-weight:600;">${item.count}</td>
      </tr>
    `).join('');

    const topCategoryBlock = dashboardStats.topCategory ? `
      <div style="margin-top:24px;padding:14px 18px;background:#fff1f1;border:1.5px solid #fca5a5;border-radius:12px;">
        <p style="margin:0 0 4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#991b1b;">Catégorie la plus fréquente</p>
        <p style="margin:0;font-size:18px;font-weight:900;color:#CC0000;">
          ${dashboardStats.topCategory.category}
          <span style="font-size:14px;color:#991b1b;margin-left:8px;">${dashboardStats.topCategory.count} réclamation${dashboardStats.topCategory.count > 1 ? 's' : ''}</span>
        </p>
      </div>
    ` : '';

    const report = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Rapport des réclamations</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 32px 36px; color: #0f172a; font-size: 13px; }
            .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; border-bottom: 3px solid #CC0000; margin-bottom: 24px; }
            .header-left { display: flex; flex-direction: column; gap: 2px; }
            .org-name { font-size: 20px; font-weight: 900; color: #CC0000; letter-spacing: -0.5px; }
            .report-title { font-size: 13px; font-weight: 600; color: #64748b; }
            .header-right { text-align: right; font-size: 11px; color: #64748b; line-height: 1.6; }
            .kpis { display: flex; gap: 10px; margin-bottom: 24px; }
            .kpi { flex: 1; border-radius: 10px; padding: 12px 14px; }
            .kpi-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
            .kpi-value { font-size: 26px; font-weight: 900; }
            .kpi-total  { background: #f1f5f9; }
            .kpi-total .kpi-label { color: #64748b; }
            .kpi-total .kpi-value { color: #0f172a; }
            .kpi-open   { background: #eff6ff; }
            .kpi-open .kpi-label { color: #2563eb; }
            .kpi-open .kpi-value { color: #1d4ed8; }
            .kpi-inprogress { background: #fff7ed; }
            .kpi-inprogress .kpi-label { color: #c2410c; }
            .kpi-inprogress .kpi-value { color: #c2410c; }
            .kpi-resolved { background: #f0fdf4; }
            .kpi-resolved .kpi-label { color: #15803d; }
            .kpi-resolved .kpi-value { color: #15803d; }
            .kpi-rejected { background: #f8fafc; }
            .kpi-rejected .kpi-label { color: #94a3b8; }
            .kpi-rejected .kpi-value { color: #64748b; }
            .section-title { font-size: 15px; font-weight: 900; color: #0f172a; margin: 24px 0 10px; padding-left: 10px; border-left: 4px solid #CC0000; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e2e8f0; padding: 7px 10px; text-align: left; }
            th { background: #f8fafc; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
            tr:nth-child(even) td { background: #fafafa; }
            .footer { margin-top: 36px; padding-top: 14px; border-top: 1.5px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <span class="org-name">BEM Dakar</span>
              <span class="report-title">Rapport des réclamations -² Tableau de bord administrateur</span>
            </div>
            <div class="header-right">
              Généré le ${generatedAt}<br/>
              Par : ${user?.fullName ?? 'Administrateur'}<br/>
              Rôle : ${user?.role ?? ''}
            </div>
          </div>
          <div class="kpis">
            <div class="kpi kpi-total"><div class="kpi-label">Total</div><div class="kpi-value">${dashboardStats.total}</div></div>
            <div class="kpi kpi-open"><div class="kpi-label">Ouvertes</div><div class="kpi-value">${dashboardStats.open}</div></div>
            <div class="kpi kpi-inprogress"><div class="kpi-label">En cours</div><div class="kpi-value">${dashboardStats.inProgress}</div></div>
            <div class="kpi kpi-resolved"><div class="kpi-label">Résolues</div><div class="kpi-value">${dashboardStats.resolved}</div></div>
            <div class="kpi kpi-rejected"><div class="kpi-label">Rejetées</div><div class="kpi-value">${rejected}</div></div>
          </div>
          ${topCategoryBlock}
          <div class="section-title">Réclamations par mois (12 derniers mois)</div>
          <table>
            <thead><tr><th>Mois</th><th style="text-align:center;">Nombre</th></tr></thead>
            <tbody>${monthRows}</tbody>
          </table>
          <div class="section-title">Catégories les plus fréquentes</div>
          <table>
            <thead>
              <tr>
                <th style="text-align:center;width:50px;">Rang</th>
                <th>Catégorie</th>
                <th style="text-align:center;width:80px;">Nombre</th>
                <th style="width:160px;">Proportion</th>
              </tr>
            </thead>
            <tbody>${categoryRows}</tbody>
          </table>
          <div class="footer">
            <span>BEM Dakar - Système de gestion des réclamations</span>
            <span>Document généré le ${generatedAt}</span>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }
    doc.open();
    doc.write(report);
    doc.close();
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => { document.body.removeChild(iframe); }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="animate-spin" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#E2E8F0" strokeWidth="3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#CC0000" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1" style={{ color: '#0F172A' }}>
            Tableau de bord
          </h1>
          <p className="text-sm font-medium" style={{ color: '#64748B' }}>
            Bienvenue, <span style={{ color: '#CC0000' }}>{user?.fullName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            href="/reclamations/list"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105"
            style={{ background: 'white', border: '1.5px solid #E2E8F0', color: '#0F172A', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Voir la liste
          </Link>
          <button
            type="button"
            onClick={sendReminder}
            disabled={reminderSending}
            title="Envoyer le rappel par email aux Moyens Généraux"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105 disabled:opacity-60"
            style={{ background: 'white', border: '1.5px solid #FCA5A5', color: '#CC0000', boxShadow: '0 1px 4px rgba(204,0,0,0.1)' }}
          >
            {reminderSending ? (
              <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="#FCA5A5" strokeWidth="3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#CC0000" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            )}
            {reminderSending ? 'Envoi…' : 'Envoyer rappel'}
          </button>
          <button
            type="button"
            onClick={exportDashboardPdf}
            disabled={!dashboardStats}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-105 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #CC0000, #990000)', boxShadow: '0 4px 16px rgba(204,0,0,0.35)' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14"/>
            </svg>
            Exporter PDF
          </button>
        </div>
      </div>

      {/* Résultat envoi rappel */}
      {reminderResult && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 animate-slide-up text-sm font-semibold"
          style={
            reminderResult.sent > 0
              ? { background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }
              : { background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B' }
          }
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {reminderResult.sent > 0
              ? <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              : <path d="M12 9v4M12 17h.01M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
            }
          </svg>
          {reminderResult.sent > 0
            ? `Rappel envoyé à ${reminderResult.sent} destinataire${reminderResult.sent > 1 ? 's' : ''} pour ${reminderResult.total} réclamation${reminderResult.total > 1 ? 's' : ''} en attente.`
            : 'Aucune réclamation en attente — rappel non envoyé.'
          }
        </div>
      )}

      {/* Bannière nouvelles réclamations */}
      {newItems.length > 0 && <NewReclamationsBanner items={newItems} />}

      {dashboardStats ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8 animate-slide-up stagger-1">
            {[
              { label: 'Total', value: dashboardStats.total, bg: '#F1F5F9', color: '#0F172A', labelColor: '#64748B' },
              { label: 'Ouvertes', value: dashboardStats.open, bg: '#EFF6FF', color: '#1D4ED8', labelColor: '#2563EB' },
              { label: 'En cours', value: dashboardStats.inProgress, bg: '#FFF7ED', color: '#C2410C', labelColor: '#C2410C' },
              { label: 'Résolues', value: dashboardStats.resolved, bg: '#F0FDF4', color: '#15803D', labelColor: '#15803D' },
              { label: 'Rejetées', value: dashboardStats.statusSummary?.REJETEE ?? 0, bg: '#F8FAFC', color: '#64748B', labelColor: '#94A3B8' },
            ].map(({ label, value, bg, color, labelColor }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: bg }}>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-1" style={{ color: labelColor }}>{label}</p>
                <p className="text-3xl font-black" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Graphiques */}
          <div className="space-y-4 animate-slide-up stagger-2">
            {/* Évolution mensuelle — area chart pleine largeur */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5" style={{ boxShadow: '0 12px 28px rgba(15,23,42,0.04)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: '#CC0000' }}>ÉVOLUTION</p>
                  <h2 className="text-xl font-black" style={{ color: '#0F172A' }}>Réclamations sur 12 mois</h2>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
                  style={{ background: '#FFF5F5', color: '#CC0000', border: '1px solid #FCA5A5' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: '#CC0000' }} />
                  Réclamations soumises
                </div>
              </div>
              <AreaChart data={dashboardStats.monthly ?? []} />
            </div>

            {/* Donut statuts + Catégories */}
            <div className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
              <DonutChart stats={dashboardStats} />
              <CategoriesChart data={dashboardStats.categories ?? []} total={dashboardStats.total} />
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">Aucune donnée statistique disponible.</p>
      )}
    </div>
  );
}
