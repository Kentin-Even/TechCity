import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function testSubscriptionSystem() {
  console.log("🧪 Test du système d'abonnement aux quartiers\n");

  try {
    // 1. Récupérer les informations de base
    console.log("1️⃣ Récupération des quartiers et utilisateurs...");

    const quartiers = await prisma.quartier.findMany({
      select: {
        idQuartier: true,
        nom: true,
        _count: {
          select: {
            capteurs: true,
          },
        },
      },
    });

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
      take: 3,
    });

    console.log(`   📍 ${quartiers.length} quartiers trouvés`);
    console.log(`   👥 ${users.length} utilisateurs trouvés`);

    if (quartiers.length === 0 || users.length === 0) {
      console.log("❌ Pas assez de données pour tester");
      return;
    }

    console.log("\n2️⃣ Quartiers disponibles :");
    quartiers.forEach((q) => {
      console.log(
        `   - ${q.nom} (ID: ${q.idQuartier}) - ${q._count.capteurs} capteurs`
      );
    });

    console.log("\n3️⃣ Utilisateurs :");
    users.forEach((u) => {
      console.log(`   - ${u.name || u.email} (ID: ${u.id})`);
    });

    // 2. Vérifier les abonnements existants
    console.log("\n4️⃣ Abonnements existants :");
    const abonnements = await prisma.abonnementQuartier.findMany({
      include: {
        quartier: { select: { nom: true } },
        utilisateur: { select: { email: true, name: true } },
      },
    });

    if (abonnements.length === 0) {
      console.log("   Aucun abonnement trouvé");
    } else {
      abonnements.forEach((ab) => {
        const userName = ab.utilisateur.name || ab.utilisateur.email;
        const status = ab.actif ? "✅ Actif" : "❌ Inactif";
        console.log(`   - ${userName} → ${ab.quartier.nom} (${status})`);
      });
    }

    // 3. Test de création d'abonnement
    const testUser = users[0];
    const testQuartier = quartiers[0];

    console.log(
      `\n5️⃣ Test d'abonnement : ${testUser.name || testUser.email} → ${
        testQuartier.nom
      }`
    );

    // Vérifier si l'abonnement existe déjà
    const existingSubscription = await prisma.abonnementQuartier.findUnique({
      where: {
        idUtilisateur_idQuartier: {
          idUtilisateur: testUser.id,
          idQuartier: testQuartier.idQuartier,
        },
      },
    });

    if (existingSubscription) {
      console.log("   📋 Abonnement existant trouvé :", {
        actif: existingSubscription.actif,
        typeAlerte: existingSubscription.typeAlerte,
        dateAbonnement: existingSubscription.dateAbonnement?.toISOString(),
      });
    } else {
      console.log("   ➕ Création d'un nouvel abonnement...");

      const newSubscription = await prisma.abonnementQuartier.create({
        data: {
          idUtilisateur: testUser.id,
          idQuartier: testQuartier.idQuartier,
          actif: true,
          dateAbonnement: new Date(),
          typeAlerte: "TOUTES",
        },
      });

      console.log("   ✅ Abonnement créé avec succès !");
      console.log("   📋 Détails :", {
        actif: newSubscription.actif,
        typeAlerte: newSubscription.typeAlerte,
        dateAbonnement: newSubscription.dateAbonnement?.toISOString(),
      });
    }

    // 4. Vérifier les notifications associées
    console.log("\n6️⃣ Notifications récentes pour cet utilisateur :");
    const notifications = await prisma.notification.findMany({
      where: {
        idUtilisateur: testUser.id,
      },
      include: {
        alerte: {
          include: {
            capteur: {
              include: {
                quartier: { select: { nom: true } },
              },
            },
          },
        },
      },
      orderBy: {
        dateEnvoi: "desc",
      },
      take: 5,
    });

    if (notifications.length === 0) {
      console.log("   Aucune notification trouvée");
    } else {
      notifications.forEach((notif) => {
        const status = notif.statut === "LU" ? "📖 Lue" : "📬 Non lue";
        const quartierNom = notif.alerte.capteur.quartier.nom;
        console.log(`   - ${status} | ${quartierNom} | ${notif.titre}`);
        const dateStr = notif.dateEnvoi
          ? new Date(notif.dateEnvoi).toLocaleString("fr-FR")
          : "Date inconnue";
        console.log(`     ${dateStr}`);
      });
    }

    console.log("\n✅ Test terminé avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors du test :", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer le test si ce script est exécuté directement
if (require.main === module) {
  testSubscriptionSystem();
}

export { testSubscriptionSystem };
