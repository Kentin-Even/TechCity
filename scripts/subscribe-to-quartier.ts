import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function subscribeUserToQuartier(
  userEmail: string,
  quartierName?: string
) {
  try {
    console.log(`🔗 ABONNEMENT AUX QUARTIERS pour ${userEmail}`);
    console.log("===============================================\n");

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      console.error(`❌ Utilisateur non trouvé: ${userEmail}`);
      return;
    }

    console.log(
      `👤 Utilisateur trouvé: ${user.name || "Sans nom"} (${user.email})`
    );

    // Lister tous les quartiers disponibles
    const quartiers = await prisma.quartier.findMany();
    console.log("\n🏘️ Quartiers disponibles:");
    quartiers.forEach((q) => {
      console.log(`  • ${q.nom} (ID: ${q.idQuartier})`);
    });

    // Déterminer le quartier à utiliser
    let quartierCible;
    if (quartierName) {
      quartierCible = quartiers.find((q) =>
        q.nom.toLowerCase().includes(quartierName.toLowerCase())
      );
    } else {
      // Par défaut, utiliser le premier quartier (Centre-Ville Tech City)
      quartierCible = quartiers[0];
    }

    if (!quartierCible) {
      console.error(
        `❌ Quartier non trouvé: ${quartierName || "aucun spécifié"}`
      );
      return;
    }

    console.log(`\n🎯 Quartier cible: ${quartierCible.nom}`);

    // Vérifier si l'abonnement existe déjà
    const abonnementExistant = await prisma.abonnementQuartier.findUnique({
      where: {
        idUtilisateur_idQuartier: {
          idUtilisateur: user.id,
          idQuartier: quartierCible.idQuartier,
        },
      },
    });

    if (abonnementExistant) {
      if (abonnementExistant.actif) {
        console.log(
          "ℹ️ L'utilisateur est déjà abonné et l'abonnement est actif"
        );
        return;
      } else {
        // Réactiver l'abonnement
        await prisma.abonnementQuartier.update({
          where: {
            idUtilisateur_idQuartier: {
              idUtilisateur: user.id,
              idQuartier: quartierCible.idQuartier,
            },
          },
          data: {
            actif: true,
            dateAbonnement: new Date(),
          },
        });
        console.log("✅ Abonnement réactivé avec succès !");
      }
    } else {
      // Créer un nouvel abonnement
      await prisma.abonnementQuartier.create({
        data: {
          idUtilisateur: user.id,
          idQuartier: quartierCible.idQuartier,
          actif: true,
          dateAbonnement: new Date(),
          typeAlerte: "TOUTES",
        },
      });
      console.log("✅ Nouvel abonnement créé avec succès !");
    }

    // Vérifier les abonnements après modification
    const abonnements = await prisma.abonnementQuartier.findMany({
      where: { idUtilisateur: user.id },
      include: { quartier: true },
    });

    console.log("\n📋 Abonnements actuels de l'utilisateur:");
    abonnements.forEach((abo) => {
      console.log(
        `  • ${abo.quartier.nom} - ${abo.actif ? "✅ Actif" : "❌ Inactif"}`
      );
    });

    console.log("\n🎉 Maintenant, vous pouvez tester les alertes !");
    console.log(
      "   Générez des données avec: npm run generate-alerts single 2 CRITIQUE"
    );
  } catch (error) {
    console.error("❌ Erreur lors de l'abonnement:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Script principal
async function main() {
  const args = process.argv.slice(2);
  const userEmail = args[0];
  const quartierName = args[1];

  if (!userEmail) {
    console.log(`
🔗 SCRIPT D'ABONNEMENT AUX QUARTIERS
===================================

Usage: npm run subscribe-quartier <email> [quartier]

Arguments:
  email     - Email de l'utilisateur à abonner
  quartier  - Nom du quartier (optionnel, par défaut le premier)

Exemples:
  npm run subscribe-quartier kentineven@email.com
  npm run subscribe-quartier kentineven@email.com "Centre-Ville"
    `);
    return;
  }

  await subscribeUserToQuartier(userEmail, quartierName);
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

export { subscribeUserToQuartier };
