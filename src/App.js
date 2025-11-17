import React, { useEffect, useState } from "react";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// 📄 Páginas principais
import HomeClient from "./pages/HomeClient";
import HomePro from "./pages/HomePro";
import Appointments from "./pages/Appointments";
import ProAppointments from "./pages/ProAppointments";
import Services from "./pages/Services";
import History from "./pages/History";
import ProHistory from "./pages/ProHistory"; // ✅ Novo histórico do profissional
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/AdminDashboard";

// 🔐 Tela de autenticação (migradas para `pages` por boas práticas)
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUser(currentUser);
            setUserData(userSnap.data());
          } else {
            console.warn("Usuário não encontrado no Firestore. Deslogando...");
            await signOut(auth);
            setUser(null);
            setUserData(null);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setUser(null);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Tela de carregamento
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-700">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-lg font-semibold">Carregando informações...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* 🔸 Usuário não logado */}
        {!user ? (
          <>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : userData?.userRole === "profissional" ? (
          // 🔹 Rotas do PROFISSIONAL
          <>
            <Route path="/" element={<Navigate to="/home-pro" replace />} />
            <Route
              path="/home-pro"
              element={<HomePro user={user} userData={userData} />}
            />
            <Route
              path="/pro-appointments"
              element={<ProAppointments user={user} userData={userData} />}
            />
            <Route
              path="/pro-history"
              element={<ProHistory user={user} userData={userData} />} // ✅ Nova rota
            />
            <Route path="/services" element={<Services />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/home-pro" replace />} />
          </>
        ) : userData?.userRole === "admin" ? (
          // 🔹 Rotas do ADMIN
          <>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* também manter as rotas de cliente caso admin queira usá-las */}
          <Route path="/home-client" element={<HomeClient user={user} userData={userData} />} />
          <Route path="/appointments" element={<Appointments user={user} userData={userData} />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
          ) : (
          // 🔹 Rotas do CLIENTE
          <>
            <Route path="/" element={<Navigate to="/home-client" replace />} />
            <Route
              path="/home-client"
              element={<HomeClient user={user} userData={userData} />}
            />
            <Route
              path="/appointments"
              element={<Appointments user={user} userData={userData} />}
            />
            <Route path="/services" element={<Services />} />
            <Route path="/history" element={<History />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/home-client" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}
