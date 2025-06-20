"use client";

import { useEffect, useState, useRef } from "react";

// Types pour les événements SSE
export interface SensorData {
  id: string;
  capteurId: number;
  capteurNom: string;
  typeCapteur: string;
  valeur: number;
  unite: string;
  timestamp: string;
  quartier: string;
  coordonnees: {
    latitude: number;
    longitude: number;
  };
}

export interface SSEEvent {
  type: "connection" | "sensor-data" | "sensor-update" | "heartbeat";
  data?: SensorData | SensorData[];
  message?: string;
  clientId?: string;
  timestamp: string;
  clients?: number;
}

export interface UseSensorStreamOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onData?: (data: SensorData[]) => void;
}

export interface UseSensorStreamReturn {
  // État de la connexion
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Données
  latestData: SensorData[];
  allData: SensorData[];
  dataByType: Record<string, SensorData[]>;
  dataById: Record<number, SensorData>;

  // Statistiques
  totalMessages: number;
  connectedClients: number;
  lastHeartbeat: Date | null;

  // Contrôles
  connect: () => void;
  disconnect: () => void;
  clearData: () => void;

  // Filtres
  getDataByType: (type: string) => SensorData[];
  getDataBySensor: (capteurId: number) => SensorData[];
  getLatestBySensor: (capteurId: number) => SensorData | null;
}

export function useSensorStreamFixed(
  options: UseSensorStreamOptions = {}
): UseSensorStreamReturn {
  const {
    autoConnect = false,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    onConnect,
    onDisconnect,
    onError,
    onData,
  } = options;

  // États
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [latestData, setLatestData] = useState<SensorData[]>([]);
  const [allData, setAllData] = useState<SensorData[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [connectedClients, setConnectedClients] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stocker les callbacks dans des refs pour éviter les re-renders
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);
  const onDataRef = useRef(onData);

  // Mettre à jour les refs quand les callbacks changent
  useEffect(() => {
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    onErrorRef.current = onError;
    onDataRef.current = onData;
  });

  // Données formatées (calculées à chaque render mais sans dépendances dans useCallback)
  const dataByType = allData.reduce((acc, item) => {
    if (!acc[item.typeCapteur]) {
      acc[item.typeCapteur] = [];
    }
    acc[item.typeCapteur].push(item);
    return acc;
  }, {} as Record<string, SensorData[]>);

  const dataById = allData.reduce((acc, item) => {
    acc[item.capteurId] = item;
    return acc;
  }, {} as Record<number, SensorData>);

  // Fonction de connexion
  const connect = () => {
    console.log("🔗 Hook Fixed: Tentative de connexion SSE...");

    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log("⚠️ Hook Fixed: Connexion SSE déjà active");
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const eventSource = new EventSource("/api/sensors/stream");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("✅ Hook Fixed: Connexion SSE établie");
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        onConnectRef.current?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const parsedData: SSEEvent = JSON.parse(event.data);
          setTotalMessages((prev) => prev + 1);

          console.log("📨 Hook Fixed: Message reçu:", parsedData.type);

          switch (parsedData.type) {
            case "connection":
              console.log(
                `🎉 Hook Fixed: ${parsedData.message} (Client: ${parsedData.clientId})`
              );
              break;

            case "sensor-data":
              if (Array.isArray(parsedData.data)) {
                const newData = parsedData.data as SensorData[];
                console.log(
                  "📊 Hook Fixed: Données capteurs reçues:",
                  newData.length
                );
                setLatestData(newData);
                setAllData((prev) => {
                  const combined = [...newData, ...prev];
                  return combined.slice(0, 1000);
                });
                onDataRef.current?.(newData);
              }
              break;

            case "sensor-update":
              if (parsedData.data && !Array.isArray(parsedData.data)) {
                const singleData = parsedData.data as SensorData;
                console.log(
                  "🔄 Hook Fixed: Update capteur:",
                  singleData.capteurId
                );
                setLatestData([singleData]);
                setAllData((prev) => {
                  const filtered = prev.filter(
                    (item) =>
                      item.capteurId !== singleData.capteurId ||
                      item.timestamp !== singleData.timestamp
                  );
                  return [singleData, ...filtered].slice(0, 1000);
                });
                onDataRef.current?.([singleData]);
              }
              break;

            case "heartbeat":
              setLastHeartbeat(new Date());
              if (parsedData.clients !== undefined) {
                setConnectedClients(parsedData.clients);
              }
              break;
          }
        } catch (error) {
          console.error("❌ Hook Fixed: Erreur parsing données SSE:", error);
        }
      };

      eventSource.addEventListener("heartbeat", (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastHeartbeat(new Date());
          if (data.clients !== undefined) {
            setConnectedClients(data.clients);
          }
        } catch (error) {
          console.error("❌ Hook Fixed: Erreur parsing heartbeat:", error);
        }
      });

      eventSource.onerror = (error) => {
        console.error("❌ Hook Fixed: Erreur connexion SSE:", error);
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionError("Erreur de connexion au stream de données");
        onErrorRef.current?.(error);

        // Logique de reconnexion
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `🔄 Hook Fixed: Tentative de reconnexion ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            if (eventSourceRef.current?.readyState !== EventSource.OPEN) {
              connect();
            }
          }, reconnectInterval);
        } else {
          console.error(
            "💥 Hook Fixed: Nombre maximum de tentatives de reconnexion atteint"
          );
          setConnectionError(
            "Impossible de se reconnecter au stream de données"
          );
        }
      };
    } catch (error) {
      console.error("❌ Hook Fixed: Erreur création EventSource:", error);
      setIsConnecting(false);
      setConnectionError("Erreur lors de la création de la connexion");
    }
  };

  // Fonction de déconnexion
  const disconnect = () => {
    console.log("🔌 Hook Fixed: Déconnexion SSE...");

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
    onDisconnectRef.current?.();
  };

  // Fonction pour vider les données
  const clearData = () => {
    setLatestData([]);
    setAllData([]);
    setTotalMessages(0);
  };

  // Fonctions utilitaires
  const getDataByType = (type: string) => {
    return dataByType[type] || [];
  };

  const getDataBySensor = (capteurId: number) => {
    return allData.filter((item) => item.capteurId === capteurId);
  };

  const getLatestBySensor = (capteurId: number) => {
    return dataById[capteurId] || null;
  };

  // Effet pour connexion automatique (une seule fois)
  useEffect(() => {
    if (autoConnect) {
      console.log("🚀 Hook Fixed: Connexion automatique...");
      connect();
    }

    // Nettoyage au démontage
    return () => {
      console.log("🧹 Hook Fixed: Nettoyage...");
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []); // Pas de dépendances pour éviter les cycles

  return {
    // État de la connexion
    isConnected,
    isConnecting,
    connectionError,

    // Données
    latestData,
    allData,
    dataByType,
    dataById,

    // Statistiques
    totalMessages,
    connectedClients,
    lastHeartbeat,

    // Contrôles
    connect,
    disconnect,
    clearData,

    // Filtres
    getDataByType,
    getDataBySensor,
    getLatestBySensor,
  };
}
