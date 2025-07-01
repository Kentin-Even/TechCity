import { useEffect, useState } from "react";
import { authClient } from "../auth-client";
import { Role } from "../permissions";

export interface User {
  id: string;
  name?: string;
  email: string;
  image?: string;
  role?: {
    nom: Role;
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const session = await authClient.getSession();
        if (session.data?.user) {
          // Récupérer les informations complètes de l'utilisateur avec son rôle
          const response = await fetch("/api/user/me");
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            setUser(session.data.user as User);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de l'utilisateur:",
          error
        );
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const signOut = async () => {
    try {
      await authClient.signOut();
      setUser(null);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
    userRole: user?.role?.nom || ("Citoyen" as Role),
  };
}
