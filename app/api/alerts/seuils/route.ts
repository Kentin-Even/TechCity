import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// GET /api/alerts/seuils - Récupérer les seuils personnalisés d'un utilisateur
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const seuils = await prisma.seuilPersonnalise.findMany({
      where: {
        idUtilisateur: session.user.id,
      },
      include: {
        typeCapteur: true,
      },
      orderBy: {
        typeCapteur: {
          nom: "asc",
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: seuils,
    });
  } catch (error) {
    console.error("Erreur GET seuils:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des seuils" },
      { status: 500 }
    );
  }
}

// POST /api/alerts/seuils - Créer ou mettre à jour un seuil personnalisé
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { idTypeCapteur, seuilMin, seuilMax, actif = true } = body;

    // Vérifier qu'au moins un seuil est défini
    if (seuilMin === null && seuilMax === null) {
      return NextResponse.json(
        { error: "Au moins un seuil (min ou max) doit être défini" },
        { status: 400 }
      );
    }

    // Vérifier si un seuil existe déjà pour ce type de capteur
    const seuilExistant = await prisma.seuilPersonnalise.findFirst({
      where: {
        idUtilisateur: session.user.id,
        idTypeCapteur,
      },
    });

    if (seuilExistant) {
      // Mettre à jour le seuil existant
      const seuilMisAJour = await prisma.seuilPersonnalise.update({
        where: {
          idSeuil: seuilExistant.idSeuil,
        },
        data: {
          seuilMin: seuilMin !== undefined ? seuilMin : seuilExistant.seuilMin,
          seuilMax: seuilMax !== undefined ? seuilMax : seuilExistant.seuilMax,
          actif,
          updatedAt: new Date(),
        },
        include: {
          typeCapteur: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: seuilMisAJour,
        message: "Seuil personnalisé mis à jour avec succès",
      });
    } else {
      // Créer un nouveau seuil
      // Générer un nouvel ID
      const maxSeuil = await prisma.seuilPersonnalise.findFirst({
        orderBy: { idSeuil: "desc" },
      });
      const newSeuilId = (maxSeuil?.idSeuil || 0) + 1;

      const nouveauSeuil = await prisma.seuilPersonnalise.create({
        data: {
          idSeuil: newSeuilId,
          idUtilisateur: session.user.id,
          idTypeCapteur,
          seuilMin,
          seuilMax,
          actif,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          typeCapteur: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: nouveauSeuil,
        message: "Seuil personnalisé créé avec succès",
      });
    }
  } catch (error) {
    console.error("Erreur POST seuils:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création/mise à jour du seuil" },
      { status: 500 }
    );
  }
}

// DELETE /api/alerts/seuils - Supprimer un seuil personnalisé
export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idSeuil = parseInt(searchParams.get("idSeuil") || "0");

    if (!idSeuil) {
      return NextResponse.json(
        { error: "ID du seuil manquant" },
        { status: 400 }
      );
    }

    // Vérifier que le seuil appartient à l'utilisateur
    const seuil = await prisma.seuilPersonnalise.findFirst({
      where: {
        idSeuil,
        idUtilisateur: session.user.id,
      },
    });

    if (!seuil) {
      return NextResponse.json({ error: "Seuil non trouvé" }, { status: 404 });
    }

    // Supprimer le seuil
    await prisma.seuilPersonnalise.delete({
      where: {
        idSeuil,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Seuil personnalisé supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE seuils:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du seuil" },
      { status: 500 }
    );
  }
}
