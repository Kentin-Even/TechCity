export type Role = "Admin" | "Gestionnaire" | "Citoyen" | "Chercheur";

export interface Permission {
  role: Role;
  allowedPaths: string[];
  deniedPaths?: string[];
}

// Configuration des permissions par rôle
export const PERMISSIONS: Permission[] = [
  {
    role: "Admin",
    allowedPaths: ["*"], // Accès total
  },
  {
    role: "Gestionnaire",
    allowedPaths: [
      "/dashboard",
      "/capteurs",
      "/quartiers",
      "/alertes",
      "/rapports",
      "/utilisateurs",
      "/analyses",
      "/notifications",
      "/profile",
    ],
    deniedPaths: ["/admin", "/settings/system"],
  },
  {
    role: "Citoyen",
    allowedPaths: [
      "/dashboard",
      "/capteurs/view",
      "/quartiers/view",
      "/alertes/view",
      "/suggestions",
      "/profil",
      "/profile",
      "/notifications",
      "/abonnements",
    ],
    deniedPaths: [
      "/admin",
      "/utilisateurs",
      "/capteurs/manage",
      "/quartiers/manage",
      "/rapports/create",
      "/analyses/create",
    ],
  },
  {
    role: "Chercheur",
    allowedPaths: [
      "/dashboard",
      "/capteurs/view",
      "/quartiers/view",
      "/analyses",
      "/rapports",
      "/donnees",
      "/projets",
      "/profil",
      "/profile",
    ],
    deniedPaths: [
      "/admin",
      "/utilisateurs",
      "/capteurs/manage",
      "/quartiers/manage",
      "/alertes/manage",
    ],
  },
];

// Fonction pour vérifier si un utilisateur a accès à une page
export function checkAccess(userRole: Role, path: string): boolean {
  const permission = PERMISSIONS.find((p) => p.role === userRole);

  if (!permission) {
    return false;
  }

  // Si l'utilisateur a accès total (Admin)
  if (permission.allowedPaths.includes("*")) {
    return true;
  }

  // Vérifier les chemins interdits
  if (
    permission.deniedPaths?.some(
      (deniedPath) => path.startsWith(deniedPath) || path === deniedPath
    )
  ) {
    return false;
  }

  // Vérifier les chemins autorisés
  return permission.allowedPaths.some(
    (allowedPath) => path.startsWith(allowedPath) || path === allowedPath
  );
}

// Fonction pour obtenir les routes autorisées pour un rôle
export function getAllowedRoutes(role: Role): string[] {
  const permission = PERMISSIONS.find((p) => p.role === role);
  return permission?.allowedPaths || [];
}

// Fonction pour obtenir les routes interdites pour un rôle
export function getDeniedRoutes(role: Role): string[] {
  const permission = PERMISSIONS.find((p) => p.role === role);
  return permission?.deniedPaths || [];
}
