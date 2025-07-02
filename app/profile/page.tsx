"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { useAuth } from "@/lib/hooks/useAuth";
import { User, Mail, Phone, Calendar, Shield, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  name?: string;
  prenom?: string;
  email: string;
  telephone?: string;
  image?: string;
  createdAt?: string;
  role?: {
    nom: string;
  };
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    prenom: "",
    telephone: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/me");
        if (response.ok) {
          const userData = await response.json();
          setProfile(userData);
          setFormData({
            name: userData.name || "",
            prenom: userData.prenom || "",
            telephone: userData.telephone || "",
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
      } else {
        console.error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || "",
      prenom: profile?.prenom || "",
      telephone: profile?.telephone || "",
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.user);
      } else {
        const error = await response.json();
        console.error("Erreur lors de l'upload:", error);
        throw new Error(error.error || "Erreur lors de l'upload");
      }
    } catch (error) {
      console.error("Erreur lors de l'upload de l'avatar:", error);
      throw error;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    setUploadingAvatar(true);
    try {
      const response = await fetch("/api/user/avatar", {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.user);
      } else {
        const error = await response.json();
        console.error("Erreur lors de la suppression:", error);
        throw new Error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'avatar:", error);
      throw error;
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Impossible de charger le profil</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen  py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon Profil</h1>

        <Card className="mb-6">
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  {profile.image && (
                    <AvatarImage src={profile.image} alt={profile.name} />
                  )}
                  <AvatarFallback className="text-lg">
                    {profile.name
                      ?.split(" ")
                      .map((n) => n.charAt(0))
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">
                    {profile.name} {profile.prenom}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {profile.role?.nom || "Citoyen"}
                  </CardDescription>
                </div>
              </div>

              {/* Section d'upload d'avatar */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-3">Photo de profil</h3>
                <AvatarUpload
                  currentImage={profile.image || undefined}
                  onImageUpload={handleAvatarUpload}
                  onImageRemove={handleAvatarRemove}
                  loading={uploadingAvatar}
                  fallback={
                    profile.name
                      ?.split(" ")
                      .map((n) => n.charAt(0))
                      .join("")
                      .toUpperCase() || "U"
                  }
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Votre nom"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{profile.name || "Non renseigné"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="prenom">Prénom</Label>
                  {isEditing ? (
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) =>
                        setFormData({ ...formData, prenom: e.target.value })
                      }
                      placeholder="Votre prénom"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{profile.prenom || "Non renseigné"}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{profile.email}</span>
                  <span className="text-xs text-gray-400">
                    (Non modifiable)
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                {isEditing ? (
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) =>
                      setFormData({ ...formData, telephone: e.target.value })
                    }
                    placeholder="Votre numéro de téléphone"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{profile.telephone || "Non renseigné"}</span>
                  </div>
                )}
              </div>

              {profile.createdAt && (
                <div>
                  <Label>Membre depuis</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>
                      {new Date(profile.createdAt).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Modifier le profil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section Alertes Personnalisées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertes Personnalisées
            </CardTitle>
            <CardDescription>
              Configurez vos seuils d&apos;alertes pour recevoir des
              notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Définissez des seuils personnalisés pour chaque type de capteur et
              recevez des notifications lorsque ces seuils sont dépassés dans
              les quartiers auxquels vous êtes abonné.
            </p>
            <Button
              onClick={() => router.push("/alertes")}
              className="w-full sm:w-auto"
            >
              <Bell className="h-4 w-4 mr-2" />
              Gérer mes alertes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
