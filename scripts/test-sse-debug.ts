import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();
const SERVER_URL = "http://localhost:3000";

async function debugSSE() {
  console.log("🔍 DIAGNOSTIC SSE");
  console.log("=================\n");

  try {
    // 1. Vérifier les dernières données de capteurs
    console.log("📊 DERNIÈRES DONNÉES DE CAPTEURS:");
    const latestData = await prisma.donneeCapteur.findMany({
      take: 5,
      orderBy: { idDonnee: "desc" },
      include: {
        capteur: {
          include: {
            typeCapteur: true,
            quartier: true,
          },
        },
      },
    });

    if (latestData.length === 0) {
      console.log("❌ AUCUNE DONNÉE TROUVÉE");
      console.log("   Le simulateur doit être démarré!");
      return;
    }

    latestData.forEach((donnee, index) => {
      console.log(`  ${index + 1}. ID: ${donnee.idDonnee.toString()}`);
      console.log(
        `     Capteur: ${donnee.capteur.nom} (${donnee.capteur.typeCapteur.nom})`
      );
      console.log(`     Valeur: ${donnee.valeur} ${donnee.unite}`);
      console.log(`     Timestamp: ${donnee.timestamp.toISOString()}`);
      console.log(`     Quartier: ${donnee.capteur.quartier.nom}`);
      console.log();
    });

    const maxId = latestData[0].idDonnee;
    console.log(`🔢 Dernier ID: ${maxId.toString()}`);

    // 2. Tester le statut SSE
    console.log("📡 TEST STATUT SSE:");
    try {
      const response = await fetch(`${SERVER_URL}/api/sensors/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" }),
      });

      if (response.ok) {
        const status = await response.json();
        console.log("✅ Statut SSE:", JSON.stringify(status, null, 2));
      } else {
        console.log("❌ Erreur statut SSE:", response.status);
      }
    } catch (error) {
      console.log("❌ Impossible de contacter le serveur SSE:", error);
      console.log(
        "   Assurez-vous que le serveur est démarré sur le port 3000"
      );
      return;
    }

    // 3. Tester un broadcast manuel
    console.log("\n🚀 TEST BROADCAST MANUEL:");
    try {
      const response = await fetch(`${SERVER_URL}/api/sensors/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "broadcast" }),
      });

      const result = await response.json();
      console.log("📡 Résultat broadcast:", JSON.stringify(result, null, 2));
    } catch (error) {
      console.log("❌ Erreur broadcast:", error);
    }

    // 4. Créer une nouvelle donnée de test
    console.log("\n📝 CRÉATION D'UNE DONNÉE DE TEST:");
    const testData = await prisma.donneeCapteur.create({
      data: {
        idDonnee: maxId + BigInt(1),
        valeur: Math.random() * 100,
        timestamp: new Date(),
        unite: "TEST",
        validee: true,
        idCapteur: latestData[0].idCapteur,
      },
    });

    console.log(
      `✅ Nouvelle donnée créée avec ID: ${testData.idDonnee.toString()}`
    );
    console.log(`   Valeur: ${testData.valeur} ${testData.unite}`);

    // 5. Attendre et tester si la nouvelle donnée est détectée
    console.log("\n⏰ ATTENTE DE DÉTECTION (10 secondes)...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    console.log("\n🔍 VÉRIFICATION DE LA DÉTECTION:");
    try {
      const statusResponse = await fetch(`${SERVER_URL}/api/sensors/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" }),
      });

      const finalStatus = await statusResponse.json();
      console.log("📊 Statut final:", JSON.stringify(finalStatus, null, 2));
    } catch (error) {
      console.log("❌ Erreur vérification finale:", error);
    }
  } catch (error) {
    console.error("❌ Erreur diagnostic:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le diagnostic
debugSSE().catch(console.error);
