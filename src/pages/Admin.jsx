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

import {
  CalendarDays,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Download,
  LogOut,
  RefreshCw,
  Search,
  Siren,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";

import * as XLSX from "xlsx";

import ding from "../assets/ding.mp3";
import logoDonPerrito from "../assets/logo-don-perrito.png";

import { api } from "../services/api";
import { socket } from "../services/socket";
import { fmt } from "../utils/format";

const ESTADOS = ["Todos", "Pendiente", "Preparando", "Listo"];
const VISTAS = ["Pedidos", "Informe"];

/* ───────── fechas ───────── */

function getTodayKey() {
  return getDateKey(new Date());
}

function getRelativeDateKey(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return getDateKey(d);
}

function getDateKey(fecha) {
  const d = new Date(fecha);

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateFromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
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

function getResumen(pedidos) {
  return {
    ventas: pedidos.reduce((a, p) => a + p.total, 0),
    total: pedidos.length,
    pendientes: pedidos.filter((p) => p.estado === "Pendiente").length,
    preparando: pedidos.filter((p) => p.estado === "Preparando").length,
    listos: pedidos.filter((p) => p.estado === "Listo").length,
  };
}

/* ───────── config kanban ───────── */

const KANBAN_CFG = {
  Pendiente: {
    icon: Siren,
    label: "Pendientes",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
  },

  Preparando: {
    icon: ChefHat,
    label: "En cocina",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.2)",
  },

  Listo: {
    icon: CheckCircle2,
    label: "Listos",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
  },
};

/* ───────── css ───────── */

const CSS = `
body{
  background:#08080e;
  color:#fff;
  font-family:sans-serif;
}
.adm{
  min-height:100vh;
}
`;

/* ───────────────────────── COMPONENT ───────────────────────── */

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

  /* ───────── socket ───────── */

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("socket conectado");
    });

    socket.on("disconnect", () => {
      console.log("socket desconectado");
    });

    cargarPedidos();

    socket.on("nuevo-pedido", (pedido) => {
      if (sonidoActivo) {
        reproducirSonidoPedido();
      }

      setPedidos((prev) => {
        const existe = prev.some(
          (p) =>
            (p.id || p._id) ===
            (pedido.id || pedido._id)
        );

        if (existe) return prev;

        return [pedido, ...prev];
      });

      setDiaActivo(getDateKey(pedido.fecha));
    });

    socket.on("pedido-actualizado", (actualizado) => {
      setPedidos((prev) =>
        prev.map((p) => {
          if (
            (p.id || p._id) !==
            (actualizado.id || actualizado._id)
          ) {
            return p;
          }

          return {
            ...p,
            ...actualizado,
            items: actualizado.items || p.items,
          };
        })
      );
    });

    return () => {
      socket.off("nuevo-pedido");
      socket.off("pedido-actualizado");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [sonidoActivo]);

  /* ───────── cargar pedidos ───────── */

  async function cargarPedidos() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/pedidos");

      setPedidos(res.data);
    } catch (err) {
      setError("No pudimos cargar pedidos");
    } finally {
      setLoading(false);
    }
  }

  /* ───────── logout ───────── */

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  /* ───────── sonido ───────── */

  async function activarSonido() {
    try {
      await desbloquearAudio();

      setSonidoActivo(true);
    } catch (err) {
      setError("No se pudo activar el sonido");
    }
  }

  async function desbloquearAudio() {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    audioRef.current.muted = true;

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
      console.log("no sonido");
    }
  }

  /* ───────── cambiar estado ───────── */

  async function cambiarEstado(id, estado) {
    const pedidoOriginal = pedidos.find(
      (p) => (p.id || p._id) === id
    );

    if (!pedidoOriginal) return;

    /* optimista */

    setPedidos((prev) =>
      prev.map((p) =>
        (p.id || p._id) === id
          ? {
              ...p,
              estado,
            }
          : p
      )
    );

    try {
      const res = await api.put(
        `/pedidos/${id}/estado`,
        {
          estado,
        }
      );

      const pedidoActualizado = res.data;

      setPedidos((prev) =>
        prev.map((p) =>
          (p.id || p._id) === id
            ? {
                ...p,
                ...pedidoActualizado,
              }
            : p
        )
      );
    } catch (err) {
      setPedidos((prev) =>
        prev.map((p) =>
          (p.id || p._id) === id
            ? pedidoOriginal
            : p
        )
      );

      setError(
        "No pudimos actualizar el pedido"
      );
    }
  }

  /* ───────── export excel ───────── */

  function exportarExcel() {
    const data = pedidos.map((p) => ({
      Pedido: p.numero,
      Mesa: p.mesa,
      Estado: p.estado,
      Total: p.total,
      Metodo: p.metodo,
      Fecha: new Date(p.fecha).toLocaleString(
        "es-CO"
      ),
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Informe"
    );

    XLSX.writeFile(
      wb,
      "informe-don-perrito.xlsx"
    );
  }

  /* ───────── filtros ───────── */

  const diasDisponibles = useMemo(() => {
    const keys = [
      ...new Set(
        pedidos.map((p) =>
          getDateKey(p.fecha)
        )
      ),
    ];

    return keys.sort(
      (a, b) => dateFromKey(b) - dateFromKey(a)
    );
  }, [pedidos]);

  const pedidosDelDia = useMemo(() => {
    return pedidos.filter(
      (p) =>
        getDateKey(p.fecha) === diaActivo
    );
  }, [pedidos, diaActivo]);

  const pedidosOperativos = useMemo(() => {
    const term = busqueda
      .trim()
      .toLowerCase();

    return pedidosDelDia.filter((p) => {
      const matchSearch =
        !term ||
        p.numero
          ?.toString()
          .includes(term) ||
        p.mesa
          ?.toString()
          .includes(term) ||
        p.items?.some((i) =>
          i.nombre
            ?.toLowerCase()
            .includes(term)
        );

      const matchEstado =
        estadoFiltro === "Todos" ||
        p.estado === estadoFiltro;

      return matchSearch && matchEstado;
    });
  }, [
    pedidosDelDia,
    busqueda,
    estadoFiltro,
  ]);

  const pedidosPorEstado = useMemo(() => {
    return [
      "Pendiente",
      "Preparando",
      "Listo",
    ].map((estado) => ({
      estado,
      pedidos: pedidosOperativos.filter(
        (p) => p.estado === estado
      ),
    }));
  }, [pedidosOperativos]);

  const resumenDia = useMemo(() => {
    return getResumen(pedidosDelDia);
  }, [pedidosDelDia]);

  const resumenTotal = useMemo(() => {
    return getResumen(pedidos);
  }, [pedidos]);

  const ventasPorDia = useMemo(() => {
    const acc = pedidos.reduce((a, p) => {
      const k = getDateKey(p.fecha);

      if (!a[k]) {
        a[k] = {
          fecha: formatShortDate(k),
          total: 0,
        };
      }

      a[k].total += p.total;

      return a;
    }, {});

    return Object.values(acc);
  }, [pedidos]);

  /* ───────── render ───────── */

  return (
    <div className="adm">
      <style>{CSS}</style>

      <header
        style={{
          padding: 20,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <img
            src={logoDonPerrito}
            width="70"
          />

          <h1>Panel Admin</h1>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
          }}
        >
          <button
            onClick={() =>
              sonidoActivo
                ? setSonidoActivo(false)
                : activarSonido()
            }
          >
            {sonidoActivo ? (
              <Volume2 />
            ) : (
              <VolumeX />
            )}
          </button>

          <button onClick={cargarPedidos}>
            <RefreshCw />
          </button>

          <button onClick={logout}>
            <LogOut />
          </button>
        </div>
      </header>

      <div style={{ padding: 20 }}>
        {error && (
          <div
            style={{
              color: "red",
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* filtros */}

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {VISTAS.map((v) => (
            <button
              key={v}
              onClick={() =>
                setVistaActiva(v)
              }
            >
              {v}
            </button>
          ))}

          <button
            onClick={() =>
              setDiaActivo(getTodayKey())
            }
          >
            Hoy
          </button>

          <button
            onClick={() =>
              setDiaActivo(
                getRelativeDateKey(-1)
              )
            }
          >
            Ayer
          </button>

          <select
            value={diaActivo}
            onChange={(e) =>
              setDiaActivo(
                e.target.value
              )
            }
          >
            {diasDisponibles.map((d) => (
              <option
                key={d}
                value={d}
              >
                {formatLongDate(d)}
              </option>
            ))}
          </select>

          <input
            type="search"
            placeholder="buscar..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
          />

          <select
            value={estadoFiltro}
            onChange={(e) =>
              setEstadoFiltro(
                e.target.value
              )
            }
          >
            {ESTADOS.map((e) => (
              <option
                key={e}
                value={e}
              >
                {e}
              </option>
            ))}
          </select>
        </div>

        {/* pedidos */}

        {vistaActiva === "Pedidos" ? (
          <>
            <h2>
              {formatLongDate(diaActivo)}
            </h2>

            {loading ? (
              <p>Cargando...</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(320px,1fr))",
                  gap: 20,
                }}
              >
                {pedidosPorEstado.map(
                  ({ estado, pedidos }) => (
                    <div
                      key={estado}
                      style={{
                        border:
                          "1px solid #333",
                        padding: 20,
                        borderRadius: 10,
                      }}
                    >
                      <h3>{estado}</h3>

                      {pedidos.map((p) => (
                        <div
                          key={
                            p.id || p._id
                          }
                          style={{
                            border:
                              "1px solid #444",
                            marginBottom: 10,
                            padding: 10,
                            borderRadius: 10,
                          }}
                        >
                          <h4>
                            Pedido #
                            {p.numero}
                          </h4>

                          <p>
                            Mesa: {p.mesa}
                          </p>

                          <p>
                            Total:{" "}
                            {fmt(
                              p.total
                            )}
                          </p>

                          <div>
                            {p.items?.map(
                              (i) => (
                                <div
                                  key={
                                    i.id
                                  }
                                >
                                  {i.qty}x{" "}
                                  {
                                    i.nombre
                                  }
                                </div>
                              )
                            )}
                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              gap: 5,
                              marginTop: 10,
                            }}
                          >
                            {[
                              "Pendiente",
                              "Preparando",
                              "Listo",
                            ].map((e) => (
                              <button
                                key={e}
                                disabled={
                                  p.estado ===
                                  e
                                }
                                onClick={() =>
                                  cambiarEstado(
                                    p.id ||
                                      p._id,
                                    e
                                  )
                                }
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div
              style={{
                marginBottom: 20,
              }}
            >
              <button
                onClick={exportarExcel}
              >
                <Download />
                Exportar Excel
              </button>
            </div>

            <div
              style={{
                width: "100%",
                height: 300,
              }}
            >
              <ResponsiveContainer>
                <BarChart
                  data={ventasPorDia}
                >
                  <XAxis
                    dataKey="fecha"
                  />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="total"
                    fill="#f97316"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div
              style={{
                marginTop: 30,
              }}
            >
              <h2>
                Resumen General
              </h2>

              <p>
                Ventas:{" "}
                {fmt(
                  resumenTotal.ventas
                )}
              </p>

              <p>
                Pedidos:{" "}
                {resumenTotal.total}
              </p>

              <p>
                Pendientes:{" "}
                {
                  resumenTotal.pendientes
                }
              </p>

              <p>
                Preparando:{" "}
                {
                  resumenTotal.preparando
                }
              </p>

              <p>
                Listos:{" "}
                {resumenTotal.listos}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
