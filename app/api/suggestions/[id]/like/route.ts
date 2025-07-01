import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// POST - Liker une suggestion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const suggestionId = parseInt(id);

    if (isNaN(suggestionId)) {
      return NextResponse.json(
        { error: "ID de suggestion invalide" },
        { status: 400 }
      );
    }

    // Vérifier que la suggestion existe
    const suggestion = await prisma.suggestion.findUnique({
      where: { idSuggestion: suggestionId },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion non trouvée" },
        { status: 404 }
      );
    }

    // Incrémenter le nombre de votes (gérer le cas où votes est null)
    const updatedSuggestion = await prisma.suggestion.update({
      where: { idSuggestion: suggestionId },
      data: {
        votes: suggestion.votes ? suggestion.votes + 1 : 1,
      },
    });

    return NextResponse.json({
      success: true,
      votes: updatedSuggestion.votes,
    });
  } catch (error) {
    console.error("Erreur lors du like de la suggestion:", error);
    return NextResponse.json(
      { error: "Erreur lors du like de la suggestion" },
      { status: 500 }
    );
  }
}
