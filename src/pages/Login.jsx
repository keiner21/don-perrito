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
  const [focused, setFocused] = useState(null);

  const login = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setLoading(true);
      const res = await api.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/admin");
    } catch {
      setError("Credenciales inválidas. Revisa el correo y la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@300;400;500&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(234,88,12,0.25) 0%, transparent 70%);
          top: -150px; right: -100px;
          animation: floatOrb 8s ease-in-out infinite;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%);
          bottom: -120px; left: -100px;
          animation: floatOrb 10s ease-in-out infinite reverse;
        }
        .orb-3 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(234,88,12,0.15) 0%, transparent 70%);
          top: 40%; left: 20%;
          animation: floatOrb 6s ease-in-out infinite 2s;
        }

        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(15px, -20px) scale(1.05); }
          66% { transform: translate(-10px, 10px) scale(0.97); }
        }

        .login-noise {
          position: absolute;
          inset: 0;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        .login-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 2.5rem;
          backdrop-filter: blur(20px);
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .login-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 28px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(234,88,12,0.5), transparent 50%, rgba(255,255,255,0.05));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .logo-wrap {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
        }
        .logo-glow {
          position: absolute;
          inset: -8px;
          border-radius: 28px;
          background: rgba(234,88,12,0.3);
          filter: blur(16px);
          animation: pulsateGlow 3s ease-in-out infinite;
        }
        @keyframes pulsateGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .logo-img {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 20px;
          object-fit: cover;
          border: 1.5px solid rgba(234,88,12,0.4);
        }

        .login-eyebrow {
          font-family: 'Syne', sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #f97316;
          text-align: center;
          margin-bottom: 0.35rem;
        }
        .login-title {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 900;
          color: #fff;
          text-align: center;
          line-height: 1.1;
          margin-bottom: 0.5rem;
        }
        .login-sub {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.4);
          text-align: center;
          margin-bottom: 2rem;
        }

        .field-wrap {
          margin-bottom: 1rem;
        }
        .field-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          margin-bottom: 0.5rem;
        }
        .field-input-wrap {
          position: relative;
        }
        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 0.85rem 1rem;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input:focus {
          border-color: rgba(234,88,12,0.7);
          background: rgba(234,88,12,0.07);
          box-shadow: 0 0 0 4px rgba(234,88,12,0.12);
        }
        .field-input.focused {
          border-color: rgba(234,88,12,0.7);
          background: rgba(234,88,12,0.07);
        }

        .error-box {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          margin-top: 1rem;
          color: #fca5a5;
          font-size: 0.82rem;
          font-weight: 500;
          animation: shake 0.35s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(3px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }

        .submit-btn {
          width: 100%;
          margin-top: 1.5rem;
          padding: 1rem;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: #fff;
          background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
          box-shadow: 0 4px 24px rgba(234,88,12,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          position: relative;
          overflow: hidden;
        }
        .submit-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%);
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(234,88,12,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0 0;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
        }
        .divider-text {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.2);
          white-space: nowrap;
        }

        .spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-root">
        <div className="login-noise" />
        <div className="login-bg-orb orb-1" />
        <div className="login-bg-orb orb-2" />
        <div className="login-bg-orb orb-3" />

        <form onSubmit={login} className="login-card">
          <div className="logo-wrap">
            <div className="logo-glow" />
            <img src={logoDonPerrito} alt="Don Perrito" className="logo-img" />
          </div>

          <p className="login-eyebrow">Don Perrito</p>
          <h1 className="login-title">Acceso admin</h1>
          <p className="login-sub">Gestiona pedidos, cocina y ventas.</p>

          <div className="field-wrap">
            <label className="field-label">Correo electrónico</label>
            <div className="field-input-wrap">
              <input
                type="email"
                placeholder="admin@donperrito.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                className={`field-input${focused === "email" ? " focused" : ""}`}
                required
              />
            </div>
          </div>

          <div className="field-wrap">
            <label className="field-label">Contraseña</label>
            <div className="field-input-wrap">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                className={`field-input${focused === "password" ? " focused" : ""}`}
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-box">
              <span>⚠</span> {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? <><span className="spinner" />Ingresando...</> : "Ingresar →"}
          </button>

          <div className="divider">
            <span className="divider-text">Panel de administración · Don Perrito</span>
          </div>
        </form>
      </div>
    </>
  );
}
