"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DonneeBrute {
  idDonnee: string;
  valeur: number;
  timestamp: string;
  unite: string;
  validee: boolean;
  capteur: {
    idCapteur: number;
    nom: string;
    modele: string;
    numeroSerie: string;
    quartier: {
      nom: string;
    };
    typeCapteur: {
      nom: string;
    };
  };
}

interface TypeCapteur {
  idTypeCapteur: number;
  nom: string;
  unite: string;
}

export default function DonneesPage() {
  const router = useRouter();
  const [donnees, setDonnees] = useState<DonneeBrute[]>([]);
  const [loading, setLoading] = useState(true);
  const [typesCapteurs, setTypesCapteurs] = useState<TypeCapteur[]>([]);
  const [filters, setFilters] = useState({
    typeCapteur: "",
    quartier: "",
    dateDebut: "",
    dateFin: "",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Vérifier l'autorisation
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/user/me");
        if (!response.ok) {
          router.push("/sign-in");
          return;
        }

        const userData = await response.json();
        if (
          userData.role?.nom !== "Chercheur" &&
          userData.role?.nom !== "Admin"
        ) {
          toast.error("Accès refusé. Cette page est réservée aux chercheurs.");
          router.push("/");
        }
      } catch {
        router.push("/sign-in");
      }
    };

    checkAuth();
  }, [router]);

  // Charger les types de capteurs
  useEffect(() => {
    const fetchTypesCapteurs = async () => {
      try {
        const response = await fetch("/api/sensors/types");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setTypesCapteurs(data.data);
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des types de capteurs:",
          error
        );
      }
    };

    fetchTypesCapteurs();
  }, []);

  const fetchDonnees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...(filters.typeCapteur && { typeCapteur: filters.typeCapteur }),
        ...(filters.quartier && { quartier: filters.quartier }),
        ...(filters.dateDebut && { dateDebut: filters.dateDebut }),
        ...(filters.dateFin && { dateFin: filters.dateFin }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/donnees/brutes?${params}`);
      if (!response.ok)
        throw new Error("Erreur lors du chargement des données");

      const data = await response.json();
      setDonnees(data.donnees);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchDonnees();
  }, [fetchDonnees]);

  const handleExport = async (format: "csv" | "json") => {
    try {
      const params = new URLSearchParams({
        format,
        ...(filters.typeCapteur && { typeCapteur: filters.typeCapteur }),
        ...(filters.quartier && { quartier: filters.quartier }),
        ...(filters.dateDebut && { dateDebut: filters.dateDebut }),
        ...(filters.dateFin && { dateFin: filters.dateFin }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/donnees/export?${params}`);
      if (!response.ok) throw new Error("Erreur lors de l'export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `donnees_capteurs_${format}_${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Export ${format.toUpperCase()} réussi`);
    } catch (error) {
      toast.error("Erreur lors de l'export des données");
      console.error(error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      typeCapteur: "",
      quartier: "",
      dateDebut: "",
      dateFin: "",
      search: "",
    });
    setPage(1);
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Données Brutes des Capteurs
          </CardTitle>
          <CardDescription>
            Accès complet aux données brutes de tous les capteurs de la ville
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              <Select
                value={filters.typeCapteur || "all"}
                onValueChange={(value) =>
                  handleFilterChange(
                    "typeCapteur",
                    value === "all" ? "" : value
                  )
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Type de capteur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {typesCapteurs.map((type) => (
                    <SelectItem
                      key={type.idTypeCapteur}
                      value={type.idTypeCapteur.toString()}
                    >
                      {type.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="text"
                placeholder="Rechercher par quartier..."
                value={filters.quartier}
                onChange={(e) => handleFilterChange("quartier", e.target.value)}
                className="w-[200px]"
              />

              <Input
                type="datetime-local"
                value={filters.dateDebut}
                onChange={(e) =>
                  handleFilterChange("dateDebut", e.target.value)
                }
                className="w-[200px]"
              />

              <Input
                type="datetime-local"
                value={filters.dateFin}
                onChange={(e) => handleFilterChange("dateFin", e.target.value)}
                className="w-[200px]"
              />

              <Input
                type="text"
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-[200px]"
              />

              <Button onClick={resetFilters} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>

            {/* Boutons d'export */}
            <div className="flex gap-2">
              <Button onClick={() => handleExport("csv")} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => handleExport("json")} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="mb-4 text-sm text-muted-foreground">
            Total : {totalCount} enregistrements | Page {page} sur {totalPages}
          </div>

          {/* Tableau des données */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Capteur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quartier</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead>Validée</TableHead>
                  <TableHead>N° Série</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Chargement des données...
                    </TableCell>
                  </TableRow>
                ) : donnees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Aucune donnée trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  donnees.map((donnee) => (
                    <TableRow key={donnee.idDonnee}>
                      <TableCell className="font-mono text-xs">
                        {donnee.idDonnee}
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(donnee.timestamp),
                          "dd/MM/yyyy HH:mm:ss",
                          { locale: fr }
                        )}
                      </TableCell>
                      <TableCell>{donnee.capteur.nom}</TableCell>
                      <TableCell>{donnee.capteur.typeCapteur.nom}</TableCell>
                      <TableCell>{donnee.capteur.quartier.nom}</TableCell>
                      <TableCell className="font-mono">
                        {donnee.valeur}
                      </TableCell>
                      <TableCell>{donnee.unite}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            donnee.validee
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {donnee.validee ? "Oui" : "Non"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {donnee.capteur.numeroSerie}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
              >
                Précédent
              </Button>
              <span className="flex items-center px-4">
                Page {page} sur {totalPages}
              </span>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
              >
                Suivant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
