// src/pages/History.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function History() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [monthsAvailable, setMonthsAvailable] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAppointments() {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/");
          return;
        }

        const res = await axios.get(
          `http://localhost:5000/api/appointments?userId=${user.uid}`
        );

        const now = new Date();

        const enrichedAppointments = await Promise.all(
          res.data.map(async (a) => {
            // ❗ Interpreta a data + hora em horário local (evita criação com UTC)
            const [y, m, d] = (a.date || "").split("-");
            const [hh, mm] = (a.time || "00:00").split(":");
            const appointmentDate = new Date(
              Number(y),
              Number(m) - 1,
              Number(d),
              Number(hh || 0),
              Number(mm || 0)
            );

            let status = a.status;

            // Atualiza automaticamente para "Completo" se o horário já passou
            if (appointmentDate < now && a.status === "Pendente") {
              try {
                // atualiza no backend (persistir)
                await axios.patch(
                  `http://localhost:5000/api/appointments/${a.id}`,
                  { status: "Completo" }
                );
              } catch (err) {
                console.warn("Falha ao atualizar status no backend:", err);
              }

              try {
                // atualiza no Firestore também
                const apptRef = doc(db, "appointments", a.id);
                await updateDoc(apptRef, { status: "Completo" });
              } catch (err) {
                console.warn("Falha ao atualizar status no Firestore:", err);
              }

              status = "Completo";
            }

            // Busca nome do serviço
            let serviceName = "Serviço não encontrado";
            try {
              const serviceDoc = await getDoc(doc(db, "services", a.serviceId));
              if (serviceDoc.exists()) {
                const s = serviceDoc.data();
                serviceName = s.name || s.nome || serviceName;
              }
            } catch (err) {
              console.warn("Erro ao buscar serviço:", err);
            }

            // Busca nome do profissional
            let professionalName = "Profissional não encontrado";
            try {
              const proDoc = await getDoc(doc(db, "users", a.professionalId));
              if (proDoc.exists()) {
                const p = proDoc.data();
                professionalName = p.nome || p.name || professionalName;
              }
            } catch (err) {
              console.warn("Erro ao buscar profissional:", err);
            }

            return { ...a, status, serviceName, professionalName };
          })
        );

        // 🔹 Ordenar agendamentos do mais novo para o mais antigo
        const sortedAppointments = enrichedAppointments.sort((a, b) => {
          const [yA, mA, dA] = (a.date || "").split("-");
          const [hhA, mmA] = (a.time || "00:00").split(":");
          const [yB, mB, dB] = (b.date || "").split("-");
          const [hhB, mmB] = (b.time || "00:00").split(":");

          const dateA = new Date(Number(yA), Number(mA) - 1, Number(dA), Number(hhA || 0), Number(mmA || 0));
          const dateB = new Date(Number(yB), Number(mB) - 1, Number(dB), Number(hhB || 0), Number(mmB || 0));
          return dateB - dateA; // ordem decrescente
        });

        // 🔹 Agrupar por mês/ano (já ordenado), usando data local
        const grouped = sortedAppointments.reduce((acc, appt) => {
          const [y, m, d] = (appt.date || "").split("-");
          const localDate = new Date(Number(y), Number(m) - 1, Number(d));
          const key = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}`;
          acc[key] = acc[key] ? [...acc[key], appt] : [appt];
          return acc;
        }, {});

        // 🔹 Ordenar meses (mais recente primeiro)
        const sortedKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

        setMonthsAvailable(sortedKeys);
        setSelectedMonth(sortedKeys[0] || "");
        setAppointments(grouped);
      } catch (err) {
        console.error("Erro ao carregar histórico:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, [navigate]);

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const renderMonthTitle = (key) => {
    const [year, month] = key.split("-");
    return `${monthNames[Number(month) - 1]} de ${year}`;
  };

  // util: formata yyyy-mm-dd para dd/mm/yyyy sem usar Date(...) que interpretaria UTC
  const formatDateToBR = (isoDate) => {
    if (!isoDate) return "—";
    return isoDate.split("-").reverse().join("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl">
        {/* 🔙 Voltar */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-purple-600 mb-4 hover:text-purple-800 transition"
        >
          <ArrowLeft size={20} className="mr-2" /> Voltar
        </button>

        <h1 className="text-2xl font-bold text-purple-600 mb-6 text-center">
          Histórico de Agendamentos
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">Carregando...</p>
        ) : monthsAvailable.length === 0 ? (
          <p className="text-gray-500 text-center">
            Nenhum agendamento encontrado.
          </p>
        ) : (
          <>
            {/* 🔸 Seletor de mês */}
            <div className="flex justify-center items-center mb-6">
              <div className="flex items-center bg-purple-50 rounded-lg px-4 py-2 shadow-inner">
                <Calendar className="text-purple-600 mr-2" size={20} />
                <select
                  className="bg-transparent text-purple-700 font-semibold focus:outline-none"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {monthsAvailable.map((key) => (
                    <option key={key} value={key}>
                      {renderMonthTitle(key)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 🔸 Lista de agendamentos filtrados */}
            <div className="space-y-6 animate-fadeIn">
              {appointments[selectedMonth]?.map((a) => (
                <div
                  key={a.id}
                  className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 shadow-sm hover:shadow-md transition"
                >
                  <p className="font-semibold text-purple-700">
                    {a.serviceName}
                  </p>
                  <p className="text-gray-600 text-sm mb-1">
                    Profissional: {a.professionalName}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Data: {formatDateToBR(a.date)} — {a.time}
                  </p>

                  <p className="mt-2">
                    <strong>Status:</strong>{" "}
                    <span
                      className={`${
                        a.status === "Completo"
                          ? "text-green-600 font-semibold"
                          : a.status === "Cancelado"
                          ? "text-red-600 font-semibold"
                          : "text-yellow-600 font-semibold"
                      }`}
                    >
                      {a.status}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
