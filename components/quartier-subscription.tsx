"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { Bell, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface QuartierSubscriptionProps {
  quartierId: number;
  quartierNom: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showText?: boolean;
}

interface Subscription {
  actif: boolean;
  dateAbonnement: string;
  typeAlerte: string;
}

export default function QuartierSubscription({
  quartierId,
  quartierNom,
  variant = "default",
  size = "default",
  showText = true,
}: QuartierSubscriptionProps) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user, quartierId]);

  const checkSubscription = async () => {
    try {
      const response = await fetch(`/api/quartiers/${quartierId}/subscription`);
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else if (response.status === 404) {
        // Pas d'abonnement existant
        setSubscription(null);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'abonnement:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour vous abonner");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/quartiers/${quartierId}/subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "subscribe",
            typeAlerte: "TOUTES",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        toast.success(`Abonné au quartier ${quartierNom} avec succès !`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de l'abonnement");
      }
    } catch (error) {
      console.error("Erreur lors de l'abonnement:", error);
      toast.error("Erreur lors de l'abonnement");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/quartiers/${quartierId}/subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "unsubscribe",
          }),
        }
      );

      if (response.ok) {
        setSubscription(null);
        toast.success(`Désabonné du quartier ${quartierNom}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors du désabonnement");
      }
    } catch (error) {
      console.error("Erreur lors du désabonnement:", error);
      toast.error("Erreur lors du désabonnement");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSubscription = () => {
    if (subscription?.actif) {
      handleUnsubscribe();
    } else {
      handleSubscribe();
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        {showText && "Chargement..."}
      </Button>
    );
  }

  const isSubscribed = subscription?.actif;

  return (
    <Button
      variant={isSubscribed ? "outline" : variant}
      size={size}
      onClick={toggleSubscription}
      disabled={actionLoading}
      className={
        isSubscribed ? "border-green-500 text-green-700 hover:bg-green-50" : ""
      }
    >
      {actionLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isSubscribed ? (
        <Check className="w-4 h-4 mr-2" />
      ) : (
        <Bell className="w-4 h-4 mr-2" />
      )}
      {showText && <span>{isSubscribed ? "Abonné" : "S'abonner"}</span>}
    </Button>
  );
}
