import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import { saveActiveOrder } from "../utils/activeOrder";
import logoDonPerrito from "../assets/logo-don-perrito.png";

const METODOS_PAGO = ["Efectivo", "Nequi", "Daviplata", "Bancolombia", "Tarjeta"];

const METODO_ICONS = {
  Efectivo: "💵",
  Nequi: "📱",
  Daviplata: "🏦",
  Bancolombia: "🏛️",
  Tarjeta: "💳",
};

const CART_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  .cart-root {
    min-height: 100vh; background: #f5f0eb;
    font-family: 'DM Sans', sans-serif; color: #1a1207;
  }

  /* Top bar */
  .cart-topbar {
    background: #1a1207; padding: 1rem 1.5rem;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 40;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  }
  .cart-back-btn {
    display: flex; align-items: center; gap: 0.5rem;
    color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
    padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .cart-back-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }
  .cart-topbar-title {
    font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800;
    color: #fff; display: flex; align-items: center; gap: 0.5rem;
  }
  .cart-mesa-badge {
    font-size: 0.65rem; padding: 0.2rem 0.6rem; border-radius: 999px;
    background: rgba(234,88,12,0.25); color: #f97316;
    font-weight: 700; letter-spacing: 0.08em;
  }

  /* Layout */
  .cart-layout {
    max-width: 1100px; margin: 0 auto;
    padding: 2rem 1.5rem 8rem;
    display: grid; gap: 1.5rem;
    grid-template-columns: 1fr;
  }
  @media (min-width: 900px) {
    .cart-layout { grid-template-columns: 1fr 360px; align-items: start; }
  }

  .section-title {
    font-family: 'Syne', sans-serif; font-size: 1.15rem; font-weight: 900;
    color: #1a1207; margin-bottom: 1rem;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .section-count {
    font-size: 0.7rem; padding: 0.25rem 0.65rem; border-radius: 999px;
    background: #1a1207; color: #fff; font-family: 'DM Sans', sans-serif; font-weight: 700;
  }

  /* Item cards */
  .item-card {
    background: #fff; border-radius: 18px;
    padding: 1rem; margin-bottom: 0.75rem;
    display: flex; gap: 1rem; align-items: flex-start;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    transition: transform 0.2s, box-shadow 0.2s;
    animation: cardIn 0.3s ease both;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .item-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }

  .item-img {
    width: 78px; height: 78px; border-radius: 12px;
    object-fit: cover; background: #fdf0e6; flex-shrink: 0;
  }
  .item-info { flex: 1; min-width: 0; }
  .item-name {
    font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800;
    color: #1a1207; margin-bottom: 0.15rem;
  }
  .item-unit { font-size: 0.75rem; color: #8a7460; }
  .item-actions {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 0.75rem;
  }

  .qty-row { display: flex; align-items: center; border-radius: 10px; overflow: hidden; border: 1.5px solid #f0e6d8; }
  .qty-btn {
    width: 34px; height: 34px; background: #fdf0e6; border: none;
    cursor: pointer; font-size: 1rem; font-weight: 700; color: #1a1207;
    transition: background 0.15s; display: flex; align-items: center; justify-content: center;
  }
  .qty-btn:hover { background: #ea580c; color: #fff; }
  .qty-num {
    width: 38px; text-align: center; font-family: 'Syne', sans-serif;
    font-size: 0.9rem; font-weight: 800; background: #fff; color: #1a1207;
  }

  .item-subtotal {
    font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 900; color: #ea580c;
  }
  .btn-remove {
    background: #fff0f0; border: none; border-radius: 8px;
    padding: 0.35rem 0.7rem; font-size: 0.72rem; font-weight: 700;
    color: #ef4444; cursor: pointer; transition: background 0.15s;
    flex-shrink: 0; align-self: flex-start;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-remove:hover { background: #fee2e2; }

  /* Summary panel */
  .summary-panel {
    background: #1a1207; border-radius: 22px; padding: 1.5rem;
    color: #fff; box-shadow: 0 8px 32px rgba(26,18,7,0.25);
    position: relative; overflow: hidden;
  }
  .summary-panel::before {
    content: ''; position: absolute;
    top: -60px; right: -60px; width: 180px; height: 180px;
    border-radius: 50%; background: rgba(234,88,12,0.15); filter: blur(40px);
  }
  .summary-title {
    font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 900;
    margin-bottom: 1.25rem; position: relative;
  }

  /* Payment methods */
  .payment-label {
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.45); margin-bottom: 0.75rem;
  }
  .payment-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem;
  }
  .payment-btn {
    display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
    padding: 0.75rem 0.5rem; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05); cursor: pointer; transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .payment-btn:hover { border-color: rgba(234,88,12,0.5); background: rgba(234,88,12,0.1); }
  .payment-btn-active {
    border-color: #ea580c; background: rgba(234,88,12,0.2);
    box-shadow: 0 0 0 1px rgba(234,88,12,0.4);
  }
  .payment-icon { font-size: 1.3rem; }
  .payment-name { font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.8); }
  .payment-name-active { color: #fdba74; }

  .summary-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 1rem 0; }
  .summary-row {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.82rem; color: rgba(255,255,255,0.5); margin-bottom: 0.5rem;
  }
  .summary-total {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-top: 0.25rem;
  }
  .summary-total-label {
    font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; color: #fff;
  }
  .summary-total-price {
    font-family: 'Syne', sans-serif; font-size: 1.75rem; font-weight: 900; color: #f97316;
  }

  .payment-hint {
    font-size: 0.75rem; color: rgba(249,115,22,0.8); margin-top: 0.5rem;
    display: flex; align-items: center; gap: 0.35rem;
  }

  .error-box {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
    border-radius: 12px; padding: 0.75rem; margin-top: 1rem;
    color: #fca5a5; font-size: 0.78rem; font-weight: 500;
  }

  .submit-btn {
    width: 100%; margin-top: 1.25rem;
    padding: 1rem; border-radius: 14px; border: none; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 900;
    color: #fff; background: linear-gradient(135deg, #ea580c, #c2410c);
    box-shadow: 0 4px 20px rgba(234,88,12,0.4);
    transition: all 0.2s; position: relative; overflow: hidden;
  }
  .submit-btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%);
  }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-1px); box-shadow: 0 8px 30px rgba(234,88,12,0.55);
  }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Empty state */
  .empty-root {
    min-height: 100vh; background: #f5f0eb;
    display: flex; align-items: center; justify-content: center; padding: 1.5rem;
    font-family: 'DM Sans', sans-serif;
  }
  .empty-card {
    max-width: 380px; width: 100%; background: #fff; border-radius: 24px;
    padding: 3rem 2rem; text-align: center;
    box-shadow: 0 8px 40px rgba(0,0,0,0.1);
    animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes popIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  .empty-logo { width: 80px; height: 80px; border-radius: 20px; object-fit: cover; margin: 0 auto 1.5rem; display: block; box-shadow: 0 4px 20px rgba(234,88,12,0.2); }
  .empty-title { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 900; color: #1a1207; }
  .empty-sub { font-size: 0.85rem; color: #8a7460; margin: 0.5rem 0 2rem; line-height: 1.6; }
  .btn-back-menu {
    width: 100%; padding: 0.9rem; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #ea580c, #c2410c);
    color: #fff; font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800;
    cursor: pointer; box-shadow: 0 4px 16px rgba(234,88,12,0.35);
    transition: all 0.2s;
  }
  .btn-back-menu:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(234,88,12,0.45); }

  .spinner {
    display: inline-block; width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    border-radius: 50%; animation: spin 0.6s linear infinite;
    margin-right: 8px; vertical-align: middle;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function Cart() {
  const navigate = useNavigate();
  const { carrito, subtotal, totalItems, cambiarQty, eliminar, limpiarCarrito } = useCart();
  const [metodoPago, setMetodoPago] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function enviarPedido() {
    if (carrito.length === 0) { setError("Agrega al menos un producto antes de enviar el pedido."); return; }
    if (!METODOS_PAGO.includes(metodoPago)) { setError("Selecciona un método de pago para continuar."); return; }
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
      <>
        <style>{CART_STYLES}</style>
        <div className="empty-root">
          <div className="empty-card">
            <img src={logoDonPerrito} alt="Don Perrito" className="empty-logo" />
            <h1 className="empty-title">Carrito vacío</h1>
            <p className="empty-sub">Agrega productos desde el menú para armar tu pedido y disfrutar.</p>
            <button className="btn-back-menu" onClick={() => navigate("/")}>← Volver al menú</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CART_STYLES}</style>
      <div className="cart-root">
        <div className="cart-topbar">
          <button className="cart-back-btn" onClick={() => navigate(-1)}>← Volver</button>
          <div className="cart-topbar-title">
            Tu pedido
            <span className="cart-mesa-badge">Mesa #{localStorage.getItem("mesa") || "1"}</span>
          </div>
          <div style={{ width: 80 }} />
        </div>

        <div className="cart-layout">
          {/* Items */}
          <section>
            <h2 className="section-title">
              Productos <span className="section-count">{totalItems}</span>
            </h2>
            {carrito.map((item, i) => (
              <div key={item.id} className="item-card" style={{ animationDelay: `${i * 0.06}s` }}>
                <img src={item.imagen} alt={item.nombre} className="item-img" />
                <div className="item-info">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p className="item-name">{item.nombre}</p>
                      <p className="item-unit">{fmt(item.precio)} c/u</p>
                    </div>
                    <button className="btn-remove" onClick={() => eliminar(item.id)}>✕ Quitar</button>
                  </div>
                  <div className="item-actions">
                    <div className="qty-row">
                      <button className="qty-btn" onClick={() => cambiarQty(item.id, -1)}>−</button>
                      <span className="qty-num">{item.qty}</span>
                      <button className="qty-btn" onClick={() => cambiarQty(item.id, 1)}>+</button>
                    </div>
                    <span className="item-subtotal">{fmt(item.precio * item.qty)}</span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Summary */}
          <aside className="summary-panel">
            <h2 className="summary-title">Resumen del pedido</h2>

            <p className="payment-label">Método de pago</p>
            <div className="payment-grid">
              {METODOS_PAGO.map((metodo) => (
                <button
                  key={metodo}
                  className={`payment-btn ${metodoPago === metodo ? "payment-btn-active" : ""}`}
                  onClick={() => setMetodoPago(metodo)}
                >
                  <span className="payment-icon">{METODO_ICONS[metodo]}</span>
                  <span className={`payment-name ${metodoPago === metodo ? "payment-name-active" : ""}`}>
                    {metodo}
                  </span>
                </button>
              ))}
            </div>

            {!metodoPago && (
              <p className="payment-hint">⚡ Selecciona cómo vas a pagar antes de enviar.</p>
            )}

            <div className="summary-divider" />

            <div className="summary-row"><span>Productos</span><span>{totalItems}</span></div>
            <div className="summary-row"><span>Mesa</span><span>#{localStorage.getItem("mesa") || "1"}</span></div>
            {metodoPago && <div className="summary-row"><span>Método</span><span>{metodoPago}</span></div>}

            <div className="summary-divider" />
            <div className="summary-total">
              <span className="summary-total-label">Total</span>
              <span className="summary-total-price">{fmt(subtotal)}</span>
            </div>

            {error && <p className="error-box">⚠ {error}</p>}

            <button
              className="submit-btn"
              onClick={enviarPedido}
              disabled={loading}
            >
              {loading ? <><span className="spinner" />Enviando...</> : "Enviar pedido 🚀"}
            </button>
          </aside>
        </div>
      </div>
    </>
  );
}
