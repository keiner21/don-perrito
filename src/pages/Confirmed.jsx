import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { socket } from "../services/socket";

import { fmt } from "../utils/format";

export default function Confirmed() {

  const navigate =
    useNavigate();

  // =========================
  // CARGAR PEDIDO
  // =========================

  const [pedido,
    setPedido,
  ] = useState(() => {

    const guardado =
      localStorage.getItem(
        "ultimoPedido"
      );

    return guardado
      ? JSON.parse(
          guardado
        )
      : null;
  });

  // =========================
  // VALIDAR PEDIDO
  // =========================

  if (!pedido) {

    return (

      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

        <div className="bg-white p-10 rounded-3xl shadow-xl text-center w-full max-w-md">

          <div className="text-7xl mb-5">
            🍔
          </div>

          <h1 className="text-3xl font-bold mb-3">
            No hay pedido activo
          </h1>

          <p className="text-gray-500 mb-6">
            Tu pedido ya fue entregado o eliminado
          </p>

          <button
            onClick={() =>
              navigate("/")
            }
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-2xl font-semibold transition"
          >
            Volver al menú
          </button>

        </div>

      </div>
    );
  }

  // =========================
  // SOCKET TIEMPO REAL
  // =========================

  useEffect(() => {

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

          localStorage.setItem(
            "ultimoPedido",
            JSON.stringify(
              pedidoActualizado
            )
          );

          // 🔥 ELIMINAR EN 5 MIN
          if (
            pedidoActualizado.estado ===
            "Listo"
          ) {

            setTimeout(() => {

              localStorage.removeItem(
                "ultimoPedido"
              );

            }, 300000); // 5 minutos
          }
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
  // MENSAJE ESTADO
  // =========================

  const mensajeEstado =
    () => {

      switch (
        pedido.estado
      ) {

        case "Pendiente":
          return "Tu pedido fue recibido correctamente";

        case "Preparando":
          return "Estamos preparando tu pedido 🍳";

        case "Listo":
          return "Tu pedido está listo ✅";

        default:
          return "";
      }
    };

  // =========================
  // PROGRESO
  // =========================

  const progreso =
    () => {

      switch (
        pedido.estado
      ) {

        case "Pendiente":
          return "33%";

        case "Preparando":
          return "66%";

        case "Listo":
          return "100%";

        default:
          return "0%";
      }
    };

  return (

    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-6">

      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg">

        {/* HEADER */}

        <div className="text-center">

          <div className="text-8xl mb-4 animate-bounce">
            🍔
          </div>

          <h1 className="text-4xl font-bold mb-2">
            Pedido #
            {
              pedido.numero
            }
          </h1>

          <p className="text-gray-500">
            Mesa #
            {
              pedido.mesa
            }
          </p>

          <p className="text-sm text-gray-400 mt-1">
            {
              new Date(
                pedido.fecha
              ).toLocaleString()
            }
          </p>

        </div>

        {/* ESTADO */}

        <div className="mt-8 text-center">

          <div
            className={`inline-block px-6 py-3 rounded-full font-bold text-sm ${colorEstado()}`}
          >
            {
              pedido.estado
            }
          </div>

          <p className="mt-4 text-lg font-medium">
            {
              mensajeEstado()
            }
          </p>

        </div>

        {/* PROGRESO */}

        <div className="mt-8">

          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

            <div
              className="bg-orange-500 h-4 rounded-full transition-all duration-500"
              style={{
                width:
                  progreso(),
              }}
            />

          </div>

          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>
              Pendiente
            </span>

            <span>
              Preparando
            </span>

            <span>
              Listo
            </span>
          </div>

        </div>

        {/* ITEMS */}

        <div className="mt-8 border-t border-b py-5 space-y-4">

          {pedido.items.map(
            (item) => (

              <div
                key={
                  item.id
                }
                className="flex justify-between items-center"
              >

                <div>

                  <p className="font-semibold">
                    {
                      item.qty
                    }x{" "}
                    {
                      item.nombre
                    }
                  </p>

                </div>

                <p className="font-bold text-orange-600">
                  {fmt(
                    item.precio *
                      item.qty
                  )}
                </p>

              </div>
            )
          )}

        </div>

        {/* TOTAL */}

        <div className="flex justify-between items-center mt-6">

          <span className="text-xl font-bold">
            Total
          </span>

          <span className="text-3xl font-bold text-orange-600">
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
            className="bg-gray-200 hover:bg-gray-300 py-4 rounded-2xl font-semibold transition"
          >
            Ver menú
          </button>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="bg-black hover:bg-gray-900 text-white py-4 rounded-2xl font-semibold transition"
          >
            Actualizar
          </button>

        </div>

      </div>

    </div>
  );
}
