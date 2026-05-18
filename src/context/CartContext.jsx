import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext =
  createContext();

export function CartProvider({
  children,
}) {

  // =========================
  // CARGAR LOCALSTORAGE
  // =========================

  const [carrito,
    setCarrito,
  ] = useState(() => {

    const saved =
      localStorage.getItem(
        "carrito"
      );

    return saved
      ? JSON.parse(saved)
      : [];
  });

  // =========================
  // GUARDAR LOCALSTORAGE
  // =========================

  useEffect(() => {

    localStorage.setItem(
      "carrito",
      JSON.stringify(
        carrito
      )
    );

  }, [carrito]);

  // =========================
  // AGREGAR
  // =========================

  const agregar = (
    producto
  ) => {

    setCarrito((prev) => {

      const existe =
        prev.find(
          (i) =>
            i.id ===
            producto.id
        );

      if (existe) {

        return prev.map(
          (i) =>

            i.id ===
            producto.id

              ? {
                  ...i,
                  qty:
                    i.qty + 1,
                }

              : i
        );
      }

      return [
        ...prev,

        {
          ...producto,
          qty: 1,
        },
      ];
    });
  };

  // =========================
  // CAMBIAR QTY
  // =========================

  const cambiarQty = (
    id,
    delta
  ) => {

    setCarrito((prev) =>

      prev
        .map((i) =>

          i.id === id

            ? {
                ...i,
                qty:
                  i.qty +
                  delta,
              }

            : i
        )

        .filter(
          (i) => i.qty > 0
        )
    );
  };

  // =========================
  // ELIMINAR
  // =========================

  const eliminar = (
    id
  ) => {

    setCarrito((prev) =>

      prev.filter(
        (i) => i.id !== id
      )
    );
  };

  // =========================
  // LIMPIAR
  // =========================

  const limpiarCarrito =
    () => {

      setCarrito([]);

      localStorage.removeItem(
        "carrito"
      );
    };

  // =========================
  // TOTALES
  // =========================

  const totalItems =
    carrito.reduce(
      (acc, item) =>
        acc + item.qty,
      0
    );

  const subtotal =
    carrito.reduce(
      (acc, item) =>
        acc +
        item.qty *
          item.precio,
      0
    );

  return (
    <CartContext.Provider
      value={{
        carrito,

        agregar,

        cambiarQty,

        eliminar,

        limpiarCarrito,

        totalItems,

        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart =
  () =>
    useContext(
      CartContext
    );
