#!/usr/bin/env tsx

import { sensorSimulator } from "../lib/sensor-simulator";

async function main() {
  console.log("🏗️  Démarrage du simulateur de capteurs IoT Tech City");
  console.log("=".repeat(50));

  try {
    await sensorSimulator.start();

    console.log("\n✨ Simulateur démarré avec succès !");
    console.log("💡 Appuyez sur Ctrl+C pour arrêter le simulateur");

    // Garder le processus en vie
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", () => {
      // On ne fait rien, juste garder le processus vivant
    });
  } catch (error) {
    console.error("💥 Erreur lors du démarrage:", error);
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on("unhandledRejection", (reason) => {
  console.error("❌ Promesse rejetée non gérée:", reason);
  sensorSimulator.stop();
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Exception non capturée:", error);
  sensorSimulator.stop();
  process.exit(1);
});

main();
