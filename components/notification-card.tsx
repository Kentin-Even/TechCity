"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  X,
  Maximize2,
  Clock,
  MapPin,
  Thermometer,
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

interface NotificationCardProps {
  notification: NotificationData;
  onDismiss: (id: number) => void;
  onExpand: (notification: NotificationData) => void;
  className?: string;
}

export default function NotificationCard({
  notification,
  onDismiss,
  onExpand,
  className = "",
}: NotificationCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onDismiss(notification.idNotification);
    }, 300);
  };

  const handleExpand = () => {
    onExpand(notification);
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
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "ELEVE":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "MOYEN":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Thermometer className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}j`;
  };

  const isRead = notification.statut === "LU";

  return (
    <Card
      className={`
        ${className}
        border-l-4 shadow-lg max-w-sm w-full
        transition-all duration-300 ease-in-out
        ${
          isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }
        ${isRemoving ? "translate-x-full opacity-0 scale-95" : ""}
        ${getGravityColor(notification.alerte.niveauGravite)}
        ${isRead ? "opacity-75 scale-95" : ""}
        hover:shadow-xl cursor-pointer
      `}
      onClick={handleExpand}
    >
      <CardContent className="p-3">
        {/* En-tête avec icône et actions */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {getGravityIcon(notification.alerte.niveauGravite)}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate text-gray-900">
                {notification.titre}
              </h4>
              <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(notification.dateEnvoi)}</span>
                {!isRead && (
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-1"></div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-white/50"
              onClick={(e) => {
                e.stopPropagation();
                handleExpand();
              }}
              title="Afficher en détail"
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-white/50 text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              title="Fermer"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Message tronqué */}
        <p className="text-xs text-gray-700 mb-3 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        {/* Informations du capteur */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-600 min-w-0 flex-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {notification.alerte.capteur.quartier.nom}
            </span>
          </div>

          <Badge
            variant="outline"
            className="text-xs border-current whitespace-nowrap ml-2"
          >
            {Number(notification.alerte.valeurMesuree).toFixed(1)}
            {notification.alerte.capteur.typeCapteur.unite}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
