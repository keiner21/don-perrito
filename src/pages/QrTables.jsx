import { QRCodeSVG } from "qrcode.react";
import logoDonPerrito from "../assets/logo-don-perrito.png";

const MESAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const QR_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  .qr-root {
    min-height: 100vh; background: #f5f0eb;
    font-family: 'DM Sans', sans-serif; color: #1a1207;
    padding: 2rem 1.5rem 4rem;
  }

  /* Header */
  .qr-header {
    max-width: 1100px; margin: 0 auto 2.5rem;
    background: #1a1207; border-radius: 24px;
    padding: 1.75rem 2rem;
    display: flex; align-items: center; gap: 1.5rem;
    flex-wrap: wrap; justify-content: space-between;
    box-shadow: 0 8px 40px rgba(26,18,7,0.25);
    position: relative; overflow: hidden;
  }
  .qr-header::before {
    content: ''; position: absolute; top: -60px; right: -60px;
    width: 200px; height: 200px; border-radius: 50%;
    background: rgba(234,88,12,0.15); filter: blur(40px);
  }
  .qr-header-left { display: flex; align-items: center; gap: 1.25rem; position: relative; }
  .qr-logo {
    width: 64px; height: 64px; border-radius: 16px; object-fit: cover;
    border: 2px solid rgba(234,88,12,0.4);
    box-shadow: 0 0 24px rgba(234,88,12,0.3);
  }
  .qr-eyebrow {
    font-size: 0.62rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
    color: #f97316; margin-bottom: 0.25rem;
  }
  .qr-title {
    font-family: 'Syne', sans-serif; font-size: 1.75rem; font-weight: 900;
    color: #fff; line-height: 1;
  }
  .qr-sub { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin-top: 0.25rem; }

  .qr-header-stats { display: flex; gap: 1.5rem; position: relative; }
  .stat-item { text-align: right; }
  .stat-num {
    font-family: 'Syne', sans-serif; font-size: 1.75rem; font-weight: 900; color: #f97316;
  }
  .stat-label { font-size: 0.7rem; color: rgba(255,255,255,0.35); font-weight: 500; }

  /* Grid */
  .qr-grid {
    max-width: 1100px; margin: 0 auto;
    display: grid; gap: 1.25rem;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  /* Card */
  .qr-card {
    background: #fff; border-radius: 20px;
    padding: 1.5rem; text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1.5px solid rgba(26,18,7,0.06);
    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
    animation: cardPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
    position: relative; overflow: hidden;
  }
  @keyframes cardPop {
    from { opacity: 0; transform: scale(0.9) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .qr-card:hover {
    transform: translateY(-5px) scale(1.01);
    box-shadow: 0 16px 40px rgba(0,0,0,0.13);
  }

  .qr-card-accent {
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #ea580c, #f97316, #fbbf24);
    border-radius: 999px 999px 0 0;
  }

  .qr-mesa-label {
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
    color: #f97316; margin-bottom: 0.25rem;
  }
  .qr-mesa-num {
    font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 900;
    color: #1a1207; margin-bottom: 1.25rem; line-height: 1;
  }

  .qr-code-wrap {
    background: #fff; border-radius: 14px;
    padding: 1rem; display: inline-block;
    border: 1.5px solid rgba(26,18,7,0.08);
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    margin-bottom: 1rem;
  }

  .qr-url {
    font-size: 0.62rem; color: #b8a898;
    word-break: break-all; line-height: 1.5;
    background: #fdf8f3; border-radius: 8px;
    padding: 0.4rem 0.6rem; margin-top: 0.25rem;
  }

  .qr-scan-hint {
    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    font-size: 0.7rem; color: #8a7460; font-weight: 500; margin-top: 0.75rem;
  }
  .scan-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #ea580c;
    animation: scanPulse 2s ease-in-out infinite;
  }
  @keyframes scanPulse {
    0%, 100% { opacity: 0.4; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }

  /* Print styles */
  @media print {
    .qr-root { background: #fff; padding: 0; }
    .qr-header { display: none; }
    .qr-grid { grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 100%; }
    .qr-card { box-shadow: none; border: 1px solid #ddd; break-inside: avoid; }
    .qr-card:hover { transform: none; }
  }
`;

export default function QrTables() {
  return (
    <>
      <style>{QR_STYLES}</style>
      <div className="qr-root">
        <header className="qr-header">
          <div className="qr-header-left">
            <img src={logoDonPerrito} alt="Don Perrito" className="qr-logo" />
            <div>
              <p className="qr-eyebrow">Don Perrito</p>
              <h1 className="qr-title">QR de mesas</h1>
              <p className="qr-sub">Escanea, pide y sigue tu pedido desde la mesa.</p>
            </div>
          </div>
          <div className="qr-header-stats">
            <div className="stat-item">
              <div className="stat-num">{MESAS.length}</div>
              <div className="stat-label">Mesas activas</div>
            </div>
          </div>
        </header>

        <div className="qr-grid">
          {MESAS.map((mesa, i) => {
            const url = `https://don-perrito.vercel.app/mesa/${mesa}`;
            return (
              <div
                key={mesa}
                className="qr-card"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="qr-card-accent" />
                <p className="qr-mesa-label">Escanear para pedir</p>
                <h2 className="qr-mesa-num">Mesa #{mesa}</h2>

                <div className="qr-code-wrap">
                  <QRCodeSVG
                    value={url}
                    size={160}
                    level="M"
                    includeMargin={false}
                    fgColor="#1a1207"
                  />
                </div>

                <div className="qr-url">{url}</div>

                <div className="qr-scan-hint">
                  <div className="scan-dot" style={{ animationDelay: `${i * 0.3}s` }} />
                  Apunta la cámara al código
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
