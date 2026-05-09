import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState([]);

  const agregar = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.id === producto.id);

      if (existe) {
        return prev.map((i) =>
          i.id === producto.id
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }

      return [...prev, { ...producto, qty: 1 }];
    });
  };

  const cambiarQty = (id, delta) => {
    setCarrito((prev) =>
      prev
        .map((i) =>
          i.id === id
            ? { ...i, qty: i.qty + delta }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  };

  const limpiarCarrito = () => {
    setCarrito([]);
  };

  const totalItems = carrito.reduce(
    (acc, item) => acc + item.qty,
    0
  );

  const subtotal = carrito.reduce(
    (acc, item) => acc + item.qty * item.precio,
    0
  );

  return (
    <CartContext.Provider
      value={{
        carrito,
        agregar,
        cambiarQty,
        limpiarCarrito,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
