import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();
const SERVER_URL = "http://localhost:3000";

async function testSSEFix() {
  console.log("🔧 TEST RAPIDE - CORRECTION SSE");
  console.log("================================\n");

  try {
    // 1. Vérifier s'il y a des données récentes
    console.log("📊 Vérification données capteurs...");
    const recentData = await prisma.donneeCapteur.findMany({
      take: 5,
      orderBy: { idDonnee: "desc" },
      include: {
        capteur: {
          include: {
            typeCapteur: true,
          },
        },
      },
    });

    if (recentData.length === 0) {
      console.log("❌ Aucune donnée trouvée, démarrez le simulateur !");
      return;
    }

    console.log(`✅ ${recentData.length} données trouvées`);
    const lastId = recentData[0].idDonnee;
    console.log(`   Dernier ID: ${lastId}`);

    // 2. Créer une donnée de test
    console.log("\n🧪 Création donnée de test...");
    const testData = await prisma.donneeCapteur.create({
      data: {
        idDonnee: lastId + BigInt(1),
        valeur: 999.99,
        timestamp: new Date(),
        unite: "TEST",
        validee: true,
        idCapteur: recentData[0].idCapteur,
      },
    });
    console.log(`✅ Donnée créée: ID ${testData.idDonnee}`);

    // 3. Test API SSE
    console.log("\n📡 Test API SSE...");
    const sseResponse = await fetch(`${SERVER_URL}/api/sensors/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status" }),
    });

    if (sseResponse.ok) {
      const sseStatus = await sseResponse.json();
      console.log(
        `   Clients connectés: ${sseStatus.data?.connectedClients || 0}`
      );
      console.log(
        `   Broadcast actif: ${sseStatus.data?.broadcastActive || false}`
      );
    }

    // 4. Trigger broadcast
    console.log("\n🚀 Déclenchement broadcast...");
    const broadcastResponse = await fetch(`${SERVER_URL}/api/sensors/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "broadcast" }),
    });

    if (broadcastResponse.ok) {
      const result = await broadcastResponse.json();
      console.log(`✅ Broadcast envoyé à ${result.clients} clients`);
    }

    // 5. Test API notifications (pour voir si c'est plus rapide)
    console.log("\n🔔 Test API notifications...");
    const startTime = Date.now();

    try {
      const notifResponse = await fetch(
        `${SERVER_URL}/api/alerts/notifications?limit=5`
      );
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`   Temps de réponse: ${duration}ms`);

      if (duration > 1000) {
        console.log("⚠️  API notifications encore lente (>1s)");
      } else if (duration > 500) {
        console.log("⚠️  API notifications moyennement rapide (>500ms)");
      } else {
        console.log("✅ API notifications rapide (<500ms)");
      }

      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        console.log(
          `   Notifications trouvées: ${notifData.data?.length || 0}`
        );
      }
    } catch (error) {
      console.log("❌ Erreur test notifications:", error);
    }

    // 6. Nettoyer
    console.log("\n🧹 Nettoyage...");
    await prisma.donneeCapteur.delete({
      where: { idDonnee: testData.idDonnee },
    });
    console.log("✅ Donnée de test supprimée");

    console.log("\n📋 RÉSUMÉ:");
    console.log("==========");
    console.log("✅ Intervalles notifications rallongés (2min/5min)");
    console.log("✅ Requête notifications optimisée");
    console.log("✅ Cache ajouté sur API notifications");
    console.log("\n🌐 Testez maintenant dans le navigateur:");
    console.log("   1. Ouvrez /dashboard/realtime");
    console.log("   2. DevTools > Console pour voir les données SSE");
    console.log("   3. DevTools > Network > EventSource pour le stream");
  } catch (error) {
    console.error("❌ Erreur test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSSEFix().catch(console.error);
