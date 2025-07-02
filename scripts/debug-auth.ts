import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

async function debugAuth() {
  try {
    console.log("🔍 Débogage de l'authentification...\n");

    // 1. Vérifier les sessions actives
    console.log("📊 Sessions actives en base de données:");
    const sessions = await prisma.session.findMany({
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (sessions.length === 0) {
      console.log("⚠️ Aucune session active trouvée en base de données");
    } else {
      sessions.forEach((session, index) => {
        const isExpired = new Date() > session.expiresAt;
        console.log(`  ${index + 1}. Session ID: ${session.id}`);
        console.log(
          `     Utilisateur: ${session.user.email} (${
            session.user.role?.nom || "N/A"
          })`
        );
        console.log(
          `     Créée le: ${session.createdAt.toLocaleString("fr-FR")}`
        );
        console.log(
          `     Expire le: ${session.expiresAt.toLocaleString("fr-FR")}`
        );
        console.log(`     Statut: ${isExpired ? "❌ Expirée" : "✅ Active"}`);
        console.log(`     IP: ${session.ipAddress || "N/A"}`);
        console.log(`     User-Agent: ${session.userAgent || "N/A"}`);
        console.log("");
      });
    }

    // 2. Vérifier les comptes (Better Auth)
    console.log("👥 Comptes utilisateurs (Better Auth):");
    const accounts = await prisma.account.findMany({
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (accounts.length === 0) {
      console.log("⚠️ Aucun compte Better Auth trouvé");
    } else {
      accounts.forEach((account, index) => {
        console.log(`  ${index + 1}. Account ID: ${account.id}`);
        console.log(
          `     Utilisateur: ${account.user.email} (${
            account.user.role?.nom || "N/A"
          })`
        );
        console.log(`     Provider: ${account.providerId}`);
        console.log(`     Account ID: ${account.accountId}`);
        console.log(
          `     Créé le: ${account.createdAt.toLocaleString("fr-FR")}`
        );
        console.log("");
      });
    }

    // 3. Nettoyer les sessions expirées
    const expiredSessions = await prisma.session.findMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    if (expiredSessions.length > 0) {
      console.log(
        `🧹 Nettoyage de ${expiredSessions.length} session(s) expirée(s)...`
      );
      await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      });
      console.log("✅ Sessions expirées supprimées");
    }

    // 4. Créer une nouvelle session de test (optionnel)
    console.log(
      "\n💡 Pour créer une nouvelle session, vous devez vous reconnecter via l'interface web"
    );
    console.log("   1. Allez sur http://localhost:3000/sign-in");
    console.log("   2. Connectez-vous avec: kentineven@email.com");
    console.log("   3. Puis accédez à http://localhost:3000/admin");
  } catch (error) {
    console.error("❌ Erreur lors du débogage:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth();
