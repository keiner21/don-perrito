import { useState } from "react";

import { MENU } from "../data/menu";

import { fmt } from "../utils/format";

import { useCart } from "../context/CartContext";

import {
  useNavigate,
} from "react-router-dom";

export default function Menu() {

  const navigate =
    useNavigate();

  const {
    agregar,
    totalItems,
    subtotal,
  } = useCart();

  // =========================
  // SEARCH
  // =========================

  const [busqueda,
    setBusqueda,
  ] = useState("");

  const [categoria,
    setCategoria,
  ] = useState("Todos");

  // =========================
  // MESA
  // =========================

  const mesa =
    localStorage.getItem("mesa") ||
    "1";

  // =========================
  // CATEGORIAS
  // =========================

  const categorias = [
    "Todos",
    ...new Set(
      MENU.map(
        (i) => i.categoria
      )
    ),
  ];

  // =========================
  // FILTRO
  // =========================

  const productos =
    MENU.filter((item) => {

      const coincideBusqueda =
        item.nombre
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          );

      const coincideCategoria =
        categoria === "Todos"
          ? true
          : item.categoria ===
            categoria;

      return (
        coincideBusqueda &&
        coincideCategoria
      );
    });

  return (

    <div className="min-h-screen bg-gray-100">

      {/* =========================
          HEADER
      ========================= */}

      <div className="bg-black text-white px-5 pt-6 pb-8 rounded-b-[40px] shadow-xl">

        <div className="flex justify-between items-center">

          <div>

            <h1 className="text-4xl font-black text-orange-500">
              🌭 Don Perrito
            </h1>

            <p className="text-gray-300 mt-1">
              Fast Food Premium
            </p>

            <p className="text-orange-300 text-sm mt-2">
              Mesa #{mesa}
            </p>

          </div>

          {/* ADMIN */}

          <button
            onClick={() =>
              window.open(
                "/admin",
                "_blank"
              )
            }
            className="bg-orange-500 hover:bg-orange-600 px-4 py-3 rounded-2xl font-semibold transition shadow-lg"
          >
            ⚙️ Admin
          </button>

        </div>

        {/* SEARCH */}

        <div className="mt-6">

          <input
            type="text"
            placeholder="🔍 Buscar producto..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
            className="w-full bg-white text-black rounded-2xl px-5 py-4 outline-none text-lg shadow-lg"
          />

        </div>

      </div>

      {/* =========================
          CATEGORIAS
      ========================= */}

      <div className="px-4 mt-5 overflow-x-auto">

        <div className="flex gap-3 w-max pb-2">

          {categorias.map(
            (cat) => (

              <button
                key={cat}
                onClick={() =>
                  setCategoria(cat)
                }
                className={`px-5 py-3 rounded-2xl font-semibold transition shadow-md ${
                  categoria === cat
                    ? "bg-orange-500 text-white"
                    : "bg-white"
                }`}
              >
                {cat}
              </button>

            )
          )}

        </div>

      </div>

      {/* =========================
          PRODUCTOS
      ========================= */}

      <div className="max-w-md mx-auto p-4 pb-36">

        <div className="flex flex-col gap-5">

          {productos.map(
            (item) => (

              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300"
              >

                {/* IMAGEN / EMOJI */}

                <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-40 flex items-center justify-center text-7xl">

                  {item.emoji}

                </div>

                {/* INFO */}

                <div className="p-5">

                  {/* TOP */}

                  <div className="flex justify-between items-start gap-3">

                    <div>

                      <h2 className="text-2xl font-bold">
                        {item.nombre}
                      </h2>

                      <p className="text-gray-500 mt-1">
                        {item.descripcion}
                      </p>

                    </div>

                    {/* DESTACADO */}

                    <div className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap">

                      🔥 Popular

                    </div>

                  </div>

                  {/* PRICE */}

                  <div className="flex items-center justify-between mt-5">

                    <p className="text-3xl font-black text-orange-600">

                      {fmt(item.precio)}

                    </p>

                    <button
                      onClick={() =>
                        agregar(item)
                      }
                      className="bg-black hover:bg-gray-900 text-white px-5 py-3 rounded-2xl font-semibold transition shadow-lg"
                    >
                      Agregar
                    </button>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      </div>

      {/* =========================
          FLOAT CART
      ========================= */}

      {totalItems > 0 && (

        <button
          onClick={() =>
            navigate("/cart")
          }
          className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-orange-500 hover:bg-orange-600 text-white px-7 py-4 rounded-full shadow-2xl flex items-center gap-3 text-lg font-bold transition"
        >

          🛒

          <span>
            {totalItems}
          </span>

          •

          <span>
            {fmt(subtotal)}
          </span>

        </button>

      )}

      {/* =========================
          VER PEDIDO
      ========================= */}

      {localStorage.getItem(
        "ultimoPedido"
      ) && (

        <button
          onClick={() =>
            navigate(
              "/confirmed"
            )
          }
          className="fixed bottom-24 right-5 bg-black text-white px-5 py-4 rounded-full shadow-2xl"
        >
          📦
        </button>

      )}

    </div>
  );
}
