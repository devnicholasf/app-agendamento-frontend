import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth, db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";

export default function ProAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // 🔹 Verifica se o agendamento já passou
  const checkIfComplete = (date, time) => {
    const now = new Date();
    const apptDate = new Date(`${date}T${time}`);
    return now > apptDate;
  };

  // 🔹 Carrega agendamentos do profissional logado
  useEffect(() => {
    async function loadAppointments() {
      const user = auth.currentUser;
      if (!user) {
        console.warn("Usuário não autenticado");
        return;
      }

      try {
        // 🔥 Corrigido endpoint (removido /professional)
        const res = await axios.get(
          `http://localhost:5000/api/appointments?professionalId=${user.uid}`
        );

        // Atualiza status automaticamente (Completo se a data já passou)
        const updated = res.data.map((a) => ({
          ...a,
          status: checkIfComplete(a.date, a.time) ? "Completo" : a.status,
        }));

        setAppointments(updated);
      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
        setMessage("❌ Erro ao carregar agendamentos.");
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, []);

  // 🔹 Atualiza status (Completo ou Cancelado)
  const updateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/appointments/${id}`, {
        status: newStatus,
      });

      // Atualiza no Firestore também
      const appointmentRef = doc(db, "appointments", id);
      await updateDoc(appointmentRef, { status: newStatus });

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );

      setMessage(
        newStatus === "Completo"
          ? "✅ Agendamento concluído!"
          : "❌ Agendamento cancelado!"
      );
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      setMessage("❌ Erro ao atualizar status.");
    }
  };

  // 🔹 Atualiza automaticamente agendamentos antigos
  useEffect(() => {
    const autoUpdate = async () => {
      const outdated = appointments.filter(
        (a) => a.status === "Pendente" && checkIfComplete(a.date, a.time)
      );

      for (let a of outdated) {
        try {
          await axios.patch(`http://localhost:5000/api/appointments/${a.id}`, {
            status: "Completo",
          });
          const appointmentRef = doc(db, "appointments", a.id);
          await updateDoc(appointmentRef, { status: "Completo" });
        } catch (err) {
          console.error("Erro ao atualizar automaticamente:", err);
        }
      }

      if (outdated.length > 0) {
        setAppointments((prev) =>
          prev.map((a) =>
            checkIfComplete(a.date, a.time)
              ? { ...a, status: "Completo" }
              : a
          )
        );
      }
    };

    if (appointments.length > 0) autoUpdate();
  }, [appointments]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mb-6 relative">
        {/* 🔙 Botão Voltar */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-purple-600 mb-4 hover:text-purple-800 transition"
        >
          <ArrowLeft size={20} className="mr-2" /> Voltar
        </button>

        <h1 className="text-2xl font-bold text-purple-600 mb-4 text-center">
          Meus Agendamentos
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">Carregando...</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-500 text-center">
            Nenhum agendamento encontrado.
          </p>
        ) : (
          <ul className="space-y-3">
            {appointments.map((a) => (
              <li
                key={a.id}
                className="bg-purple-50 rounded-xl p-3 flex justify-between items-start"
              >
                <div>
                  <p>
                    <strong>Cliente:</strong> {a.userName}
                  </p>
                  <p>
                    <strong>Serviço:</strong> {a.serviceName}
                  </p>
                  <p>
                    <strong>Data:</strong> {a.date}
                  </p>
                  <p>
                    <strong>Hora:</strong> {a.time}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`font-semibold ${
                        a.status === "Completo"
                          ? "text-green-600"
                          : a.status === "Cancelado"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {a.status}
                    </span>
                  </p>
                </div>

                {a.status === "Pendente" && (
                  <div className="flex flex-col ml-2 mt-2 space-y-1">
                    <button
                      onClick={() => updateStatus(a.id, "Completo")}
                      className="text-green-600 hover:text-green-800 transition"
                      title="Marcar como completo"
                    >
                      <CheckCircle size={24} />
                    </button>
                    <button
                      onClick={() => updateStatus(a.id, "Cancelado")}
                      className="text-red-600 hover:text-red-800 transition"
                      title="Cancelar agendamento"
                    >
                      <XCircle size={24} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {message && (
          <p className="mt-4 text-center font-medium text-gray-600 animate-fade-in">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
