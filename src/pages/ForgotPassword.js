// src/pages/ForgotPassword.js
import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("📧 Um link de redefinição foi enviado para o seu e-mail.");
    } catch (error) {
      console.error("Erro ao enviar e-mail de redefinição:", error);
      setMessage("❌ Erro ao enviar e-mail. Verifique o endereço e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-center text-purple-600 mb-2">
          Esqueceu sua senha?
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Digite seu e-mail para receber o link de redefinição.
        </p>

        <form onSubmit={handleReset} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Enviando..." : "Enviar link"}
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-gray-700 font-medium">{message}</p>
        )}

        <div className="text-center mt-6">
          <a
            href="/login"
            className="text-sm text-purple-600 hover:underline"
          >
            Voltar para o login
          </a>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
