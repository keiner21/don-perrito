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

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}

      <div className="bg-black text-white p-5 flex justify-between items-center shadow-lg">

        <div>

          <h1 className="text-3xl font-bold text-orange-500">
            🌭 Don Perrito
          </h1>

          <p className="text-gray-300 text-sm">
            Fast Food
          </p>

          {/* MESA */}

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

      {/* CONTENIDO */}

      <div className="max-w-md mx-auto p-4 pb-28">

        <div className="flex flex-col gap-4">

          {MENU.map((item) => (

            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 shadow hover:shadow-lg transition"
            >

              <div className="flex items-center justify-between gap-4">

                <div>

                  <h2 className="font-semibold text-lg">
                    {item.nombre}
                  </h2>

                  <p className="text-sm text-gray-500">
                    {item.descripcion}
                  </p>

                  <p className="text-orange-600 font-bold mt-2">
                    {fmt(item.precio)}
                  </p>

                  <button
                    onClick={() =>
                      agregar(item)
                    }
                    className="mt-3 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl transition"
                  >
                    Agregar
                  </button>

                </div>

                <div className="text-5xl">
                  {item.emoji}
                </div>

              </div>

            </div>

          ))}

        </div>

        {/* BOTON CARRITO */}

        {totalItems > 0 && (

          <button
            onClick={() =>
              navigate("/cart")
            }
            className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-black hover:bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl transition"
          >
            🛒 Ver pedido (
            {totalItems}) ·{" "}
            {fmt(subtotal)}
          </button>

        )}

      </div>

    </div>
  );
}
