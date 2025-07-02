import { PrismaClient } from "../lib/generated/prisma";
import { alertService } from "../lib/alert-service";

const prisma = new PrismaClient();

// Types pour les données d'alerte
interface AlertTestData {
  idCapteur: number;
  valeur: number;
  unite: string;
  typeCapteur: string;
  niveau: "LEGER" | "MODERE" | "CRITIQUE";
}

// Configuration des seuils d'alerte par type de capteur
const ALERT_THRESHOLDS = {
  "PM2.5": {
    LEGER: 55, // Légèrement au-dessus de la normale (50)
    MODERE: 85, // Modéré (2x la normale)
    CRITIQUE: 150, // Critique (3x la normale)
    unite: "μg/m³",
  },
  CO2: {
    LEGER: 1200, // Légèrement élevé (normal: 400-1000)
    MODERE: 2000, // Modéré
    CRITIQUE: 3500, // Critique
    unite: "ppm",
  },
  Temperature: {
    LEGER: 32, // Canicule légère
    MODERE: 38, // Canicule modérée
    CRITIQUE: 45, // Canicule critique
    unite: "°C",
  },
  Humidity: {
    LEGER: 85, // Humidité élevée
    MODERE: 95, // Très humide
    CRITIQUE: 98, // Extrême
    unite: "%",
  },
  Sound: {
    LEGER: 75, // Bruit élevé (normal: 30-65)
    MODERE: 85, // Très bruyant
    CRITIQUE: 95, // Extrêmement bruyant
    unite: "dB",
  },
  Traffic: {
    LEGER: 50, // Trafic dense
    MODERE: 80, // Très dense
    CRITIQUE: 120, // Embouteillage critique
    unite: "vehicles/min",
  },
};

// Mapping des capteurs (basé sur le simulateur existant)
const CAPTEUR_MAPPING = {
  1: { type: "PM2.5", nom: "Capteur PM2.5 - Place Centrale" },
  2: { type: "CO2", nom: "Capteur CO2 - Place Centrale" },
  3: { type: "Temperature", nom: "Capteur Température - Place Centrale" },
  4: { type: "Humidity", nom: "Capteur Humidité - Place Centrale" },
  5: { type: "Sound", nom: "Capteur Son - Place Centrale" },
  6: { type: "Traffic", nom: "Capteur Trafic - Place Centrale" },
};

class AlertDataGenerator {
  private generateUniqueId(): bigint {
    return BigInt(Date.now() * 1000 + Math.floor(Math.random() * 1000));
  }

  private generateAlertValue(
    typeCapteur: string,
    niveau: "LEGER" | "MODERE" | "CRITIQUE"
  ): number {
    const config =
      ALERT_THRESHOLDS[typeCapteur as keyof typeof ALERT_THRESHOLDS];
    if (!config) {
      throw new Error(`Type de capteur non supporté: ${typeCapteur}`);
    }

    const baseValue = config[niveau];
    // Ajouter une variation aléatoire de ±10%
    const variation = baseValue * 0.1 * (Math.random() - 0.5);
    return Number((baseValue + variation).toFixed(2));
  }

  private async saveSensorData(data: AlertTestData): Promise<void> {
    try {
      await prisma.donneeCapteur.create({
        data: {
          idDonnee: this.generateUniqueId(),
          valeur: data.valeur,
          timestamp: new Date(),
          unite: data.unite,
          validee: true,
          idCapteur: data.idCapteur,
        },
      });

      console.log(
        `📊 Donnée générée - Capteur ${data.idCapteur} (${data.typeCapteur}): ${data.valeur} ${data.unite} [${data.niveau}]`
      );

      // Déclencher la vérification des seuils
      const capteur = await prisma.capteur.findUnique({
        where: { idCapteur: data.idCapteur },
        include: { typeCapteur: true },
      });

      if (capteur) {
        await alertService.verifierSeuilsPersonnalises(
          data.idCapteur,
          data.valeur,
          capteur.idTypeCapteur
        );
        console.log(
          `🚨 Vérification des alertes effectuée pour le capteur ${data.idCapteur}`
        );
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors de la génération des données d'alerte:`,
        error
      );
    }
  }

  // Générer des données d'alerte pour un capteur spécifique
  async generateSingleAlert(
    idCapteur: number,
    niveau: "LEGER" | "MODERE" | "CRITIQUE" = "MODERE"
  ): Promise<void> {
    const capteurInfo =
      CAPTEUR_MAPPING[idCapteur as keyof typeof CAPTEUR_MAPPING];
    if (!capteurInfo) {
      console.error(`❌ Capteur ${idCapteur} non trouvé dans la configuration`);
      return;
    }

    const valeur = this.generateAlertValue(capteurInfo.type, niveau);
    const unite =
      ALERT_THRESHOLDS[capteurInfo.type as keyof typeof ALERT_THRESHOLDS].unite;

    await this.saveSensorData({
      idCapteur,
      valeur,
      unite,
      typeCapteur: capteurInfo.type,
      niveau,
    });
  }

  // Générer des données d'alerte pour tous les capteurs
  async generateAllAlerts(
    niveau: "LEGER" | "MODERE" | "CRITIQUE" = "MODERE"
  ): Promise<void> {
    console.log(
      `🚀 Génération d'alertes niveau ${niveau} pour tous les capteurs...`
    );

    const capteurIds = Object.keys(CAPTEUR_MAPPING).map(Number);

    for (const idCapteur of capteurIds) {
      await this.generateSingleAlert(idCapteur, niveau);
      // Attendre un peu entre chaque génération pour éviter les conflits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ Génération terminée pour ${capteurIds.length} capteurs`);
  }

  // Générer des données d'alerte pour des capteurs spécifiques
  async generateSelectiveAlerts(
    capteurIds: number[],
    niveau: "LEGER" | "MODERE" | "CRITIQUE" = "MODERE"
  ): Promise<void> {
    console.log(
      `🎯 Génération d'alertes niveau ${niveau} pour les capteurs: ${capteurIds.join(
        ", "
      )}`
    );

    for (const idCapteur of capteurIds) {
      await this.generateSingleAlert(idCapteur, niveau);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `✅ Génération terminée pour ${capteurIds.length} capteurs sélectionnés`
    );
  }

  // Générer un scénario de pollution critique
  async generatePollutionCrisis(): Promise<void> {
    console.log(
      `🔥 SIMULATION DE CRISE POLLUTION - Génération de données critiques...`
    );

    // PM2.5 et CO2 en niveau critique
    await this.generateSingleAlert(1, "CRITIQUE"); // PM2.5
    await this.generateSingleAlert(2, "CRITIQUE"); // CO2

    // Température élevée (contribue à la pollution)
    await this.generateSingleAlert(3, "MODERE"); // Température

    // Trafic dense (source de pollution)
    await this.generateSingleAlert(6, "CRITIQUE"); // Trafic

    console.log(`🚨 CRISE SIMULÉE: Pollution critique détectée!`);
  }

  // Générer un scénario de canicule
  async generateHeatWave(): Promise<void> {
    console.log(
      `🌡️ SIMULATION CANICULE - Génération de données de chaleur extrême...`
    );

    // Température critique
    await this.generateSingleAlert(3, "CRITIQUE"); // Température

    // Humidité très faible (air sec)
    const config = ALERT_THRESHOLDS["Humidity"];
    await this.saveSensorData({
      idCapteur: 4,
      valeur: 15, // Très sec
      unite: config.unite,
      typeCapteur: "Humidity",
      niveau: "CRITIQUE",
    });

    console.log(`🔥 CANICULE SIMULÉE: Températures extrêmes détectées!`);
  }

  // Afficher la configuration des seuils
  displayThresholds(): void {
    console.log("\n📋 CONFIGURATION DES SEUILS D'ALERTE:");
    console.log("=====================================");

    Object.entries(ALERT_THRESHOLDS).forEach(([type, config]) => {
      console.log(`\n${type} (${config.unite}):`);
      console.log(`  • Léger:    ${config.LEGER} ${config.unite}`);
      console.log(`  • Modéré:   ${config.MODERE} ${config.unite}`);
      console.log(`  • Critique: ${config.CRITIQUE} ${config.unite}`);
    });

    console.log("\n🎯 CAPTEURS DISPONIBLES:");
    console.log("========================");
    Object.entries(CAPTEUR_MAPPING).forEach(([id, info]) => {
      console.log(`  • Capteur ${id}: ${info.nom} (${info.type})`);
    });
  }
}

// Script principal
async function main() {
  const generator = new AlertDataGenerator();

  // Récupérer les arguments de ligne de commande
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "help":
      case "--help":
      case "-h":
        console.log(`
🚨 GÉNÉRATEUR DE DONNÉES D'ALERTE
=================================

Usage: npm run generate-alerts [commande] [options]

Commandes disponibles:
  help                    - Afficher cette aide
  config                  - Afficher la configuration des seuils
  single <id> [niveau]    - Générer une alerte pour un capteur (défaut: MODERE)
  all [niveau]           - Générer des alertes pour tous les capteurs
  select <ids> [niveau]   - Générer des alertes pour des capteurs spécifiques
  pollution              - Simuler une crise de pollution
  canicule               - Simuler une canicule

Niveaux d'alerte:
  LEGER    - Légèrement au-dessus des seuils normaux
  MODERE   - Modérément élevé (défaut)
  CRITIQUE - Valeurs critiques/dangereuses

Exemples:
  npm run generate-alerts single 1 CRITIQUE
  npm run generate-alerts all MODERE
  npm run generate-alerts select 1,2,3 LEGER
  npm run generate-alerts pollution
        `);
        break;

      case "config":
        generator.displayThresholds();
        break;

      case "single":
        if (!args[1]) {
          console.error("❌ ID du capteur requis. Usage: single <id> [niveau]");
          process.exit(1);
        }
        const idCapteur = parseInt(args[1]);
        const niveau = (args[2] as "LEGER" | "MODERE" | "CRITIQUE") || "MODERE";
        await generator.generateSingleAlert(idCapteur, niveau);
        break;

      case "all":
        const niveauAll =
          (args[1] as "LEGER" | "MODERE" | "CRITIQUE") || "MODERE";
        await generator.generateAllAlerts(niveauAll);
        break;

      case "select":
        if (!args[1]) {
          console.error(
            "❌ IDs des capteurs requis. Usage: select <ids> [niveau]"
          );
          console.error("   Exemple: select 1,2,3 CRITIQUE");
          process.exit(1);
        }
        const capteurIds = args[1].split(",").map((id) => parseInt(id.trim()));
        const niveauSelect =
          (args[2] as "LEGER" | "MODERE" | "CRITIQUE") || "MODERE";
        await generator.generateSelectiveAlerts(capteurIds, niveauSelect);
        break;

      case "pollution":
        await generator.generatePollutionCrisis();
        break;

      case "canicule":
        await generator.generateHeatWave();
        break;

      default:
        console.log("🚨 Génération d'alertes de test par défaut...");
        await generator.generateAllAlerts("MODERE");
        break;
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

export { AlertDataGenerator };
