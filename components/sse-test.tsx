"use client";

import { useState, useEffect, useRef } from "react";

export default function SSETest() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = () => {
    console.log("🔗 Test SSE: Tentative de connexion...");
    setError(null);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource("/api/sensors/stream");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("✅ Test SSE: Connexion établie");
        setIsConnected(true);
        setMessages((prev) => [
          ...prev,
          `✅ Connexion établie - ${new Date().toLocaleTimeString()}`,
        ]);
      };

      eventSource.onmessage = (event) => {
        console.log("📨 Test SSE: Message reçu:", event.data);
        setMessages((prev) => [
          ...prev,
          `📨 ${event.data.substring(0, 100)}...`,
        ]);
      };

      eventSource.addEventListener("heartbeat", (event) => {
        console.log("💓 Test SSE: Heartbeat reçu:", event.data);
        setMessages((prev) => [...prev, `💓 Heartbeat: ${event.data}`]);
      });

      eventSource.onerror = (error) => {
        console.error("❌ Test SSE: Erreur:", error);
        setIsConnected(false);
        setError("Erreur de connexion SSE");
        setMessages((prev) => [
          ...prev,
          `❌ Erreur de connexion - ${new Date().toLocaleTimeString()}`,
        ]);
      };
    } catch (error) {
      console.error("❌ Test SSE: Erreur création EventSource:", error);
      setError("Erreur lors de la création de la connexion");
    }
  };

  const disconnect = () => {
    console.log("🔌 Test SSE: Déconnexion...");
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setMessages((prev) => [
      ...prev,
      `🔌 Déconnecté - ${new Date().toLocaleTimeString()}`,
    ]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test SSE Simple</h1>

      <div className="mb-4">
        <span
          className={`inline-block w-3 h-3 rounded-full mr-2 ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        ></span>
        Statut: {isConnected ? "Connecté" : "Déconnecté"}
        {error && <span className="text-red-600 ml-2">({error})</span>}
      </div>

      <div className="mb-4 space-x-2">
        <button
          onClick={connect}
          disabled={isConnected}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
        >
          Connecter
        </button>
        <button
          onClick={disconnect}
          disabled={!isConnected}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
        >
          Déconnecter
        </button>
        <button
          onClick={clearMessages}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Vider
        </button>
      </div>

      <div className="border rounded p-4 h-96 overflow-y-auto bg-gray-50">
        <h3 className="font-bold mb-2">Messages ({messages.length}):</h3>
        {messages.length === 0 ? (
          <p className="text-gray-500">Aucun message reçu</p>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, index) => (
              <div key={index} className="text-sm font-mono">
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
