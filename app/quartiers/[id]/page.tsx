"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Activity,
  Thermometer,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Settings,
} from "lucide-react";
import QuartierSubscription from "@/components/quartier-subscription";

interface TypeCapteur {
  idTypeCapteur: number;
  nom: string;
  unite: string;
  seuilMin: number | null;
  seuilMax: number | null;
}

interface DerniereDonnee {
  valeur: number;
  timestamp: string;
  unite: string;
  validee: boolean | null;
}

interface Capteur {
  idCapteur: number;
  nom: string;
  description: string | null;
  longitude: number | null;
  latitude: number | null;
  adresseInstallation: string | null;
  dateInstallation: string | null;
  statut: string;
  modele: string | null;
  fabricant: string | null;
  numeroSerie: string | null;
  versionFirmware: string | null;
  derniereMaintenance: string | null;
  frequenceCapture: number;
  typeCapteur: TypeCapteur;
  derniereDonnee: DerniereDonnee | null;
  nombreDonnees: number;
}

interface Quartier {
  idQuartier: number;
  nom: string;
  longitude: number;
  latitude: number;
  superficie: number | null;
}

interface ApiResponse {
  success: boolean;
  data: {
    quartier: Quartier;
    capteurs: Capteur[];
  };
  error?: string;
}

const getStatutIcon = (statut: string) => {
  switch (statut) {
    case "ACTIF":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "INACTIF":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "MAINTENANCE":
      return <Settings className="h-4 w-4 text-orange-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />;
  }
};

const getStatutColor = (statut: string) => {
  switch (statut) {
    case "ACTIF":
      return "text-green-600 bg-green-50 border-green-200";
    case "INACTIF":
      return "text-red-600 bg-red-50 border-red-200";
    case "MAINTENANCE":
      return "text-orange-600 bg-orange-50 border-orange-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

export default function QuartierDetailPage() {
  const params = useParams();
  const [data, setData] = useState<{
    quartier: Quartier;
    capteurs: Capteur[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/quartiers/${params.id}/capteurs`);
        const result: ApiResponse = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Erreur lors du chargement des données");
        }
      } catch (err) {
        setError("Erreur de connexion au serveur");
        console.error("Erreur lors du fetch des données:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/quartiers">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux quartiers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">
            Quartier non trouvé
          </h1>
          <Link href="/quartiers">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux quartiers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* En-tête */}
      <div className="mb-8">
        <Link href="/quartiers">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux quartiers
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{data.quartier.nom}</h1>
          <QuartierSubscription
            quartierId={data.quartier.idQuartier}
            quartierNom={data.quartier.nom}
          />
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>
              {data.quartier.latitude.toFixed(6)},{" "}
              {data.quartier.longitude.toFixed(6)}
            </span>
          </div>
          {data.quartier.superficie && (
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Superficie: {data.quartier.superficie.toFixed(2)} km²</span>
            </div>
          )}
        </div>
        <p className="text-gray-600">
          {data.capteurs.length} capteur{data.capteurs.length > 1 ? "s" : ""}{" "}
          installé{data.capteurs.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Liste des capteurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.capteurs.map((capteur) => (
          <Link
            key={capteur.idCapteur}
            href={`/dashboard/${capteur.idCapteur}`}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Thermometer className="h-5 w-5 text-blue-600" />
                      {capteur.nom}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {capteur.typeCapteur.nom}
                    </CardDescription>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatutColor(
                      capteur.statut
                    )}`}
                  >
                    {getStatutIcon(capteur.statut)}
                    {capteur.statut}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Dernière donnée */}
                  {capteur.derniereDonnee ? (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Dernière valeur
                        </span>
                        <span className="text-lg font-semibold text-blue-600">
                          {capteur.derniereDonnee.valeur.toFixed(2)}{" "}
                          {capteur.derniereDonnee.unite}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(
                          capteur.derniereDonnee.timestamp
                        ).toLocaleString("fr-FR")}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm text-gray-500">
                        Aucune donnée disponible
                      </span>
                    </div>
                  )}

                  {/* Informations du capteur */}
                  <div className="space-y-2 text-sm">
                    {capteur.adresseInstallation && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 truncate">
                          {capteur.adresseInstallation}
                        </span>
                      </div>
                    )}

                    {capteur.dateInstallation && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          Installé le{" "}
                          {new Date(
                            capteur.dateInstallation
                          ).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <span>{capteur.nombreDonnees} mesures</span>
                      <span>Freq: {capteur.frequenceCapture}s</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {data.capteurs.length === 0 && (
        <div className="text-center py-12">
          <Thermometer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun capteur trouvé
          </h3>
          <p className="text-gray-500">
            Il n&apos;y a actuellement aucun capteur installé dans ce quartier.
          </p>
        </div>
      )}
    </div>
  );
}
