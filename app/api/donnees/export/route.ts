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

    // Récupérer les paramètres
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "csv";
    const typeCapteur = searchParams.get("typeCapteur");
    const quartier = searchParams.get("quartier");
    const dateDebut = searchParams.get("dateDebut");
    const dateFin = searchParams.get("dateFin");
    const search = searchParams.get("search");

    // Construire les conditions where (même logique que l'API brutes)
    const where: Record<string, unknown> = {};

    if (typeCapteur) {
      where.capteur = {
        idTypeCapteur: parseInt(typeCapteur),
      };
    }

    if (quartier) {
      where.capteur = {
        ...(where.capteur as object),
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
        (where.timestamp as Record<string, unknown>).gte = new Date(dateDebut);
      }
      if (dateFin) {
        (where.timestamp as Record<string, unknown>).lte = new Date(dateFin);
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

    // Récupérer toutes les données (sans pagination pour l'export)
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
    });

    if (format === "json") {
      // Export JSON
      const jsonData = donnees.map((donnee) => ({
        idDonnee: donnee.idDonnee.toString(),
        timestamp: donnee.timestamp.toISOString(),
        capteur: donnee.capteur.nom,
        typeCapteur: donnee.capteur.typeCapteur.nom,
        quartier: donnee.capteur.quartier.nom,
        valeur: Number(donnee.valeur),
        unite: donnee.unite,
        validee: donnee.validee || false,
        numeroSerie: donnee.capteur.numeroSerie || "",
        modele: donnee.capteur.modele || "",
        fabricant: donnee.capteur.fabricant || "",
        longitude: donnee.capteur.longitude
          ? Number(donnee.capteur.longitude)
          : null,
        latitude: donnee.capteur.latitude
          ? Number(donnee.capteur.latitude)
          : null,
      }));

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="donnees_capteurs_${new Date().toISOString()}.json"`,
        },
      });
    } else {
      // Export CSV
      const headers = [
        "ID Donnée",
        "Timestamp",
        "Capteur",
        "Type Capteur",
        "Quartier",
        "Valeur",
        "Unité",
        "Validée",
        "Numéro Série",
        "Modèle",
        "Fabricant",
        "Longitude",
        "Latitude",
      ];

      const csvRows = [headers.join(",")];

      donnees.forEach((donnee) => {
        const row = [
          donnee.idDonnee.toString(),
          donnee.timestamp.toISOString(),
          `"${donnee.capteur.nom}"`,
          `"${donnee.capteur.typeCapteur.nom}"`,
          `"${donnee.capteur.quartier.nom}"`,
          Number(donnee.valeur),
          donnee.unite,
          donnee.validee ? "Oui" : "Non",
          donnee.capteur.numeroSerie || "",
          `"${donnee.capteur.modele || ""}"`,
          `"${donnee.capteur.fabricant || ""}"`,
          donnee.capteur.longitude || "",
          donnee.capteur.latitude || "",
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="donnees_capteurs_${new Date().toISOString()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'export des données:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
