import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MENU } from "../data/menu";
import { useCart } from "../context/CartContext";
import { fmt } from "../utils/format";
import { socket } from "../services/socket";
import { clearActiveOrder, getActiveOrder, getActiveOrderTimeLeft, saveActiveOrder } from "../utils/activeOrder";
import logoDonPerrito from "../assets/logo-don-perrito.png";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #08080e;
    --surface: rgba(255,255,255,0.03);
    --surface2: rgba(255,255,255,0.055);
    --border: rgba(255,255,255,0.07);
    --border-hover: rgba(249,115,22,0.22);
    --amber: #f59e0b;
    --orange: #f97316;
    --text: #f1f0ee;
    --text-secondary: rgba(241,240,238,0.55);
    --muted: rgba(255,255,255,0.35);
    --danger: #ef4444;
    --success: #22c55e;
    --radius-sm: 10px;
    --radius-md: 16px;
    --radius-lg: 22px;
    --radius-xl: 28px;
    --font-display: 'Syne', 'Georgia', serif;
    --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --transition: 0.2s ease;
  }

  html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: transparent;
  }

  .menu-shell { min-height: 100vh; background: var(--bg); }

  /* ─── Header ─────────────────────────────────────── */
  .menu-header {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(8,8,14,0.88);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid var(--border);
  }
  .menu-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    padding: 14px 24px;
    gap: 16px;
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
  }
  .brand {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 14px;
  }
  .brand-logo {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    object-fit: cover;
    border: 1.5px solid rgba(249,115,22,0.35);
    -webkit-box-shadow: 0 0 20px rgba(249,115,22,0.25);
    box-shadow: 0 0 20px rgba(249,115,22,0.25);
    -ms-flex-negative: 0;
    flex-shrink: 0;
  }
  .brand-name {
    font-family: var(--font-display);
    font-size: clamp(18px, 3vw, 22px);
    font-weight: 800;
    color: var(--text);
    line-height: 1.1;
    letter-spacing: -0.3px;
  }
  .brand-mesa {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 2px;
  }
  .brand-tagline {
    font-size: 11px;
    color: var(--muted);
    margin-top: 2px;
    font-weight: 400;
  }

  .header-actions {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 8px;
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
  }

  .btn-ghost {
    padding: 9px 16px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--font-body);
    -webkit-transition: all var(--transition);
    transition: all var(--transition);
    min-height: 44px;
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .btn-ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.15); }
  .btn-ghost:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }

  .btn-order {
    padding: 9px 18px;
    border-radius: var(--radius-sm);
    background: -webkit-linear-gradient(135deg, var(--orange), var(--amber));
    background: linear-gradient(135deg, var(--orange), var(--amber));
    border: none;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: var(--font-display);
    -webkit-box-shadow: 0 4px 16px rgba(249,115,22,0.3);
    box-shadow: 0 4px 16px rgba(249,115,22,0.3);
    -webkit-transition: all var(--transition);
    transition: all var(--transition);
    min-height: 44px;
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    letter-spacing: 0.2px;
  }
  .btn-order:hover {
    -webkit-transform: translateY(-1px);
    -ms-transform: translateY(-1px);
    transform: translateY(-1px);
    -webkit-box-shadow: 0 8px 24px rgba(249,115,22,0.4);
    box-shadow: 0 8px 24px rgba(249,115,22,0.4);
  }
  .btn-order:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }

  .btn-active {
    padding: 9px 16px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(245,158,11,0.4);
    background: rgba(245,158,11,0.08);
    color: var(--amber);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--font-body);
    -webkit-transition: all var(--transition);
    transition: all var(--transition);
    min-height: 44px;
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .btn-active:hover { background: rgba(245,158,11,0.14); border-color: rgba(245,158,11,0.6); }
  .btn-active:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }

  /* ─── Filter Bar ─────────────────────────────────── */
  .filter-bar {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px 24px 0;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    gap: 14px;
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
    -webkit-box-align: end;
    -ms-flex-align: end;
    align-items: flex-end;
  }
  .search-wrap {
    position: relative;
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
    min-width: 220px;
  }
  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    -webkit-transform: translateY(-50%);
    -ms-transform: translateY(-50%);
    transform: translateY(-50%);
    color: var(--muted);
    pointer-events: none;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
  }
  .search-input {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 13px 16px 13px 44px;
    font-size: 16px; /* 16px prevents iOS zoom */
    color: var(--text);
    outline: none;
    font-family: var(--font-body);
    -webkit-transition: all var(--transition);
    transition: all var(--transition);
    -webkit-appearance: none;
    appearance: none;
    min-height: 48px;
  }
  .search-input::-webkit-input-placeholder { color: var(--muted); }
  .search-input::-moz-placeholder { color: var(--muted); opacity: 1; }
  .search-input:-ms-input-placeholder { color: var(--muted); }
  .search-input::placeholder { color: var(--muted); }
  .search-input:focus {
    border-color: rgba(249,115,22,0.45);
    -webkit-box-shadow: 0 0 0 3px rgba(249,115,22,0.1);
    box-shadow: 0 0 0 3px rgba(249,115,22,0.1);
  }

  /* Category pills */
  .cat-scroll {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .cat-scroll::-webkit-scrollbar { display: none; }
  .cat-pill {
    -ms-flex-negative: 0;
    flex-shrink: 0;
    padding: 9px 18px;
    border-radius: 100px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--font-body);
    -webkit-transition: all var(--transition);
    transition: all var(--transition);
    min-height: 40px;
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    white-space: nowrap;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  .cat-pill:hover { color: var(--text); border-color: rgba(255,255,255,0.16); }
  .cat-pill.active {
    background: var(--text);
    color: #08080e;
    border-color: transparent;
    -webkit-box-shadow: 0 3px 12px rgba(241,240,238,0.12);
    box-shadow: 0 3px 12px rgba(241,240,238,0.12);
  }
  .cat-pill:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }

  /* ─── Products Grid ──────────────────────────────── */
  .products-grid {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px 24px 160px;
    display: -ms-grid;
    display: grid;
    gap: 18px;
    -ms-grid-columns: (minmax(300px, 1fr))[auto-fill];
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  /* Product card */
  .product-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    -webkit-transition: -webkit-transform 0.28s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s ease, -webkit-box-shadow 0.28s ease;
    transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s ease, box-shadow 0.28s ease;
    -webkit-animation: fadeIn 0.4s ease both;
    animation: fadeIn 0.4s ease both;
  }
  .product-card:hover {
    -webkit-transform: translateY(-4px);
    -ms-transform: translateY(-4px);
    transform: translateY(-4px);
    border-color: var(--border-hover);
    -webkit-box-shadow: 0 20px 56px rgba(0,0,0,0.45), 0 0 0 1px rgba(249,115,22,0.08);
    box-shadow: 0 20px 56px rgba(0,0,0,0.45), 0 0 0 1px rgba(249,115,22,0.08);
  }

  .product-img-wrap {
    height: 196px;
    overflow: hidden;
    background: rgba(255,255,255,0.03);
    position: relative;
  }
  .product-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    -webkit-transition: -webkit-transform 0.5s ease;
    transition: transform 0.5s ease;
    display: block;
  }
  .product-img.contain { object-fit: contain; padding: 20px; }
  .product-card:hover .product-img {
    -webkit-transform: scale(1.06);
    -ms-transform: scale(1.06);
    transform: scale(1.06);
  }
  .product-cat-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(8,8,14,0.75);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    border: 1px solid var(--border);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--amber);
  }

  .product-body { padding: 18px 20px 20px; }
  .product-top {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    -webkit-box-align: start;
    -ms-flex-align: start;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 8px;
  }
  .product-name {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.25;
    letter-spacing: -0.2px;
  }
  .product-price {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 800;
    color: var(--amber);
    -ms-flex-negative: 0;
    flex-shrink: 0;
  }
  .product-desc {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.65;
    min-height: 42px;
  }

  /* Add / Qty controls */
  .btn-add {
    width: 100%;
    margin-top: 16px;
    padding: 12px;
    background: rgba(249,115,22,0.1);
    border: 1px solid rgba(249,115,22,0.22);
    border-radius: var(--radius-sm);
    color: var(--orange);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: var(--font-display);
    -webkit-transition: all var(--transition);
    transition: all var(--transition);
    min-height: 44px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    gap: 7px;
    letter-spacing: 0.2px;
  }
  .btn-add:hover { background: rgba(249,115,22,0.18); border-color: rgba(249,115,22,0.48); }
  .btn-add:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }

  .qty-control {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    margin-top: 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 5px;
  }
  .qty-btn {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 18px;
    font-weight: 800;
    -webkit-transition: all 0.15s ease;
    transition: all 0.15s ease;
    font-family: var(--font-display);
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -ms-flex-negative: 0;
    flex-shrink: 0;
  }
  .qty-btn.minus { background: rgba(255,255,255,0.06); color: var(--text); }
  .qty-btn.minus:hover { background: rgba(255,255,255,0.1); }
  .qty-btn.plus {
    background: -webkit-linear-gradient(135deg, var(--orange), var(--amber));
    background: linear-gradient(135deg, var(--orange), var(--amber));
    color: #fff;
  }
  .qty-btn.plus:hover {
    -webkit-box-shadow: 0 3px 12px rgba(249,115,22,0.45);
    box-shadow: 0 3px 12px rgba(249,115,22,0.45);
  }
  .qty-btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
  .qty-label {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    text-align: center;
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
  }

  /* Empty state */
  .empty-state {
    max-width: 380px;
    margin: 80px auto;
    text-align: center;
    padding: 24px;
  }
  .empty-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 18px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 18px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    color: var(--muted);
  }
  .empty-title {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 8px;
  }
  .empty-desc {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.65;
  }

  /* ─── Floating bar ───────────────────────────────── */
  .floating-bar {
    position: fixed;
    bottom: 24px;
    left: 50%;
    -webkit-transform: translateX(-50%);
    -ms-transform: translateX(-50%);
    transform: translateX(-50%);
    z-index: 100;
    background: rgba(18,16,24,0.95);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(249,115,22,0.28);
    border-radius: var(--radius-xl);
    padding: 12px 16px 12px 14px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
    gap: 20px;
    cursor: pointer;
    min-width: min(440px, calc(100vw - 32px));
    max-width: calc(100vw - 32px);
    -webkit-box-shadow: 0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(249,115,22,0.08);
    box-shadow: 0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(249,115,22,0.08);
    -webkit-animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
    animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
    -webkit-transition: all var(--transition);
    transition: all var(--transition);
  }
  .floating-bar:hover {
    border-color: rgba(249,115,22,0.5);
    -webkit-transform: translateX(-50%) translateY(-2px);
    -ms-transform: translateX(-50%) translateY(-2px);
    transform: translateX(-50%) translateY(-2px);
  }
  .floating-bar-left {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 12px;
  }
  .floating-count {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: -webkit-linear-gradient(135deg, var(--orange), var(--amber));
    background: linear-gradient(135deg, var(--orange), var(--amber));
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 800;
    color: #fff;
    -ms-flex-negative: 0;
    flex-shrink: 0;
  }
  .floating-count-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(245,158,11,0.12);
    border: 1px solid rgba(245,158,11,0.25);
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    color: var(--amber);
    -ms-flex-negative: 0;
    flex-shrink: 0;
  }
  .floating-label {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
  }
  .floating-sub {
    font-size: 11px;
    color: var(--muted);
    margin-top: 1px;
    white-space: nowrap;
  }
  .floating-total {
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 800;
    color: var(--amber);
    white-space: nowrap;
  }

  @-webkit-keyframes slideUp {
    from { opacity: 0; -webkit-transform: translateX(-50%) translateY(20px); transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; -webkit-transform: translateX(-50%) translateY(0); transform: translateX(-50%) translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @-webkit-keyframes fadeIn {
    from { opacity: 0; -webkit-transform: translateY(10px); transform: translateY(10px); }
    to { opacity: 1; -webkit-transform: translateY(0); transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 480px) {
    .menu-header-inner { padding: 12px 16px; gap: 10px; }
    .filter-bar { padding: 16px 16px 0; }
    .products-grid { padding: 16px 16px 160px; gap: 14px; }
    .brand-name { font-size: 18px; }
    .products-grid { grid-template-columns: 1fr; }
  }

  @supports not (backdrop-filter: blur(1px)) {
    .menu-header { background: rgba(8,8,14,0.97); }
    .floating-bar { background: rgba(14,12,20,0.99); }
  }
`;

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

const BoxIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);

const AdminIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const EmptySearchIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
  </svg>
);

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

      <header className="menu-header" role="banner">
        <div className="menu-header-inner">
          <div className="brand">
            <img src={logoDonPerrito} alt="Don Perrito" className="brand-logo" width="48" height="48" />
            <div>
              <div className="brand-mesa">Mesa #{mesa}</div>
              <div className="brand-name">Don Perrito</div>
              <div className="brand-tagline">Hamburguesas &amp; perros al momento</div>
            </div>
          </div>
          <nav className="header-actions" aria-label="Acciones principales">
            {pedidoActivo && (
              <button className="btn-active" onClick={() => navigate("/confirmed")} aria-label="Ver pedido activo">
                <BoxIcon /> Ver pedido activo
              </button>
            )}
            {totalItems > 0 && (
              <button className="btn-order" onClick={() => navigate("/cart")} aria-label={`Ver pedido con ${totalItems} productos`}>
                Pedido ({totalItems}) · {fmt(subtotal)}
              </button>
            )}
            <button className="btn-ghost" onClick={() => window.open("/admin", "_blank")} aria-label="Abrir panel admin">
              <AdminIcon /> Admin
            </button>
          </nav>
        </div>
      </header>

      <div className="filter-bar" role="search">
        <div className="search-wrap">
          <span className="search-icon" aria-hidden="true"><SearchIcon /></span>
          <input
            className="search-input"
            type="search"
            placeholder="Buscar hamburguesas, perros, bebidas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar en el menú"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 24px 0" }}>
        <div className="cat-scroll" role="tablist" aria-label="Categorías">
          {categorias.map((c) => (
            <button
              key={c}
              className={`cat-pill${categoriaActiva === c ? " active" : ""}`}
              onClick={() => setCategoriaActiva(c)}
              role="tab"
              aria-selected={categoriaActiva === c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="empty-state" role="status">
          <div className="empty-icon"><EmptySearchIcon /></div>
          <div className="empty-title">Sin resultados</div>
          <p className="empty-desc">Prueba otra búsqueda o selecciona una categoría diferente.</p>
        </div>
      ) : (
        <main className="products-grid" aria-label="Productos disponibles">
          {filtrados.map((item, i) => {
            const q = qty(item.id);
            return (
              <article
                key={item.id}
                className="product-card"
                style={{ animationDelay: `${i * 35}ms` }}
                aria-label={item.nombre}
              >
                <div className="product-img-wrap">
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className={`product-img${item.categoria === "Bebidas" ? " contain" : ""}`}
                    loading="lazy"
                    decoding="async"
                    width="300"
                    height="196"
                  />
                  <span className="product-cat-badge" aria-hidden="true">{item.categoria}</span>
                </div>
                <div className="product-body">
                  <div className="product-top">
                    <h2 className="product-name">{item.nombre}</h2>
                    <span className="product-price" aria-label={`Precio: ${fmt(item.precio)}`}>{fmt(item.precio)}</span>
                  </div>
                  <p className="product-desc">{item.descripcion}</p>
                  {q > 0 ? (
                    <div className="qty-control" role="group" aria-label={`Cantidad de ${item.nombre}`}>
                      <button
                        className="qty-btn minus"
                        onClick={() => cambiarQty(item.id, -1)}
                        aria-label="Reducir cantidad"
                      >
                        −
                      </button>
                      <span className="qty-label">{q} en pedido</span>
                      <button
                        className="qty-btn plus"
                        onClick={() => agregar(item)}
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-add"
                      onClick={() => agregar(item)}
                      aria-label={`Agregar ${item.nombre} al pedido`}
                    >
                      <PlusIcon /> Agregar al pedido
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </main>
      )}

      {totalItems > 0 && (
        <div
          className="floating-bar"
          onClick={() => navigate("/cart")}
          role="button"
          tabIndex={0}
          aria-label={`Ver pedido: ${totalItems} productos, total ${fmt(subtotal)}`}
          onKeyDown={(e) => e.key === "Enter" && navigate("/cart")}
        >
          <div className="floating-bar-left">
            <div className="floating-count" aria-hidden="true">{totalItems}</div>
            <div>
              <div className="floating-label">Ver mi pedido</div>
              <div className="floating-sub">Toca para revisar y enviar</div>
            </div>
          </div>
          <div className="floating-total">{fmt(subtotal)}</div>
        </div>
      )}

      {totalItems === 0 && pedidoActivo && (
        <div
          className="floating-bar"
          onClick={() => navigate("/confirmed")}
          role="button"
          tabIndex={0}
          aria-label="Ver estado del pedido activo"
          onKeyDown={(e) => e.key === "Enter" && navigate("/confirmed")}
        >
          <div className="floating-bar-left">
            <div className="floating-count-icon"><BoxIcon /></div>
            <div>
              <div className="floating-label">Pedido en camino</div>
              <div className="floating-sub">Toca para ver el estado</div>
            </div>
          </div>
          <ArrowIcon />
        </div>
      )}
    </div>
  );
}
