import { useCart } from "../context/CartContext";

import { fmt } from "../utils/format";

import { useNavigate } from "react-router-dom";

export default function Cart() {
  const {
    carrito,
    cambiarQty,
    subtotal,
    totalItems,
  } = useCart();

  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto p-4">
      <button
        onClick={() => navigate("/")}
        className="text-orange-600 mb-4"
      >
        ← Volver
      </button>

      <h1 className="text-2xl font-bold mb-6">
        Tu pedido
      </h1>

      <div className="flex flex-col gap-4">
        {carrito.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-xl shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  {item.nombre}
                </h2>

                <p className="text-orange-600 font-bold">
                  {fmt(item.precio * item.qty)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    cambiarQty(item.id, -1)
                  }
                  className="w-8 h-8 rounded-full border"
                >
                  -
                </button>

                <span>{item.qty}</span>

                <button
                  onClick={() =>
                    cambiarQty(item.id, 1)
                  }
                  className="w-8 h-8 rounded-full bg-orange-600 text-white"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white p-4 rounded-xl shadow">
        <div className="flex justify-between">
          <span>Total productos</span>
          <span>{totalItems}</span>
        </div>

        <div className="flex justify-between mt-2 font-bold text-lg">
          <span>Total</span>
          <span className="text-orange-600">
            {fmt(subtotal)}
          </span>
        </div>
      </div>

      <button
        onClick={() => navigate("/payment")}
        className="w-full mt-6 bg-orange-600 text-white py-4 rounded-xl"
      >
        Continuar al pago
      </button>
    </div>
  );
}
