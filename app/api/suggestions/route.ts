import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  Prisma,
  StatutSuggestion,
  CategorieSuggestion,
  PrioriteSuggestion,
} from "@/lib/generated/prisma";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// Types pour la validation
const STATUTS_VALIDES: StatutSuggestion[] = [
  "NOUVELLE",
  "EN_COURS",
  "APPROUVEE",
  "REJETEE",
  "IMPLEMENTEE",
];
const CATEGORIES_VALIDES: CategorieSuggestion[] = [
  "INFRASTRUCTURE",
  "ENVIRONNEMENT",
  "SECURITE",
  "AMELIORATION",
  "BUG",
];
const PRIORITES_VALIDES: PrioriteSuggestion[] = [
  "FAIBLE",
  "MOYENNE",
  "ELEVEE",
  "URGENTE",
];

// GET - Récupérer les suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const statut = url.searchParams.get("statut");
    const categorie = url.searchParams.get("categorie");

    // Construction de la requête de filtrage
    const where: Prisma.SuggestionWhereInput = {};

    // Si un userId est spécifié, filtrer par utilisateur
    if (userId) {
      where.idUtilisateur = userId;
    }

    // Filtrer par statut si spécifié
    if (statut && STATUTS_VALIDES.includes(statut as StatutSuggestion)) {
      where.statut = statut as StatutSuggestion;
    }

    // Filtrer par catégorie si spécifié
    if (
      categorie &&
      CATEGORIES_VALIDES.includes(categorie as CategorieSuggestion)
    ) {
      where.categorie = categorie as CategorieSuggestion;
    }

    const suggestions = await prisma.suggestion.findMany({
      where,
      include: {
        utilisateur: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quartier: {
          select: {
            idQuartier: true,
            nom: true,
          },
        },
      },
      orderBy: {
        dateCreation: "desc",
      },
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Erreur lors de la récupération des suggestions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des suggestions" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Créer une nouvelle suggestion
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();
    const { titre, categorie, priorite, idQuartier } = data;

    // Validation des données
    if (!titre || !categorie || !priorite) {
      return NextResponse.json(
        { error: "Les champs titre, catégorie et priorité sont requis" },
        { status: 400 }
      );
    }

    // Validation des enums
    if (!CATEGORIES_VALIDES.includes(categorie)) {
      return NextResponse.json(
        { error: "Catégorie invalide" },
        { status: 400 }
      );
    }

    if (!PRIORITES_VALIDES.includes(priorite)) {
      return NextResponse.json({ error: "Priorité invalide" }, { status: 400 });
    }

    // Générer un nouvel ID pour la suggestion
    const lastSuggestion = await prisma.suggestion.findFirst({
      orderBy: { idSuggestion: "desc" },
    });
    const newId = (lastSuggestion?.idSuggestion || 0) + 1;

    const nouvelleSuggestion = await prisma.suggestion.create({
      data: {
        idSuggestion: newId,
        titre,
        categorie,
        priorite,
        statut: "NOUVELLE",
        dateCreation: new Date(),
        idUtilisateur: session.user.id,
        idQuartier: idQuartier || null,
        // Le champ description n'existe pas dans le schéma, on pourrait l'ajouter au titre
        // ou créer un champ séparé dans le schéma
      },
      include: {
        utilisateur: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quartier: {
          select: {
            idQuartier: true,
            nom: true,
          },
        },
      },
    });

    return NextResponse.json(nouvelleSuggestion, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la suggestion:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la suggestion" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
