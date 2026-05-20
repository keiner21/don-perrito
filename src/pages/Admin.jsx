import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { socket } from "../services/socket";
import { fmt } from "../utils/format";

const ESTADOS = ["Pendiente", "Preparando", "Listo"];

const ESTADO_CFG = {
  Pendiente: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", icon: "⏳", dot: "#f59e0b" },
  Preparando: { color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.25)", icon: "🔥", dot: "#f97316" },
  Listo: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.25)", icon: "✅", dot: "#22c55e" },
};

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
  .admin-shell { min-height: 100vh; background: var(--bg); }

  /* Header */
  .admin-header {
    position: sticky; top: 0; z-index: 50;
    background: rgba(8,8,14,0.9); backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  }
  .admin-logo-row { display: flex; align-items: center; gap: 12px; }
  .admin-dot { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; animation: blink 2s ease-in-out infinite; }
  .admin-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--text); }
  .admin-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .logout-btn {
    padding: 10px 20px; border-radius: 12px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--muted); font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: all 0.2s;
  }
  .logout-btn:hover { color: var(--text); border-color: rgba(255,255,255,0.15); }

  /* Stats bar */
  .stats-bar { display: flex; gap: 12px; padding: 20px 24px; flex-wrap: wrap; }
  .stat-chip {
    display: flex; align-items: center; gap: 10px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 14px 18px;
    flex: 1; min-width: 140px;
  }
  .stat-icon { font-size: 22px; }
  .stat-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--text); line-height: 1; }
  .stat-lbl { font-size: 11px; color: var(--muted); margin-top: 2px; letter-spacing: 0.5px; }

  /* Filter tabs */
  .filter-tabs { display: flex; gap: 8px; padding: 0 24px 20px; overflow-x: auto; }
  .filter-tabs::-webkit-scrollbar { display: none; }
  .tab-btn {
    flex-shrink: 0; padding: 9px 20px; border-radius: 100px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--muted); font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: all 0.2s;
    display: flex; align-items: center; gap: 7px;
  }
  .tab-btn:hover { color: var(--text); }
  .tab-btn.active { background: var(--text); color: #08080e; border-color: transparent; }
  .tab-count {
    min-width: 20px; height: 20px; border-radius: 100px;
    background: rgba(0,0,0,0.15); color: inherit;
    font-size: 11px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    padding: 0 5px;
  }

  /* Orders grid */
  .orders-grid { display: grid; gap: 16px; padding: 0 24px 40px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }

  /* Order card */
  .order-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 24px; overflow: hidden;
    animation: slideIn 0.3s ease both;
    transition: border-color 0.2s;
  }
  .order-card:hover { border-color: rgba(255,255,255,0.12); }
  .order-card-top {
    padding: 18px 18px 14px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .order-num-block { display: flex; align-items: center; gap: 10px; }
  .order-num {
    font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--text);
  }
  .mesa-badge {
    padding: 4px 10px; border-radius: 8px;
    background: rgba(255,255,255,0.06); border: 1px solid var(--border);
    font-size: 11px; font-weight: 700; color: var(--muted);
  }
  .estado-badge {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 100px;
    font-size: 12px; font-weight: 700; letter-spacing: 0.3px;
  }
  .estado-dot { width: 6px; height: 6px; border-radius: 50%; }

  .order-meta { padding: 4px 18px 14px; display: flex; gap: 16px; flex-wrap: wrap; }
  .order-meta-item { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 4px; }

  .order-items { padding: 0 18px 14px; display: flex; flex-direction: column; gap: 6px; border-bottom: 1px solid var(--border); }
  .order-item-row { display: flex; justify-content: space-between; align-items: center; }
  .order-item-name { font-size: 13px; color: var(--text); font-weight: 500; }
  .order-item-price { font-size: 13px; color: var(--amber); font-weight: 700; }

  .order-footer { padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .order-total { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--amber); }
  .order-total-lbl { font-size: 11px; color: var(--muted); }

  /* State controls */
  .state-controls { display: flex; gap: 6px; flex-wrap: wrap; }
  .state-btn {
    padding: 7px 14px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--muted); font-size: 12px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: all 0.2s;
  }
  .state-btn:hover { color: var(--text); border-color: rgba(255,255,255,0.15); }
  .state-btn.current { color: var(--text); border-color: rgba(255,255,255,0.2); background: var(--surface2); cursor: default; }

  /* Empty */
  .empty-orders { text-align: center; padding: 80px 24px; }
  .empty-orders-icon { font-size: 56px; margin-bottom: 16px; }
  .empty-orders-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: var(--text); }
  .empty-orders-desc { font-size: 14px; color: var(--muted); margin-top: 8px; }

  /* Loading */
  .loading-shell { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px; }
  .loading-spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--amber); border-radius: 50%; animation: spin 0.8s linear infinite; }
  .loading-text { font-size: 14px; color: var(--muted); }

  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
`;

export default function Admin() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("Todos");
  const [error, setError] = useState("");

  const cargarPedidos = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }
      const r = await api.get("/pedidos");
      setPedidos(r.data);
    } catch (e) {
      if (e.response?.status === 401) navigate("/login");
      else setError("Error cargando pedidos.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { cargarPedidos(); }, [cargarPedidos]);

  useEffect(() => {
    const onNew = (p) => setPedidos((prev) => [p, ...prev.filter((x) => x.id !== p.id)]);
    const onUpdate = (p) => setPedidos((prev) => prev.map((x) => x.id === p.id ? p : x));
    socket.on("nuevo-pedido", onNew);
    socket.on("pedido-actualizado", onUpdate);
    return () => { socket.off("nuevo-pedido", onNew); socket.off("pedido-actualizado", onUpdate); };
  }, []);

  const cambiarEstado = async (id, estado) => {
    try {
      await api.patch(`/pedidos/${id}`, { estado });
      setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, estado } : p));
    } catch { setError("Error actualizando estado."); }
  };

  const logout = () => { localStorage.removeItem("token"); navigate("/login"); };

  const filtrados = pedidos.filter((p) => filtro === "Todos" || p.estado === filtro);
  const counts = ESTADOS.reduce((a, e) => ({ ...a, [e]: pedidos.filter((p) => p.estado === e).length }), {});
  const ventas = pedidos.reduce((a, p) => a + (p.total || 0), 0);

  if (loading) {
    return (
      <div className="loading-shell">
        <style>{CSS}</style>
        <div className="loading-spinner" />
        <div className="loading-text">Cargando pedidos...</div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <style>{CSS}</style>

      {/* Header */}
      <header className="admin-header">
        <div className="admin-logo-row">
          <div className="admin-dot" />
          <div>
            <div className="admin-title">Panel Admin · Don Perrito</div>
            <div className="admin-sub">Gestión de pedidos en tiempo real</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="logout-btn" onClick={() => navigate("/qr")}>🗺 Ver QRs</button>
          <button className="logout-btn" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-chip">
          <span className="stat-icon">📋</span>
          <div>
            <div className="stat-val">{pedidos.length}</div>
            <div className="stat-lbl">Total pedidos</div>
          </div>
        </div>
        <div className="stat-chip" style={{ borderColor: "rgba(245,158,11,0.2)" }}>
          <span className="stat-icon">⏳</span>
          <div>
            <div className="stat-val" style={{ color: "#f59e0b" }}>{counts.Pendiente || 0}</div>
            <div className="stat-lbl">Pendientes</div>
          </div>
        </div>
        <div className="stat-chip" style={{ borderColor: "rgba(249,115,22,0.2)" }}>
          <span className="stat-icon">🔥</span>
          <div>
            <div className="stat-val" style={{ color: "#f97316" }}>{counts.Preparando || 0}</div>
            <div className="stat-lbl">Preparando</div>
          </div>
        </div>
        <div className="stat-chip" style={{ borderColor: "rgba(34,197,94,0.2)" }}>
          <span className="stat-icon">✅</span>
          <div>
            <div className="stat-val" style={{ color: "#22c55e" }}>{counts.Listo || 0}</div>
            <div className="stat-lbl">Listos</div>
          </div>
        </div>
        <div className="stat-chip" style={{ borderColor: "rgba(245,158,11,0.2)" }}>
          <span className="stat-icon">💰</span>
          <div>
            <div className="stat-val" style={{ color: "#f59e0b", fontSize: "16px" }}>{fmt(ventas)}</div>
            <div className="stat-lbl">Ventas totales</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {["Todos", ...ESTADOS].map((e) => (
          <button key={e} className={`tab-btn${filtro === e ? " active" : ""}`} onClick={() => setFiltro(e)}>
            {e === "Todos" ? "📋" : ESTADO_CFG[e]?.icon} {e}
            <span className="tab-count">{e === "Todos" ? pedidos.length : (counts[e] || 0)}</span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ margin: "0 24px 16px", padding: "12px 16px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "12px", fontSize: "13px", color: "#ff6b6b" }}>
          {error}
        </div>
      )}

      {/* Orders */}
      {filtrados.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-orders-icon">📭</div>
          <div className="empty-orders-title">Sin pedidos {filtro !== "Todos" ? `"${filtro}"` : ""}</div>
          <div className="empty-orders-desc">Los nuevos pedidos aparecerán aquí automáticamente.</div>
        </div>
      ) : (
        <div className="orders-grid">
          {filtrados.map((p, i) => {
            const cfg = ESTADO_CFG[p.estado] || ESTADO_CFG.Pendiente;
            return (
              <div key={p.id} className="order-card" style={{ animationDelay: `${i * 40}ms`, borderColor: `${cfg.border}` }}>
                {/* Top */}
                <div className="order-card-top">
                  <div className="order-num-block">
                    <span className="order-num">#{p.numero}</span>
                    <span className="mesa-badge">Mesa {p.mesa}</span>
                  </div>
                  <div className="estado-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    <span className="estado-dot" style={{ background: cfg.dot }} />
                    {p.estado}
                  </div>
                </div>

                {/* Meta */}
                <div className="order-meta">
                  <span className="order-meta-item">🕐 {new Date(p.fecha).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>
                  {p.metodo && <span className="order-meta-item">💳 {p.metodo}</span>}
                </div>

                {/* Items */}
                <div className="order-items">
                  {(p.items || []).map((item) => (
                    <div key={item.id} className="order-item-row">
                      <span className="order-item-name">{item.qty}× {item.nombre}</span>
                      <span className="order-item-price">{fmt(item.precio * item.qty)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="order-footer">
                  <div>
                    <div className="order-total-lbl">Total</div>
                    <div className="order-total">{fmt(p.total)}</div>
                  </div>
                  <div className="state-controls">
                    {ESTADOS.map((e) => (
                      <button
                        key={e}
                        className={`state-btn${p.estado === e ? " current" : ""}`}
                        onClick={() => p.estado !== e && cambiarEstado(p.id, e)}
                        style={p.estado === e ? { borderColor: ESTADO_CFG[e].border, color: ESTADO_CFG[e].color, background: ESTADO_CFG[e].bg } : {}}
                      >
                        {ESTADO_CFG[e].icon} {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
