import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import { saveActiveOrder } from "../utils/activeOrder";

const METODOS_PAGO = [
  { id: "Efectivo", icon: CashIcon, label: "Efectivo" },
  { id: "Nequi", icon: NequiIcon, label: "Nequi" },
  { id: "Daviplata", icon: DaviIcon, label: "Daviplata" },
  { id: "Bancolombia", icon: BankIcon, label: "Bancolombia" },
  { id: "Tarjeta", icon: CardIcon, label: "Tarjeta" },
];

function CashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M6 12h.01M18 12h.01"/>
    </svg>
  );
}
function NequiIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="3"/>
      <path d="M9 7h6M9 12h6M9 17h3"/>
    </svg>
  );
}
function DaviIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  );
}
function BankIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 22h18M3 10h18M5 10V6l7-3 7 3v4M5 22v-6h2v6M11 22v-6h2v6M17 22v-6h2v6"/>
    </svg>
  );
}
function CardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M2 10h20"/>
    </svg>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap');

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
    --danger: #ef4444;
    --radius-sm: 10px;
    --radius-md: 16px;
    --radius-lg: 22px;
    --font-display: 'Syne', 'Georgia', serif;
    --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --transition: 0.2s ease;
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

  /* ─── Shell ─────────────────────────────────────── */
  .cart-shell { min-height: 100vh; background: var(--bg); padding: 24px 20px 80px; }
  .cart-inner { max-width: 900px; margin: 0 auto; }

  /* ─── Back button ────────────────────────────────── */
  .back-btn {
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 7px;
    padding: 10px 16px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--font-body);
    -webkit-transition: all var(--transition);
    transition: all var(--transition);
    margin-bottom: 28px;
    min-height: 44px;
  }
  .back-btn:hover { color: var(--text); border-color: rgba(255,255,255,0.14); }
  .back-btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }

  /* ─── Page header ────────────────────────────────── */
  .cart-header { margin-bottom: 28px; }
  .cart-eyebrow {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--amber);
  }
  .cart-title {
    font-family: var(--font-display);
    font-size: clamp(28px, 6vw, 36px);
    font-weight: 800;
    color: var(--text);
    margin-top: 4px;
    letter-spacing: -0.5px;
    line-height: 1.1;
  }
  .cart-count { font-size: 13px; color: var(--muted); margin-top: 5px; }

  /* ─── Layout ─────────────────────────────────────── */
  .cart-layout {
    display: -ms-grid;
    display: grid;
    gap: 24px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 720px) {
    .cart-layout {
      -ms-grid-columns: 1fr 320px;
      grid-template-columns: 1fr 320px;
    }
  }

  /* ─── Item cards ─────────────────────────────────── */
  .item-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 14px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    gap: 14px;
    -webkit-box-align: flex-start;
    -ms-flex-align: flex-start;
    align-items: flex-start;
    -webkit-transition: border-color var(--transition);
    transition: border-color var(--transition);
    -webkit-animation: slideIn 0.3s ease both;
    animation: slideIn 0.3s ease both;
  }
  .item-card:hover { border-color: rgba(249,115,22,0.15); }

  .item-img {
    width: 78px;
    height: 78px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    -ms-flex-negative: 0;
    flex-shrink: 0;
    background: var(--surface2);
    display: block;
  }
  .item-info { -webkit-box-flex: 1; -ms-flex: 1; flex: 1; min-width: 0; }
  .item-name {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.25;
    letter-spacing: -0.1px;
  }
  .item-unit { font-size: 12px; color: var(--muted); margin-top: 3px; }
  .item-bottom {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    margin-top: 12px;
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
    gap: 10px;
  }
  .item-subtotal {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 800;
    color: var(--amber);
  }
  .qty-row {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 4px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 4px;
  }
  .qty-btn {
    width: 36px;
    height: 36px;
    border-radius: 7px;
    border: none;
    cursor: pointer;
    font-size: 16px;
    font-weight: 800;
    font-family: var(--font-display);
    -webkit-transition: all 0.15s ease;
    transition: all 0.15s ease;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
  }
  .qty-btn.minus { background: rgba(255,255,255,0.06); color: var(--text); }
  .qty-btn.minus:hover { background: rgba(255,255,255,0.1); }
  .qty-btn.plus {
    background: -webkit-linear-gradient(135deg, var(--orange), var(--amber));
    background: linear-gradient(135deg, var(--orange), var(--amber));
    color: #fff;
  }
  .qty-btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
  .qty-num {
    width: 30px;
    text-align: center;
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }
  .remove-btn {
    width: 36px;
    height: 36px;
    border-radius: 7px;
    border: none;
    background: rgba(239,68,68,0.1);
    color: var(--danger);
    cursor: pointer;
    font-size: 13px;
    margin-left: 6px;
    -webkit-transition: all 0.15s ease;
    transition: all 0.15s ease;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
  }
  .remove-btn:hover { background: rgba(239,68,68,0.18); }
  .remove-btn:focus-visible { outline: 2px solid var(--danger); outline-offset: 2px; }

  /* ─── Summary sidebar ────────────────────────────── */
  .summary-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 22px;
    position: -webkit-sticky;
    position: sticky;
    top: 24px;
  }
  .summary-title {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 18px;
    letter-spacing: -0.2px;
  }
  .payment-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }
  .payment-grid {
    display: -ms-grid;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px;
  }
  .pay-btn {
    padding: 11px 6px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--font-body);
    text-align: center;
    -webkit-transition: all var(--transition);
    transition: all var(--transition);
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 5px;
    min-height: 64px;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
  }
  .pay-btn:hover { border-color: rgba(249,115,22,0.3); color: var(--text); }
  .pay-btn.selected {
    border-color: var(--amber);
    background: rgba(245,158,11,0.1);
    color: var(--amber);
  }
  .pay-btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
  .pay-icon {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
  }
  .pay-hint {
    font-size: 11px;
    color: rgba(245,158,11,0.65);
    margin-top: 8px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 5px;
  }
  .divider { border: none; border-top: 1px solid var(--border); margin: 18px 0; }
  .summary-rows {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    gap: 10px;
  }
  .summary-row {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
  }
  .summary-row-label { font-size: 13px; color: var(--muted); }
  .summary-row-val { font-size: 13px; color: var(--text); font-weight: 600; }
  .summary-total-label {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 800;
    color: var(--text);
  }
  .summary-total-val {
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 800;
    color: var(--amber);
  }

  /* ─── Error ──────────────────────────────────────── */
  .error-box {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 8px;
    background: rgba(239,68,68,0.07);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: var(--radius-sm);
    padding: 11px 13px;
    font-size: 13px;
    color: var(--danger);
    margin: 14px 0;
    -ms-flex-negative: 0;
    flex-shrink: 0;
  }

  /* ─── Submit ─────────────────────────────────────── */
  .submit-btn {
    width: 100%;
    padding: 15px;
    background: -webkit-linear-gradient(135deg, var(--orange), var(--amber));
    background: linear-gradient(135deg, var(--orange), var(--amber));
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 800;
    color: #fff;
    -webkit-box-shadow: 0 6px 24px rgba(249,115,22,0.35);
    box-shadow: 0 6px 24px rgba(249,115,22,0.35);
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
    min-height: 52px;
    margin-top: 18px;
    letter-spacing: 0.2px;
  }
  .submit-btn:hover:not(:disabled) {
    -webkit-transform: translateY(-2px);
    -ms-transform: translateY(-2px);
    transform: translateY(-2px);
    -webkit-box-shadow: 0 10px 32px rgba(249,115,22,0.45);
    box-shadow: 0 10px 32px rgba(249,115,22,0.45);
  }
  .submit-btn:disabled {
    background: rgba(255,255,255,0.07);
    -webkit-box-shadow: none;
    box-shadow: none;
    cursor: not-allowed;
    color: var(--muted);
  }
  .submit-btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }

  /* ─── Empty ──────────────────────────────────────── */
  .empty-shell {
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
  .empty-card {
    max-width: 360px;
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 44px 32px;
    text-align: center;
  }
  .empty-icon-wrap {
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
  .empty-title {
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -0.3px;
  }
  .empty-desc {
    font-size: 13px;
    color: var(--muted);
    margin: 10px 0 26px;
    line-height: 1.65;
  }
  .empty-btn {
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
    -webkit-box-shadow: 0 6px 20px rgba(249,115,22,0.3);
    box-shadow: 0 6px 20px rgba(249,115,22,0.3);
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
    gap: 7px;
    min-height: 50px;
  }
  .empty-btn:hover {
    -webkit-transform: translateY(-2px);
    -ms-transform: translateY(-2px);
    transform: translateY(-2px);
  }
  .empty-btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }

  /* ─── Spinner ────────────────────────────────────── */
  @-webkit-keyframes spin { to { -webkit-transform: rotate(360deg); transform: rotate(360deg); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 17px;
    height: 17px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    -webkit-animation: spin 0.7s linear infinite;
    animation: spin 0.7s linear infinite;
    display: inline-block;
    -ms-flex-negative: 0;
    flex-shrink: 0;
  }

  @-webkit-keyframes slideIn {
    from { opacity: 0; -webkit-transform: translateX(-8px); transform: translateX(-8px); }
    to { opacity: 1; -webkit-transform: translateX(0); transform: translateX(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @media (max-width: 480px) {
    .cart-shell { padding: 18px 14px 60px; }
    .cart-inner { max-width: 100%; }
  }

  @supports not (backdrop-filter: blur(1px)) {
    .summary-card { background: rgba(14,12,22,0.98); }
  }
`;

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}
function WarnIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
function CartEmptyIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      <path d="M10 10l4 4M14 10l-4 4"/>
    </svg>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const { carrito, subtotal, totalItems, cambiarQty, eliminar, limpiarCarrito } = useCart();
  const [metodoPago, setMetodoPago] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function enviarPedido() {
    if (carrito.length === 0) { setError("Agrega al menos un producto."); return; }
    if (!metodoPago) { setError("Selecciona un método de pago."); return; }
    try {
      setError(""); setLoading(true);
      const pedido = {
        mesa: localStorage.getItem("mesa") || "1",
        metodo: metodoPago,
        total: subtotal,
        items: carrito,
      };
      const response = await api.post("/pedidos", pedido);
      const pedidoGuardado = saveActiveOrder(response.data);
      limpiarCarrito();
      navigate("/confirmed", { state: { pedido: pedidoGuardado } });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "No pudimos enviar el pedido. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  if (carrito.length === 0) {
    return (
      <div className="empty-shell">
        <style>{CSS}</style>
        <div className="empty-card">
          <div className="empty-icon-wrap"><CartEmptyIcon /></div>
          <div className="empty-title">Carrito vacío</div>
          <p className="empty-desc">Agrega productos desde el menú para armar tu pedido.</p>
          <button className="empty-btn" onClick={() => navigate("/")}>
            <BackIcon /> Volver al menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-shell">
      <style>{CSS}</style>
      <div className="cart-inner">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Volver atrás">
          <BackIcon /> Volver
        </button>

        <header className="cart-header">
          <div className="cart-eyebrow">Mesa #{localStorage.getItem("mesa") || "1"}</div>
          <h1 className="cart-title">Tu pedido</h1>
          <p className="cart-count">{totalItems} producto{totalItems !== 1 ? "s" : ""}</p>
        </header>

        <div className="cart-layout">
          {/* Items list */}
          <section
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            aria-label="Productos en el carrito"
          >
            {carrito.map((item, i) => (
              <div
                key={item.id}
                className="item-card"
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <img
                  src={item.imagen}
                  alt={item.nombre}
                  className="item-img"
                  width="78"
                  height="78"
                  loading="lazy"
                  decoding="async"
                />
                <div className="item-info">
                  <div className="item-name">{item.nombre}</div>
                  <div className="item-unit">{fmt(item.precio)} c/u</div>
                  <div className="item-bottom">
                    <div
                      className="qty-row"
                      role="group"
                      aria-label={`Cantidad de ${item.nombre}`}
                    >
                      <button
                        className="qty-btn minus"
                        onClick={() => cambiarQty(item.id, -1)}
                        aria-label="Reducir cantidad"
                      >
                        −
                      </button>
                      <span className="qty-num" aria-live="polite">{item.qty}</span>
                      <button
                        className="qty-btn plus"
                        onClick={() => cambiarQty(item.id, 1)}
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                    <span className="item-subtotal" aria-label={`Subtotal ${fmt(item.precio * item.qty)}`}>
                      {fmt(item.precio * item.qty)}
                    </span>
                    <button
                      className="remove-btn"
                      onClick={() => eliminar(item.id)}
                      aria-label={`Quitar ${item.nombre}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Summary sidebar */}
          <aside className="summary-card" aria-label="Resumen del pedido">
            <div className="summary-title">Resumen</div>

            <div className="payment-label" id="pago-label">Método de pago</div>
            <div
              className="payment-grid"
              role="radiogroup"
              aria-labelledby="pago-label"
            >
              {METODOS_PAGO.map((m) => {
                const IconComponent = m.icon;
                return (
                  <button
                    key={m.id}
                    className={`pay-btn${metodoPago === m.id ? " selected" : ""}`}
                    onClick={() => setMetodoPago(m.id)}
                    role="radio"
                    aria-checked={metodoPago === m.id}
                    aria-label={m.label}
                  >
                    <span className="pay-icon"><IconComponent /></span>
                    {m.label}
                  </button>
                );
              })}
            </div>

            {!metodoPago && (
              <div className="pay-hint" aria-live="polite">
                <WarnIcon /> Selecciona cómo vas a pagar
              </div>
            )}

            <hr className="divider" />

            <div className="summary-rows">
              <div className="summary-row">
                <span className="summary-row-label">Productos</span>
                <span className="summary-row-val">{totalItems}</span>
              </div>
              <div className="summary-row">
                <span className="summary-total-label">Total</span>
                <span className="summary-total-val">{fmt(subtotal)}</span>
              </div>
            </div>

            {error && (
              <div className="error-box" role="alert">
                <AlertIcon />
                <span>{error}</span>
              </div>
            )}

            <button
              className="submit-btn"
              onClick={enviarPedido}
              disabled={loading}
              aria-busy={loading}
            >
              {loading
                ? <><span className="spinner" aria-hidden="true" /> Enviando...</>
                : <>Enviar pedido <SendIcon /></>
              }
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
