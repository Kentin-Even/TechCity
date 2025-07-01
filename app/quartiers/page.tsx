"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Activity, Building2 } from "lucide-react";

interface Quartier {
  idQuartier: number;
  nom: string;
  longitude: number;
  latitude: number;
  superficie: number | null;
  _count: {
    capteurs: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: Quartier[];
  error?: string;
}

export default function QuartiersPage() {
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuartiers = async () => {
      try {
        const response = await fetch("/api/quartiers");
        const data: ApiResponse = await response.json();

        if (data.success) {
          setQuartiers(data.data);
        } else {
          setError(data.error || "Erreur lors du chargement des quartiers");
        }
      } catch (err) {
        setError("Erreur de connexion au serveur");
        console.error("Erreur lors du fetch des quartiers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuartiers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-4" />
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
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Quartiers de Tech City</h1>
        <p className="text-gray-600">
          Explorez les différents quartiers et leurs capteurs IoT installés
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quartiers.map((quartier) => (
          <Link
            key={quartier.idQuartier}
            href={`/quartiers/${quartier.idQuartier}`}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {quartier.nom}
                </CardTitle>
                <CardDescription>
                  {quartier._count.capteurs} capteur
                  {quartier._count.capteurs > 1 ? "s" : ""} installé
                  {quartier._count.capteurs > 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {Number(quartier.latitude).toFixed(6)},{" "}
                      {Number(quartier.longitude).toFixed(6)}
                    </span>
                  </div>

                  {quartier.superficie && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Activity className="h-4 w-4" />
                      <span>
                        Superficie: {Number(quartier.superficie).toFixed(2)} km²
                      </span>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Capteurs actifs</span>
                      <span className="font-semibold text-blue-600">
                        {quartier._count.capteurs}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {quartiers.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun quartier trouvé
          </h3>
          <p className="text-gray-500">
            Il n&apos;y a actuellement aucun quartier configuré dans le système.
          </p>
        </div>
      )}
    </div>
  );
}
