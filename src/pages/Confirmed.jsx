import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { socket } from "../services/socket";

import { fmt } from "../utils/format";

export default function Confirmed() {
  const navigate =
    useNavigate();

  const { state } =
    useLocation();

  const [pedido, setPedido] =
    useState(() => {
      // primero intenta state
      if (state?.pedido) {
        return state.pedido;
      }

      // luego localStorage
      const guardado =
        localStorage.getItem(
          "ultimoPedido"
        );

      return guardado
        ? JSON.parse(guardado)
        : null;
    });

  // =========================
  // SOCKET REALTIME
  // =========================

  useEffect(() => {
    if (!pedido) return;

    socket.on(
      "pedido-actualizado",
      (
        pedidoActualizado
      ) => {
        if (
          pedidoActualizado.id ===
          pedido.id
        ) {
          setPedido(
            pedidoActualizado
          );

          // actualizar storage
          localStorage.setItem(
            "ultimoPedido",
            JSON.stringify(
              pedidoActualizado
            )
          );
        }
      }
    );

    return () => {
      socket.off(
        "pedido-actualizado"
      );
    };
  }, [pedido]);

  // =========================
  // SIN PEDIDO
  // =========================

  if (!pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center w-full max-w-md">
          <div className="text-6xl mb-4">
            🍔
          </div>

          <h1 className="text-2xl font-bold mb-4">
            No tienes pedidos
          </h1>

          <button
            onClick={() =>
              navigate("/")
            }
            className="bg-black text-white px-6 py-3 rounded-2xl"
          >
            Ir al menú
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // COLOR ESTADO
  // =========================

  const colorEstado =
    () => {
      switch (
        pedido.estado
      ) {
        case "Pendiente":
          return "bg-yellow-100 text-yellow-700";

        case "Preparando":
          return "bg-blue-100 text-blue-700";

        case "Listo":
          return "bg-green-100 text-green-700";

        default:
          return "bg-gray-100";
      }
    };

  // =========================
  // MENSAJE
  // =========================

  const mensajeEstado =
    () => {
      switch (
        pedido.estado
      ) {
        case "Pendiente":
          return "Tu pedido fue recibido 🍔";

        case "Preparando":
          return "Estamos preparando tu pedido 🍳";

        case "Listo":
          return "Tu pedido está listo ✅";

        default:
          return "";
      }
    };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-lg">

        {/* TOP */}

        <div className="text-center">

          <div className="text-7xl mb-4">
            🍔
          </div>

          <h1 className="text-3xl font-bold mb-2">
            Pedido #
            {pedido.numero}
          </h1>

          <p className="text-gray-500 mb-6">
            Mesa #{pedido.mesa}
          </p>

          {/* ESTADO */}

          <div
            className={`inline-block px-5 py-3 rounded-full font-medium text-sm mb-6 ${colorEstado()}`}
          >
            {pedido.estado}
          </div>

          <p className="text-lg font-medium mb-8">
            {mensajeEstado()}
          </p>

        </div>

        {/* ITEMS */}

        <div className="border-t border-b py-5 space-y-3">
          {pedido.items.map(
            (item) => (
              <div
                key={item.id}
                className="flex justify-between"
              >
                <span>
                  {item.qty}x{" "}
                  {item.nombre}
                </span>

                <span>
                  {fmt(
                    item.precio *
                      item.qty
                  )}
                </span>
              </div>
            )
          )}
        </div>

        {/* TOTAL */}

        <div className="flex justify-between mt-6 text-xl font-bold">
          <span>Total</span>

          <span className="text-orange-600">
            {fmt(
              pedido.total
            )}
          </span>
        </div>

        {/* BOTONES */}

        <div className="grid grid-cols-2 gap-4 mt-8">

          <button
            onClick={() =>
              navigate("/")
            }
            className="bg-gray-200 py-4 rounded-2xl font-medium"
          >
            Volver al menú
          </button>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="bg-black text-white py-4 rounded-2xl font-medium"
          >
            Actualizar
          </button>

        </div>
      </div>
    </div>
  );
}
