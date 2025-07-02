import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();
const SERVER_URL = "http://localhost:3000";

async function forceSSETest() {
  console.log("⚡ TEST FORCE SSE - NOUVELLES DONNÉES");
  console.log("====================================\n");

  try {
    // 1. Obtenir l'état actuel
    console.log("📊 1. État initial...");
    const beforeData = await prisma.donneeCapteur.findFirst({
      orderBy: { idDonnee: "desc" },
      include: {
        capteur: {
          include: {
            typeCapteur: true,
          },
        },
      },
    });

    if (!beforeData) {
      console.log("❌ Aucune donnée trouvée, démarrez le simulateur !");
      return;
    }

    console.log(`   Dernière donnée existante: ID ${beforeData.idDonnee}`);
    console.log(
      `   Capteur: ${beforeData.capteur.nom} (${beforeData.capteur.typeCapteur.nom})`
    );
    console.log(`   Valeur: ${beforeData.valeur} ${beforeData.unite}`);

    // 2. Statut SSE avant
    console.log("\n🔍 2. Statut SSE avant...");
    try {
      const sseStatusBefore = await fetch(`${SERVER_URL}/api/sensors/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" }),
      });

      if (sseStatusBefore.ok) {
        const statusData = await sseStatusBefore.json();
        console.log(
          `   Clients connectés: ${statusData.data?.connectedClients || 0}`
        );
        console.log(
          `   Broadcast actif: ${statusData.data?.broadcastActive || false}`
        );
      }
    } catch (error) {
      console.log("   ❌ Serveur SSE non accessible");
      return;
    }

    // 3. Créer 3 nouvelles données de test
    console.log("\n🧪 3. Création de nouvelles données...");
    const newDataIds: bigint[] = [];

    for (let i = 1; i <= 3; i++) {
      const newId = beforeData.idDonnee + BigInt(i);
      const testValue = Math.round((Math.random() * 50 + 25) * 100) / 100; // Valeur entre 25-75

      const newData = await prisma.donneeCapteur.create({
        data: {
          idDonnee: newId,
          valeur: testValue,
          timestamp: new Date(),
          unite: beforeData.unite,
          validee: true,
          idCapteur: beforeData.idCapteur,
        },
      });

      newDataIds.push(newData.idDonnee);
      console.log(
        `   ✅ Donnée ${i} créée: ID ${newData.idDonnee}, valeur ${testValue} ${newData.unite}`
      );

      // Petite pause entre chaque création
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // 4. Déclencher un broadcast manuel
    console.log("\n🚀 4. Déclenchement broadcast manuel...");
    const broadcastResponse = await fetch(`${SERVER_URL}/api/sensors/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "broadcast" }),
    });

    if (broadcastResponse.ok) {
      const result = await broadcastResponse.json();
      console.log(`   ✅ Broadcast envoyé à ${result.clients} clients`);
    } else {
      console.log("   ❌ Erreur broadcast");
    }

    // 5. Attendre et vérifier la détection automatique
    console.log("\n⏰ 5. Attente détection automatique (15 secondes)...");
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // 6. Vérifier si les données ont été traitées
    console.log("\n📈 6. Vérification traitement...");
    const processedData = await prisma.donneeCapteur.findMany({
      where: {
        idDonnee: {
          in: newDataIds,
        },
      },
      orderBy: { idDonnee: "desc" },
    });

    console.log(
      `   ${processedData.length}/${newDataIds.length} données créées retrouvées`
    );

    // 7. Test final avec EventSource (simulation client)
    console.log("\n🌐 7. Test simulation client SSE...");
    console.log("   📝 Instructions pour test manuel:");
    console.log("   1. Ouvrez /dashboard/realtime dans votre navigateur");
    console.log("   2. Ouvrez DevTools > Console");
    console.log("   3. Cherchez les messages SSE avec les nouvelles données");
    console.log(
      `   4. Vérifiez les IDs: ${newDataIds
        .map((id) => id.toString())
        .join(", ")}`
    );

    // 8. Nettoyage
    console.log("\n🧹 8. Nettoyage des données de test...");
    const deleteResult = await prisma.donneeCapteur.deleteMany({
      where: {
        idDonnee: {
          in: newDataIds,
        },
      },
    });

    console.log(`   ✅ ${deleteResult.count} données de test supprimées`);

    console.log("\n🎯 RÉSUMÉ DES CORRECTIONS:");
    console.log("========================");
    console.log(
      "✅ Service d'alertes rendu non-bloquant dans sendSensorUpdate"
    );
    console.log("✅ globalLastSentId initialisé avec marge de sécurité (-50)");
    console.log("✅ Polling notifications ralenti (2min/5min)");
    console.log("✅ Cache ajouté sur API notifications");
    console.log("\n💡 Si les données n'apparaissent toujours pas:");
    console.log("   → Vérifiez la console du navigateur pour les erreurs SSE");
    console.log("   → Regardez l'onglet Network > EventSource dans DevTools");
  } catch (error) {
    console.error("❌ Erreur test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

forceSSETest().catch(console.error);
