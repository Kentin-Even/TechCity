"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSensorHistory } from "@/lib/hooks/use-sensor-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis } from "recharts";
import {
  ArrowLeft,
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  RefreshCw,
} from "lucide-react";

interface CapteurDetailsProps {
  capteurId: number;
}

// Configuration dynamique basée sur le type de capteur
const getConfigurationParType = (typeCapteur: string) => {
  const configurationsParType: Record<
    string,
    {
      description: string;
      icon: string;
      thresholds: { warning: number; critical: number };
      couleur: string;
    }
  > = {
    "PM2.5": {
      description: "Mesure la concentration de particules fines dans l'air",
      icon: "🌬️",
      thresholds: { warning: 25, critical: 50 },
      couleur: "from-blue-500 to-cyan-500",
    },
    CO2: {
      description: "Mesure la concentration de dioxyde de carbone",
      icon: "💨",
      thresholds: { warning: 800, critical: 1000 },
      couleur: "from-green-500 to-emerald-500",
    },
    Temperature: {
      description: "Mesure la température ambiante",
      icon: "🌡️",
      thresholds: { warning: 30, critical: 35 },
      couleur: "from-orange-500 to-red-500",
    },
    Humidity: {
      description: "Mesure le taux d'humidité relative",
      icon: "💧",
      thresholds: { warning: 80, critical: 90 },
      couleur: "from-blue-500 to-indigo-500",
    },
    Sound: {
      description: "Mesure le niveau de bruit ambiant",
      icon: "🔊",
      thresholds: { warning: 65, critical: 80 },
      couleur: "from-purple-500 to-pink-500",
    },
    Traffic: {
      description: "Comptage du trafic routier",
      icon: "🚗",
      thresholds: { warning: 30, critical: 45 },
      couleur: "from-yellow-500 to-orange-500",
    },
  };

  // Configuration par défaut pour les types non reconnus
  const configurationParDefaut = {
    description: "Capteur de surveillance environnementale",
    icon: "📊",
    thresholds: { warning: 50, critical: 100 },
    couleur: "from-gray-500 to-slate-500",
  };

  return configurationsParType[typeCapteur] || configurationParDefaut;
};

export default function CapteurDetailsPage({ capteurId }: CapteurDetailsProps) {
  const router = useRouter();

  const {
    combinedData,
    realtimeData,
    latestData: capteurData,
    isLoading,
    isConnected,
    error,
    refreshHistory,
  } = useSensorHistory({
    capteurId,
    hours: 24,
    autoConnect: true,
  });

  // ✅ AJOUT: Logs de débogage pour suivre les mises à jour
  useEffect(() => {
    console.log("🔍 CapteurDetails - Mise à jour des données:");
    console.log("   - capteurData:", capteurData);
    console.log("   - isConnected:", isConnected);
    console.log("   - realtimeData.length:", realtimeData.length);
    if (capteurData) {
      console.log(
        `   - Valeur actuelle: ${capteurData.valeur} ${capteurData.unite}`
      );
      console.log(
        `   - Timestamp: ${new Date(capteurData.timestamp).toLocaleString()}`
      );
    }
  }, [capteurData, isConnected, realtimeData.length]);

  // Obtenir l'historique récent (dernières 10 valeurs temps réel)
  const historique = realtimeData.slice(-10).reverse();

  // Préparer les données pour le graphique des 24h
  // Pour le graphique, on veut l'ordre chronologique (du plus ancien au plus récent)
  const donnees24h = combinedData
    .slice() // Créer une copie pour ne pas modifier l'original
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    .map((data) => ({
      timestamp: data.timestamp,
      valeur: Number(data.valeur),
      heure: new Date(data.timestamp).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: new Date(data.timestamp).toLocaleDateString("fr-FR"),
    }));

  // Si aucune donnée n'est disponible, afficher un message d'attente
  if (!capteurData && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Capteur #{capteurId}
          </h1>
          <p className="text-muted-foreground mb-4">
            En attente des données du capteur...
          </p>
          <div className="text-sm text-muted-foreground">
            {isConnected ? "🟢 Connecté" : "🔴 Déconnecté"}
          </div>
          {error && <p className="text-red-500 mt-2">Erreur: {error}</p>}
        </div>
      </div>
    );
  }

  // Si en cours de chargement et pas encore de données
  if (isLoading && !capteurData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Obtenir la configuration dynamique basée sur le type de capteur
  const configType = getConfigurationParType(capteurData?.typeCapteur || "");

  // Configuration complète du capteur
  const config = {
    nom: capteurData?.capteurNom || `Capteur #${capteurId}`,
    type: capteurData?.typeCapteur || "Inconnu",
    unite: capteurData?.unite || "",
    ...configType,
  };

  // Configuration du graphique
  const chartConfig = {
    valeur: {
      label: `${config.type} (${config.unite})`,
      color: "hsl(217, 91%, 60%)", // Bleu vif fixe
    },
  } satisfies ChartConfig;

  const getStatus = (
    valeur: number | undefined
  ): "normal" | "warning" | "critical" => {
    if (!valeur) return "normal";
    if (valeur >= config.thresholds.critical) return "critical";
    if (valeur >= config.thresholds.warning) return "warning";
    return "normal";
  };

  const status = getStatus(capteurData?.valeur);
  const statusColors = {
    normal: "text-green-600 bg-green-100",
    warning: "text-yellow-600 bg-yellow-100",
    critical: "text-red-600 bg-red-100",
  };

  const statusTexts = {
    normal: "Normal",
    warning: "Attention",
    critical: "Critique",
  };

  console.log("🔍 Debug capteurData:", capteurData);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête avec bouton retour */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="text-4xl mr-3">{config.icon}</span>
              {config.nom}
            </h1>
            <p className="text-muted-foreground mt-1">{config.description}</p>
            <p className="text-sm text-muted-foreground">
              Type: {config.type} • Quartier: {capteurData?.quartier || "N/A"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}
          >
            {status === "critical" && (
              <AlertTriangle className="mr-1 h-4 w-4" />
            )}
            {statusTexts[status]}
          </div>
          <div className="text-sm text-muted-foreground mt-1 flex items-center justify-end space-x-2">
            <span>{isConnected ? "🟢 Connecté" : "🔴 Déconnecté"}</span>
            {isLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
          </div>
        </div>
      </div>

      {/* Carte principale avec gradient */}
      <Card className={`mb-8 bg-gradient-to-r ${config.couleur} text-white`}>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>Valeur Actuelle</span>
            <Activity className="h-6 w-6" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-6xl font-bold mb-2">
            {capteurData?.valeur?.toFixed(1) || "---"}
            <span className="text-2xl ml-2">{config.unite}</span>
          </div>
          <p className="text-white/80">
            {capteurData?.timestamp ? (
              <>
                <Clock className="inline mr-1 h-4 w-4" />
                Dernière mise à jour:{" "}
                {new Date(capteurData.timestamp).toLocaleString()}
              </>
            ) : (
              "Aucune donnée disponible"
            )}
          </p>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Seuil d&apos;Alerte
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {config.thresholds.warning}
              <span className="text-sm font-normal ml-1">{config.unite}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Seuil Critique
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {config.thresholds.critical}
              <span className="text-sm font-normal ml-1">{config.unite}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Historique</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historique.length}
              <span className="text-sm font-normal ml-1">points</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Données 24h</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {donnees24h.length}
              <span className="text-sm font-normal ml-1">mesures</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique des dernières 24h */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Évolution des dernières 24 heures
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshHistory}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && donnees24h.length === 0 ? (
            <Skeleton className="h-[400px] w-full" />
          ) : donnees24h.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[400px]">
              <LineChart
                data={donnees24h}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  dataKey="heure"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value} ${config.unite}`}
                  domain={["dataMin - 5", "dataMax + 5"]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return `${data.date} à ${data.heure}`;
                        }
                        return value;
                      }}
                      formatter={(value, name) => [
                        `${Number(value).toFixed(1)} ${config.unite}`,
                        chartConfig.valeur?.label || name,
                      ]}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="valeur"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(217, 91%, 60%)", strokeWidth: 0, r: 3 }}
                  activeDot={{
                    r: 6,
                    stroke: "hsl(217, 91%, 60%)",
                    strokeWidth: 2,
                  }}
                  connectNulls={false}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune donnée disponible pour les dernières 24h</p>
              <p className="text-sm">
                Les données apparaîtront au fur et à mesure des mesures
              </p>
              {error && (
                <p className="text-red-500 mt-2 text-sm">Erreur: {error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique des données */}
      <Card>
        <CardHeader>
          <CardTitle>Historique Récent (Temps Réel)</CardTitle>
        </CardHeader>
        <CardContent>
          {historique.length > 0 ? (
            <div className="space-y-2">
              {historique.map((data, index) => {
                const dataStatus = getStatus(data.valeur);
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      dataStatus === "critical"
                        ? "border-red-500 bg-red-50"
                        : dataStatus === "warning"
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-green-500 bg-green-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold">
                          {data.valeur.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {config.unite}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(data.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(data.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune donnée d&apos;historique temps réel disponible</p>
              <p className="text-sm">
                Connectez-vous pour voir les données en temps réel
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
