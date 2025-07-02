"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Bell,
  AlertTriangle,
  Clock,
  MapPin,
  Activity,
  X,
  RefreshCw,
} from "lucide-react";

interface Notification {
  idNotification: number;
  titre: string;
  message: string;
  dateEnvoi: string;
  type: string;
  statut: string;
  alerte: {
    niveauGravite: string;
    valeurMesuree: number;
    seuilDeclenche: number;
    capteur: {
      nom: string;
      quartier: {
        nom: string;
      };
      typeCapteur: {
        nom: string;
        unite: string;
      };
    };
  };
}

interface NotificationsPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  maxHeight?: string;
}

export default function NotificationsPanel({
  isOpen = true,
  onClose,
  maxHeight = "400px",
}: NotificationsPanelProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nonLues, setNonLues] = useState(0);

  useEffect(() => {
    if (user && isOpen) {
      chargerNotifications();
    }
  }, [user, isOpen]);

  const chargerNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/alerts/notifications?limit=20");
      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data || []);
        setNonLues(result.meta?.nonLues || 0);
      }
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const marquerCommeLue = async (idNotification: number) => {
    try {
      const response = await fetch("/api/alerts/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idNotification,
          action: "marquer_lu",
        }),
      });

      if (response.ok) {
        await chargerNotifications();
      }
    } catch (error) {
      console.error("Erreur marquage notification:", error);
    }
  };

  const marquerToutesLues = async () => {
    try {
      const response = await fetch("/api/alerts/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idNotification: 0, // Non utilisé pour cette action
          action: "marquer_toutes_lues",
        }),
      });

      if (response.ok) {
        await chargerNotifications();
      }
    } catch (error) {
      console.error("Erreur marquage toutes notifications:", error);
    }
  };

  const obtenirIconeGravite = (gravite: string) => {
    switch (gravite) {
      case "CRITIQUE":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "ELEVE":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "MOYEN":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const obtenirCouleurGravite = (gravite: string) => {
    switch (gravite) {
      case "CRITIQUE":
        return "border-l-red-500 bg-red-50";
      case "ELEVE":
        return "border-l-orange-500 bg-orange-50";
      case "MOYEN":
        return "border-l-yellow-500 bg-yellow-50";
      default:
        return "border-l-blue-500 bg-blue-50";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jour(s)`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
            {nonLues > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">{nonLues}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={chargerNotifications}
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            {nonLues > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={marquerToutesLues}
                className="text-xs"
              >
                Tout marquer comme lu
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-y-auto" style={{ maxHeight }}>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune notification</p>
              <p className="text-sm">
                Vous recevrez ici vos alertes personnalisées
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.idNotification}
                  className={`border-l-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${obtenirCouleurGravite(
                    notification.alerte.niveauGravite
                  )} ${notification.statut === "LU" ? "opacity-60" : ""}`}
                  onClick={() => {
                    if (notification.statut !== "LU") {
                      marquerCommeLue(notification.idNotification);
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {obtenirIconeGravite(notification.alerte.niveauGravite)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {notification.titre}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(notification.dateEnvoi)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {notification.alerte.capteur.quartier.nom}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {notification.statut !== "LU" && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
