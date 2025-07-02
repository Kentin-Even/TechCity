import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();
const SERVER_URL = "http://localhost:3000";

async function testGlobalSSE() {
  console.log("🧪 TEST DU SSE GLOBAL");
  console.log("====================\n");

  try {
    // 1. Vérifier le statut SSE
    console.log("📡 Vérification du statut SSE...");
    const statusResponse = await fetch(`${SERVER_URL}/api/sensors/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status" }),
    });

    if (!statusResponse.ok) {
      console.error("❌ Impossible de contacter le serveur SSE");
      console.log(
        "   Assurez-vous que le serveur est démarré avec 'npm run dev'"
      );
      return;
    }

    const status = await statusResponse.json();
    console.log("✅ Statut SSE:", JSON.stringify(status.data, null, 2));

    if (status.data.connectedClients === 0) {
      console.log("\n⚠️  AUCUN CLIENT CONNECTÉ");
      console.log(
        "   Ouvrez l'application dans votre navigateur pour activer la connexion SSE globale"
      );
      console.log("   URL: http://localhost:3000");
      return;
    }

    console.log(`\n✅ ${status.data.connectedClients} client(s) connecté(s)`);
    console.log("   La connexion SSE globale est active!");

    // 2. Créer une donnée de test avec une valeur élevée pour déclencher une alerte
    console.log("\n📝 Création d'une donnée de test avec valeur élevée...");

    // Récupérer le dernier ID
    const lastData = await prisma.donneeCapteur.findFirst({
      orderBy: { idDonnee: "desc" },
    });

    // Créer une donnée avec une température très élevée (devrait déclencher une alerte)
    const testData = await prisma.donneeCapteur.create({
      data: {
        idDonnee: (lastData?.idDonnee || BigInt(0)) + BigInt(1),
        valeur: 93,
        timestamp: new Date(),
        unite: "%",
        validee: true,
        idCapteur: 4, // Capteur température
      },
    });

    console.log(
      `✅ Donnée créée: Capteur ${testData.idCapteur}, Valeur: ${testData.valeur}${testData.unite}`
    );
    console.log(
      "   Cette valeur élevée devrait déclencher une alerte si des seuils sont configurés"
    );

    // 3. Attendre un peu pour voir si l'alerte est créée
    console.log("\n⏰ Attente de 5 secondes pour la création d'alertes...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 4. Vérifier les alertes récentes
    console.log("\n🔍 Vérification des alertes récentes...");
    const recentAlerts = await prisma.alerte.findMany({
      where: {
        dateCreation: {
          gte: new Date(Date.now() - 60000), // Dernière minute
        },
      },
      include: {
        capteur: {
          include: {
            typeCapteur: true,
            quartier: true,
          },
        },
      },
      orderBy: { dateCreation: "desc" },
      take: 5,
    });

    if (recentAlerts.length > 0) {
      console.log(`✅ ${recentAlerts.length} alerte(s) récente(s) trouvée(s):`);
      recentAlerts.forEach((alerte, idx) => {
        console.log(`\n   ${idx + 1}. Alerte #${alerte.idAlerte}`);
        console.log(`      Type: ${alerte.type}`);
        console.log(`      Gravité: ${alerte.niveauGravite}`);
        console.log(`      Capteur: ${alerte.capteur.nom}`);
        console.log(`      Valeur mesurée: ${alerte.valeurMesuree}`);
        console.log(`      Seuil déclenché: ${alerte.seuilDeclenche}`);
        console.log(`      Message: ${alerte.message}`);
      });
    } else {
      console.log("ℹ️  Aucune alerte récente trouvée");
      console.log("   Cela peut être normal si :");
      console.log("   - Aucun seuil personnalisé n'est configuré");
      console.log("   - Les utilisateurs ne sont pas abonnés au quartier");
      console.log("   - Les seuils ne sont pas dépassés");
    }

    // 5. Résumé final
    console.log("\n📊 RÉSUMÉ DU TEST:");
    console.log(
      `   ✅ SSE Global: ${
        status.data.connectedClients > 0 ? "ACTIF" : "INACTIF"
      }`
    );
    console.log(`   ✅ Clients connectés: ${status.data.connectedClients}`);
    console.log(`   ✅ Données générées: OUI`);
    console.log(
      `   ✅ Alertes créées: ${
        recentAlerts.length > 0 ? "OUI" : "NON (vérifier seuils)"
      }`
    );
  } catch (error) {
    console.error("\n❌ Erreur lors du test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer le test
testGlobalSSE().catch(console.error);
