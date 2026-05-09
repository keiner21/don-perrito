import { QRCodeSVG } from "qrcode.react";

const MESAS = [
  1, 2, 3, 4, 5,
  6, 7, 8, 9, 10,
];

export default function QrTables() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-10 text-orange-600">
        QR Mesas Don Perrito
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {MESAS.map((mesa) => {
          const url = `http://localhost:5173/mesa/${mesa}`;

          return (
            <div
              key={mesa}
              className="bg-white rounded-3xl shadow-lg p-6 flex flex-col items-center"
            >
              <h2 className="text-2xl font-bold mb-5">
                Mesa #{mesa}
              </h2>

              <div className="bg-white p-4 rounded-xl">
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
