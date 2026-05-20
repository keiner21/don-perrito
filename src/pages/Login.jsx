import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import logoDonPerrito from "../assets/logo-don-perrito.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState("");

  const login = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setLoading(true);
      const res = await api.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/admin");
    } catch {
      setError("Credenciales inválidas. Revisa tu correo y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.shell}>
      {/* Ambient blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      {/* Grid overlay */}
      <div style={styles.grid} />

      <form onSubmit={login} style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoRing}>
            <img src={logoDonPerrito} alt="Don Perrito" style={styles.logo} />
          </div>
          <div style={styles.logoPulse} />
        </div>

        <div style={styles.titleBlock}>
          <span style={styles.eyebrow}>Panel Administrativo</span>
          <h1 style={styles.title}>Don Perrito</h1>
          <p style={styles.subtitle}>Accede para gestionar pedidos y ventas</p>
        </div>

        {/* Email */}
        <div style={styles.fieldWrap}>
          <label style={styles.label}>Correo electrónico</label>
          <div style={{
            ...styles.inputWrap,
            ...(focused === "email" ? styles.inputWrapFocused : {}),
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.inputIcon}>
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <input
              type="email"
              placeholder="admin@donperrito.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused("")}
              required
              style={styles.input}
            />
          </div>
        </div>

        {/* Password */}
        <div style={styles.fieldWrap}>
          <label style={styles.label}>Contraseña</label>
          <div style={{
            ...styles.inputWrap,
            ...(focused === "password" ? styles.inputWrapFocused : {}),
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.inputIcon}>
              <rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="16" r="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused("")}
              required
              style={styles.input}
            />
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          onMouseEnter={e => !loading && (e.target.style.transform = "translateY(-2px)")}
          onMouseLeave={e => (e.target.style.transform = "translateY(0)")}
        >
          {loading ? (
            <span style={styles.btnContent}>
              <span style={styles.spinner} /> Ingresando...
            </span>
          ) : (
            <span style={styles.btnContent}>
              Ingresar al panel
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          )}
        </button>

        <p style={styles.backLink} onClick={() => navigate("/")}>
          ← Volver al menú
        </p>
      </form>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes blob { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-50px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(0.9)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.15);opacity:0.3} }
      `}</style>
    </div>
  );
}

const styles = {
  shell: {
    minHeight: "100vh",
    background: "#0a0a0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute", top: "-20%", left: "-10%",
    width: "600px", height: "600px",
    background: "radial-gradient(circle, rgba(251,146,60,0.15) 0%, transparent 70%)",
    borderRadius: "50%",
    animation: "blob 8s ease-in-out infinite",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute", bottom: "-20%", right: "-10%",
    width: "500px", height: "500px",
    background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)",
    borderRadius: "50%",
    animation: "blob 10s ease-in-out infinite reverse",
    pointerEvents: "none",
  },
  blob3: {
    position: "absolute", top: "50%", left: "50%",
    width: "300px", height: "300px",
    background: "radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)",
    borderRadius: "50%",
    transform: "translate(-50%,-50%)",
    animation: "blob 6s ease-in-out infinite",
    pointerEvents: "none",
  },
  grid: {
    position: "absolute", inset: 0,
    backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
    backgroundSize: "60px 60px",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: "420px",
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "28px",
    padding: "40px 36px",
    animation: "fadeUp 0.6s ease both",
    boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
  },
  logoWrap: { display: "flex", justifyContent: "center", marginBottom: "28px", position: "relative" },
  logoRing: {
    width: "88px", height: "88px",
    borderRadius: "24px",
    padding: "4px",
    background: "linear-gradient(135deg, #f97316, #f59e0b)",
    boxShadow: "0 0 40px rgba(249,115,22,0.4)",
  },
  logo: { width: "100%", height: "100%", borderRadius: "20px", objectFit: "cover" },
  logoPulse: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    width: "100px", height: "100px",
    borderRadius: "28px",
    border: "2px solid rgba(249,115,22,0.3)",
    animation: "pulse 2s ease-in-out infinite",
  },
  titleBlock: { textAlign: "center", marginBottom: "32px" },
  eyebrow: { fontSize: "11px", fontWeight: "600", letterSpacing: "3px", textTransform: "uppercase", color: "#f97316" },
  title: { fontFamily: "'Syne', sans-serif", fontSize: "32px", fontWeight: "800", color: "#fff", marginTop: "6px", lineHeight: 1.1 },
  subtitle: { fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "8px" },
  fieldWrap: { marginBottom: "16px" },
  label: { display: "block", fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px", marginBottom: "8px", textTransform: "uppercase" },
  inputWrap: {
    display: "flex", alignItems: "center", gap: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px", padding: "0 16px",
    transition: "all 0.2s ease",
  },
  inputWrapFocused: {
    border: "1px solid rgba(249,115,22,0.5)",
    background: "rgba(249,115,22,0.05)",
    boxShadow: "0 0 0 4px rgba(249,115,22,0.1)",
  },
  inputIcon: { color: "rgba(255,255,255,0.3)", flexShrink: 0 },
  input: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    padding: "14px 0",
    fontSize: "15px", color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
  },
  errorBox: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.2)",
    borderRadius: "12px", padding: "12px 16px",
    fontSize: "13px", color: "#ff6b6b",
    marginBottom: "16px",
  },
  btn: {
    width: "100%", marginTop: "8px",
    background: "linear-gradient(135deg, #f97316, #f59e0b)",
    border: "none", borderRadius: "16px",
    padding: "16px",
    cursor: "pointer",
    fontSize: "15px", fontWeight: "700",
    color: "#fff", fontFamily: "'Syne', sans-serif",
    transition: "all 0.2s ease",
    boxShadow: "0 8px 24px rgba(249,115,22,0.35)",
  },
  btnDisabled: { background: "rgba(255,255,255,0.1)", boxShadow: "none", cursor: "not-allowed" },
  btnContent: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  spinner: {
    width: "16px", height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },
  backLink: {
    textAlign: "center", marginTop: "20px",
    fontSize: "13px", color: "rgba(255,255,255,0.3)",
    cursor: "pointer",
    transition: "color 0.2s",
  },
};
