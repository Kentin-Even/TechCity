"use client";

import React, { useState } from "react";
import { useSensorStreamFixed } from "@/lib/hooks/use-sensor-stream-fixed";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Composant pour afficher une métrique individuelle
interface MetricCardProps {
  title: string;
  value: number | string;
  unit: string;
  lastUpdate: string;
  status: "normal" | "warning" | "critical";
  icon: React.ReactNode;
}

function MetricCard({
  title,
  value,
  unit,
  lastUpdate,
  status,
  icon,
}: MetricCardProps) {
  const statusColors = {
    normal: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    critical: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Card className={`${statusColors[status]}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === "number" ? value.toFixed(1) : value}
          <span className="text-sm font-normal ml-1">{unit}</span>
        </div>
        <p className="text-xs opacity-70">
          Mis à jour: {new Date(lastUpdate).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}

// Composant de statut de connexion
interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  totalMessages: number;
  connectedClients: number;
  lastHeartbeat: Date | null;
}

function ConnectionStatus({
  isConnected,
  isConnecting,
  connectionError,
  totalMessages,
  connectedClients,
  lastHeartbeat,
}: ConnectionStatusProps) {
  const statusColor = isConnected
    ? "bg-green-500"
    : isConnecting
    ? "bg-yellow-500"
    : "bg-red-500";

  const statusText = isConnected
    ? "Connecté"
    : isConnecting
    ? "Connexion..."
    : "Déconnecté";

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
          Stream de Données - {statusText}
        </CardTitle>
        <CardDescription>
          {connectionError ? (
            <span className="text-red-600">{connectionError}</span>
          ) : (
            "Données des capteurs IoT en temps réel (Version Corrigée)"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Messages reçus:</span>
            <div className="text-lg">{totalMessages}</div>
          </div>
          <div>
            <span className="font-medium">Clients connectés:</span>
            <div className="text-lg">{connectedClients}</div>
          </div>
          <div>
            <span className="font-medium">Dernier heartbeat:</span>
            <div className="text-lg">
              {lastHeartbeat ? lastHeartbeat.toLocaleTimeString() : "N/A"}
            </div>
          </div>
          <div>
            <span className="font-medium">État:</span>
            <div
              className={`text-lg font-medium ${
                isConnected
                  ? "text-green-600"
                  : isConnecting
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {statusText}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant principal du dashboard
export default function RealtimeDashboardFixed() {
  const [selectedSensorType, setSelectedSensorType] = useState<string>("all");

  const {
    isConnected,
    isConnecting,
    connectionError,
    latestData,
    allData,
    dataByType,
    totalMessages,
    connectedClients,
    lastHeartbeat,
    connect,
    disconnect,
    clearData,
    getLatestBySensor,
  } = useSensorStreamFixed({
    autoConnect: false, // Désactiver la connexion automatique
    onConnect: () => {
      console.log("🎉 Dashboard Fixed connecté au stream");
    },
    onDisconnect: () => {
      console.log("👋 Dashboard Fixed déconnecté du stream");
    },
    onData: (data) => {
      console.log(
        "📊 Dashboard Fixed: Nouvelles données reçues:",
        data.length,
        "points"
      );
    },
    onError: (error) => {
      console.error("❌ Dashboard Fixed: Erreur SSE:", error);
    },
  });

  // Fonction pour déterminer le statut d'une valeur
  const getValueStatus = (
    typeCapteur: string,
    valeur: number
  ): "normal" | "warning" | "critical" => {
    const thresholds: Record<string, { warning: number; critical: number }> = {
      "PM2.5": { warning: 25, critical: 50 },
      CO2: { warning: 800, critical: 1000 },
      Temperature: { warning: 30, critical: 35 },
      Humidity: { warning: 80, critical: 90 },
      Sound: { warning: 65, critical: 80 },
      Traffic: { warning: 30, critical: 45 },
    };

    const threshold = thresholds[typeCapteur];
    if (!threshold) return "normal";

    if (valeur >= threshold.critical) return "critical";
    if (valeur >= threshold.warning) return "warning";
    return "normal";
  };

  // Fonction pour obtenir l'icône d'un capteur
  const getSensorIcon = (typeCapteur: string) => {
    const icons: Record<string, string> = {
      "PM2.5": "🌬️",
      CO2: "💨",
      Temperature: "🌡️",
      Humidity: "💧",
      Sound: "🔊",
      Traffic: "🚗",
    };
    return icons[typeCapteur] || "📊";
  };

  // Obtenir les dernières données par capteur
  const latestBySensor = {
    1: getLatestBySensor(1), // PM2.5
    2: getLatestBySensor(2), // CO2
    3: getLatestBySensor(3), // Temperature
    4: getLatestBySensor(4), // Humidity
    5: getLatestBySensor(5), // Sound
    6: getLatestBySensor(6), // Traffic
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Dashboard IoT Temps Réel (Corrigé)
          </h1>
          <p className="text-gray-600">
            Monitoring des capteurs urbains - Tech City - Version sans cycles
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              console.log("🔘 Dashboard Fixed: Bouton cliqué, état actuel:", {
                isConnected,
                isConnecting,
              });
              if (isConnected) {
                console.log("🔌 Dashboard Fixed: Déconnexion...");
                disconnect();
              } else {
                console.log("🔗 Dashboard Fixed: Connexion...");
                connect();
              }
            }}
            disabled={isConnecting}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isConnecting
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : isConnected
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isConnecting
              ? "Connexion..."
              : isConnected
              ? "Déconnecter"
              : "Connecter"}
          </button>

          <button
            onClick={() => {
              console.log("🗑️ Dashboard Fixed: Nettoyage des données...");
              clearData();
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium"
          >
            Vider
          </button>
        </div>
      </div>

      {/* Statut de connexion */}
      <ConnectionStatus
        isConnected={isConnected}
        isConnecting={isConnecting}
        connectionError={connectionError}
        totalMessages={totalMessages}
        connectedClients={connectedClients}
        lastHeartbeat={lastHeartbeat}
      />

      {/* Filtre par type de capteur */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrer par Type de Capteur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSensorType("all")}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                selectedSensorType === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tous ({allData.length})
            </button>

            {Object.entries(dataByType).map(([type, data]) => (
              <button
                key={type}
                onClick={() => setSelectedSensorType(type)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedSensorType === type
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {getSensorIcon(type)} {type} ({data.length})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métriques en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(latestBySensor).map(([capteurId, data]) => {
          if (!data) return null;

          const status = getValueStatus(data.typeCapteur, data.valeur);

          return (
            <MetricCard
              key={capteurId}
              title={data.capteurNom}
              value={data.valeur}
              unit={data.unite}
              lastUpdate={data.timestamp}
              status={status}
              icon={<span>{getSensorIcon(data.typeCapteur)}</span>}
            />
          );
        })}
      </div>

      {/* Liste des dernières données */}
      <Card>
        <CardHeader>
          <CardTitle>
            Dernières Données
            {selectedSensorType !== "all" && ` - ${selectedSensorType}`}
          </CardTitle>
          <CardDescription>
            {selectedSensorType === "all"
              ? `${latestData.length} dernières mesures`
              : `${(dataByType[selectedSensorType] || []).length} mesures`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {(selectedSensorType === "all"
                ? latestData
                : dataByType[selectedSensorType] || []
              )
                .slice(0, 20)
                .map((item) => (
                  <div
                    key={`${item.capteurId}-${item.timestamp}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {getSensorIcon(item.typeCapteur)}
                      </span>
                      <div>
                        <div className="font-medium">{item.capteurNom}</div>
                        <div className="text-sm text-gray-600">
                          {item.quartier}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {item.valeur.toFixed(1)} {item.unite}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {latestData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {isConnected
                  ? "En attente de données..."
                  : "Connectez-vous pour voir les données en temps réel"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
