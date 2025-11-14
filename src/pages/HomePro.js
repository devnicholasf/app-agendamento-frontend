// src/pages/HomePro.js
import React, { useState, useEffect, useRef } from "react";
import { auth } from "../firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { Calendar, History, Settings, LogOut, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function HomePro({ userData }) {
  const [photoURL, setPhotoURL] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const pollRef = useRef(null);

  // Redireciona se não estiver logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (loggedUser) => {
      if (!loggedUser) navigate("/login");
      else setCurrentUser(loggedUser);
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (userData?.photoURL) setPhotoURL(userData.photoURL);
  }, [userData]);

  // Poll unread notifications every 30s
  useEffect(() => {
    let mounted = true;
    async function fetchUnread() {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const res = await axios.get(`http://localhost:5000/api/notifications/${user.uid}`);
        if (!mounted) return;
        const unread = res.data.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Erro ao buscar notificações (badge):", err);
      }
    }
    fetchUnread();
    pollRef.current = setInterval(fetchUnread, 30000);
    return () => {
      mounted = false;
      clearInterval(pollRef.current);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-purple-600 mb-2">
          Olá, {userData?.nome || "Profissional"}!
        </h1>
        <p className="text-gray-500 mb-6">Painel do profissional ⚙️</p>

        <div className="relative w-32 h-32 mx-auto mb-4">
          <img
            src={photoURL || "https://via.placeholder.com/150"}
            alt="Foto de perfil"
            className="w-32 h-32 rounded-full object-cover border-4 border-purple-400 shadow-md"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Shortcut
            icon={Calendar}
            label="Meus Agendamentos"
            onClick={() => navigate("/pro-appointments")}
          />
          <ShortcutWithBadge
            icon={Bell}
            label="Notificações"
            badge={unreadCount}
            onClick={() => {
              navigate("/notifications");
              setUnreadCount(0);
            }}
          />
          <Shortcut
            icon={History}
            label="Histórico"
            onClick={() => navigate("/pro-history")}
          />
          <Shortcut
            icon={Settings}
            label="Configurações"
            onClick={() => navigate("/settings?role=pro")}
          />
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
        >
          <LogOut size={18} /> Sair
        </button>
      </div>
    </div>
  );
}

function Shortcut({ icon: Icon, label, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-purple-100 p-4 rounded-xl hover:bg-purple-200 active:scale-95 transition cursor-pointer"
    >
      <Icon className="mx-auto text-purple-600 mb-2" size={28} />
      <p className="text-sm font-semibold text-gray-700">{label}</p>
    </div>
  );
}

function ShortcutWithBadge({ icon: Icon, label, badge = 0, onClick }) {
  return (
    <div
      onClick={onClick}
      className="relative bg-purple-100 p-4 rounded-xl hover:bg-purple-200 transition cursor-pointer"
    >
      <Icon className="mx-auto text-purple-600 mb-2" size={28} />
      {badge > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
          {badge}
        </div>
      )}
      <p className="text-sm font-semibold text-gray-700">{label}</p>
    </div>
  );
}
