// src/pages/Login.js
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        alert("Usuário não encontrado no banco de dados.");
        return;
      }

      const data = userDoc.data();
      const role = data.userRole;

      if (role === "admin") {
        navigate("/admin");
      } else if (role === "profissional") {
        navigate("/home-pro");
      } else {
        navigate("/home-client");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert("Erro ao entrar. Verifique e-mail e senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-center text-purple-600 mb-2">
          Bem-vindo(a) de volta!
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Entre com suas credenciais abaixo.
        </p>

        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className={`py-2 text-white font-semibold rounded-lg transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-pink-600"
            }`}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="text-center mt-6">
          <a
            href="/forgot-password"
            className="text-sm text-purple-600 hover:underline"
          >
            Esqueceu sua senha?
          </a>
        </div>

        <p className="text-center text-gray-600 text-sm mt-4">
          Ainda não tem conta?{" "}
          <a
            href="/register"
            className="text-purple-600 font-semibold hover:underline"
          >
            Cadastrar-se
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
