cat > /mnt/user-data/outputs/Menu.jsx << 'ENDOFFILE'
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MENU } from "../data/menu";
import { useCart } from "../context/CartContext";
import { fmt } from "../utils/format";
import { socket } from "../services/socket";
import { clearActiveOrder, getActiveOrder, getActiveOrderTimeLeft, saveActiveOrder } from "../utils/activeOrder";
import logoDonPerrito from "../assets/logo-don-perrito.png";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #07070f;
    --surface: rgba(255,255,255,0.03);
    --surface2: rgba(255,255,255,0.055);
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
  .menu-shell { min-height: 100vh; background: var(--bg); }

  /* ── HEADER ── */
  .menu-header {
    position: sticky; top: 0; z-index: 50;
    background: rgba(7,7,15,0.8);
    backdrop-filter: blur(24px) saturate(180%);
    border-bottom: 1px solid var(--border);
  }
  .menu-header-inner {
    max-width: 1280px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px; gap: 16px; flex-wrap: wrap;
  }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand-logo-ring {
    width: 52px; height: 52px; border-radius: 16px;
    background: linear-gradient(135deg, var(--orange), var(--amber));
    padding: 2px; flex-shrink: 0;
    box-shadow: 0 0 20px rgba(249,115,22,0.35);
  }
  .brand-logo { width: 100%; height: 100%; border-radius: 14px; object-fit: cover; display: block; }
  .brand-mesa { font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--orange); }
  .brand-name { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--text); line-height: 1.1; }
  .brand-tagline { font-size: 11px; color: var(--muted); margin-top: 2px; }

  .header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .hbtn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 16px; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.2s; white-space: nowrap;
  }
  .hbtn-ghost { background: var(--surface); border: 1px solid var(--border); color: var(--muted); }
  .hbtn-ghost:hover { color: var(--text); border-color: var(--border2); }
  .hbtn-active { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25); color: var(--amber); }
  .hbtn-active:hover { background: rgba(245,158,11,0.18); }
  .hbtn-cart {
    background: linear-gradient(135deg, var(--orange), var(--amber));
    color: #fff; font-family: 'Syne', sans-serif; font-weight: 700;
    box-shadow: 0 4px 16px rgba(249,115,22,0.35);
  }
  .hbtn-cart:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(249,115,22,0.5); }
  .cart-count-badge {
    background: rgba(255,255,255,0.25); border-radius: 100px;
    padding: 1px 8px; font-size: 12px; font-weight: 800;
  }

  /* ── HERO BAND ── */
  .hero-band {
    max-width: 1280px; margin: 0 auto;
    padding: 32px 24px 0;
  }
  .hero-title { font-family: 'Syne', sans-serif; font-size: clamp(28px, 4vw, 44px); font-weight: 800; color: var(--text); line-height: 1.1; }
  .hero-title span { background: linear-gradient(135deg, var(--orange), var(--amber)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .hero-sub { font-size: 15px; color: var(--muted); margin-top: 8px; }

  /* ── FILTER BAR ── */
  .filter-bar {
    max-width: 1280px; margin: 0 auto;
    padding: 24px 24px 0;
    display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
  }
  .search-wrap { position: relative; flex: 1; min-width: 220px; }
  .search-icon-svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
  .search-input {
    width: 100%; background: var(--surface2);
    border: 1px solid var(--border); border-radius: 14px;
    padding: 12px 16px 12px 42px;
    font-size: 14px; color: var(--text); outline: none;
    font-family: 'DM Sans', sans-serif; transition: all 0.2s;
  }
  .search-input::placeholder { color: var(--muted); }
  .search-input:focus { border-color: rgba(249,115,22,0.4); box-shadow: 0 0 0 3px rgba(249,115,22,0.08); }

  /* ── CATEGORY PILLS ── */
  .cats-wrap { max-width: 1280px; margin: 0 auto; padding: 16px 24px 0; }
  .cat-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
  .cat-scroll::-webkit-scrollbar { display: none; }
  .cat-pill {
    flex-shrink: 0; display: flex; align-items: center; gap: 6px;
    padding: 8px 18px; border-radius: 100px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--muted); font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: all 0.2s;
  }
  .cat-pill:hover { color: var(--text); border-color: var(--border2); }
  .cat-pill.active {
    background: linear-gradient(135deg, rgba(249,115,22,0.15), rgba(245,158,11,0.1));
    border-color: rgba(249,115,22,0.4); color: var(--orange);
  }
  .cat-count { font-size: 11px; opacity: 0.6; }

  /* ── RESULTS LABEL ── */
  .results-label { max-width: 1280px; margin: 0 auto; padding: 20px 24px 0; font-size: 12px; color: var(--muted); font-weight: 600; letter-spacing: 0.5px; }

  /* ── PRODUCTS GRID ── */
  .products-grid {
    max-width: 1280px; margin: 0 auto;
    padding: 16px 24px 160px;
    display: grid; gap: 18px;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  }

  /* ── PRODUCT CARD ── */
  .product-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px; overflow: hidden;
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    position: relative;
    animation: fadeInCard 0.4s ease both;
  }
  .product-card:hover {
    transform: translateY(-5px);
    border-color: rgba(249,115,22,0.25);
    box-shadow: 0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(249,115,22,0.12);
  }
  .product-img-wrap {
    height: 195px; overflow: hidden;
    background: rgba(255,255,255,0.02);
    position: relative;
  }
  .product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
  .product-img.contain { object-fit: contain; padding: 20px; }
  .product-card:hover .product-img { transform: scale(1.07); }

  .product-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(7,7,15,0.7) 0%, transparent 50%);
    pointer-events: none;
  }
  .product-cat-badge {
    position: absolute; top: 12px; left: 12px;
    padding: 4px 10px; border-radius: 8px;
    background: rgba(7,7,15,0.75); backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: var(--amber);
  }
  .product-price-tag {
    position: absolute; bottom: 12px; right: 12px;
    font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800;
    color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.6);
  }

  .product-body { padding: 18px 18px 16px; }
  .product-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: var(--text); line-height: 1.2; margin-bottom: 6px; }
  .product-desc { font-size: 12.5px; color: var(--muted); line-height: 1.65; min-height: 38px; }

  /* ── ADD / QTY CONTROLS ── */
  .btn-add {
    width: 100%; margin-top: 14px;
    padding: 12px; border-radius: 13px;
    background: rgba(249,115,22,0.1);
    border: 1px solid rgba(249,115,22,0.22);
    color: var(--orange); font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: 'Syne', sans-serif; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .btn-add:hover { background: rgba(249,115,22,0.18); border-color: rgba(249,115,22,0.45); transform: translateY(-1px); }

  .qty-control {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(249,115,22,0.2);
    border-radius: 13px; padding: 5px;
  }
  .qty-btn {
    width: 38px; height: 38px; border-radius: 9px;
    border: none; cursor: pointer;
    font-size: 18px; font-weight: 800;
    transition: all 0.15s; font-family: 'Syne', sans-serif;
  }
  .qty-btn.minus { background: rgba(255,255,255,0.06); color: var(--text); }
  .qty-btn.minus:hover { background: rgba(255,255,255,0.1); }
  .qty-btn.plus { background: linear-gradient(135deg, var(--orange), var(--amber)); color: #fff; }
  .qty-btn.plus:hover { box-shadow: 0 4px 12px rgba(249,115,22,0.4); }
  .qty-label { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--text); }
  .qty-sub { font-size: 11px; color: var(--muted); text-align: center; margin-top: 3px; }

  /* ── EMPTY ── */
  .empty-state { max-width: 400px; margin: 80px auto; text-align: center; padding: 24px; }
  .empty-emoji { font-size: 52px; margin-bottom: 14px; }
  .empty-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--text); }
  .empty-desc { font-size: 14px; color: var(--muted); margin-top: 8px; line-height: 1.6; }

  /* ── FLOATING BAR ── */
  .floating-bar {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    min-width: 320px; max-width: 520px; width: calc(100% - 48px);
    background: rgba(15,15,26,0.92); backdrop-filter: blur(24px);
    border: 1px solid rgba(249,115,22,0.3);
    border-radius: 20px; padding: 12px 16px;
    display: flex; align-items: center; justify-content: space-between;
    cursor: pointer; z-index: 100;
    box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.1);
    transition: all 0.2s;
    animation: slideUpBar 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .floating-bar:hover { transform: translateX(-50%) translateY(-2px); box-shadow: 0 12px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(249,115,22,0.2); }
  .floating-bar-left { display: flex; align-items: center; gap: 12px; }
  .floating-count {
    width: 38px; height: 38px; border-radius: 11px;
    background: linear-gradient(135deg, var(--orange), var(--amber));
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800; color: #fff;
    flex-shrink: 0;
  }
  .floating-label { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--text); }
  .floating-sub { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .floating-total { font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 800; color: var(--amber); }
  .floating-arrow { color: var(--amber); flex-shrink: 0; }

  /* ── STATUS TOAST (pedido activo) ── */
  .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--amber); animation: pulse-dot 1.5s ease-in-out infinite; margin-right: 6px; }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

  @keyframes slideUpBar { from { opacity:0; transform:translateX(-50%) translateY(24px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
  @keyframes fadeInCard { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
`;

const CAT_EMOJIS = { Todos: "🍽️", Hamburguesas: "🍔", "Perros calientes": "🌭", Bebidas: "🥤", Combos: "🎁", Snacks: "🍟", Postres: "🍦" };

export default function Menu() {
  const navigate = useNavigate();
  const { agregar, cambiarQty, carrito, totalItems, subtotal } = useCart();
  const mesa = localStorage.getItem("mesa") || "1";
  const categorias = useMemo(() => ["Todos", ...new Set(MENU.map((i) => i.categoria))], []);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [pedidoActivo, setPedidoActivo] = useState(() => getActiveOrder());

  useEffect(() => {
    if (!pedidoActivo) return;
    const onUpdate = (p) => { if (p.id !== pedidoActivo.id) return; setPedidoActivo(saveActiveOrder(p)); };
    socket.on("pedido-actualizado", onUpdate);
    return () => socket.off("pedido-actualizado", onUpdate);
  }, [pedidoActivo]);

  useEffect(() => {
    if (!pedidoActivo) return;
    const t = getActiveOrderTimeLeft(pedidoActivo);
    if (t === null) return;
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

  const catCount = (c) => c === "Todos" ? MENU.length : MENU.filter((i) => i.categoria === c).length;
  const qty = (id) => carrito.find((i) => i.id === id)?.qty || 0;

  return (
    <div className="menu-shell">
      <style>{CSS}</style>

      {/* Header */}
      <header className="menu-header">
        <div className="menu-header-inner">
          <div className="brand">
            <div className="brand-logo-ring">
              <img src={logoDonPerrito} alt="Don Perrito" className="brand-logo" />
            </div>
            <div>
              <div className="brand-mesa">Mesa #{mesa}</div>
              <div className="brand-name">Don Perrito</div>
              <div className="brand-tagline">Hamburguesas & perros al momento</div>
            </div>
          </div>
          <div className="header-actions">
            {pedidoActivo && (
              <button className="hbtn hbtn-active" onClick={() => navigate("/confirmed")}>
                <span className="status-dot" />
                Pedido activo
              </button>
            )}
            {totalItems > 0 && (
              <button className="hbtn hbtn-cart" onClick={() => navigate("/cart")}>
                🛒 Mi pedido
                <span className="cart-count-badge">{totalItems}</span>
                · {fmt(subtotal)}
              </button>
            )}
            <button className="hbtn hbtn-ghost" onClick={() => window.open("/admin", "_blank")}>⚙ Admin</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="hero-band">
        <div className="hero-title">El menú de hoy,<br /><span>a tu manera</span></div>
        <div className="hero-sub">Pide desde tu mesa · Sin esperas · Sin colas</div>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <div className="search-wrap">
          <svg className="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="search-input"
            type="search"
            placeholder="Buscar hamburguesas, perros, bebidas…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="cats-wrap">
        <div className="cat-scroll">
          {categorias.map((c) => (
            <button key={c} className={`cat-pill${categoriaActiva === c ? " active" : ""}`} onClick={() => setCategoriaActiva(c)}>
              {CAT_EMOJIS[c] || "•"} {c}
              <span className="cat-count">{catCount(c)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results label */}
      <div className="results-label">
        {filtrados.length} {filtrados.length === 1 ? "producto" : "productos"}{categoriaActiva !== "Todos" ? ` en ${categoriaActiva}` : ""}
      </div>

      {/* Grid */}
      {filtrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">🔍</div>
          <div className="empty-title">Sin resultados</div>
          <div className="empty-desc">Prueba otra búsqueda o elige una categoría diferente.</div>
        </div>
      ) : (
        <div className="products-grid">
          {filtrados.map((item, i) => {
            const q = qty(item.id);
            return (
              <article key={item.id} className="product-card" style={{ animationDelay: `${i * 35}ms` }}>
                <div className="product-img-wrap">
                  <img src={item.imagen} alt={item.nombre} className={`product-img${item.categoria === "Bebidas" ? " contain" : ""}`} loading="lazy" />
                  <div className="product-overlay" />
                  <span className="product-cat-badge">{item.categoria}</span>
                  <span className="product-price-tag">{fmt(item.precio)}</span>
                </div>
                <div className="product-body">
                  <div className="product-name">{item.nombre}</div>
                  <p className="product-desc">{item.descripcion}</p>
                  {q > 0 ? (
                    <>
                      <div className="qty-control">
                        <button className="qty-btn minus" onClick={() => cambiarQty(item.id, -1)}>−</button>
                        <span className="qty-label">{q}</span>
                        <button className="qty-btn plus" onClick={() => agregar(item)}>+</button>
                      </div>
                      <div className="qty-sub">{q} {q === 1 ? "unidad" : "unidades"} · {fmt(item.precio * q)}</div>
                    </>
                  ) : (
                    <button className="btn-add" onClick={() => agregar(item)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                      Agregar al pedido
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Floating bar */}
      {totalItems > 0 && (
        <div className="floating-bar" onClick={() => navigate("/cart")}>
          <div className="floating-bar-left">
            <div className="floating-count">{totalItems}</div>
            <div>
              <div className="floating-label">Ver mi pedido</div>
              <div className="floating-sub">Toca para revisar y enviar</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div className="floating-total">{fmt(subtotal)}</div>
            <svg className="floating-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      )}
      {totalItems === 0 && pedidoActivo && (
        <div className="floating-bar" onClick={() => navigate("/confirmed")}>
          <div className="floating-bar-left">
            <div className="floating-count">📦</div>
            <div>
              <div className="floating-label">Pedido #{pedidoActivo.numero} activo</div>
              <div className="floating-sub"><span className="status-dot" />Estado: {pedidoActivo.estado}</div>
            </div>
          </div>
          <svg className="floating-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      )}
    </div>
  );
}
ENDOFFILE

