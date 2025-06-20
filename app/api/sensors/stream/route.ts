import { NextRequest } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// Type pour les données streamées
interface SensorStreamData {
  id: string;
  capteurId: number;
  capteurNom: string;
  typeCapteur: string;
  valeur: number;
  unite: string;
  timestamp: string;
  quartier: string;
  coordonnees: {
    latitude: number;
    longitude: number;
  };
}

// Map pour garder trace des clients connectés
const clients = new Map<
  string,
  {
    controller: ReadableStreamDefaultController;
    clientId: string;
    lastSentId: bigint;
  }
>();

// Fonction pour envoyer des données à tous les clients
async function broadcastToClients() {
  if (clients.size === 0) return;

  try {
    // Récupérer les dernières données de tous les capteurs
    const latestData = await prisma.donneeCapteur.findMany({
      take: 50, // Limiter pour la performance
      orderBy: { timestamp: "desc" },
      include: {
        capteur: {
          include: {
            typeCapteur: true,
            quartier: true,
          },
        },
      },
      where: {
        timestamp: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // Dernières 10 minutes
        },
      },
    });

    // Formater les données pour le stream
    const formattedData: SensorStreamData[] = latestData.map((donnee) => ({
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

    // Envoyer à tous les clients connectés
    for (const [clientId, client] of clients.entries()) {
      try {
        // Filtrer les données nouvelles pour ce client
        const newData = formattedData.filter(
          (data) => BigInt(data.id) > client.lastSentId
        );

        if (newData.length > 0) {
          const message = `data: ${JSON.stringify({
            type: "sensor-data",
            data: newData,
            timestamp: new Date().toISOString(),
          })}\n\n`;

          client.controller.enqueue(new TextEncoder().encode(message));

          // Mettre à jour le dernier ID envoyé
          const maxId = Math.max(...newData.map((d) => Number(d.id)));
          client.lastSentId = BigInt(maxId);
        }

        // Envoyer un heartbeat périodique
        const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({
          timestamp: new Date().toISOString(),
          clients: clients.size,
        })}\n\n`;

        client.controller.enqueue(new TextEncoder().encode(heartbeat));
      } catch (error) {
        console.error(`Erreur envoi données client ${clientId}:`, error);
        // Supprimer le client déconnecté
        clients.delete(clientId);
      }
    }
  } catch (error) {
    console.error("Erreur lors du broadcast:", error);
  }
}

// Fonction pour envoyer les données des capteurs spécifiques
async function sendSensorUpdate(capteurId: number) {
  if (clients.size === 0) return;

  try {
    const sensorData = await prisma.donneeCapteur.findFirst({
      where: { idCapteur: capteurId },
      orderBy: { timestamp: "desc" },
      include: {
        capteur: {
          include: {
            typeCapteur: true,
            quartier: true,
          },
        },
      },
    });

    if (!sensorData) return;

    const formattedData: SensorStreamData = {
      id: sensorData.idDonnee.toString(),
      capteurId: sensorData.idCapteur,
      capteurNom: sensorData.capteur.nom,
      typeCapteur: sensorData.capteur.typeCapteur.nom,
      valeur: Number(sensorData.valeur),
      unite: sensorData.unite,
      timestamp: sensorData.timestamp.toISOString(),
      quartier: sensorData.capteur.quartier.nom,
      coordonnees: {
        latitude: Number(sensorData.capteur.latitude),
        longitude: Number(sensorData.capteur.longitude),
      },
    };

    const message = `data: ${JSON.stringify({
      type: "sensor-update",
      data: formattedData,
      timestamp: new Date().toISOString(),
    })}\n\n`;

    // Envoyer à tous les clients
    for (const [clientId, client] of clients.entries()) {
      try {
        client.controller.enqueue(new TextEncoder().encode(message));
      } catch (error) {
        console.error(`Erreur envoi update client ${clientId}:`, error);
        clients.delete(clientId);
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi sensor update:", error);
  }
}

// Démarrer le broadcast périodique
let broadcastInterval: NodeJS.Timeout;

function startBroadcast() {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
  }

  // Envoyer des données toutes les 5 secondes
  broadcastInterval = setInterval(broadcastToClients, 5000);
}

function stopBroadcast() {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
  }
}

// Route GET pour établir la connexion SSE
export async function GET() {
  const clientId = `client_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  console.log(`🔗 Nouvelle connexion SSE: ${clientId}`);

  // Créer le stream
  const stream = new ReadableStream({
    start(controller) {
      // Stocker le client
      clients.set(clientId, {
        controller,
        clientId,
        lastSentId: BigInt(0),
      });

      // Démarrer le broadcast si c'est le premier client
      if (clients.size === 1) {
        startBroadcast();
      }

      // Envoyer un message de connexion
      const welcomeMessage = `data: ${JSON.stringify({
        type: "connection",
        message: "Connexion SSE établie",
        clientId,
        timestamp: new Date().toISOString(),
      })}\n\n`;

      controller.enqueue(new TextEncoder().encode(welcomeMessage));

      // Envoyer immédiatement les dernières données
      broadcastToClients();
    },

    cancel() {
      console.log(`❌ Connexion SSE fermée: ${clientId}`);
      clients.delete(clientId);

      // Arrêter le broadcast si plus de clients
      if (clients.size === 0) {
        stopBroadcast();
      }
    },
  });

  // Headers pour SSE
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  return new Response(stream, { headers });
}

// Route POST pour déclencher des mises à jour manuelles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, capteurId } = body;

    switch (action) {
      case "broadcast":
        await broadcastToClients();
        return Response.json({
          success: true,
          message: "Broadcast déclenché",
          clients: clients.size,
        });

      case "sensor-update":
        if (!capteurId) {
          return Response.json(
            { success: false, error: "capteurId requis pour sensor-update" },
            { status: 400 }
          );
        }
        await sendSensorUpdate(capteurId);
        return Response.json({
          success: true,
          message: `Update capteur ${capteurId} envoyé`,
          clients: clients.size,
        });

      case "status":
        return Response.json({
          success: true,
          data: {
            connectedClients: clients.size,
            clientIds: Array.from(clients.keys()),
            broadcastActive: !!broadcastInterval,
          },
        });

      default:
        return Response.json(
          { success: false, error: "Action non supportée" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erreur route SSE POST:", error);
    return Response.json(
      {
        success: false,
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// Nettoyer au shutdown
process.on("SIGTERM", () => {
  stopBroadcast();
  clients.clear();
});

process.on("SIGINT", () => {
  stopBroadcast();
  clients.clear();
});

// Exporter la fonction pour usage externe
export { broadcastToClients, sendSensorUpdate };
