import { NextRequest } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { alertService } from "@/lib/alert-service";

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

// ✅ NOUVEAU: Variable globale pour garder trace du dernier ID envoyé à tous les clients
let globalLastSentId: bigint = BigInt(0);

// Fonction pour envoyer des données à tous les clients
async function broadcastToClients() {
  if (clients.size === 0) return;

  try {
    // ✅ AMÉLIORATION: Récupérer uniquement les nouvelles données depuis le dernier envoi global
    const latestData = await prisma.donneeCapteur.findMany({
      where: {
        idDonnee: {
          gt: globalLastSentId,
        },
      },
      orderBy: { idDonnee: "asc" },
      take: 50, // Limiter pour la performance
      include: {
        capteur: {
          include: {
            typeCapteur: true,
            quartier: true,
          },
        },
      },
    });

    if (latestData.length === 0) {
      console.log("📊 Aucune nouvelle donnée à envoyer");
      return;
    }

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

    console.log(`📊 Envoi de ${formattedData.length} nouvelles données`);

    // Envoyer à tous les clients connectés
    for (const [clientId, client] of clients.entries()) {
      try {
        const message = `data: ${JSON.stringify({
          type: "sensor-data",
          data: formattedData,
          timestamp: new Date().toISOString(),
        })}\n\n`;

        client.controller.enqueue(new TextEncoder().encode(message));

        // Mettre à jour le dernier ID envoyé pour ce client
        const maxId = latestData[latestData.length - 1].idDonnee;
        client.lastSentId = maxId;
      } catch (error) {
        console.error(`Erreur envoi données client ${clientId}:`, error);
        // Supprimer le client déconnecté
        clients.delete(clientId);
      }
    }

    // ✅ IMPORTANT: Mettre à jour le dernier ID envoyé globalement
    globalLastSentId = latestData[latestData.length - 1].idDonnee;
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

    // 🚨 NOUVEAU: Vérifier les seuils personnalisés des utilisateurs
    await alertService.verifierSeuilsPersonnalises(
      sensorData.idCapteur,
      Number(sensorData.valeur),
      sensorData.capteur.idTypeCapteur
    );

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

    console.log(
      `📡 Envoi sensor-update - Capteur ${capteurId}: ${formattedData.valeur} ${formattedData.unite}`
    );

    // Envoyer à tous les clients
    for (const [clientId, client] of clients.entries()) {
      try {
        client.controller.enqueue(new TextEncoder().encode(message));
        console.log(`✅ Update envoyé au client ${clientId}`);
      } catch (error) {
        console.error(`Erreur envoi update client ${clientId}:`, error);
        clients.delete(clientId);
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi sensor update:", error);
  }
}

// ✅ CORRECTION: Fonction pour détecter et envoyer automatiquement les nouvelles données
async function checkAndSendNewData() {
  if (clients.size === 0) return;

  try {
    // ✅ AMÉLIORATION: Récupérer uniquement les données plus récentes que le dernier ID envoyé
    const recentData = await prisma.donneeCapteur.findMany({
      where: {
        idDonnee: {
          gt: globalLastSentId,
        },
      },
      orderBy: { idDonnee: "asc" },
      take: 100, // Limiter pour éviter de surcharger
      include: {
        capteur: {
          include: {
            typeCapteur: true,
            quartier: true,
          },
        },
      },
    });

    if (recentData.length > 0) {
      console.log(`🔍 Détection de ${recentData.length} NOUVELLES données`);

      // Formater les données
      const formattedData: SensorStreamData[] = recentData.map((donnee) => ({
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

      const message = `data: ${JSON.stringify({
        type: "sensor-data",
        data: formattedData,
        timestamp: new Date().toISOString(),
      })}\n\n`;

      console.log(`📡 Broadcast de ${formattedData.length} nouvelles données`);

      // Envoyer à tous les clients connectés
      for (const [clientId, client] of clients.entries()) {
        try {
          client.controller.enqueue(new TextEncoder().encode(message));
          // Mettre à jour le lastSentId du client
          client.lastSentId = recentData[recentData.length - 1].idDonnee;
        } catch (error) {
          console.error(
            `Erreur envoi nouvelles données client ${clientId}:`,
            error
          );
          clients.delete(clientId);
        }
      }

      // ✅ IMPORTANT: Mettre à jour le dernier ID envoyé globalement
      globalLastSentId = recentData[recentData.length - 1].idDonnee;
    }
  } catch (error) {
    console.error(
      "Erreur lors de la vérification des nouvelles données:",
      error
    );
  }
}

// ✅ CORRECTION: Envoyer des heartbeats périodiques
async function sendHeartbeat() {
  if (clients.size === 0) return;

  const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({
    timestamp: new Date().toISOString(),
    clients: clients.size,
  })}\n\n`;

  console.log(`💓 Heartbeat envoyé à ${clients.size} clients`);

  for (const [clientId, client] of clients.entries()) {
    try {
      client.controller.enqueue(new TextEncoder().encode(heartbeat));
    } catch (error) {
      console.error(`Erreur envoi heartbeat client ${clientId}:`, error);
      clients.delete(clientId);
    }
  }
}

// Démarrer le broadcast périodique
let broadcastInterval: NodeJS.Timeout;
let heartbeatInterval: NodeJS.Timeout;

function startBroadcast() {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
  }
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  console.log("🚀 Démarrage du broadcast SSE");
  console.log("   🔍 Vérification nouvelles données: toutes les 5 secondes");
  console.log("   💓 Heartbeat: toutes les 30 secondes");

  // ✅ CORRECTION: Utiliser la nouvelle fonction pour détecter les nouvelles données
  // Réduire la fréquence à 5 secondes au lieu de 3
  broadcastInterval = setInterval(checkAndSendNewData, 5000);

  // Heartbeat moins fréquent : toutes les 30 secondes au lieu de 5
  heartbeatInterval = setInterval(sendHeartbeat, 30000);
}

function stopBroadcast() {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
  }
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
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
    async start(controller) {
      // Stocker le client
      clients.set(clientId, {
        controller,
        clientId,
        lastSentId: BigInt(0),
      });

      // Démarrer le broadcast si c'est le premier client
      if (clients.size === 1) {
        // ✅ NOUVEAU: Initialiser globalLastSentId avec la dernière donnée existante
        try {
          const lastData = await prisma.donneeCapteur.findFirst({
            orderBy: { idDonnee: "desc" },
          });
          if (lastData) {
            globalLastSentId = lastData.idDonnee;
            console.log(`🔄 Initialisé globalLastSentId à ${globalLastSentId}`);
          }
        } catch (error) {
          console.error(
            "Erreur lors de l'initialisation de globalLastSentId:",
            error
          );
        }

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

      // ✅ AMÉLIORATION: Envoyer les dernières données disponibles pour chaque capteur
      try {
        // Récupérer la liste des capteurs uniques
        const capteurs = await prisma.capteur.findMany({
          select: { idCapteur: true },
        });

        // Récupérer la dernière donnée pour chaque capteur
        const lastDataPromises = capteurs.map((capteur) =>
          prisma.donneeCapteur.findFirst({
            where: { idCapteur: capteur.idCapteur },
            orderBy: { timestamp: "desc" },
            include: {
              capteur: {
                include: {
                  typeCapteur: true,
                  quartier: true,
                },
              },
            },
          })
        );

        const lastDataResults = await Promise.all(lastDataPromises);
        const lastDataPerSensor = lastDataResults.filter(
          (data) => data !== null
        );

        if (lastDataPerSensor.length > 0) {
          const formattedData: SensorStreamData[] = lastDataPerSensor.map(
            (donnee) => ({
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
            })
          );

          const initialDataMessage = `data: ${JSON.stringify({
            type: "sensor-data",
            data: formattedData,
            timestamp: new Date().toISOString(),
          })}\n\n`;

          controller.enqueue(new TextEncoder().encode(initialDataMessage));
          console.log(
            `📊 Envoyé les dernières données de ${formattedData.length} capteurs au nouveau client`
          );

          // Mettre à jour le lastSentId du client avec la plus grande ID
          const maxId = Math.max(...formattedData.map((d) => Number(d.id)));
          clients.get(clientId)!.lastSentId = BigInt(maxId);
        }
      } catch (error) {
        console.error("Erreur lors de l'envoi des données initiales:", error);
      }
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
