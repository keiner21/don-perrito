import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../services/socket";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import {
  clearActiveOrder, getActiveOrder, getActiveOrderTimeLeft, saveActiveOrder,
} from "../utils/activeOrder";
import logoDonPerrito from "../assets/logo-don-perrito.png";

const ESTADOS = ["Pendiente", "Preparando", "Listo"];

const ESTADO_CONFIG = {
  Pendiente: { emoji: "🕐", color: "#f59e0b", label: "Recibido", desc: "Tu pedido fue recibido y está en cola.", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  Preparando: { emoji: "👨‍🍳", color: "#3b82f6", label: "En cocina", desc: "¡Manos a la obra! Estamos preparando tu pedido.", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
  Listo: { emoji: "✅", color: "#22c55e", label: "Listo", desc: "Tu pedido está listo para ser entregado en tu mesa.", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
};

const CONFIRMED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  .conf-root {
    min-height: 100vh; font-family: 'DM Sans', sans-serif;
    background: #0d0d0d; color: #fff;
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem; position: relative; overflow: hidden;
  }

  .conf-bg-ring {
    position: absolute; border-radius: 50%;
    pointer-events: none; opacity: 0.15;
  }
  .ring-1 { width: 600px; height: 600px; border: 1px solid rgba(234,88,12,0.4); top: -200px; right: -200px; }
  .ring-2 { width: 400px; height: 400px; border: 1px solid rgba(234,88,12,0.2); bottom: -150px; left: -150px; }

  .conf-glow {
    position: absolute; pointer-events: none;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(234,88,12,0.12) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    animation: breathe 4s ease-in-out infinite;
  }
  @keyframes breathe {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
    50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
  }

  .conf-card {
    position: relative; width: 100%; max-width: 560px;
    animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Header section */
  .conf-header { text-align: center; margin-bottom: 2rem; }
  .conf-order-num {
    display: inline-block;
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
    color: #f97316; background: rgba(234,88,12,0.15); border: 1px solid rgba(234,88,12,0.3);
    padding: 0.3rem 0.9rem; border-radius: 999px; margin-bottom: 0.75rem;
  }
  .conf-title {
    font-family: 'Syne', sans-serif; font-size: clamp(2rem, 5vw, 2.8rem);
    font-weight: 900; color: #fff; line-height: 1.1; margin-bottom: 0.35rem;
  }
  .conf-date { font-size: 0.78rem; color: rgba(255,255,255,0.35); }

  /* Status card */
  .status-card {
    border-radius: 20px; padding: 1.5rem;
    border: 1.5px solid; margin-bottom: 1.25rem;
    transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
    position: relative; overflow: hidden;
  }
  .status-inner { display: flex; align-items: center; gap: 1.25rem; }
  .status-icon-wrap {
    position: relative; flex-shrink: 0;
  }
  .status-logo-ring {
    position: absolute; inset: -4px; border-radius: 50%;
    border: 2px solid; animation: spinRing 8s linear infinite;
    opacity: 0.5;
  }
  @keyframes spinRing { to { transform: rotate(360deg); } }
  .status-logo {
    width: 72px; height: 72px; border-radius: 50%; object-fit: cover;
    position: relative; z-index: 1; border: 2px solid rgba(255,255,255,0.1);
  }
  .status-text { flex: 1; }
  .status-badge {
    display: inline-flex; align-items: center; gap: 0.35rem;
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 0.25rem 0.7rem; border-radius: 999px;
    background: rgba(255,255,255,0.1); color: #fff; margin-bottom: 0.5rem;
  }
  .status-desc { font-size: 0.88rem; color: rgba(255,255,255,0.6); line-height: 1.5; }

  /* Dots animation */
  .dots { display: flex; gap: 4px; margin-top: 0.65rem; }
  .dot {
    width: 6px; height: 6px; border-radius: 50%;
    animation: dotBounce 1.2s ease-in-out infinite;
  }
  .dot:nth-child(2) { animation-delay: 0.15s; }
  .dot:nth-child(3) { animation-delay: 0.3s; }
  @keyframes dotBounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }

  /* Progress bar */
  .progress-wrap { margin-bottom: 1.5rem; }
  .progress-track {
    height: 6px; background: rgba(255,255,255,0.08);
    border-radius: 999px; overflow: hidden; margin-bottom: 0.75rem;
  }
  .progress-fill {
    height: 100%; border-radius: 999px;
    background: linear-gradient(90deg, #ea580c, #f97316);
    transition: width 0.7s cubic-bezier(0.16,1,0.3,1);
    box-shadow: 0 0 12px rgba(234,88,12,0.6);
  }
  .progress-labels {
    display: grid; grid-template-columns: repeat(3, 1fr); text-align: center;
  }
  .progress-label {
    font-size: 0.68rem; font-weight: 600;
    color: rgba(255,255,255,0.25); transition: color 0.3s;
  }
  .progress-label-active { color: #f97316; }

  /* Items */
  .items-section {
    background: rgba(255,255,255,0.04); border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.07); overflow: hidden; margin-bottom: 1.25rem;
  }
  .items-header {
    padding: 0.85rem 1.1rem;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    color: rgba(255,255,255,0.35);
  }
  .item-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.85rem 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .item-row:last-child { border-bottom: none; }
  .item-row-name { font-size: 0.88rem; font-weight: 600; color: #fff; }
  .item-row-sub { font-size: 0.72rem; color: rgba(255,255,255,0.35); margin-top: 1px; }
  .item-row-price { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800; color: #f97316; }

  .total-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1rem 1.1rem; background: rgba(234,88,12,0.08);
    border-top: 1px solid rgba(234,88,12,0.15);
  }
  .total-label { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; color: #fff; }
  .total-price { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 900; color: #f97316; }

  /* Actions */
  .conf-actions { display: flex; gap: 0.75rem; }
  .btn-menu {
    flex: 1; padding: 0.9rem; border-radius: 12px; border: none;
    background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7);
    font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-menu:hover { background: rgba(255,255,255,0.12); color: #fff; }

  /* Empty state */
  .empty-root {
    min-height: 100vh; background: #0d0d0d;
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem; font-family: 'DM Sans', sans-serif;
  }
  .empty-card {
    max-width: 380px; width: 100%; text-align: center;
    animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes popIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  .empty-emoji { font-size: 4rem; margin-bottom: 1.25rem; display: block; }
  .empty-title { font-family: 'Syne', sans-serif; font-size: 1.75rem; font-weight: 900; color: #fff; }
  .empty-sub { font-size: 0.85rem; color: rgba(255,255,255,0.4); margin: 0.5rem 0 2rem; line-height: 1.6; }
  .btn-go-menu {
    width: 100%; padding: 0.9rem; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #ea580c, #c2410c);
    color: #fff; font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800;
    cursor: pointer; box-shadow: 0 4px 16px rgba(234,88,12,0.35); transition: all 0.2s;
  }
  .btn-go-menu:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(234,88,12,0.45); }
`;

export default function Confirmed() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pedido, setPedido] = useState(() => {
    if (location.state?.pedido) return saveActiveOrder(location.state.pedido);
    return getActiveOrder();
  });

  useEffect(() => {
    if (!pedido?.id) return undefined;
    let activo = true;
    async function cargarPedido() {
      try {
        const response = await api.get(`/pedidos/${pedido.id}`);
        if (!activo) return;
        setPedido(saveActiveOrder(response.data));
      } catch {
        if (activo) { clearActiveOrder(); setPedido(null); }
      }
    }
    cargarPedido();
    return () => { activo = false; };
  }, [pedido?.id]);

  useEffect(() => {
    if (!pedido) return undefined;
    const onActualizado = (p) => {
      if (p.id !== pedido.id) return;
      setPedido(saveActiveOrder(p));
    };
    socket.on("pedido-actualizado", onActualizado);
    return () => socket.off("pedido-actualizado", onActualizado);
  }, [pedido]);

  useEffect(() => {
    if (!pedido) return undefined;
    const timeLeft = getActiveOrderTimeLeft(pedido);
    if (timeLeft === null) return undefined;
    const timeout = window.setTimeout(() => { clearActiveOrder(); setPedido(null); }, timeLeft);
    return () => window.clearTimeout(timeout);
  }, [pedido]);

  const estadoIndex = useMemo(() => (pedido ? ESTADOS.indexOf(pedido.estado) : -1), [pedido]);
  const progreso = `${Math.max(((estadoIndex + 1) / ESTADOS.length) * 100, 0)}%`;
  const cfg = pedido ? (ESTADO_CONFIG[pedido.estado] || ESTADO_CONFIG.Pendiente) : null;

  if (!pedido) {
    return (
      <>
        <style>{CONFIRMED_STYLES}</style>
        <div className="empty-root">
          <div className="empty-card">
            <span className="empty-emoji">🍔</span>
            <h1 className="empty-title">Sin pedido activo</h1>
            <p className="empty-sub">Cuando envíes un pedido desde el menú, podrás ver su estado aquí en tiempo real.</p>
            <button className="btn-go-menu" onClick={() => navigate("/")}>Ir al menú →</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CONFIRMED_STYLES}</style>
      <div className="conf-root">
        <div className="conf-bg-ring ring-1" />
        <div className="conf-bg-ring ring-2" />
        <div className="conf-glow" />

        <div className="conf-card">
          <div className="conf-header">
            <span className="conf-order-num">Mesa #{pedido.mesa} · Pedido #{pedido.numero}</span>
            <h1 className="conf-title">Seguimiento<br />en vivo 📡</h1>
            <p className="conf-date">{new Date(pedido.fecha).toLocaleString("es-CO")}</p>
          </div>

          {cfg && (
            <div
              className="status-card"
              style={{ background: cfg.bg, borderColor: cfg.border }}
            >
              <div className="status-inner">
                <div className="status-icon-wrap">
                  <div className="status-logo-ring" style={{ borderColor: cfg.color }} />
                  <img src={logoDonPerrito} alt="Don Perrito" className="status-logo" />
                </div>
                <div className="status-text">
                  <div className="status-badge">
                    <span>{cfg.emoji}</span> {cfg.label}
                  </div>
                  <p className="status-desc">{cfg.desc}</p>
                  {pedido.estado !== "Listo" && (
                    <div className="dots">
                      <div className="dot" style={{ background: cfg.color }} />
                      <div className="dot" style={{ background: cfg.color }} />
                      <div className="dot" style={{ background: cfg.color }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="progress-wrap">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: progreso }} />
            </div>
            <div className="progress-labels">
              {ESTADOS.map((estado, index) => (
                <span
                  key={estado}
                  className={`progress-label${index <= estadoIndex ? " progress-label-active" : ""}`}
                >
                  {estado}
                </span>
              ))}
            </div>
          </div>

          <div className="items-section">
            <div className="items-header">Tu pedido · {pedido.metodo}</div>
            {pedido.items.map((item) => (
              <div key={item.id} className="item-row">
                <div>
                  <p className="item-row-name">{item.qty}× {item.nombre}</p>
                  <p className="item-row-sub">{fmt(item.precio)} c/u</p>
                </div>
                <span className="item-row-price">{fmt(item.precio * item.qty)}</span>
              </div>
            ))}
            <div className="total-row">
              <span className="total-label">Total</span>
              <span className="total-price">{fmt(pedido.total)}</span>
            </div>
          </div>

          <div className="conf-actions">
            <button className="btn-menu" onClick={() => navigate("/")}>← Ver menú</button>
          </div>
        </div>
      </div>
    </>
  );
}
