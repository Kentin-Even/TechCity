import { NextRequest, NextResponse } from "next/server";
import { sensorSimulator } from "@/lib/sensor-simulator";

// GET - Obtenir le statut du simulateur
export async function GET() {
  try {
    const status = sensorSimulator.getStatus();
    return NextResponse.json({
      success: true,
      data: status,
      message: status.isRunning
        ? "Simulateur en cours d'exécution"
        : "Simulateur arrêté",
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du statut:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération du statut",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// POST - Démarrer ou arrêter le simulateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action || !["start", "stop"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action invalide. Utilisez "start" ou "stop"',
        },
        { status: 400 }
      );
    }

    if (action === "start") {
      await sensorSimulator.start();
      return NextResponse.json({
        success: true,
        message: "Simulateur démarré avec succès",
        data: sensorSimulator.getStatus(),
      });
    } else {
      sensorSimulator.stop();
      return NextResponse.json({
        success: true,
        message: "Simulateur arrêté avec succès",
        data: sensorSimulator.getStatus(),
      });
    }
  } catch (error) {
    console.error(`Erreur lors de l'action sur le simulateur:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'exécution de l'action",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
