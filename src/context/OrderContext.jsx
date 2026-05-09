import { createContext, useContext, useState } from "react";

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [pedidos, setPedidos] = useState([]);

  const crearPedido = (pedido) => {
    setPedidos((prev) => [pedido, ...prev]);
  };

  return (
    <OrderContext.Provider
      value={{
        pedidos,
        crearPedido,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => useContext(OrderContext);
