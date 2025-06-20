"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { checkAccess, Role } from "@/lib/permissions";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: Role;
  fallbackUrl?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallbackUrl = "/sign-in",
}: ProtectedRouteProps) {
  const { loading, userRole, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Si l'utilisateur n'est pas connecté
    if (!isAuthenticated) {
      router.push(fallbackUrl);
      return;
    }

    // Si un rôle spécifique est requis
    if (requiredRole && userRole !== requiredRole) {
      router.push("/unauthorized");
      return;
    }

    // Vérifier les permissions générales pour la page
    if (!checkAccess(userRole, pathname)) {
      router.push("/unauthorized");
      return;
    }
  }, [
    isAuthenticated,
    userRole,
    pathname,
    loading,
    requiredRole,
    router,
    fallbackUrl,
  ]);

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas autorisé, ne pas afficher le contenu
  if (
    !isAuthenticated ||
    (requiredRole && userRole !== requiredRole) ||
    !checkAccess(userRole, pathname)
  ) {
    return null;
  }

  return <>{children}</>;
}

// Composant pour vérifier uniquement les permissions sans redirection
interface PermissionGuardProps {
  children: ReactNode;
  requiredRole?: Role;
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  requiredRole,
  fallback = null,
}: PermissionGuardProps) {
  const { userRole, isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <>{fallback}</>;
  }

  if (!checkAccess(userRole, pathname)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
