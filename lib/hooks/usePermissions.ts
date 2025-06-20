import { useAuth } from "./useAuth";
import {
  checkAccess,
  getAllowedRoutes,
  getDeniedRoutes,
  Role,
} from "../permissions";

export function usePermissions() {
  const { userRole, isAuthenticated } = useAuth();

  const hasAccess = (path: string): boolean => {
    if (!isAuthenticated) return false;
    return checkAccess(userRole, path);
  };

  const hasRole = (role: Role): boolean => {
    if (!isAuthenticated) return false;
    return userRole === role;
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    if (!isAuthenticated) return false;
    return roles.includes(userRole);
  };

  const canAccess = (requiredRoles: Role[]): boolean => {
    if (!isAuthenticated) return false;
    return requiredRoles.includes(userRole);
  };

  const getAllowedPaths = (): string[] => {
    if (!isAuthenticated) return [];
    return getAllowedRoutes(userRole);
  };

  const getDeniedPaths = (): string[] => {
    if (!isAuthenticated) return [];
    return getDeniedRoutes(userRole);
  };

  const isAdmin = (): boolean => hasRole("Admin");
  const isGestionnaire = (): boolean => hasRole("Gestionnaire");
  const isCitoyen = (): boolean => hasRole("Citoyen");
  const isChercheur = (): boolean => hasRole("Chercheur");

  return {
    hasAccess,
    hasRole,
    hasAnyRole,
    canAccess,
    getAllowedPaths,
    getDeniedPaths,
    isAdmin,
    isGestionnaire,
    isCitoyen,
    isChercheur,
    userRole,
    isAuthenticated,
  };
}
