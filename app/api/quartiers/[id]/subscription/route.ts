import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// GET /api/quartiers/[id]/subscription - Vérifier l'abonnement d'un utilisateur à un quartier
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const resolvedParams = await params;
    const quartierId = parseInt(resolvedParams.id);

    if (isNaN(quartierId)) {
      return NextResponse.json(
        { error: "ID de quartier invalide" },
        { status: 400 }
      );
    }

    // Vérifier si le quartier existe
    const quartier = await prisma.quartier.findUnique({
      where: { idQuartier: quartierId },
    });

    if (!quartier) {
      return NextResponse.json(
        { error: "Quartier non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer l'abonnement de l'utilisateur
    const subscription = await prisma.abonnementQuartier.findUnique({
      where: {
        idUtilisateur_idQuartier: {
          idUtilisateur: session.user.id,
          idQuartier: quartierId,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({ subscription: null }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        actif: subscription.actif,
        dateAbonnement: subscription.dateAbonnement?.toISOString(),
        typeAlerte: subscription.typeAlerte,
      },
    });
  } catch (error) {
    console.error("Erreur GET subscription:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification de l'abonnement" },
      { status: 500 }
    );
  }
}

// POST /api/quartiers/[id]/subscription - S'abonner ou se désabonner d'un quartier
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const resolvedParams = await params;
    const quartierId = parseInt(resolvedParams.id);

    if (isNaN(quartierId)) {
      return NextResponse.json(
        { error: "ID de quartier invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, typeAlerte = "TOUTES" } = body;

    if (!action || !["subscribe", "unsubscribe"].includes(action)) {
      return NextResponse.json(
        { error: "Action invalide. Utilisez 'subscribe' ou 'unsubscribe'" },
        { status: 400 }
      );
    }

    // Vérifier si le quartier existe
    const quartier = await prisma.quartier.findUnique({
      where: { idQuartier: quartierId },
    });

    if (!quartier) {
      return NextResponse.json(
        { error: "Quartier non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si un abonnement existe déjà
    const existingSubscription = await prisma.abonnementQuartier.findUnique({
      where: {
        idUtilisateur_idQuartier: {
          idUtilisateur: session.user.id,
          idQuartier: quartierId,
        },
      },
    });

    if (action === "subscribe") {
      if (existingSubscription) {
        // Mettre à jour l'abonnement existant
        const updatedSubscription = await prisma.abonnementQuartier.update({
          where: {
            idUtilisateur_idQuartier: {
              idUtilisateur: session.user.id,
              idQuartier: quartierId,
            },
          },
          data: {
            actif: true,
            dateAbonnement: new Date(),
            typeAlerte: typeAlerte as
              | "SEUIL_DEPASSE"
              | "CAPTEUR_DEFAILLANT"
              | "MAINTENANCE"
              | "TOUTES",
          },
        });

        return NextResponse.json({
          success: true,
          message: "Abonnement mis à jour avec succès",
          subscription: {
            actif: updatedSubscription.actif,
            dateAbonnement: updatedSubscription.dateAbonnement?.toISOString(),
            typeAlerte: updatedSubscription.typeAlerte,
          },
        });
      } else {
        // Créer un nouvel abonnement
        const newSubscription = await prisma.abonnementQuartier.create({
          data: {
            idUtilisateur: session.user.id,
            idQuartier: quartierId,
            actif: true,
            dateAbonnement: new Date(),
            typeAlerte: typeAlerte as
              | "SEUIL_DEPASSE"
              | "CAPTEUR_DEFAILLANT"
              | "MAINTENANCE"
              | "TOUTES",
          },
        });

        return NextResponse.json({
          success: true,
          message: "Abonnement créé avec succès",
          subscription: {
            actif: newSubscription.actif,
            dateAbonnement: newSubscription.dateAbonnement?.toISOString(),
            typeAlerte: newSubscription.typeAlerte,
          },
        });
      }
    } else if (action === "unsubscribe") {
      if (!existingSubscription) {
        return NextResponse.json(
          { error: "Aucun abonnement à supprimer" },
          { status: 404 }
        );
      }

      // Désactiver l'abonnement au lieu de le supprimer
      await prisma.abonnementQuartier.update({
        where: {
          idUtilisateur_idQuartier: {
            idUtilisateur: session.user.id,
            idQuartier: quartierId,
          },
        },
        data: {
          actif: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Désabonnement effectué avec succès",
      });
    }
  } catch (error) {
    console.error("Erreur POST subscription:", error);
    return NextResponse.json(
      { error: "Erreur lors de la gestion de l'abonnement" },
      { status: 500 }
    );
  }
}
