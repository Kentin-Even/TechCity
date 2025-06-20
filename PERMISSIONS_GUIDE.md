# Guide du Système de Gestion des Rôles et Permissions

## Vue d'ensemble

Ce système permet de gérer l'accès aux différentes parties de l'application en fonction des rôles utilisateur. Il comprend 4 rôles principaux :

- **Admin** : Accès complet à toutes les fonctionnalités
- **Gestionnaire** : Gestion des capteurs, quartiers, alertes et utilisateurs
- **Citoyen** : Consultation des données et création de suggestions
- **Chercheur** : Accès aux analyses, rapports et données de recherche

## Architecture

### Fichiers principaux

1. **`lib/permissions.ts`** : Configuration des permissions par rôle
2. **`lib/hooks/useAuth.ts`** : Hook pour l'authentification
3. **`lib/hooks/usePermissions.ts`** : Hook pour vérifier les permissions
4. **`components/ProtectedRoute.tsx`** : Composants de protection des routes
5. **`middleware.ts`** : Middleware Next.js pour la protection côté serveur
6. **`app/api/user/me/route.ts`** : API pour récupérer les informations utilisateur

## Utilisation

### 1. Protection d'une page complète

```tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="Admin">
      <div>
        <h1>Page d'administration</h1>
        {/* Contenu réservé aux admins */}
      </div>
    </ProtectedRoute>
  );
}
```

### 2. Protection conditionnelle d'éléments

```tsx
import { PermissionGuard } from "@/components/ProtectedRoute";

export default function Dashboard() {
  return (
    <div>
      <h1>Tableau de bord</h1>

      <PermissionGuard requiredRole="Admin">
        <button>Paramètres système</button>
      </PermissionGuard>

      <PermissionGuard requiredRole="Gestionnaire">
        <button>Gérer les capteurs</button>
      </PermissionGuard>
    </div>
  );
}
```

### 3. Utilisation des hooks

```tsx
import { usePermissions } from "@/lib/hooks/usePermissions";

export default function MyComponent() {
  const { isAdmin, hasAccess, userRole } = usePermissions();

  return (
    <div>
      <p>Votre rôle : {userRole}</p>

      {isAdmin() && <p>Vous êtes administrateur</p>}

      {hasAccess("/capteurs/manage") && <button>Gérer les capteurs</button>}
    </div>
  );
}
```

### 4. Navigation basée sur les rôles

```tsx
import { RoleBasedNavigation } from "@/components/RoleBasedNavigation";

export default function Layout({ children }) {
  return (
    <div>
      <RoleBasedNavigation />
      <main>{children}</main>
    </div>
  );
}
```

## Configuration des permissions

### Modifier les permissions dans `lib/permissions.ts`

```typescript
export const PERMISSIONS: Permission[] = [
  {
    role: "Citoyen",
    allowedPaths: [
      "/dashboard",
      "/capteurs/view",
      "/suggestions",
      // Ajouter de nouvelles routes autorisées
    ],
    deniedPaths: [
      "/admin",
      "/capteurs/manage",
      // Ajouter des routes spécifiquement interdites
    ],
  },
  // ... autres rôles
];
```

### Ajouter un nouveau rôle

1. Modifier le type `Role` dans `lib/permissions.ts`
2. Ajouter le rôle dans le seed Prisma (`prisma/seed.ts`)
3. Configurer les permissions dans `PERMISSIONS`
4. Exécuter la migration : `npm run db:seed`

## Protection côté serveur

Le middleware Next.js protège automatiquement les routes. Pour ajouter une nouvelle route protégée :

```typescript
// Dans middleware.ts
const protectedRoutes = [
  "/dashboard",
  "/capteurs",
  // Ajouter votre nouvelle route
  "/nouvelle-route",
];
```

## API et authentification

### Récupérer l'utilisateur connecté

```typescript
// Dans une API route
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Utiliser session.user...
}
```

## Tests et vérification

### Tester les permissions

1. Créer des utilisateurs avec différents rôles
2. Se connecter avec chaque utilisateur
3. Vérifier l'accès aux différentes pages
4. Tester la navigation et les éléments conditionnels

### Routes de test

- `/dashboard` - Accessible à tous les utilisateurs connectés
- `/admin` - Réservé aux admins
- `/capteurs` - Admins et gestionnaires
- `/capteurs/view` - Citoyens et chercheurs
- `/unauthorized` - Page d'erreur pour accès refusé

## Sécurité

### Bonnes pratiques

1. **Double vérification** : Protection côté client ET serveur
2. **Principe du moindre privilège** : Donner le minimum de permissions nécessaires
3. **Validation côté serveur** : Ne jamais faire confiance uniquement au client
4. **Logs de sécurité** : Enregistrer les tentatives d'accès non autorisées

### Limitations côté client

⚠️ **Important** : La protection côté client peut être contournée. Toujours vérifier les permissions côté serveur pour les opérations sensibles.

## Dépannage

### Problèmes courants

1. **Redirection infinie** : Vérifier que les routes publiques sont bien configurées
2. **403 Forbidden** : L'utilisateur n'a pas les permissions requises
3. **Session expirée** : Redirection automatique vers la page de connexion

### Debugging

```typescript
// Ajouter des logs pour déboguer
console.log("User role:", userRole);
console.log("Has access to /admin:", hasAccess("/admin"));
console.log("Allowed paths:", getAllowedPaths());
```

## Migration et mise à jour

### Ajouter de nouvelles permissions

1. Modifier la configuration dans `lib/permissions.ts`
2. Mettre à jour les composants si nécessaire
3. Tester avec tous les rôles
4. Déployer en production

### Gérer les utilisateurs existants

Lors de l'ajout de nouveaux rôles, s'assurer que tous les utilisateurs existants ont un rôle assigné (par défaut : "Citoyen").
