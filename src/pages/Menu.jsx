import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MENU } from "../data/menu";
import { useCart } from "../context/CartContext";
import { fmt } from "../utils/format";
import { socket } from "../services/socket";
import {
  clearActiveOrder, getActiveOrder, getActiveOrderTimeLeft, saveActiveOrder,
} from "../utils/activeOrder";
import logoDonPerrito from "../assets/logo-don-perrito.png";

const MENU_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

  .menu-root { font-family: 'DM Sans', sans-serif; background: #f5f0eb; min-height: 100vh; color: #1a1207; }

  /* Header */
  .menu-header {
    position: sticky; top: 0; z-index: 50;
    background: #1a1207;
    border-bottom: 1px solid rgba(234,88,12,0.2);
    box-shadow: 0 4px 30px rgba(0,0,0,0.3);
  }
  .menu-header-inner {
    max-width: 1200px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.9rem 1.5rem; gap: 1rem; flex-wrap: wrap;
  }
  .header-brand { display: flex; align-items: center; gap: 1rem; }
  .header-logo {
    width: 52px; height: 52px; border-radius: 14px; object-fit: cover;
    border: 2px solid rgba(234,88,12,0.5);
    box-shadow: 0 0 20px rgba(234,88,12,0.3);
  }
  .header-mesa {
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.15em;
    text-transform: uppercase; color: #f97316; margin-bottom: 1px;
  }
  .header-name {
    font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 900;
    color: #fff; line-height: 1;
  }
  .header-tagline { font-size: 0.72rem; color: rgba(255,255,255,0.4); margin-top: 1px; }

  .header-actions { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
  .btn-active-order {
    padding: 0.55rem 1.1rem; border-radius: 10px;
    border: 1px solid rgba(234,88,12,0.4); background: rgba(234,88,12,0.1);
    color: #fdba74; font-size: 0.78rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .btn-active-order:hover { background: rgba(234,88,12,0.2); border-color: rgba(234,88,12,0.6); }

  .btn-cart {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.55rem 1.2rem; border-radius: 10px;
    background: linear-gradient(135deg, #ea580c, #c2410c);
    color: #fff; font-size: 0.82rem; font-weight: 700;
    cursor: pointer; border: none;
    box-shadow: 0 4px 16px rgba(234,88,12,0.4);
    transition: all 0.2s; font-family: 'DM Sans', sans-serif;
    animation: cartPulse 2s ease-in-out infinite;
  }
  @keyframes cartPulse {
    0%, 100% { box-shadow: 0 4px 16px rgba(234,88,12,0.4); }
    50% { box-shadow: 0 4px 24px rgba(234,88,12,0.65); }
  }
  .btn-cart:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(234,88,12,0.5); }

  .btn-admin {
    padding: 0.55rem 1.1rem; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1); background: transparent;
    color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 500;
    cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .btn-admin:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); }

  /* Hero search strip */
  .menu-hero {
    max-width: 1200px; margin: 0 auto;
    padding: 2rem 1.5rem 0;
  }
  .hero-row {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
  }
  .hero-title {
    font-family: 'Syne', sans-serif; font-size: clamp(2.2rem, 5vw, 3.5rem);
    font-weight: 900; color: #1a1207; line-height: 1;
    letter-spacing: -0.02em;
  }
  .hero-title span { color: #ea580c; }
  .hero-sub { font-size: 0.85rem; color: #8a7460; margin-top: 0.35rem; }

  .search-wrap { position: relative; }
  .search-input {
    width: 280px; padding: 0.75rem 1rem 0.75rem 2.75rem;
    border-radius: 12px; border: 1.5px solid rgba(26,18,7,0.12);
    background: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
    outline: none; transition: all 0.2s; color: #1a1207;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .search-input:focus {
    border-color: #ea580c; box-shadow: 0 0 0 4px rgba(234,88,12,0.1);
  }
  .search-icon {
    position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%);
    color: #b8a898; pointer-events: none; font-size: 0.9rem;
  }

  /* Category tabs */
  .cat-nav {
    max-width: 1200px; margin: 0 auto;
    padding: 1.25rem 1.5rem;
    display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem;
  }
  .cat-nav::-webkit-scrollbar { display: none; }
  .cat-btn {
    flex-shrink: 0; padding: 0.55rem 1.2rem;
    border-radius: 999px; border: 1.5px solid transparent;
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .cat-btn-inactive {
    background: #fff; border-color: rgba(26,18,7,0.1); color: #5c4a38;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .cat-btn-inactive:hover { border-color: #ea580c; color: #ea580c; }
  .cat-btn-active {
    background: #1a1207; border-color: #1a1207; color: #fff;
    box-shadow: 0 4px 12px rgba(26,18,7,0.25);
  }

  /* Product grid */
  .product-grid {
    max-width: 1200px; margin: 0 auto;
    padding: 0 1.5rem 8rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
  }

  .product-card {
    background: #fff; border-radius: 20px;
    overflow: hidden; position: relative;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
    animation: fadeSlide 0.4s ease both;
  }
  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.12);
  }

  .card-img-wrap {
    position: relative; height: 200px; overflow: hidden;
    background: #fdf0e6;
  }
  .card-img {
    width: 100%; height: 100%; transition: transform 0.4s ease;
  }
  .card-img-food { object-fit: cover; }
  .card-img-drink { object-fit: contain; padding: 1.5rem; }
  .product-card:hover .card-img { transform: scale(1.06); }

  .card-cat-badge {
    position: absolute; top: 0.75rem; left: 0.75rem;
    background: rgba(26,18,7,0.75); backdrop-filter: blur(8px);
    color: #fdba74; font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    padding: 0.3rem 0.7rem; border-radius: 999px;
  }

  .card-body { padding: 1.1rem 1.25rem 1.25rem; }
  .card-name {
    font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 800;
    color: #1a1207; line-height: 1.2; margin-bottom: 0.3rem;
  }
  .card-desc {
    font-size: 0.78rem; color: #8a7460; line-height: 1.5;
    min-height: 2.4rem; margin-bottom: 0.9rem;
  }
  .card-footer { display: flex; align-items: center; justify-content: space-between; }
  .card-price {
    font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 900; color: #ea580c;
  }

  .btn-add {
    padding: 0.5rem 1.1rem; border-radius: 10px;
    background: linear-gradient(135deg, #ea580c, #c2410c);
    color: #fff; font-weight: 700; font-size: 0.8rem;
    border: none; cursor: pointer; transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 2px 8px rgba(234,88,12,0.3);
  }
  .btn-add:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(234,88,12,0.45); }

  .qty-control {
    display: flex; align-items: center; gap: 0; border-radius: 10px;
    overflow: hidden; border: 1.5px solid #f0e6d8;
  }
  .qty-btn {
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
    background: #fdf0e6; border: none; cursor: pointer;
    font-size: 1.1rem; font-weight: 700; color: #1a1207;
    transition: background 0.15s;
  }
  .qty-btn:hover { background: #ea580c; color: #fff; }
  .qty-num {
    width: 40px; text-align: center;
    font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 800;
    color: #1a1207; background: #fff;
  }

  /* Floating cart */
  .floating-cart {
    position: fixed; bottom: 1.25rem; left: 50%; transform: translateX(-50%);
    z-index: 100; width: calc(100% - 2rem); max-width: 440px;
    background: #1a1207;
    border-radius: 16px; padding: 1rem 1.5rem;
    display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(234,88,12,0.2);
    cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
    animation: floatUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
    border: none;
    font-family: 'DM Sans', sans-serif;
  }
  @keyframes floatUp {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  .floating-cart:hover { transform: translateX(-50%) translateY(-2px); box-shadow: 0 16px 48px rgba(0,0,0,0.4); }
  .fc-left { display: flex; align-items: center; gap: 0.75rem; }
  .fc-badge {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #ea580c, #c2410c);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 900; font-size: 0.85rem; color: #fff;
  }
  .fc-label {
    font-size: 0.82rem; font-weight: 600; color: rgba(255,255,255,0.7);
  }
  .fc-count {
    font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800; color: #fff;
  }
  .fc-price {
    font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 900; color: #f97316;
  }

  .empty-state {
    max-width: 400px; margin: 4rem auto; text-align: center; padding: 1rem;
  }
  .empty-emoji { font-size: 3rem; margin-bottom: 1rem; }
  .empty-title {
    font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 900; color: #1a1207;
  }
  .empty-sub { font-size: 0.85rem; color: #8a7460; margin-top: 0.5rem; }
`;

export default function Menu() {
  const navigate = useNavigate();
  const { agregar, cambiarQty, carrito, totalItems, subtotal } = useCart();
  const mesa = localStorage.getItem("mesa") || "1";

  const categorias = useMemo(() => ["Todos", ...new Set(MENU.map((item) => item.categoria))], []);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [pedidoActivo, setPedidoActivo] = useState(() => getActiveOrder());

  useEffect(() => {
    if (!pedidoActivo) return undefined;
    const onActualizado = (p) => {
      if (p.id !== pedidoActivo.id) return;
      setPedidoActivo(saveActiveOrder(p));
    };
    socket.on("pedido-actualizado", onActualizado);
    return () => socket.off("pedido-actualizado", onActualizado);
  }, [pedidoActivo]);

  useEffect(() => {
    if (!pedidoActivo) return undefined;
    const timeLeft = getActiveOrderTimeLeft(pedidoActivo);
    if (timeLeft === null) return undefined;
    const timeout = window.setTimeout(() => { clearActiveOrder(); setPedidoActivo(null); }, timeLeft);
    return () => window.clearTimeout(timeout);
  }, [pedidoActivo]);

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return MENU.filter((item) => {
      const coincideCategoria = categoriaActiva === "Todos" || item.categoria === categoriaActiva;
      const coincideBusqueda = termino === "" ||
        item.nombre.toLowerCase().includes(termino) ||
        item.descripcion.toLowerCase().includes(termino);
      return coincideCategoria && coincideBusqueda;
    });
  }, [busqueda, categoriaActiva]);

  const cantidadEnCarrito = (id) => carrito.find((item) => item.id === id)?.qty || 0;

  return (
    <>
      <style>{MENU_STYLES}</style>
      <div className="menu-root">
        <header className="menu-header">
          <div className="menu-header-inner">
            <div className="header-brand">
              <img src={logoDonPerrito} alt="Don Perrito" className="header-logo" />
              <div>
                <p className="header-mesa">Mesa #{mesa}</p>
                <h1 className="header-name">Don Perrito</h1>
                <p className="header-tagline">Hamburguesas · Perros · Antojos</p>
              </div>
            </div>
            <div className="header-actions">
              {pedidoActivo && (
                <button className="btn-active-order" onClick={() => navigate("/confirmed")}>
                  📦 Pedido activo
                </button>
              )}
              {totalItems > 0 && (
                <button className="btn-cart" onClick={() => navigate("/cart")}>
                  🛒 {totalItems} · {fmt(subtotal)}
                </button>
              )}
              <button className="btn-admin" onClick={() => window.open("/admin", "_blank")}>
                Admin
              </button>
            </div>
          </div>
        </header>

        <div className="menu-hero">
          <div className="hero-row">
            <div>
              <h2 className="hero-title">Lo que más<br /><span>te antoja</span> 🔥</h2>
              <p className="hero-sub">Elige tus productos y arma tu pedido desde la mesa.</p>
            </div>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="search"
                className="search-input"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar en el menú..."
              />
            </div>
          </div>
        </div>

        <nav className="cat-nav">
          {categorias.map((cat) => (
            <button
              key={cat}
              className={`cat-btn ${categoriaActiva === cat ? "cat-btn-active" : "cat-btn-inactive"}`}
              onClick={() => setCategoriaActiva(cat)}
            >
              {cat}
            </button>
          ))}
        </nav>

        {productosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">🍔</div>
            <p className="empty-title">No encontramos productos</p>
            <p className="empty-sub">Prueba otra búsqueda o cambia de categoría.</p>
          </div>
        ) : (
          <div className="product-grid">
            {productosFiltrados.map((item, i) => {
              const qty = cantidadEnCarrito(item.id);
              return (
                <article
                  key={item.id}
                  className="product-card"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="card-img-wrap">
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      loading="lazy"
                      className={`card-img ${item.categoria === "Bebidas" ? "card-img-drink" : "card-img-food"}`}
                    />
                    <span className="card-cat-badge">{item.categoria}</span>
                  </div>
                  <div className="card-body">
                    <h3 className="card-name">{item.nombre}</h3>
                    <p className="card-desc">{item.descripcion}</p>
                    <div className="card-footer">
                      <span className="card-price">{fmt(item.precio)}</span>
                      {qty > 0 ? (
                        <div className="qty-control">
                          <button className="qty-btn" onClick={() => cambiarQty(item.id, -1)}>−</button>
                          <span className="qty-num">{qty}</span>
                          <button className="qty-btn" onClick={() => agregar(item)}>+</button>
                        </div>
                      ) : (
                        <button className="btn-add" onClick={() => agregar(item)}>Agregar +</button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {totalItems > 0 && (
          <button className="floating-cart" onClick={() => navigate("/cart")}>
            <div className="fc-left">
              <div className="fc-badge">{totalItems}</div>
              <div>
                <div className="fc-label">Ver pedido</div>
                <div className="fc-count">{totalItems} producto{totalItems !== 1 ? "s" : ""}</div>
              </div>
            </div>
            <div className="fc-price">{fmt(subtotal)} →</div>
          </button>
        )}

        {totalItems === 0 && pedidoActivo && (
          <button className="floating-cart" onClick={() => navigate("/confirmed")}>
            <div className="fc-left">
              <div className="fc-badge">📦</div>
              <div>
                <div className="fc-label">Seguimiento</div>
                <div className="fc-count">Volver a mi pedido</div>
              </div>
            </div>
            <div className="fc-price">Ver →</div>
          </button>
        )}
      </div>
    </>
  );
}
