import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function seedSensors() {
  console.log("🌱 Initialisation des capteurs IoT...");

  try {
    // Créer un quartier test si nécessaire
    const quartier = await prisma.quartier.upsert({
      where: { idQuartier: 1 },
      update: {},
      create: {
        idQuartier: 1,
        nom: "Centre-Ville Tech City",
        longitude: 2.3522,
        latitude: 48.8566,
        superficie: 5.2,
      },
    });

    // Créer les types de capteurs
    const typesCapteurs = [
      {
        idTypeCapteur: 1,
        nom: "PM2.5",
        unite: "μg/m³",
        seuilMin: 0,
        seuilMax: 100,
        plageMin: 0,
        plageMax: 500,
      },
      {
        idTypeCapteur: 2,
        nom: "CO2",
        unite: "ppm",
        seuilMin: 300,
        seuilMax: 1000,
        plageMin: 300,
        plageMax: 5000,
      },
      {
        idTypeCapteur: 3,
        nom: "Temperature",
        unite: "°C",
        seuilMin: -20,
        seuilMax: 50,
        plageMin: -40,
        plageMax: 60,
      },
      {
        idTypeCapteur: 4,
        nom: "Humidity",
        unite: "%",
        seuilMin: 20,
        seuilMax: 80,
        plageMin: 0,
        plageMax: 100,
      },
      {
        idTypeCapteur: 5,
        nom: "Sound",
        unite: "dB",
        seuilMin: 30,
        seuilMax: 70,
        plageMin: 20,
        plageMax: 120,
      },
      {
        idTypeCapteur: 6,
        nom: "Traffic",
        unite: "vehicles/min",
        seuilMin: 0,
        seuilMax: 50,
        plageMin: 0,
        plageMax: 100,
      },
    ];

    console.log("📊 Création des types de capteurs...");
    for (const type of typesCapteurs) {
      await prisma.typeCapteur.upsert({
        where: { idTypeCapteur: type.idTypeCapteur },
        update: {
          nom: type.nom,
          unite: type.unite,
          seuilMin: type.seuilMin,
          seuilMax: type.seuilMax,
          plageMin: type.plageMin,
          plageMax: type.plageMax,
          updatedAt: new Date(),
        },
        create: {
          ...type,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`   ✅ Type de capteur: ${type.nom} (${type.unite})`);
    }

    // Créer les capteurs
    const capteurs = [
      {
        idCapteur: 1,
        nom: "Capteur PM2.5 Centre-Ville",
        description: "Mesure des particules fines PM2.5 dans l'air",
        longitude: 2.3522,
        latitude: 48.8566,
        adresseInstallation: "Place de la République, Tech City",
        dateInstallation: new Date("2024-01-15"),
        statut: "ACTIF" as const,
        modele: "AirQuality-Pro-2.5",
        fabricant: "EcoSense",
        numeroSerie: "AQ-PM25-001",
        versionFirmware: "2.1.4",
        derniereMaintenance: new Date("2024-11-01"),
        frequenceCapture: 5, // minutes
        idTypeCapteur: 1,
        idQuartier: 1,
      },
      {
        idCapteur: 2,
        nom: "Capteur CO2 Centre-Ville",
        description: "Mesure du niveau de CO2 dans l'air",
        longitude: 2.3525,
        latitude: 48.8568,
        adresseInstallation: "Avenue des Champs-Élysées, Tech City",
        dateInstallation: new Date("2024-01-15"),
        statut: "ACTIF" as const,
        modele: "AirQuality-Pro-CO2",
        fabricant: "EcoSense",
        numeroSerie: "AQ-CO2-001",
        versionFirmware: "2.1.4",
        derniereMaintenance: new Date("2024-11-01"),
        frequenceCapture: 5, // minutes
        idTypeCapteur: 2,
        idQuartier: 1,
      },
      {
        idCapteur: 3,
        nom: "Capteur Température Centre-Ville",
        description: "Mesure de la température ambiante",
        longitude: 2.3518,
        latitude: 48.8562,
        adresseInstallation: "Rue de Rivoli, Tech City",
        dateInstallation: new Date("2024-01-20"),
        statut: "ACTIF" as const,
        modele: "WeatherSense-Temp",
        fabricant: "ClimateTech",
        numeroSerie: "WT-TEMP-001",
        versionFirmware: "1.8.2",
        derniereMaintenance: new Date("2024-10-15"),
        frequenceCapture: 10, // minutes
        idTypeCapteur: 3,
        idQuartier: 1,
      },
      {
        idCapteur: 4,
        nom: "Capteur Humidité Centre-Ville",
        description: "Mesure du niveau d'humidité dans l'air",
        longitude: 2.352,
        latitude: 48.8564,
        adresseInstallation: "Boulevard Saint-Germain, Tech City",
        dateInstallation: new Date("2024-01-20"),
        statut: "ACTIF" as const,
        modele: "WeatherSense-Humidity",
        fabricant: "ClimateTech",
        numeroSerie: "WT-HUM-001",
        versionFirmware: "1.8.2",
        derniereMaintenance: new Date("2024-10-15"),
        frequenceCapture: 10, // minutes
        idTypeCapteur: 4,
        idQuartier: 1,
      },
      {
        idCapteur: 5,
        nom: "Capteur Niveau Sonore Centre-Ville",
        description: "Mesure du niveau de bruit ambiant",
        longitude: 2.3515,
        latitude: 48.857,
        adresseInstallation: "Place Vendôme, Tech City",
        dateInstallation: new Date("2024-02-01"),
        statut: "ACTIF" as const,
        modele: "SoundMonitor-dB",
        fabricant: "AcousticSense",
        numeroSerie: "SM-DB-001",
        versionFirmware: "3.2.1",
        derniereMaintenance: new Date("2024-11-10"),
        frequenceCapture: 2, // minutes
        idTypeCapteur: 5,
        idQuartier: 1,
      },
      {
        idCapteur: 6,
        nom: "Capteur Circulation Centre-Ville",
        description: "Comptage et analyse du trafic routier",
        longitude: 2.3528,
        latitude: 48.8572,
        adresseInstallation: "Carrefour Opéra, Tech City",
        dateInstallation: new Date("2024-02-10"),
        statut: "ACTIF" as const,
        modele: "TrafficCounter-AI",
        fabricant: "SmartTraffic",
        numeroSerie: "TC-AI-001",
        versionFirmware: "4.1.0",
        derniereMaintenance: new Date("2024-11-05"),
        frequenceCapture: 0.5, // 30 secondes
        idTypeCapteur: 6,
        idQuartier: 1,
      },
    ];

    console.log("🔧 Création des capteurs...");
    for (const capteur of capteurs) {
      await prisma.capteur.upsert({
        where: { idCapteur: capteur.idCapteur },
        update: {
          nom: capteur.nom,
          description: capteur.description,
          longitude: capteur.longitude,
          latitude: capteur.latitude,
          adresseInstallation: capteur.adresseInstallation,
          statut: capteur.statut,
          modele: capteur.modele,
          fabricant: capteur.fabricant,
          versionFirmware: capteur.versionFirmware,
          derniereMaintenance: capteur.derniereMaintenance,
          frequenceCapture: capteur.frequenceCapture,
          updatedAt: new Date(),
        },
        create: {
          ...capteur,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`   ✅ Capteur: ${capteur.nom}`);
    }

    console.log("\n🎉 Initialisation des capteurs terminée avec succès !");
    console.log(`📍 Quartier: ${quartier.nom}`);
    console.log(`📊 ${typesCapteurs.length} types de capteurs créés`);
    console.log(`🔧 ${capteurs.length} capteurs configurés`);

    console.log("\n📋 Résumé des capteurs:");
    console.log("   🌬️  Qualité de l'air: PM2.5 + CO2 (toutes les 5 min)");
    console.log("   🌡️  Météo: Température + Humidité (toutes les 10 min)");
    console.log("   🔊 Acoustique: Niveau sonore (toutes les 2 min)");
    console.log("   🚗 Trafic: Circulation (toutes les 30 sec)");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSensors()
    .then(() => {
      console.log("✅ Script d'initialisation terminé");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Échec du script d'initialisation:", error);
      process.exit(1);
    });
}

export default seedSensors;
