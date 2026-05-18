const ACTIVE_ORDER_KEY = "ultimoPedido";
const READY_ORDER_TTL = 5 * 60 * 1000;

export function getActiveOrder() {
  const saved = localStorage.getItem(ACTIVE_ORDER_KEY);

  if (!saved) {
    return null;
  }

  try {
    const order = JSON.parse(saved);

    if (isOrderExpired(order)) {
      clearActiveOrder();
      return null;
    }

    return order;
  } catch {
    clearActiveOrder();
    return null;
  }
}

export function saveActiveOrder(order) {
  const orderToSave = buildOrderWithExpiration(order);
  localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(orderToSave));
  return orderToSave;
}

export function clearActiveOrder() {
  localStorage.removeItem(ACTIVE_ORDER_KEY);
}

export function getActiveOrderTimeLeft(order) {
  if (!order?.expiresAt) {
    return null;
  }

  return Math.max(new Date(order.expiresAt).getTime() - Date.now(), 0);
}

function buildOrderWithExpiration(order) {
  if (order.estado !== "Listo") {
    const activeOrder = { ...order };
    delete activeOrder.listoAt;
    delete activeOrder.expiresAt;
    return activeOrder;
  }

  if (order.expiresAt) {
    return order;
  }

  const readyAt = Date.now();

  return {
    ...order,
    listoAt: new Date(readyAt).toISOString(),
    expiresAt: new Date(readyAt + READY_ORDER_TTL).toISOString(),
  };
}

function isOrderExpired(order) {
  return Boolean(order.expiresAt && new Date(order.expiresAt).getTime() <= Date.now());
}
