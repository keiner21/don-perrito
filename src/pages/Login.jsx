import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { api } from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setLoading(true);

      const res = await api.post("/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/admin");
    } catch {
      setError("Credenciales inválidas. Revisa el correo y la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-6">
      <form
        onSubmit={login}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
            Don Perrito
          </p>

          <h1 className="mt-1 text-3xl font-black text-gray-950">
            Acceso admin
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Entra para gestionar pedidos y ventas.
          </p>
        </div>

        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-bold text-gray-700">
            Correo
          </span>

          <input
            type="email"
            placeholder="admin@donperrito.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-gray-700">
            Contraseña
          </span>

          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />
        </label>

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-zinc-950 py-4 font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
