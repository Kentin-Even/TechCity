import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quartierId = parseInt(params.id);

    if (isNaN(quartierId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de quartier invalide",
        },
        { status: 400 }
      );
    }

    // Récupérer le quartier avec ses capteurs
    const quartier = await prisma.quartier.findUnique({
      where: {
        idQuartier: quartierId,
      },
      include: {
        capteurs: {
          include: {
            typeCapteur: true,
            _count: {
              select: {
                donneesCapteur: true,
              },
            },
          },
        },
      },
    });

    if (!quartier) {
      return NextResponse.json(
        {
          success: false,
          error: "Quartier non trouvé",
        },
        { status: 404 }
      );
    }

    // Récupérer les dernières données pour chaque capteur
    const capteursAvecDonnees = await Promise.all(
      quartier.capteurs.map(async (capteur) => {
        const derniereDonnee = await prisma.donneeCapteur.findFirst({
          where: { idCapteur: capteur.idCapteur },
          orderBy: { timestamp: "desc" },
        });

        return {
          ...capteur,
          derniereDonnee: derniereDonnee
            ? {
                valeur: Number(derniereDonnee.valeur),
                timestamp: derniereDonnee.timestamp,
                unite: derniereDonnee.unite,
                validee: derniereDonnee.validee,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        quartier: {
          idQuartier: quartier.idQuartier,
          nom: quartier.nom,
          longitude: Number(quartier.longitude),
          latitude: Number(quartier.latitude),
          superficie: quartier.superficie ? Number(quartier.superficie) : null,
        },
        capteurs: capteursAvecDonnees.map((capteur) => ({
          idCapteur: capteur.idCapteur,
          nom: capteur.nom,
          description: capteur.description,
          longitude: capteur.longitude ? Number(capteur.longitude) : null,
          latitude: capteur.latitude ? Number(capteur.latitude) : null,
          adresseInstallation: capteur.adresseInstallation,
          dateInstallation: capteur.dateInstallation,
          statut: capteur.statut,
          modele: capteur.modele,
          fabricant: capteur.fabricant,
          numeroSerie: capteur.numeroSerie,
          versionFirmware: capteur.versionFirmware,
          derniereMaintenance: capteur.derniereMaintenance,
          frequenceCapture: capteur.frequenceCapture,
          typeCapteur: {
            idTypeCapteur: capteur.typeCapteur.idTypeCapteur,
            nom: capteur.typeCapteur.nom,
            unite: capteur.typeCapteur.unite,
            seuilMin: capteur.typeCapteur.seuilMin
              ? Number(capteur.typeCapteur.seuilMin)
              : null,
            seuilMax: capteur.typeCapteur.seuilMax
              ? Number(capteur.typeCapteur.seuilMax)
              : null,
          },
          derniereDonnee: capteur.derniereDonnee,
          nombreDonnees: capteur._count.donneesCapteur,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des capteurs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des capteurs",
      },
      { status: 500 }
    );
  }
}
