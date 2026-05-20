cat > /mnt/user-data/outputs/Cart.jsx << 'ENDOFFILE'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import { saveActiveOrder } from "../utils/activeOrder";

const METODOS_PAGO = [
  { id: "Efectivo", icon: "💵", label: "Efectivo" },
  { id: "Nequi", icon: "💜", label: "Nequi" },
  { id: "Daviplata", icon: "🔴", label: "Daviplata" },
  { id: "Bancolombia", icon: "🟡", label: "Bancolombia" },
  { id: "Tarjeta", icon: "💳", label: "Tarjeta" },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #07070f;
    --surface: rgba(255,255,255,0.03);
    --surface2: rgba(255,255,255,0.055);
    --surface3: rgba(255,255,255,0.08);
    --border: rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.13);
    --amber: #f59e0b;
    --orange: #f97316;
    --text: #f0efe9;
    --text2: rgba(240,239,233,0.6);
    --muted: rgba(240,239,233,0.32);
  }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }

  /* ── SHELL ── */
  .cart-shell {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 60% 30% at 50% 0%, rgba(249,115,22,0.06) 0%, transparent 60%),
      var(--bg);
    padding: 24px 20px 80px;
  }
  .cart-inner { max-width: 960px; margin: 0 auto; }

  /* ── BACK ── */
  .back-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 16px; border-radius: 12px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--muted); font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: all 0.2s; margin-bottom: 28px;
  }
  .back-btn:hover { color: var(--text); border-color: var(--border2); background: var(--surface2); }

  /* ── HEADER ── */
  .cart-header { margin-bottom: 28px; }
  .cart-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 10px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; color: var(--orange);
    background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.2);
    padding: 4px 12px; border-radius: 100px;
  }
  .cart-title { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; color: var(--text); margin-top: 12px; line-height: 1.1; }
  .cart-count { font-size: 14px; color: var(--muted); margin-top: 6px; }

  /* ── LAYOUT ── */
  .cart-layout { display: grid; gap: 24px; }
  @media(min-width: 720px) { .cart-layout { grid-template-columns: 1fr 320px; } }

  /* ── ITEM CARD ── */
  .item-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 14px;
    display: flex; gap: 14px; align-items: flex-start;
    transition: all 0.2s; animation: slideInItem 0.3s ease both;
  }
  .item-card:hover { border-color: rgba(249,115,22,0.18); background: var(--surface2); }
  .item-img {
    width: 82px; height: 82px; border-radius: 14px; object-fit: cover; flex-shrink: 0;
    background: var(--surface2); border: 1px solid var(--border);
  }
  .item-info { flex: 1; min-width: 0; }
  .item-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); line-height: 1.2; }
  .item-unit { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .item-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; flex-wrap: wrap; gap: 10px; }
  .item-subtotal { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: var(--amber); }

  /* qty */
  .qty-row {
    display: flex; align-items: center; gap: 2px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 11px; padding: 3px;
  }
  .qty-btn {
    width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer;
    font-size: 16px; font-weight: 800; font-family: 'Syne', sans-serif;
    transition: all 0.15s;
  }
  .qty-btn.minus { background: var(--surface3); color: var(--text); }
  .qty-btn.minus:hover { background: rgba(255,255,255,0.12); }
  .qty-btn.plus { background: linear-gradient(135deg, var(--orange), var(--amber)); color: #fff; }
  .qty-btn.plus:hover { box-shadow: 0 4px 12px rgba(249,115,22,0.4); }
  .qty-num { width: 30px; text-align: center; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--text); }

  .remove-btn {
    width: 32px; height: 32px; border-radius: 8px; border: none;
    background: rgba(251,113,133,0.08); color: #fb7185;
    cursor: pointer; font-size: 13px; margin-left: 4px;
    transition: all 0.15s; display:flex; align-items:center; justify-content:center;
  }
  .remove-btn:hover { background: rgba(251,113,133,0.18); }

  /* ── SUMMARY SIDEBAR ── */
  .summary-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 24px; padding: 24px;
    position: sticky; top: 24px; height: fit-content;
  }
  .summary-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: var(--text); margin-bottom: 20px; }

  .payment-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
  .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .pay-btn {
    padding: 11px 6px; border-radius: 13px;
    border: 1px solid var(--border); background: var(--surface2);
    color: var(--muted); font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    text-align: center; transition: all 0.2s;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
  }
  .pay-btn:hover { border-color: rgba(249,115,22,0.3); color: var(--text); background: var(--surface3); }
  .pay-btn.selected { border-color: var(--amber); background: rgba(245,158,11,0.1); color: var(--amber); }
  .pay-icon { font-size: 18px; }
  .pay-hint { font-size: 11px; color: rgba(245,158,11,0.6); margin-top: 8px; display: flex; align-items: center; gap: 4px; }

  .divider { border: none; border-top: 1px solid var(--border); margin: 18px 0; }

  .summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .summary-row-label { font-size: 13px; color: var(--muted); }
  .summary-row-val { font-size: 13px; color: var(--text); font-weight: 600; }

  .total-block {
    background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.15);
    border-radius: 16px; padding: 14px 16px;
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 4px;
  }
  .total-label { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); }
  .total-val { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--amber); }

  .error-box {
    display: flex; align-items: center; gap: 8px;
    background: rgba(251,113,133,0.08); border: 1px solid rgba(251,113,133,0.2);
    border-radius: 12px; padding: 11px 14px;
    font-size: 13px; color: #fb7185; margin-top: 14px;
  }
  .submit-btn {
    width: 100%; margin-top: 14px; padding: 15px;
    background: linear-gradient(135deg, var(--orange), var(--amber));
    border: none; border-radius: 16px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800;
    color: #fff; box-shadow: 0 6px 24px rgba(249,115,22,0.35);
    transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(249,115,22,0.5); }
  .submit-btn:disabled { background: rgba(255,255,255,0.07); box-shadow: none; cursor: not-allowed; color: var(--muted); }

  /* ── EMPTY ── */
  .empty-shell { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .empty-card {
    max-width: 360px; width: 100%;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 28px; padding: 48px 32px; text-align: center;
    animation: fadeUpCard 0.5s ease both;
  }
  .empty-icon { font-size: 52px; margin-bottom: 16px; }
  .empty-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--text); }
  .empty-desc { font-size: 14px; color: var(--muted); margin-top: 10px; margin-bottom: 28px; line-height: 1.6; }
  .empty-btn {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, var(--orange), var(--amber));
    border: none; border-radius: 14px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff;
    box-shadow: 0 6px 20px rgba(249,115,22,0.3); transition: all 0.2s;
  }
  .empty-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(249,115,22,0.45); }

  /* ── SPINNER ── */
  .spinner { width: 17px; height: 17px; border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }

  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes slideInItem { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes fadeUpCard { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
`;

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
      const pedido = { mesa: localStorage.getItem("mesa") || "1", metodo: metodoPago, total: subtotal, items: carrito };
      const response = await api.post("/pedidos", pedido);
      const pedidoGuardado = saveActiveOrder(response.data);
      limpiarCarrito();
      navigate("/confirmed", { state: { pedido: pedidoGuardado } });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "No pudimos enviar el pedido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (carrito.length === 0) {
    return (
      <div className="empty-shell">
        <style>{CSS}</style>
        <div className="empty-card">
          <div className="empty-icon">🛒</div>
          <div className="empty-title">Carrito vacío</div>
          <p className="empty-desc">Agrega productos desde el menú para armar tu pedido.</p>
          <button className="empty-btn" onClick={() => navigate("/")}>← Volver al menú</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-shell">
      <style>{CSS}</style>
      <div className="cart-inner">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Volver al menú
        </button>

        <div className="cart-header">
          <div className="cart-eyebrow">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            Mesa #{localStorage.getItem("mesa") || "1"}
          </div>
          <h1 className="cart-title">Tu pedido</h1>
          <div className="cart-count">{totalItems} producto{totalItems !== 1 ? "s" : ""} seleccionados</div>
        </div>

        <div className="cart-layout">
          {/* Items */}
          <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {carrito.map((item, i) => (
              <div key={item.id} className="item-card" style={{ animationDelay: `${i * 55}ms` }}>
                <img src={item.imagen} alt={item.nombre} className="item-img" />
                <div className="item-info">
                  <div className="item-name">{item.nombre}</div>
                  <div className="item-unit">{fmt(item.precio)} c/u</div>
                  <div className="item-bottom">
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div className="qty-row">
                        <button className="qty-btn minus" onClick={() => cambiarQty(item.id, -1)}>−</button>
                        <span className="qty-num">{item.qty}</span>
                        <button className="qty-btn plus" onClick={() => cambiarQty(item.id, 1)}>+</button>
                      </div>
                      <button className="remove-btn" onClick={() => eliminar(item.id)} title="Quitar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <span className="item-subtotal">{fmt(item.precio * item.qty)}</span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Summary */}
          <aside className="summary-card">
            <div className="summary-title">Resumen</div>

            <div className="payment-label">Método de pago</div>
            <div className="payment-grid">
              {METODOS_PAGO.map((m) => (
                <button key={m.id} className={`pay-btn${metodoPago === m.id ? " selected" : ""}`} onClick={() => setMetodoPago(m.id)}>
                  <span className="pay-icon">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
            {!metodoPago && (
              <div className="pay-hint">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Selecciona cómo vas a pagar
              </div>
            )}

            <hr className="divider" />

            <div className="summary-row">
              <span className="summary-row-label">Productos</span>
              <span className="summary-row-val">{totalItems}</span>
            </div>
            <div className="total-block">
              <span className="total-label">Total</span>
              <span className="total-val">{fmt(subtotal)}</span>
            </div>

            {error && (
              <div className="error-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <button className="submit-btn" onClick={enviarPedido} disabled={loading}>
              {loading
                ? <><div className="spinner" /> Enviando…</>
                : <>Enviar pedido <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
ENDOFFILE

