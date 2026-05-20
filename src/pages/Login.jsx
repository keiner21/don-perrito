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

  const inputWrapStyle = (name) => ({
    ...styles.inputWrap,
    ...(focused === name ? styles.inputWrapFocused : {}),
  });

  return (
    <div style={styles.shell}>
      {/* Ambient blobs */}
      <div style={styles.blob1} aria-hidden="true" />
      <div style={styles.blob2} aria-hidden="true" />
      <div style={styles.blob3} aria-hidden="true" />
      <div style={styles.grid} aria-hidden="true" />

      <form onSubmit={login} style={styles.card} noValidate>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoRing}>
            <img src={logoDonPerrito} alt="Don Perrito" style={styles.logo} width="80" height="80" />
          </div>
          <div style={styles.logoPulse} aria-hidden="true" />
        </div>

        <div style={styles.titleBlock}>
          <span style={styles.eyebrow}>Panel Administrativo</span>
          <h1 style={styles.title}>Don Perrito</h1>
          <p style={styles.subtitle}>Accede para gestionar pedidos y ventas</p>
        </div>

        {/* Email */}
        <div style={styles.fieldWrap}>
          <label htmlFor="login-email" style={styles.label}>Correo electrónico</label>
          <div style={inputWrapStyle("email")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.inputIcon} aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <input
              id="login-email"
              type="email"
              placeholder="admin@donperrito.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused("")}
              required
              style={styles.input}
              autoComplete="email"
              autoCapitalize="off"
            />
          </div>
        </div>

        {/* Password */}
        <div style={styles.fieldWrap}>
          <label htmlFor="login-password" style={styles.label}>Contraseña</label>
          <div style={inputWrapStyle("password")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.inputIcon} aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused("")}
              required
              style={styles.input}
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && (
          <div style={styles.errorBox} role="alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          aria-busy={loading}
        >
          {loading ? (
            <span style={styles.btnContent}>
              <span style={styles.spinner} aria-hidden="true" />
              Ingresando...
            </span>
          ) : (
            <span style={styles.btnContent}>
              Ingresar al panel
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          )}
        </button>

        <button
          type="button"
          style={styles.backLink}
          onClick={() => navigate("/")}
          onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
        >
          ← Volver al menú
        </button>
      </form>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; -webkit-tap-highlight-color: transparent; }
        @-webkit-keyframes blob {
          0%,100% { -webkit-transform: translate(0,0) scale(1); transform: translate(0,0) scale(1); }
          33% { -webkit-transform: translate(30px,-50px) scale(1.1); transform: translate(30px,-50px) scale(1.1); }
          66% { -webkit-transform: translate(-20px,20px) scale(0.9); transform: translate(-20px,20px) scale(0.9); }
        }
        @keyframes blob {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-50px) scale(1.1); }
          66% { transform: translate(-20px,20px) scale(0.9); }
        }
        @-webkit-keyframes spin { to { -webkit-transform: rotate(360deg); transform: rotate(360deg); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @-webkit-keyframes fadeUp {
          from { opacity: 0; -webkit-transform: translateY(18px); transform: translateY(18px); }
          to { opacity: 1; -webkit-transform: translateY(0); transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @-webkit-keyframes pulse {
          0%,100% { -webkit-transform: scale(1); transform: scale(1); opacity: 0.6; }
          50% { -webkit-transform: scale(1.15); transform: scale(1.15); opacity: 0.3; }
        }
        @keyframes pulse {
          0%,100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.3; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(249,115,22,0.04) inset !important;
          -webkit-text-fill-color: #f1f0ee !important;
          caret-color: #f1f0ee;
          border-color: rgba(249,115,22,0.4) !important;
        }
      `}</style>
    </div>
  );
}

const styles = {
  shell: {
    minHeight: "100vh",
    background: "#0a0a0f",
    display: "-webkit-box",
    display: "flex",
    WebkitBoxAlign: "center",
    alignItems: "center",
    WebkitBoxPack: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute", top: "-20%", left: "-10%",
    width: "600px", height: "600px",
    background: "radial-gradient(circle, rgba(251,146,60,0.14) 0%, transparent 70%)",
    borderRadius: "50%",
    animation: "blob 8s ease-in-out infinite",
    WebkitAnimation: "blob 8s ease-in-out infinite",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute", bottom: "-20%", right: "-10%",
    width: "500px", height: "500px",
    background: "radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 70%)",
    borderRadius: "50%",
    animation: "blob 10s ease-in-out infinite reverse",
    WebkitAnimation: "blob 10s ease-in-out infinite reverse",
    pointerEvents: "none",
  },
  blob3: {
    position: "absolute", top: "50%", left: "50%",
    width: "300px", height: "300px",
    background: "radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%)",
    borderRadius: "50%",
    transform: "translate(-50%,-50%)",
    WebkitTransform: "translate(-50%,-50%)",
    animation: "blob 6s ease-in-out infinite",
    WebkitAnimation: "blob 6s ease-in-out infinite",
    pointerEvents: "none",
  },
  grid: {
    position: "absolute", inset: 0,
    backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
    backgroundSize: "60px 60px",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: "420px",
    background: "rgba(255,255,255,0.025)",
    WebkitBackdropFilter: "blur(24px)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "28px",
    padding: "40px 36px",
    animation: "fadeUp 0.6s ease both",
    WebkitAnimation: "fadeUp 0.6s ease both",
    boxShadow: "0 28px 72px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  logoWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "26px",
    position: "relative",
  },
  logoRing: {
    width: "88px", height: "88px",
    borderRadius: "24px",
    padding: "4px",
    background: "linear-gradient(135deg, #f97316, #f59e0b)",
    boxShadow: "0 0 36px rgba(249,115,22,0.4)",
  },
  logo: {
    width: "100%", height: "100%",
    borderRadius: "20px",
    objectFit: "cover",
    display: "block",
  },
  logoPulse: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    WebkitTransform: "translate(-50%,-50%)",
    width: "102px", height: "102px",
    borderRadius: "28px",
    border: "2px solid rgba(249,115,22,0.28)",
    animation: "pulse 2.2s ease-in-out infinite",
    WebkitAnimation: "pulse 2.2s ease-in-out infinite",
  },
  titleBlock: { textAlign: "center", marginBottom: "30px" },
  eyebrow: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "3px",
    textTransform: "uppercase",
    color: "#f97316",
  },
  title: {
    fontFamily: "'Syne', 'Georgia', serif",
    fontSize: "30px",
    fontWeight: "800",
    color: "#fff",
    marginTop: "6px",
    lineHeight: 1.1,
    letterSpacing: "-0.4px",
  },
  subtitle: { fontSize: "13px", color: "rgba(255,255,255,0.38)", marginTop: "7px" },
  fieldWrap: { marginBottom: "14px" },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: "0.5px",
    marginBottom: "7px",
    textTransform: "uppercase",
  },
  inputWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "0 14px",
    transition: "all 0.2s ease",
  },
  inputWrapFocused: {
    border: "1px solid rgba(249,115,22,0.48)",
    background: "rgba(249,115,22,0.05)",
    boxShadow: "0 0 0 3px rgba(249,115,22,0.1)",
  },
  inputIcon: { color: "rgba(255,255,255,0.28)", flexShrink: 0 },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    padding: "14px 0",
    fontSize: "16px", /* 16px prevents iOS zoom on focus */
    color: "#fff",
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    WebkitAppearance: "none",
    minHeight: "50px",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "12px",
    padding: "11px 14px",
    fontSize: "13px",
    color: "#ef4444",
    marginBottom: "14px",
  },
  btn: {
    width: "100%",
    marginTop: "6px",
    background: "linear-gradient(135deg, #f97316, #f59e0b)",
    border: "none",
    borderRadius: "16px",
    padding: "15px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "700",
    color: "#fff",
    fontFamily: "'Syne', 'Georgia', serif",
    transition: "all 0.2s ease",
    WebkitTransition: "all 0.2s ease",
    boxShadow: "0 6px 22px rgba(249,115,22,0.35)",
    minHeight: "52px",
  },
  btnDisabled: {
    background: "rgba(255,255,255,0.08)",
    boxShadow: "none",
    cursor: "not-allowed",
    color: "rgba(255,255,255,0.3)",
  },
  btnContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
    WebkitAnimation: "spin 0.8s linear infinite",
    flexShrink: 0,
  },
  backLink: {
    display: "block",
    width: "100%",
    textAlign: "center",
    marginTop: "18px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.3)",
    cursor: "pointer",
    transition: "color 0.2s",
    WebkitTransition: "color 0.2s",
    background: "none",
    border: "none",
    padding: "6px",
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    minHeight: "36px",
  },
};
