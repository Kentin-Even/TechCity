"use client";

import { usePermissions } from "@/lib/hooks/usePermissions";
import Link from "next/link";
import { PermissionGuard } from "./protectedRoute";
import { Role } from "@/lib/permissions";

interface NavItem {
  label: string;
  href: string;
  requiredRoles?: Role[];
  icon?: string;
}

const navigationItems: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: "📊",
  },
  {
    label: "Capteurs",
    href: "/capteurs",
    requiredRoles: ["Admin", "Gestionnaire"],
    icon: "📡",
  },
  {
    label: "Voir les capteurs",
    href: "/capteurs/view",
    requiredRoles: ["Citoyen", "Chercheur"],
    icon: "👀",
  },
  {
    label: "Quartiers",
    href: "/quartiers",
    requiredRoles: ["Admin", "Gestionnaire"],
    icon: "🏘️",
  },
  {
    label: "Alertes",
    href: "/alertes",
    requiredRoles: ["Admin", "Gestionnaire"],
    icon: "⚠️",
  },
  {
    label: "Voir les alertes",
    href: "/alertes/view",
    requiredRoles: ["Citoyen"],
    icon: "👁️",
  },
  {
    label: "Rapports",
    href: "/rapports",
    requiredRoles: ["Admin", "Gestionnaire", "Chercheur"],
    icon: "📋",
  },
  {
    label: "Analyses",
    href: "/analyses",
    requiredRoles: ["Admin", "Chercheur"],
    icon: "📈",
  },
  {
    label: "Utilisateurs",
    href: "/utilisateurs",
    requiredRoles: ["Admin", "Gestionnaire"],
    icon: "👥",
  },
  {
    label: "Suggestions",
    href: "/suggestions",
    requiredRoles: ["Citoyen"],
    icon: "💡",
  },
  {
    label: "Projets",
    href: "/projets",
    requiredRoles: ["Chercheur"],
    icon: "🔬",
  },
  {
    label: "Administration",
    href: "/admin",
    requiredRoles: ["Admin"],
    icon: "⚙️",
  },
];

export function RoleBasedNavigation() {
  const { userRole, hasAccess, canAccess } = usePermissions();

  const getVisibleNavItems = () => {
    return navigationItems.filter((item) => {
      // Si aucun rôle requis, afficher pour tous
      if (!item.requiredRoles) {
        return hasAccess(item.href);
      }

      // Vérifier si l'utilisateur a un des rôles requis
      return canAccess(item.requiredRoles) && hasAccess(item.href);
    });
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">IoT Dashboard</h1>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {userRole}
            </span>
          </div>

          <div className="flex space-x-4">
            {getVisibleNavItems().map((item) => (
              <PermissionGuard
                key={item.href}
                requiredRole={item.requiredRoles?.[0]}
              >
                <Link
                  href={item.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </PermissionGuard>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Composant pour afficher des informations basées sur le rôle
export function RoleBasedContent() {
  const { isAdmin, isGestionnaire, isCitoyen, isChercheur, userRole } =
    usePermissions();

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">
        Contenu basé sur votre rôle : {userRole}
      </h2>

      {isAdmin() && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-800">Accès Administrateur</h3>
          <p className="text-red-700">
            Vous avez accès à toutes les fonctionnalités du système.
          </p>
        </div>
      )}

      {isGestionnaire() && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-800">Accès Gestionnaire</h3>
          <p className="text-blue-700">
            Vous pouvez gérer les capteurs, quartiers et utilisateurs.
          </p>
        </div>
      )}

      {isCitoyen() && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold text-green-800">Accès Citoyen</h3>
          <p className="text-green-700">
            Vous pouvez consulter les données et faire des suggestions.
          </p>
        </div>
      )}

      {isChercheur() && (
        <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded">
          <h3 className="font-semibold text-purple-800">Accès Chercheur</h3>
          <p className="text-purple-700">
            Vous avez accès aux analyses et aux données de recherche.
          </p>
        </div>
      )}
    </div>
  );
}
