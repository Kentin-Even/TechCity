"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface TypeCapteur {
  idTypeCapteur: number;
  nom: string;
  unite: string;
  seuilMin: number | null;
  seuilMax: number | null;
}

interface Quartier {
  idQuartier: number;
  nom: string;
}

interface Capteur {
  idCapteur: number;
  nom: string;
  description: string | null;
  longitude: number | null;
  latitude: number | null;
  adresseInstallation: string | null;
  dateInstallation: Date | null;
  statut: "ACTIF" | "INACTIF" | "MAINTENANCE" | "HORS_SERVICE";
  modele: string | null;
  fabricant: string | null;
  numeroSerie: string | null;
  versionFirmware: string | null;
  derniereMaintenance: Date | null;
  frequenceCapture: number;
  quartier: Quartier;
  typeCapteur: TypeCapteur;
  donneesCapteur: Array<{
    valeur: number | string;
    timestamp: Date;
    unite: string;
  }>;
  _count: {
    donneesCapteur: number;
    alertes: number;
  };
}

interface FormData {
  nom: string;
  description: string;
  longitude: string;
  latitude: string;
  adresseInstallation: string;
  modele: string;
  fabricant: string;
  numeroSerie: string;
  versionFirmware: string;
  frequenceCapture: string;
  idTypeCapteur: string;
  idQuartier: string;
}

const INITIAL_FORM_DATA: FormData = {
  nom: "",
  description: "",
  longitude: "",
  latitude: "",
  adresseInstallation: "",
  modele: "",
  fabricant: "",
  numeroSerie: "",
  versionFirmware: "",
  frequenceCapture: "60",
  idTypeCapteur: "",
  idQuartier: "",
};

export default function CapteursPage() {
  const { user, loading } = useAuth();
  const [capteurs, setCapteurs] = useState<Capteur[]>([]);
  const [typesCapteurs, setTypesCapteurs] = useState<TypeCapteur[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [loadingCapteurs, setLoadingCapteurs] = useState(true);
  const [searchTerm] = useState("");
  const [filtreQuartier] = useState("");
  const [filtreType] = useState("");
  const [filtreStatut] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCapteur, setEditingCapteur] = useState<Capteur | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);

  // Vérification des permissions
  const isAdmin = user?.role && (user.role as { nom: string }).nom === "Admin";
  const isGestionnaire =
    user?.role && (user.role as { nom: string }).nom === "Gestionnaire";
  const isAdminOrGestionnaire = isAdmin || isGestionnaire;

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/sign-in";
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    try {
      const [capteursRes, typesRes, quartiersRes] = await Promise.all([
        fetch(`/api/sensors?limit=50`, {
          credentials: "include",
        }),
        fetch("/api/sensors/types", {
          credentials: "include",
        }),
        fetch("/api/quartiers", {
          credentials: "include",
        }),
      ]);

      if (capteursRes.ok) {
        const capteursData = await capteursRes.json();
        setCapteurs(capteursData.data || []);
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setTypesCapteurs(typesData.data || []);
      }

      if (quartiersRes.ok) {
        const quartiersData = await quartiersRes.json();
        setQuartiers(quartiersData.data || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoadingCapteurs(false);
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case "ACTIF":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "INACTIF":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case "MAINTENANCE":
        return <Settings className="h-4 w-4 text-orange-500" />;
      case "HORS_SERVICE":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatutBadge = (statut: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      ACTIF: "default",
      INACTIF: "secondary",
      MAINTENANCE: "outline",
      HORS_SERVICE: "destructive",
    };
    return variants[statut] || "secondary";
  };

  const filteredCapteurs = capteurs.filter((capteur) => {
    const matchesSearch =
      capteur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capteur.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capteur.numeroSerie?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesQuartier =
      !filtreQuartier ||
      capteur.quartier.idQuartier.toString() === filtreQuartier;
    const matchesType =
      !filtreType ||
      capteur.typeCapteur.idTypeCapteur.toString() === filtreType;
    const matchesStatut = !filtreStatut || capteur.statut === filtreStatut;

    return matchesSearch && matchesQuartier && matchesType && matchesStatut;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingCapteur ? `/api/sensors` : `/api/sensors`;
      const method = editingCapteur ? "PUT" : "POST";

      const payload = editingCapteur
        ? { idCapteur: editingCapteur.idCapteur, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          result.message ||
            `Capteur ${editingCapteur ? "mis à jour" : "créé"} avec succès`
        );
        setDialogOpen(false);
        setEditingCapteur(null);
        setFormData(INITIAL_FORM_DATA);
        fetchData();
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (capteur: Capteur) => {
    try {
      const response = await fetch(`/api/sensors?id=${capteur.idCapteur}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Capteur supprimé avec succès");
        fetchData();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const openEditDialog = (capteur: Capteur) => {
    setEditingCapteur(capteur);
    setFormData({
      nom: capteur.nom,
      description: capteur.description || "",
      longitude: capteur.longitude?.toString() || "",
      latitude: capteur.latitude?.toString() || "",
      adresseInstallation: capteur.adresseInstallation || "",
      modele: capteur.modele || "",
      fabricant: capteur.fabricant || "",
      numeroSerie: capteur.numeroSerie || "",
      versionFirmware: capteur.versionFirmware || "",
      frequenceCapture: capteur.frequenceCapture.toString(),
      idTypeCapteur: capteur.typeCapteur.idTypeCapteur.toString(),
      idQuartier: capteur.quartier.idQuartier.toString(),
    });
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingCapteur(null);
    setFormData(INITIAL_FORM_DATA);
    setDialogOpen(true);
  };

  if (loading || loadingCapteurs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des Capteurs
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez tous les capteurs IoT de votre ville
          </p>
        </div>
        {isAdminOrGestionnaire && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="mt-4 md:mt-0">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un capteur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCapteur
                    ? "Modifier le capteur"
                    : "Ajouter un nouveau capteur"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom du capteur *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) =>
                        setFormData({ ...formData, nom: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroSerie">Numéro de série</Label>
                    <Input
                      id="numeroSerie"
                      value={formData.numeroSerie}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          numeroSerie: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="idQuartier">Quartier *</Label>
                    <Select
                      value={formData.idQuartier}
                      onValueChange={(value) =>
                        setFormData({ ...formData, idQuartier: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un quartier" />
                      </SelectTrigger>
                      <SelectContent>
                        {quartiers.map((quartier) => (
                          <SelectItem
                            key={quartier.idQuartier}
                            value={quartier.idQuartier.toString()}
                          >
                            {quartier.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idTypeCapteur">Type de capteur *</Label>
                    <Select
                      value={formData.idTypeCapteur}
                      onValueChange={(value) =>
                        setFormData({ ...formData, idTypeCapteur: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typesCapteurs.map((type) => (
                          <SelectItem
                            key={type.idTypeCapteur}
                            value={type.idTypeCapteur.toString()}
                          >
                            {type.nom} ({type.unite})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresseInstallation">
                    Adresse d&apos;installation
                  </Label>
                  <Input
                    id="adresseInstallation"
                    value={formData.adresseInstallation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adresseInstallation: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({ ...formData, longitude: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({ ...formData, latitude: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modele">Modèle</Label>
                    <Input
                      id="modele"
                      value={formData.modele}
                      onChange={(e) =>
                        setFormData({ ...formData, modele: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fabricant">Fabricant</Label>
                    <Input
                      id="fabricant"
                      value={formData.fabricant}
                      onChange={(e) =>
                        setFormData({ ...formData, fabricant: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="versionFirmware">Version firmware</Label>
                    <Input
                      id="versionFirmware"
                      value={formData.versionFirmware}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          versionFirmware: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequenceCapture">
                      Fréquence de capture (secondes)
                    </Label>
                    <Input
                      id="frequenceCapture"
                      type="number"
                      min="1"
                      value={formData.frequenceCapture}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          frequenceCapture: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting
                      ? "Sauvegarde..."
                      : editingCapteur
                      ? "Mettre à jour"
                      : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Liste des capteurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCapteurs.map((capteur) => (
          <Card
            key={capteur.idCapteur}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg mb-1">{capteur.nom}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {capteur.typeCapteur.nom}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatutIcon(capteur.statut)}
                  <Badge variant={getStatutBadge(capteur.statut)}>
                    {capteur.statut.toLowerCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                {capteur.quartier.nom}
              </div>

              {capteur.adresseInstallation && (
                <p className="text-sm text-muted-foreground">
                  📍 {capteur.adresseInstallation}
                </p>
              )}

              {capteur.donneesCapteur.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm font-medium">
                      {Number(capteur.donneesCapteur[0].valeur).toFixed(2)}{" "}
                      {capteur.donneesCapteur[0].unite}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(
                      capteur.donneesCapteur[0].timestamp
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{capteur._count.donneesCapteur} mesures</span>
                <span>{capteur._count.alertes} alertes</span>
              </div>

              {capteur.numeroSerie && (
                <p className="text-xs text-muted-foreground">
                  S/N: {capteur.numeroSerie}
                </p>
              )}

              {isAdminOrGestionnaire && (
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(capteur)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="px-3">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Confirmer la suppression
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer le capteur &quot;
                          {capteur.nom}&quot; ? Cette action est irréversible et
                          supprimera toutes les données associées.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(capteur)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCapteurs.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Aucun capteur trouvé avec les critères de recherche actuels.
            </p>
            {isAdminOrGestionnaire && (
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter le premier capteur
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
