// src/pages/AdminDashboard.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  Users,
  Calendar,
  Bell,
  LogOut,
  Shield,
  Loader2,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ========================================================================== */
/* 🟣 PAINEL ADMINISTRATIVO (com abas)                                        */
/* ========================================================================== */
export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | users | appointments | notifications | settings

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const navigate = useNavigate();

  // helper: pega idToken atual
  async function getAuthHeader() {
    const user = auth.currentUser;
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  /* ====================================================================== */
  /* 🔐 Autenticação + Verificação de ADMIN                                 */
  /* ====================================================================== */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        // busca o papel (role) diretamente do backend (rota pública /api/users/:id)
        const resUser = await axios.get(`http://localhost:5000/api/users/${user.uid}`);
        if (resUser.data.userRole !== "admin") {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        // carrega o painel (overview)
        await loadDashboardData();
      } catch (err) {
        console.error("Erro ao validar admin:", err);
        setAccessDenied(true);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  /* ====================================================================== */
  /* 📌 Carregar dados da aba DASHBOARD                                     */
  /* ====================================================================== */
  async function loadDashboardData() {
    try {
      const headers = await getAuthHeader();
      const stats = await axios.get("http://localhost:5000/api/admin/overview", { headers });
      setOverview(stats.data);
    } catch (err) {
      console.error("Erro ao obter overview:", err);
    } finally {
      setLoading(false);
    }
  }

  /* ====================================================================== */
  /* 👥 Carregar LISTA DE USUÁRIOS                                          */
  /* ====================================================================== */
  async function loadUsers() {
    try {
      const headers = await getAuthHeader();
      const res = await axios.get("http://localhost:5000/api/admin/users", { headers });
      setUsers(res.data);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    }
  }

  /* ====================================================================== */
  /* 📅 Carregar AGENDAMENTOS                                               */
  /* ====================================================================== */
  async function loadAppointments() {
    try {
      const headers = await getAuthHeader();
      const res = await axios.get("http://localhost:5000/api/admin/appointments", { headers });
      setAppointments(res.data);
    } catch (err) {
      console.error("Erro ao carregar agendamentos:", err);
    }
  }

  /* ====================================================================== */
  /* 🔔 Carregar NOTIFICAÇÕES                                               */
  /* ====================================================================== */
  async function loadNotifications() {
    try {
      const headers = await getAuthHeader();
      const res = await axios.get("http://localhost:5000/api/admin/notifications", { headers });
      setNotifications(res.data);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    }
  }

  /* ====================================================================== */
  /* 🟪 Alterar ABA (carrega conteúdo dinamicamente)                        */
  /* ====================================================================== */
  async function handleTabChange(tab) {
    setActiveTab(tab);

    if (tab === "users") await loadUsers();
    if (tab === "appointments") await loadAppointments();
    if (tab === "notifications") await loadNotifications();
  }

  /* ====================================================================== */
  /* 🚪 Logout                                                              */
  /* ====================================================================== */
  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  /* ====================================================================== */
  /* 🟡 TELAS DE LOADING | ACESSO NEGADO                                   */
  /* ====================================================================== */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 text-white">
        <Loader2 className="animate-spin w-10 h-10 mb-2" />
        <p>Carregando painel...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 text-white text-center p-4">
        <AlertTriangle className="w-10 h-10 text-yellow-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso negado</h1>
        <p className="mb-6">Você não tem permissão para acessar esta página.</p>
        <button
          onClick={handleLogout}
          className="bg-white text-purple-600 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition"
        >
          Voltar ao login
        </button>
      </div>
    );
  }

  /* ====================================================================== */
  /* 🟣 COMPONENTES DAS ABAS                                                */
  /* ====================================================================== */

  function DashboardTab() {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Usuários cadastrados"
            value={overview?.usersCount}
            color="from-blue-400 to-blue-600"
          />
          <StatCard
            icon={Calendar}
            title="Agendamentos"
            value={overview?.appointmentsCount}
            color="from-green-400 to-green-600"
          />
          <StatCard
            icon={Bell}
            title="Notificações enviadas"
            value={overview?.notificationsCount}
            color="from-purple-400 to-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ListSection
            title="Últimos Usuários"
            data={overview?.recentUsers}
            empty="Nenhum usuário encontrado."
          />
          <ListSection
            title="Últimos Agendamentos"
            data={overview?.recentAppointments}
            empty="Nenhum agendamento recente."
          />
        </div>
      </>
    );
  }

  /* ====================================================================== */
  /* 👥 TAB USUÁRIOS – PROMOVER ROLES                                      */
  /* ====================================================================== */
  async function updateUserRole(id, newRole, companyId = null) {
    try {
      const headers = await getAuthHeader();
      await axios.patch(`http://localhost:5000/api/admin/users/${id}/role`, { role: newRole, companyId }, { headers });
      await loadUsers();
      alert("Papel atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar role:", err);
      alert("Erro ao atualizar role.");
    }
  }

  function UsersTab() {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-purple-600 mb-4 flex items-center gap-2">
          <Users size={20} /> Gerenciar Usuários
        </h2>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Nome</th>
              <th className="py-2">Email</th>
              <th className="py-2">Papel</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-3">{u.nome}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="border rounded px-2 py-1"
                    value={u.userRole}
                    onChange={(e) => updateUserRole(u.id, e.target.value, u.companyId || null)}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="profissional">Profissional</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td>
                  <button
                    className="text-purple-600 hover:underline"
                    onClick={() => updateUserRole(u.id, u.userRole)}
                  >
                    Salvar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* ====================================================================== */
  /* 📅 TAB AGENDAMENTOS                                                   */
  /* ====================================================================== */
  function AppointmentsTab() {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-purple-600 mb-4 flex items-center gap-2">
          <Calendar size={20} /> Agendamentos
        </h2>

        {appointments.length === 0 ? (
          <p className="text-gray-500">Nenhum agendamento encontrado.</p>
        ) : (
          <ul className="divide-y">
            {appointments.map((a) => (
              <li key={a.id} className="py-2">
                <p className="font-medium">
                  {a.date} às {a.time} — {a.userName}
                </p>
                <p className="text-sm text-gray-500">
                  Profissional: {a.professionalName}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  /* ====================================================================== */
  /* 🔔 TAB NOTIFICAÇÕES                                                   */
  /* ====================================================================== */
  function NotificationsTab() {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-purple-600 mb-4 flex items-center gap-2">
          <Bell size={20} /> Notificações
        </h2>

        {notifications.length === 0 ? (
          <p className="text-gray-500">Nenhuma notificação encontrada.</p>
        ) : (
          <ul className="divide-y">
            {notifications.map((n) => (
              <li key={n.id} className="py-2">
                <p>{n.title}</p>
                <p className="text-sm text-gray-500">{n.message || n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  /* ====================================================================== */
  /* ⚙️ TAB CONFIGURAÇÕES (expansível depois)                              */
  /* ====================================================================== */
  function SettingsTab() {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-purple-600 mb-4 flex items-center gap-2">
          <Settings size={20} /> Configurações
        </h2>
        <p className="text-gray-500">Futuramente você pode colocar aqui:</p>
        <ul className="list-disc ml-6 mt-2 text-gray-600">
          <li>Gerenciar planilhas e relatórios</li>
          <li>Configurar horários da empresa</li>
          <li>Controlar permissões avançadas</li>
          <li>Gerenciar assinatura do admin</li>
        </ul>
      </div>
    );
  }

  /* ====================================================================== */
  /* 🟣 RENDERIZAÇÃO FINAL                                                  */
  /* ====================================================================== */

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-purple-600 flex items-center gap-2">
          <Shield /> Painel Administrativo
        </h1>

        <button
          onClick={handleLogout}
          className="flex items-center text-sm text-gray-700 hover:text-purple-600 transition"
        >
          <LogOut size={18} className="mr-1" /> Sair
        </button>
      </header>

      {/* Abas */}
      <nav className="bg-white shadow flex gap-6 px-6 py-3">
        <TabButton
          active={activeTab === "dashboard"}
          onClick={() => handleTabChange("dashboard")}
        >
          <Shield size={16} /> Dashboard
        </TabButton>

        <TabButton
          active={activeTab === "users"}
          onClick={() => handleTabChange("users")}
        >
          <Users size={16} /> Usuários
        </TabButton>

        <TabButton
          active={activeTab === "appointments"}
          onClick={() => handleTabChange("appointments")}
        >
          <Calendar size={16} /> Agendamentos
        </TabButton>

        <TabButton
          active={activeTab === "notifications"}
          onClick={() => handleTabChange("notifications")}
        >
          <Bell size={16} /> Notificações
        </TabButton>

        <TabButton
          active={activeTab === "settings"}
          onClick={() => handleTabChange("settings")}
        >
          <Settings size={16} /> Configurações
        </TabButton>
      </nav>

      {/* Conteúdo da Aba */}
      <main className="flex-1 p-6 bg-gray-50">
        {activeTab === "dashboard" && overview && <DashboardTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "appointments" && <AppointmentsTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

/* ========================================================================== */
/* COMPONENTE DE BOTÃO DE ABA                                                */
/* ========================================================================== */
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition 
        ${active ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-200"}
      `}
    >
      {children}
    </button>
  );
}

/* ========================================================================== */
/* COMPONENTES ORIGINAIS (cards + listas)                                    */
/* ========================================================================== */
function StatCard({ icon: Icon, title, value, color }) {
  return (
    <div
      className={`bg-gradient-to-r ${color} text-white rounded-2xl shadow-lg p-6 flex items-center justify-between`}
    >
      <div>
        <p className="text-sm opacity-80">{title}</p>
        <h2 className="text-3xl font-bold">{value ?? 0}</h2>
      </div>
      <Icon size={36} className="opacity-80" />
    </div>
  );
}

function ListSection({ title, data, empty }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-bold text-purple-600 mb-4">{title}</h2>
      {data?.length === 0 ? (
        <p className="text-gray-400 text-sm">{empty}</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {data.slice(0, 5).map((item, i) => (
            <li key={i} className="py-2">
              <p className="font-medium">{item.nome || item.title}</p>
              <p className="text-sm text-gray-500">
                {item.email || item.date || item.createdAt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
