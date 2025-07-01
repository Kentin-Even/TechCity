"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

type StatutSuggestion =
  | "NOUVELLE"
  | "EN_COURS"
  | "APPROUVEE"
  | "REJETEE"
  | "IMPLEMENTEE";
type PrioriteSuggestion = "FAIBLE" | "MOYENNE" | "ELEVEE" | "URGENTE";
type CategorieSuggestion =
  | "INFRASTRUCTURE"
  | "ENVIRONNEMENT"
  | "SECURITE"
  | "AMELIORATION"
  | "BUG";

interface Suggestion {
  idSuggestion: number;
  titre: string;
  priorite: PrioriteSuggestion;
  statut: StatutSuggestion;
  categorie: CategorieSuggestion;
  dateCreation: string;
  dateTraitement?: string;
  reponse?: string;
  votes?: number;
  utilisateur: {
    id: string;
    name: string;
    email: string;
  };
  quartier?: {
    idQuartier: number;
    nom: string;
  };
}

const prioriteColors = {
  FAIBLE: "bg-green-100 text-green-800",
  MOYENNE: "bg-yellow-100 text-yellow-800",
  ELEVEE: "bg-orange-100 text-orange-800",
  URGENTE: "bg-red-100 text-red-800",
};

const statutColors = {
  NOUVELLE: "bg-blue-100 text-blue-800",
  EN_COURS: "bg-purple-100 text-purple-800",
  APPROUVEE: "bg-green-100 text-green-800",
  REJETEE: "bg-red-100 text-red-800",
  IMPLEMENTEE: "bg-emerald-100 text-emerald-800",
};

const categorieLabels = {
  INFRASTRUCTURE: "Infrastructure",
  ENVIRONNEMENT: "Environnement",
  SECURITE: "Sécurité",
  AMELIORATION: "Amélioration",
  BUG: "Bug",
};

export function SuggestionsList() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likingIds, setLikingIds] = useState<Set<number>>(new Set());
  const [likedSuggestions, setLikedSuggestions] = useState<Set<number>>(
    new Set()
  );
  const [filter, setFilter] = useState<{
    statut?: StatutSuggestion;
    categorie?: CategorieSuggestion;
  }>({});

  useEffect(() => {
    fetchSuggestions();
  }, [filter]);

  useEffect(() => {
    // Charger les suggestions likées depuis le localStorage
    const savedLikes = localStorage.getItem("likedSuggestions");
    if (savedLikes) {
      try {
        const likesArray = JSON.parse(savedLikes);
        setLikedSuggestions(new Set(likesArray));
      } catch (error) {
        console.error("Erreur lors du chargement des likes:", error);
      }
    }
  }, []);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.statut) params.append("statut", filter.statut);
      if (filter.categorie) params.append("categorie", filter.categorie);

      const response = await fetch(`/api/suggestions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      } else {
        console.error("Erreur lors du chargement des suggestions");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (suggestionId: number) => {
    // Vérifier si déjà en cours de traitement ou déjà liké
    if (likingIds.has(suggestionId) || likedSuggestions.has(suggestionId))
      return;

    setLikingIds((prev) => new Set(prev).add(suggestionId));

    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Mettre à jour les suggestions
          setSuggestions((prev) =>
            prev.map((suggestion) =>
              suggestion.idSuggestion === suggestionId
                ? { ...suggestion, votes: data.votes }
                : suggestion
            )
          );

          // Marquer comme liké et sauvegarder dans localStorage
          const newLikedSuggestions = new Set(likedSuggestions).add(
            suggestionId
          );
          setLikedSuggestions(newLikedSuggestions);
          localStorage.setItem(
            "likedSuggestions",
            JSON.stringify(Array.from(newLikedSuggestions))
          );
        }
      } else {
        console.error("Erreur lors du like");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLikingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrer les suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <select
                value={filter.statut || ""}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    statut: e.target.value as StatutSuggestion | undefined,
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Tous les statuts</option>
                <option value="NOUVELLE">Nouvelle</option>
                <option value="EN_COURS">En cours</option>
                <option value="APPROUVEE">Approuvée</option>
                <option value="REJETEE">Rejetée</option>
                <option value="IMPLEMENTEE">Implémentée</option>
              </select>
            </div>
            <div>
              <select
                value={filter.categorie || ""}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    categorie: e.target.value as
                      | CategorieSuggestion
                      | undefined,
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Toutes les catégories</option>
                <option value="INFRASTRUCTURE">Infrastructure</option>
                <option value="ENVIRONNEMENT">Environnement</option>
                <option value="SECURITE">Sécurité</option>
                <option value="AMELIORATION">Amélioration</option>
                <option value="BUG">Bug</option>
              </select>
            </div>
            <Button onClick={() => setFilter({})} variant="outline">
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des suggestions */}
      <div className="space-y-4">
        {suggestions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Aucune suggestion trouvée.</p>
            </CardContent>
          </Card>
        ) : (
          suggestions.map((suggestion) => (
            <Card
              key={suggestion.idSuggestion}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {suggestion.titre}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Soumise le {formatDate(suggestion.dateCreation)} par{" "}
                      {suggestion.utilisateur.name ||
                        suggestion.utilisateur.email}
                      {suggestion.quartier && (
                        <span className="ml-2">
                          • Quartier: {suggestion.quartier.nom}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statutColors[suggestion.statut]
                      }`}
                    >
                      {suggestion.statut.replace("_", " ")}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prioriteColors[suggestion.priorite]
                      }`}
                    >
                      {suggestion.priorite}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Catégorie:</span>
                    <span className="text-sm text-gray-600">
                      {categorieLabels[suggestion.categorie]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Votes:</span>
                    <span className="text-sm text-gray-600">
                      {suggestion.votes || 0}
                    </span>
                    <Button
                      size="sm"
                      variant={
                        likedSuggestions.has(suggestion.idSuggestion)
                          ? "default"
                          : "outline"
                      }
                      onClick={() => handleLike(suggestion.idSuggestion)}
                      disabled={
                        likingIds.has(suggestion.idSuggestion) ||
                        likedSuggestions.has(suggestion.idSuggestion)
                      }
                      className="ml-2 h-8 px-2"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          likingIds.has(suggestion.idSuggestion)
                            ? "animate-pulse"
                            : likedSuggestions.has(suggestion.idSuggestion)
                            ? "fill-current"
                            : ""
                        }`}
                      />
                      <span className="ml-1">
                        {likingIds.has(suggestion.idSuggestion)
                          ? "..."
                          : likedSuggestions.has(suggestion.idSuggestion)
                          ? "Liké"
                          : "Like"}
                      </span>
                    </Button>
                  </div>

                  {suggestion.reponse && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <span className="text-sm font-medium block mb-1">
                        Réponse:
                      </span>
                      <p className="text-sm text-gray-700">
                        {suggestion.reponse}
                      </p>
                      {suggestion.dateTraitement && (
                        <p className="text-xs text-gray-500 mt-2">
                          Traitée le {formatDate(suggestion.dateTraitement)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
