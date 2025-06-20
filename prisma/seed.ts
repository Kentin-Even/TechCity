import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { idRole: 1, nom: "Admin" },
    { idRole: 2, nom: "Gestionnaire" },
    { idRole: 3, nom: "Citoyen" },
    { idRole: 4, nom: "Chercheur" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { idRole: role.idRole },
      update: {},
      create: role,
    });
  }

  console.log("Rôles créés avec succès !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
