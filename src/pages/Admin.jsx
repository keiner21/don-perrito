import {
  useEffect,
  useState,
  useRef,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import * as XLSX from "xlsx";

import jsPDF from "jspdf";

import "jspdf-autotable";

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

  const [busqueda,
    setBusqueda,
  ] = useState("");

  const [fechaFiltro,
    setFechaFiltro,
  ] = useState("");

  const audioRef =
    useRef(
      new Audio(ding)
    );

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
  // CARGAR
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

      console.log(
        error
      );
    }
  }

  // =========================
  // LOGOUT
  // =========================

  function logout() {

    localStorage.removeItem(
      "token"
    );

    navigate("/login");
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

      console.log(
        error
      );
    }
  }

  // =========================
  // FILTROS
  // =========================

  const pedidosFiltrados =
    pedidos.filter(
      (pedido) => {

        const coincideBusqueda =

          pedido.numero
            .toString()

            .includes(
              busqueda
            )

          ||

          pedido.mesa
            .toString()

            .includes(
              busqueda
            );

        const coincideFecha =

          fechaFiltro === ""

          ||

          new Date(
            pedido.fecha
          )

            .toISOString()

            .split("T")[0]

            === fechaFiltro;

        return (
          coincideBusqueda &&
          coincideFecha
        );
      }
    );

  // =========================
  // ESTADISTICAS
  // =========================

  const ventasTotales =
    pedidosFiltrados.reduce(
      (acc, p) =>
        acc + p.total,
      0
    );

  const pedidosPendientes =
    pedidosFiltrados.filter(
      (p) =>
        p.estado ===
        "Pendiente"
    ).length;

  const pedidosListos =
    pedidosFiltrados.filter(
      (p) =>
        p.estado ===
        "Listo"
    ).length;

  const ventasPorDia =
    Object.values(

      pedidos.reduce(
        (acc, pedido) => {

          const fecha =
            new Date(
              pedido.fecha
            )

              .toLocaleDateString();

          if (
            !acc[fecha]
          ) {

            acc[fecha] = {
              fecha,
              total: 0,
            };
          }

          acc[fecha].total +=
            pedido.total;

          return acc;

        },
        {}
      )
    );

  // =========================
  // AGRUPAR
  // =========================

  const pedidosAgrupados =
    pedidosFiltrados.reduce(
      (acc, pedido) => {

        const fecha =
          new Date(
            pedido.fecha
          );

        const key =
          fecha.toLocaleDateString(
            "es-CO",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            }
          );

        if (!acc[key]) {
          acc[key] = [];
        }

        acc[key].push(
          pedido
        );

        return acc;

      },
      {}
    );

  // =========================
  // EXPORTAR EXCEL
  // =========================

  function exportarExcel() {

    const data =
      pedidosFiltrados.map(
        (p) => ({
          Pedido:
            p.numero,
          Mesa:
            p.mesa,
          Estado:
            p.estado,
          Total:
            p.total,
          Metodo:
            p.metodo,
          Fecha:
            new Date(
              p.fecha
            ).toLocaleString(),
        })
      );

    const ws =
      XLSX.utils.json_to_sheet(
        data
      );

    const wb =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Ventas"
    );

    XLSX.writeFile(
      wb,
      "ventas.xlsx"
    );
  }

  // =========================
  // EXPORTAR PDF
  // =========================

  function exportarPDF() {

    const doc =
      new jsPDF();

    doc.text(
      "Reporte Ventas",
      14,
      20
    );

    doc.autoTable({
      startY: 30,

      head: [[
        "Pedido",
        "Mesa",
        "Estado",
        "Total",
      ]],

      body:
        pedidosFiltrados.map(
          (p) => [
            p.numero,
            p.mesa,
            p.estado,
            fmt(
              p.total
            ),
          ]
        ),
    });

    doc.save(
      "ventas.pdf"
    );
  }

  // =========================
  // COLORES
  // =========================

  const colorEstado = (
    estado
  ) => {

    switch (estado) {

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

  return (

    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row justify-between gap-5 mb-8">

          <div>

            <h1 className="text-5xl font-black text-orange-600">
              🍔 Dashboard
            </h1>

            <p className="text-gray-500 mt-2">
              Gestión completa
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={
                exportarExcel
              }
              className="bg-green-600 text-white px-5 py-3 rounded-2xl"
            >
              Excel
            </button>

            <button
              onClick={
                exportarPDF
              }
              className="bg-red-600 text-white px-5 py-3 rounded-2xl"
            >
              PDF
            </button>

            <button
              onClick={
                logout
              }
              className="bg-black text-white px-5 py-3 rounded-2xl"
            >
              Salir
            </button>

          </div>

        </div>

        {/* FILTROS */}

        <div className="bg-white p-5 rounded-3xl shadow-lg mb-8 grid md:grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Buscar mesa o pedido"
            value={
              busqueda
            }
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
            className="border p-4 rounded-2xl"
          />

          <input
            type="date"
            value={
              fechaFiltro
            }
            onChange={(e) =>
              setFechaFiltro(
                e.target.value
              )
            }
            className="border p-4 rounded-2xl"
          />

        </div>

        {/* DASHBOARD */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">

          <div className="bg-green-500 text-white rounded-3xl p-6 shadow-xl">
            <p>Ventas</p>

            <h2 className="text-4xl font-black mt-3">
              {fmt(
                ventasTotales
              )}
            </h2>
          </div>

          <div className="bg-yellow-500 text-white rounded-3xl p-6 shadow-xl">
            <p>Pendientes</p>

            <h2 className="text-4xl font-black mt-3">
              {
                pedidosPendientes
              }
            </h2>
          </div>

          <div className="bg-blue-500 text-white rounded-3xl p-6 shadow-xl">
            <p>Listos</p>

            <h2 className="text-4xl font-black mt-3">
              {
                pedidosListos
              }
            </h2>
          </div>

        </div>

        {/* GRAFICA */}

        <div className="bg-white rounded-3xl shadow-lg p-6 mb-10">

          <h2 className="text-2xl font-black mb-6">
            📈 Ventas por día
          </h2>

          <div className="h-80">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={
                  ventasPorDia
                }
              >

                <XAxis
                  dataKey="fecha"
                />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="total"
                  radius={[
                    10,
                    10,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* PEDIDOS */}

        {Object.entries(
          pedidosAgrupados
        ).map(
          ([dia,
            pedidosDia]) => (

            <div
              key={dia}
              className="mb-10"
            >

              <h2 className="text-3xl font-black mb-5">
                📅 {dia}
              </h2>

              <div className="grid gap-5">

                {pedidosDia.map(
                  (pedido) => (

                    <div
                      key={
                        pedido.id
                      }
                      className="bg-white rounded-3xl shadow-lg p-6"
                    >

                      <div className="flex justify-between items-center mb-5">

                        <div>

                          <h2 className="text-2xl font-black">
                            Pedido #
                            {
                              pedido.numero
                            }
                          </h2>

                          <p className="text-gray-500">
                            Mesa #
                            {
                              pedido.mesa
                            }
                          </p>

                        </div>

                        <div
                          className={`px-5 py-2 rounded-full font-semibold ${colorEstado(
                            pedido.estado
                          )}`}
                        >
                          {
                            pedido.estado
                          }
                        </div>

                      </div>

                      <div className="space-y-3">

                        {pedido.items.map(
                          (
                            item
                          ) => (

                            <div
                              key={
                                item.id
                              }
                              className="flex justify-between bg-gray-50 p-4 rounded-2xl"
                            >

                              <div>

                                <p className="font-bold">
                                  {
                                    item.nombre
                                  }
                                </p>

                                <p className="text-sm text-gray-500">
                                  Cantidad:
                                  {" "}
                                  {
                                    item.qty
                                  }
                                </p>

                              </div>

                              <p className="font-black text-orange-600">
                                {fmt(
                                  item.qty *
                                    item.precio
                                )}
                              </p>

                            </div>
                          )
                        )}

                      </div>

                      <div className="flex flex-wrap gap-3 mt-6">

                        <button
                          onClick={() =>
                            cambiarEstado(
                              pedido.id,
                              "Pendiente"
                            )
                          }
                          className="bg-yellow-500 text-white px-4 py-3 rounded-2xl"
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
                          className="bg-blue-500 text-white px-4 py-3 rounded-2xl"
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
                          className="bg-green-500 text-white px-4 py-3 rounded-2xl"
                        >
                          Listo
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>

            </div>
          )
        )}

      </div>

    </div>
  );
}
