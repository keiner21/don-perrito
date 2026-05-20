import { QRCodeSVG } from "qrcode.react";
import logoDonPerrito from "../assets/logo-don-perrito.png";

const MESAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
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
  .qr-shell { min-height: 100vh; background: var(--bg); padding: 32px 24px 60px; position: relative; overflow: hidden; }

  /* BG accent */
  .qr-bg-blob {
    position: absolute; top: -100px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 400px;
    background: radial-gradient(ellipse, rgba(249,115,22,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Header */
  .qr-header {
    max-width: 1100px; margin: 0 auto 40px;
    display: flex; align-items: center; gap: 20px;
    background: rgba(255,255,255,0.02); border: 1px solid var(--border);
    border-radius: 24px; padding: 24px 28px;
    position: relative;
  }
  .qr-logo { width: 64px; height: 64px; border-radius: 18px; object-fit: cover; border: 2px solid rgba(249,115,22,0.3); box-shadow: 0 0 32px rgba(249,115,22,0.2); }
  .qr-brand-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--amber); }
  .qr-brand-name { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: var(--text); margin-top: 2px; }
  .qr-brand-sub { font-size: 13px; color: var(--muted); margin-top: 4px; }
  .qr-print-btn {
    margin-left: auto; padding: 12px 24px;
    background: rgba(255,255,255,0.05); border: 1px solid var(--border);
    border-radius: 14px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--text);
    transition: all 0.2s;
  }
  .qr-print-btn:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.15); }

  /* Grid */
  .qr-grid {
    max-width: 1100px; margin: 0 auto;
    display: grid; gap: 20px;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  /* QR Card */
  .qr-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 24px; padding: 24px 20px;
    display: flex; flex-direction: column; align-items: center; gap: 0;
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    animation: fadeUp 0.4s ease both;
    cursor: default;
  }
  .qr-card:hover {
    transform: translateY(-6px) scale(1.01);
    border-color: rgba(249,115,22,0.25);
    box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(249,115,22,0.1);
  }
  .qr-mesa-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 14px; border-radius: 100px;
    background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2);
    font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--amber);
    margin-bottom: 16px;
  }
  .qr-mesa-num { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--text); margin-bottom: 18px; }
  .qr-code-wrap {
    background: #fff; border-radius: 18px; padding: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    position: relative;
  }
  .qr-corner {
    position: absolute; width: 14px; height: 14px;
    border-color: var(--amber); border-style: solid;
  }
  .qr-corner.tl { top: -2px; left: -2px; border-width: 3px 0 0 3px; border-radius: 6px 0 0 0; }
  .qr-corner.tr { top: -2px; right: -2px; border-width: 3px 3px 0 0; border-radius: 0 6px 0 0; }
  .qr-corner.bl { bottom: -2px; left: -2px; border-width: 0 0 3px 3px; border-radius: 0 0 0 6px; }
  .qr-corner.br { bottom: -2px; right: -2px; border-width: 0 3px 3px 0; border-radius: 0 0 6px 0; }
  .qr-url {
    font-size: 10px; color: var(--muted); margin-top: 14px;
    text-align: center; word-break: break-all; line-height: 1.5;
    max-width: 180px;
  }
  .qr-scan-hint {
    margin-top: 12px; font-size: 11px; font-weight: 600; color: rgba(249,115,22,0.6);
    letter-spacing: 0.5px;
  }

  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @media print {
    .qr-shell { background: white !important; }
    .qr-card { background: white !important; border: 1px solid #ddd !important; break-inside: avoid; }
    .qr-bg-blob, .qr-print-btn { display: none !important; }
    body { background: white !important; color: black !important; }
    .qr-brand-name, .qr-mesa-num { color: black !important; }
    .qr-url { color: #666 !important; }
  }
`;

export default function QrTables() {
  return (
    <div className="qr-shell">
      <style>{CSS}</style>
      <div className="qr-bg-blob" />

      <header className="qr-header">
        <img src={logoDonPerrito} alt="Don Perrito" className="qr-logo" />
        <div>
          <div className="qr-brand-eyebrow">Don Perrito</div>
          <div className="qr-brand-name">QR de Mesas</div>
          <div className="qr-brand-sub">Escanea, pide y sigue el estado desde tu mesa</div>
        </div>
        <button className="qr-print-btn" onClick={() => window.print()}>
          🖨 Imprimir todo
        </button>
      </header>

      <div className="qr-grid">
        {MESAS.map((mesa, i) => {
          const url = `https://don-perrito.vercel.app/mesa/${mesa}`;
          return (
            <div key={mesa} className="qr-card" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="qr-mesa-badge">Mesa</div>
              <div className="qr-mesa-num">#{mesa}</div>
              <div className="qr-code-wrap">
                <div className="qr-corner tl" />
                <div className="qr-corner tr" />
                <div className="qr-corner bl" />
                <div className="qr-corner br" />
                <QRCodeSVG value={url} size={160} />
              </div>
              <div className="qr-url">{url}</div>
              <div className="qr-scan-hint">📱 Escanear para pedir</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
