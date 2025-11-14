// src/pages/HomeClient.js (atualizado badge)
import React, { useState, useEffect } from "react";
import { auth, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { Calendar, Bell as BellIcon, History, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function HomeClient({ user, userData }) {
  const [photoURL, setPhotoURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

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

  // Puxa contagem de notificações não lidas
  useEffect(() => {
    async function fetchUnread() {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const res = await axios.get(`http://localhost:5000/api/notifications/${user.uid}`);
        const unread = (res.data || []).filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Erro ao buscar contagem de notificações:", err);
      }
    }
    fetchUnread();
    // opcional: poll ou websocket para realtime
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !currentUser) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profilePhotos/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoURL(url);
      alert("Foto atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
      alert("Falha ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (!currentUser || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700">
        <p className="text-white font-semibold animate-pulse text-lg">
          Carregando dados...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-purple-600 mb-2">
          Olá, {userData?.nome || "Cliente"}!
        </h1>
        <p className="text-gray-500 mb-6">Bem-vindo de volta 👋</p>

        {/* Foto */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          <img
            src={photoURL || "https://via.placeholder.com/150"}
            alt="Foto de perfil"
            className="w-32 h-32 rounded-full object-cover border-4 border-purple-400 shadow-md"
          />
          <label
            htmlFor="fileUpload"
            className={`absolute bottom-0 right-0 bg-purple-600 text-white rounded-full p-2 cursor-pointer hover:bg-purple-700 transition ${ uploading && "opacity-50 cursor-not-allowed" }`}
          >
            {uploading ? "⏳" : "📸"}
          </label>
          <input
            id="fileUpload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {/* Info */}
        <div className="text-left mb-6">
          <p><strong>Nome:</strong> {userData?.nome}</p>
          <p><strong>Telefone:</strong> {userData?.telefone}</p>
          <p><strong>Endereço:</strong> {userData?.endereco}</p>
          <p><strong>E-mail:</strong> {currentUser?.email}</p>
          <p><strong>Perfil:</strong> Cliente</p>
        </div>

        {/* Atalhos */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Shortcut icon={Calendar} label="Agendamentos" onClick={() => navigate("/appointments")} />
          <Shortcut
            icon={BellIcon}
            label="Notificações"
            onClick={() => navigate("/notifications")}
            badge={unreadCount}
          />
          <Shortcut icon={History} label="Histórico" onClick={() => navigate("/history")} />
          <Shortcut icon={Settings} label="Configurações" onClick={() => navigate("/settings?role=client")} />
        </div>

        {/* Botões */}
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

function Shortcut({ icon: Icon, label, onClick, badge }) {
  return (
    <div onClick={onClick} className="relative bg-purple-100 p-4 rounded-xl hover:bg-purple-200 transition cursor-pointer">
      {badge > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
          {badge}
        </span>
      )}
      <Icon className="mx-auto text-purple-600 mb-2" size={28} />
      <p className="text-sm font-semibold text-gray-700">{label}</p>
    </div>
  );
}
