# 🏗️ Simulateur de Capteurs IoT - Tech City

Ce simulateur génère automatiquement des données réalistes pour différents types de capteurs IoT et les injecte directement dans votre base de données.

## 📊 Types de Capteurs Supportés

### 🌬️ Qualité de l'Air (toutes les 5 minutes)

- **PM2.5** : Particules fines (μg/m³)
- **CO2** : Dioxyde de carbone (ppm)

### 🌡️ Météorologie (toutes les 10 minutes)

- **Température** : Température ambiante (°C)
- **Humidité** : Taux d'humidité relative (%)

### 🔊 Acoustique (toutes les 2 minutes)

- **Niveau Sonore** : Mesure du bruit ambiant (dB)

### 🚗 Circulation (toutes les 30 secondes)

- **Trafic** : Nombre de véhicules par minute (vehicles/min)

## 🚀 Installation et Configuration

### 1. Initialiser les Capteurs dans la Base de Données

```bash
npm run seed-sensors
```

Cette commande va créer :

- Un quartier de test (Centre-Ville Tech City)
- 6 types de capteurs avec leurs caractéristiques
- 6 capteurs IoT configurés et positionnés

### 2. Démarrer le Simulateur

#### Option A : Via Script Direct

```bash
npm run simulator
```

#### Option B : Mode Développement (redémarrage automatique)

```bash
npm run simulator:dev
```

### 3. Contrôler via l'API Web

#### Vérifier le Statut

```bash
curl http://localhost:3000/api/simulator
```

#### Démarrer le Simulateur

```bash
curl -X POST http://localhost:3000/api/simulator \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

#### Arrêter le Simulateur

```bash
curl -X POST http://localhost:3000/api/simulator \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

## 📈 Données Générées

### Algorithmes de Simulation

#### 🌬️ Qualité de l'Air

- **PM2.5** : Varie selon l'heure de la journée (5-50 μg/m³)
- **CO2** : Suit un cycle journalier avec pic en journée (400-1000 ppm)

#### 🌡️ Météorologie

- **Température** : Cycle journalier + variation saisonnière (-10 à +35°C)
- **Humidité** : Inversement corrélée à la température (20-95%)

#### 🔊 Acoustique

- **Niveau Sonore** : Plus élevé le jour, plus calme la nuit (30-85 dB)

#### 🚗 Circulation

- **Trafic** : Pics aux heures de pointe, plus calme le weekend (0-50 véhicules/min)

### Structure des Données

Chaque mesure contient :

```typescript
{
  idDonnee: BigInt,      // ID unique
  valeur: Decimal,       // Valeur mesurée
  timestamp: DateTime,   // Horodatage
  unite: String,         // Unité de mesure
  validee: Boolean,      // Statut de validation
  idCapteur: Number      // ID du capteur source
}
```

## 🔧 Configuration Avancée

### Modifier les Intervalles

Dans `lib/sensor-simulator.ts`, vous pouvez ajuster les intervalles :

```typescript
const SENSOR_CONFIGS = {
  AIR_QUALITY: {
    interval: 5 * 60 * 1000, // 5 minutes → modifiez ici
    // ...
  },
  // ...
};
```

### Personnaliser les Algorithmes

Chaque type de capteur a sa fonction de génération :

- `generateAirQualityData()`
- `generateTemperatureHumidityData()`
- `generateSoundLevelData()`
- `generateTrafficData()`

## 📊 Monitoring

### Logs en Temps Réel

Le simulateur affiche des logs détaillés :

```
💾 Données sauvegardées - Capteur 1: 23.45 μg/m³
💾 Données sauvegardées - Capteur 2: 456 ppm
🌡️ Température/Humidité - 22.1°C, 58.3%
🔊 Niveau sonore - 52.4 dB
🚗 Circulation - 15 vehicles/min
```

### Gestion des Erreurs

- Connexion à la base de données automatiquement gérée
- Récupération en cas d'erreur temporaire
- Logs d'erreur détaillés pour le debug

## 🛑 Arrêt Propre

Le simulateur gère proprement les signaux d'arrêt :

- `Ctrl+C` (SIGINT)
- `SIGTERM`
- Fermeture automatique de la connexion Prisma

## 🔍 Surveillance des Performances

### Vérification du Statut

```typescript
const status = sensorSimulator.getStatus();
console.log(status);
// { isRunning: true, activeSimulators: 4 }
```

### Base de Données

Les données sont stockées dans la table `donneeCapteur` :

- Index sur `timestamp` pour les requêtes temporelles
- Index sur `idCapteur` pour les requêtes par capteur
- Contraintes de validation des données

## 🐛 Dépannage

### Problème de Connexion Base de Données

```bash
# Vérifier la variable d'environnement
echo $DATABASE_URL

# Tester la connexion Prisma
npx prisma db pull
```

### Capteurs Non Créés

```bash
# Réinitialiser les capteurs
npm run seed-sensors
```

### Simulateur qui ne Démarre Pas

```bash
# Vérifier les logs pour les erreurs
npm run simulator 2>&1 | tee simulator.log
```

## 📝 Support

Pour toute question ou problème :

1. Vérifiez les logs du simulateur
2. Consultez la base de données pour les données générées
3. Testez l'API `/api/simulator` pour vérifier le statut

---

_Simulateur développé pour Tech City IoT - Génération de données réalistes pour tests et développement_ 🏙️
