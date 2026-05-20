cat > /mnt/user-data/outputs/Login.jsx << 'ENDOFFILE'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import logoDonPerrito from "../assets/logo-don-perrito.png";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #06060e;
    --surface: rgba(255,255,255,0.03);
    --border: rgba(255,255,255,0.08);
    --border-focus: rgba(249,115,22,0.5);
    --orange: #f97316;
    --amber: #f59e0b;
    --text: #f0efe9;
    --muted: rgba(240,239,233,0.35);
  }
  body { background: var(--bg); font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }

  .login-shell {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 60% 50% at 20% 0%, rgba(249,115,22,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 80% 100%, rgba(245,158,11,0.08) 0%, transparent 60%),
      var(--bg);
    display: flex; align-items: center; justify-content: center;
    padding: 24px; position: relative; overflow: hidden;
  }

  /* Grid lines */
  .login-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
  }

  /* Decorative orbs */
  .orb { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(80px); }
  .orb-1 { width: 500px; height: 500px; top: -150px; left: -100px; background: rgba(249,115,22,0.1); animation: drift 12s ease-in-out infinite; }
  .orb-2 { width: 400px; height: 400px; bottom: -120px; right: -80px; background: rgba(245,158,11,0.07); animation: drift 9s ease-in-out infinite reverse; }
  .orb-3 { width: 250px; height: 250px; top: 50%; left: 60%; background: rgba(239,68,68,0.05); animation: drift 7s ease-in-out infinite; }

  /* Card */
  .login-card {
    position: relative; z-index: 1;
    width: 100%; max-width: 420px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 28px; padding: 40px 36px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset;
    animation: fadeUpCard 0.6s cubic-bezier(0.16,1,0.3,1) both;
  }

  /* Logo */
  .logo-wrap { display: flex; justify-content: center; margin-bottom: 28px; }
  .logo-outer {
    width: 80px; height: 80px; border-radius: 24px;
    background: linear-gradient(135deg, var(--orange), var(--amber));
    padding: 3px; position: relative;
    box-shadow: 0 0 40px rgba(249,115,22,0.4), 0 0 80px rgba(249,115,22,0.15);
  }
  .logo-img { width: 100%; height: 100%; border-radius: 21px; object-fit: cover; display: block; }
  .logo-pulse {
    position: absolute; inset: -8px; border-radius: 32px;
    border: 1.5px solid rgba(249,115,22,0.3);
    animation: pulse-ring 2.5s ease-in-out infinite;
  }
  .logo-pulse-2 {
    position: absolute; inset: -16px; border-radius: 38px;
    border: 1px solid rgba(249,115,22,0.15);
    animation: pulse-ring 2.5s ease-in-out infinite 0.5s;
  }

  /* Title */
  .title-block { text-align: center; margin-bottom: 32px; }
  .title-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--orange); }
  .title-main { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: var(--text); margin-top: 6px; line-height: 1; }
  .title-sub { font-size: 13px; color: var(--muted); margin-top: 8px; line-height: 1.5; }

  /* Fields */
  .field { margin-bottom: 16px; }
  .field-label {
    display: block; font-size: 11px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 8px;
  }
  .field-wrap {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius: 14px; padding: 0 14px;
    transition: all 0.2s;
  }
  .field-wrap.focused {
    border-color: var(--border-focus);
    background: rgba(249,115,22,0.05);
    box-shadow: 0 0 0 3px rgba(249,115,22,0.1);
  }
  .field-icon { color: var(--muted); flex-shrink: 0; transition: color 0.2s; }
  .field-wrap.focused .field-icon { color: var(--orange); }
  .field-input {
    flex: 1; background: transparent; border: none; outline: none;
    padding: 14px 0; font-size: 14px; color: var(--text);
    font-family: 'DM Sans', sans-serif;
  }
  .field-input::placeholder { color: var(--muted); }

  /* Error */
  .error-box {
    display: flex; align-items: center; gap: 8px;
    background: rgba(251,113,133,0.08); border: 1px solid rgba(251,113,133,0.2);
    border-radius: 12px; padding: 11px 14px;
    font-size: 13px; color: #fb7185; margin-bottom: 16px;
    animation: shake 0.4s ease;
  }

  /* Submit */
  .submit-btn {
    width: 100%; margin-top: 8px;
    background: linear-gradient(135deg, var(--orange), var(--amber));
    border: none; border-radius: 16px; padding: 15px;
    cursor: pointer; font-family: 'Syne', sans-serif;
    font-size: 15px; font-weight: 700; color: #fff;
    box-shadow: 0 6px 24px rgba(249,115,22,0.35);
    transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(249,115,22,0.5); }
  .submit-btn:disabled { background: rgba(255,255,255,0.08); box-shadow: none; cursor: not-allowed; color: var(--muted); }

  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }

  /* Back link */
  .back-link {
    text-align: center; margin-top: 20px;
    font-size: 13px; color: var(--muted);
    cursor: pointer; transition: color 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .back-link:hover { color: rgba(240,239,233,0.6); }

  /* Divider */
  .divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
  .divider-line { flex: 1; height: 1px; background: var(--border); }
  .divider-text { font-size: 11px; color: var(--muted); font-weight: 600; white-space: nowrap; }

  /* Security badge */
  .security-badge {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 11px; color: var(--muted); margin-top: 18px;
  }

  @keyframes drift { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(24px,-36px) scale(1.05)} 66%{transform:translate(-18px,18px) scale(0.95)} }
  @keyframes fadeUpCard { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.06);opacity:0.25} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
`;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState("");

  const login = async (e) => {
    e.preventDefault();
    try {
      setError(""); setLoading(true);
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
    <div className="login-shell">
      <style>{CSS}</style>
      <div className="login-grid" />
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

      <form onSubmit={login} className="login-card">
        {/* Logo */}
        <div className="logo-wrap">
          <div className="logo-outer">
            <img src={logoDonPerrito} alt="Don Perrito" className="logo-img" />
            <div className="logo-pulse" />
            <div className="logo-pulse-2" />
          </div>
        </div>

        {/* Title */}
        <div className="title-block">
          <div className="title-eyebrow">Panel administrativo</div>
          <div className="title-main">Don Perrito</div>
          <div className="title-sub">Ingresa tus credenciales para gestionar pedidos y ventas en tiempo real</div>
        </div>

        {/* Email */}
        <div className="field">
          <label className="field-label">Correo electrónico</label>
          <div className={`field-wrap${focused === "email" ? " focused" : ""}`}>
            <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <input
              type="email" className="field-input"
              placeholder="admin@donperrito.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")} onBlur={() => setFocused("")}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="field">
          <label className="field-label">Contraseña</label>
          <div className={`field-wrap${focused === "password" ? " focused" : ""}`}>
            <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="16" r="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              type="password" className="field-input"
              placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")} onBlur={() => setFocused("")}
              required
            />
          </div>
        </div>

        {error && (
          <div className="error-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <><div className="spinner" /> Ingresando…</>
          ) : (
            <>
              Ingresar al panel
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </>
          )}
        </button>

        <div className="security-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Conexión segura y encriptada
        </div>

        <div className="back-link" onClick={() => navigate("/")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Volver al menú
        </div>
      </form>
    </div>
  );
}
ENDOFFILE

