import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, CheckCircle2, ChefHat, ClipboardList, Download, LogOut, RefreshCw, Search, Siren, TrendingUp, Volume2, VolumeX } from "lucide-react";
import * as XLSX from "xlsx";
import ding from "../assets/ding.mp3";
import logoDonPerrito from "../assets/logo-don-perrito.png";
import { api } from "../services/api";
import { socket } from "../services/socket";
import { fmt } from "../utils/format";

const ESTADOS = ["Todos", "Pendiente", "Preparando", "Listo"];
const VISTAS = ["Pedidos", "Informe"];

const ADMIN_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  .admin-root {
    min-height: 100vh; background: #0f0f0f;
    font-family: 'DM Sans', sans-serif; color: #fff;
  }

  /* Sidebar-style top header */
  .admin-header {
    background: linear-gradient(135deg, #1a0a00 0%, #0f0f0f 60%);
    border-bottom: 1px solid rgba(234,88,12,0.15);
    padding: 1.25rem 1.5rem;
  }
  .admin-header-inner {
    max-width: 1400px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 1rem;
  }
  .admin-brand { display: flex; align-items: center; gap: 1rem; }
  .admin-logo {
    width: 48px; height: 48px; border-radius: 12px; object-fit: cover;
    border: 1.5px solid rgba(234,88,12,0.4);
    box-shadow: 0 0 16px rgba(234,88,12,0.25);
  }
  .admin-eyebrow {
    font-size: 0.62rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
    color: #f97316; margin-bottom: 2px;
  }
  .admin-title {
    font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 900; color: #fff; line-height: 1;
  }

  .admin-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .btn-icon {
    display: inline-flex; align-items: center; gap: 0.45rem;
    padding: 0.55rem 1rem; border-radius: 10px; border: none;
    font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-sound-on { background: rgba(234,88,12,0.2); color: #f97316; border: 1px solid rgba(234,88,12,0.3); }
  .btn-sound-on:hover { background: rgba(234,88,12,0.3); }
  .btn-sound-off { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.1); }
  .btn-sound-off:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .btn-refresh { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.1); }
  .btn-refresh:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .btn-logout { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
  .btn-logout:hover { background: rgba(239,68,68,0.2); }

  /* Main layout */
  .admin-main { max-width: 1400px; margin: 0 auto; padding: 1.5rem; }

  /* Error */
  .err-bar {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
    border-radius: 12px; padding: 0.85rem 1rem; margin-bottom: 1.25rem;
    color: #fca5a5; font-size: 0.82rem; font-weight: 500;
  }

  /* Tab + Date bar */
  .control-bar {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 0.75rem;
  }
  .tab-group { display: flex; gap: 0.35rem; }
  .tab-btn {
    padding: 0.5rem 1.1rem; border-radius: 10px; border: none;
    font-family: 'Syne', sans-serif; font-size: 0.8rem; font-weight: 800;
    cursor: pointer; transition: all 0.2s;
  }
  .tab-active { background: #fff; color: #0f0f0f; }
  .tab-inactive { background: transparent; color: rgba(255,255,255,0.4); }
  .tab-inactive:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.06); }

  .date-group { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
  .btn-date {
    padding: 0.5rem 0.9rem; border-radius: 10px; border: none;
    font-family: 'DM Sans', sans-serif; font-size: 0.78rem; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-date-today { background: #ea580c; color: #fff; }
  .btn-date-today:hover { background: #c2410c; }
  .btn-date-ayer { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
  .btn-date-ayer:hover { background: rgba(255,255,255,0.14); color: #fff; }
  .date-select {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; color: #fff; padding: 0.5rem 0.9rem;
    font-size: 0.78rem; font-weight: 600; outline: none;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
  }
  .date-select option { background: #1a1a1a; }

  /* Metrics row */
  .metrics-grid {
    display: grid; gap: 0.9rem; margin-bottom: 1.5rem;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  }
  .metric-card {
    border-radius: 16px; padding: 1.1rem 1.25rem;
    position: relative; overflow: hidden;
    transition: transform 0.2s; cursor: default;
  }
  .metric-card:hover { transform: translateY(-2px); }
  .metric-card::after {
    content: ''; position: absolute; top: -30px; right: -30px;
    width: 90px; height: 90px; border-radius: 50%; background: rgba(255,255,255,0.08);
  }
  .metric-label {
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    opacity: 0.75; margin-bottom: 0.6rem;
  }
  .metric-value {
    font-family: 'Syne', sans-serif; font-size: 1.75rem; font-weight: 900; line-height: 1;
  }
  .metric-icon { position: absolute; top: 1rem; right: 1rem; opacity: 0.4; }

  .mc-orange { background: linear-gradient(135deg, #ea580c, #c2410c); color: #fff; }
  .mc-amber { background: linear-gradient(135deg, #d97706, #b45309); color: #fff; }
  .mc-sky { background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; }
  .mc-emerald { background: linear-gradient(135deg, #059669, #047857); color: #fff; }
  .mc-gray { background: rgba(255,255,255,0.06); color: #fff; border: 1px solid rgba(255,255,255,0.08); }

  /* Search + filter */
  .filter-bar {
    display: grid; gap: 0.75rem; margin-bottom: 1.5rem;
    grid-template-columns: 1fr auto;
  }
  .search-wrap { position: relative; }
  .search-input {
    width: 100%; padding: 0.75rem 1rem 0.75rem 2.7rem;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
    outline: none; transition: all 0.2s; box-sizing: border-box;
  }
  .search-input::placeholder { color: rgba(255,255,255,0.25); }
  .search-input:focus { border-color: rgba(234,88,12,0.5); background: rgba(234,88,12,0.06); }
  .search-icon { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); opacity: 0.4; }

  .filter-select {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; color: #fff; padding: 0.75rem 1rem;
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600; outline: none;
  }
  .filter-select option { background: #1a1a1a; }

  /* Kanban columns */
  .kanban { display: grid; gap: 1rem; }
  @media (min-width: 1000px) { .kanban { grid-template-columns: repeat(3, 1fr); } }

  .col-wrap { border-radius: 18px; padding: 1rem; border: 1px solid; }
  .col-pending { background: rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.2); }
  .col-cooking { background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.2); }
  .col-done { background: rgba(34,197,94,0.06); border-color: rgba(34,197,94,0.2); }

  .col-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
  .col-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .ci-amber { background: rgba(245,158,11,0.2); color: #f59e0b; }
  .ci-sky { background: rgba(59,130,246,0.2); color: #3b82f6; }
  .ci-emerald { background: rgba(34,197,94,0.2); color: #22c55e; }
  .col-title { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800; color: #fff; }
  .col-count { font-size: 0.72rem; color: rgba(255,255,255,0.4); font-weight: 500; }

  /* Order cards */
  .order-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 1rem; margin-bottom: 0.65rem;
    transition: all 0.2s; animation: cardIn 0.3s ease both;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .order-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); }

  .order-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
  .order-num {
    font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 900; color: #fff;
  }
  .order-price { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 900; color: #f97316; }
  .order-meta { font-size: 0.72rem; color: rgba(255,255,255,0.4); margin-bottom: 0.75rem; }

  .estado-pill {
    display: inline-block; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; padding: 0.2rem 0.6rem; border-radius: 999px; margin-left: 0.5rem;
  }
  .ep-pending { background: rgba(245,158,11,0.15); color: #fbbf24; }
  .ep-cooking { background: rgba(59,130,246,0.15); color: #60a5fa; }
  .ep-done { background: rgba(34,197,94,0.15); color: #4ade80; }

  .order-items { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.85rem; }
  .order-item-row {
    display: flex; justify-content: space-between;
    background: rgba(255,255,255,0.03); border-radius: 8px;
    padding: 0.5rem 0.7rem; font-size: 0.78rem;
  }
  .order-item-name { color: rgba(255,255,255,0.8); font-weight: 500; }
  .order-item-price { color: rgba(255,255,255,0.4); }

  .state-btns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; }
  .state-btn {
    padding: 0.5rem; border-radius: 8px; border: none;
    font-family: 'Syne', sans-serif; font-size: 0.7rem; font-weight: 800;
    cursor: pointer; transition: all 0.15s;
  }
  .state-btn-active { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.3); cursor: not-allowed; }
  .state-btn-inactive { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); }
  .state-btn-inactive:hover { background: rgba(234,88,12,0.25); color: #f97316; }

  .empty-col {
    border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px;
    padding: 2rem; text-align: center;
    font-size: 0.78rem; color: rgba(255,255,255,0.25); font-weight: 500;
  }

  /* Chart */
  .chart-wrap { height: 260px; margin-top: 1rem; }
  .custom-tooltip {
    background: rgba(15,15,15,0.95); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 0.65rem 0.9rem; font-size: 0.78rem;
  }

  /* Report table */
  .report-table { width: 100%; border-collapse: collapse; min-width: 640px; }
  .report-th {
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    color: rgba(255,255,255,0.35); padding: 0.75rem 1rem; text-align: left;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .report-td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.84rem; }
  .report-td-day { font-family: 'Syne', sans-serif; font-weight: 800; color: #fff; text-transform: capitalize; }
  .report-td-ventas { font-family: 'Syne', sans-serif; font-weight: 900; color: #f97316; }
  .report-td-num { color: rgba(255,255,255,0.6); }

  .glass-panel {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px; padding: 1.25rem; margin-bottom: 1.25rem;
  }
  .panel-title {
    font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 900;
    color: #fff; margin-bottom: 0.35rem;
  }
  .panel-sub { font-size: 0.75rem; color: rgba(255,255,255,0.35); }

  .panel-actions { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.5rem; }
  .btn-export {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.25);
    color: #4ade80; padding: 0.6rem 1.1rem; border-radius: 10px;
    font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
    font-family: 'DM Sans', sans-serif; border: none;
  }
  .btn-export:hover { background: rgba(34,197,94,0.25); }

  .day-header {
    display: flex; align-items: center; gap: 0.6rem;
    margin-bottom: 0.35rem;
  }
  .day-title {
    font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 900;
    color: #fff; text-transform: capitalize;
  }
  .day-sub { font-size: 0.75rem; color: rgba(255,255,255,0.35); }

  .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.3); font-size: 0.85rem; }
`;

const estadoPillClass = { Pendiente: "ep-pending", Preparando: "ep-cooking", Listo: "ep-done" };
const colClass = { Pendiente: "col-pending", Preparando: "col-cooking", Listo: "col-done" };
const colIconClass = { Pendiente: "ci-amber", Preparando: "ci-sky", Listo: "ci-emerald" };
const colTitles = { Pendiente: "Pendientes", Preparando: "En cocina", Listo: "Listos" };
const colIcons = { Pendiente: Siren, Preparando: ChefHat, Listo: CheckCircle2 };

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
  const reproducirRef = useRef(null);
  reproducirRef.current = reproducirSonidoPedido;

  useEffect(() => { sonidoActivoRef.current = sonidoActivo; }, [sonidoActivo]);
  useEffect(() => { audioRef.current.preload = "auto"; audioRef.current.volume = 0.9; }, []);

  useEffect(() => {
    cargarPedidos();
    socket.on("nuevo-pedido", (pedido) => {
      if (sonidoActivoRef.current) reproducirRef.current?.();
      setPedidos((prev) => [pedido, ...prev]);
      setDiaActivo(getDateKey(pedido.fecha)); setVistaActiva("Pedidos");
    });
    socket.on("pedido-actualizado", (p) => setPedidos((prev) => prev.map((x) => x.id === p.id ? p : x)));
    return () => { socket.off("nuevo-pedido"); socket.off("pedido-actualizado"); };
  }, []);

  async function cargarPedidos() {
    try { setError(""); setLoading(true); const r = await api.get("/pedidos"); setPedidos(r.data); }
    catch { setError("No pudimos cargar los pedidos."); } finally { setLoading(false); }
  }
  function logout() { localStorage.removeItem("token"); navigate("/login"); }

  async function activarSonido() {
    try { await desbloquearAudio(); await reproducirSonidoPedido(); setSonidoActivo(true); }
    catch { setError("No pudimos activar el sonido."); }
  }
  async function desbloquearAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && !audioContextRef.current) audioContextRef.current = new AC();
    if (audioContextRef.current?.state === "suspended") await audioContextRef.current.resume();
    audioRef.current.muted = true; audioRef.current.currentTime = 0;
    await audioRef.current.play(); audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current.muted = false;
  }
  async function reproducirSonidoPedido() {
    try { const a = new Audio(ding); a.volume = 1; await a.play(); } catch { reproducirBeep(); }
  }
  function reproducirBeep() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = audioContextRef.current || new AC(); audioContextRef.current = ctx;
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
    catch { setPedidos(prev); setError("No pudimos actualizar el estado."); }
  }

  const diasDisponibles = useMemo(() => {
    const keys = [...new Set(pedidos.map((p) => getDateKey(p.fecha)))];
    return keys.sort((a, b) => dateFromKey(b) - dateFromKey(a));
  }, [pedidos]);

  const pedidosDelDia = useMemo(() => pedidos.filter((p) => getDateKey(p.fecha) === diaActivo), [diaActivo, pedidos]);
  const pedidosOperativos = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    return pedidosDelDia.filter((p) => {
      const busq = t === "" || p.numero.toString().includes(t) || p.mesa.toString().includes(t) || p.items.some((i) => i.nombre.toLowerCase().includes(t));
      const est = estadoFiltro === "Todos" || p.estado === estadoFiltro;
      return busq && est;
    });
  }, [busqueda, estadoFiltro, pedidosDelDia]);

  const pedidosPorEstado = useMemo(() =>
    ["Pendiente", "Preparando", "Listo"].map((e) => ({ estado: e, pedidos: pedidosOperativos.filter((p) => p.estado === e) }))
  , [pedidosOperativos]);

  const resumenDia = useMemo(() => getResumen(pedidosDelDia), [pedidosDelDia]);
  const resumenTotal = useMemo(() => getResumen(pedidos), [pedidos]);
  const ventasPorDia = useMemo(() => {
    const acc = pedidos.reduce((a, p) => {
      const k = getDateKey(p.fecha);
      if (!a[k]) a[k] = { fecha: formatShortDate(k), total: 0, pedidos: 0 };
      a[k].total += p.total; a[k].pedidos += 1; return a;
    }, {});
    return Object.entries(acc).sort(([a], [b]) => dateFromKey(a) - dateFromKey(b)).map(([, v]) => v);
  }, [pedidos]);

  function exportarExcel() {
    const data = pedidos.map((p) => ({ Pedido: p.numero, Mesa: p.mesa, Estado: p.estado, Total: p.total, Metodo: p.metodo, Fecha: new Date(p.fecha).toLocaleString("es-CO") }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Informe");
    XLSX.writeFile(wb, "informe-don-perrito.xlsx");
  }

  return (
    <>
      <style>{ADMIN_STYLES}</style>
      <div className="admin-root">
        <header className="admin-header">
          <div className="admin-header-inner">
            <div className="admin-brand">
              <img src={logoDonPerrito} alt="Don Perrito" className="admin-logo" />
              <div>
                <p className="admin-eyebrow">Panel administrativo</p>
                <h1 className="admin-title">Centro de pedidos</h1>
              </div>
            </div>
            <div className="admin-actions">
              <button
                className={`btn-icon ${sonidoActivo ? "btn-sound-on" : "btn-sound-off"}`}
                onClick={() => sonidoActivo ? setSonidoActivo(false) : activarSonido()}
              >
                {sonidoActivo ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {sonidoActivo ? "Sonido ON" : "Activar sonido"}
              </button>
              <button className="btn-icon btn-refresh" onClick={cargarPedidos}>
                <RefreshCw size={15} /> Actualizar
              </button>
              <button className="btn-icon btn-logout" onClick={logout}>
                <LogOut size={15} /> Salir
              </button>
            </div>
          </div>
        </header>

        <div className="admin-main">
          {error && <div className="err-bar">⚠ {error}</div>}

          {/* Control bar */}
          <div className="control-bar">
            <div className="tab-group">
              {VISTAS.map((v) => (
                <button key={v} className={`tab-btn ${vistaActiva === v ? "tab-active" : "tab-inactive"}`} onClick={() => setVistaActiva(v)}>
                  {v}
                </button>
              ))}
            </div>
            <div className="date-group">
              <button className="btn-date btn-date-today" onClick={() => setDiaActivo(getTodayKey())}>Hoy</button>
              <button className="btn-date btn-date-ayer" onClick={() => setDiaActivo(getRelativeDateKey(-1))}>Ayer</button>
              <select className="date-select" value={diaActivo} onChange={(e) => setDiaActivo(e.target.value)}>
                {[diaActivo, ...diasDisponibles].filter(Boolean).filter((d, i, a) => a.indexOf(d) === i).map((d) => (
                  <option key={d} value={d}>{formatLongDate(d)}</option>
                ))}
              </select>
            </div>
          </div>

          {vistaActiva === "Pedidos" ? (
            <>
              {/* Metrics */}
              <div className="metrics-grid">
                <MetricCard icon={TrendingUp} label="Ventas del día" value={fmt(resumenDia.ventas)} cls="mc-orange" />
                <MetricCard icon={ClipboardList} label="Pedidos" value={resumenDia.total} cls="mc-gray" />
                <MetricCard icon={Siren} label="Pendientes" value={resumenDia.pendientes} cls="mc-amber" />
                <MetricCard icon={ChefHat} label="Preparando" value={resumenDia.preparando} cls="mc-sky" />
                <MetricCard icon={CheckCircle2} label="Listos" value={resumenDia.listos} cls="mc-emerald" />
              </div>

              {/* Search */}
              <div className="filter-bar">
                <div className="search-wrap">
                  <Search size={16} className="search-icon" />
                  <input type="search" className="search-input" placeholder="Buscar pedido, mesa o producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                </div>
                <select className="filter-select" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                  {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Day header */}
              <div className="day-header" style={{ marginBottom: "1rem" }}>
                <CalendarDays size={20} style={{ color: "#f97316" }} />
                <div>
                  <p className="day-title">{formatLongDate(diaActivo)}</p>
                  <p className="day-sub">{pedidosOperativos.length} pedido{pedidosOperativos.length !== 1 ? "s" : ""} en pantalla</p>
                </div>
              </div>

              {/* Kanban */}
              {loading ? (
                <div className="loading-state"><span className="spinner" style={{ marginRight: 10 }} />Cargando pedidos...</div>
              ) : pedidosOperativos.length === 0 ? (
                <div className="empty-col">No hay pedidos para este día o filtro.</div>
              ) : (
                <div className="kanban">
                  {pedidosPorEstado
                    .filter(({ estado }) => estadoFiltro === "Todos" || estadoFiltro === estado)
                    .map(({ estado, pedidos: ps }) => {
                      const Icon = colIcons[estado];
                      return (
                        <div key={estado} className={`col-wrap ${colClass[estado]}`}>
                          <div className="col-header">
                            <div className={`col-icon ${colIconClass[estado]}`}><Icon size={18} /></div>
                            <div>
                              <div className="col-title">{colTitles[estado]}</div>
                              <div className="col-count">{ps.length} pedido{ps.length !== 1 ? "s" : ""}</div>
                            </div>
                          </div>
                          <div>
                            {ps.length === 0 ? (
                              <div className="empty-col">Sin pedidos</div>
                            ) : ps.map((pedido, i) => (
                              <div key={pedido.id} className="order-card" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="order-card-top">
                                  <span className="order-num">
                                    #{pedido.numero}
                                    <span className={`estado-pill ${estadoPillClass[pedido.estado]}`}>{pedido.estado}</span>
                                  </span>
                                  <span className="order-price">{fmt(pedido.total)}</span>
                                </div>
                                <p className="order-meta">
                                  Mesa #{pedido.mesa} · {pedido.metodo} · {new Date(pedido.fecha).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                                <div className="order-items">
                                  {pedido.items.map((item) => (
                                    <div key={item.id} className="order-item-row">
                                      <span className="order-item-name">{item.qty}× {item.nombre}</span>
                                      <span className="order-item-price">{fmt(item.qty * item.precio)}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="state-btns">
                                  {ESTADOS.filter((e) => e !== "Todos").map((e) => (
                                    <button
                                      key={e}
                                      className={`state-btn ${pedido.estado === e ? "state-btn-active" : "state-btn-inactive"}`}
                                      onClick={() => cambiarEstado(pedido.id, e)}
                                      disabled={pedido.estado === e}
                                    >
                                      {e}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          ) : (
            <InformeView pedidos={pedidos} resumenTotal={resumenTotal} ventasPorDia={ventasPorDia} exportarExcel={exportarExcel} />
          )}
        </div>
      </div>
    </>
  );
}

function InformeView({ pedidos, resumenTotal, ventasPorDia, exportarExcel }) {
  const dias = useMemo(() => {
    const acc = pedidos.reduce((a, p) => {
      const k = getDateKey(p.fecha);
      if (!a[k]) a[k] = { key: k, ventas: 0, pedidos: 0, pendientes: 0, preparando: 0, listos: 0 };
      a[k].ventas += p.total; a[k].pedidos += 1;
      if (p.estado === "Pendiente") a[k].pendientes += 1;
      if (p.estado === "Preparando") a[k].preparando += 1;
      if (p.estado === "Listo") a[k].listos += 1;
      return a;
    }, {});
    return Object.values(acc).sort((a, b) => dateFromKey(b.key) - dateFromKey(a.key));
  }, [pedidos]);

  return (
    <>
      <div className="metrics-grid">
        <MetricCard icon={TrendingUp} label="Ventas totales" value={fmt(resumenTotal.ventas)} cls="mc-orange" />
        <MetricCard icon={ClipboardList} label="Pedidos" value={resumenTotal.total} cls="mc-gray" />
        <MetricCard icon={Siren} label="Pendientes" value={resumenTotal.pendientes} cls="mc-amber" />
        <MetricCard icon={ChefHat} label="Preparando" value={resumenTotal.preparando} cls="mc-sky" />
        <MetricCard icon={CheckCircle2} label="Listos" value={resumenTotal.listos} cls="mc-emerald" />
      </div>

      <div className="glass-panel">
        <div className="panel-actions">
          <div>
            <p className="panel-title">Ventas por día</p>
            <p className="panel-sub">Resumen de todos los días registrados.</p>
          </div>
          <button className="btn-export" onClick={exportarExcel}>
            <Download size={15} /> Exportar Excel
          </button>
        </div>
        <div className="chart-wrap">
          {ventasPorDia.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasPorDia} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <XAxis dataKey="fecha" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 12 }}
                  formatter={(v) => [fmt(v), "Ventas"]}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="total" fill="#ea580c" radius={[8, 8, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="loading-state">No hay ventas registradas aún.</div>
          )}
        </div>
      </div>

      <div className="glass-panel">
        <p className="panel-title" style={{ marginBottom: "1rem" }}>Informe por día</p>
        <div style={{ overflowX: "auto" }}>
          <table className="report-table">
            <thead>
              <tr>
                {["Día", "Pedidos", "Ventas", "Pendientes", "Preparando", "Listos"].map((h) => (
                  <th key={h} className="report-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dias.map((d) => (
                <tr key={d.key}>
                  <td className="report-td report-td-day">{formatLongDate(d.key)}</td>
                  <td className="report-td report-td-num">{d.pedidos}</td>
                  <td className="report-td report-td-ventas">{fmt(d.ventas)}</td>
                  <td className="report-td report-td-num">{d.pendientes}</td>
                  <td className="report-td report-td-num">{d.preparando}</td>
                  <td className="report-td report-td-num">{d.listos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, cls }) {
  return (
    <div className={`metric-card ${cls}`}>
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      {Icon && <span className="metric-icon"><Icon size={22} /></span>}
    </div>
  );
}

function getTodayKey() { return getDateKey(new Date()); }
function getRelativeDateKey(days) { const d = new Date(); d.setDate(d.getDate() + days); return getDateKey(d); }
function getDateKey(fecha) { const d = new Date(fecha); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function formatShortDate(key) { return dateFromKey(key).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }); }
function formatLongDate(key) { return dateFromKey(key).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }); }
function dateFromKey(key) { const [y,m,d] = key.split("-").map(Number); return new Date(y, m-1, d); }
function getResumen(pedidos) {
  return {
    ventas: pedidos.reduce((a, p) => a + p.total, 0),
    total: pedidos.length,
    pendientes: pedidos.filter((p) => p.estado === "Pendiente").length,
    preparando: pedidos.filter((p) => p.estado === "Preparando").length,
    listos: pedidos.filter((p) => p.estado === "Listo").length,
  };
}
