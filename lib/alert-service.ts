import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

// Types pour le service d'alertes
export interface AlertePersonnalisee {
  idSeuil: number;
  seuilMin?: number;
  seuilMax?: number;
  actif: boolean;
  idTypeCapteur: number;
  idUtilisateur: string;
  typeCapteur: {
    nom: string;
    unite: string;
  };
}

export interface NotificationAlerte {
  titre: string;
  message: string;
  niveauGravite: "FAIBLE" | "MOYEN" | "ELEVE" | "CRITIQUE";
  idUtilisateur: string;
  capteurId: number;
  valeurMesuree: number;
  seuilDeclenche: number;
}

class AlertService {
  // Vérifier si une valeur dépasse les seuils personnalisés d'un utilisateur
  async verifierSeuilsPersonnalises(
    idCapteur: number,
    valeur: number,
    typeCapteurId: number
  ): Promise<void> {
    try {
      // ✅ OPTIMISATION: Requêtes séparées plus efficaces

      // 1. D'abord, trouver le quartier du capteur
      const capteur = await prisma.capteur.findUnique({
        where: { idCapteur },
        select: { idQuartier: true },
      });

      if (!capteur) return;

      // 2. Trouver les utilisateurs abonnés à ce quartier
      const abonnementsActifs = await prisma.abonnementQuartier.findMany({
        where: {
          idQuartier: capteur.idQuartier,
          actif: true,
        },
        select: { idUtilisateur: true },
      });

      if (abonnementsActifs.length === 0) return;

      const utilisateursAbonnes = abonnementsActifs.map((a) => a.idUtilisateur);

      // 3. Récupérer les seuils personnalisés actifs pour ces utilisateurs
      const seuilsPersonnalises = await prisma.seuilPersonnalise.findMany({
        where: {
          idTypeCapteur: typeCapteurId,
          actif: true,
          idUtilisateur: {
            in: utilisateursAbonnes,
          },
        },
        include: {
          typeCapteur: {
            select: { nom: true },
          },
        },
      });

      for (const seuil of seuilsPersonnalises) {
        // Vérifier si le seuil est dépassé
        const seuilDepasse = this.verifierDepassementSeuil(
          valeur,
          seuil.seuilMin ? Number(seuil.seuilMin) : null,
          seuil.seuilMax ? Number(seuil.seuilMax) : null
        );

        if (seuilDepasse) {
          await this.creerAlerte({
            idCapteur,
            idUtilisateur: seuil.idUtilisateur,
            valeurMesuree: valeur,
            seuilDeclenche: seuilDepasse.seuilDeclenche,
            niveauGravite: seuilDepasse.gravite,
            typeCapteur: seuil.typeCapteur.nom,
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification des seuils:", error);
    }
  }

  // Vérifier si une valeur dépasse les seuils définis
  private verifierDepassementSeuil(
    valeur: number,
    seuilMin?: number | null,
    seuilMax?: number | null
  ): {
    seuilDeclenche: number;
    gravite: "FAIBLE" | "MOYEN" | "ELEVE" | "CRITIQUE";
  } | null {
    if (seuilMax && valeur > seuilMax) {
      // Déterminer la gravité basée sur le dépassement
      const depassement = ((valeur - seuilMax) / seuilMax) * 100;
      let gravite: "FAIBLE" | "MOYEN" | "ELEVE" | "CRITIQUE" = "MOYEN";

      if (depassement > 50) gravite = "CRITIQUE";
      else if (depassement > 25) gravite = "ELEVE";
      else if (depassement > 10) gravite = "MOYEN";
      else gravite = "FAIBLE";

      return { seuilDeclenche: seuilMax, gravite };
    }

    if (seuilMin && valeur < seuilMin) {
      return { seuilDeclenche: seuilMin, gravite: "MOYEN" };
    }

    return null;
  }

  // Créer une alerte et sa notification
  private async creerAlerte({
    idCapteur,
    idUtilisateur,
    valeurMesuree,
    seuilDeclenche,
    niveauGravite,
    typeCapteur,
  }: {
    idCapteur: number;
    idUtilisateur: string;
    valeurMesuree: number;
    seuilDeclenche: number;
    niveauGravite: "FAIBLE" | "MOYEN" | "ELEVE" | "CRITIQUE";
    typeCapteur: string;
  }): Promise<void> {
    try {
      // Vérifier s'il n'y a pas déjà une alerte récente (éviter le spam)
      const alerteRecente = await prisma.alerte.findFirst({
        where: {
          idCapteur,
          idUtilisateur,
          statut: "OUVERTE",
          dateCreation: {
            gte: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes
          },
        },
      });

      if (alerteRecente) {
        console.log(
          `Alerte récente trouvée pour le capteur ${idCapteur}, pas de nouvelle alerte créée`
        );
        return;
      }

      // Récupérer les informations du capteur et du quartier
      const capteur = await prisma.capteur.findUnique({
        where: { idCapteur },
        include: {
          quartier: true,
          typeCapteur: true,
        },
      });

      if (!capteur) return;

      // Générer un ID unique pour l'alerte
      const maxAlerte = await prisma.alerte.findFirst({
        orderBy: { idAlerte: "desc" },
      });
      const newAlerteId = (maxAlerte?.idAlerte || 0) + 1;

      // Créer l'alerte
      const alerte = await prisma.alerte.create({
        data: {
          idAlerte: newAlerteId,
          type: "SEUIL_DEPASSE",
          niveauGravite,
          message: `Seuil de ${typeCapteur} dépassé dans le quartier ${capteur.quartier.nom}`,
          dateCreation: new Date(),
          statut: "OUVERTE",
          valeurMesuree,
          seuilDeclenche,
          idUtilisateur,
          idCapteur,
        },
      });

      // Créer la notification
      await this.creerNotification({
        titre: `🚨 Alerte ${typeCapteur} - ${capteur.quartier.nom}`,
        message: `La valeur de ${typeCapteur} (${valeurMesuree}${capteur.typeCapteur.unite}) a dépassé votre seuil personnalisé (${seuilDeclenche}${capteur.typeCapteur.unite}) dans le quartier ${capteur.quartier.nom}.`,
        idUtilisateur,
        idAlerte: alerte.idAlerte,
      });

      console.log(
        `✅ Alerte créée pour l'utilisateur ${idUtilisateur} - Capteur ${idCapteur}`
      );
    } catch (error) {
      console.error("Erreur lors de la création de l'alerte:", error);
    }
  }

  // Créer une notification
  private async creerNotification({
    titre,
    message,
    idUtilisateur,
    idAlerte,
  }: {
    titre: string;
    message: string;
    idUtilisateur: string;
    idAlerte: number;
  }): Promise<void> {
    try {
      // Générer un ID unique pour la notification
      const maxNotification = await prisma.notification.findFirst({
        orderBy: { idNotification: "desc" },
      });
      const newNotificationId = (maxNotification?.idNotification || 0) + 1;

      await prisma.notification.create({
        data: {
          idNotification: newNotificationId,
          titre,
          message,
          dateEnvoi: new Date(),
          type: "PUSH", // Notification dans l'application
          statut: "EN_ATTENTE",
          idAlerte,
          idUtilisateur,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la création de la notification:", error);
    }
  }

  // Récupérer les alertes d'un utilisateur
  async getAlertesUtilisateur(
    idUtilisateur: string,
    statut?: "OUVERTE" | "EN_COURS" | "RESOLUE" | "FERMEE"
  ) {
    return prisma.alerte.findMany({
      where: {
        idUtilisateur,
        ...(statut && { statut }),
      },
      include: {
        capteur: {
          include: {
            quartier: true,
            typeCapteur: true,
          },
        },
        notifications: true,
      },
      orderBy: {
        dateCreation: "desc",
      },
    });
  }

  // Récupérer les notifications non lues d'un utilisateur
  async getNotificationsNonLues(idUtilisateur: string) {
    // ✅ OPTIMISATION: Requête simplifiée avec seulement les données nécessaires
    return prisma.notification.findMany({
      where: {
        idUtilisateur,
        statut: {
          in: ["EN_ATTENTE", "ENVOYE"],
        },
      },
      select: {
        idNotification: true,
        titre: true,
        message: true,
        dateEnvoi: true,
        type: true,
        statut: true,
        alerte: {
          select: {
            niveauGravite: true,
            valeurMesuree: true,
            seuilDeclenche: true,
            capteur: {
              select: {
                idCapteur: true,
                nom: true,
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
            },
          },
        },
      },
      orderBy: {
        dateEnvoi: "desc",
      },
      take: 20,
    });
  }

  // Marquer une notification comme lue
  async marquerNotificationLue(idNotification: number, idUtilisateur: string) {
    return prisma.notification.updateMany({
      where: {
        idNotification,
        idUtilisateur,
      },
      data: {
        statut: "LU",
      },
    });
  }

  // Résoudre une alerte
  async resoudreAlerte(idAlerte: number, idUtilisateur: string) {
    return prisma.alerte.updateMany({
      where: {
        idAlerte,
        idUtilisateur,
      },
      data: {
        statut: "RESOLUE",
        dateResolution: new Date(),
      },
    });
  }
}

export const alertService = new AlertService();
