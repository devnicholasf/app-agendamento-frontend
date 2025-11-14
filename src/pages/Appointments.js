// src/pages/Appointments.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth, db } from "../firebaseConfig";
import { ArrowLeft, Trash2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export default function Appointments() {
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedProfessional, setSelectedProfessional] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState([]); // {time, occupied}
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPros, setLoadingPros] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const navigate = useNavigate();

  // Carrega serviços e profissionais
  useEffect(() => {
    async function fetchData() {
      try {
        const servicesRes = await axios.get("http://localhost:5000/api/services");
        setServices(servicesRes.data);

        // Carrega profissionais da sua collection users (userRole === 'profissional')
        const q = query(collection(db, "users"), where("userRole", "==", "profissional"));
        const snapshot = await getDocs(q);
        const profs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProfessionals(profs);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setMessage("❌ Erro ao carregar serviços/profissionais.");
      } finally {
        setLoadingPros(false);
      }
    }
    fetchData();
  }, []);

  // Carrega agendamentos do cliente logado (últimos 3, mais recentes no topo)
  useEffect(() => {
    async function loadAppointments() {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const res = await axios.get(`http://localhost:5000/api/appointments?userId=${user.uid}`);
        const now = new Date();

        const enrichedAppointments = await Promise.all(
          res.data.map(async (a) => {
            // Interpretar a data manualmente (sem UTC)
            const [year, month, day] = a.date.split("-");
            const [hours, minutes] = (a.time || "00:00").split(":");
            const appointmentDate = new Date(year, month - 1, day, hours, minutes);

            let status = a.status;

            // Trocar lógica: se passou e ainda 'Pendente' => ATRASADO
            if (appointmentDate < now && a.status === "Pendente") {
              status = "Atrasado";
              try {
                await axios.patch(`http://localhost:5000/api/appointments/${a.id}`, {
                  status: "Atrasado",
                });
                const apptRef = doc(db, "appointments", a.id);
                await updateDoc(apptRef, { status: "Atrasado" });
              } catch (err) {
                console.warn("Falha ao atualizar status automático:", err);
              }
            }

            let serviceName = "Serviço não encontrado";
            try {
              const serviceDoc = await getDoc(doc(db, "services", a.serviceId));
              if (serviceDoc.exists())
                serviceName = serviceDoc.data().name || serviceDoc.data().nome;
            } catch {}

            let professionalName = "Profissional não encontrado";
            try {
              const proDoc = await getDoc(doc(db, "users", a.professionalId));
              if (proDoc.exists())
                professionalName = proDoc.data().nome || proDoc.data().name;
            } catch {}

            return { ...a, status, serviceName, professionalName };
          })
        );

        const visibleToClient = enrichedAppointments.filter((a) => !a.hiddenFromClient);

        // Ordena do mais recente para o mais antigo (date+time)
        visibleToClient.sort((a, b) => {
          const [yA, mA, dA] = a.date.split("-");
          const [yB, mB, dB] = b.date.split("-");
          const [hA, minA] = (a.time || "00:00").split(":");
          const [hB, minB] = (b.time || "00:00").split(":");
          const dateA = new Date(yA, mA - 1, dA, hA, minA);
          const dateB = new Date(yB, mB - 1, dB, hB, minB);
          return dateB - dateA;
        });

        const latestThree = visibleToClient.slice(0, 3);
        setAppointments(latestThree);
      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
      }
    }
    loadAppointments();
  }, []);

  // Quando profissional ou data mudar, buscar disponibilidade
  useEffect(() => {
    async function fetchAvailable() {
      setSlots([]);
      setTime("");
      if (!selectedProfessional || !date) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/appointments/available?professionalId=${selectedProfessional}&date=${date}`
        );
        setSlots(res.data.slots || []);
      } catch (err) {
        console.error("Erro ao buscar disponibilidade:", err);
      }
    }
    fetchAvailable();
  }, [selectedProfessional, date]);

  // Novo agendamento
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedService || !selectedProfessional || !date || !time) {
      setMessage("⚠️ Preencha todos os campos!");
      return;
    }

    // Valida horário não ocupado (cliente-side também)
    const chosenSlot = slots.find(s => s.time === time);
    if (!chosenSlot || chosenSlot.occupied) {
      setMessage("⚠️ Horário indisponível. Escolha outro horário.");
      return;
    }

    // Cria data local e verifica se não está em passado
    const [year, month, day] = date.split("-");
    const [hours, minutes] = time.split(":");
    const appointmentDate = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    if (appointmentDate < now) {
      setMessage("⚠️ Não é possível agendar em datas passadas!");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setMessage("⚠️ Você precisa estar logado!");
        setLoading(false);
        return;
      }

      const formattedDate = `${year}-${month}-${day}`; // armazenar exatamente o valor do input

      const res = await axios.post("http://localhost:5000/api/appointments", {
        userId: user.uid,
        serviceId: selectedService,
        professionalId: selectedProfessional,
        date: formattedDate,
        time,
        status: "Pendente",
        hiddenFromClient: false,
      });

      const newService = services.find((s) => s.id === selectedService);
      const newProfessional = professionals.find((p) => p.id === selectedProfessional);

      const updatedList = [
        {
          id: res.data.id,
          serviceName: newService?.name || "Serviço",
          professionalName: newProfessional?.nome || "Profissional",
          date: formattedDate,
          time,
          status: "Pendente",
        },
        ...appointments,
      ]
        .sort((a, b) => {
          const [yA, mA, dA] = a.date.split("-");
          const [yB, mB, dB] = b.date.split("-");
          const [hA, minA] = (a.time || "00:00").split(":");
          const [hB, minB] = (b.time || "00:00").split(":");
          return new Date(yB, mB - 1, dB, hB, minB) - new Date(yA, mA - 1, dA, hA, minA);
        })
        .slice(0, 3);

      setAppointments(updatedList);
      setMessage("✅ Agendamento criado com sucesso!");

      // Limpa formulário
      setSelectedService("");
      setSelectedProfessional("");
      setDate("");
      setTime("");
      setSlots([]);

      // Navega para notificações (conforme pedido)
      navigate("/notifications");
    } catch (err) {
      console.error("Erro ao criar agendamento:", err);
      setMessage("❌ Erro ao Agendar.");
    } finally {
      setLoading(false);
    }
  };

  // Ocultar agendamento (mantém histórico)
  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await axios.patch(`http://localhost:5000/api/appointments/${confirmDeleteId}`, {
        hiddenFromClient: true,
      });
      setAppointments((prev) => prev.filter((a) => a.id !== confirmDeleteId));
      setMessage("🗑️ Agendamento removido da sua lista (permanece no histórico).");
    } catch {
      setMessage("❌ Erro ao remover o agendamento.");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // Cancelar agendamento
  const confirmCancel = async () => {
    if (!confirmCancelId) return;
    try {
      await axios.patch(`http://localhost:5000/api/appointments/${confirmCancelId}`, {
        status: "Cancelado",
      });
      const apptRef = doc(db, "appointments", confirmCancelId);
      await updateDoc(apptRef, { status: "Cancelado" });

      setAppointments((prev) =>
        prev.map((a) => (a.id === confirmCancelId ? { ...a, status: "Cancelado" } : a))
      );

      setMessage("🚫 Agendamento cancelado com sucesso!");
    } catch {
      setMessage("❌ Erro ao cancelar o agendamento.");
    } finally {
      setConfirmCancelId(null);
    }
  };

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex flex-col items-center justify-center p-4">
      {/* Formulário de Novo Agendamento */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mb-6 relative">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-purple-600 mb-4 hover:text-purple-800 transition"
        >
          <ArrowLeft size={20} className="mr-2" /> Voltar
        </button>

        <h1 className="text-2xl font-bold text-purple-600 mb-4 text-center">
          Novo Agendamento
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            className="w-full border rounded-lg p-2"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
          >
            <option value="">Selecione o serviço</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.nome}
              </option>
            ))}
          </select>

          <select
            className="w-full border rounded-lg p-2"
            value={selectedProfessional}
            onChange={(e) => setSelectedProfessional(e.target.value)}
          >
            <option value="">Selecione o profissional</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome || p.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="w-full border rounded-lg p-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={minDate}
          />

          {/* Horários: select com slots retornados pelo backend */}
          <select
            className="w-full border rounded-lg p-2"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={!slots.length}
          >
            <option value="">{slots.length ? "Selecione o horário" : "Escolha profissional/data"}</option>
            {slots.map((s) => (
              <option key={s.time} value={s.time} disabled={s.occupied}>
                {s.time} {s.occupied ? "— Ocupado" : ""}
              </option>
            ))}
          </select>

          <button
            disabled={loading}
            className="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
          >
            {loading ? "Agendando..." : "Confirmar Agendamento"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center font-medium text-gray-600">{message}</p>
        )}
      </div>

      {/* Lista de Agendamentos */}
      <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-purple-600 mb-4 text-center">
          Meus Agendamentos
        </h2>

        {appointments.length === 0 ? (
          <p className="text-gray-500 text-center">Nenhum agendamento encontrado.</p>
        ) : (
          <ul className="space-y-3">
            {appointments.map((a) => (
              <li
                key={a.id}
                className="bg-purple-50 rounded-xl p-3 flex justify-between items-start"
              >
                <div>
                  <p><strong>Serviço:</strong> {a.serviceName}</p>
                  <p><strong>Profissional:</strong> {a.professionalName}</p>
                  <p>
                    <strong>Data:</strong>{" "}
                    {a.date.split("-").reverse().join("/")}
                  </p>
                  <p><strong>Hora:</strong> {a.time}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`${
                        a.status === "Completo"
                          ? "text-green-600"
                          : a.status === "Cancelado"
                          ? "text-red-600"
                          : a.status === "Atrasado"
                          ? "text-orange-600"
                          : "text-yellow-600"
                      } font-semibold`}
                    >
                      {a.status}
                    </span>
                  </p>
                  {a.status === "Pendente" && (
                    <button
                      onClick={() => setConfirmCancelId(a.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium mt-2"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setConfirmDeleteId(a.id)}
                  className="text-red-600 hover:text-red-800 transition ml-2"
                  title="Remover da sua lista"
                >
                  <Trash2 size={20} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modais */}
      {confirmCancelId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-3xl p-6 shadow-2xl text-center w-80 animate-fade-in">
            <XCircle className="text-purple-600 mx-auto mb-3" size={48} />
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Deseja cancelar este agendamento?
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmCancelId(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                Não
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-3xl p-6 shadow-2xl text-center w-80 animate-fade-in">
            <XCircle className="text-purple-600 mx-auto mb-3" size={48} />
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Deseja remover este agendamento da sua lista? (Ficará no histórico)
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
