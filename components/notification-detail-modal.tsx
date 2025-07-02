"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  X,
  AlertTriangle,
  Clock,
  Thermometer,
  Settings,
  Eye,
} from "lucide-react";

interface NotificationData {
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
      idCapteur: number;
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

interface NotificationDetailModalProps {
  isOpen: boolean;
  notification: NotificationData | null;
  onClose: () => void;
  onMarkAsRead?: (id: number) => void;
}

export default function NotificationDetailModal({
  isOpen,
  notification,
  onClose,
  onMarkAsRead,
}: NotificationDetailModalProps) {
  const [isMarking, setIsMarking] = useState(false);

  if (!isOpen || !notification) return null;

  const handleMarkAsRead = async () => {
    if (!onMarkAsRead || notification.statut === "LU") return;

    setIsMarking(true);
    try {
      await onMarkAsRead(notification.idNotification);
    } finally {
      setIsMarking(false);
    }
  };

  const getGravityColor = (gravite: string) => {
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

  const getGravityIcon = (gravite: string) => {
    switch (gravite) {
      case "CRITIQUE":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "ELEVE":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "MOYEN":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Thermometer className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUnread = notification.statut !== "LU";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card
        className={`
        relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto
        border-l-4 shadow-2xl
        ${getGravityColor(notification.alerte.niveauGravite)}
        animate-in fade-in-0 zoom-in-95 duration-200
      `}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              {getGravityIcon(notification.alerte.niveauGravite)}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg leading-tight mb-2">
                  {notification.titre}
                  {isUnread && (
                    <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </CardTitle>
                <CardDescription className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatFullDate(notification.dateEnvoi)}</span>
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-3">
              {isUnread && onMarkAsRead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAsRead}
                  disabled={isMarking}
                  className="text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {isMarking ? "..." : "Marquer lu"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Message complet */}
          <div>
            <h3 className="font-medium text-sm text-gray-700 mb-2">Message</h3>
            <p className="text-sm text-gray-800 leading-relaxed bg-white p-3 rounded-md border">
              {notification.message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button
              onClick={() =>
                window.open(
                  `/dashboard/${notification.alerte.capteur.idCapteur}`,
                  "_blank"
                )
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Voir le capteur
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
