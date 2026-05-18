import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import * as XLSX from "xlsx";

import jsPDF from "jspdf";

import "jspdf-autotable";

import ding from "../assets/ding.mp3";

import { api } from "../services/api";

import { socket } from "../services/socket";

import { fmt } from "../utils/format";

const ESTADOS = ["Todos", "Pendiente", "Preparando", "Listo"];

const estadoClasses = {
  Pendiente: "bg-amber-100 text-amber-800 border-amber-200",
  Preparando: "bg-sky-100 text-sky-800 border-sky-200",
  Listo: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function Admin() {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const audioRef = useRef(new Audio(ding));

  useEffect(() => {
    cargarPedidos();

    socket.on("nuevo-pedido", (pedido) => {
      audioRef.current.play().catch(() => {});
      setPedidos((prev) => [pedido, ...prev]);
    });

    socket.on("pedido-actualizado", (pedidoActualizado) => {
      setPedidos((prev) =>
        prev.map((pedido) =>
          pedido.id === pedidoActualizado.id ? pedidoActualizado : pedido
        )
      );
    });

    return () => {
      socket.off("nuevo-pedido");
      socket.off("pedido-actualizado");
    };
  }, []);

  async function cargarPedidos() {
    try {
      setError("");
      setLoading(true);

      const response = await api.get("/pedidos");
      setPedidos(response.data);
    } catch {
      setError("No pudimos cargar los pedidos. Revisa el servidor.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  async function cambiarEstado(id, estado) {
    const estadoAnterior = pedidos;

    setPedidos((prev) =>
      prev.map((pedido) => (pedido.id === id ? { ...pedido, estado } : pedido))
    );

    try {
      await api.put(`/pedidos/${id}/estado`, { estado });
    } catch {
      setPedidos(estadoAnterior);
      setError("No pudimos actualizar el estado del pedido.");
    }
  }

  const pedidosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return pedidos.filter((pedido) => {
      const coincideBusqueda =
        termino === "" ||
        pedido.numero.toString().includes(termino) ||
        pedido.mesa.toString().includes(termino) ||
        pedido.items.some((item) => item.nombre.toLowerCase().includes(termino));

      const coincideFecha =
        fechaFiltro === "" ||
        new Date(pedido.fecha).toISOString().split("T")[0] === fechaFiltro;

      const coincideEstado =
        estadoFiltro === "Todos" || pedido.estado === estadoFiltro;

      return coincideBusqueda && coincideFecha && coincideEstado;
    });
  }, [busqueda, fechaFiltro, estadoFiltro, pedidos]);

  const resumen = useMemo(() => {
    const ventasTotales = pedidosFiltrados.reduce(
      (acc, pedido) => acc + pedido.total,
      0
    );

    return {
      ventasTotales,
      totalPedidos: pedidosFiltrados.length,
      pendientes: pedidosFiltrados.filter((p) => p.estado === "Pendiente")
        .length,
      preparando: pedidosFiltrados.filter((p) => p.estado === "Preparando")
        .length,
      listos: pedidosFiltrados.filter((p) => p.estado === "Listo").length,
    };
  }, [pedidosFiltrados]);

  const ventasPorDia = useMemo(() => {
    const acumulado = pedidosFiltrados.reduce((acc, pedido) => {
      const fecha = new Date(pedido.fecha).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
      });

      if (!acc[fecha]) {
        acc[fecha] = { fecha, total: 0 };
      }

      acc[fecha].total += pedido.total;
      return acc;
    }, {});

    return Object.values(acumulado);
  }, [pedidosFiltrados]);

  const pedidosAgrupados = useMemo(
    () =>
      pedidosFiltrados.reduce((acc, pedido) => {
        const key = new Date(pedido.fecha).toLocaleDateString("es-CO", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        if (!acc[key]) {
          acc[key] = [];
        }

        acc[key].push(pedido);
        return acc;
      }, {}),
    [pedidosFiltrados]
  );

  function exportarExcel() {
    const data = pedidosFiltrados.map((pedido) => ({
      Pedido: pedido.numero,
      Mesa: pedido.mesa,
      Estado: pedido.estado,
      Total: pedido.total,
      Metodo: pedido.metodo,
      Fecha: new Date(pedido.fecha).toLocaleString("es-CO"),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, "ventas-don-perrito.xlsx");
  }

  function exportarPDF() {
    const doc = new jsPDF();

    doc.text("Reporte de ventas - Don Perrito", 14, 20);

    doc.autoTable({
      startY: 30,
      head: [["Pedido", "Mesa", "Estado", "Metodo", "Total"]],
      body: pedidosFiltrados.map((pedido) => [
        pedido.numero,
        pedido.mesa,
        pedido.estado,
        pedido.metodo,
        fmt(pedido.total),
      ]),
    });

    doc.save("ventas-don-perrito.pdf");
  }

  return (
    <div className="min-h-screen bg-stone-100 p-4 text-gray-900 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
              Panel administrativo
            </p>

            <h1 className="text-4xl font-black text-gray-950">
              Pedidos y ventas
            </h1>

            <p className="mt-1 text-gray-500">
              Controla estados, exporta reportes y revisa el movimiento del día.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={cargarPedidos}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-bold shadow-sm transition hover:bg-gray-50"
            >
              Actualizar
            </button>

            <button
              onClick={exportarExcel}
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Excel
            </button>

            <button
              onClick={exportarPDF}
              className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            >
              PDF
            </button>

            <button
              onClick={logout}
              className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-black"
            >
              Salir
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="mb-6 grid gap-3 rounded-3xl bg-white p-4 shadow-lg md:grid-cols-[1fr_auto_auto]">
          <input
            type="search"
            placeholder="Buscar pedido, mesa o producto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />

          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-3 font-semibold outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          >
            {ESTADOS.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Ventas" value={fmt(resumen.ventasTotales)} />
          <Metric label="Pedidos" value={resumen.totalPedidos} />
          <Metric label="Pendientes" value={resumen.pendientes} tone="amber" />
          <Metric label="Preparando" value={resumen.preparando} tone="sky" />
          <Metric label="Listos" value={resumen.listos} tone="emerald" />
        </section>

        <section className="mb-8 rounded-3xl bg-white p-5 shadow-lg">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-xl font-black">
              Ventas filtradas por día
            </h2>

            <span className="text-sm font-semibold text-gray-500">
              {pedidosFiltrados.length} resultado
              {pedidosFiltrados.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="h-72">
            {ventasPorDia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ventasPorDia}>
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmt(value)} />
                  <Bar dataKey="total" fill="#f97316" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl bg-gray-50 text-sm font-semibold text-gray-500">
                No hay ventas para estos filtros.
              </div>
            )}
          </div>
        </section>

        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center font-bold text-gray-500 shadow">
            Cargando pedidos...
          </div>
        ) : Object.keys(pedidosAgrupados).length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow">
            <h2 className="text-2xl font-black">
              No hay pedidos
            </h2>

            <p className="mt-2 text-gray-500">
              Ajusta los filtros o espera un nuevo pedido.
            </p>
          </div>
        ) : (
          Object.entries(pedidosAgrupados).map(([dia, pedidosDia]) => (
            <section key={dia} className="mb-8">
              <h2 className="mb-4 text-2xl font-black capitalize">
                {dia}
              </h2>

              <div className="grid gap-4">
                {pedidosDia.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    onCambiarEstado={cambiarEstado}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, tone = "orange" }) {
  const tones = {
    orange: "bg-orange-600",
    amber: "bg-amber-500",
    sky: "bg-sky-500",
    emerald: "bg-emerald-600",
  };

  return (
    <div className={`${tones[tone]} rounded-3xl p-5 text-white shadow-lg`}>
      <p className="text-sm font-bold uppercase tracking-wide opacity-80">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}

function PedidoCard({ pedido, onCambiarEstado }) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-black">
              Pedido #{pedido.numero}
            </h3>

            <span
              className={`rounded-full border px-4 py-2 text-sm font-black ${
                estadoClasses[pedido.estado] || "border-gray-200 bg-gray-100"
              }`}
            >
              {pedido.estado}
            </span>
          </div>

          <p className="mt-2 text-sm font-semibold text-gray-500">
            Mesa #{pedido.mesa} - {pedido.metodo} -{" "}
            {new Date(pedido.fecha).toLocaleTimeString("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <p className="text-2xl font-black text-orange-600">
          {fmt(pedido.total)}
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {pedido.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-2xl bg-gray-50 p-4"
          >
            <div>
              <p className="font-black">
                {item.qty}x {item.nombre}
              </p>

              <p className="text-sm text-gray-500">
                {fmt(item.precio)} c/u
              </p>
            </div>

            <p className="font-black text-orange-600">
              {fmt(item.qty * item.precio)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {ESTADOS.filter((estado) => estado !== "Todos").map((estado) => (
          <button
            key={estado}
            onClick={() => onCambiarEstado(pedido.id, estado)}
            disabled={pedido.estado === estado}
            className={`rounded-2xl px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed ${
              pedido.estado === estado
                ? "bg-gray-100 text-gray-400"
                : "bg-zinc-950 text-white hover:bg-black"
            }`}
          >
            {estado}
          </button>
        ))}
      </div>
    </article>
  );
}
