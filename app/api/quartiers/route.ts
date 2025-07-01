import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - Récupérer la liste des quartiers
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Non autorisé",
        },
        { status: 401 }
      );
    }

    const quartiers = await prisma.quartier.findMany({
      select: {
        idQuartier: true,
        nom: true,
        longitude: true,
        latitude: true,
        superficie: true,
        _count: {
          select: {
            capteurs: true,
          },
        },
      },
      orderBy: {
        nom: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: quartiers,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des quartiers:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des quartiers",
      },
      { status: 500 }
    );
  }
}
