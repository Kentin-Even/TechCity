"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import NotificationCard from "./notification-card";
import NotificationDetailModal from "./notification-detail-modal";

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

interface NotificationStackProps {
  maxVisible?: number;
  autoHide?: boolean;
  autoHideDuration?: number;
}

export default function NotificationStack({
  maxVisible = 3,
  autoHide = false,
  autoHideDuration = 10000, // 10 secondes
}: NotificationStackProps) {
  const { notifications, dismissNotification, markAsRead } = useNotifications({
    autoRefresh: false, // ✅ DÉSACTIVÉ: Plus d'auto-refresh
    refreshInterval: 300000, // ✅ CORRECTION: 5 minutes au lieu de 15 secondes
    limit: 20,
  });

  const [visibleNotifications, setVisibleNotifications] = useState<
    NotificationData[]
  >([]);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Afficher les notifications non lues + récemment lues (dernière heure)
  const recentNotifications = notifications.filter((n) => {
    if (n.statut !== "LU") return true; // Toujours afficher les non lues

    // Afficher les lues si elles sont récentes (dernière heure)
    const notificationDate = new Date(n.dateEnvoi);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return notificationDate > oneHourAgo;
  });

  useEffect(() => {
    const newVisibleNotifications = recentNotifications.slice(0, maxVisible);
    setVisibleNotifications(newVisibleNotifications);
  }, [recentNotifications.length, maxVisible]);

  // Auto-hide des notifications si activé
  useEffect(() => {
    if (!autoHide) return;

    const timers = visibleNotifications.map((notification) => {
      return setTimeout(() => {
        handleDismiss(notification.idNotification);
      }, autoHideDuration);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [visibleNotifications, autoHide, autoHideDuration]);

  const handleDismiss = (id: number) => {
    dismissNotification(id);
  };

  const handleExpand = (notification: NotificationData) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    // Ne pas marquer automatiquement comme lue, laisser l'utilisateur décider
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
    // Mettre à jour la notification sélectionnée si c'est celle-ci
    if (selectedNotification?.idNotification === id) {
      setSelectedNotification((prev) =>
        prev ? { ...prev, statut: "LU" } : null
      );
    }
  };

  // Ne rien afficher si pas de notifications
  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* Stack de notifications en bas à droite */}
      <div className="fixed bottom-4 right-4 z-40 space-y-3 max-w-sm">
        {visibleNotifications.map((notification, index) => (
          <NotificationCard
            key={notification.idNotification}
            notification={notification}
            onDismiss={handleDismiss}
            onExpand={handleExpand}
            className={`
              transition-transform duration-300
              ${index === 1 ? "scale-95 translate-y-2 z-30" : ""}
              ${index === 2 ? "scale-90 translate-y-4 z-20" : ""}
              ${index === 0 ? "z-40" : ""}
            `}
          />
        ))}

        {/* Indicateur s'il y a plus de notifications */}
        {recentNotifications.length > maxVisible && (
          <div className="flex justify-center">
            <div className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full shadow-lg">
              +{recentNotifications.length - maxVisible} autres notifications
            </div>
          </div>
        )}
      </div>

      {/* Modal de détail */}
      <NotificationDetailModal
        isOpen={isModalOpen}
        notification={selectedNotification}
        onClose={handleCloseModal}
        onMarkAsRead={handleMarkAsRead}
      />
    </>
  );
}
