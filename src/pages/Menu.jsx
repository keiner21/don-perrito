import { MENU } from "../data/menu";

import { fmt } from "../utils/format";

import { useCart } from "../context/CartContext";

import {
  useNavigate,
} from "react-router-dom";

export default function Menu() {

  const {
    agregar,
    totalItems,
    subtotal,
  } = useCart();

  const navigate =
    useNavigate();

  const mesa =
    localStorage.getItem("mesa") ||
    "1";

  // =========================
  // AGRUPAR CATEGORIAS
  // =========================

  const categorias =
    [...new Set(
      MENU.map(
        (item) =>
          item.categoria
      )
    )];

  return (

    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}

      <div className="bg-black text-white p-5 shadow-lg sticky top-0 z-50">

        <div className="max-w-6xl mx-auto flex justify-between items-center">

          <div>

            <h1 className="text-3xl font-bold text-orange-500">
              🌭 Don Perrito
            </h1>

            <p className="text-gray-300 text-sm">
              Fast Food Premium
            </p>

            <p className="text-orange-300 text-sm mt-1">
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
            className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl font-medium transition"
          >
            ⚙️ Admin
          </button>

        </div>

      </div>

      {/* CONTENIDO */}

      <div className="max-w-6xl mx-auto p-4 pb-32">

        {categorias.map(
          (categoria) => (

            <div
              key={categoria}
              className="mb-10"
            >

              {/* TITULO CATEGORIA */}

              <h2 className="text-3xl font-bold mb-6 text-gray-800">
                {categoria}
              </h2>

              {/* GRID */}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {MENU.filter(
                  (item) =>
                    item.categoria ===
                    categoria
                ).map(
                  (item) => (

                    <div
                      key={item.id}
                      className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300"
                    >

                      {/* IMAGEN */}

                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="w-full h-56 object-cover"
                      />

                      {/* INFO */}

                      <div className="p-5">

                        <h3 className="text-2xl font-bold text-gray-800">
                          {item.nombre}
                        </h3>

                        <p className="text-gray-500 mt-2 min-h-[48px]">
                          {item.descripcion}
                        </p>

                        <div className="flex items-center justify-between mt-5">

                          <p className="text-2xl font-bold text-orange-600">
                            {fmt(item.precio)}
                          </p>

                          <button
                            onClick={() =>
                              agregar(item)
                            }
                            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl font-semibold transition"
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

          )
        )}

      </div>

      {/* BOTON CARRITO */}

      {totalItems > 0 && (

        <button
          onClick={() =>
            navigate("/cart")
          }
          className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-black hover:bg-gray-900 text-white px-8 py-4 rounded-full shadow-2xl transition text-lg font-semibold z-50"
        >
          🛒 Ver pedido (
          {totalItems}) ·{" "}
          {fmt(subtotal)}
        </button>

      )}

    </div>
  );
}
