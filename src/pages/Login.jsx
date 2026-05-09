import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { api } from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const login = async () => {
    try {
      const res = await api.post(
        "/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        "token",
        res.data.token
      );

      navigate("/admin");
    } catch (error) {
      alert("Credenciales inválidas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-orange-600">
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full border p-4 rounded-xl mb-4"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border p-4 rounded-xl mb-6"
        />

        <button
          onClick={login}
          className="w-full bg-black text-white py-4 rounded-xl"
        >
          Ingresar
        </button>
      </div>
    </div>
  );
}
