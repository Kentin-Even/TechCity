import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function createTestNotification() {
  console.log("🔔 Création d'une notification de test\n");

  try {
    // Récupérer l'utilisateur Kentin
    const user = await prisma.user.findUnique({
      where: { email: "kentineven@email.com" },
    });

    if (!user) {
      console.log("❌ Utilisateur non trouvé");
      return;
    }

    console.log(`👤 Utilisateur trouvé: ${user.name} (${user.email})`);

    // Récupérer un capteur pour l'exemple
    const capteur = await prisma.capteur.findFirst({
      include: {
        quartier: true,
        typeCapteur: true,
      },
    });

    if (!capteur) {
      console.log("❌ Capteur non trouvé");
      return;
    }

    console.log(
      `📡 Capteur trouvé: ${capteur.nom} (${capteur.typeCapteur.nom})`
    );

    // Créer une alerte de test
    const maxAlerte = await prisma.alerte.findFirst({
      orderBy: { idAlerte: "desc" },
    });
    const newAlerteId = (maxAlerte?.idAlerte || 0) + 1;

    const alerte = await prisma.alerte.create({
      data: {
        idAlerte: newAlerteId,
        type: "SEUIL_DEPASSE",
        niveauGravite: "ELEVE",
        message: `Test: Seuil de ${capteur.typeCapteur.nom} dépassé dans le quartier ${capteur.quartier.nom}`,
        dateCreation: new Date(),
        statut: "OUVERTE",
        valeurMesuree: 150.75,
        seuilDeclenche: 100.0,
        idUtilisateur: user.id,
        idCapteur: capteur.idCapteur,
      },
    });

    console.log(`🚨 Alerte créée: ID ${alerte.idAlerte}`);

    // Créer une notification de test
    const maxNotification = await prisma.notification.findFirst({
      orderBy: { idNotification: "desc" },
    });
    const newNotificationId = (maxNotification?.idNotification || 0) + 1;

    const notification = await prisma.notification.create({
      data: {
        idNotification: newNotificationId,
        titre: `🔥 Test Alerte ${capteur.typeCapteur.nom} - ${capteur.quartier.nom}`,
        message: `Test: La valeur de ${capteur.typeCapteur.nom} (150.75${capteur.typeCapteur.unite}) a dépassé votre seuil personnalisé (100.0${capteur.typeCapteur.unite}) dans le quartier ${capteur.quartier.nom}. Ceci est une notification de test.`,
        dateEnvoi: new Date(),
        type: "PUSH",
        statut: "EN_ATTENTE", // Non lue
        idAlerte: alerte.idAlerte,
        idUtilisateur: user.id,
      },
    });

    console.log(`✅ Notification créée: ID ${notification.idNotification}`);
    console.log(`📱 Titre: ${notification.titre}`);
    console.log(`💬 Message: ${notification.message}`);
    console.log(`⏰ Statut: ${notification.statut} (non lue)`);

    console.log("\n🎉 Notification de test créée avec succès !");
    console.log(
      "Vous devriez maintenant voir la notification apparaître en bas à droite de l'interface."
    );
  } catch (error) {
    console.error("❌ Erreur lors de la création de la notification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer le script si exécuté directement
if (require.main === module) {
  createTestNotification();
}

export { createTestNotification };
