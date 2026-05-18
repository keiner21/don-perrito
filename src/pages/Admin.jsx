import {
  useEffect,
  useState,
  useRef,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { api } from "../services/api";

import { socket } from "../services/socket";

import { fmt } from "../utils/format";

import ding from "../assets/ding.mp3";

export default function Admin() {

  const navigate =
    useNavigate();

  const [pedidos,
    setPedidos,
  ] = useState([]);

  const audioRef =
    useRef(
      new Audio(ding)
    );

  // =========================
  // DASHBOARD
  // =========================

  const ventasTotales =
    pedidos.reduce(
      (acc, p) =>
        acc + p.total,
      0
    );

  const ventasHoy =
    pedidos

      .filter((p) => {

        const hoy =
          new Date();

        const fecha =
          new Date(
            p.fecha
          );

        return (
          fecha.toDateString() ===
          hoy.toDateString()
        );
      })

      .reduce(
        (acc, p) =>
          acc + p.total,
        0
      );

  const pedidosPendientes =
    pedidos.filter(
      (p) =>
        p.estado ===
        "Pendiente"
    ).length;

  const pedidosListos =
    pedidos.filter(
      (p) =>
        p.estado ===
        "Listo"
    ).length;

  const pedidosHoy =
    pedidos.length;

  // =========================
  // SOCKETS
  // =========================

  useEffect(() => {

    cargarPedidos();

    socket.on(
      "nuevo-pedido",
      (pedido) => {

        audioRef.current.play();

        setPedidos(
          (prev) => [
            pedido,
            ...prev,
          ]
        );
      }
    );

    socket.on(
      "pedido-actualizado",
      (
        pedidoActualizado
      ) => {

        setPedidos(
          (prev) =>

            prev.map(
              (p) =>

                p.id ===
                pedidoActualizado.id

                  ? pedidoActualizado

                  : p
            )
        );
      }
    );

    return () => {

      socket.off(
        "nuevo-pedido"
      );

      socket.off(
        "pedido-actualizado"
      );
    };

  }, []);

  // =========================
  // CARGAR PEDIDOS
  // =========================

  async function cargarPedidos() {

    try {

      const response =
        await api.get(
          "/pedidos"
        );

      setPedidos(
        response.data
      );

    } catch (error) {

      console.error(
        error
      );
    }
  }

  // =========================
  // CAMBIAR ESTADO
  // =========================

  async function cambiarEstado(
    id,
    estado
  ) {

    try {

      await api.put(
        `/pedidos/${id}/estado`,
        {
          estado,
        }
      );

    } catch (error) {

      console.error(
        error
      );
    }
  }

  // =========================
  // COLORES
  // =========================

  const colorEstado = (
    estado
  ) => {

    switch (estado) {

      case "Pendiente":

        return "bg-yellow-100 text-yellow-700 border-yellow-300";

      case "Preparando":

        return "bg-blue-100 text-blue-700 border-blue-300";

      case "Listo":

        return "bg-green-100 text-green-700 border-green-300";

      case "Entregado":

        return "bg-gray-200 text-gray-700 border-gray-300";

      default:

        return "bg-gray-100";
    }
  };

  // =========================
  // LOGOUT
  // =========================

  function logout() {

    localStorage.removeItem(
      "token"
    );

    navigate("/login");
  }

  return (

    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-10">

          <div>

            <h1 className="text-5xl font-black text-orange-600">
              🍔 Don Perrito
            </h1>

            <p className="text-gray-500 mt-2 text-lg">
              Dashboard en tiempo real
            </p>

          </div>

          <div className="flex gap-3">

            <div className="bg-green-100 text-green-700 px-5 py-3 rounded-2xl font-semibold shadow">
              🟢 Online
            </div>

            <button
              onClick={
                logout
              }
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-semibold transition shadow-lg"
            >
              Cerrar sesión
            </button>

          </div>

        </div>

        {/* DASHBOARD */}

        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 gap-5 mb-10">

          {/* VENTAS HOY */}

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-2xl">

            <p className="opacity-80 text-sm">
              Ventas Hoy
            </p>

            <h2 className="text-4xl font-black mt-3">
              {fmt(
                ventasHoy
              )}
            </h2>

          </div>

          {/* VENTAS */}

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-2xl">

            <p className="opacity-80 text-sm">
              Ventas Totales
            </p>

            <h2 className="text-4xl font-black mt-3">
              {fmt(
                ventasTotales
              )}
            </h2>

          </div>

          {/* PEDIDOS */}

          <div className="bg-white rounded-3xl p-6 shadow-xl">

            <p className="text-gray-500 text-sm">
              Pedidos
            </p>

            <h2 className="text-4xl font-black mt-3">
              {
                pedidosHoy
              }
            </h2>

          </div>

          {/* PENDIENTES */}

          <div className="bg-white rounded-3xl p-6 shadow-xl">

            <p className="text-gray-500 text-sm">
              Pendientes
            </p>

            <h2 className="text-4xl font-black text-yellow-500 mt-3">
              {
                pedidosPendientes
              }
            </h2>

          </div>

          {/* LISTOS */}

          <div className="bg-white rounded-3xl p-6 shadow-xl">

            <p className="text-gray-500 text-sm">
              Listos
            </p>

            <h2 className="text-4xl font-black text-blue-600 mt-3">
              {
                pedidosListos
              }
            </h2>

          </div>

        </div>

        {/* PEDIDOS */}

        {pedidos.length === 0 ? (

          <div className="bg-white rounded-3xl p-14 text-center shadow-xl">

            <div className="text-7xl mb-5">
              🍔
            </div>

            <p className="text-gray-500 text-xl">
              No hay pedidos
            </p>

          </div>

        ) : (

          <div className="grid gap-6">

            {pedidos.map(
              (pedido) => (

                <div
                  key={
                    pedido.id
                  }
                  className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200"
                >

                  {/* TOP */}

                  <div className="bg-black text-white p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                    <div>

                      <h2 className="text-3xl font-black">
                        Pedido #
                        {
                          pedido.numero
                        }
                      </h2>

                      <p className="text-gray-300 mt-1">
                        Mesa #
                        {
                          pedido.mesa
                        }
                      </p>

                    </div>

                    <div
                      className={`px-5 py-3 rounded-2xl border text-sm font-bold w-fit ${colorEstado(
                        pedido.estado
                      )}`}
                    >
                      {
                        pedido.estado
                      }
                    </div>

                  </div>

                  {/* BODY */}

                  <div className="p-6">

                    {/* ITEMS */}

                    <div className="space-y-4">

                      {pedido.items.map(
                        (
                          item
                        ) => (

                          <div
                            key={
                              item.id
                            }
                            className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center"
                          >

                            <div>

                              <p className="font-bold text-lg">
                                {
                                  item.nombre
                                }
                              </p>

                              <p className="text-gray-500 text-sm">
                                Cantidad:
                                {" "}
                                {
                                  item.qty
                                }
                              </p>

                            </div>

                            <div className="text-orange-600 font-black text-xl">
                              {fmt(
                                item.precio *
                                  item.qty
                              )}
                            </div>

                          </div>
                        )
                      )}

                    </div>

                    {/* INFO */}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">

                      <div className="bg-gray-50 rounded-2xl p-4">

                        <p className="text-gray-500 text-sm">
                          Método pago
                        </p>

                        <p className="font-bold text-lg mt-1">
                          {
                            pedido.metodo
                          }
                        </p>

                      </div>

                      <div className="bg-gray-50 rounded-2xl p-4">

                        <p className="text-gray-500 text-sm">
                          Fecha
                        </p>

                        <p className="font-bold mt-1">
                          {new Date(
                            pedido.fecha
                          ).toLocaleString()}
                        </p>

                      </div>

                      <div className="bg-orange-50 rounded-2xl p-4">

                        <p className="text-orange-500 text-sm">
                          Total
                        </p>

                        <p className="text-3xl font-black text-orange-600 mt-1">
                          {fmt(
                            pedido.total
                          )}
                        </p>

                      </div>

                    </div>

                    {/* BOTONES */}

                    <div className="flex flex-wrap gap-3 mt-8">

                      <button
                        onClick={() =>
                          cambiarEstado(
                            pedido.id,
                            "Pendiente"
                          )
                        }
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-3 rounded-2xl font-semibold transition shadow"
                      >
                        Pendiente
                      </button>

                      <button
                        onClick={() =>
                          cambiarEstado(
                            pedido.id,
                            "Preparando"
                          )
                        }
                        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-2xl font-semibold transition shadow"
                      >
                        Preparando
                      </button>

                      <button
                        onClick={() =>
                          cambiarEstado(
                            pedido.id,
                            "Listo"
                          )
                        }
                        className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-2xl font-semibold transition shadow"
                      >
                        Listo
                      </button>

                      <button
                        onClick={() =>
                          cambiarEstado(
                            pedido.id,
                            "Entregado"
                          )
                        }
                        className="bg-gray-800 hover:bg-black text-white px-5 py-3 rounded-2xl font-semibold transition shadow"
                      >
                        Entregado
                      </button>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}
