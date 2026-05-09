import { useState } from "react";

import { useCart } from "../context/CartContext";

import { fmt } from "../utils/format";

import { useNavigate } from "react-router-dom";

import { api } from "../services/api";

const METODOS = [
  "Efectivo",
  "Nequi",
  "Daviplata",
  "Tarjeta",
];

export default function Payment() {
  const navigate = useNavigate();

  const {
    carrito,
    subtotal,
    limpiarCarrito,
  } = useCart();

  const [mesa, setMesa] = useState(
  localStorage.getItem("mesa") || "1"
);

  const [metodo, setMetodo] =
    useState("Efectivo");

  const confirmarPedido = async () => {
    try {
      const nuevoPedido = {
        id: Date.now(),
        numero: Math.floor(
          Math.random() * 900 + 100
        ),
        mesa,
        metodo,
        total: subtotal,
        estado: "Pendiente",
        fecha: new Date().toLocaleString(),
        items: carrito,
      };

      const response = await api.post(
  "/pedidos",
  nuevoPedido
);

      limpiarCarrito();

      navigate("/confirmed", {
      state: {
      pedido: response.data,
      },
    });
    } catch (error) {
      console.error(error);

      alert("Error enviando pedido");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <button
        onClick={() => navigate("/cart")}
        className="text-orange-600 mb-4"
      >
        ← Volver
      </button>

      <h1 className="text-2xl font-bold mb-6">
        Método de pago
      </h1>

      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <label className="block mb-2 font-medium">
          Mesa
        </label>

        <input
          type="text"
          value={mesa}
          onChange={(e) =>
            setMesa(e.target.value)
          }
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {METODOS.map((m) => (
          <button
            key={m}
            onClick={() => setMetodo(m)}
            className={`p-4 rounded-xl border-2 ${
              metodo === m
                ? "border-orange-600 bg-orange-50"
                : "border-gray-200"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow mt-6">
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>

          <span className="text-orange-600">
            {fmt(subtotal)}
          </span>
        </div>
      </div>

      <button
        onClick={confirmarPedido}
        className="w-full mt-6 bg-black text-white py-4 rounded-xl"
      >
        Confirmar pedido
      </button>
    </div>
  );
}
