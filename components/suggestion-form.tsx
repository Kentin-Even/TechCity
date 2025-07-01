"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

type PrioriteSuggestion = "FAIBLE" | "MOYENNE" | "ELEVEE" | "URGENTE";
type CategorieSuggestion =
  | "INFRASTRUCTURE"
  | "ENVIRONNEMENT"
  | "SECURITE"
  | "AMELIORATION"
  | "BUG";

interface SuggestionFormData {
  titre: string;
  categorie: CategorieSuggestion;
  priorite: PrioriteSuggestion;
  idQuartier?: number;
}

interface Quartier {
  idQuartier: number;
  nom: string;
  longitude: number;
  latitude: number;
  superficie?: number;
}

export function SuggestionForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [isLoadingQuartiers, setIsLoadingQuartiers] = useState(true);
  const [formData, setFormData] = useState<SuggestionFormData>({
    titre: "",
    categorie: "AMELIORATION",
    priorite: "MOYENNE",
  });

  useEffect(() => {
    const fetchQuartiers = async () => {
      try {
        const response = await fetch("/api/quartiers");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setQuartiers(data.data);
          } else {
            console.error(
              "Erreur lors du chargement des quartiers:",
              data.error
            );
          }
        } else {
          console.error("Erreur lors du chargement des quartiers");
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setIsLoadingQuartiers(false);
      }
    };

    fetchQuartiers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Réinitialiser le formulaire
        setFormData({
          titre: "",
          categorie: "AMELIORATION",
          priorite: "MOYENNE",
        });

        // Actualiser la page ou rediriger
        router.refresh();

        // Optionnel: afficher un message de succès
        alert("Votre suggestion a été soumise avec succès !");
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message || "Une erreur est survenue"}`);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      alert(
        "Une erreur est survenue lors de la soumission de votre suggestion."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "idQuartier" ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Nouvelle Suggestion</CardTitle>
        <CardDescription>
          Partagez vos idées pour améliorer le système de capteurs IoT de votre
          ville
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="titre">Titre de la suggestion *</Label>
            <Input
              id="titre"
              name="titre"
              type="text"
              required
              value={formData.titre}
              onChange={handleInputChange}
              placeholder="Décrivez brièvement votre suggestion..."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categorie">Catégorie *</Label>
            <select
              id="categorie"
              name="categorie"
              required
              value={formData.categorie}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="INFRASTRUCTURE">Infrastructure</option>
              <option value="ENVIRONNEMENT">Environnement</option>
              <option value="SECURITE">Sécurité</option>
              <option value="AMELIORATION">Amélioration</option>
              <option value="BUG">Signalement de bug</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priorite">Priorité *</Label>
            <select
              id="priorite"
              name="priorite"
              required
              value={formData.priorite}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FAIBLE">Faible</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="ELEVEE">Élevée</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idQuartier">Quartier (optionnel)</Label>
            <select
              id="idQuartier"
              name="idQuartier"
              value={formData.idQuartier || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoadingQuartiers}
            >
              <option value="">
                {isLoadingQuartiers
                  ? "Chargement..."
                  : "Sélectionnez un quartier"}
              </option>
              {quartiers.map((quartier) => (
                <option key={quartier.idQuartier} value={quartier.idQuartier}>
                  {quartier.nom}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500">
              Laissez vide si la suggestion concerne l&apos;ensemble de la ville
            </p>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Envoi en cours..." : "Soumettre la suggestion"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
