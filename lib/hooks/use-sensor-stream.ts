"use client";

import { useEffect, useState, useRef, useCallback } from "react";

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

export function useSensorStream(
  options: UseSensorStreamOptions = {}
): UseSensorStreamReturn {
  const {
    autoConnect = true,
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

  // Données formatées
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
  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log("⚠️ Connexion SSE déjà active");
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      console.log("🔗 Tentative de connexion SSE...");

      const eventSource = new EventSource("/api/sensors/stream");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("✅ Connexion SSE établie");
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const parsedData: SSEEvent = JSON.parse(event.data);
          setTotalMessages((prev) => prev + 1);

          switch (parsedData.type) {
            case "connection":
              console.log(
                `🎉 ${parsedData.message} (Client: ${parsedData.clientId})`
              );
              break;

            case "sensor-data":
              if (Array.isArray(parsedData.data)) {
                const newData = parsedData.data as SensorData[];
                setLatestData(newData);
                setAllData((prev) => {
                  // Garder seulement les 1000 derniers points pour la performance
                  const combined = [...newData, ...prev];
                  return combined.slice(0, 1000);
                });
                onData?.(newData);
              }
              break;

            case "sensor-update":
              if (parsedData.data && !Array.isArray(parsedData.data)) {
                const singleData = parsedData.data as SensorData;
                setLatestData([singleData]);
                setAllData((prev) => {
                  const filtered = prev.filter(
                    (item) =>
                      item.capteurId !== singleData.capteurId ||
                      item.timestamp !== singleData.timestamp
                  );
                  return [singleData, ...filtered].slice(0, 1000);
                });
                onData?.([singleData]);
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
          console.error("❌ Erreur parsing données SSE:", error);
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
          console.error("❌ Erreur parsing heartbeat:", error);
        }
      });

      eventSource.onerror = (error) => {
        console.error("❌ Erreur connexion SSE:", error);
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionError("Erreur de connexion au stream de données");
        onError?.(error);

        // Logique de reconnexion
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `🔄 Tentative de reconnexion ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            if (eventSourceRef.current?.readyState !== EventSource.OPEN) {
              connect();
            }
          }, reconnectInterval);
        } else {
          console.error(
            "💥 Nombre maximum de tentatives de reconnexion atteint"
          );
          setConnectionError(
            "Impossible de se reconnecter au stream de données"
          );
        }
      };
    } catch (error) {
      console.error("❌ Erreur création EventSource:", error);
      setIsConnecting(false);
      setConnectionError("Erreur lors de la création de la connexion");
    }
  }, [
    maxReconnectAttempts,
    reconnectInterval,
    onConnect,
    onDisconnect,
    onError,
    onData,
  ]);

  // Fonction de déconnexion
  const disconnect = useCallback(() => {
    console.log("🔌 Déconnexion SSE...");

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
    onDisconnect?.();
  }, [onDisconnect]);

  // Fonction pour vider les données
  const clearData = useCallback(() => {
    setLatestData([]);
    setAllData([]);
    setTotalMessages(0);
  }, []);

  // Fonctions utilitaires
  const getDataByType = useCallback(
    (type: string) => {
      return dataByType[type] || [];
    },
    [dataByType]
  );

  const getDataBySensor = useCallback(
    (capteurId: number) => {
      return allData.filter((item) => item.capteurId === capteurId);
    },
    [allData]
  );

  const getLatestBySensor = useCallback(
    (capteurId: number) => {
      return dataById[capteurId] || null;
    },
    [dataById]
  );

  // Effet pour connexion automatique
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

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
