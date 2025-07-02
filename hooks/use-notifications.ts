import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

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

interface UseNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: number) => void;
}

export function useNotifications(
  options: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    limit?: number;
  } = {}
): UseNotificationsReturn {
  const { user } = useAuth();
  const {
    autoRefresh = false, // ✅ DÉSACTIVÉ: Plus d'auto-refresh, seulement au changement de page
    refreshInterval = 120000, // ✅ CORRECTION: 2 minutes au lieu de 30 secondes
    limit = 10,
  } = options;

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/alerts/notifications?limit=${limit}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        const newNotifications = result.data || [];
        setNotifications(newNotifications);
        setUnreadCount(result.meta?.nonLues || 0);
      } else {
        throw new Error(
          result.error || "Erreur lors du chargement des notifications"
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      console.error("Erreur lors du chargement des notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, limit]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      const response = await fetch("/api/alerts/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idNotification: id,
          action: "marquer_lu",
        }),
      });

      if (response.ok) {
        // Mettre à jour localement
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.idNotification === id ? { ...notif, statut: "LU" } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        throw new Error("Erreur lors du marquage de la notification");
      }
    } catch (err) {
      console.error("Erreur marquage notification:", err);
      toast.error("Erreur lors du marquage de la notification");
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/alerts/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idNotification: 0,
          action: "marquer_toutes_lues",
        }),
      });

      if (response.ok) {
        // Mettre à jour localement
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, statut: "LU" }))
        );
        setUnreadCount(0);
        toast.success("Toutes les notifications ont été marquées comme lues");
      } else {
        throw new Error("Erreur lors du marquage des notifications");
      }
    } catch (err) {
      console.error("Erreur marquage toutes notifications:", err);
      toast.error("Erreur lors du marquage des notifications");
    }
  }, []);

  const dismissNotification = useCallback(
    (id: number) => {
      setNotifications((prev) =>
        prev.filter((notif) => notif.idNotification !== id)
      );
      // Réduire le compteur de non lues si la notification était non lue
      setUnreadCount((prev) => {
        const dismissed = notifications.find((n) => n.idNotification === id);
        if (dismissed && dismissed.statut !== "LU") {
          return Math.max(0, prev - 1);
        }
        return prev;
      });
    },
    [notifications]
  );

  // Chargement initial
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(fetchNotifications, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  };
}
