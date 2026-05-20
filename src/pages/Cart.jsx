import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import { saveActiveOrder } from "../utils/activeOrder";
import logoDonPerrito from "../assets/logo-don-perrito.png";

const METODOS_PAGO = [
  { id: "Efectivo", icon: "💵", label: "Efectivo" },
  { id: "Nequi", icon: "💜", label: "Nequi" },
  { id: "Daviplata", icon: "🔴", label: "Daviplata" },
  { id: "Bancolombia", icon: "🟡", label: "Bancolombia" },
  { id: "Tarjeta", icon: "💳", label: "Tarjeta" },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; }
  :root {
    --bg: #08080e;
    --surface: rgba(255,255,255,0.03);
    --surface2: rgba(255,255,255,0.05);
    --border: rgba(255,255,255,0.07);
    --amber: #f59e0b;
    --orange: #f97316;
    --text: #f1f0ee;
    --muted: rgba(255,255,255,0.35);
  }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
  .cart-shell { min-height: 100vh; background: var(--bg); padding: 24px 20px 80px; }
  .cart-inner { max-width: 900px; margin: 0 auto; }

  .back-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px; border-radius: 12px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--muted); font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: all 0.2s; margin-bottom: 28px;
  }
  .back-btn:hover { color: var(--text); border-color: rgba(255,255,255,0.15); }

  .cart-header { margin-bottom: 28px; }
  .cart-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--amber); }
  .cart-title { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; color: var(--text); margin-top: 4px; }
  .cart-count { font-size: 14px; color: var(--muted); margin-top: 4px; }

  .cart-layout { display: grid; gap: 24px; grid-template-columns: 1fr; }
  @media(min-width: 720px) { .cart-layout { grid-template-columns: 1fr 320px; } }

  /* Item cards */
  .item-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 16px;
    display: flex; gap: 16px; align-items: flex-start;
    transition: border-color 0.2s;
  }
  .item-card:hover { border-color: rgba(249,115,22,0.15); }
  .item-img { width: 80px; height: 80px; border-radius: 14px; object-fit: cover; flex-shrink: 0; background: var(--surface2); }
  .item-info { flex: 1; min-width: 0; }
  .item-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--text); line-height: 1.2; }
  .item-unit { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .item-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; flex-wrap: wrap; gap: 12px; }
  .item-subtotal { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: var(--amber); }
  .item-actions { display: flex; align-items: center; gap: 4px; }
  .qty-row { display: flex; align-items: center; gap: 6px; background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 4px; }
  .qty-btn {
    width: 34px; height: 34px; border-radius: 9px; border: none; cursor: pointer;
    font-size: 16px; font-weight: 800; font-family: 'Syne', sans-serif;
    transition: all 0.15s;
  }
  .qty-btn.minus { background: rgba(255,255,255,0.06); color: var(--text); }
  .qty-btn.minus:hover { background: rgba(255,255,255,0.1); }
  .qty-btn.plus { background: linear-gradient(135deg, var(--orange), var(--amber)); color: #fff; }
  .qty-num { width: 32px; text-align: center; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--text); }
  .remove-btn {
    width: 34px; height: 34px; border-radius: 9px; border: none;
    background: rgba(255,107,107,0.1); color: #ff6b6b;
    cursor: pointer; font-size: 14px; margin-left: 6px;
    transition: all 0.15s;
  }
  .remove-btn:hover { background: rgba(255,107,107,0.2); }

  /* Summary sidebar */
  .summary-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 24px; padding: 24px;
    position: sticky; top: 24px;
  }
  .summary-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--text); margin-bottom: 20px; }
  .payment-label { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
  .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .pay-btn {
    padding: 12px 8px; border-radius: 14px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--muted); font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    text-align: center; transition: all 0.2s;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
  }
  .pay-btn:hover { border-color: rgba(249,115,22,0.3); color: var(--text); }
  .pay-btn.selected { border-color: var(--amber); background: rgba(245,158,11,0.1); color: var(--amber); }
  .pay-icon { font-size: 20px; }
  .pay-hint { font-size: 11px; color: rgba(245,158,11,0.7); margin-top: 8px; }

  .divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
  .summary-row { display: flex; justify-content: space-between; align-items: center; }
  .summary-row-label { font-size: 13px; color: var(--muted); }
  .summary-row-val { font-size: 13px; color: var(--text); font-weight: 600; }
  .summary-total-label { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: var(--text); }
  .summary-total-val { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--amber); }

  .error-box {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.2);
    border-radius: 12px; padding: 12px 14px;
    font-size: 13px; color: #ff6b6b; margin: 16px 0;
  }
  .submit-btn {
    width: 100%; padding: 16px;
    background: linear-gradient(135deg, var(--orange), var(--amber));
    border: none; border-radius: 16px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800;
    color: #fff; box-shadow: 0 8px 28px rgba(249,115,22,0.35);
    transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(249,115,22,0.45); }
  .submit-btn:disabled { background: rgba(255,255,255,0.08); box-shadow: none; cursor: not-allowed; color: var(--muted); transform: none; }

  /* Empty */
  .empty-shell { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .empty-card { max-width: 380px; width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 28px; padding: 48px 36px; text-align: center; }
  .empty-icon { font-size: 56px; margin-bottom: 16px; }
  .empty-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--text); }
  .empty-desc { font-size: 14px; color: var(--muted); margin-top: 10px; margin-bottom: 28px; line-height: 1.6; }
  .empty-btn {
    width: 100%; padding: 15px;
    background: linear-gradient(135deg, var(--orange), var(--amber));
    border: none; border-radius: 14px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff;
    box-shadow: 0 8px 24px rgba(249,115,22,0.3); transition: all 0.2s;
  }
  .empty-btn:hover { transform: translateY(-2px); }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    border-radius: 50%; animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  @keyframes slideIn { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
  .item-card { animation: slideIn 0.3s ease both; }
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
          Volver
        </button>

        <div className="cart-header">
          <div className="cart-eyebrow">Mesa #{localStorage.getItem("mesa") || "1"}</div>
          <h1 className="cart-title">Tu pedido</h1>
          <div className="cart-count">{totalItems} producto{totalItems !== 1 ? "s" : ""}</div>
        </div>

        <div className="cart-layout">
          {/* Items */}
          <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {carrito.map((item, i) => (
              <div key={item.id} className="item-card" style={{ animationDelay: `${i * 60}ms` }}>
                <img src={item.imagen} alt={item.nombre} className="item-img" />
                <div className="item-info">
                  <div className="item-name">{item.nombre}</div>
                  <div className="item-unit">{fmt(item.precio)} c/u</div>
                  <div className="item-bottom">
                    <div className="qty-row">
                      <button className="qty-btn minus" onClick={() => cambiarQty(item.id, -1)}>−</button>
                      <span className="qty-num">{item.qty}</span>
                      <button className="qty-btn plus" onClick={() => cambiarQty(item.id, 1)}>+</button>
                    </div>
                    <span className="item-subtotal">{fmt(item.precio * item.qty)}</span>
                    <button className="remove-btn" onClick={() => eliminar(item.id)} title="Quitar">✕</button>
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
                <button
                  key={m.id}
                  className={`pay-btn${metodoPago === m.id ? " selected" : ""}`}
                  onClick={() => setMetodoPago(m.id)}
                >
                  <span className="pay-icon">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
            {!metodoPago && <div className="pay-hint">⚠ Selecciona cómo vas a pagar</div>}

            <hr className="divider" />

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
              <div className="error-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button className="submit-btn" onClick={enviarPedido} disabled={loading} style={{ marginTop: "20px" }}>
              {loading ? <><span className="spinner" /> Enviando...</> : <>Enviar pedido <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
