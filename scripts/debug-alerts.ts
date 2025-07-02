import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function debugAlerts() {
  console.log("🔍 DIAGNOSTIC DU SYSTÈME D'ALERTES");
  console.log("===================================\n");

  try {
    // 1. Vérifier les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    console.log("👥 UTILISATEURS ENREGISTRÉS:");
    users.forEach((user) => {
      console.log(
        `  • ${user.name || "Sans nom"} (${user.email}) - ID: ${user.id}`
      );
    });
    console.log();

    // 2. Vérifier les seuils personnalisés
    const seuils = await prisma.seuilPersonnalise.findMany({
      include: {
        utilisateur: {
          select: { name: true, email: true },
        },
        typeCapteur: true,
      },
    });

    console.log("⚙️ SEUILS PERSONNALISÉS CONFIGURÉS:");
    if (seuils.length === 0) {
      console.log("  ❌ Aucun seuil personnalisé configuré");
    } else {
      seuils.forEach((seuil) => {
        console.log(`  • ${seuil.utilisateur.name || seuil.utilisateur.email}`);
        console.log(
          `    Type: ${seuil.typeCapteur.nom} (${seuil.typeCapteur.unite})`
        );
        console.log(
          `    Seuils: Min=${seuil.seuilMin || "N/A"}, Max=${
            seuil.seuilMax || "N/A"
          }`
        );
        console.log(`    Actif: ${seuil.actif ? "✅" : "❌"}`);
        console.log();
      });
    }

    // 3. Vérifier les abonnements aux quartiers
    const abonnements = await prisma.abonnementQuartier.findMany({
      include: {
        utilisateur: {
          select: { name: true, email: true },
        },
        quartier: true,
      },
    });

    console.log("🏘️ ABONNEMENTS AUX QUARTIERS:");
    if (abonnements.length === 0) {
      console.log("  ❌ Aucun abonnement aux quartiers");
    } else {
      abonnements.forEach((abo) => {
        console.log(`  • ${abo.utilisateur.name || abo.utilisateur.email}`);
        console.log(`    Quartier: ${abo.quartier.nom}`);
        console.log(`    Actif: ${abo.actif ? "✅" : "❌"}`);
        console.log();
      });
    }

    // 4. Vérifier les capteurs et leurs quartiers
    const capteurs = await prisma.capteur.findMany({
      include: {
        quartier: true,
        typeCapteur: true,
      },
    });

    console.log("📡 CAPTEURS ET QUARTIERS:");
    capteurs.forEach((capteur) => {
      console.log(`  • Capteur ${capteur.idCapteur}: ${capteur.nom}`);
      console.log(`    Type: ${capteur.typeCapteur.nom}`);
      console.log(
        `    Quartier: ${capteur.quartier.nom} (ID: ${capteur.quartier.idQuartier})`
      );
      console.log();
    });

    // 5. Vérifier les dernières données de capteurs
    const dernieresDonnees = await prisma.donneeCapteur.findMany({
      take: 10,
      orderBy: { timestamp: "desc" },
      include: {
        capteur: {
          include: {
            typeCapteur: true,
            quartier: true,
          },
        },
      },
    });

    console.log("📊 DERNIÈRES DONNÉES DE CAPTEURS:");
    dernieresDonnees.forEach((donnee) => {
      console.log(
        `  • Capteur ${donnee.capteur.nom} (${donnee.capteur.typeCapteur.nom})`
      );
      console.log(
        `    Valeur: ${donnee.valeur} ${donnee.capteur.typeCapteur.unite}`
      );
      console.log(`    Timestamp: ${donnee.timestamp.toISOString()}`);
      console.log(`    Quartier: ${donnee.capteur.quartier.nom}`);
      console.log();
    });

    // 6. Vérifier les alertes créées
    const alertes = await prisma.alerte.findMany({
      take: 10,
      orderBy: { dateCreation: "desc" },
      include: {
        utilisateur: {
          select: { name: true, email: true },
        },
        capteur: {
          include: {
            typeCapteur: true,
            quartier: true,
          },
        },
      },
    });

    console.log("🚨 ALERTES CRÉÉES (10 dernières):");
    if (alertes.length === 0) {
      console.log("  ❌ Aucune alerte créée");
    } else {
      alertes.forEach((alerte) => {
        console.log(`  • Alerte ID: ${alerte.idAlerte}`);
        console.log(
          `    Utilisateur: ${
            alerte.utilisateur?.name || alerte.utilisateur?.email || "Inconnu"
          }`
        );
        console.log(
          `    Capteur: ${alerte.capteur.nom} (${alerte.capteur.typeCapteur.nom})`
        );
        console.log(`    Quartier: ${alerte.capteur.quartier.nom}`);
        console.log(
          `    Valeur: ${alerte.valeurMesuree} vs Seuil: ${alerte.seuilDeclenche}`
        );
        console.log(`    Gravité: ${alerte.niveauGravite}`);
        console.log(`    Date: ${alerte.dateCreation?.toISOString()}`);
        console.log(`    Statut: ${alerte.statut}`);
        console.log();
      });
    }

    // 7. Vérifier les notifications
    const notifications = await prisma.notification.findMany({
      take: 10,
      orderBy: { dateEnvoi: "desc" },
      include: {
        utilisateur: {
          select: { name: true, email: true },
        },
        alerte: {
          include: {
            capteur: {
              include: {
                typeCapteur: true,
              },
            },
          },
        },
      },
    });

    console.log("🔔 NOTIFICATIONS CRÉÉES (10 dernières):");
    if (notifications.length === 0) {
      console.log("  ❌ Aucune notification créée");
    } else {
      notifications.forEach((notif) => {
        console.log(`  • Notification ID: ${notif.idNotification}`);
        console.log(
          `    Utilisateur: ${
            notif.utilisateur.name || notif.utilisateur.email
          }`
        );
        console.log(`    Titre: ${notif.titre}`);
        console.log(`    Message: ${notif.message}`);
        console.log(`    Statut: ${notif.statut}`);
        console.log(`    Date: ${notif.dateEnvoi?.toISOString()}`);
        console.log();
      });
    }

    // 8. Diagnostic des problèmes potentiels
    console.log("🔍 DIAGNOSTIC DES PROBLÈMES POTENTIELS:");
    console.log("=========================================");

    if (seuils.length === 0) {
      console.log("❌ PROBLÈME: Aucun seuil personnalisé configuré");
      console.log(
        "   Solution: Configurez des seuils dans l'interface utilisateur"
      );
    }

    if (abonnements.length === 0) {
      console.log("❌ PROBLÈME: Aucun abonnement aux quartiers");
      console.log("   Solution: Abonnez-vous aux quartiers dans l'interface");
    }

    const seuilsActifs = seuils.filter((s) => s.actif);
    if (seuilsActifs.length === 0 && seuils.length > 0) {
      console.log("❌ PROBLÈME: Seuils configurés mais tous inactifs");
      console.log("   Solution: Activez vos seuils personnalisés");
    }

    const abonnementsActifs = abonnements.filter((a) => a.actif);
    if (abonnementsActifs.length === 0 && abonnements.length > 0) {
      console.log("❌ PROBLÈME: Abonnements configurés mais tous inactifs");
      console.log("   Solution: Activez vos abonnements aux quartiers");
    }

    // Vérifier si l'utilisateur avec des seuils est abonné aux bons quartiers
    for (const seuil of seuilsActifs) {
      const userAbonnements = abonnementsActifs.filter(
        (a) => a.idUtilisateur === seuil.idUtilisateur
      );

      if (userAbonnements.length === 0) {
        console.log(
          `❌ PROBLÈME: L'utilisateur ${seuil.utilisateur.email} a des seuils mais n'est abonné à aucun quartier`
        );
      }
    }

    if (alertes.length === 0) {
      console.log(
        "❌ PROBLÈME: Aucune alerte créée malgré les données générées"
      );
      console.log(
        "   Cela peut indiquer un problème dans le service d'alertes"
      );
    }

    console.log("\n✅ Diagnostic terminé");
  } catch (error) {
    console.error("❌ Erreur lors du diagnostic:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le diagnostic
if (require.main === module) {
  debugAlerts().catch(console.error);
}

export { debugAlerts };
