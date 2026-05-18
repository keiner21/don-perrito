import { useState } from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useCart,
} from "../context/CartContext";

import { fmt } from "../utils/format";

import { api } from "../services/api";

export default function Cart() {

  const navigate =
    useNavigate();

  const {
    carrito,
    subtotal,
    limpiarCarrito,
  } = useCart();

  const [metodoPago,
    setMetodoPago,
  ] = useState("Efectivo");

  const [loading,
    setLoading,
  ] = useState(false);

  // =========================
  // ELIMINAR ITEM
  // =========================

  const eliminar =
    (id) => {

      const nuevo =
        carrito.filter(
          (item) =>
            item.id !== id
        );

      localStorage.setItem(
        "carrito",
        JSON.stringify(
          nuevo
        )
      );

      window.location.reload();
    };

  // =========================
  // ENVIAR PEDIDO
  // =========================

  async function enviarPedido() {

    try {

      if (
        carrito.length === 0
      ) {
        alert(
          "Carrito vacío"
        );

        return;
      }

      setLoading(true);

      const pedido = {

        mesa:
          localStorage.getItem(
            "mesa"
          ) || "1",

        metodo:
          metodoPago,

        total:
          subtotal,

        items:
          carrito,
      };

      console.log(
        "ENVIANDO",
        pedido
      );

      const response =
        await api.post(
          "/pedidos",
          pedido
        );

      console.log(
        response.data
      );

      // =========================
      // GUARDAR PEDIDO
      // =========================

      localStorage.setItem(
        "ultimoPedido",
        JSON.stringify(
          response.data
        )
      );

      // =========================
      // LIMPIAR
      // =========================

      limpiarCarrito();

      localStorage.removeItem(
        "carrito"
      );

      // =========================
      // REDIRECT
      // =========================

      navigate(
        "/confirmed",
        {
          state: {
            pedido:
              response.data,
          },
        }
      );

    } catch (error) {

      console.log(error);

      alert(
        JSON.stringify(
          error.response
            ?.data ||
            error.message
        )
      );

    } finally {

      setLoading(false);
    }
  }

  // =========================
  // CARRITO VACIO
  // =========================

  if (carrito.length === 0) {

    return (

      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

        <div className="bg-white rounded-3xl shadow-xl p-10 text-center w-full max-w-md">

          <div className="text-7xl mb-5">
            🛒
          </div>

          <h1 className="text-3xl font-bold mb-3">
            Carrito vacío
          </h1>

          <p className="text-gray-500 mb-8">
            Agrega productos al pedido
          </p>

          <button
            onClick={() =>
              navigate("/")
            }
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-semibold transition"
          >
            Volver al menú
          </button>

        </div>

      </div>
    );
  }

  return (

    <div className="max-w-md mx-auto p-4 pb-32">

      {/* VOLVER */}

      <button
        onClick={() =>
          navigate(-1)
        }
        className="mb-4 text-orange-600"
      >
        ← Volver
      </button>

      {/* TITULO */}

      <h1 className="text-3xl font-bold mb-6">
        Tu Pedido
      </h1>

      {/* ITEMS */}

      <div className="flex flex-col gap-4">

        {carrito.map(
          (item) => (

            <div
              key={item.id}
              className="bg-white p-4 rounded-2xl shadow flex justify-between items-center"
            >

              <div>

                <h2 className="font-semibold text-lg">
                  {item.nombre}
                </h2>

                <p className="text-sm text-gray-500">
                  Cantidad:
                  {" "}
                  {item.qty}
                </p>

                <p className="text-orange-600 font-bold mt-1">
                  {fmt(
                    item.precio *
                      item.qty
                  )}
                </p>

              </div>

              <button
                onClick={() =>
                  eliminar(
                    item.id
                  )
                }
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition"
              >
                X
              </button>

            </div>

          )
        )}

      </div>

      {/* PAGO */}

      <div className="mt-8 bg-white p-5 rounded-2xl shadow">

        <h2 className="font-bold text-xl mb-4">
          Método de Pago
        </h2>

        <select
          value={
            metodoPago
          }
          onChange={(e) =>
            setMetodoPago(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-3"
        >

          <option value="Efectivo">
            Efectivo
          </option>

          <option value="Nequi">
            Nequi
          </option>

          <option value="Daviplata">
            Daviplata
          </option>

          <option value="Tarjeta">
            Tarjeta
          </option>

        </select>

        {/* TOTAL */}

        <div className="mt-6 flex justify-between text-xl font-bold">

          <span>
            Total:
          </span>

          <span className="text-orange-600">
            {fmt(
              subtotal
            )}
          </span>

        </div>

        {/* BTN */}

        <button
          onClick={
            enviarPedido
          }
          disabled={loading}
          className="w-full mt-6 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-4 rounded-2xl text-lg font-semibold transition"
        >

          {loading
            ? "Enviando..."
            : "Enviar Pedido"}

        </button>

      </div>

    </div>
  );
}
