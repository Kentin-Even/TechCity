import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - Récupérer tous les types de capteurs
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 401 }
      );
    }

    const typesCapteurs = await prisma.typeCapteur.findMany({
      select: {
        idTypeCapteur: true,
        nom: true,
        unite: true,
        seuilMin: true,
        seuilMax: true,
        plageMin: true,
        plageMax: true,
      },
      orderBy: {
        nom: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: typesCapteurs,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des types de capteurs:",
      error
    );
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
