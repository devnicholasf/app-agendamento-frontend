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
  const [companies, setCompanies] = useState([]);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedProfessional, setSelectedProfessional] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]); // [{time, available}]
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPros, setLoadingPros] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const navigate = useNavigate();

  // Carrega empresas e profissionais (globais)
  useEffect(() => {
    async function fetchData() {
      try {
        const compRes = await axios.get("http://localhost:5000/api/companies");
        setCompanies(compRes.data);

        // profissionais: buscar todos profissionais (users.userRole == 'profissional')
        const q = query(collection(db, "users"), where("userRole", "==", "profissional"));
        const snapshot = await getDocs(q);
        const profs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProfessionals(profs);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setMessage("❌ Erro ao carregar dados.");
      } finally {
        setLoadingPros(false);
      }
    }
    fetchData();
  }, []);

  // Carrega agendamentos do cliente logado (últimos 3)
  useEffect(() => {
    async function loadAppointments() {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/appointments?userId=${user.uid}`);
        // ordem por date desc
        const data = res.data.sort((a,b) => (a.date < b.date ? 1 : -1)).slice(0,3);
        // adicionar nomes de serviço e profissional localmente (opcional)
        const enriched = await Promise.all(data.map(async (a) => {
          let serviceName = "Serviço";
          try {
            const s = await getDoc(doc(db, "services", a.serviceId));
            if (s.exists()) serviceName = s.data().name || s.data().nome;
          } catch {}
          let professionalName = "Profissional";
          try {
            const p = await getDoc(doc(db, "users", a.professionalId));
            if (p.exists()) professionalName = p.data().nome || p.data().name;
          } catch {}
          return { ...a, serviceName, professionalName };
        }));
        setAppointments(enriched);
      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
      }
    }
    loadAppointments();
  }, []);

  // Quando seleciona empresa, carregar serviços da empresa
  useEffect(() => {
    async function loadServices() {
      if (!selectedCompany) {
        setServices([]);
        return;
      }
      try {
        const res = await axios.get(`http://localhost:5000/api/companies/${selectedCompany}/services`);
        setServices(res.data);
      } catch (err) {
        console.error("Erro ao carregar serviços:", err);
      }
    }
    loadServices();
  }, [selectedCompany]);

  // Quando seleciona data + profissional + company -> buscar slots disponíveis
  useEffect(() => {
    async function loadSlots() {
      if (!selectedCompany || !selectedProfessional || !date) {
        setSlots([]);
        return;
      }
      try {
        const res = await axios.get("http://localhost:5000/api/appointments/available", {
          params: {
            companyId: selectedCompany,
            professionalId: selectedProfessional,
            date,
          },
        });
        setSlots(res.data || []);
      } catch (err) {
        console.error("Erro ao buscar slots:", err);
      }
    }
    loadSlots();
  }, [selectedCompany, selectedProfessional, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany || !selectedService || !selectedProfessional || !date || !timeSelected) {
      setMessage("⚠️ Preencha todos os campos e escolha um horário!");
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

      const res = await axios.post("http://localhost:5000/api/appointments", {
        userId: user.uid,
        companyId: selectedCompany,
        serviceId: selectedService,
        professionalId: selectedProfessional,
        date,
        time: timeSelected,
        status: "Pendente",
        hiddenFromClient: false,
      });

      // atualizar lista local (simplificado)
      setAppointments(prev => [{ id: res.data.id, date, time: timeSelected, serviceName: services.find(s=>s.id===selectedService)?.name || "Serviço", professionalName: professionals.find(p=>p.id===selectedProfessional)?.nome || "Profissional" }, ...prev].slice(0,3));
      setMessage("✅ Agendamento criado com sucesso!");
      // reset
      setSelectedService("");
      setSelectedProfessional("");
      setDate("");
      setSlots([]);
      setTimeSelected("");
    } catch (err) {
      console.error("Erro ao criar agendamento:", err);
      if (err.response && err.response.status === 409) setMessage("⚠️ Horário já indisponível. Escolha outro.");
      else setMessage("❌ Erro ao Agendar.");
    } finally {
      setLoading(false);
    }
  };

  // controlar slot selecionado
  const [timeSelected, setTimeSelected] = useState("");

  // excluir / ocultar agendamento (como antes)
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

  // cancelar
  const confirmCancel = async () => {
    if (!confirmCancelId) return;
    try {
      await axios.patch(`http://localhost:5000/api/appointments/${confirmCancelId}`, {
        status: "Cancelado",
      });
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
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mb-6 relative">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-purple-600 mb-4 hover:text-purple-800 transition"
        >
          <ArrowLeft size={20} className="mr-2" /> Voltar
        </button>

        <h1 className="text-2xl font-bold text-purple-600 mb-4 text-center">Novo Agendamento</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select className="w-full border rounded-lg p-2" value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
            <option value="">Selecione a empresa</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select className="w-full border rounded-lg p-2" value={selectedService} onChange={(e) => setSelectedService(e.target.value)} disabled={!selectedCompany}>
            <option value="">Selecione o serviço</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select className="w-full border rounded-lg p-2" value={selectedProfessional} onChange={(e) => setSelectedProfessional(e.target.value)} disabled={!selectedCompany}>
            <option value="">Selecione o profissional</option>
            {/* mostrar apenas profissionais da company (se users tiverem companyId) */}
            {professionals.filter(p => !p.companyId || p.companyId === selectedCompany || !selectedCompany).map(p => (
              <option key={p.id} value={p.id}>{p.nome || p.email}</option>
            ))}
          </select>

          <input type="date" className="w-full border rounded-lg p-2" value={date} onChange={(e) => setDate(e.target.value)} min={minDate} />

          {/* Slots UI */}
          {slots.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {slots.map(slot => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => slot.available && setTimeSelected(slot.time)}
                  disabled={!slot.available}
                  className={`py-2 rounded ${slot.available ? (timeSelected === slot.time ? "bg-purple-600 text-white" : "bg-white border") : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-2 items-center">
            <button disabled={loading} className="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition">
              {loading ? "Agendando..." : "Confirmar Agendamento"}
            </button>
          </div>
        </form>

        {message && <p className="mt-4 text-center font-medium text-gray-600">{message}</p>}
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-purple-600 mb-4 text-center">Meus Agendamentos</h2>

        {appointments.length === 0 ? (
          <p className="text-gray-500 text-center">Nenhum agendamento encontrado.</p>
        ) : (
          <ul className="space-y-3">
            {appointments.map((a) => (
              <li key={a.id} className="bg-purple-50 rounded-xl p-3 flex justify-between items-start">
                <div>
                  <p><strong>Serviço:</strong> {a.serviceName}</p>
                  <p><strong>Profissional:</strong> {a.professionalName}</p>
                  <p><strong>Data:</strong> {a.date.split("-").reverse().join("/")}</p>
                  <p><strong>Hora:</strong> {a.time}</p>
                  <p><strong>Status:</strong> <span className={`${a.status === "Completo" ? "text-green-600" : a.status === "Cancelado" ? "text-red-600" : "text-yellow-600"} font-semibold`}>{a.status}</span></p>
                  {a.status === "Pendente" && <button onClick={() => setConfirmCancelId(a.id)} className="text-red-600 hover:text-red-800 text-sm font-medium mt-2">Cancelar</button>}
                </div>

                <button onClick={() => setConfirmDeleteId(a.id)} className="text-red-600 hover:text-red-800 transition ml-2" title="Remover da sua lista">
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
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Deseja cancelar este agendamento?</h2>
            <div className="flex justify-center gap-4">
              <button onClick={() => setConfirmCancelId(null)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition">Não</button>
              <button onClick={confirmCancel} className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition">Sim, cancelar</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-3xl p-6 shadow-2xl text-center w-80 animate-fade-in">
            <XCircle className="text-purple-600 mx-auto mb-3" size={48} />
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Deseja remover este agendamento da sua lista? (Ficará no histórico)</h2>
            <div className="flex justify-center gap-4">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
