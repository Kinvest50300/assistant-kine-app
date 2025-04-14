
import { useEffect, useState } from "react";

export default function AssistantKine() {
  const [prenom, setPrenom] = useState("");
  const [patientData, setPatientData] = useState<any>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([]);

  const dateDuJour = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const phraseMotivante = "Tu progresses chaque jour 💪 Continue comme ça !";

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!prenom) return;
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "fetch-data", prenom }),
        });
        const data = await res.json();
        setPatientData(data);
      } catch (err) {
        console.error("Erreur récupération données patient:", err);
      }
    };

    fetchPatientData();
  }, [prenom]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { from: "user", text: input }];
    setMessages([...newMessages, { from: "bot", text: "..." }]);
    setInput("");

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "chat", prenom, message: input }),
      });

      const data = await res.json();
      setMessages([...newMessages, { from: "bot", text: data.reply || "❌ Pas de réponse du serveur." }]);
    } catch (error) {
      console.error("Erreur lors de l'appel API :", error);
      setMessages([...newMessages, { from: "bot", text: "❌ Erreur de connexion." }]);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto text-gray-800">
      <h1 className="text-3xl font-bold text-blue-800 mb-4">Assistant Kiné</h1>

      {!prenom && (
        <input
          className="border p-2 rounded w-full mb-6"
          placeholder="Entre ton prénom"
          onChange={(e) => setPrenom(e.target.value)}
        />
      )}

      {prenom && patientData && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow p-4">
            <p><strong>📅 Date :</strong> {dateDuJour}</p>
            <p><strong>🧘‍♂️ Exercice du jour :</strong> {patientData.exercice_du_jour}</p>
            <p><strong>📌 Consignes générales :</strong> Respire profondément. Ne force jamais sur la douleur.</p>
            <p><strong>🩺 Recommandations personnalisées :</strong> {patientData.remarques || "Aucune"}</p>
            <p className="italic text-blue-600 mt-2">“{phraseMotivante}”</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <h2 className="text-xl font-semibold mb-2">💬 Assistant Kiné</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg ${
                    msg.from === "user"
                      ? "bg-blue-100 text-right ml-auto w-fit"
                      : "bg-gray-100 text-left w-fit"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <input
                className="border p-2 rounded w-full"
                placeholder="Pose ta question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={handleSend}
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
