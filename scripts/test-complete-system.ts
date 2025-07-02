import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();
const SERVER_URL = "http://localhost:3000";

async function testCompleteSystem() {
  console.log("🔧 TEST COMPLET DU SYSTÈME SSE + SIMULATEUR");
  console.log("=".repeat(60));

  try {
    // 1. Vérifier la base de données
    console.log("\n📊 1. VÉRIFICATION BASE DE DONNÉES");
    const totalData = await prisma.donneeCapteur.count();
    console.log(`   Total données existantes: ${totalData}`);

    const latestData = await prisma.donneeCapteur.findFirst({
      orderBy: { idDonnee: "desc" },
      include: {
        capteur: {
          include: {
            typeCapteur: true,
          },
        },
      },
    });

    if (latestData) {
      console.log(`   Dernière donnée: ID ${latestData.idDonnee}`);
      console.log(
        `   Capteur: ${latestData.capteur.nom} (${latestData.capteur.typeCapteur.nom})`
      );
      console.log(`   Valeur: ${latestData.valeur} ${latestData.unite}`);
      console.log(`   Timestamp: ${latestData.timestamp.toISOString()}`);
    } else {
      console.log(
        "   ❌ Aucune donnée trouvée - le simulateur doit être démarré"
      );
    }

    // 2. Tester l'API simulateur
    console.log("\n🤖 2. TEST API SIMULATEUR");
    try {
      const simResponse = await fetch(`${SERVER_URL}/api/simulator`);
      if (simResponse.ok) {
        const simStatus = await simResponse.json();
        console.log(`   Statut: ${JSON.stringify(simStatus, null, 2)}`);

        if (!simStatus.data.isRunning) {
          console.log("   🚀 Démarrage du simulateur...");
          const startResponse = await fetch(`${SERVER_URL}/api/simulator`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "start" }),
          });

          if (startResponse.ok) {
            const startResult = await startResponse.json();
            console.log(`   ✅ Simulateur démarré: ${startResult.message}`);
          } else {
            console.log("   ❌ Erreur démarrage simulateur");
            return;
          }
        } else {
          console.log("   ✅ Simulateur déjà en marche");
        }
      } else {
        console.log("   ❌ API simulateur non accessible");
        return;
      }
    } catch (error) {
      console.log("   ❌ Erreur connexion API simulateur:", error);
      return;
    }

    // 3. Attendre que le simulateur génère des données
    console.log("\n⏰ 3. ATTENTE GÉNÉRATION DONNÉES (35 secondes)");
    console.log(
      "   Le simulateur de trafic génère des données toutes les 30 secondes..."
    );

    let countdown = 35;
    const countdownInterval = setInterval(() => {
      process.stdout.write(`\r   ${countdown}s restantes...`);
      countdown--;
    }, 1000);

    await new Promise((resolve) => setTimeout(resolve, 35000));
    clearInterval(countdownInterval);
    console.log("\r   ✅ Attente terminée                    ");

    // 4. Vérifier les nouvelles données
    console.log("\n📈 4. VÉRIFICATION NOUVELLES DONNÉES");
    const newTotalData = await prisma.donneeCapteur.count();
    const newDataCount = newTotalData - totalData;
    console.log(`   Nouvelles données générées: ${newDataCount}`);

    if (newDataCount > 0) {
      const recentData = await prisma.donneeCapteur.findMany({
        take: 3,
        orderBy: { idDonnee: "desc" },
        include: {
          capteur: {
            include: {
              typeCapteur: true,
            },
          },
        },
      });

      console.log("   📋 Dernières données générées:");
      recentData.forEach((data, index) => {
        console.log(
          `     ${index + 1}. Capteur ${data.capteur.nom}: ${data.valeur} ${
            data.unite
          }`
        );
        console.log(
          `        ID: ${
            data.idDonnee
          }, Timestamp: ${data.timestamp.toISOString()}`
        );
      });
    } else {
      console.log("   ❌ Aucune nouvelle donnée générée!");
      console.log("   Le simulateur ne fonctionne peut-être pas correctement");
    }

    // 5. Tester le statut SSE
    console.log("\n📡 5. TEST STATUT SSE");
    try {
      const sseResponse = await fetch(`${SERVER_URL}/api/sensors/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" }),
      });

      if (sseResponse.ok) {
        const sseStatus = await sseResponse.json();
        console.log(`   Statut SSE: ${JSON.stringify(sseStatus, null, 2)}`);
      } else {
        console.log("   ❌ Erreur API SSE");
      }
    } catch (error) {
      console.log("   ❌ Erreur connexion SSE:", error);
    }

    // 6. Test de broadcast manuel
    console.log("\n🚀 6. TEST BROADCAST MANUEL");
    try {
      const broadcastResponse = await fetch(
        `${SERVER_URL}/api/sensors/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "broadcast" }),
        }
      );

      if (broadcastResponse.ok) {
        const broadcastResult = await broadcastResponse.json();
        console.log(
          `   Résultat broadcast: ${JSON.stringify(broadcastResult, null, 2)}`
        );
      } else {
        console.log("   ❌ Erreur broadcast");
      }
    } catch (error) {
      console.log("   ❌ Erreur test broadcast:", error);
    }

    // 7. Ajouter une donnée de test et voir si elle est détectée
    console.log("\n🧪 7. TEST DÉTECTION NOUVELLE DONNÉE");

    if (latestData) {
      const testDataId = latestData.idDonnee + BigInt(999);
      const testData = await prisma.donneeCapteur.create({
        data: {
          idDonnee: testDataId,
          valeur: 99.99,
          timestamp: new Date(),
          unite: "TEST",
          validee: true,
          idCapteur: latestData.idCapteur,
        },
      });

      console.log(`   ✅ Donnée de test créée: ID ${testData.idDonnee}`);
      console.log("   ⏰ Attente 10 secondes pour la détection SSE...");

      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Vérifier le statut après
      try {
        const finalSSEResponse = await fetch(
          `${SERVER_URL}/api/sensors/stream`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "status" }),
          }
        );

        if (finalSSEResponse.ok) {
          const finalSSEStatus = await finalSSEResponse.json();
          console.log(
            `   📊 Statut SSE final: ${JSON.stringify(finalSSEStatus, null, 2)}`
          );
        }
      } catch (error) {
        console.log("   ❌ Erreur vérification finale SSE:", error);
      }

      // Nettoyer la donnée de test
      await prisma.donneeCapteur.delete({
        where: { idDonnee: testData.idDonnee },
      });
      console.log("   🧹 Donnée de test supprimée");
    }

    console.log("\n📋 RÉSUMÉ");
    console.log("=========");
    console.log(`✅ Données existantes: ${totalData}`);
    console.log(`✅ Nouvelles données générées: ${newDataCount}`);
    console.log("📊 Pour tester le SSE en temps réel:");
    console.log("   1. Ouvrez votre navigateur sur le dashboard");
    console.log("   2. Ouvrez les DevTools (F12)");
    console.log("   3. Regardez l'onglet Console pour les messages SSE");
    console.log("   4. Regardez l'onglet Network > EventSource pour le stream");

    if (newDataCount === 0) {
      console.log("\n⚠️  ATTENTION: Le simulateur ne génère pas de données!");
      console.log("   Vérifiez les logs du serveur pour les erreurs");
    }
  } catch (error) {
    console.error("❌ Erreur durant le test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testCompleteSystem().catch(console.error);
