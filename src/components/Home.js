// src/components/Home.js
import React, { useEffect, useState, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import axios from "axios";

const Home = ({ user }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef(null);

  const handleLogout = () => {
    signOut(auth);
    navigate("/");
  };

  useEffect(() => {
    let mounted = true;
    async function fetchUnread() {
      try {
        if (!auth.currentUser) return;
        const res = await axios.get(`http://localhost:5000/api/notifications/${auth.currentUser.uid}`);
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary px-4 text-white">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-black text-center">
        <h2 className="text-2xl font-bold mb-4">Bem-vindo, {user.displayName || "usuário"}!</h2>
        <p className="mb-2"><strong>Email:</strong> {user.email}</p>
        <p className="mb-6"><strong>Telefone:</strong> (você pode salvar no Firestore futuramente)</p>

        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => navigate("/appointments")}
            className="bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-pink-500 transition"
          >
            Agendamentos
          </button>

          <button
            onClick={() => { navigate("/notifications"); setUnreadCount(0); }}
            className="relative bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-pink-500 transition flex items-center gap-2"
          >
            <Bell />
            Notificações
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-sm font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="bg-secondary text-white font-bold py-3 px-6 rounded-lg hover:bg-pink-500 transition text-lg"
        >
          Sair
        </button>
      </div>
    </div>
  );
};

export default Home;
