import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer le rôle de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (
      !user ||
      (user.role?.nom !== "Chercheur" && user.role?.nom !== "Admin")
    ) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer les paramètres de requête
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const typeCapteur = searchParams.get("typeCapteur");
    const quartier = searchParams.get("quartier");
    const dateDebut = searchParams.get("dateDebut");
    const dateFin = searchParams.get("dateFin");
    const search = searchParams.get("search");

    // Construire les conditions where
    const where: Record<string, any> = {};

    if (typeCapteur) {
      where.capteur = {
        idTypeCapteur: parseInt(typeCapteur),
      };
    }

    if (quartier) {
      where.capteur = {
        ...where.capteur,
        quartier: {
          nom: {
            contains: quartier,
            mode: "insensitive",
          },
        },
      };
    }

    if (dateDebut || dateFin) {
      where.timestamp = {};
      if (dateDebut) {
        where.timestamp.gte = new Date(dateDebut);
      }
      if (dateFin) {
        where.timestamp.lte = new Date(dateFin);
      }
    }

    if (search) {
      where.OR = [
        {
          capteur: {
            nom: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          capteur: {
            numeroSerie: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // Compter le nombre total de résultats
    const totalCount = await prisma.donneeCapteur.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    // Récupérer les données avec pagination
    const donnees = await prisma.donneeCapteur.findMany({
      where,
      include: {
        capteur: {
          include: {
            quartier: true,
            typeCapteur: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Formater les données pour le frontend
    const donneesFormatees = donnees.map((donnee) => ({
      idDonnee: donnee.idDonnee.toString(),
      valeur: Number(donnee.valeur),
      timestamp: donnee.timestamp.toISOString(),
      unite: donnee.unite,
      validee: donnee.validee || false,
      capteur: {
        idCapteur: donnee.capteur.idCapteur,
        nom: donnee.capteur.nom,
        modele: donnee.capteur.modele || "",
        numeroSerie: donnee.capteur.numeroSerie || "",
        quartier: {
          nom: donnee.capteur.quartier.nom,
        },
        typeCapteur: {
          nom: donnee.capteur.typeCapteur.nom,
        },
      },
    }));

    return NextResponse.json({
      donnees: donneesFormatees,
      totalCount,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
