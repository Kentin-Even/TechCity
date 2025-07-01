import { NextRequest } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const capteurId = searchParams.get("capteurId");
    const hours = searchParams.get("hours") || "24";

    if (!capteurId) {
      return Response.json({ error: "capteurId est requis" }, { status: 400 });
    }

    // Calculer la période
    const hoursNumber = parseInt(hours);
    const now = new Date();
    const startTime = new Date(now.getTime() - hoursNumber * 60 * 60 * 1000);

    // Récupérer les données historiques
    const historicalData = await prisma.donneeCapteur.findMany({
      where: {
        idCapteur: parseInt(capteurId),
        timestamp: {
          gte: startTime,
          lte: now,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      include: {
        capteur: {
          include: {
            typeCapteur: true,
            quartier: true,
          },
        },
      },
    });

    // Formater les données
    const formattedData = historicalData.map((donnee) => ({
      id: donnee.idDonnee.toString(),
      capteurId: donnee.idCapteur,
      capteurNom: donnee.capteur.nom,
      typeCapteur: donnee.capteur.typeCapteur.nom,
      valeur: Number(donnee.valeur),
      unite: donnee.unite,
      timestamp: donnee.timestamp.toISOString(),
      quartier: donnee.capteur.quartier.nom,
      coordonnees: {
        latitude: Number(donnee.capteur.latitude),
        longitude: Number(donnee.capteur.longitude),
      },
    }));

    return Response.json({
      success: true,
      data: formattedData,
      capteurId: parseInt(capteurId),
      period: `${hoursNumber}h`,
      count: formattedData.length,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
    });
  } catch (error) {
    console.error("Erreur récupération historique capteur:", error);
    return Response.json(
      { error: "Erreur serveur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
