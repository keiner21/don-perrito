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
    eliminar,
    vaciarCarrito,
  } = useCart();

  const [metodoPago,
    setMetodoPago,
  ] = useState("Efectivo");

  // =========================
  // ENVIAR PEDIDO
  // =========================

  const enviarPedido =
    async () => {
      try {

        if (
          carrito.length === 0
        ) {
          return alert(
            "Carrito vacío"
          );
        }

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

        // 🔥 API

        const response =
          await api.post(
            "/pedidos",
            pedido
          );

        console.log(
          "RESPUESTA",
          response.data
        );

        // 🔥 GUARDAR PEDIDO

        const pedidoCreado =
          response.data;

        // 🔥 LIMPIAR

        vaciarCarrito();

        // 🔥 IR A CONFIRMED

        navigate(
          "/confirmed",
          {
            state: {
              pedido:
                pedidoCreado,
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
      }
    };

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

      {/* TITLE */}

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
                <h2 className="font-semibold">
                  {item.nombre}
                </h2>

                <p className="text-sm text-gray-500">
                  Cantidad:
                  {" "}
                  {item.qty}
                </p>

                <p className="text-orange-600 font-bold">
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
                className="bg-red-500 text-white px-3 py-2 rounded-xl"
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
              e.target
                .value
            )
          }
          className="w-full border rounded-xl p-3"
        >
          <option>
            Efectivo
          </option>

          <option>
            Nequi
          </option>

          <option>
            Daviplata
          </option>

          <option>
            Tarjeta
          </option>
        </select>

        {/* TOTAL */}

        <div className="mt-6 flex justify-between text-xl font-bold">

          <span>
            Total:
          </span>

          <span>
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
          className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl text-lg font-semibold"
        >
          Enviar Pedido
        </button>

      </div>
    </div>
  );
}
