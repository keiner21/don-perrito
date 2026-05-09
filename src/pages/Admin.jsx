import {
  useEffect,
  useState,
  useRef,
} from "react";

import { api } from "../services/api";

import { socket } from "../services/socket";

import { fmt } from "../utils/format";

import ding from "../assets/ding.mp3";

export default function Admin() {
  const [pedidos, setPedidos] =
    useState([]);

  const audioRef = useRef(
    new Audio(ding)
  );

  // =========================
  // DASHBOARD
  // =========================

  const ventasTotales =
    pedidos.reduce(
      (acc, p) => acc + p.total,
      0
    );

  const pedidosPendientes =
    pedidos.filter(
      (p) =>
        p.estado ===
        "Pendiente"
    ).length;

  const pedidosHoy =
    pedidos.length;

  const pedidosListos =
    pedidos.filter(
      (p) =>
        p.estado === "Listo"
    ).length;

  // =========================
  // SOCKETS
  // =========================

  useEffect(() => {
    cargarPedidos();

    socket.on(
      "nuevo-pedido",
      (pedido) => {

        // 🔔 sonido
        audioRef.current.play();

        // agregar realtime
        setPedidos((prev) => [
          pedido,
          ...prev,
        ]);
      }
    );

    socket.on(
      "pedido-actualizado",
      (pedidoActualizado) => {

        setPedidos((prev) =>
          prev.map((p) =>
            p.id ===
            pedidoActualizado.id
              ? pedidoActualizado
              : p
          )
        );
      }
    );

    return () => {
      socket.off("nuevo-pedido");

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
        await api.get("/pedidos");

      setPedidos(response.data);
    } catch (error) {
      console.error(error);
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
      console.error(error);
    }
  }

  // =========================
  // COLORES ESTADO
  // =========================

  const colorEstado = (estado) => {
    switch (estado) {
      case "Pendiente":
        return "bg-yellow-100 text-yellow-700";

      case "Preparando":
        return "bg-blue-100 text-blue-700";

      case "Listo":
        return "bg-green-100 text-green-700";

      case "Entregado":
        return "bg-gray-200 text-gray-700";

      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">

          <div>
            <h1 className="text-4xl font-bold text-orange-600">
              🍔 Panel Admin
            </h1>

            <p className="text-gray-500 mt-1">
              Gestión en tiempo real
            </p>
          </div>

          <div className="bg-green-100 text-green-700 px-5 py-3 rounded-2xl font-medium">
            🟢 Sistema Online
          </div>

        </div>

        {/* DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">

          {/* VENTAS */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <p className="text-gray-500 text-sm">
              Ventas Totales
            </p>

            <h2 className="text-3xl font-bold text-green-600 mt-3">
              {fmt(ventasTotales)}
            </h2>
          </div>

          {/* PEDIDOS */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <p className="text-gray-500 text-sm">
              Pedidos
            </p>

            <h2 className="text-3xl font-bold text-orange-600 mt-3">
              {pedidosHoy}
            </h2>
          </div>

          {/* PENDIENTES */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <p className="text-gray-500 text-sm">
              Pendientes
            </p>

            <h2 className="text-3xl font-bold text-yellow-500 mt-3">
              {pedidosPendientes}
            </h2>
          </div>

          {/* LISTOS */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <p className="text-gray-500 text-sm">
              Listos
            </p>

            <h2 className="text-3xl font-bold text-blue-600 mt-3">
              {pedidosListos}
            </h2>
          </div>

        </div>

        {/* PEDIDOS */}
        {pedidos.length === 0 ? (

          <div className="bg-white rounded-3xl p-12 text-center shadow-lg">
            <div className="text-6xl mb-4">
              🍔
            </div>

            <p className="text-gray-500 text-lg">
              No hay pedidos
            </p>
          </div>

        ) : (

          <div className="grid gap-6">

            {pedidos.map(
              (pedido) => (

                <div
                  key={pedido.id}
                  className="bg-white rounded-3xl shadow-lg p-6"
                >

                  {/* HEADER PEDIDO */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

                    <div>
                      <h2 className="text-2xl font-bold">
                        Pedido #
                        {pedido.numero}
                      </h2>

                      <p className="text-gray-500">
                        Mesa #{pedido.mesa}
                      </p>
                    </div>

                    <div
                      className={`px-5 py-2 rounded-full text-sm font-medium w-fit ${colorEstado(
                        pedido.estado
                      )}`}
                    >
                      {pedido.estado}
                    </div>

                  </div>

                  {/* ITEMS */}
                  <div className="border-t border-b py-4 space-y-3">

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

                          <span className="font-medium">
                            {fmt(
                              item.precio *
                                item.qty
                            )}
                          </span>
                        </div>

                      )
                    )}

                  </div>

                  {/* FOOTER */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mt-6">

                    {/* INFO */}
                    <div className="flex flex-col gap-2">

                      <div>
                        <p className="text-gray-500 text-sm">
                          Método pago
                        </p>

                        <p className="font-semibold">
                          {pedido.metodo}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500 text-sm">
                          Fecha
                        </p>

                        <p className="font-semibold">
                          {new Date(
                            pedido.fecha
                          ).toLocaleString()}
                        </p>
                      </div>

                    </div>

                    {/* TOTAL */}
                    <div>
                      <p className="text-gray-500 text-sm">
                        Total
                      </p>

                      <p className="text-3xl font-bold text-orange-600">
                        {fmt(
                          pedido.total
                        )}
                      </p>
                    </div>

                    {/* BOTONES */}
                    <div className="flex flex-wrap gap-2">

                      <button
                        onClick={() =>
                          cambiarEstado(
                            pedido.id,
                            "Pendiente"
                          )
                        }
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl transition"
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
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition"
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
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition"
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
                        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition"
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
