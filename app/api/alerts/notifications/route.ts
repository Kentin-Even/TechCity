import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { alertService } from "@/lib/alert-service";

// ✅ CACHE SIMPLE: Cache en mémoire pour éviter les requêtes répétées
const notificationsCache = new Map<
  string,
  {
    data: any;
    timestamp: number;
    ttl: number;
  }
>();

const CACHE_TTL = 30000; // 30 secondes de cache

// GET /api/alerts/notifications - Récupérer les notifications d'un utilisateur
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // ✅ VÉRIFIER LE CACHE
    const cacheKey = `notifications_${session.user.id}`;
    const cachedData = notificationsCache.get(cacheKey);
    const now = Date.now();

    if (cachedData && now - cachedData.timestamp < cachedData.ttl) {
      console.log(
        `📦 Cache hit pour notifications utilisateur ${session.user.id}`
      );
      const notifications = cachedData.data;

      // Compter les non lues
      const nonLues = notifications.filter(
        (n) => n.statut === "EN_ATTENTE" || n.statut === "ENVOYE"
      ).length;

      return NextResponse.json({
        success: true,
        data: notifications.slice(0, limit),
        meta: {
          total: notifications.length,
          nonLues,
        },
      });
    }

    // ✅ REQUÊTE BASE DE DONNÉES SEULEMENT SI PAS DE CACHE
    console.log(
      `🔍 Cache miss, requête DB pour notifications utilisateur ${session.user.id}`
    );
    const notifications = await alertService.getNotificationsNonLues(
      session.user.id
    );

    // ✅ METTRE EN CACHE
    notificationsCache.set(cacheKey, {
      data: notifications,
      timestamp: now,
      ttl: CACHE_TTL,
    });

    // Compter les non lues
    const nonLues = notifications.filter(
      (n) => n.statut === "EN_ATTENTE" || n.statut === "ENVOYE"
    ).length;

    return NextResponse.json({
      success: true,
      data: notifications.slice(0, limit),
      meta: {
        total: notifications.length,
        nonLues,
      },
    });
  } catch (error) {
    console.error("Erreur GET notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

// PUT /api/alerts/notifications - Marquer une notification comme lue
export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { idNotification, action } = body;

    if (action === "marquer_lu") {
      await alertService.marquerNotificationLue(
        idNotification,
        session.user.id
      );
    } else if (action === "marquer_toutes_lues") {
      // Marquer toutes les notifications comme lues
      const notifications = await alertService.getNotificationsNonLues(
        session.user.id
      );

      for (const notification of notifications) {
        await alertService.marquerNotificationLue(
          notification.idNotification,
          session.user.id
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notification(s) marquée(s) comme lue(s)",
    });
  } catch (error) {
    console.error("Erreur PUT notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la notification" },
      { status: 500 }
    );
  }
}
