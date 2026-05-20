import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../services/socket";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import { clearActiveOrder, getActiveOrder, getActiveOrderTimeLeft, saveActiveOrder } from "../utils/activeOrder";
import seguimientoPedido from "../assets/logo-don-perrito.png";

const ESTADOS = ["Pendiente", "Preparando", "Listo"];

const ESTADO_CONFIG = {
  Pendiente: { icon: "⏳", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Recibido", msg: "Tu pedido fue recibido y está en espera." },
  Preparando: { icon: "👨‍🍳", color: "#f97316", bg: "rgba(249,115,22,0.1)", label: "Preparando", msg: "¡Estamos cocinando tu pedido con todo el amor!" },
  Listo: { icon: "✅", color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "¡Listo!", msg: "Tu pedido está listo. ¡A disfrutar!" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; }
  :root {
    --bg: #08080e;
    --surface: rgba(255,255,255,0.03);
    --border: rgba(255,255,255,0.07);
    --amber: #f59e0b;
    --orange: #f97316;
    --text: #f1f0ee;
    --muted: rgba(255,255,255,0.35);
  }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
  .conf-shell { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .conf-card { max-width: 560px; width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 32px; padding: 36px 32px; animation: fadeUp 0.6s ease both; }

  /* Order header */
  .conf-top { text-align: center; margin-bottom: 32px; }
  .conf-mesa { font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--amber); }
  .conf-num { font-family: 'Syne', sans-serif; font-size: 40px; font-weight: 800; color: var(--text); margin-top: 4px; }
  .conf-date { font-size: 13px; color: var(--muted); margin-top: 6px; }

  /* Status hero */
  .status-hero {
    border-radius: 24px; padding: 24px 20px;
    display: flex; align-items: center; gap: 20px;
    margin-bottom: 28px; transition: all 0.5s ease;
  }
  .status-logo-wrap { position: relative; flex-shrink: 0; }
  .status-logo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
  .status-ping {
    position: absolute; inset: -6px; border-radius: 50%;
    border: 2px solid currentColor; opacity: 0.4;
    animation: ping 2s ease-in-out infinite;
  }
  .status-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 100px;
    font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  .status-msg { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--text); line-height: 1.3; }
  .status-dots { display: flex; gap: 5px; margin-top: 10px; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; animation: bounce 1s ease-in-out infinite; }

  /* Progress */
  .progress-section { margin-bottom: 28px; }
  .progress-track { height: 6px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 100px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
  .progress-labels { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 10px; text-align: center; }
  .progress-lbl { font-size: 11px; font-weight: 600; color: var(--muted); letter-spacing: 0.5px; text-transform: uppercase; transition: color 0.3s; }
  .progress-lbl.done { color: var(--amber); }

  /* Step indicators */
  .steps-row { display: flex; justify-content: center; gap: 8px; margin-bottom: 28px; }
  .step-bubble {
    width: 36px; height: 36px; border-radius: 50%;
    border: 2px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; transition: all 0.4s;
  }
  .step-bubble.done { border-color: var(--amber); background: rgba(245,158,11,0.15); }
  .step-line { width: 40px; height: 2px; background: var(--border); align-self: center; border-radius: 2px; transition: background 0.4s; }
  .step-line.done { background: var(--amber); }

  /* Items list */
  .items-section { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 20px 0; margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
  .order-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .order-item-name { font-family: 'Syne', sans-serif; font-weight: 700; color: var(--text); font-size: 15px; }
  .order-item-unit { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .order-item-price { font-family: 'Syne', sans-serif; font-weight: 800; color: var(--amber); font-size: 16px; flex-shrink: 0; }

  /* Total */
  .total-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .total-label { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--text); }
  .total-val { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; color: var(--amber); }

  .menu-btn {
    width: 100%; padding: 14px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text);
    transition: all 0.2s;
  }
  .menu-btn:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); }

  /* Empty */
  .no-order { max-width: 380px; width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 28px; padding: 48px 36px; text-align: center; animation: fadeUp 0.5s ease both; }
  .no-order-icon { font-size: 56px; margin-bottom: 16px; }
  .no-order-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--text); }
  .no-order-desc { font-size: 14px; color: var(--muted); margin: 10px 0 28px; line-height: 1.6; }
  .no-order-btn {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, var(--orange), var(--amber));
    border: none; border-radius: 14px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff;
    box-shadow: 0 8px 24px rgba(249,115,22,0.3); transition: all 0.2s;
  }
  .no-order-btn:hover { transform: translateY(-2px); }

  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes ping { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.12);opacity:0.15} }
  @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
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
    async function cargar() {
      try {
        const r = await api.get(`/pedidos/${pedido.id}`);
        if (activo) setPedido(saveActiveOrder(r.data));
      } catch {
        if (activo) { clearActiveOrder(); setPedido(null); }
      }
    }
    cargar();
    return () => { activo = false; };
  }, [pedido?.id]);

  useEffect(() => {
    if (!pedido) return undefined;
    const onUpdate = (p) => { if (p.id === pedido.id) setPedido(saveActiveOrder(p)); };
    socket.on("pedido-actualizado", onUpdate);
    return () => socket.off("pedido-actualizado", onUpdate);
  }, [pedido]);

  useEffect(() => {
    if (!pedido) return undefined;
    const t = getActiveOrderTimeLeft(pedido);
    if (t === null) return undefined;
    const id = window.setTimeout(() => { clearActiveOrder(); setPedido(null); }, t);
    return () => window.clearTimeout(id);
  }, [pedido]);

  const estadoIdx = useMemo(() => pedido ? ESTADOS.indexOf(pedido.estado) : -1, [pedido]);
  const progreso = `${Math.max(((estadoIdx + 1) / ESTADOS.length) * 100, 5)}%`;
  const cfg = ESTADO_CONFIG[pedido?.estado] || ESTADO_CONFIG.Pendiente;

  if (!pedido) {
    return (
      <div className="conf-shell">
        <style>{CSS}</style>
        <div className="no-order">
          <div className="no-order-icon">🍔</div>
          <div className="no-order-title">Sin pedido activo</div>
          <p className="no-order-desc">Cuando envíes un pedido podrás seguir su estado en tiempo real aquí.</p>
          <button className="no-order-btn" onClick={() => navigate("/")}>Ver el menú</button>
        </div>
      </div>
    );
  }

  return (
    <div className="conf-shell">
      <style>{CSS}</style>
      <div className="conf-card">
        {/* Header */}
        <div className="conf-top">
          <div className="conf-mesa">Mesa #{pedido.mesa}</div>
          <div className="conf-num">Pedido #{pedido.numero}</div>
          <div className="conf-date">{new Date(pedido.fecha).toLocaleString("es-CO")}</div>
        </div>

        {/* Status hero */}
        <div className="status-hero" style={{ background: cfg.bg }}>
          <div className="status-logo-wrap" style={{ color: cfg.color }}>
            <img src={seguimientoPedido} alt="Don Perrito" className="status-logo" style={{ border: `3px solid ${cfg.color}` }} />
            <div className="status-ping" style={{ borderColor: cfg.color }} />
          </div>
          <div>
            <div className="status-badge" style={{ background: `${cfg.color}20`, color: cfg.color }}>
              <span>{cfg.icon}</span> {cfg.label}
            </div>
            <div className="status-msg">{cfg.msg}</div>
            {pedido.estado !== "Listo" && (
              <div className="status-dots">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="status-dot" style={{ background: cfg.color, animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step bubbles */}
        <div className="steps-row">
          {ESTADOS.map((e, i) => (
            <>
              <div key={e} className={`step-bubble${i <= estadoIdx ? " done" : ""}`}>
                {i < estadoIdx ? "✓" : ESTADO_CONFIG[e].icon}
              </div>
              {i < ESTADOS.length - 1 && <div key={`line-${i}`} className={`step-line${i < estadoIdx ? " done" : ""}`} />}
            </>
          ))}
        </div>

        {/* Progress bar */}
        <div className="progress-section">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: progreso, background: `linear-gradient(90deg, var(--orange), var(--amber))` }} />
          </div>
          <div className="progress-labels">
            {ESTADOS.map((e, i) => (
              <span key={e} className={`progress-lbl${i <= estadoIdx ? " done" : ""}`}>{e}</span>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="items-section">
          {pedido.items.map((item) => (
            <div key={item.id} className="order-item">
              <div>
                <div className="order-item-name">{item.qty}× {item.nombre}</div>
                <div className="order-item-unit">{fmt(item.precio)} c/u</div>
              </div>
              <div className="order-item-price">{fmt(item.precio * item.qty)}</div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="total-row">
          <span className="total-label">Total</span>
          <span className="total-val">{fmt(pedido.total)}</span>
        </div>

        <button className="menu-btn" onClick={() => navigate("/")}>← Ver el menú</button>
      </div>
    </div>
  );
}
