#!/usr/bin/env tsx

import fetch from "node-fetch";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";

console.log("🧪 Test de l'API SSE - Tech City IoT");
console.log("=".repeat(50));

// Test du statut SSE
async function testSSEStatus() {
  console.log("\n📊 Test du statut SSE...");
  try {
    const response = await fetch(`${SERVER_URL}/api/sensors/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status" }),
    });

    const data = await response.json();
    console.log("✅ Statut SSE:", data);
  } catch (error) {
    console.error("❌ Erreur test statut:", error);
  }
}

// Test de broadcast manuel
async function testBroadcast() {
  console.log("\n📡 Test du broadcast manuel...");
  try {
    const response = await fetch(`${SERVER_URL}/api/sensors/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "broadcast" }),
    });

    const data = await response.json();
    console.log("✅ Broadcast déclenché:", data);
  } catch (error) {
    console.error("❌ Erreur test broadcast:", error);
  }
}

// Test d'update de capteur spécifique
async function testSensorUpdate(capteurId: number) {
  console.log(`\n🔄 Test update capteur ${capteurId}...`);
  try {
    const response = await fetch(`${SERVER_URL}/api/sensors/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sensor-update", capteurId }),
    });

    const data = await response.json();
    console.log(`✅ Update capteur ${capteurId}:`, data);
  } catch (error) {
    console.error(`❌ Erreur update capteur ${capteurId}:`, error);
  }
}

// Test de connexion SSE (simulée avec fetch)
async function testSSEConnection() {
  console.log("\n🔗 Test de connexion SSE...");
  try {
    console.log("⚠️  Note: Ce test simule une connexion SSE via fetch");
    console.log("   Pour un vrai test, utilisez un navigateur ou EventSource");

    const controller = new AbortController();

    // Limiter le test à 10 secondes
    setTimeout(() => {
      controller.abort();
      console.log("⏰ Test SSE terminé (timeout)");
    }, 10000);

    const response = await fetch(`${SERVER_URL}/api/sensors/stream`, {
      signal: controller.signal,
      headers: {
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });

    if (response.ok) {
      console.log("✅ Connexion SSE établie");
      console.log("📊 Headers de réponse:");
      response.headers.forEach((value: string, key: string) => {
        console.log(`   ${key}: ${value}`);
      });
    } else {
      console.error(
        "❌ Erreur connexion SSE:",
        response.status,
        response.statusText
      );
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("✅ Test SSE interrompu comme prévu");
    } else {
      console.error("❌ Erreur test connexion SSE:", error);
    }
  }
}

// Test du simulateur de capteurs
async function testSimulatorStatus() {
  console.log("\n🤖 Test du statut du simulateur...");
  try {
    const response = await fetch(`${SERVER_URL}/api/simulator`);
    const data = await response.json();
    console.log("✅ Statut simulateur:", data);
  } catch (error) {
    console.error("❌ Erreur test simulateur:", error);
  }
}

// Script principal
async function main() {
  try {
    await testSSEStatus();
    await testSimulatorStatus();
    await testBroadcast();

    // Test des updates pour chaque capteur
    for (let i = 1; i <= 6; i++) {
      await testSensorUpdate(i);
    }

    await testSSEConnection();

    console.log("\n🎉 Tous les tests terminés !");
    console.log("\n💡 Pour tester SSE en vraie condition:");
    console.log("   1. Démarrez votre serveur Next.js (npm run dev)");
    console.log("   2. Allez sur http://localhost:3000/dashboard/realtime");
    console.log("   3. Démarrez le simulateur (npm run simulator)");
    console.log("   4. Observez les données en temps réel");
  } catch (error) {
    console.error("💥 Erreur générale:", error);
    process.exit(1);
  }
}

// Arguments de ligne de commande
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage: tsx scripts/test-sse.ts [options]

Options:
  --help, -h     Afficher cette aide
  
Variables d'environnement:
  SERVER_URL     URL du serveur (défaut: http://localhost:3000)

Exemples:
  tsx scripts/test-sse.ts
  SERVER_URL=http://localhost:3001 tsx scripts/test-sse.ts
  `);
  process.exit(0);
}

main();
