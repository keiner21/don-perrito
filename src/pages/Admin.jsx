import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Download,
  LogOut,
  RefreshCw,
  Search,
  Siren,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as XLSX from "xlsx";
import ding from "../assets/ding.mp3";
import logoDonPerrito from "../assets/logo-don-perrito.png";
import { api } from "../services/api";
import { socket } from "../services/socket";
import { fmt } from "../utils/format";

const ESTADOS = ["Todos", "Pendiente", "Preparando", "Listo"];
const VISTAS = ["Pedidos", "Informe"];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #070710;
    --bg2: #0d0d1a;
    --surface: rgba(255,255,255,0.03);
    --surface2: rgba(255,255,255,0.055);
    --surface3: rgba(255,255,255,0.08);
    --border: rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.12);
    --amber: #f59e0b;
    --orange: #f97316;
    --orange-dim: rgba(249,115,22,0.15);
    --amber-dim: rgba(245,158,11,0.12);
    --sky: #38bdf8;
    --emerald: #34d399;
    --rose: #fb7185;
    --text: #f0efe9;
    --text2: rgba(240,239,233,0.6);
    --muted: rgba(240,239,233,0.3);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* ──────────── SHELL ──────────── */
  .adm-shell {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 40% at 50% -10%, rgba(249,115,22,0.07) 0%, transparent 70%),
      var(--bg);
    padding: 20px 20px 60px;
  }
  .adm-inner { max-width: 1400px; margin: 0 auto; }

  /* ──────────── HEADER ──────────── */
  .adm-header {
    display: flex; flex-direction: column; gap: 16px;
    background: linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(245,158,11,0.06) 100%);
    border: 1px solid rgba(249,115,22,0.2);
    border-radius: 28px;
    padding: 24px 28px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
  }
  .adm-header::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
  }
  .adm-header-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; position: relative; }
  .adm-brand { display: flex; align-items: center; gap: 16px; }
  .adm-logo-wrap {
    position: relative; width: 60px; height: 60px;
    border-radius: 18px;
    background: linear-gradient(135deg, var(--orange), var(--amber));
    padding: 3px;
    box-shadow: 0 0 32px rgba(249,115,22,0.4);
    flex-shrink: 0;
  }
  .adm-logo { width: 100%; height: 100%; border-radius: 15px; object-fit: cover; }
  .adm-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--orange); }
  .adm-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--text); line-height: 1.1; }
  .adm-sub { font-size: 13px; color: var(--muted); margin-top: 2px; }
  .adm-actions { display: flex; flex-wrap: wrap; gap: 8px; }

  /* ──────────── BUTTONS ──────────── */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px; border-radius: 14px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.2s;
    white-space: nowrap;
  }
  .btn-ghost {
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text2);
  }
  .btn-ghost:hover { background: var(--surface3); border-color: var(--border2); color: var(--text); }
  .btn-orange { background: linear-gradient(135deg, var(--orange), var(--amber)); color: #fff; box-shadow: 0 4px 20px rgba(249,115,22,0.35); }
  .btn-orange:hover { box-shadow: 0 6px 28px rgba(249,115,22,0.5); transform: translateY(-1px); }
  .btn-orange.active { box-shadow: 0 0 0 3px rgba(249,115,22,0.3), 0 4px 20px rgba(249,115,22,0.35); }
  .btn-dark { background: rgba(255,255,255,0.08); border: 1px solid var(--border); color: var(--text); }
  .btn-dark:hover { background: rgba(255,255,255,0.12); }
  .btn-emerald { background: rgba(52,211,153,0.15); border: 1px solid rgba(52,211,153,0.25); color: var(--emerald); }
  .btn-emerald:hover { background: rgba(52,211,153,0.22); }

  /* ──────────── NAV BAR ──────────── */
  .adm-nav {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 8px;
    margin-bottom: 24px;
  }
  .nav-tabs { display: flex; gap: 4px; }
  .nav-tab {
    padding: 9px 20px; border-radius: 13px;
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
    cursor: pointer; border: none; transition: all 0.2s;
    color: var(--muted); background: transparent;
  }
  .nav-tab.active { background: linear-gradient(135deg, var(--orange), var(--amber)); color: #fff; box-shadow: 0 4px 16px rgba(249,115,22,0.3); }
  .nav-tab:not(.active):hover { color: var(--text); background: var(--surface2); }
  .nav-day-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .day-select {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 13px; padding: 9px 14px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    color: var(--text); outline: none; cursor: pointer;
    transition: border-color 0.2s;
  }
  .day-select:focus { border-color: var(--orange); }
  .day-select option { background: #1a1a2e; }

  /* ──────────── METRICS ──────────── */
  .metrics-grid {
    display: grid; gap: 14px;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    margin-bottom: 24px;
  }
  .metric-card {
    position: relative; overflow: hidden;
    border-radius: 22px; padding: 20px 22px;
    border: 1px solid var(--border);
    background: var(--surface);
    transition: all 0.25s;
  }
  .metric-card:hover { transform: translateY(-3px); border-color: var(--border2); }
  .metric-card::after {
    content: ''; position: absolute; inset: 0;
    background: var(--metric-glow);
    opacity: 0; transition: opacity 0.3s;
    pointer-events: none;
  }
  .metric-card:hover::after { opacity: 1; }
  .metric-card.orange { --metric-glow: radial-gradient(circle at 70% 20%, rgba(249,115,22,0.08), transparent 60%); }
  .metric-card.amber { --metric-glow: radial-gradient(circle at 70% 20%, rgba(245,158,11,0.08), transparent 60%); }
  .metric-card.sky { --metric-glow: radial-gradient(circle at 70% 20%, rgba(56,189,248,0.07), transparent 60%); }
  .metric-card.emerald { --metric-glow: radial-gradient(circle at 70% 20%, rgba(52,211,153,0.07), transparent 60%); }
  .metric-card.rose { --metric-glow: radial-gradient(circle at 70% 20%, rgba(251,113,133,0.07), transparent 60%); }

  .metric-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
  .metric-icon-wrap {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .metric-icon-wrap.orange { background: rgba(249,115,22,0.15); color: var(--orange); }
  .metric-icon-wrap.amber { background: rgba(245,158,11,0.15); color: var(--amber); }
  .metric-icon-wrap.sky { background: rgba(56,189,248,0.12); color: var(--sky); }
  .metric-icon-wrap.emerald { background: rgba(52,211,153,0.12); color: var(--emerald); }
  .metric-icon-wrap.rose { background: rgba(251,113,133,0.12); color: var(--rose); }

  .metric-label { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); }
  .metric-value { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: var(--text); line-height: 1; }
  .metric-accent { display: inline-block; width: 28px; height: 3px; border-radius: 2px; margin-top: 10px; }
  .metric-accent.orange { background: linear-gradient(90deg, var(--orange), var(--amber)); }
  .metric-accent.amber { background: linear-gradient(90deg, var(--amber), #fde68a); }
  .metric-accent.sky { background: linear-gradient(90deg, #38bdf8, #7dd3fc); }
  .metric-accent.emerald { background: linear-gradient(90deg, #34d399, #86efac); }
  .metric-accent.rose { background: linear-gradient(90deg, #fb7185, #fda4af); }

  /* Sparkline inside metric */
  .metric-spark { margin-top: 10px; height: 40px; }

  /* ──────────── SEARCH BAR ──────────── */
  .search-bar {
    display: flex; gap: 10px; flex-wrap: wrap;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 10px;
    margin-bottom: 22px;
    align-items: center;
  }
  .search-input-wrap {
    flex: 1; position: relative; min-width: 200px;
  }
  .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
  .search-input {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 14px; padding: 10px 14px 10px 40px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text);
    outline: none; transition: border-color 0.2s;
  }
  .search-input::placeholder { color: var(--muted); }
  .search-input:focus { border-color: rgba(249,115,22,0.4); }
  .filter-select {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 14px; padding: 10px 14px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    color: var(--text); outline: none; cursor: pointer;
    transition: border-color 0.2s;
  }
  .filter-select:focus { border-color: rgba(249,115,22,0.4); }
  .filter-select option { background: #1a1a2e; }

  /* ──────────── DAY HEADING ──────────── */
  .day-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 8px; }
  .day-heading-left { display: flex; align-items: center; gap: 10px; }
  .day-heading-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--text); text-transform: capitalize; }
  .day-heading-count { font-size: 13px; color: var(--muted); margin-top: 2px; }

  /* ──────────── KANBAN ──────────── */
  .kanban-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
  @media(min-width: 900px) { .kanban-grid { grid-template-columns: repeat(3, 1fr); } }

  .kanban-col {
    border-radius: 24px; padding: 16px;
    border: 1px solid var(--border);
    background: var(--surface);
    display: flex; flex-direction: column; gap: 12px;
  }
  .kanban-col.pendiente { border-color: rgba(245,158,11,0.2); }
  .kanban-col.preparando { border-color: rgba(56,189,248,0.2); }
  .kanban-col.listo { border-color: rgba(52,211,153,0.2); }

  .kanban-col-header { display: flex; align-items: center; justify-content: space-between; }
  .kanban-col-left { display: flex; align-items: center; gap: 10px; }
  .kanban-col-icon {
    width: 36px; height: 36px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .kanban-col-icon.pendiente { background: rgba(245,158,11,0.15); color: var(--amber); }
  .kanban-col-icon.preparando { background: rgba(56,189,248,0.12); color: var(--sky); }
  .kanban-col-icon.listo { background: rgba(52,211,153,0.12); color: var(--emerald); }
  .kanban-col-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; color: var(--text); }
  .kanban-badge {
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 800;
    padding: 3px 10px; border-radius: 100px;
  }
  .kanban-badge.pendiente { background: rgba(245,158,11,0.15); color: var(--amber); }
  .kanban-badge.preparando { background: rgba(56,189,248,0.12); color: var(--sky); }
  .kanban-badge.listo { background: rgba(52,211,153,0.12); color: var(--emerald); }

  .kanban-empty {
    border: 1px dashed var(--border); border-radius: 16px;
    padding: 28px 20px; text-align: center;
    font-size: 13px; color: var(--muted); font-weight: 500;
  }

  /* ──────────── ORDER CARD ──────────── */
  .order-card {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 18px; padding: 16px;
    transition: all 0.2s;
    animation: slideInCard 0.25s ease both;
  }
  .order-card:hover { border-color: var(--border2); background: var(--surface3); }
  .order-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
  .order-num { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: var(--text); }
  .order-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .order-total { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: var(--amber); white-space: nowrap; }

  .order-items { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .order-item-row {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--surface); border-radius: 10px; padding: 8px 12px;
  }
  .order-item-name { font-size: 13px; font-weight: 600; color: var(--text); }
  .order-item-price { font-size: 13px; font-weight: 700; color: var(--orange); }

  .order-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .order-action-btn {
    padding: 8px 6px; border-radius: 11px; border: 1px solid var(--border);
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700;
    cursor: pointer; background: transparent; color: var(--muted);
    transition: all 0.15s; text-align: center;
  }
  .order-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .order-action-btn.active-pendiente { background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.3); color: var(--amber); }
  .order-action-btn.active-preparando { background: rgba(56,189,248,0.12); border-color: rgba(56,189,248,0.25); color: var(--sky); }
  .order-action-btn.active-listo { background: rgba(52,211,153,0.12); border-color: rgba(52,211,153,0.25); color: var(--emerald); }
  .order-action-btn:not(:disabled):hover { background: rgba(249,115,22,0.1); border-color: rgba(249,115,22,0.3); color: var(--orange); }
  .order-action-btn.active-pendiente:hover,
  .order-action-btn.active-preparando:hover,
  .order-action-btn.active-listo:hover { filter: brightness(1.1); }

  /* ──────────── INFORME ──────────── */
  .chart-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 24px; padding: 24px;
    margin-bottom: 20px;
  }
  .chart-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .chart-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: var(--text); }
  .chart-sub { font-size: 12px; color: var(--muted); margin-top: 3px; }
  .charts-row { display: grid; gap: 20px; grid-template-columns: 1fr; margin-bottom: 20px; }
  @media(min-width: 800px) { .charts-row { grid-template-columns: 2fr 1fr; } }

  /* Informe table */
  .informe-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .informe-table th {
    text-align: left; padding: 10px 16px;
    font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--muted); border-bottom: 1px solid var(--border);
  }
  .informe-table td { padding: 14px 16px; border-bottom: 1px solid var(--border); color: var(--text); }
  .informe-table tr:last-child td { border-bottom: none; }
  .informe-table tbody tr { transition: background 0.15s; }
  .informe-table tbody tr:hover { background: var(--surface2); }
  .td-day { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; text-transform: capitalize; }
  .td-ventas { font-family: 'Syne', sans-serif; font-weight: 800; color: var(--amber); }
  .td-pill {
    display: inline-block; padding: 2px 10px; border-radius: 100px;
    font-size: 11px; font-weight: 700;
  }
  .td-pill.pendiente { background: rgba(245,158,11,0.12); color: var(--amber); }
  .td-pill.preparando { background: rgba(56,189,248,0.1); color: var(--sky); }
  .td-pill.listo { background: rgba(52,211,153,0.1); color: var(--emerald); }
  .table-scroll { overflow-x: auto; }

  /* ──────────── ERROR ──────────── */
  .error-banner {
    background: rgba(251,113,133,0.08); border: 1px solid rgba(251,113,133,0.2);
    border-radius: 16px; padding: 12px 18px;
    font-size: 13px; color: #fb7185; margin-bottom: 20px;
    display: flex; align-items: center; gap: 8px;
  }

  /* ──────────── EMPTY ──────────── */
  .empty-box {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 48px 24px; text-align: center;
    color: var(--muted); font-size: 14px; font-weight: 500;
  }

  /* ──────────── SPINNER ──────────── */
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top-color: var(--orange); border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }

  /* ──────────── KEYFRAMES ──────────── */
  @keyframes slideInCard { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

  /* Recharts overrides */
  .recharts-tooltip-wrapper { outline: none; }
  .custom-tooltip {
    background: rgba(15,15,28,0.92); backdrop-filter: blur(12px);
    border: 1px solid var(--border2); border-radius: 14px;
    padding: 10px 16px; font-family: 'DM Sans', sans-serif;
  }
  .custom-tooltip-label { font-size: 11px; color: var(--muted); font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
  .custom-tooltip-val { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: var(--amber); }
  .custom-tooltip-val2 { font-size: 12px; color: var(--text2); margin-top: 2px; }
`;

/* ───── TOOLTIP PERSONALIZADO ───── */
function CustomTooltip({ active, payload, label, valueFormatter = (v) => v }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip-label">{label}</div>
      <div className="custom-tooltip-val">{valueFormatter(payload[0]?.value)}</div>
      {payload[1] && <div className="custom-tooltip-val2">{payload[1].value} pedidos</div>}
    </div>
  );
}

/* ───── MÉTRICA ───── */
function Metric({ icon: Icon, label, value, tone = "orange", sparkData }) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-top">
        <div>
          <div className="metric-label">{label}</div>
          <div className="metric-value" style={{ marginTop: 6 }}>{value}</div>
        </div>
        <div className={`metric-icon-wrap ${tone}`}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
      {sparkData && sparkData.length > 1 && (
        <div className="metric-spark">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`sg-${tone}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={tone === "orange" ? "#f97316" : tone === "amber" ? "#f59e0b" : tone === "sky" ? "#38bdf8" : tone === "emerald" ? "#34d399" : "#fb7185"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone" dataKey="total" stroke={tone === "orange" ? "#f97316" : tone === "amber" ? "#f59e0b" : tone === "sky" ? "#38bdf8" : tone === "emerald" ? "#34d399" : "#fb7185"}
                strokeWidth={1.5} fill={`url(#sg-${tone})`} dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className={`metric-accent ${tone}`} />
    </div>
  );
}

/* ───── EMPTY STATE ───── */
function EmptyState({ text }) {
  return <div className="empty-box">{text}</div>;
}

/* ───── KANBAN COLUMN ───── */
const kanbanCfg = {
  Pendiente: { cls: "pendiente", icon: Siren, label: "Pendientes" },
  Preparando: { cls: "preparando", icon: ChefHat, label: "En cocina" },
  Listo: { cls: "listo", icon: CheckCircle2, label: "Listos" },
};

function EstadoColumn({ estado, pedidos, onCambiarEstado }) {
  const { cls, icon: Icon, label } = kanbanCfg[estado];
  return (
    <div className={`kanban-col ${cls}`}>
      <div className="kanban-col-header">
        <div className="kanban-col-left">
          <div className={`kanban-col-icon ${cls}`}><Icon size={18} /></div>
          <div>
            <div className="kanban-col-name">{label}</div>
          </div>
        </div>
        <span className={`kanban-badge ${cls}`}>{pedidos.length}</span>
      </div>
      {pedidos.length === 0
        ? <div className="kanban-empty">Sin pedidos aquí</div>
        : pedidos.map((p) => <PedidoCard key={p.id} pedido={p} onCambiarEstado={onCambiarEstado} />)
      }
    </div>
  );
}

/* ───── PEDIDO CARD ───── */
function PedidoCard({ pedido, onCambiarEstado }) {
  const actionMap = { Pendiente: "active-pendiente", Preparando: "active-preparando", Listo: "active-listo" };
  return (
    <div className="order-card">
      <div className="order-card-top">
        <div>
          <div className="order-num">Pedido #{pedido.numero}</div>
          <div className="order-meta">
            Mesa #{pedido.mesa} · {pedido.metodo} ·{" "}
            {new Date(pedido.fecha).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="order-total">{fmt(pedido.total)}</div>
      </div>

      <div className="order-items">
        {pedido.items.map((item) => (
          <div key={item.id} className="order-item-row">
            <div className="order-item-name">{item.qty}× {item.nombre}</div>
            <div className="order-item-price">{fmt(item.qty * item.precio)}</div>
          </div>
        ))}
      </div>

      <div className="order-actions">
        {["Pendiente", "Preparando", "Listo"].map((e) => (
          <button
            key={e}
            className={`order-action-btn${pedido.estado === e ? " " + actionMap[e] : ""}`}
            onClick={() => onCambiarEstado(pedido.id, e)}
            disabled={pedido.estado === e}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───── INFORME ───── */
function Informe({ exportarExcel, pedidos, resumenTotal, ventasPorDia }) {
  const dias = useMemo(() => {
    const acc = pedidos.reduce((a, p) => {
      const key = getDateKey(p.fecha);
      if (!a[key]) a[key] = { key, ventas: 0, pedidos: 0, pendientes: 0, preparando: 0, listos: 0 };
      a[key].ventas += p.total; a[key].pedidos += 1;
      if (p.estado === "Pendiente") a[key].pendientes++;
      if (p.estado === "Preparando") a[key].preparando++;
      if (p.estado === "Listo") a[key].listos++;
      return a;
    }, {});
    return Object.values(acc).sort((a, b) => dateFromKey(b.key) - dateFromKey(a.key));
  }, [pedidos]);

  const estadosPie = [
    { name: "Listos", value: resumenTotal.listos, color: "#34d399" },
    { name: "Preparando", value: resumenTotal.preparando, color: "#38bdf8" },
    { name: "Pendientes", value: resumenTotal.pendientes, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  const topProductos = useMemo(() => {
    const mapa = {};
    pedidos.forEach((p) => p.items.forEach((it) => {
      if (!mapa[it.nombre]) mapa[it.nombre] = { nombre: it.nombre, qty: 0, total: 0 };
      mapa[it.nombre].qty += it.qty;
      mapa[it.nombre].total += it.qty * it.precio;
    }));
    return Object.values(mapa).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [pedidos]);

  return (
    <>
      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        <Metric icon={TrendingUp} label="Ventas totales" value={fmt(resumenTotal.ventas)} tone="orange" sparkData={ventasPorDia} />
        <Metric icon={ClipboardList} label="Pedidos totales" value={resumenTotal.total} tone="amber" sparkData={ventasPorDia} />
        <Metric icon={Siren} label="Pendientes" value={resumenTotal.pendientes} tone="amber" />
        <Metric icon={ChefHat} label="Preparando" value={resumenTotal.preparando} tone="sky" />
        <Metric icon={CheckCircle2} label="Listos" value={resumenTotal.listos} tone="emerald" />
      </div>

      <div className="charts-row">
        {/* Área chart ventas */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-title">Ventas por día</div>
              <div className="chart-sub">Evolución de ingresos acumulados</div>
            </div>
            <button className="btn btn-emerald" onClick={exportarExcel}>
              <Download size={15} /> Exportar Excel
            </button>
          </div>
          {ventasPorDia.length > 0 ? (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ventasPorDia} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: "rgba(240,239,233,0.35)", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "rgba(240,239,233,0.35)", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip valueFormatter={fmt} />} />
                  <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2.5} fill="url(#areaGrad)" dot={false} activeDot={{ r: 5, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState text="No hay ventas registradas." />}
        </div>

        {/* Pie estado pedidos */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-title">Estado pedidos</div>
              <div className="chart-sub">Distribución general</div>
            </div>
          </div>
          {estadosPie.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ height: 180, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={estadosPie} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                      {estadosPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "rgba(15,15,28,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontFamily: "DM Sans", fontSize: 13, color: "#f0efe9" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {estadosPie.map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(240,239,233,0.6)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState text="Sin datos aún." />}
        </div>
      </div>

      {/* Top productos */}
      {topProductos.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <div className="chart-card-header">
            <div>
              <div className="chart-title">Productos más vendidos</div>
              <div className="chart-sub">Por ingresos generados</div>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductos} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "rgba(240,239,233,0.35)", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nombre" width={110} tick={{ fontSize: 12, fill: "rgba(240,239,233,0.6)", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip valueFormatter={fmt} />} />
                <Bar dataKey="total" radius={[0, 8, 8, 0]} maxBarSize={20}>
                  {topProductos.map((_, i) => (
                    <Cell key={i} fill={`rgba(249,115,22,${1 - i * 0.12})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabla resumen */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <div className="chart-title">Informe por día</div>
            <div className="chart-sub">Resumen detallado de cada jornada</div>
          </div>
        </div>
        {dias.length === 0
          ? <EmptyState text="No hay información para mostrar." />
          : (
            <div className="table-scroll">
              <table className="informe-table">
                <thead>
                  <tr>
                    <th>Día</th><th>Pedidos</th><th>Ventas</th>
                    <th>Pendientes</th><th>Preparando</th><th>Listos</th>
                  </tr>
                </thead>
                <tbody>
                  {dias.map((dia) => (
                    <tr key={dia.key}>
                      <td className="td-day">{formatLongDate(dia.key)}</td>
                      <td style={{ fontWeight: 700 }}>{dia.pedidos}</td>
                      <td className="td-ventas">{fmt(dia.ventas)}</td>
                      <td><span className="td-pill pendiente">{dia.pendientes}</span></td>
                      <td><span className="td-pill preparando">{dia.preparando}</span></td>
                      <td><span className="td-pill listo">{dia.listos}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </>
  );
}

/* ───── MAIN ───── */
export default function Admin() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [diaActivo, setDiaActivo] = useState(getTodayKey());
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [vistaActiva, setVistaActiva] = useState("Pedidos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sonidoActivo, setSonidoActivo] = useState(false);

  const audioRef = useRef(new Audio(ding));
  const audioContextRef = useRef(null);
  const sonidoActivoRef = useRef(sonidoActivo);
  const reproducirSonidoPedidoRef = useRef(null);
  reproducirSonidoPedidoRef.current = reproducirSonidoPedido;

  useEffect(() => { sonidoActivoRef.current = sonidoActivo; }, [sonidoActivo]);
  useEffect(() => { audioRef.current.preload = "auto"; audioRef.current.volume = 0.9; }, []);

  useEffect(() => {
    cargarPedidos();
    socket.on("nuevo-pedido", (pedido) => {
      if (sonidoActivoRef.current) reproducirSonidoPedidoRef.current?.();
      setPedidos((prev) => [pedido, ...prev]);
      setDiaActivo(getDateKey(pedido.fecha));
      setVistaActiva("Pedidos");
    });
    socket.on("pedido-actualizado", (p) => {
      setPedidos((prev) => prev.map((x) => x.id === p.id ? p : x));
    });
    return () => { socket.off("nuevo-pedido"); socket.off("pedido-actualizado"); };
  }, []);

  async function cargarPedidos() {
    try { setError(""); setLoading(true); const r = await api.get("/pedidos"); setPedidos(r.data); }
    catch { setError("No pudimos cargar los pedidos. Revisa el servidor."); }
    finally { setLoading(false); }
  }

  function logout() { localStorage.removeItem("token"); navigate("/login"); }

  async function activarSonido() {
    try { await desbloquearAudio(); await reproducirSonidoPedido(); setSonidoActivo(true); setError(""); }
    catch { setError("No pudimos activar el sonido. Revisa permisos del navegador."); }
  }

  async function desbloquearAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && !audioContextRef.current) audioContextRef.current = new AC();
    if (audioContextRef.current?.state === "suspended") await audioContextRef.current.resume();
    audioRef.current.muted = true; audioRef.current.currentTime = 0;
    await audioRef.current.play(); audioRef.current.pause();
    audioRef.current.currentTime = 0; audioRef.current.muted = false;
  }

  async function reproducirSonidoPedido() {
    try { const a = new Audio(ding); a.volume = 1; await a.play(); }
    catch { reproducirBeepRespaldo(); }
  }

  function reproducirBeepRespaldo() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = audioContextRef.current || new AC();
    audioContextRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(880, ctx.currentTime); osc.frequency.setValueAtTime(660, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.5);
  }

  async function cambiarEstado(id, estado) {
    const prev = pedidos;
    setPedidos((p) => p.map((x) => x.id === id ? { ...x, estado } : x));
    try { await api.put(`/pedidos/${id}/estado`, { estado }); }
    catch { setPedidos(prev); setError("No pudimos actualizar el estado del pedido."); }
  }

  function exportarExcel() {
    const data = pedidos.map((p) => ({ Pedido: p.numero, Mesa: p.mesa, Estado: p.estado, Total: p.total, Metodo: p.metodo, Fecha: new Date(p.fecha).toLocaleString("es-CO") }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Informe"); XLSX.writeFile(wb, "informe-don-perrito.xlsx");
  }

  const diasDisponibles = useMemo(() => {
    const keys = [...new Set(pedidos.map((p) => getDateKey(p.fecha)))];
    return keys.sort((a, b) => dateFromKey(b) - dateFromKey(a));
  }, [pedidos]);

  const pedidosDelDia = useMemo(() => pedidos.filter((p) => getDateKey(p.fecha) === diaActivo), [diaActivo, pedidos]);

  const pedidosOperativos = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return pedidosDelDia.filter((p) => {
      const okSearch = term === "" || p.numero.toString().includes(term) || p.mesa.toString().includes(term) || p.items.some((i) => i.nombre.toLowerCase().includes(term));
      const okEstado = estadoFiltro === "Todos" || p.estado === estadoFiltro;
      return okSearch && okEstado;
    });
  }, [busqueda, estadoFiltro, pedidosDelDia]);

  const pedidosPorEstado = useMemo(() =>
    ["Pendiente", "Preparando", "Listo"].map((e) => ({ estado: e, pedidos: pedidosOperativos.filter((p) => p.estado === e) })),
    [pedidosOperativos]);

  const resumenDia = useMemo(() => getResumen(pedidosDelDia), [pedidosDelDia]);
  const resumenTotal = useMemo(() => getResumen(pedidos), [pedidos]);

  const ventasPorDia = useMemo(() => {
    const acc = pedidos.reduce((a, p) => {
      const key = getDateKey(p.fecha);
      if (!a[key]) a[key] = { fecha: formatShortDate(key), total: 0, pedidos: 0 };
      a[key].total += p.total; a[key].pedidos += 1;
      return a;
    }, {});
    return Object.entries(acc).sort(([a], [b]) => dateFromKey(a) - dateFromKey(b)).map(([, v]) => v);
  }, [pedidos]);

  return (
    <div className="adm-shell">
      <style>{CSS}</style>
      <div className="adm-inner">

        {/* ── HEADER ── */}
        <header className="adm-header">
          <div className="adm-header-top">
            <div className="adm-brand">
              <div className="adm-logo-wrap">
                <img src={logoDonPerrito} alt="Don Perrito" className="adm-logo" />
              </div>
              <div>
                <div className="adm-eyebrow">Panel administrativo</div>
                <div className="adm-title">Don Perrito</div>
                <div className="adm-sub">Centro de pedidos y reportes</div>
              </div>
            </div>
            <div className="adm-actions">
              <button
                className={`btn ${sonidoActivo ? "btn-orange active" : "btn-ghost"}`}
                onClick={() => sonidoActivo ? setSonidoActivo(false) : activarSonido()}
              >
                {sonidoActivo ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {sonidoActivo ? "Sonido activo" : "Activar sonido"}
              </button>
              <button className="btn btn-dark" onClick={cargarPedidos}>
                <RefreshCw size={16} /> Actualizar
              </button>
              <button className="btn btn-dark" onClick={logout}>
                <LogOut size={16} /> Salir
              </button>
            </div>
          </div>
        </header>

        {/* ── ERROR ── */}
        {error && (
          <div className="error-banner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* ── NAV ── */}
        <nav className="adm-nav">
          <div className="nav-tabs">
            {VISTAS.map((v) => (
              <button key={v} className={`nav-tab${vistaActiva === v ? " active" : ""}`} onClick={() => setVistaActiva(v)}>{v}</button>
            ))}
          </div>
          <div className="nav-day-controls">
            <button className="btn btn-orange" style={{ padding: "8px 16px", fontSize: 12 }} onClick={() => setDiaActivo(getTodayKey())}>Hoy</button>
            <button className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: 12 }} onClick={() => setDiaActivo(getRelativeDateKey(-1))}>Ayer</button>
            <select className="day-select" value={diaActivo} onChange={(e) => setDiaActivo(e.target.value)}>
              {[diaActivo, ...diasDisponibles].filter(Boolean).filter((d, i, a) => a.indexOf(d) === i).map((d) => (
                <option key={d} value={d}>{formatLongDate(d)}</option>
              ))}
            </select>
          </div>
        </nav>

        {/* ── CONTENT ── */}
        {vistaActiva === "Pedidos" ? (
          <>
            {/* Métricas */}
            <div className="metrics-grid">
              <Metric icon={TrendingUp} label="Ventas del día" value={fmt(resumenDia.ventas)} tone="orange" sparkData={ventasPorDia} />
              <Metric icon={ClipboardList} label="Pedidos hoy" value={resumenDia.total} tone="amber" sparkData={ventasPorDia} />
              <Metric icon={Siren} label="Pendientes" value={resumenDia.pendientes} tone="amber" />
              <Metric icon={ChefHat} label="En cocina" value={resumenDia.preparando} tone="sky" />
              <Metric icon={CheckCircle2} label="Listos" value={resumenDia.listos} tone="emerald" />
            </div>

            {/* Search */}
            <div className="search-bar">
              <div className="search-input-wrap">
                <Search size={16} className="search-icon" />
                <input className="search-input" type="search" placeholder="Buscar pedido, mesa o producto…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              <select className="filter-select" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {/* Day heading */}
            <div className="day-heading">
              <div className="day-heading-left">
                <CalendarDays size={20} style={{ color: "var(--orange)" }} />
                <div>
                  <div className="day-heading-title">{formatLongDate(diaActivo)}</div>
                  <div className="day-heading-count">{pedidosOperativos.length} pedido{pedidosOperativos.length !== 1 ? "s" : ""} en pantalla</div>
                </div>
              </div>
            </div>

            {/* Kanban */}
            {loading ? (
              <EmptyState text="Cargando pedidos…" />
            ) : pedidosOperativos.length === 0 ? (
              <EmptyState text="No hay pedidos para este día o filtro." />
            ) : (
              <div className="kanban-grid">
                {pedidosPorEstado
                  .filter(({ estado }) => estadoFiltro === "Todos" || estadoFiltro === estado)
                  .map(({ estado, pedidos: ps }) => (
                    <EstadoColumn key={estado} estado={estado} pedidos={ps} onCambiarEstado={cambiarEstado} />
                  ))}
              </div>
            )}
          </>
        ) : (
          <Informe exportarExcel={exportarExcel} pedidos={pedidos} resumenTotal={resumenTotal} ventasPorDia={ventasPorDia} />
        )}
      </div>
    </div>
  );
}

/* ───── HELPERS ───── */
function getResumen(pedidos) {
  return {
    ventas: pedidos.reduce((a, p) => a + p.total, 0),
    total: pedidos.length,
    pendientes: pedidos.filter((p) => p.estado === "Pendiente").length,
    preparando: pedidos.filter((p) => p.estado === "Preparando").length,
    listos: pedidos.filter((p) => p.estado === "Listo").length,
  };
}
function getTodayKey() { return getDateKey(new Date()); }
function getRelativeDateKey(days) { const d = new Date(); d.setDate(d.getDate() + days); return getDateKey(d); }
function getDateKey(fecha) {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatShortDate(key) { return dateFromKey(key).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }); }
function formatLongDate(key) { return dateFromKey(key).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }); }
function dateFromKey(key) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); }
