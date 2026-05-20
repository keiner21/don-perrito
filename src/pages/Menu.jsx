import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MENU } from "../data/menu";
import { useCart } from "../context/CartContext";
import { fmt } from "../utils/format";
import { socket } from "../services/socket";
import { clearActiveOrder, getActiveOrder, getActiveOrderTimeLeft, saveActiveOrder } from "../utils/activeOrder";
import logoDonPerrito from "../assets/logo-don-perrito.png";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
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
  .menu-shell { min-height: 100vh; background: var(--bg); }

  /* Header */
  .menu-header {
    position: sticky; top: 0; z-index: 50;
    background: rgba(8,8,14,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .menu-header-inner {
    max-width: 1200px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px; gap: 16px; flex-wrap: wrap;
  }
  .brand { display: flex; align-items: center; gap: 16px; }
  .brand-logo {
    width: 52px; height: 52px; border-radius: 16px; object-fit: cover;
    box-shadow: 0 0 24px rgba(249,115,22,0.3);
    border: 1px solid rgba(249,115,22,0.3);
  }
  .brand-name { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: var(--text); line-height: 1; }
  .brand-mesa { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--amber); }
  .brand-tagline { font-size: 12px; color: var(--muted); margin-top: 2px; }

  .header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .btn-ghost {
    padding: 10px 18px; border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface); color: var(--muted);
    font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .btn-ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.15); }
  .btn-order {
    padding: 10px 20px; border-radius: 12px;
    background: linear-gradient(135deg, var(--orange), var(--amber));
    border: none; color: #fff;
    font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: 'Syne', sans-serif;
    box-shadow: 0 6px 20px rgba(249,115,22,0.3);
    transition: all 0.2s;
  }
  .btn-order:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(249,115,22,0.4); }
  .btn-active {
    padding: 10px 18px; border-radius: 12px;
    border: 1px solid rgba(249,115,22,0.4);
    background: rgba(249,115,22,0.08); color: var(--amber);
    font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: all 0.2s;
  }

  /* Search & Filters */
  .filter-bar {
    max-width: 1200px; margin: 0 auto;
    padding: 28px 24px 0;
    display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end;
  }
  .search-wrap {
    position: relative; flex: 1; min-width: 220px;
  }
  .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
  .search-input {
    width: 100%; background: var(--surface);
    border: 1px solid var(--border); border-radius: 14px;
    padding: 12px 16px 12px 44px;
    font-size: 14px; color: var(--text); outline: none;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .search-input::placeholder { color: var(--muted); }
  .search-input:focus { border-color: rgba(249,115,22,0.4); box-shadow: 0 0 0 4px rgba(249,115,22,0.08); }

  /* Category pills */
  .cat-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
  .cat-scroll::-webkit-scrollbar { display: none; }
  .cat-pill {
    flex-shrink: 0; padding: 8px 18px; border-radius: 100px;
    border: 1px solid var(--border);
    background: var(--surface); color: var(--muted);
    font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: all 0.2s;
  }
  .cat-pill:hover { color: var(--text); border-color: rgba(255,255,255,0.15); }
  .cat-pill.active {
    background: var(--text); color: #08080e;
    border-color: transparent; box-shadow: 0 4px 14px rgba(241,240,238,0.15);
  }

  /* Products grid */
  .products-grid {
    max-width: 1200px; margin: 0 auto;
    padding: 28px 24px 140px;
    display: grid; gap: 20px;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  /* Product card */
  .product-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px; overflow: hidden;
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    cursor: default;
  }
  .product-card:hover {
    transform: translateY(-4px);
    border-color: rgba(249,115,22,0.2);
    box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(249,115,22,0.1);
  }
  .product-img-wrap {
    height: 200px; overflow: hidden;
    background: rgba(255,255,255,0.03);
    position: relative;
  }
  .product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
  .product-img.contain { object-fit: contain; padding: 20px; }
  .product-card:hover .product-img { transform: scale(1.06); }
  .product-cat-badge {
    position: absolute; top: 12px; left: 12px;
    padding: 4px 10px; border-radius: 8px;
    background: rgba(8,8,14,0.7); backdrop-filter: blur(8px);
    border: 1px solid var(--border);
    font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: var(--amber);
  }
  .product-body { padding: 20px; }
  .product-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
  .product-name { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--text); line-height: 1.2; }
  .product-price { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: var(--amber); flex-shrink: 0; }
  .product-desc { font-size: 13px; color: var(--muted); line-height: 1.6; min-height: 40px; }

  /* Add / Qty controls */
  .btn-add {
    width: 100%; margin-top: 16px;
    padding: 13px;
    background: rgba(249,115,22,0.12);
    border: 1px solid rgba(249,115,22,0.25);
    border-radius: 14px; color: var(--orange);
    font-size: 14px; font-weight: 700; cursor: pointer;
    font-family: 'Syne', sans-serif;
    transition: all 0.2s;
  }
  .btn-add:hover { background: rgba(249,115,22,0.2); border-color: rgba(249,115,22,0.5); }
  .qty-control {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 16px;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius: 14px; padding: 6px;
  }
  .qty-btn {
    width: 40px; height: 40px; border-radius: 10px;
    border: none; cursor: pointer;
    font-size: 18px; font-weight: 800;
    transition: all 0.15s;
    font-family: 'Syne', sans-serif;
  }
  .qty-btn.minus { background: rgba(255,255,255,0.06); color: var(--text); }
  .qty-btn.minus:hover { background: rgba(255,255,255,0.1); }
  .qty-btn.plus { background: linear-gradient(135deg, var(--orange), var(--amber)); color: #fff; }
  .qty-btn.plus:hover { box-shadow: 0 4px 14px rgba(249,115,22,0.4); }
  .qty-label { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); }

  /* Empty state */
  .empty-state {
    max-width: 400px; margin: 80px auto;
    text-align: center; padding: 24px;
  }
  .empty-emoji { font-size: 56px; margin-bottom: 16px; }
  .empty-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: var(--text); }
  .empty-desc { font-size: 14px; color: var(--muted); margin-top: 8px; }

  /* Floating bar */
  .floating-bar {
    position: fixed; bottom: 20px; left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    width: calc(100% - 40px); max-width: 480px;
    background: rgba(8,8,14,0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(249,115,22,0.25);
    border-radius: 20px; padding: 16px 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(249,115,22,0.1);
    cursor: pointer;
    transition: all 0.2s;
    animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .floating-bar:hover { border-color: rgba(249,115,22,0.5); transform: translateX(-50%) translateY(-2px); }
  .floating-bar-left { display: flex; align-items: center; gap: 12px; }
  .floating-count {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, var(--orange), var(--amber));
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: #fff;
  }
  .floating-label { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); }
  .floating-sub { font-size: 12px; color: var(--muted); }
  .floating-total { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--amber); }

  @keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  .product-card { animation: fadeIn 0.4s ease both; }
`;

export default function Menu() {
  const navigate = useNavigate();
  const { agregar, cambiarQty, carrito, totalItems, subtotal } = useCart();
  const mesa = localStorage.getItem("mesa") || "1";
  const categorias = useMemo(() => ["Todos", ...new Set(MENU.map((i) => i.categoria))], []);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [pedidoActivo, setPedidoActivo] = useState(() => getActiveOrder());

  useEffect(() => {
    if (!pedidoActivo) return undefined;
    const onUpdate = (p) => {
      if (p.id !== pedidoActivo.id) return;
      setPedidoActivo(saveActiveOrder(p));
    };
    socket.on("pedido-actualizado", onUpdate);
    return () => socket.off("pedido-actualizado", onUpdate);
  }, [pedidoActivo]);

  useEffect(() => {
    if (!pedidoActivo) return undefined;
    const t = getActiveOrderTimeLeft(pedidoActivo);
    if (t === null) return undefined;
    const id = window.setTimeout(() => { clearActiveOrder(); setPedidoActivo(null); }, t);
    return () => window.clearTimeout(id);
  }, [pedidoActivo]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return MENU.filter((item) => {
      const cat = categoriaActiva === "Todos" || item.categoria === categoriaActiva;
      const txt = !q || item.nombre.toLowerCase().includes(q) || item.descripcion.toLowerCase().includes(q);
      return cat && txt;
    });
  }, [busqueda, categoriaActiva]);

  const qty = (id) => carrito.find((i) => i.id === id)?.qty || 0;

  return (
    <div className="menu-shell">
      <style>{CSS}</style>

      {/* Header */}
      <header className="menu-header">
        <div className="menu-header-inner">
          <div className="brand">
            <img src={logoDonPerrito} alt="Don Perrito" className="brand-logo" />
            <div>
              <div className="brand-mesa">Mesa #{mesa}</div>
              <div className="brand-name">Don Perrito</div>
              <div className="brand-tagline">Hamburguesas & perros al momento</div>
            </div>
          </div>
          <div className="header-actions">
            {pedidoActivo && (
              <button className="btn-active" onClick={() => navigate("/confirmed")}>
                📦 Ver pedido activo
              </button>
            )}
            {totalItems > 0 && (
              <button className="btn-order" onClick={() => navigate("/cart")}>
                Pedido ({totalItems}) · {fmt(subtotal)}
              </button>
            )}
            <button className="btn-ghost" onClick={() => window.open("/admin", "_blank")}>
              Admin
            </button>
          </div>
        </div>
      </header>

      {/* Search & categories */}
      <div className="filter-bar">
        <div className="search-wrap">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="search-input"
            type="search"
            placeholder="Buscar hamburguesas, perros, bebidas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px 0" }}>
        <div className="cat-scroll">
          {categorias.map((c) => (
            <button
              key={c}
              className={`cat-pill${categoriaActiva === c ? " active" : ""}`}
              onClick={() => setCategoriaActiva(c)}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">🔍</div>
          <div className="empty-title">Sin resultados</div>
          <div className="empty-desc">Prueba otra búsqueda o categoría diferente.</div>
        </div>
      ) : (
        <div className="products-grid">
          {filtrados.map((item, i) => {
            const q = qty(item.id);
            return (
              <article key={item.id} className="product-card" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="product-img-wrap">
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className={`product-img${item.categoria === "Bebidas" ? " contain" : ""}`}
                    loading="lazy"
                  />
                  <span className="product-cat-badge">{item.categoria}</span>
                </div>
                <div className="product-body">
                  <div className="product-top">
                    <div className="product-name">{item.nombre}</div>
                    <div className="product-price">{fmt(item.precio)}</div>
                  </div>
                  <p className="product-desc">{item.descripcion}</p>
                  {q > 0 ? (
                    <div className="qty-control">
                      <button className="qty-btn minus" onClick={() => cambiarQty(item.id, -1)} aria-label="Restar">−</button>
                      <span className="qty-label">{q} en pedido</span>
                      <button className="qty-btn plus" onClick={() => agregar(item)} aria-label="Agregar">+</button>
                    </div>
                  ) : (
                    <button className="btn-add" onClick={() => agregar(item)}>+ Agregar al pedido</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Floating CTA */}
      {totalItems > 0 && (
        <div className="floating-bar" onClick={() => navigate("/cart")}>
          <div className="floating-bar-left">
            <div className="floating-count">{totalItems}</div>
            <div>
              <div className="floating-label">Ver mi pedido</div>
              <div className="floating-sub">Toca para revisar y enviar</div>
            </div>
          </div>
          <div className="floating-total">{fmt(subtotal)}</div>
        </div>
      )}
      {totalItems === 0 && pedidoActivo && (
        <div className="floating-bar" onClick={() => navigate("/confirmed")}>
          <div className="floating-bar-left">
            <div className="floating-count">📦</div>
            <div>
              <div className="floating-label">Pedido en camino</div>
              <div className="floating-sub">Toca para ver el estado</div>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      )}
    </div>
  );
}
