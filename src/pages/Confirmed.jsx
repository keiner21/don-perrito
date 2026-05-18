import { useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { socket } from "../services/socket";

import { api } from "../services/api";

import { fmt } from "../utils/format";

import {
  clearActiveOrder,
  getActiveOrder,
  getActiveOrderTimeLeft,
  saveActiveOrder,
} from "../utils/activeOrder";

import seguimientoPedido from "../assets/logo-don-perrito.png";

const ESTADOS = ["Pendiente", "Preparando", "Listo"];

export default function Confirmed() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pedido, setPedido] = useState(() => {
    if (location.state?.pedido) {
      return saveActiveOrder(location.state.pedido);
    }

    return getActiveOrder();
  });

  useEffect(() => {
    if (!pedido?.id) {
      return undefined;
    }

    let activo = true;

    async function cargarPedidoActual() {
      try {
        const response = await api.get(
          `/pedidos/${pedido.id}`
        );

        if (!activo) {
          return;
        }

        setPedido(saveActiveOrder(response.data));
      } catch {
        if (activo) {
          clearActiveOrder();
          setPedido(null);
        }
      }
    }

    cargarPedidoActual();

    return () => {
      activo = false;
    };
  }, [pedido?.id]);

  useEffect(() => {
    if (!pedido) {
      return undefined;
    }

    const onPedidoActualizado = (pedidoActualizado) => {
      if (pedidoActualizado.id !== pedido.id) {
        return;
      }

      setPedido(saveActiveOrder(pedidoActualizado));
    };

    socket.on("pedido-actualizado", onPedidoActualizado);

    return () => {
      socket.off("pedido-actualizado", onPedidoActualizado);
    };
  }, [pedido]);

  useEffect(() => {
    if (!pedido) {
      return undefined;
    }

    const timeLeft = getActiveOrderTimeLeft(pedido);

    if (timeLeft === null) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      clearActiveOrder();
      setPedido(null);
    }, timeLeft);

    return () => window.clearTimeout(timeout);
  }, [pedido]);

  const estadoIndex = useMemo(
    () => (pedido ? ESTADOS.indexOf(pedido.estado) : -1),
    [pedido]
  );

  const progreso = `${Math.max(((estadoIndex + 1) / ESTADOS.length) * 100, 0)}%`;

  const mensajeEstado = useMemo(() => {
    if (!pedido) {
      return "";
    }

    switch (pedido.estado) {
      case "Pendiente":
        return "Tu pedido fue recibido correctamente.";
      case "Preparando":
        return "Estamos preparando tu pedido.";
      case "Listo":
        return "Tu pedido está listo para entregar.";
      default:
        return "Estamos revisando el estado de tu pedido.";
    }
  }, [pedido]);

  if (!pedido) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-4xl">
            🍔
          </div>

          <h1 className="text-3xl font-black">
            No hay pedido activo
          </h1>

          <p className="mb-6 mt-3 text-gray-500">
            Cuando envíes un pedido podrás ver su estado aquí.
          </p>

          <button
            onClick={() => navigate("/")}
            className="w-full rounded-2xl bg-orange-600 py-4 font-bold text-white transition hover:bg-orange-700"
          >
            Volver al menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4 sm:p-6">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
            Mesa #{pedido.mesa}
          </p>

          <h1 className="mt-1 text-4xl font-black">
            Pedido #{pedido.numero}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {new Date(pedido.fecha).toLocaleString("es-CO")}
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl bg-orange-50">
          <div className="grid items-center gap-5 p-5 sm:grid-cols-[11rem_1fr]">
            <div className="relative mx-auto h-40 w-40">
              <div className="absolute inset-0 animate-ping rounded-full bg-orange-200 opacity-40" />

              <img
                src={seguimientoPedido}
                alt="Logo Don Perrito"
                className="relative h-full w-full rounded-full object-cover shadow-xl ring-8 ring-white"
              />
            </div>

            <div className="text-center sm:text-left">
              <span className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-orange-700 shadow-sm">
                {pedido.estado}
              </span>

              <p className="mt-4 text-lg font-bold text-gray-900">
                {mensajeEstado}
              </p>

              <div className="mt-5 flex items-center justify-center gap-2 sm:justify-start">
                <span className="h-3 w-3 animate-bounce rounded-full bg-orange-500" />
                <span className="h-3 w-3 animate-bounce rounded-full bg-orange-500 [animation-delay:150ms]" />
                <span className="h-3 w-3 animate-bounce rounded-full bg-orange-500 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="h-4 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-500"
              style={{ width: progreso }}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 text-center text-xs font-bold text-gray-500">
            {ESTADOS.map((estado, index) => (
              <span
                key={estado}
                className={index <= estadoIndex ? "text-orange-700" : ""}
              >
                {estado}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-8 space-y-3 border-y border-gray-100 py-5">
          {pedido.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4"
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
                {fmt(item.precio * item.qty)}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xl font-black">
            Total
          </span>

          <span className="text-3xl font-black text-orange-600">
            {fmt(pedido.total)}
          </span>
        </div>

        <div className="mt-8">
          <button
            onClick={() => navigate("/")}
            className="w-full rounded-2xl bg-gray-100 py-4 font-bold transition hover:bg-gray-200"
          >
            Ver menú
          </button>
        </div>
      </div>
    </div>
  );
}
