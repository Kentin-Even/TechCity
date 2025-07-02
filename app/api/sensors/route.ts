import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, StatutCapteur } from "@/lib/generated/prisma";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - Récupérer tous les capteurs avec filtres
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

    const { searchParams } = new URL(request.url);
    const quartier = searchParams.get("quartier");
    const type = searchParams.get("type");
    const statut = searchParams.get("statut");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Construire les filtres
    const where: {
      idQuartier?: number;
      idTypeCapteur?: number;
      statut?: StatutCapteur;
    } = {};
    if (quartier) where.idQuartier = parseInt(quartier);
    if (type) where.idTypeCapteur = parseInt(type);
    if (statut) where.statut = statut as StatutCapteur;

    const [capteurs, total] = await Promise.all([
      prisma.capteur.findMany({
        where,
        select: {
          idCapteur: true,
          nom: true,
          description: true,
          longitude: true,
          latitude: true,
          adresseInstallation: true,
          dateInstallation: true,
          statut: true,
          modele: true,
          fabricant: true,
          numeroSerie: true,
          versionFirmware: true,
          derniereMaintenance: true,
          frequenceCapture: true,
          createdAt: true,
          updatedAt: true,
          quartier: {
            select: {
              idQuartier: true,
              nom: true,
            },
          },
          typeCapteur: {
            select: {
              idTypeCapteur: true,
              nom: true,
              unite: true,
              seuilMin: true,
              seuilMax: true,
            },
          },
          donneesCapteur: {
            take: 1,
            orderBy: {
              timestamp: "desc",
            },
            select: {
              valeur: true,
              timestamp: true,
              unite: true,
            },
          },
          _count: {
            select: {
              donneesCapteur: true,
              alertes: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: limit,
      }),
      prisma.capteur.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: capteurs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des capteurs:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau capteur
export async function POST(request: NextRequest) {
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

    // Vérifier les permissions admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (
      !user ||
      (user.role?.nom !== "Admin" && user.role?.nom !== "Gestionnaire")
    ) {
      return NextResponse.json(
        { success: false, error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      nom,
      description,
      longitude,
      latitude,
      adresseInstallation,
      modele,
      fabricant,
      numeroSerie,
      versionFirmware,
      frequenceCapture,
      idTypeCapteur,
      idQuartier,
    } = body;

    // Vérifier que le numéro de série n'existe pas déjà
    if (numeroSerie) {
      const existingCapteur = await prisma.capteur.findUnique({
        where: { numeroSerie },
      });
      if (existingCapteur) {
        return NextResponse.json(
          { success: false, error: "Ce numéro de série existe déjà" },
          { status: 400 }
        );
      }
    }

    // Générer un ID unique pour le capteur
    const lastCapteur = await prisma.capteur.findFirst({
      orderBy: { idCapteur: "desc" },
      select: { idCapteur: true },
    });
    const nextId = lastCapteur ? lastCapteur.idCapteur + 1 : 1;

    const nouveauCapteur = await prisma.capteur.create({
      data: {
        idCapteur: nextId,
        nom,
        description,
        longitude: longitude ? parseFloat(longitude) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        adresseInstallation,
        dateInstallation: new Date(),
        statut: StatutCapteur.ACTIF,
        modele,
        fabricant,
        numeroSerie,
        versionFirmware,
        frequenceCapture: parseInt(frequenceCapture) || 60,
        idTypeCapteur: parseInt(idTypeCapteur),
        idQuartier: parseInt(idQuartier),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        quartier: {
          select: {
            nom: true,
          },
        },
        typeCapteur: {
          select: {
            nom: true,
            unite: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: nouveauCapteur,
      message: "Capteur créé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la création du capteur:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un capteur
export async function PUT(request: NextRequest) {
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

    // Vérifier les permissions admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (
      !user ||
      (user.role?.nom !== "Admin" && user.role?.nom !== "Gestionnaire")
    ) {
      return NextResponse.json(
        { success: false, error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { idCapteur, ...updateData } = body;

    if (!idCapteur) {
      return NextResponse.json(
        { success: false, error: "ID du capteur requis" },
        { status: 400 }
      );
    }

    // Vérifier que le capteur existe
    const capteurExistant = await prisma.capteur.findUnique({
      where: { idCapteur: parseInt(idCapteur) },
    });

    if (!capteurExistant) {
      return NextResponse.json(
        { success: false, error: "Capteur non trouvé" },
        { status: 404 }
      );
    }

    // Si le numéro de série est modifié, vérifier l'unicité
    if (
      updateData.numeroSerie &&
      updateData.numeroSerie !== capteurExistant.numeroSerie
    ) {
      const existingCapteur = await prisma.capteur.findUnique({
        where: { numeroSerie: updateData.numeroSerie },
      });
      if (existingCapteur) {
        return NextResponse.json(
          { success: false, error: "Ce numéro de série existe déjà" },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const dataToUpdate: {
      [key: string]: string | number | Date | undefined;
      updatedAt: Date;
    } = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Convertir les types si nécessaire
    if (updateData.longitude)
      dataToUpdate.longitude = parseFloat(updateData.longitude);
    if (updateData.latitude)
      dataToUpdate.latitude = parseFloat(updateData.latitude);
    if (updateData.frequenceCapture)
      dataToUpdate.frequenceCapture = parseInt(updateData.frequenceCapture);
    if (updateData.idTypeCapteur)
      dataToUpdate.idTypeCapteur = parseInt(updateData.idTypeCapteur);
    if (updateData.idQuartier)
      dataToUpdate.idQuartier = parseInt(updateData.idQuartier);

    const capteurMisAJour = await prisma.capteur.update({
      where: { idCapteur: parseInt(idCapteur) },
      data: dataToUpdate,
      include: {
        quartier: {
          select: {
            nom: true,
          },
        },
        typeCapteur: {
          select: {
            nom: true,
            unite: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: capteurMisAJour,
      message: "Capteur mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du capteur:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un capteur
export async function DELETE(request: NextRequest) {
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

    // Vérifier les permissions admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (
      !user ||
      (user.role?.nom !== "Admin" && user.role?.nom !== "Gestionnaire")
    ) {
      return NextResponse.json(
        { success: false, error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const idCapteur = searchParams.get("id");

    if (!idCapteur) {
      return NextResponse.json(
        { success: false, error: "ID du capteur requis" },
        { status: 400 }
      );
    }

    // Vérifier que le capteur existe
    const capteurExistant = await prisma.capteur.findUnique({
      where: { idCapteur: parseInt(idCapteur) },
    });

    if (!capteurExistant) {
      return NextResponse.json(
        { success: false, error: "Capteur non trouvé" },
        { status: 404 }
      );
    }

    await prisma.capteur.delete({
      where: { idCapteur: parseInt(idCapteur) },
    });

    return NextResponse.json({
      success: true,
      message: "Capteur supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du capteur:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
