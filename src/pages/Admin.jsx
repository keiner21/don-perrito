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

import ding from "../assets/ding.mp3";

import logoDonPerrito from "../assets/logo-don-perrito.png";

import { api } from "../services/api";

import { socket } from "../services/socket";

import { fmt } from "../utils/format";

const ESTADOS = ["Todos", "Pendiente", "Preparando", "Listo"];
const VISTAS = ["Pedidos", "Informe"];

const estadoClasses = {
  Pendiente: "border-amber-200 bg-amber-100 text-amber-800",
  Preparando: "border-sky-200 bg-sky-100 text-sky-800",
  Listo: "border-emerald-200 bg-emerald-100 text-emerald-800",
};

export default function Admin() {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [diaActivo, setDiaActivo] = useState(getTodayKey());
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [vistaActiva, setVistaActiva] = useState("Pedidos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sonidoActivo, setSonidoActivo] = useState(false);

  const audioRef = useRef(new Audio(ding));
  const audioContextRef = useRef(null);
  const sonidoActivoRef = useRef(sonidoActivo);
  const reproducirSonidoPedidoRef = useRef(null);

  reproducirSonidoPedidoRef.current = reproducirSonidoPedido;

  useEffect(() => {
    sonidoActivoRef.current = sonidoActivo;
  }, [sonidoActivo]);

  useEffect(() => {
    audioRef.current.preload = "auto";
    audioRef.current.volume = 0.9;
  }, []);

  useEffect(() => {
    cargarPedidos();

    socket.on("nuevo-pedido", (pedido) => {
      if (sonidoActivoRef.current) {
        reproducirSonidoPedidoRef.current?.();
      }

      setPedidos((prev) => [pedido, ...prev]);
      setDiaActivo(getDateKey(pedido.fecha));
      setVistaActiva("Pedidos");
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

  async function activarSonido() {
    try {
      await desbloquearAudio();
      await reproducirSonidoPedido();
      setSonidoActivo(true);
      setError("");
    } catch {
      setError("No pudimos activar el sonido. Revisa permisos del navegador.");
    }
  }

  async function desbloquearAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (AudioContext && !audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }

    audioRef.current.muted = true;
    audioRef.current.currentTime = 0;

    await audioRef.current.play();
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.muted = false;
  }

  async function reproducirSonidoPedido() {
    try {
      const audio = new Audio(ding);
      audio.volume = 1;
      await audio.play();
    } catch {
      reproducirBeepRespaldo();
    }
  }

  function reproducirBeepRespaldo() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    const context = audioContextRef.current || new AudioContext();
    audioContextRef.current = context;

    if (context.state === "suspended") {
      context.resume();
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.setValueAtTime(660, context.currentTime + 0.18);

    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);
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

  const diasDisponibles = useMemo(() => {
    const keys = [...new Set(pedidos.map((pedido) => getDateKey(pedido.fecha)))];

    return keys.sort((a, b) => dateFromKey(b) - dateFromKey(a));
  }, [pedidos]);

  const pedidosDelDia = useMemo(
    () => pedidos.filter((pedido) => getDateKey(pedido.fecha) === diaActivo),
    [diaActivo, pedidos]
  );

  const pedidosOperativos = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return pedidosDelDia.filter((pedido) => {
      const coincideBusqueda =
        termino === "" ||
        pedido.numero.toString().includes(termino) ||
        pedido.mesa.toString().includes(termino) ||
        pedido.items.some((item) => item.nombre.toLowerCase().includes(termino));

      const coincideEstado =
        estadoFiltro === "Todos" || pedido.estado === estadoFiltro;

      return coincideBusqueda && coincideEstado;
    });
  }, [busqueda, estadoFiltro, pedidosDelDia]);

  const resumenDia = useMemo(() => getResumen(pedidosDelDia), [pedidosDelDia]);
  const resumenTotal = useMemo(() => getResumen(pedidos), [pedidos]);

  const ventasPorDia = useMemo(() => {
    const acumulado = pedidos.reduce((acc, pedido) => {
      const key = getDateKey(pedido.fecha);

      if (!acc[key]) {
        acc[key] = {
          fecha: formatShortDate(key),
          total: 0,
          pedidos: 0,
        };
      }

      acc[key].total += pedido.total;
      acc[key].pedidos += 1;
      return acc;
    }, {});

    return Object.entries(acumulado)
      .sort(([a], [b]) => dateFromKey(a) - dateFromKey(b))
      .map(([, value]) => value);
  }, [pedidos]);

  function exportarExcel() {
    const data = pedidos.map((pedido) => ({
      Pedido: pedido.numero,
      Mesa: pedido.mesa,
      Estado: pedido.estado,
      Total: pedido.total,
      Metodo: pedido.metodo,
      Fecha: new Date(pedido.fecha).toLocaleString("es-CO"),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Informe");
    XLSX.writeFile(wb, "informe-don-perrito.xlsx");
  }

  return (
    <div className="app-shell min-h-screen p-4 text-gray-900 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="brand-surface mb-6 flex flex-col gap-4 rounded-3xl p-5 text-white shadow-2xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={logoDonPerrito}
              alt="Don Perrito"
              className="h-16 w-16 rounded-2xl object-cover shadow-xl ring-2 ring-orange-300/50"
            />

            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-orange-300">
                Panel administrativo
              </p>

              <h1 className="text-4xl font-black">
                Pedidos
              </h1>

              <p className="mt-1 text-gray-300">
                Atiende el día actual y revisa informes cuando lo necesites.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                sonidoActivo ? setSonidoActivo(false) : activarSonido()
              }
              className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                sonidoActivo
                  ? "bg-orange-600 text-white hover:bg-orange-700"
                  : "bg-white text-gray-800 shadow-sm hover:bg-orange-50"
              }`}
            >
              {sonidoActivo ? "Sonido activo" : "Activar sonido"}
            </button>

            <button
              onClick={cargarPedidos}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-bold shadow-sm transition hover:bg-gray-50"
            >
              Actualizar
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

        <section className="glass-card mb-6 flex flex-col gap-3 rounded-3xl p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            {VISTAS.map((vista) => (
              <button
                key={vista}
                onClick={() => setVistaActiva(vista)}
                className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
                  vistaActiva === vista
                    ? "bg-zinc-950 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                }`}
              >
                {vista}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDiaActivo(getTodayKey())}
              className="rounded-2xl bg-orange-600 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-700"
            >
              Hoy
            </button>

            <button
              onClick={() => setDiaActivo(getRelativeDateKey(-1))}
              className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-200"
            >
              Ayer
            </button>

            <select
              value={diaActivo}
              onChange={(e) => setDiaActivo(e.target.value)}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            >
              {[diaActivo, ...diasDisponibles]
                .filter(Boolean)
                .filter((dia, index, arr) => arr.indexOf(dia) === index)
                .map((dia) => (
                  <option key={dia} value={dia}>
                    {formatLongDate(dia)}
                  </option>
                ))}
            </select>
          </div>
        </section>

        {vistaActiva === "Pedidos" ? (
          <>
            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <Metric label="Ventas del día" value={fmt(resumenDia.ventas)} />
              <Metric label="Pedidos" value={resumenDia.total} />
              <Metric label="Pendientes" value={resumenDia.pendientes} tone="amber" />
              <Metric label="Preparando" value={resumenDia.preparando} tone="sky" />
              <Metric label="Listos" value={resumenDia.listos} tone="emerald" />
            </section>

            <section className="glass-card mb-6 grid gap-3 rounded-3xl p-4 md:grid-cols-[1fr_auto]">
              <input
                type="search"
                placeholder="Buscar pedido, mesa o producto"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
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

            <section className="mb-8">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black capitalize">
                    {formatLongDate(diaActivo)}
                  </h2>

                  <p className="text-sm font-semibold text-gray-500">
                    {pedidosOperativos.length} pedido
                    {pedidosOperativos.length === 1 ? "" : "s"} en pantalla
                  </p>
                </div>
              </div>

              {loading ? (
                <EmptyState text="Cargando pedidos..." />
              ) : pedidosOperativos.length === 0 ? (
                <EmptyState text="No hay pedidos para este día o filtro." />
              ) : (
                <div className="grid gap-4">
                  {pedidosOperativos.map((pedido) => (
                    <PedidoCard
                      key={pedido.id}
                      pedido={pedido}
                      onCambiarEstado={cambiarEstado}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <Informe
            exportarExcel={exportarExcel}
            pedidos={pedidos}
            resumenTotal={resumenTotal}
            ventasPorDia={ventasPorDia}
          />
        )}
      </div>
    </div>
  );
}

function Informe({ exportarExcel, pedidos, resumenTotal, ventasPorDia }) {
  const dias = useMemo(() => {
    const acumulado = pedidos.reduce((acc, pedido) => {
      const key = getDateKey(pedido.fecha);

      if (!acc[key]) {
        acc[key] = {
          key,
          ventas: 0,
          pedidos: 0,
          pendientes: 0,
          preparando: 0,
          listos: 0,
        };
      }

      acc[key].ventas += pedido.total;
      acc[key].pedidos += 1;

      if (pedido.estado === "Pendiente") {
        acc[key].pendientes += 1;
      }

      if (pedido.estado === "Preparando") {
        acc[key].preparando += 1;
      }

      if (pedido.estado === "Listo") {
        acc[key].listos += 1;
      }

      return acc;
    }, {});

    return Object.values(acumulado).sort(
      (a, b) => dateFromKey(b.key) - dateFromKey(a.key)
    );
  }, [pedidos]);

  return (
    <>
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Ventas totales" value={fmt(resumenTotal.ventas)} />
        <Metric label="Pedidos" value={resumenTotal.total} />
        <Metric label="Pendientes" value={resumenTotal.pendientes} tone="amber" />
        <Metric label="Preparando" value={resumenTotal.preparando} tone="sky" />
        <Metric label="Listos" value={resumenTotal.listos} tone="emerald" />
      </section>

      <section className="glass-card mb-8 rounded-3xl p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black">
              Ventas por día
            </h2>

            <p className="text-sm font-semibold text-gray-500">
              Resumen general de todos los días registrados.
            </p>
          </div>

          <button
            onClick={exportarExcel}
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Exportar Excel
          </button>
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
            <EmptyState text="No hay ventas registradas." />
          )}
        </div>
      </section>

      <section className="glass-card rounded-3xl p-5">
        <h2 className="mb-4 text-xl font-black">
          Informe por día
        </h2>

        {dias.length === 0 ? (
          <EmptyState text="No hay información para mostrar." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Día</th>
                  <th className="py-3">Pedidos</th>
                  <th className="py-3">Ventas</th>
                  <th className="py-3">Pendientes</th>
                  <th className="py-3">Preparando</th>
                  <th className="py-3">Listos</th>
                </tr>
              </thead>

              <tbody>
                {dias.map((dia) => (
                  <tr key={dia.key} className="border-b last:border-b-0">
                    <td className="py-4 font-black capitalize">
                      {formatLongDate(dia.key)}
                    </td>
                    <td className="py-4 font-bold">{dia.pedidos}</td>
                    <td className="py-4 font-bold text-orange-600">
                      {fmt(dia.ventas)}
                    </td>
                    <td className="py-4">{dia.pendientes}</td>
                    <td className="py-4">{dia.preparando}</td>
                    <td className="py-4">{dia.listos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
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
    <div className={`${tones[tone]} lift-card rounded-3xl p-5 text-white shadow-lg`}>
      <p className="text-sm font-bold uppercase tracking-wide opacity-80">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="glass-card rounded-3xl p-10 text-center font-bold text-gray-500">
      {text}
    </div>
  );
}

function PedidoCard({ pedido, onCambiarEstado }) {
  return (
    <article className="animate-in lift-card rounded-3xl border border-white bg-white p-5 shadow-lg">
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

function getResumen(pedidos) {
  return {
    ventas: pedidos.reduce((acc, pedido) => acc + pedido.total, 0),
    total: pedidos.length,
    pendientes: pedidos.filter((pedido) => pedido.estado === "Pendiente").length,
    preparando: pedidos.filter((pedido) => pedido.estado === "Preparando").length,
    listos: pedidos.filter((pedido) => pedido.estado === "Listo").length,
  };
}

function getTodayKey() {
  return getDateKey(new Date());
}

function getRelativeDateKey(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return getDateKey(date);
}

function getDateKey(fecha) {
  const date = new Date(fecha);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatShortDate(key) {
  return dateFromKey(key).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

function formatLongDate(key) {
  return dateFromKey(key).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}
