"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  AlertCircle,
  Save,
  Trash2,
  ThermometerSun,
  Droplets,
  Wind,
  Activity,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface TypeCapteur {
  idTypeCapteur: number;
  nom: string;
  unite: string;
  seuilMin?: number;
  seuilMax?: number;
  plageMin?: number;
  plageMax?: number;
}

interface SeuilPersonnalise {
  idSeuil: number;
  idTypeCapteur: number;
  seuilMin?: number;
  seuilMax?: number;
  actif: boolean;
  typeCapteur: TypeCapteur;
}

interface SeuilsPersonnalisesProps {
  className?: string;
}

const capteurIcons: Record<string, React.ReactNode> = {
  Température: <ThermometerSun className="w-5 h-5" />,
  Humidité: <Droplets className="w-5 h-5" />,
  "Qualité de l'air": <Wind className="w-5 h-5" />,
  default: <Activity className="w-5 h-5" />,
};

export default function SeuilsPersonnalises({
  className,
}: SeuilsPersonnalisesProps) {
  const { user } = useAuth();
  const [seuils, setSeuils] = useState<SeuilPersonnalise[]>([]);
  const [typesCapteurs, setTypesCapteurs] = useState<TypeCapteur[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<number | null>(null);
  const [formData, setFormData] = useState<
    Record<number, { seuilMin?: number; seuilMax?: number; actif: boolean }>
  >({});

  useEffect(() => {
    if (user) {
      chargerDonnees();
    }
  }, [user]);

  const chargerDonnees = async () => {
    setIsLoading(true);
    try {
      // Charger les types de capteurs
      const typesResponse = await fetch("/api/sensors/types");
      let typesData: { data?: TypeCapteur[] } | null = null;
      if (typesResponse.ok) {
        typesData = await typesResponse.json();
        setTypesCapteurs(typesData?.data || []);
      }

      // Charger les seuils personnalisés
      const seuilsResponse = await fetch("/api/alerts/seuils");
      if (seuilsResponse.ok) {
        const seuilsData = await seuilsResponse.json();
        setSeuils(seuilsData.data || []);

        // Initialiser formData avec les valeurs existantes
        const initialFormData: Record<
          number,
          { seuilMin?: number; seuilMax?: number; actif: boolean }
        > = {};
        seuilsData.data?.forEach((seuil: SeuilPersonnalise) => {
          initialFormData[seuil.idTypeCapteur] = {
            seuilMin: seuil.seuilMin ? Number(seuil.seuilMin) : undefined,
            seuilMax: seuil.seuilMax ? Number(seuil.seuilMax) : undefined,
            actif: seuil.actif,
          };
        });

        // Ajouter les types de capteurs sans seuils
        if (typesData && typesData.data) {
          typesData.data.forEach((type: TypeCapteur) => {
            if (!initialFormData[type.idTypeCapteur]) {
              initialFormData[type.idTypeCapteur] = {
                seuilMin: undefined,
                seuilMax: undefined,
                actif: false,
              };
            }
          });
        }

        setFormData(initialFormData);
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const sauvegarderSeuil = async (idTypeCapteur: number) => {
    const data = formData[idTypeCapteur];
    if (!data || (data.seuilMin === undefined && data.seuilMax === undefined)) {
      toast.error("Veuillez définir au moins un seuil");
      return;
    }

    setIsSaving(idTypeCapteur);
    try {
      const response = await fetch("/api/alerts/seuils", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idTypeCapteur,
          seuilMin: data.seuilMin ?? null,
          seuilMax: data.seuilMax ?? null,
          actif: data.actif,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        await chargerDonnees();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur sauvegarde seuil:", error);
      toast.error("Erreur lors de la sauvegarde du seuil");
    } finally {
      setIsSaving(null);
    }
  };

  const supprimerSeuil = async (idSeuil: number, idTypeCapteur: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce seuil ?")) {
      return;
    }

    setIsSaving(idTypeCapteur);
    try {
      const response = await fetch(`/api/alerts/seuils?idSeuil=${idSeuil}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Seuil supprimé avec succès");
        // Réinitialiser le formulaire pour ce type
        setFormData((prev) => ({
          ...prev,
          [idTypeCapteur]: {
            seuilMin: undefined,
            seuilMax: undefined,
            actif: false,
          },
        }));
        await chargerDonnees();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression seuil:", error);
      toast.error("Erreur lors de la suppression du seuil");
    } finally {
      setIsSaving(null);
    }
  };

  const handleInputChange = (
    idTypeCapteur: number,
    field: "seuilMin" | "seuilMax",
    value: string
  ) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      [idTypeCapteur]: {
        ...prev[idTypeCapteur],
        [field]: numValue,
      },
    }));
  };

  const handleSwitchChange = (idTypeCapteur: number, actif: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [idTypeCapteur]: {
        ...prev[idTypeCapteur],
        actif,
      },
    }));
  };

  const getSeuilExistant = (idTypeCapteur: number) => {
    return seuils.find((s) => s.idTypeCapteur === idTypeCapteur);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Chargement des seuils...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Seuils d&apos;Alertes Personnalisés
        </CardTitle>
        <CardDescription>
          Configurez vos seuils personnalisés pour recevoir des alertes lorsque
          les valeurs des capteurs dépassent vos limites.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {typesCapteurs.map((type) => {
            const seuilExistant = getSeuilExistant(type.idTypeCapteur);
            const data = formData[type.idTypeCapteur] || {
              seuilMin: undefined,
              seuilMax: undefined,
              actif: false,
            };
            const isModified =
              seuilExistant &&
              (data.seuilMin !== Number(seuilExistant.seuilMin) ||
                data.seuilMax !== Number(seuilExistant.seuilMax) ||
                data.actif !== seuilExistant.actif);

            return (
              <div
                key={type.idTypeCapteur}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {capteurIcons[type.nom] || capteurIcons.default}
                    <div>
                      <h3 className="font-medium">{type.nom}</h3>
                      <p className="text-sm text-gray-500">
                        Unité: {type.unite}
                        {type.plageMin !== undefined &&
                          type.plageMax !== undefined && (
                            <span className="ml-2">
                              (Plage: {Number(type.plageMin)} -{" "}
                              {Number(type.plageMax)})
                            </span>
                          )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={data.actif}
                      onCheckedChange={(checked) =>
                        handleSwitchChange(type.idTypeCapteur, checked)
                      }
                    />
                    <Label className="text-sm">
                      {data.actif ? "Actif" : "Inactif"}
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`min-${type.idTypeCapteur}`}>
                      Seuil Minimum
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id={`min-${type.idTypeCapteur}`}
                        type="number"
                        placeholder={`Min (${type.unite})`}
                        value={data.seuilMin ?? ""}
                        onChange={(e) =>
                          handleInputChange(
                            type.idTypeCapteur,
                            "seuilMin",
                            e.target.value
                          )
                        }
                        disabled={!data.actif}
                        step="0.1"
                      />
                      {type.seuilMin && (
                        <Badge variant="outline" className="text-xs">
                          Défaut: {Number(type.seuilMin)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`max-${type.idTypeCapteur}`}>
                      Seuil Maximum
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id={`max-${type.idTypeCapteur}`}
                        type="number"
                        placeholder={`Max (${type.unite})`}
                        value={data.seuilMax ?? ""}
                        onChange={(e) =>
                          handleInputChange(
                            type.idTypeCapteur,
                            "seuilMax",
                            e.target.value
                          )
                        }
                        disabled={!data.actif}
                        step="0.1"
                      />
                      {type.seuilMax && (
                        <Badge variant="outline" className="text-xs">
                          Défaut: {Number(type.seuilMax)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Info className="w-4 h-4" />
                    <span>
                      {seuilExistant
                        ? "Seuil personnalisé configuré"
                        : "Aucun seuil personnalisé"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {seuilExistant && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          supprimerSeuil(
                            seuilExistant.idSeuil,
                            type.idTypeCapteur
                          )
                        }
                        disabled={isSaving === type.idTypeCapteur}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => sauvegarderSeuil(type.idTypeCapteur)}
                      disabled={
                        !data.actif ||
                        (!data.seuilMin && !data.seuilMax) ||
                        isSaving === type.idTypeCapteur ||
                        (!seuilExistant && !data.actif) ||
                        (seuilExistant && !isModified)
                      }
                    >
                      {isSaving === type.idTypeCapteur ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      {seuilExistant ? "Modifier" : "Enregistrer"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Comment ça fonctionne ?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Activez un seuil et définissez vos limites personnalisées
                </li>
                <li>
                  Vous recevrez une notification lorsqu&apos;un capteur dépasse
                  ces limites
                </li>
                <li>
                  Les alertes ne sont envoyées que pour les quartiers auxquels
                  vous êtes abonné
                </li>
                <li>
                  Une même alerte n&apos;est pas répétée pendant 30 minutes pour
                  éviter le spam
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
