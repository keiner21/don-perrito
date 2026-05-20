cat > /mnt/user-data/outputs/don-perrito/Admin.jsx << 'ENDOFFILE'
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  CalendarDays, CheckCircle2, ChefHat, ClipboardList, Download,
  LogOut, RefreshCw, Search, Siren, TrendingUp, Volume2, VolumeX,
} from "lucide-react";
import * as XLSX from "xlsx";
import ding from "../assets/ding.mp3";
import logoDonPerrito from "../assets/logo-don-perrito.png";
import { api } from "../services/api";
import { socket } from "../services/socket";
import { fmt } from "../utils/format";

const ESTADOS = ["Todos", "Pendiente", "Preparando", "Listo"];
const VISTAS = ["Pedidos", "Informe"];

/* ─── helpers de fecha ─── */
function getTodayKey() { return getDateKey(new Date()); }
function getRelativeDateKey(days) {
  const d = new Date(); d.setDate(d.getDate() + days); return getDateKey(d);
}
function getDateKey(fecha) {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function dateFromKey(key) {
  const [y,m,d] = key.split("-").map(Number); return new Date(y, m-1, d);
}
function formatShortDate(key) {
  return dateFromKey(key).toLocaleDateString("es-CO",{day:"2-digit",month:"short"});
}
function formatLongDate(key) {
  return dateFromKey(key).toLocaleDateString("es-CO",{day:"numeric",month:"long",year:"numeric"});
}
function getResumen(pedidos) {
  return {
    ventas: pedidos.reduce((a,p)=>a+p.total,0),
    total: pedidos.length,
    pendientes: pedidos.filter(p=>p.estado==="Pendiente").length,
    preparando: pedidos.filter(p=>p.estado==="Preparando").length,
    listos: pedidos.filter(p=>p.estado==="Listo").length,
  };
}

/* ─── config visual columnas kanban ─── */
const KANBAN_CFG = {
  Pendiente: { icon: Siren,        label:"Pendientes", color:"#f59e0b", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.2)", dot:"#f59e0b" },
  Preparando: { icon: ChefHat,     label:"En cocina",  color:"#38bdf8", bg:"rgba(56,189,248,0.08)", border:"rgba(56,189,248,0.2)", dot:"#38bdf8" },
  Listo:      { icon: CheckCircle2,label:"Listos",     color:"#22c55e", bg:"rgba(34,197,94,0.08)",  border:"rgba(34,197,94,0.2)",  dot:"#22c55e" },
};

/* ─── CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;}
  :root{
    --bg:#08080e;--surface:rgba(255,255,255,0.03);--surface2:rgba(255,255,255,0.055);
    --border:rgba(255,255,255,0.07);--amber:#f59e0b;--orange:#f97316;
    --text:#f1f0ee;--muted:rgba(255,255,255,0.35);
  }
  body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;}
  .adm{min-height:100vh;background:var(--bg);}

  /* ── header ── */
  .adm-header{
    background:rgba(8,8,14,0.9);backdrop-filter:blur(20px);
    border-bottom:1px solid var(--border);
    padding:16px 24px;
    display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;
    position:sticky;top:0;z-index:50;
  }
  .adm-brand{display:flex;align-items:center;gap:14px;}
  .adm-logo{width:52px;height:52px;border-radius:16px;object-fit:cover;border:2px solid rgba(249,115,22,0.35);box-shadow:0 0 24px rgba(249,115,22,0.2);}
  .adm-eyebrow{font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--amber);}
  .adm-title{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--text);}
  .adm-sub{font-size:12px;color:var(--muted);margin-top:2px;}
  .adm-live{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;display:inline-block;margin-right:6px;animation:blink 2s ease-in-out infinite;}
  .adm-actions{display:flex;gap:8px;flex-wrap:wrap;}
  .adm-btn{
    display:inline-flex;align-items:center;gap:7px;
    padding:10px 18px;border-radius:12px;border:1px solid var(--border);
    background:var(--surface);color:var(--muted);font-size:13px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;
  }
  .adm-btn:hover{color:var(--text);border-color:rgba(255,255,255,0.15);}
  .adm-btn.active{background:rgba(249,115,22,0.15);border-color:rgba(249,115,22,0.4);color:var(--orange);}
  .adm-btn.danger:hover{background:rgba(255,107,107,0.1);border-color:rgba(255,107,107,0.3);color:#ff6b6b;}

  /* ── inner wrapper ── */
  .adm-inner{max-width:1400px;margin:0 auto;padding:24px 24px 60px;}

  /* ── error ── */
  .adm-error{
    margin-bottom:16px;padding:12px 16px;
    background:rgba(255,107,107,0.08);border:1px solid rgba(255,107,107,0.2);
    border-radius:12px;font-size:13px;color:#ff6b6b;display:flex;align-items:center;gap:8px;
  }

  /* ── toolbar (vistas + día) ── */
  .adm-toolbar{
    display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;
    background:var(--surface);border:1px solid var(--border);border-radius:20px;
    padding:12px 16px;margin-bottom:20px;
  }
  .adm-vista-group{display:flex;gap:6px;}
  .adm-vista-btn{
    padding:9px 20px;border-radius:12px;border:1px solid transparent;
    background:transparent;color:var(--muted);font-size:13px;font-weight:700;
    cursor:pointer;font-family:'Syne',sans-serif;transition:all 0.2s;
  }
  .adm-vista-btn:hover{color:var(--text);}
  .adm-vista-btn.active{background:var(--text);color:#08080e;border-color:transparent;}
  .adm-day-group{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
  .adm-day-btn{
    padding:9px 16px;border-radius:12px;border:1px solid var(--border);
    background:var(--surface2);color:var(--muted);font-size:13px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;
  }
  .adm-day-btn:hover{color:var(--text);border-color:rgba(255,255,255,0.15);}
  .adm-day-btn.today{background:rgba(249,115,22,0.15);border-color:rgba(249,115,22,0.35);color:var(--orange);}
  .adm-day-select{
    padding:9px 14px;border-radius:12px;border:1px solid var(--border);
    background:var(--surface2);color:var(--text);font-size:13px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;outline:none;
  }
  .adm-day-select option{background:#1a1a24;color:var(--text);}

  /* ── metrics row ── */
  .adm-metrics{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));margin-bottom:20px;}
  .adm-metric{
    border-radius:18px;padding:18px 16px;
    display:flex;align-items:center;gap:14px;
    border:1px solid var(--border);background:var(--surface);
    transition:border-color 0.2s;
  }
  .adm-metric:hover{border-color:rgba(255,255,255,0.12);}
  .adm-metric-icon{
    width:44px;height:44px;border-radius:12px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
  }
  .adm-metric-val{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:var(--text);line-height:1;}
  .adm-metric-lbl{font-size:11px;color:var(--muted);margin-top:4px;letter-spacing:0.5px;text-transform:uppercase;}

  /* ── search bar ── */
  .adm-search-bar{
    display:flex;gap:10px;flex-wrap:wrap;align-items:center;
    background:var(--surface);border:1px solid var(--border);border-radius:18px;
    padding:12px 14px;margin-bottom:20px;
  }
  .adm-search-wrap{position:relative;flex:1;min-width:200px;}
  .adm-search-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none;}
  .adm-search-input{
    width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:12px;
    padding:11px 14px 11px 40px;font-size:14px;color:var(--text);outline:none;
    font-family:'DM Sans',sans-serif;transition:all 0.2s;
  }
  .adm-search-input::placeholder{color:var(--muted);}
  .adm-search-input:focus{border-color:rgba(249,115,22,0.4);box-shadow:0 0 0 3px rgba(249,115,22,0.08);}
  .adm-estado-select{
    padding:11px 14px;border-radius:12px;border:1px solid var(--border);
    background:var(--surface2);color:var(--text);font-size:13px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;outline:none;
  }
  .adm-estado-select option{background:#1a1a24;color:var(--text);}

  /* ── day label ── */
  .adm-day-label{
    display:flex;align-items:center;gap:8px;margin-bottom:16px;
  }
  .adm-day-title{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--text);text-transform:capitalize;}
  .adm-day-count{font-size:13px;color:var(--muted);margin-top:2px;}

  /* ── kanban columns ── */
  .adm-kanban{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));}
  .adm-col{border-radius:24px;border:1px solid var(--border);padding:16px;background:var(--surface);}
  .adm-col-header{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
  .adm-col-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .adm-col-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--text);}
  .adm-col-count{font-size:12px;color:var(--muted);margin-top:2px;}
  .adm-col-empty{
    border:1px dashed rgba(255,255,255,0.1);border-radius:16px;padding:28px;
    text-align:center;font-size:13px;color:var(--muted);font-weight:500;
  }
  .adm-cards{display:flex;flex-direction:column;gap:10px;}

  /* ── order card ── */
  .adm-card{
    background:var(--surface2);border:1px solid var(--border);border-radius:18px;padding:16px;
    animation:slideIn 0.25s ease both;transition:border-color 0.2s;
  }
  .adm-card:hover{border-color:rgba(255,255,255,0.12);}
  .adm-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;}
  .adm-card-num{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--text);}
  .adm-card-badge{
    display:inline-flex;align-items:center;gap:5px;
    padding:4px 10px;border-radius:100px;font-size:11px;font-weight:700;
  }
  .adm-card-dot{width:5px;height:5px;border-radius:50%;}
  .adm-card-meta{font-size:12px;color:var(--muted);margin-bottom:12px;display:flex;gap:12px;flex-wrap:wrap;}
  .adm-card-items{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;}
  .adm-card-item{
    display:flex;align-items:center;justify-content:space-between;
    background:rgba(255,255,255,0.03);border:1px solid var(--border);
    border-radius:10px;padding:8px 10px;
  }
  .adm-item-name{font-size:13px;font-weight:600;color:var(--text);}
  .adm-item-unit{font-size:11px;color:var(--muted);margin-top:1px;}
  .adm-item-price{font-size:13px;font-weight:700;color:var(--amber);flex-shrink:0;}
  .adm-card-total{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--amber);text-align:right;margin-bottom:12px;}
  .adm-card-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
  .adm-action-btn{
    padding:9px 6px;border-radius:10px;border:1px solid var(--border);
    background:var(--surface);color:var(--muted);font-size:12px;font-weight:700;
    cursor:pointer;font-family:'Syne',sans-serif;transition:all 0.2s;text-align:center;
  }
  .adm-action-btn:hover{color:var(--text);border-color:rgba(255,255,255,0.15);}
  .adm-action-btn.curr{cursor:default;}
  .adm-action-btn:disabled{cursor:not-allowed;opacity:0.5;}

  /* ── empty / loading ── */
  .adm-empty{
    text-align:center;padding:60px 24px;
    background:var(--surface);border:1px solid var(--border);border-radius:24px;
  }
  .adm-empty-icon{font-size:48px;margin-bottom:12px;}
  .adm-empty-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--text);}
  .adm-empty-desc{font-size:13px;color:var(--muted);margin-top:6px;}

  /* ── informe ── */
  .adm-report-card{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:24px;margin-bottom:20px;}
  .adm-report-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--text);}
  .adm-report-sub{font-size:13px;color:var(--muted);margin-top:4px;}
  .adm-report-actions{display:flex;justify-content:flex-end;margin-bottom:20px;}
  .adm-export-btn{
    display:inline-flex;align-items:center;gap:8px;
    padding:11px 20px;border-radius:14px;border:none;cursor:pointer;
    background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;
    font-family:'Syne',sans-serif;font-size:13px;font-weight:700;
    box-shadow:0 6px 20px rgba(34,197,94,0.25);transition:all 0.2s;
  }
  .adm-export-btn:hover{transform:translateY(-1px);box-shadow:0 8px 26px rgba(34,197,94,0.35);}
  .adm-table-wrap{overflow-x:auto;}
  .adm-table{width:100%;min-width:700px;border-collapse:collapse;font-size:13px;}
  .adm-table th{padding:10px 12px;text-align:left;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);}
  .adm-table td{padding:12px 12px;border-bottom:1px solid rgba(255,255,255,0.04);color:var(--text);}
  .adm-table tr:last-child td{border-bottom:none;}
  .adm-table tr:hover td{background:rgba(255,255,255,0.02);}
  .adm-table .bold{font-family:'Syne',sans-serif;font-weight:700;}
  .adm-table .amber{color:var(--amber);font-weight:700;}

  /* recharts overrides */
  .recharts-text{fill:var(--muted)!important;font-size:11px!important;}
  .recharts-cartesian-axis-line{stroke:var(--border)!important;}
  .recharts-cartesian-grid-horizontal line{stroke:var(--border)!important;}
  .recharts-tooltip-wrapper .recharts-default-tooltip{background:#1a1a24!important;border:1px solid var(--border)!important;border-radius:12px!important;}

  @keyframes blink{0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .spin-icon{animation:spin 1s linear infinite}
`;

/* ───────────────────────── MAIN COMPONENT ───────────────────────── */
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
      setDiaActivo(getDateKey(pedido.fecha));
      setVistaActiva("Pedidos");
    });
    socket.on("pedido-actualizado", (actualizado) => {
      setPedidos((prev) => prev.map((p) => p.id === actualizado.id ? actualizado : p));
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
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  }

  async function cambiarEstado(id, estado) {
    const prev = pedidos;
    setPedidos((p) => p.map((x) => x.id === id ? { ...x, estado } : x));
    try { await api.put(`/pedidos/${id}/estado`, { estado }); }
    catch { setPedidos(prev); setError("No pudimos actualizar el estado del pedido."); }
  }

  function exportarExcel() {
    const data = pedidos.map((p) => ({
      Pedido: p.numero, Mesa: p.mesa, Estado: p.estado,
      Total: p.total, Metodo: p.metodo,
      Fecha: new Date(p.fecha).toLocaleString("es-CO"),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Informe");
    XLSX.writeFile(wb, "informe-don-perrito.xlsx");
  }

  const diasDisponibles = useMemo(() => {
    const keys = [...new Set(pedidos.map((p) => getDateKey(p.fecha)))];
    return keys.sort((a, b) => dateFromKey(b) - dateFromKey(a));
  }, [pedidos]);

  const pedidosDelDia = useMemo(
    () => pedidos.filter((p) => getDateKey(p.fecha) === diaActivo),
    [diaActivo, pedidos]
  );

  const pedidosOperativos = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    return pedidosDelDia.filter((p) => {
      const matchSearch = !t || p.numero.toString().includes(t) || p.mesa.toString().includes(t) || p.items.some((i) => i.nombre.toLowerCase().includes(t));
      const matchEstado = estadoFiltro === "Todos" || p.estado === estadoFiltro;
      return matchSearch && matchEstado;
    });
  }, [busqueda, estadoFiltro, pedidosDelDia]);

  const pedidosPorEstado = useMemo(() =>
    ["Pendiente","Preparando","Listo"].map((estado) => ({
      estado, pedidos: pedidosOperativos.filter((p) => p.estado === estado),
    })), [pedidosOperativos]
  );

  const resumenDia   = useMemo(() => getResumen(pedidosDelDia), [pedidosDelDia]);
  const resumenTotal = useMemo(() => getResumen(pedidos), [pedidos]);

  const ventasPorDia = useMemo(() => {
    const acc = pedidos.reduce((a, p) => {
      const k = getDateKey(p.fecha);
      if (!a[k]) a[k] = { fecha: formatShortDate(k), total: 0, pedidos: 0 };
      a[k].total += p.total; a[k].pedidos += 1; return a;
    }, {});
    return Object.entries(acc).sort(([a],[b]) => dateFromKey(a)-dateFromKey(b)).map(([,v])=>v);
  }, [pedidos]);

  return (
    <div className="adm">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <header className="adm-header">
        <div className="adm-brand">
          <img src={logoDonPerrito} alt="Don Perrito" className="adm-logo" />
          <div>
            <div className="adm-eyebrow">
              <span className="adm-live" />Panel administrativo
            </div>
            <div className="adm-title">Centro de pedidos</div>
            <div className="adm-sub">Atiende el día, controla cocina y revisa ventas</div>
          </div>
        </div>
        <div className="adm-actions">
          <button
            className={`adm-btn${sonidoActivo ? " active" : ""}`}
            onClick={() => sonidoActivo ? setSonidoActivo(false) : activarSonido()}
          >
            {sonidoActivo ? <Volume2 size={15}/> : <VolumeX size={15}/>}
            {sonidoActivo ? "Sonido activo" : "Activar sonido"}
          </button>
          <button className="adm-btn" onClick={cargarPedidos}>
            <RefreshCw size={15} className={loading ? "spin-icon" : ""}/> Actualizar
          </button>
          <button className="adm-btn danger" onClick={logout}>
            <LogOut size={15}/> Salir
          </button>
        </div>
      </header>

      <div className="adm-inner">
        {error && (
          <div className="adm-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="adm-toolbar">
          <div className="adm-vista-group">
            {VISTAS.map((v) => (
              <button key={v} className={`adm-vista-btn${vistaActiva===v?" active":""}`} onClick={()=>setVistaActiva(v)}>{v}</button>
            ))}
          </div>
          <div className="adm-day-group">
            <button className={`adm-day-btn${diaActivo===getTodayKey()?" today":""}`} onClick={()=>setDiaActivo(getTodayKey())}>Hoy</button>
            <button className="adm-day-btn" onClick={()=>setDiaActivo(getRelativeDateKey(-1))}>Ayer</button>
            <select className="adm-day-select" value={diaActivo} onChange={(e)=>setDiaActivo(e.target.value)}>
              {[diaActivo,...diasDisponibles].filter(Boolean).filter((d,i,a)=>a.indexOf(d)===i).map((d)=>(
                <option key={d} value={d}>{formatLongDate(d)}</option>
              ))}
            </select>
          </div>
        </div>

        {vistaActiva === "Pedidos" ? (
          <>
            {/* ── Métricas día ── */}
            <div className="adm-metrics">
              <MetricCard icon={TrendingUp} label="Ventas del día" value={fmt(resumenDia.ventas)} color="#f97316" />
              <MetricCard icon={ClipboardList} label="Pedidos" value={resumenDia.total} color="#a78bfa" />
              <MetricCard icon={Siren} label="Pendientes" value={resumenDia.pendientes} color="#f59e0b" />
              <MetricCard icon={ChefHat} label="Preparando" value={resumenDia.preparando} color="#38bdf8" />
              <MetricCard icon={CheckCircle2} label="Listos" value={resumenDia.listos} color="#22c55e" />
            </div>

            {/* ── Búsqueda ── */}
            <div className="adm-search-bar">
              <div className="adm-search-wrap">
                <Search size={16} className="adm-search-icon" />
                <input
                  className="adm-search-input"
                  type="search"
                  placeholder="Buscar pedido, mesa o producto..."
                  value={busqueda}
                  onChange={(e)=>setBusqueda(e.target.value)}
                />
              </div>
              <select className="adm-estado-select" value={estadoFiltro} onChange={(e)=>setEstadoFiltro(e.target.value)}>
                {ESTADOS.map((e)=><option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {/* ── Día label ── */}
            <div className="adm-day-label">
              <CalendarDays size={20} color="#f97316" />
              <div>
                <div className="adm-day-title">{formatLongDate(diaActivo)}</div>
                <div className="adm-day-count">{pedidosOperativos.length} pedido{pedidosOperativos.length===1?"":"s"} en pantalla</div>
              </div>
            </div>

            {/* ── Kanban ── */}
            {loading ? (
              <AdminEmpty icon="⏳" title="Cargando pedidos..." desc="Un momento..." />
            ) : pedidosOperativos.length === 0 ? (
              <AdminEmpty icon="📭" title="Sin pedidos" desc="No hay pedidos para este día o filtro." />
            ) : (
              <div className="adm-kanban">
                {pedidosPorEstado
                  .filter(({estado}) => estadoFiltro==="Todos" || estadoFiltro===estado)
                  .map(({estado, pedidos: ps}) => (
                    <KanbanCol key={estado} estado={estado} pedidos={ps} onCambiarEstado={cambiarEstado} />
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

/* ── Metric card ── */
function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className="adm-metric" style={{ borderColor: `${color}22` }}>
      <div className="adm-metric-icon" style={{ background: `${color}18` }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div className="adm-metric-val">{value}</div>
        <div className="adm-metric-lbl">{label}</div>
      </div>
    </div>
  );
}

/* ── Kanban column ── */
function KanbanCol({ estado, pedidos, onCambiarEstado }) {
  const cfg = KANBAN_CFG[estado];
  const Icon = cfg.icon;
  return (
    <section className="adm-col" style={{ borderColor: cfg.border, background: cfg.bg }}>
      <div className="adm-col-header">
        <div className="adm-col-icon" style={{ background: `${cfg.color}20` }}>
          <Icon size={18} color={cfg.color} />
        </div>
        <div>
          <div className="adm-col-title">{cfg.label}</div>
          <div className="adm-col-count">{pedidos.length} pedido{pedidos.length===1?"":"s"}</div>
        </div>
      </div>
      <div className="adm-cards">
        {pedidos.length === 0 ? (
          <div className="adm-col-empty">Sin pedidos aquí</div>
        ) : (
          pedidos.map((p) => <PedidoCard key={p.id} pedido={p} estadoCfg={cfg} onCambiarEstado={onCambiarEstado} />)
        )}
      </div>
    </section>
  );
}

/* ── Order card ── */
function PedidoCard({ pedido, estadoCfg, onCambiarEstado }) {
  const ESTADOS_OPCIONES = ["Pendiente","Preparando","Listo"];
  const ESTADO_COLORS = {
    Pendiente: { color:"#f59e0b", bg:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.25)" },
    Preparando:{ color:"#38bdf8", bg:"rgba(56,189,248,0.12)",  border:"rgba(56,189,248,0.25)" },
    Listo:     { color:"#22c55e", bg:"rgba(34,197,94,0.12)",   border:"rgba(34,197,94,0.25)" },
  };
  const ec = ESTADO_COLORS[pedido.estado] || ESTADO_COLORS.Pendiente;
  return (
    <article className="adm-card">
      <div className="adm-card-top">
        <div className="adm-card-num">Pedido #{pedido.numero}</div>
        <div className="adm-card-badge" style={{ background: ec.bg, border:`1px solid ${ec.border}`, color: ec.color }}>
          <span className="adm-card-dot" style={{ background: ec.color }} />
          {pedido.estado}
        </div>
      </div>
      <div className="adm-card-meta">
        <span>🪑 Mesa #{pedido.mesa}</span>
        <span>💳 {pedido.metodo}</span>
        <span>🕐 {new Date(pedido.fecha).toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"})}</span>
      </div>
      <div className="adm-card-items">
        {pedido.items.map((item) => (
          <div key={item.id} className="adm-card-item">
            <div>
              <div className="adm-item-name">{item.qty}× {item.nombre}</div>
              <div className="adm-item-unit">{fmt(item.precio)} c/u</div>
            </div>
            <div className="adm-item-price">{fmt(item.qty * item.precio)}</div>
          </div>
        ))}
      </div>
      <div className="adm-card-total">{fmt(pedido.total)}</div>
      <div className="adm-card-actions">
        {ESTADOS_OPCIONES.map((e) => {
          const c = ESTADO_COLORS[e];
          const isCurr = pedido.estado === e;
          return (
            <button
              key={e}
              className={`adm-action-btn${isCurr?" curr":""}`}
              disabled={isCurr}
              onClick={() => !isCurr && onCambiarEstado(pedido.id, e)}
              style={isCurr ? { background: c.bg, borderColor: c.border, color: c.color } : {}}
            >
              {e}
            </button>
          );
        })}
      </div>
    </article>
  );
}

/* ── Empty state ── */
function AdminEmpty({ icon, title, desc }) {
  return (
    <div className="adm-empty">
      <div className="adm-empty-icon">{icon}</div>
      <div className="adm-empty-title">{title}</div>
      <div className="adm-empty-desc">{desc}</div>
    </div>
  );
}

/* ── Informe view ── */
function Informe({ exportarExcel, pedidos, resumenTotal, ventasPorDia }) {
  const dias = useMemo(() => {
    const acc = pedidos.reduce((a, p) => {
      const k = getDateKey(p.fecha);
      if (!a[k]) a[k] = { key:k, ventas:0, pedidos:0, pendientes:0, preparando:0, listos:0 };
      a[k].ventas += p.total; a[k].pedidos += 1;
      if (p.estado==="Pendiente") a[k].pendientes++;
      if (p.estado==="Preparando") a[k].preparando++;
      if (p.estado==="Listo") a[k].listos++;
      return a;
    }, {});
    return Object.values(acc).sort((a,b)=>dateFromKey(b.key)-dateFromKey(a.key));
  }, [pedidos]);

  return (
    <>
      {/* métricas totales */}
      <div className="adm-metrics" style={{ marginBottom: 20 }}>
        <MetricCard icon={TrendingUp}   label="Ventas totales" value={fmt(resumenTotal.ventas)}      color="#f97316" />
        <MetricCard icon={ClipboardList} label="Pedidos total"  value={resumenTotal.total}             color="#a78bfa" />
        <MetricCard icon={Siren}         label="Pendientes"      value={resumenTotal.pendientes}        color="#f59e0b" />
        <MetricCard icon={ChefHat}       label="Preparando"      value={resumenTotal.preparando}        color="#38bdf8" />
        <MetricCard icon={CheckCircle2}  label="Listos"          value={resumenTotal.listos}            color="#22c55e" />
      </div>

      {/* gráfica */}
      <div className="adm-report-card">
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:20 }}>
          <div>
            <div className="adm-report-title">Ventas por día</div>
            <div className="adm-report-sub">Resumen general de todos los días registrados.</div>
          </div>
          <button className="adm-export-btn" onClick={exportarExcel}>
            <Download size={15}/> Exportar Excel
          </button>
        </div>
        <div style={{ height: 260 }}>
          {ventasPorDia.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasPorDia} margin={{ top:4, right:4, bottom:4, left:4 }}>
                <XAxis dataKey="fecha" tick={{ fill:"rgba(255,255,255,0.35)", fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"rgba(255,255,255,0.35)", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={(v)=>fmt(v)} width={80} />
                <Tooltip
                  formatter={(v)=>fmt(v)}
                  contentStyle={{ background:"#1a1a24", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, color:"#f1f0ee" }}
                  cursor={{ fill:"rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="total" fill="url(#barGrad)" radius={[8,8,0,0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <AdminEmpty icon="📊" title="Sin datos" desc="No hay ventas registradas aún." />
          )}
        </div>
      </div>

      {/* tabla por día */}
      <div className="adm-report-card">
        <div className="adm-report-title" style={{ marginBottom:16 }}>Informe por día</div>
        {dias.length === 0 ? (
          <AdminEmpty icon="📋" title="Sin información" desc="No hay datos para mostrar." />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Día</th><th>Pedidos</th><th>Ventas</th>
                  <th>Pendientes</th><th>Preparando</th><th>Listos</th>
                </tr>
              </thead>
              <tbody>
                {dias.map((d)=>(
                  <tr key={d.key}>
                    <td className="bold" style={{ textTransform:"capitalize" }}>{formatLongDate(d.key)}</td>
                    <td className="bold">{d.pedidos}</td>
                    <td className="amber">{fmt(d.ventas)}</td>
                    <td>{d.pendientes}</td>
                    <td>{d.preparando}</td>
                    <td>{d.listos}</td>
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
ENDOFFILE
