import { QRCodeSVG } from "qrcode.react";

import logoDonPerrito from "../assets/logo-don-perrito.png";

const MESAS = [
  1, 2, 3, 4, 5,
  6, 7, 8, 9, 10,
];

export default function QrTables() {
  return (
    <div className="app-shell min-h-screen p-6 sm:p-8">
      <header className="brand-surface mx-auto mb-10 flex max-w-6xl flex-col items-center gap-4 rounded-3xl p-6 text-center text-white shadow-2xl sm:flex-row sm:text-left">
        <img
          src={logoDonPerrito}
          alt="Don Perrito"
          className="h-20 w-20 rounded-3xl object-cover shadow-xl ring-2 ring-orange-300/50"
        />

        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-orange-300">
            Don Perrito
          </p>

          <h1 className="text-4xl font-black">
            QR de mesas
          </h1>

          <p className="mt-1 text-sm text-gray-300">
            Escanea, pide y sigue el estado desde la mesa.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {MESAS.map((mesa) => {
          const url =`https://don-perrito.vercel.app/mesa/${mesa}`;

          return (
            <div
              key={mesa}
              className="animate-in lift-card flex flex-col items-center rounded-3xl border border-white bg-white p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-5">
                Mesa #{mesa}
              </h2>

              <div className="rounded-2xl bg-white p-4 shadow-inner ring-1 ring-gray-100">
                <QRCodeSVG
                value={url}
                size={180}
                />
              </div>

              <p className="text-xs text-gray-500 mt-5 text-center break-all">
                {url}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
