# 🔔 Système d'Abonnement aux Quartiers - Tech City IoT

## Vue d'ensemble

Le système d'abonnement aux quartiers permet aux citoyens de recevoir des notifications automatiques lorsque des alertes sont déclenchées dans les quartiers qui les intéressent.

## Fonctionnalités

### Interface Utilisateur

#### 1. Page des Quartiers (`/quartiers`)

- **Bouton d'abonnement** sur chaque carte de quartier
- **Icône cloche** (🔔) pour s'abonner
- **Icône check** (✅) avec bordure verte quand abonné
- **Pas de texte** pour économiser l'espace

#### 2. Page de Détail du Quartier (`/quartiers/[id]`)

- **Bouton d'abonnement complet** dans l'en-tête
- **Texte "S'abonner"** ou **"Abonné"** affiché
- **Positionnement** à droite du titre du quartier

### API Endpoints

#### GET `/api/quartiers/[id]/subscription`

Vérifier l'état d'abonnement d'un utilisateur à un quartier.

**Réponse :**

```json
{
  "success": true,
  "subscription": {
    "actif": true,
    "dateAbonnement": "2025-07-01T14:03:34.315Z",
    "typeAlerte": "TOUTES"
  }
}
```

#### POST `/api/quartiers/[id]/subscription`

S'abonner ou se désabonner d'un quartier.

**Body :**

```json
{
  "action": "subscribe", // ou "unsubscribe"
  "typeAlerte": "TOUTES" // optionnel, par défaut "TOUTES"
}
```

### Composant React

Le composant `QuartierSubscription` est réutilisable avec les props suivantes :

```tsx
<QuartierSubscription
  quartierId={1}
  quartierNom="Centre-Ville Tech City"
  variant="default" // "default" | "outline" | "ghost"
  size="default" // "sm" | "default" | "lg"
  showText={true} // boolean
/>
```

## États du Bouton

| État         | Icône     | Couleur        | Texte           |
| ------------ | --------- | -------------- | --------------- |
| Non abonné   | 🔔 Bell   | Bleu (default) | "S'abonner"     |
| Abonné       | ✅ Check  | Vert (outline) | "Abonné"        |
| Chargement   | ⏳ Loader | Gris           | "Chargement..." |
| Non connecté | -         | -              | Masqué          |

## Types d'Alertes

Les utilisateurs peuvent s'abonner aux types d'alertes suivants :

- **TOUTES** : Toutes les alertes du quartier
- **SEUIL_DEPASSE** : Seulement les alertes de dépassement de seuil
- **CAPTEUR_DEFAILLANT** : Seulement les alertes de capteur défaillant
- **MAINTENANCE** : Seulement les alertes de maintenance

## Notifications

Quand une alerte est déclenchée dans un quartier :

1. Le service d'alertes vérifie tous les utilisateurs abonnés au quartier
2. Des notifications sont créées pour chaque utilisateur concerné
3. Les notifications respectent les préférences de type d'alerte
4. Un système anti-spam évite les notifications répétées (30 min)

## Scripts de Test

### Test du Système Complet

```bash
npm run test-subscription
```

Vérifie :

- Les quartiers et utilisateurs disponibles
- Les abonnements existants
- La création d'abonnements
- Les notifications récentes

### Debug des Alertes

```bash
npm run debug-alerts
```

### Abonnement Manuel

```bash
npm run subscribe-quartier <email>
```

## Base de Données

### Table `abonnementQuartier`

```sql
CREATE TABLE abonnementQuartier (
  idUtilisateur VARCHAR PRIMARY KEY,
  idQuartier INTEGER PRIMARY KEY,
  actif BOOLEAN DEFAULT true,
  dateAbonnement TIMESTAMP,
  typeAlerte ENUM('SEUIL_DEPASSE', 'CAPTEUR_DEFAILLANT', 'MAINTENANCE', 'TOUTES')
);
```

### Clé Composite

L'abonnement utilise une clé composite `(idUtilisateur, idQuartier)`, permettant :

- Un utilisateur par quartier maximum
- Mise à jour facile de l'état d'abonnement
- Désabonnement par désactivation (actif = false)

## Sécurité

- **Authentification requise** : Seuls les utilisateurs connectés peuvent s'abonner
- **Validation des IDs** : Vérification de l'existence des quartiers
- **Gestion des erreurs** : Messages d'erreur explicites
- **Protection CSRF** : Utilisation des sessions authentifiées

## Toast Notifications

Le système utilise **Sonner** pour les notifications toast :

- ✅ **Succès** : "Abonné au quartier X avec succès !"
- ✅ **Désabonnement** : "Désabonné du quartier X"
- ❌ **Erreur** : Messages d'erreur spécifiques
- ⚠️ **Non connecté** : "Vous devez être connecté pour vous abonner"

## Intégration avec le Système d'Alertes

L'abonnement aux quartiers s'intègre parfaitement avec :

1. **Service d'alertes** (`lib/alert-service.ts`)
2. **Seuils personnalisés** (`components/seuils-personnalises.tsx`)
3. **Notifications** (page `/alertes`)
4. **Générateur d'alertes** (`scripts/generate-alert-data.ts`)

Les utilisateurs abonnés recevront automatiquement des notifications quand leurs seuils personnalisés sont dépassés dans les quartiers auxquels ils sont abonnés.
