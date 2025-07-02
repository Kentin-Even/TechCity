# 🔔 Système de Notifications - Tech City IoT

## Vue d'ensemble

Le système de notifications affiche des cartes de notification en temps réel en bas à droite de l'écran pour alerter les utilisateurs des événements importants dans leur ville intelligente.

## Fonctionnalités

### 📱 Cartes de notification

- **Position fixe** : En bas à droite de l'écran
- **Affichage empilé** : Jusqu'à 3 notifications visibles avec effet de superposition
- **Animation fluide** : Apparition avec transition slide-in
- **Auto-rafraîchissement** : Vérification automatique toutes les 15 secondes

### 🎨 Interface utilisateur

- **Design adaptatif** : Couleurs selon le niveau de gravité

  - 🔴 **CRITIQUE** : Bordure rouge, fond rouge clair
  - 🟠 **ELEVE** : Bordure orange, fond orange clair
  - 🟡 **MOYEN** : Bordure jaune, fond jaune clair
  - 🔵 **FAIBLE** : Bordure bleue, fond bleu clair

- **Informations affichées** :
  - Icône selon la gravité
  - Titre de l'alerte
  - Temps relatif (ex: "5 min", "2h", "1j")
  - Message tronqué (2 lignes max)
  - Quartier concerné
  - Valeur mesurée avec unité
  - Type de capteur
  - Badge de niveau de gravité

### ⚡ Actions disponibles

- **❌ Fermer** : Supprime la notification de l'affichage
- **🔍 Détail** : Ouvre le modal avec informations complètes
- **👁️ Marquer lu** : Marque la notification comme lue

## Architecture technique

### Composants créés

#### 1. `NotificationCard` - Carte individuelle

- Affichage compact d'une notification
- Gestion des animations d'apparition/disparition
- Actions de fermeture et d'expansion

#### 2. `NotificationDetailModal` - Modal de détail

- Vue complète de la notification
- Informations détaillées du capteur
- Actions : fermer, marquer comme lu, voir le capteur

#### 3. `NotificationStack` - Gestionnaire principal

- Gestion de l'empilement des notifications
- Limitation à 3 notifications visibles
- Filtrage des notifications non lues
- Intégration avec le hook de données

#### 4. `useNotifications` - Hook personnalisé

- Récupération des données API
- Auto-rafraîchissement en temps réel
- Gestion des états (chargement, erreurs)
- Actions : marquer lu, supprimer

### 🔌 Intégration

#### Layout principal (`app/layout.tsx`)

```tsx
// Système de notifications ajouté au layout global
<NotificationStack />
<Toaster position="top-right" richColors closeButton duration={4000} />
```

#### Hook d'utilisation

```tsx
const {
  notifications, // Liste des notifications
  unreadCount, // Nombre de non lues
  isLoading, // État de chargement
  error, // Erreurs éventuelles
  markAsRead, // Marquer comme lue
  dismissNotification, // Supprimer de l'affichage
} = useNotifications({
  autoRefresh: true,
  refreshInterval: 15000,
  limit: 20,
});
```

## API utilisée

### Endpoint principal

- **GET** `/api/alerts/notifications?limit=20`
- **PUT** `/api/alerts/notifications` (marquer comme lu)

### Format des données

```typescript
interface NotificationData {
  idNotification: number;
  titre: string;
  message: string;
  dateEnvoi: string;
  type: string;
  statut: string; // "EN_ATTENTE" | "LU"
  alerte: {
    niveauGravite: string;
    valeurMesuree: number;
    seuilDeclenche: number;
    capteur: {
      idCapteur: number;
      nom: string;
      quartier: { nom: string };
      typeCapteur: { nom: string; unite: string };
    };
  };
}
```

## Scripts de test

### Créer une notification de test

```bash
npm run create-test-notification
```

Ce script :

- Trouve l'utilisateur connecté
- Crée une alerte de test
- Génère une notification non lue
- Affiche le résultat dans la console

### Tester le système complet

```bash
npm run test-subscription
```

Affiche toutes les notifications existantes pour l'utilisateur.

## Gestion des erreurs corrigées

### 1. Boucle infinie de re-render

**Problème** : `useEffect` avec dépendance instable

```tsx
// ❌ Avant (causait une boucle)
}, [unreadNotifications, maxVisible]);

// ✅ Après (stable)
}, [unreadNotifications.length, maxVisible]);
```

### 2. Erreur toFixed sur Decimal

**Problème** : Types Prisma Decimal non compatibles avec `toFixed()`

```tsx
// ❌ Avant (erreur runtime)
{
  notification.alerte.valeurMesuree.toFixed(1);
}

// ✅ Après (conversion explicite)
{
  Number(notification.alerte.valeurMesuree).toFixed(1);
}
```

## Personnalisation

### Modifier le nombre de notifications visibles

```tsx
<NotificationStack maxVisible={5} />
```

### Activer l'auto-hide

```tsx
<NotificationStack autoHide={true} autoHideDuration={8000} />
```

### Changer l'intervalle de rafraîchissement

```tsx
const { notifications } = useNotifications({
  refreshInterval: 30000, // 30 secondes
});
```

## États visuels

| État       | Indicateur  | Comportement                      |
| ---------- | ----------- | --------------------------------- |
| Non lue    | Point bleu  | Couleur vive, apparaît en premier |
| Lue        | Aucun       | Couleur atténuée, n'apparaît pas  |
| Erreur     | Toast rouge | Message d'erreur temporaire       |
| Chargement | -           | Pas d'indicateur visuel           |

## Accessibilité

- **Contraste** : Couleurs conformes WCAG
- **Focus** : Navigation clavier supportée
- **Screen readers** : Titres et descriptions appropriés
- **Actions** : Boutons avec tooltips explicites

## Performance

- **Mémorisation** : Hook `useCallback` pour éviter les re-renders
- **Limitation** : Maximum 3 notifications affichées
- **Nettoyage** : Timers automatiquement nettoyés
- **Optimisation** : Requêtes limitées (20 notifications max)

Le système est maintenant opérationnel et fournit une expérience utilisateur fluide pour les notifications en temps réel ! 🎉
