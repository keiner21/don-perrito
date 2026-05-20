import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../services/socket";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import { clearActiveOrder, getActiveOrder, getActiveOrderTimeLeft, saveActiveOrder } from "../utils/activeOrder";
import seguimientoPedido from "../assets/logo-don-perrito.png";

const ESTADOS = ["Pendiente", "Preparando", "Listo"];

const ESTADO_CONFIG = {
  Pendiente: {
    icon: PendingIcon,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.18)",
    label: "Recibido",
    msg: "Tu pedido fue recibido y está en espera.",
  },
  Preparando: {
    icon: CookingIcon,
    color: "#f97316",
    bg: "rgba(249,115,22,0.08)",
    borderColor: "rgba(249,115,22,0.18)",
    label: "Preparando",
    msg: "¡Estamos preparando tu pedido con todo el amor!",
  },
  Listo: {
    icon: ReadyIcon,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    borderColor: "rgba(34,197,94,0.18)",
    label: "¡Listo para retirar!",
    msg: "Tu pedido está listo. ¡A disfrutar!",
  },
};

function PendingIcon({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function CookingIcon({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6V13.87z"/>
      <line x1="6" y1="17" x2="18" y2="17"/>
    </svg>
  );
}
function ReadyIcon({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  );
}
function EmptyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #08080e;
    --surface: rgba(255,255,255,0.03);
    --surface2: rgba(255,255,255,0.055);
    --border: rgba(255,255,255,0.07);
    --amber: #f59e0b;
    --orange: #f97316;
    --text: #f1f0ee;
    --text-secondary: rgba(241,240,238,0.55);
    --muted: rgba(255,255,255,0.35);
    --font-display: 'Syne', 'Georgia', serif;
    --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --transition: 0.2s ease;
    --radius-sm: 10px;
    --radius-md: 16px;
    --radius-lg: 22px;
    --radius-xl: 32px;
  }

  html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: transparent;
  }

  /* ─── Shell ────────────────────────────────────────── */
  .conf-shell {
    min-height: 100vh;
    background: var(--bg);
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    padding: 24px;
  }

  /* ─── Card ─────────────────────────────────────────── */
  .conf-card {
    max-width: 540px;
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 32px 28px;
    -webkit-animation: fadeUp 0.55s ease both;
    animation: fadeUp 0.55s ease both;
  }

  /* ─── Order header ─────────────────────────────────── */
  .conf-top { text-align: center; margin-bottom: 28px; }
  .conf-mesa {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 4px;
  }
  .conf-num {
    font-family: var(--font-display);
    font-size: clamp(28px, 8vw, 38px);
    font-weight: 800;
    color: var(--text);
    letter-spacing: -0.5px;
    line-height: 1.1;
  }
  .conf-date { font-size: 12px; color: var(--muted); margin-top: 6px; }

  /* ─── Status hero ──────────────────────────────────── */
  .status-hero {
    border-radius: var(--radius-lg);
    padding: 20px 18px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 18px;
    margin-bottom: 24px;
    -webkit-transition: all 0.5s ease;
    transition: all 0.5s ease;
    border: 1px solid;
  }
  .status-logo-wrap { position: relative; -ms-flex-negative: 0; flex-shrink: 0; }
  .status-logo {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    border: 2.5px solid;
  }
  .status-ping {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid;
    opacity: 0.35;
    -webkit-animation: ping 2.2s ease-in-out infinite;
    animation: ping 2.2s ease-in-out infinite;
  }
  .status-badge {
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 7px;
  }
  .status-msg {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.35;
    letter-spacing: -0.1px;
  }
  .status-dots {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    gap: 5px;
    margin-top: 9px;
  }
  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    -webkit-animation: bounce 1s ease-in-out infinite;
    animation: bounce 1s ease-in-out infinite;
  }

  /* ─── Steps ────────────────────────────────────────── */
  .steps-row {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 0;
    margin-bottom: 22px;
  }
  .step-bubble {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 2px solid var(--border);
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-transition: all 0.4s ease;
    transition: all 0.4s ease;
    -ms-flex-negative: 0;
    flex-shrink: 0;
  }
  .step-bubble.done {
    border-color: var(--amber);
    background: rgba(245,158,11,0.13);
  }
  .step-line {
    width: 36px;
    height: 2px;
    background: var(--border);
    border-radius: 2px;
    -webkit-transition: background 0.4s ease;
    transition: background 0.4s ease;
    -ms-flex-negative: 0;
    flex-shrink: 0;
  }
  .step-line.done { background: var(--amber); }

  /* ─── Progress ─────────────────────────────────────── */
  .progress-section { margin-bottom: 24px; }
  .progress-track {
    height: 5px;
    background: rgba(255,255,255,0.06);
    border-radius: 100px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    border-radius: 100px;
    background: -webkit-linear-gradient(left, var(--orange), var(--amber));
    background: linear-gradient(to right, var(--orange), var(--amber));
    -webkit-transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
    transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
  }
  .progress-labels {
    display: -ms-grid;
    display: grid;
    -ms-grid-columns: (1fr)[3];
    grid-template-columns: repeat(3, 1fr);
    margin-top: 9px;
    text-align: center;
  }
  .progress-lbl {
    font-size: 10px;
    font-weight: 700;
    color: var(--muted);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    -webkit-transition: color 0.3s;
    transition: color 0.3s;
  }
  .progress-lbl.done { color: var(--amber); }

  /* ─── Items list ───────────────────────────────────── */
  .items-section {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 18px 0;
    margin-bottom: 18px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    gap: 12px;
  }
  .order-item {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    gap: 12px;
  }
  .order-item-name {
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--text);
    font-size: 14px;
    letter-spacing: -0.1px;
  }
  .order-item-unit { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .order-item-price {
    font-family: var(--font-display);
    font-weight: 800;
    color: var(--amber);
    font-size: 15px;
    -ms-flex-negative: 0;
    flex-shrink: 0;
  }

  /* ─── Total ────────────────────────────────────────── */
  .total-row {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    margin-bottom: 22px;
  }
  .total-label {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 700;
    color: var(--text);
  }
  .total-val {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 800;
    color: var(--amber);
    letter-spacing: -0.5px;
  }

  /* ─── CTA button ───────────────────────────────────── */
  .menu-btn {
    width: 100%;
    padding: 14px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    -webkit-transition: all var(--transition);
    transition: all var(--transition);
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    gap: 8px;
    min-height: 50px;
    letter-spacing: 0.1px;
  }
  .menu-btn:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.12);
  }
  .menu-btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }

  /* ─── No-order state ───────────────────────────────── */
  .no-order {
    max-width: 360px;
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 44px 32px;
    text-align: center;
    -webkit-animation: fadeUp 0.5s ease both;
    animation: fadeUp 0.5s ease both;
  }
  .no-order-icon-wrap {
    width: 64px;
    height: 64px;
    margin: 0 auto 18px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 20px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    color: var(--muted);
  }
  .no-order-title {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -0.3px;
  }
  .no-order-desc {
    font-size: 13px;
    color: var(--muted);
    margin: 10px 0 26px;
    line-height: 1.65;
  }
  .no-order-btn {
    width: 100%;
    padding: 14px;
    background: -webkit-linear-gradient(135deg, var(--orange), var(--amber));
    background: linear-gradient(135deg, var(--orange), var(--amber));
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    -webkit-box-shadow: 0 6px 22px rgba(249,115,22,0.3);
    box-shadow: 0 6px 22px rgba(249,115,22,0.3);
    -webkit-transition: all var(--transition);
    transition: all var(--transition);
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    gap: 8px;
    min-height: 50px;
  }
  .no-order-btn:hover {
    -webkit-transform: translateY(-2px);
    -ms-transform: translateY(-2px);
    transform: translateY(-2px);
  }
  .no-order-btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }

  /* ─── Animations ───────────────────────────────────── */
  @-webkit-keyframes fadeUp {
    from { opacity: 0; -webkit-transform: translateY(18px); transform: translateY(18px); }
    to { opacity: 1; -webkit-transform: translateY(0); transform: translateY(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @-webkit-keyframes ping {
    0%,100% { -webkit-transform: scale(1); transform: scale(1); opacity: 0.35; }
    50% { -webkit-transform: scale(1.12); transform: scale(1.12); opacity: 0.15; }
  }
  @keyframes ping {
    0%,100% { transform: scale(1); opacity: 0.35; }
    50% { transform: scale(1.12); opacity: 0.15; }
  }
  @-webkit-keyframes bounce {
    0%,100% { -webkit-transform: translateY(0); transform: translateY(0); }
    50% { -webkit-transform: translateY(-5px); transform: translateY(-5px); }
  }
  @keyframes bounce {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  @media (max-width: 480px) {
    .conf-card { padding: 24px 18px; border-radius: 24px; }
    .status-hero { gap: 14px; padding: 16px 14px; }
    .status-logo { width: 58px; height: 58px; }
    .step-line { width: 24px; }
  }

  @supports not (backdrop-filter: blur(1px)) {
    .conf-card { background: rgba(12,10,20,0.98); }
  }
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

  const estadoIdx = useMemo(
    () => (pedido ? ESTADOS.indexOf(pedido.estado) : -1),
    [pedido]
  );
  const progreso = `${Math.max(((estadoIdx + 1) / ESTADOS.length) * 100, 5)}%`;
  const cfg = ESTADO_CONFIG[pedido?.estado] || ESTADO_CONFIG.Pendiente;

  if (!pedido) {
    return (
      <div className="conf-shell">
        <style>{CSS}</style>
        <div className="no-order" role="main">
          <div className="no-order-icon-wrap"><EmptyIcon /></div>
          <h1 className="no-order-title">Sin pedido activo</h1>
          <p className="no-order-desc">
            Cuando envíes un pedido podrás seguir su estado en tiempo real aquí.
          </p>
          <button className="no-order-btn" onClick={() => navigate("/")}>
            <ArrowIcon /> Ver el menú
          </button>
        </div>
      </div>
    );
  }

  const StatusIconComponent = cfg.icon;

  return (
    <div className="conf-shell">
      <style>{CSS}</style>
      <div className="conf-card" role="main" aria-label="Estado del pedido">

        {/* Header */}
        <div className="conf-top">
          <div className="conf-mesa">Mesa #{pedido.mesa}</div>
          <div className="conf-num">Pedido #{pedido.numero}</div>
          <div className="conf-date">
            <time dateTime={pedido.fecha}>
              {new Date(pedido.fecha).toLocaleString("es-CO")}
            </time>
          </div>
        </div>

        {/* Status hero */}
        <div
          className="status-hero"
          style={{ background: cfg.bg, borderColor: cfg.borderColor }}
          role="status"
          aria-label={`Estado: ${cfg.label}. ${cfg.msg}`}
          aria-live="polite"
        >
          <div className="status-logo-wrap">
            <img
              src={seguimientoPedido}
              alt="Don Perrito"
              className="status-logo"
              width="72"
              height="72"
              style={{ borderColor: cfg.color }}
            />
            <div
              className="status-ping"
              style={{ borderColor: cfg.color }}
              aria-hidden="true"
            />
          </div>
          <div>
            <div
              className="status-badge"
              style={{ background: `${cfg.color}1a`, color: cfg.color }}
            >
              <StatusIconComponent size={13} color={cfg.color} />
              {cfg.label}
            </div>
            <div className="status-msg">{cfg.msg}</div>
            {pedido.estado !== "Listo" && (
              <div className="status-dots" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="status-dot"
                    style={{
                      background: cfg.color,
                      animationDelay: `${i * 200}ms`,
                      WebkitAnimationDelay: `${i * 200}ms`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step bubbles */}
        <div className="steps-row" role="list" aria-label="Etapas del pedido">
          {ESTADOS.map((e, i) => {
            const StepIcon = ESTADO_CONFIG[e].icon;
            return (
              <div key={e} style={{ display: "contents" }}>
                <div
                  className={`step-bubble${i <= estadoIdx ? " done" : ""}`}
                  role="listitem"
                  aria-label={`${e}: ${i <= estadoIdx ? "completado" : "pendiente"}`}
                  title={e}
                >
                  {i < estadoIdx
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    : <StepIcon size={15} color={i <= estadoIdx ? "#f59e0b" : "rgba(255,255,255,0.3)"} />
                  }
                </div>
                {i < ESTADOS.length - 1 && (
                  <div className={`step-line${i < estadoIdx ? " done" : ""}`} aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="progress-section" aria-hidden="true">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: progreso }} />
          </div>
          <div className="progress-labels">
            {ESTADOS.map((e, i) => (
              <span key={e} className={`progress-lbl${i <= estadoIdx ? " done" : ""}`}>
                {e}
              </span>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="items-section" aria-label="Detalle del pedido">
          {pedido.items.map((item) => (
            <div key={item.id} className="order-item">
              <div>
                <div className="order-item-name">{item.qty}× {item.nombre}</div>
                <div className="order-item-unit">{fmt(item.precio)} c/u</div>
              </div>
              <div className="order-item-price" aria-label={`${fmt(item.precio * item.qty)}`}>
                {fmt(item.precio * item.qty)}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="total-row">
          <span className="total-label">Total</span>
          <span className="total-val">{fmt(pedido.total)}</span>
        </div>

        <button className="menu-btn" onClick={() => navigate("/")}>
          <MenuIcon /> Ver el menú
        </button>
      </div>
    </div>
  );
}
