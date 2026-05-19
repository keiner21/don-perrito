import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { MENU } from "../data/menu";

import { useCart } from "../context/CartContext";

import { fmt } from "../utils/format";

import { socket } from "../services/socket";

import {
  clearActiveOrder,
  getActiveOrder,
  getActiveOrderTimeLeft,
  saveActiveOrder,
} from "../utils/activeOrder";

import logoDonPerrito from "../assets/logo-don-perrito.png";

export default function Menu() {
  const navigate = useNavigate();

  const {
    agregar,
    cambiarQty,
    carrito,
    totalItems,
    subtotal,
  } = useCart();

  const mesa = localStorage.getItem("mesa") || "1";

  const categorias = useMemo(
    () => ["Todos", ...new Set(MENU.map((item) => item.categoria))],
    []
  );

  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [pedidoActivo, setPedidoActivo] = useState(() => getActiveOrder());

  useEffect(() => {
    if (!pedidoActivo) {
      return undefined;
    }

    const onPedidoActualizado = (pedidoActualizado) => {
      if (pedidoActualizado.id !== pedidoActivo.id) {
        return;
      }

      setPedidoActivo(saveActiveOrder(pedidoActualizado));
    };

    socket.on("pedido-actualizado", onPedidoActualizado);

    return () => {
      socket.off("pedido-actualizado", onPedidoActualizado);
    };
  }, [pedidoActivo]);

  useEffect(() => {
    if (!pedidoActivo) {
      return undefined;
    }

    const timeLeft = getActiveOrderTimeLeft(pedidoActivo);

    if (timeLeft === null) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      clearActiveOrder();
      setPedidoActivo(null);
    }, timeLeft);

    return () => window.clearTimeout(timeout);
  }, [pedidoActivo]);

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return MENU.filter((item) => {
      const coincideCategoria =
        categoriaActiva === "Todos" || item.categoria === categoriaActiva;

      const coincideBusqueda =
        termino === "" ||
        item.nombre.toLowerCase().includes(termino) ||
        item.descripcion.toLowerCase().includes(termino);

      return coincideCategoria && coincideBusqueda;
    });
  }, [busqueda, categoriaActiva]);

  const cantidadEnCarrito = (id) =>
    carrito.find((item) => item.id === id)?.qty || 0;

  const imagenMenuClass = (item) => {
    const base =
      "w-full h-full transition duration-300 group-hover:scale-105";

    if (item.categoria === "Bebidas") {
      return `${base} object-contain p-6`;
    }

    return `${base} object-cover`;
  };

  return (
    <div className="app-shell min-h-screen text-gray-900">
      <header className="brand-surface sticky top-0 z-50 border-b border-white/10 text-white shadow-2xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={logoDonPerrito}
              alt="Don Perrito"
              className="h-16 w-16 rounded-2xl object-cover shadow-xl ring-2 ring-orange-300/50"
            />

            <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">
              Mesa #{mesa}
            </p>

            <h1 className="text-3xl font-black text-orange-500">
              Don Perrito
            </h1>

              <p className="text-sm text-gray-300">
                Hamburguesas, perros y antojos al momento
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {pedidoActivo && (
              <button
                onClick={() => navigate("/confirmed")}
                className="rounded-2xl border border-orange-400/70 px-4 py-3 text-sm font-bold text-orange-200 transition hover:bg-orange-500/10"
              >
                Ver pedido activo
              </button>
            )}

            {totalItems > 0 && (
              <button
                onClick={() => navigate("/cart")}
                className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
              >
                Pedido ({totalItems}) - {fmt(subtotal)}
              </button>
            )}

            <button
              onClick={() => window.open("/admin", "_blank")}
              className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6">
        <section className="animate-in glass-card mb-6 grid gap-4 rounded-3xl p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">
              Menú
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Elige tus productos y revisa tu pedido antes de enviarlo.
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-700">
              Buscar producto
            </span>

            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Hamburguesa, perro, bebida..."
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 lg:w-80"
            />
          </label>
        </section>

        <nav className="mb-7 flex gap-2 overflow-x-auto pb-2">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              onClick={() => setCategoriaActiva(categoria)}
              className={`shrink-0 rounded-full px-5 py-3 text-sm font-bold transition ${
                categoriaActiva === categoria
                  ? "bg-zinc-950 text-white shadow-lg"
                  : "bg-white text-gray-700 shadow-sm hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              {categoria}
            </button>
          ))}
        </nav>

        {productosFiltrados.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow">
            <h3 className="text-2xl font-black">
              No encontramos productos
            </h3>

            <p className="mt-2 text-gray-500">
              Prueba con otra búsqueda o cambia de categoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {productosFiltrados.map((item) => {
              const qty = cantidadEnCarrito(item.id);

              return (
                <article
                  key={item.id}
                  className="animate-in lift-card group overflow-hidden rounded-3xl border border-white bg-white shadow-lg"
                >
                  <div className="relative flex h-56 w-full items-center justify-center overflow-hidden bg-orange-50">
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className={imagenMenuClass(item)}
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition group-hover:opacity-100" />
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                          {item.categoria}
                        </p>

                        <h3 className="mt-1 text-xl font-black text-gray-900">
                          {item.nombre}
                        </h3>
                      </div>

                      <p className="shrink-0 text-lg font-black text-orange-600">
                        {fmt(item.precio)}
                      </p>
                    </div>

                    <p className="min-h-10 text-sm leading-6 text-gray-500">
                      {item.descripcion}
                    </p>

                    {qty > 0 ? (
                      <div className="mt-5 flex items-center justify-between rounded-2xl bg-gray-100 p-2">
                        <button
                          onClick={() => cambiarQty(item.id, -1)}
                          className="h-11 w-11 rounded-xl bg-white text-xl font-black text-gray-900 shadow-sm transition hover:bg-gray-200"
                          aria-label={`Quitar ${item.nombre}`}
                        >
                          -
                        </button>

                        <span className="font-black">
                          {qty} en pedido
                        </span>

                        <button
                          onClick={() => agregar(item)}
                          className="h-11 w-11 rounded-xl bg-orange-500 text-xl font-black text-white shadow-sm transition hover:bg-orange-600"
                          aria-label={`Agregar ${item.nombre}`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => agregar(item)}
                        className="mt-5 w-full rounded-2xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600"
                      >
                        Agregar
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {totalItems > 0 && (
        <button
          onClick={() => navigate("/cart")}
          className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl bg-zinc-950 px-6 py-4 text-lg font-black text-white shadow-2xl transition hover:bg-black"
        >
          Ver pedido ({totalItems}) - {fmt(subtotal)}
        </button>
      )}

      {totalItems === 0 && pedidoActivo && (
        <button
          onClick={() => navigate("/confirmed")}
          className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl bg-zinc-950 px-6 py-4 text-lg font-black text-white shadow-2xl transition hover:bg-black"
        >
          Volver a mi pedido
        </button>
      )}
    </div>
  );
}
