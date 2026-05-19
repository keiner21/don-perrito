import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";

import { api } from "../services/api";

import { fmt } from "../utils/format";

import { saveActiveOrder } from "../utils/activeOrder";

import logoDonPerrito from "../assets/logo-don-perrito.png";

const METODOS_PAGO = [
  "Efectivo",
  "Nequi",
  "Daviplata",
  "Bancolombia",
  "Tarjeta",
];

export default function Cart() {
  const navigate = useNavigate();

  const {
    carrito,
    subtotal,
    totalItems,
    cambiarQty,
    eliminar,
    limpiarCarrito,
  } = useCart();

  const [metodoPago, setMetodoPago] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function enviarPedido() {
    if (carrito.length === 0) {
      setError("Agrega al menos un producto antes de enviar el pedido.");
      return;
    }

    if (!METODOS_PAGO.includes(metodoPago)) {
      setError("Selecciona un método de pago para enviar el pedido.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const pedido = {
        mesa: localStorage.getItem("mesa") || "1",
        metodo: metodoPago,
        total: subtotal,
        items: carrito,
      };

      const response = await api.post("/pedidos", pedido);

      const pedidoGuardado = saveActiveOrder(response.data);

      limpiarCarrito();

      navigate("/confirmed", {
        state: {
          pedido: pedidoGuardado,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "No pudimos enviar el pedido. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  if (carrito.length === 0) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center p-6">
        <div className="animate-in glass-card w-full max-w-md rounded-3xl p-10 text-center">
          <img
            src={logoDonPerrito}
            alt="Don Perrito"
            className="mx-auto mb-5 h-24 w-24 rounded-3xl object-cover shadow-xl ring-4 ring-orange-100"
          />

          <h1 className="text-3xl font-black">
            Carrito vacío
          </h1>

          <p className="mb-8 mt-3 text-gray-500">
            Agrega productos desde el menú para armar tu pedido.
          </p>

          <button
            onClick={() => navigate("/")}
            className="w-full rounded-2xl bg-orange-600 py-4 font-bold text-white transition hover:bg-orange-700"
          >
            Volver al menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen px-4 py-6 pb-32">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 rounded-full bg-white px-4 py-2 text-sm font-bold text-orange-700 shadow-sm transition hover:bg-orange-50"
        >
          ← Volver
        </button>

        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
              Mesa #{localStorage.getItem("mesa") || "1"}
            </p>

            <h1 className="text-3xl font-black text-gray-900">
              Tu pedido
            </h1>
          </div>

          <p className="text-sm font-semibold text-gray-500">
            {totalItems} producto{totalItems === 1 ? "" : "s"}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <section className="space-y-4">
            {carrito.map((item) => (
              <article
                key={item.id}
                className="animate-in lift-card rounded-3xl border border-white bg-white p-4 shadow-lg"
              >
                <div className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-orange-50">
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-black text-gray-900">
                          {item.nombre}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          {fmt(item.precio)} c/u
                        </p>
                      </div>

                      <button
                        onClick={() => eliminar(item.id)}
                        className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                      >
                        Quitar
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center rounded-2xl bg-gray-100 p-1">
                        <button
                          onClick={() => cambiarQty(item.id, -1)}
                          className="h-10 w-10 rounded-xl bg-white text-lg font-black shadow-sm transition hover:bg-gray-200"
                          aria-label={`Restar ${item.nombre}`}
                        >
                          -
                        </button>

                        <span className="w-12 text-center font-black">
                          {item.qty}
                        </span>

                        <button
                          onClick={() => cambiarQty(item.id, 1)}
                          className="h-10 w-10 rounded-xl bg-white text-lg font-black shadow-sm transition hover:bg-gray-200"
                          aria-label={`Sumar ${item.nombre}`}
                        >
                          +
                        </button>
                      </div>

                      <p className="text-lg font-black text-orange-600">
                        {fmt(item.precio * item.qty)}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="glass-card h-fit rounded-3xl p-5">
            <h2 className="text-xl font-black">
              Resumen
            </h2>

            <div className="mt-5">
              <p className="mb-3 text-sm font-bold text-gray-700">
                Método de pago
              </p>

              <div className="grid grid-cols-2 gap-2">
                {METODOS_PAGO.map((metodo) => (
                  <button
                    key={metodo}
                    onClick={() => setMetodoPago(metodo)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                      metodoPago === metodo
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {metodo}
                  </button>
                ))}
              </div>

              {!metodoPago && (
                <p className="mt-3 text-sm font-semibold text-orange-700">
                  Selecciona cómo vas a pagar antes de enviar el pedido.
                </p>
              )}
            </div>

            <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Productos</span>
                <span>{totalItems}</span>
              </div>

              <div className="flex items-center justify-between text-xl font-black">
                <span>Total</span>
                <span className="text-orange-600">{fmt(subtotal)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <button
              onClick={enviarPedido}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 py-4 text-lg font-black text-white shadow-lg shadow-orange-500/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-400"
            >
              {loading
                ? "Enviando..."
                : "Enviar pedido"}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
