// src/pages/Settings.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit3, Check, X } from "lucide-react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function Settings({ role }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    nascimento: "",
    email: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Carrega dados do usuário logado
  useEffect(() => {
    async function loadUser() {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/");
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (err) {
        console.error("Erro ao carregar dados do usuário:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [navigate]);

  // 🔹 Formata a data de nascimento para o padrão brasileiro (dd/mm/aaaa)
  const formatDateToBR = (dateString) => {
    if (!dateString) return "—";
    const [year, month, day] = dateString.split("-");
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  };

  // 🔹 Salvar alterações no Firebase
  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        nome: userData.nome,
        telefone: userData.telefone,
        endereco: userData.endereco,
        nascimento: userData.nascimento,
      });

      setIsEditing(false);
      alert("✅ Alterações salvas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar alterações:", err);
      alert("❌ Ocorreu um erro ao salvar. Tente novamente.");
    }
  };

  const handleBack = () => {
    if (role === "profissional") navigate("/home-pro");
    else navigate("/home-client");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-600 to-indigo-700 text-white text-lg">
        Carregando informações...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        {/* 🔙 Cabeçalho */}
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="text-purple-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-extrabold text-center text-purple-600 flex-1">
            Configurações
          </h2>

          {/* Botão de Editar / Salvar */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-purple-600 hover:text-indigo-600 transition"
              title="Editar informações"
            >
              <Edit3 size={22} />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="text-green-600 hover:text-green-700 transition"
                title="Salvar alterações"
              >
                <Check size={22} />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-red-600 hover:text-red-700 transition"
                title="Cancelar edição"
              >
                <X size={22} />
              </button>
            </div>
          )}
        </div>

        {/* 🔹 Dados do usuário */}
        <div className="space-y-4">
          {["nome", "nascimento", "telefone", "endereco", "email"].map(
            (field) => (
              <div key={field}>
                <p className="text-sm text-gray-500 capitalize mb-1">
                  {field === "nascimento" ? "Data de Nascimento" : field}
                </p>

                {isEditing && field !== "email" ? (
                  <input
                    type={field === "nascimento" ? "date" : "text"}
                    value={userData[field] || ""}
                    onChange={(e) =>
                      setUserData({ ...userData, [field]: e.target.value })
                    }
                    className="border w-full rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                ) : (
                  <div className="border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-700">
                    {field === "nascimento"
                      ? formatDateToBR(userData[field])
                      : userData[field] || "—"}
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* 🔹 Botão “Salvar Alterações” (extra, visível apenas no modo edição) */}
        {isEditing && (
          <button
            onClick={handleSave}
            className="w-full mt-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
          >
            Salvar Alterações
          </button>
        )}
      </div>
    </div>
  );
}
