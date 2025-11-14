// src/pages/Notifications.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { Bell, Check, ArrowLeft } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadNotifications() {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5000/api/notifications/${user.uid}`);
        setNotifications(res.data || []);
      } catch (err) {
        console.error("Erro ao buscar notificações:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [navigate]);

  const markAsRead = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
    }
  };

  const formatDate = (dateData) => {
    if (!dateData) return "Data desconhecida";
    try {
      if (dateData._seconds) {
        return new Date(dateData._seconds * 1000).toLocaleString("pt-BR");
      } else if (typeof dateData === "string") {
        return new Date(dateData).toLocaleString("pt-BR");
      } else {
        return "Data inválida";
      }
    } catch {
      return "Data inválida";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-3xl">
        {/* Voltar */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-purple-600 mb-4 hover:text-purple-800 transition"
        >
          <ArrowLeft size={20} className="mr-2" /> Voltar
        </button>

        <h1 className="text-2xl font-bold text-purple-600 mb-6 text-center">
          <Bell className="inline mr-2" /> Minhas Notificações
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">Carregando...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-500">Nenhuma notificação encontrada.</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border ${n.read ? "bg-gray-50 border-gray-200" : "bg-purple-50 border-purple-200"} flex justify-between items-center`}
              >
                <div>
                  <p className="font-semibold text-purple-700">{n.title}</p>
                  <p className="text-gray-600 text-sm">{n.message}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="text-sm text-purple-600 font-semibold hover:text-purple-800"
                  >
                    <Check size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
