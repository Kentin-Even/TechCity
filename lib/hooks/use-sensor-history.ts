"use client";

import { useState, useEffect } from "react";
import { useSensorStreamFixed, SensorData } from "./use-sensor-stream-fixed";

interface UseSensorHistoryOptions {
  capteurId: number;
  hours?: number;
  autoConnect?: boolean;
}

interface UseSensorHistoryReturn {
  // Données combinées (historique + temps réel)
  historicalData: SensorData[];
  realtimeData: SensorData[];
  combinedData: SensorData[];

  // État de chargement
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;

  // Données du capteur actuel
  latestData: SensorData | null;

  // Contrôles
  refreshHistory: () => Promise<void>;
}

export function useSensorHistory({
  capteurId,
  hours = 24,
  autoConnect = true,
}: UseSensorHistoryOptions): UseSensorHistoryReturn {
  const [historicalData, setHistoricalData] = useState<SensorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Utiliser le hook temps réel
  const { isConnected, getLatestBySensor, getDataBySensor } =
    useSensorStreamFixed({
      autoConnect,
    });

  // Obtenir les données temps réel pour ce capteur
  const realtimeData = getDataBySensor(capteurId);
  const latestData = getLatestBySensor(capteurId);

  // Fonction pour récupérer l'historique
  const fetchHistoricalData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sensors/history?capteurId=${capteurId}&hours=${hours}`
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setHistoricalData(result.data);
      } else {
        throw new Error(result.error || "Erreur inconnue");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      console.error("Erreur récupération historique:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger l'historique au montage
  useEffect(() => {
    fetchHistoricalData();
  }, [capteurId, hours]);

  // Combiner les données historiques et temps réel
  const combinedData = (() => {
    // Créer un Set des timestamps des données temps réel pour éviter les doublons
    const realtimeTimestamps = new Set(
      realtimeData.map((data) => data.timestamp)
    );

    // Filtrer l'historique pour éviter les doublons avec le temps réel
    const filteredHistorical = historicalData.filter(
      (data) => !realtimeTimestamps.has(data.timestamp)
    );

    // Combiner et trier par timestamp (du plus récent au plus ancien)
    const combined = [...filteredHistorical, ...realtimeData];

    return (
      combined
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        // Garder seulement les données des X dernières heures
        .filter((data) => {
          const dataTime = new Date(data.timestamp).getTime();
          const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
          return dataTime >= cutoffTime;
        })
    );
  })();

  return {
    historicalData,
    realtimeData,
    combinedData,
    isLoading,
    isConnected,
    error,
    latestData,
    refreshHistory: fetchHistoricalData,
  };
}
