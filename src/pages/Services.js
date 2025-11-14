import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Services() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/services")
      .then((res) => setServices(res.data))
      .catch((err) => console.error("Erro ao buscar serviços:", err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-purple-600 mb-6 text-center">
          Profissionais e Serviços
        </h1>

        <div className="space-y-4">
          {services.map((s) => (
            <div
              key={s.id}
              className="p-4 border rounded-xl shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold text-gray-800">{s.name}</h2>
              <p className="text-gray-600">{s.description}</p>
              <p className="text-purple-600 font-semibold mt-2">
                R$ {s.price.toFixed(2)}
              </p>
              {s.professional && (
                <p className="text-gray-500 text-sm mt-1">
                  Profissional: {s.professional}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
