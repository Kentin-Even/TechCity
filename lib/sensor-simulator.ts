import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

// Types pour les données de capteurs
interface SensorData {
  idCapteur: number;
  valeur: number;
  timestamp: Date;
  unite: string;
  validee: boolean;
}

// Configuration des capteurs
const SENSOR_CONFIGS = {
  AIR_QUALITY: {
    interval: 5 * 60 * 1000, // 5 minutes
    sensors: [
      { idCapteur: 1, unite: "μg/m³", type: "PM2.5" },
      { idCapteur: 2, unite: "ppm", type: "CO2" },
    ],
  },
  TEMPERATURE_HUMIDITY: {
    interval: 10 * 60 * 1000, // 10 minutes
    sensors: [
      { idCapteur: 3, unite: "°C", type: "Temperature" },
      { idCapteur: 4, unite: "%", type: "Humidity" },
    ],
  },
  SOUND_LEVEL: {
    interval: 2 * 60 * 1000, // 2 minutes
    sensors: [{ idCapteur: 5, unite: "dB", type: "Sound" }],
  },
  TRAFFIC: {
    interval: 30 * 1000, // 30 secondes
    sensors: [{ idCapteur: 6, unite: "vehicles/min", type: "Traffic" }],
  },
};

class SensorSimulator {
  private intervals: NodeJS.Timeout[] = [];
  private isRunning = false;

  // Générateurs de données réalistes
  private generateAirQualityData(): { pm25: number; co2: number } {
    // Simulation basée sur des cycles journaliers et conditions réelles
    const hour = new Date().getHours();
    const baseVariation = Math.sin((hour / 24) * 2 * Math.PI);

    // PM2.5: valeurs typiques entre 5-50 μg/m³
    const pm25Base = 15 + baseVariation * 10;
    const pm25Noise = (Math.random() - 0.5) * 8;
    const pm25 = Math.max(0, pm25Base + pm25Noise);

    // CO2: valeurs typiques entre 400-1000 ppm
    const co2Base = 450 + baseVariation * 200;
    const co2Noise = (Math.random() - 0.5) * 100;
    const co2 = Math.max(300, co2Base + co2Noise);

    return { pm25: Number(pm25.toFixed(2)), co2: Number(co2.toFixed(0)) };
  }

  private generateTemperatureHumidityData(): {
    temperature: number;
    humidity: number;
  } {
    const hour = new Date().getHours();
    const season = Math.sin(((new Date().getMonth() + 1) / 12) * 2 * Math.PI);

    // Température: cycle journalier + saisonnier
    const tempBase = 20 + season * 10 + Math.sin((hour / 24) * 2 * Math.PI) * 8;
    const tempNoise = (Math.random() - 0.5) * 4;
    const temperature = tempBase + tempNoise;

    // Humidité: inversement corrélée à la température
    const humidityBase = 60 - (temperature - 20) * 2;
    const humidityNoise = (Math.random() - 0.5) * 20;
    const humidity = Math.max(20, Math.min(95, humidityBase + humidityNoise));

    return {
      temperature: Number(temperature.toFixed(1)),
      humidity: Number(humidity.toFixed(1)),
    };
  }

  private generateSoundLevelData(): number {
    const hour = new Date().getHours();

    // Niveau sonore varie selon l'heure (plus élevé pendant la journée)
    let baseLevel = 45; // Niveau de base en dB

    if (hour >= 7 && hour <= 22) {
      baseLevel = 55 + Math.sin(((hour - 12) / 12) * Math.PI) * 15;
    }

    const noise = (Math.random() - 0.5) * 20;
    const soundLevel = Math.max(30, Math.min(85, baseLevel + noise));

    return Number(soundLevel.toFixed(1));
  }

  private generateTrafficData(): number {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    // Trafic plus élevé en semaine et aux heures de pointe
    let baseTraffic = 5; // Véhicules/minute de base

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Lundi à Vendredi
      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        baseTraffic = 25; // Heures de pointe
      } else if (hour >= 10 && hour <= 16) {
        baseTraffic = 15; // Jour
      }
    } else {
      // Weekend
      if (hour >= 10 && hour <= 20) {
        baseTraffic = 12;
      }
    }

    const noise = (Math.random() - 0.5) * 10;
    const traffic = Math.max(0, baseTraffic + noise);

    return Number(traffic.toFixed(0));
  }

  private async saveSensorData(data: SensorData): Promise<void> {
    try {
      await prisma.donneeCapteur.create({
        data: {
          idDonnee: BigInt(Date.now() + Math.floor(Math.random() * 1000)),
          valeur: data.valeur,
          timestamp: data.timestamp,
          unite: data.unite,
          validee: data.validee,
          idCapteur: data.idCapteur,
        },
      });

      console.log(
        `💾 Données sauvegardées - Capteur ${data.idCapteur}: ${data.valeur} ${data.unite}`
      );
    } catch (error) {
      console.error(`❌ Erreur sauvegarde capteur ${data.idCapteur}:`, error);
    }
  }

  private startAirQualitySimulation(): void {
    const simulate = async () => {
      const { pm25, co2 } = this.generateAirQualityData();
      const timestamp = new Date();

      await Promise.all([
        this.saveSensorData({
          idCapteur: 1,
          valeur: pm25,
          timestamp,
          unite: "μg/m³",
          validee: true,
        }),
        this.saveSensorData({
          idCapteur: 2,
          valeur: co2,
          timestamp,
          unite: "ppm",
          validee: true,
        }),
      ]);
    };

    // Première exécution immédiate
    simulate();

    // Puis toutes les 5 minutes
    const interval = setInterval(simulate, SENSOR_CONFIGS.AIR_QUALITY.interval);
    this.intervals.push(interval);
  }

  private startTemperatureHumiditySimulation(): void {
    const simulate = async () => {
      const { temperature, humidity } = this.generateTemperatureHumidityData();
      const timestamp = new Date();

      await Promise.all([
        this.saveSensorData({
          idCapteur: 3,
          valeur: temperature,
          timestamp,
          unite: "°C",
          validee: true,
        }),
        this.saveSensorData({
          idCapteur: 4,
          valeur: humidity,
          timestamp,
          unite: "%",
          validee: true,
        }),
      ]);
    };

    simulate();
    const interval = setInterval(
      simulate,
      SENSOR_CONFIGS.TEMPERATURE_HUMIDITY.interval
    );
    this.intervals.push(interval);
  }

  private startSoundLevelSimulation(): void {
    const simulate = async () => {
      const soundLevel = this.generateSoundLevelData();

      await this.saveSensorData({
        idCapteur: 5,
        valeur: soundLevel,
        timestamp: new Date(),
        unite: "dB",
        validee: true,
      });
    };

    simulate();
    const interval = setInterval(simulate, SENSOR_CONFIGS.SOUND_LEVEL.interval);
    this.intervals.push(interval);
  }

  private startTrafficSimulation(): void {
    const simulate = async () => {
      const traffic = this.generateTrafficData();

      await this.saveSensorData({
        idCapteur: 6,
        valeur: traffic,
        timestamp: new Date(),
        unite: "vehicles/min",
        validee: true,
      });
    };

    simulate();
    const interval = setInterval(simulate, SENSOR_CONFIGS.TRAFFIC.interval);
    this.intervals.push(interval);
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️  Le simulateur est déjà en cours d'exécution");
      return;
    }

    console.log("🚀 Démarrage du simulateur de capteurs IoT...");

    try {
      // Vérifier la connexion à la base de données
      await prisma.$connect();
      console.log("✅ Connexion à la base de données établie");

      this.isRunning = true;

      // Démarrer tous les simulateurs
      this.startAirQualitySimulation();
      this.startTemperatureHumiditySimulation();
      this.startSoundLevelSimulation();
      this.startTrafficSimulation();

      console.log("📊 Tous les simulateurs de capteurs sont actifs:");
      console.log(
        "   🌬️  Qualité de l'air (PM2.5, CO2) - toutes les 5 minutes"
      );
      console.log("   🌡️  Température/Humidité - toutes les 10 minutes");
      console.log("   🔊 Niveau sonore - toutes les 2 minutes");
      console.log("   🚗 Circulation - toutes les 30 secondes");
    } catch (error) {
      console.error("❌ Erreur lors du démarrage du simulateur:", error);
      throw error;
    }
  }

  public stop(): void {
    if (!this.isRunning) {
      console.log("⚠️  Le simulateur n'est pas en cours d'exécution");
      return;
    }

    console.log("🛑 Arrêt du simulateur de capteurs IoT...");

    // Arrêter tous les intervalles
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals = [];

    this.isRunning = false;

    // Fermer la connexion Prisma
    prisma.$disconnect();

    console.log("✅ Simulateur arrêté avec succès");
  }

  public getStatus(): { isRunning: boolean; activeSimulators: number } {
    return {
      isRunning: this.isRunning,
      activeSimulators: this.intervals.length,
    };
  }
}

// Instance singleton du simulateur
export const sensorSimulator = new SensorSimulator();

// Gestion propre de l'arrêt du processus
process.on("SIGINT", () => {
  console.log("\n🔄 Réception du signal d'arrêt...");
  sensorSimulator.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🔄 Réception du signal de terminaison...");
  sensorSimulator.stop();
  process.exit(0);
});
