# 🔬 Page de Données Brutes pour Chercheurs

## Vue d'ensemble

Une page dédiée aux chercheurs permettant l'accès aux données brutes de tous les capteurs de la ville. Cette page offre des fonctionnalités avancées de filtrage, de visualisation et d'export des données.

## 🔐 Contrôle d'accès

- **Rôles autorisés** : `Chercheur` et `Admin` uniquement
- Les autres utilisateurs seront automatiquement redirigés
- La vérification se fait côté client et côté serveur

## 📍 Accès

- **URL** : `/donnees`
- **Visible dans la sidebar** : Section "Chercheur" pour les utilisateurs avec le rôle approprié

## 🚀 Fonctionnalités

### 1. Visualisation des données

- Tableau paginé avec toutes les données brutes
- Affichage de :
  - ID de la donnée
  - Timestamp (date et heure)
  - Nom du capteur
  - Type de capteur
  - Quartier
  - Valeur mesurée
  - Unité de mesure
  - Statut de validation
  - Numéro de série du capteur

### 2. Filtrage avancé

- **Par type de capteur** : Sélection depuis une liste déroulante
- **Par quartier** : Recherche textuelle
- **Par période** : Sélection de dates début/fin
- **Recherche globale** : Par nom de capteur ou numéro de série
- **Réinitialisation** : Bouton pour effacer tous les filtres

### 3. Export de données

- **Format CSV** : Pour utilisation dans Excel/tableurs
- **Format JSON** : Pour traitement programmatique
- Les exports incluent toutes les données filtrées
- Les exports contiennent des métadonnées supplémentaires (modèle, fabricant, coordonnées GPS)

### 4. Pagination

- 50 enregistrements par page
- Navigation entre les pages
- Affichage du nombre total d'enregistrements

## 🔧 Architecture technique

### Endpoints API

#### `/api/donnees/brutes`

- **Méthode** : GET
- **Paramètres** :
  - `page` : Numéro de page (défaut: 1)
  - `limit` : Nombre d'éléments par page (défaut: 50)
  - `typeCapteur` : ID du type de capteur
  - `quartier` : Nom du quartier (recherche partielle)
  - `dateDebut` : Date de début (ISO 8601)
  - `dateFin` : Date de fin (ISO 8601)
  - `search` : Terme de recherche

#### `/api/donnees/export`

- **Méthode** : GET
- **Paramètres** :
  - `format` : 'csv' ou 'json'
  - Mêmes filtres que l'API brutes

### Structure des données

```typescript
interface DonneeBrute {
  idDonnee: string;
  valeur: number;
  timestamp: string;
  unite: string;
  validee: boolean;
  capteur: {
    idCapteur: number;
    nom: string;
    modele: string;
    numeroSerie: string;
    quartier: {
      nom: string;
    };
    typeCapteur: {
      nom: string;
    };
  };
}
```

## 📊 Cas d'usage pour chercheurs

1. **Analyse temporelle** : Export de données sur une période spécifique pour analyser les tendances
2. **Comparaison spatiale** : Filtrage par quartier pour comparer les mesures entre zones
3. **Validation de modèles** : Accès aux données brutes non traitées pour calibrer des modèles prédictifs
4. **Études environnementales** : Export de données de capteurs spécifiques (qualité de l'air, bruit, etc.)
5. **Recherche interdisciplinaire** : Export JSON pour intégration dans d'autres systèmes

## 🛠️ Configuration requise

1. **Base de données** : Tables `donneeCapteur`, `capteur`, `quartier`, `typeCapteur` doivent être remplies
2. **Rôles** : Le rôle "Chercheur" doit exister dans la table `role`
3. **Permissions** : Le chemin `/donnees` est autorisé pour le rôle Chercheur dans `lib/permissions.ts`

## 🔒 Sécurité

- Authentification requise via Better Auth
- Vérification du rôle côté serveur sur chaque appel API
- Pas d'accès aux données sensibles (mots de passe, informations personnelles)
- Les exports sont limités aux données autorisées

## 📈 Performance

- Pagination côté serveur pour éviter de charger trop de données
- Index recommandés sur :
  - `donneeCapteur.timestamp`
  - `donneeCapteur.idCapteur`
  - `capteur.idTypeCapteur`
  - `capteur.idQuartier`

## 🚨 Limitations actuelles

- Export limité aux données filtrées (pas d'export global pour éviter la surcharge)
- Pas de graphiques intégrés (les chercheurs utilisent leurs propres outils)
- Pas de modification des données (lecture seule)

## 📝 Prochaines améliorations possibles

1. Ajout de graphiques interactifs
2. Export en formats supplémentaires (Excel natif, Parquet)
3. API de streaming pour données en temps réel
4. Système de favoris pour sauvegarder des filtres
5. Statistiques descriptives intégrées
6. Export programmé par email
