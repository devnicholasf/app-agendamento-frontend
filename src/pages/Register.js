// src/pages/Register.js
import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        userRole: "cliente",
        nome,
        telefone,
        endereco,
        createdAt: new Date(),
      });

      navigate("/home-client");
    } catch (error) {
      console.error("Erro ao registrar:", error);
      alert("Erro ao registrar. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-center text-purple-600 mb-2">Crie sua conta</h2>
        <p className="text-center text-gray-500 mb-6">Bem-vindo(a)! Preencha os campos abaixo.</p>

        <form onSubmit={handleRegister} className="flex flex-col space-y-4">
          <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} required className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" />
          <input type="text" placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" />
          <input type="text" placeholder="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" />
          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" />
          <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" />

          <button type="submit" disabled={loading} className={`py-2 text-white font-semibold rounded-lg transition-all ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-pink-600"}`}>
            {loading ? "Cadastrando..." : "Registrar"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          Já tem uma conta?{" "}
          <a href="/login" className="text-purple-600 font-semibold hover:underline">Entrar</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
