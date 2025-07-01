"use client";

import React, { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSensorStreamFixed } from "@/lib/hooks/use-sensor-stream-fixed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Composant pour afficher une métrique individuelle
interface MetricCardProps {
  title: string;
  value: number | string;
  unit: string;
  lastUpdate: string;
  status: "normal" | "warning" | "critical";
  icon: React.ReactNode;
  onClick?: () => void;
}

function MetricCard({
  title,
  value,
  unit,
  lastUpdate,
  status,
  icon,
  onClick,
}: MetricCardProps) {
  const statusColors = {
    normal: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    critical: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Card
      className={`${
        statusColors[status]
      } shadow-sm hover:shadow-md transition-shadow ${
        onClick ? "cursor-pointer hover:scale-105 transition-transform" : ""
      }`}
      onClick={onClick}
    >
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
        {onClick && (
          <p className="text-xs text-blue-600 font-medium mt-2">
            Cliquez pour voir les détails →
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Composant des contrôles du dashboard
interface DashboardControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  totalMessages: number;
  connectedClients: number;
  lastHeartbeat: Date | null;
  onToggleConnection: () => void;
  onClearData: () => void;
}

function DashboardControls({
  isConnected,
  isConnecting,
  connectionError,
  totalMessages,
  connectedClients,
  lastHeartbeat,
  onToggleConnection,
  onClearData,
}: DashboardControlsProps) {
  const statusColor = isConnected
    ? "text-green-600"
    : isConnecting
    ? "text-yellow-600"
    : "text-red-600";

  const statusText = isConnected
    ? "🟢 Connecté"
    : isConnecting
    ? "🟡 Connexion..."
    : "🔴 Déconnecté";

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Contrôles du Dashboard</span>
          <span className={`text-sm ${statusColor}`}>{statusText}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status compact */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-mono font-bold text-lg">{totalMessages}</div>
            <div className="text-muted-foreground">Messages</div>
          </div>
          <div className="text-center">
            <div className="font-mono font-bold text-lg">
              {connectedClients}
            </div>
            <div className="text-muted-foreground">Clients</div>
          </div>
          <div className="text-center">
            <div className="font-mono font-bold text-xs">
              {lastHeartbeat ? lastHeartbeat.toLocaleTimeString() : "N/A"}
            </div>
            <div className="text-muted-foreground">Heartbeat</div>
          </div>
        </div>

        {connectionError && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            Erreur: {connectionError}
          </div>
        )}

        {/* Boutons de contrôle */}
        <div className="flex gap-2">
          <button
            onClick={onToggleConnection}
            disabled={isConnecting}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isConnecting
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : isConnected
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {isConnecting
              ? "⏳ Connexion..."
              : isConnected
              ? "🔌 Déconnecter"
              : "🔗 Connecter"}
          </button>

          <button
            onClick={onClearData}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200"
          >
            🗑️ Vider
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant principal du dashboard (sans sidebar)
export default function RealtimeDashboardFixed() {
  const router = useRouter();

  const {
    isConnected,
    isConnecting,
    connectionError,
    latestData,
    totalMessages,
    connectedClients,
    lastHeartbeat,
    connect,
    disconnect,
    clearData,
    dataById,
  } = useSensorStreamFixed({
    autoConnect: true, // ✅ Connexion automatique activée
    onConnect: () => {
      console.log("🎉 Dashboard connecté au stream SSE");
    },
    onDisconnect: () => {
      console.log("👋 Dashboard Fixed déconnecté du stream");
    },
    onData: (data) => {
      console.log(
        "📊 Dashboard Fixed: Nouvelles données reçues:",
        data.length,
        "points",
        data.map((d) => `Capteur ${d.capteurId}: ${d.valeur} ${d.unite}`)
      );
    },
    onError: (error) => {
      console.error("❌ Dashboard Fixed: Erreur SSE:", error);
    },
  });

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

  // Obtenir les dernières données par capteur - utiliser useMemo pour recalculer quand dataById change
  const latestBySensor = useMemo(() => {
    console.log(
      "🔄 Dashboard Fixed: Recalcul latestBySensor, dataById keys:",
      Object.keys(dataById)
    );
    return {
      1: dataById[1] || null, // PM2.5
      2: dataById[2] || null, // CO2
      3: dataById[3] || null, // Temperature
      4: dataById[4] || null, // Humidity
      5: dataById[5] || null, // Sound
      6: dataById[6] || null, // Traffic
    };
  }, [dataById]);

  // Debug: Surveiller les changements de données
  useEffect(() => {
    console.log("🔄 Dashboard Fixed: Changement de données détecté", {
      allDataLength: Object.keys(dataById).length,
      latestDataLength: latestData.length,
      dataById: Object.fromEntries(
        Object.entries(dataById).map(([id, data]) => [
          id,
          data
            ? `${data.valeur} ${data.unite} à ${new Date(
                data.timestamp
              ).toLocaleTimeString()}`
            : "null",
        ])
      ),
    });
  }, [dataById, latestData]);

  const handleToggleConnection = () => {
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
  };

  const handleClearData = () => {
    console.log("🗑️ Dashboard Fixed: Nettoyage des données...");
    clearData();
  };

  return (
    <div className="space-y-6">
      {/* En-tête du dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Dashboard IoT Temps Réel
          </h2>
          <p className="text-muted-foreground">
            Monitoring des capteurs urbains - Tech City
          </p>
        </div>
      </div>

      {/* Contrôles du dashboard */}
      <DashboardControls
        isConnected={isConnected}
        isConnecting={isConnecting}
        connectionError={connectionError}
        totalMessages={totalMessages}
        connectedClients={connectedClients}
        lastHeartbeat={lastHeartbeat}
        onToggleConnection={handleToggleConnection}
        onClearData={handleClearData}
      />

      {/* Métriques en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(latestBySensor).map(([capteurId, data]) => {
          console.log(
            `🔍 Dashboard Fixed: Rendu carte capteur ${capteurId}:`,
            data
              ? `${data.valeur} ${data.unite} à ${data.timestamp}`
              : "AUCUNE DONNÉE"
          );

          if (!data) {
            console.log(
              `⚠️ Dashboard Fixed: Pas de données pour capteur ${capteurId}`
            );
            return (
              <Card key={capteurId} className="bg-gray-100">
                <CardContent className="text-center py-8">
                  <div className="text-2xl mb-2">❓</div>
                  <p className="text-muted-foreground">Capteur #{capteurId}</p>
                  <p className="text-sm text-muted-foreground">
                    En attente de données...
                  </p>
                </CardContent>
              </Card>
            );
          }

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
              onClick={() => router.push(`/dashboard/${capteurId}`)}
            />
          );
        })}
      </div>

      {/* Message d'état si pas de données */}
      {latestData.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">{isConnected ? "⌛" : "🔌"}</div>
            <p className="text-muted-foreground text-lg">
              {isConnected
                ? "En attente de données des capteurs..."
                : "Connectez-vous pour voir les données en temps réel"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
