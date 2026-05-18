import { useEffect, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { api } from "../services/api";

import { saveActiveOrder } from "../utils/activeOrder";

export default function PaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("Verificando pago...");
  const [error, setError] = useState("");
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    async function confirmarPago() {
      try {
        const reference =
          searchParams.get("reference");

        const transactionId =
          searchParams.get("id") ||
          searchParams.get("transaction_id");

        if (!reference) {
          setError("No encontramos la referencia del pago.");
          return;
        }

        const response = await api.get(
          "/pagos/confirmar",
          {
            params: {
              reference,
              transactionId,
            },
          }
        );

        setPedido(response.data.pedido);

        if (response.data.status === "APROBADO") {
          const pedidoGuardado = saveActiveOrder(
            response.data.pedido
          );

          navigate("/confirmed", {
            replace: true,
            state: {
              pedido:
                pedidoGuardado,
            },
          });

          return;
        }

        if (response.data.status === "RECHAZADO") {
          setError("El pago fue rechazado. Puedes volver al menú e intentar de nuevo.");
          return;
        }

        setStatus("El pago sigue pendiente. Si ya pagaste, espera unos segundos y vuelve a verificar.");
      } catch (err) {
        setError(
          err.response?.data?.error ||
            "No pudimos confirmar el pago."
        );
      }
    }

    confirmarPago();
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 h-16 w-16 animate-pulse rounded-full bg-orange-100" />

        <h1 className="text-3xl font-black text-gray-950">
          Resultado del pago
        </h1>

        <p className="mt-3 text-gray-500">
          {error || status}
        </p>

        {pedido && (
          <p className="mt-4 text-sm font-bold text-orange-700">
            Pedido #{pedido.numero}
          </p>
        )}

        <div className="mt-7 grid gap-3">
          {!error && (
            <button
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-orange-600 py-4 font-bold text-white transition hover:bg-orange-700"
            >
              Verificar otra vez
            </button>
          )}

          <button
            onClick={() => navigate("/")}
            className="rounded-2xl bg-gray-100 py-4 font-bold transition hover:bg-gray-200"
          >
            Volver al menú
          </button>
        </div>
      </div>
    </div>
  );
}
