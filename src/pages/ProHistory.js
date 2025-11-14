import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";

export default function ProHistory() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAppointments() {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        const res = await axios.get(
          `http://localhost:5000/api/appointments?professionalId=${user.uid}&history=true`
        );

        setAppointments(res.data);
      } catch (err) {
        console.error("Erro ao carregar histórico do profissional:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-purple-600 mb-4 hover:text-purple-800 transition"
        >
          <ArrowLeft size={20} className="mr-2" /> Voltar
        </button>

        <h1 className="text-2xl font-bold text-purple-600 mb-6 text-center">
          Histórico de Agendamentos (Profissional)
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">Carregando...</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-500 text-center">
            Nenhum histórico recente encontrado.
          </p>
        ) : (
          <ul className="space-y-4">
            {appointments.map((a) => (
              <li key={a.id} className="p-4 bg-purple-50 rounded-xl">
                <p><strong>Serviço:</strong> {a.serviceName}</p>
                <p><strong>Cliente:</strong> {a.userName}</p>
                <p><strong>Data:</strong> {a.date}</p>
                <p><strong>Horário:</strong> {a.time}</p>
                <p><strong>Status:</strong> ✅ {a.status}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
