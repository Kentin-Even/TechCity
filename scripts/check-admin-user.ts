import { PrismaClient } from "@/lib/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function checkAndCreateAdmin() {
  try {
    console.log("🔍 Vérification des utilisateurs et rôles...");

    // Vérifier si les rôles existent
    const roles = await prisma.role.findMany();
    console.log(
      "📋 Rôles disponibles:",
      roles.map((r) => `${r.idRole}: ${r.nom}`).join(", ")
    );

    if (roles.length === 0) {
      console.log("⚠️ Aucun rôle trouvé, création des rôles par défaut...");

      const defaultRoles = [
        { idRole: 1, nom: "Admin" },
        { idRole: 2, nom: "Gestionnaire" },
        { idRole: 3, nom: "Citoyen" },
        { idRole: 4, nom: "Chercheur" },
      ];

      for (const role of defaultRoles) {
        await prisma.role.upsert({
          where: { idRole: role.idRole },
          update: {},
          create: role,
        });
      }
      console.log("✅ Rôles créés avec succès");
    }

    // Vérifier s'il existe un admin
    const adminRole = await prisma.role.findUnique({
      where: { nom: "Admin" },
    });

    if (!adminRole) {
      console.log("❌ Rôle Admin non trouvé");
      return;
    }

    const adminUsers = await prisma.user.findMany({
      where: { idRole: adminRole.idRole },
      include: { role: true },
    });

    console.log(`👥 Utilisateurs Admin trouvés: ${adminUsers.length}`);

    if (adminUsers.length > 0) {
      console.log("📊 Utilisateurs Admin existants:");
      adminUsers.forEach((user) => {
        console.log(
          `  - ${user.email} (ID: ${user.id}, Nom: ${user.name || "N/A"})`
        );
      });
    } else {
      console.log(
        "⚠️ Aucun utilisateur Admin trouvé, création d'un admin par défaut..."
      );

      const adminEmail = "admin@techcity.fr";
      const adminPassword = "admin123"; // À changer en production !

      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      const newAdmin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Administrateur",
          prenom: "Système",
          password: hashedPassword,
          idRole: adminRole.idRole,
          active: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: { role: true },
      });

      console.log("✅ Utilisateur Admin créé avec succès:");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Mot de passe: ${adminPassword}`);
      console.log(`   ID: ${newAdmin.id}`);
      console.log(
        "⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !"
      );
    }

    // Vérifier tous les utilisateurs
    const allUsers = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" },
    });

    console.log(`\n📊 Résumé des utilisateurs (${allUsers.length} total):`);
    allUsers.forEach((user) => {
      console.log(
        `  - ${user.email} | Rôle: ${user.role?.nom || "N/A"} | Actif: ${
          user.active
        }`
      );
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour promouvoir un utilisateur existant en admin
async function promoteUserToAdmin(email: string) {
  try {
    const adminRole = await prisma.role.findUnique({
      where: { nom: "Admin" },
    });

    if (!adminRole) {
      console.log("❌ Rôle Admin non trouvé");
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      console.log(`❌ Utilisateur avec l'email ${email} non trouvé`);
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { idRole: adminRole.idRole },
      include: { role: true },
    });

    console.log(`✅ Utilisateur ${email} promu Admin avec succès`);
    console.log(`   Ancien rôle: ${user.role?.nom || "N/A"}`);
    console.log(`   Nouveau rôle: ${updatedUser.role?.nom}`);
  } catch (error) {
    console.error("❌ Erreur lors de la promotion:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Vérifier les arguments de la ligne de commande
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === "promote" && args[1]) {
  promoteUserToAdmin(args[1]);
} else {
  checkAndCreateAdmin();
}

export { checkAndCreateAdmin, promoteUserToAdmin };
