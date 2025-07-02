"use client";

import { useEffect } from "react";
import { useSensorStreamFixed } from "@/lib/hooks/use-sensor-stream-fixed";
import { useNotifications } from "@/hooks/use-notifications";

export function GlobalSSEConnection() {
  const { fetchNotifications } = useNotifications();

  // Connexion SSE globale pour recevoir les mises à jour
  useSensorStreamFixed({
    autoConnect: true,
    onConnect: () => {
      console.log("🌐 Connexion SSE globale établie");
    },
    onData: async (data) => {
      console.log(`🌐 Global SSE: ${data.length} nouvelles données reçues`);

      // Rafraîchir les notifications quand de nouvelles données arrivent
      // La vérification des seuils se fait côté serveur
      if (data.length > 0) {
        console.log(
          "📊 Nouvelles données détectées, rafraîchissement des notifications..."
        );
        fetchNotifications();
      }
    },
    onError: (error) => {
      console.error("❌ Erreur connexion SSE globale:", error);
    },
  });

  // Rafraîchir les notifications au montage du composant
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Ce composant ne rend rien visuellement
  return null;
}
