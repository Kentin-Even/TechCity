-- CreateEnum
CREATE TYPE "StatutProjet" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'TERMINE', 'SUSPENDU', 'ANNULE');

-- CreateEnum
CREATE TYPE "TypeAnalyse" AS ENUM ('DESCRIPTIVE', 'PREDICTIVE', 'PRESCRIPTIVE', 'DIAGNOSTIC');

-- CreateEnum
CREATE TYPE "StatutCapteur" AS ENUM ('ACTIF', 'INACTIF', 'MAINTENANCE', 'DEFAILLANT');

-- CreateEnum
CREATE TYPE "NiveauGravite" AS ENUM ('FAIBLE', 'MOYEN', 'ELEVE', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "StatutAlerte" AS ENUM ('OUVERTE', 'EN_COURS', 'RESOLUE', 'FERMEE');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'SYSTEME');

-- CreateEnum
CREATE TYPE "StatutNotification" AS ENUM ('EN_ATTENTE', 'ENVOYE', 'ECHEC', 'LU');

-- CreateEnum
CREATE TYPE "TypeRapport" AS ENUM ('JOURNALIER', 'HEBDOMADAIRE', 'MENSUEL', 'ANNUEL', 'PERSONNALISE');

-- CreateEnum
CREATE TYPE "FormatRapport" AS ENUM ('PDF', 'EXCEL', 'CSV', 'JSON');

-- CreateEnum
CREATE TYPE "StatutRapport" AS ENUM ('EN_COURS', 'TERMINE', 'ECHEC');

-- CreateEnum
CREATE TYPE "PrioriteSuggestion" AS ENUM ('FAIBLE', 'MOYENNE', 'ELEVEE', 'URGENTE');

-- CreateEnum
CREATE TYPE "StatutSuggestion" AS ENUM ('NOUVELLE', 'EN_COURS', 'APPROUVEE', 'REJETEE', 'IMPLEMENTEE');

-- CreateEnum
CREATE TYPE "CategorieSuggestion" AS ENUM ('INFRASTRUCTURE', 'ENVIRONNEMENT', 'SECURITE', 'AMELIORATION', 'BUG');

-- CreateEnum
CREATE TYPE "TypeAlerte" AS ENUM ('SEUIL_DEPASSE', 'CAPTEUR_DEFAILLANT', 'MAINTENANCE', 'TOUTES');

-- CreateEnum
CREATE TYPE "StatutAnalyse" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ECHEC');

-- CreateEnum
CREATE TYPE "RoleProjet" AS ENUM ('CHEF_PROJET', 'COLLABORATEUR', 'OBSERVATEUR', 'CONTRIBUTEUR');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "idRole" SERIAL NOT NULL,
    "nom" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "role_pkey" PRIMARY KEY ("idRole")
);

-- CreateTable
CREATE TABLE "quartier" (
    "idQuartier" INTEGER NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "longitude" DECIMAL(10,8) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "superficie" DECIMAL(10,2),

    CONSTRAINT "quartier_pkey" PRIMARY KEY ("idQuartier")
);

-- CreateTable
CREATE TABLE "typeCapteur" (
    "idTypeCapteur" INTEGER NOT NULL,
    "nom" VARCHAR(50) NOT NULL,
    "unite" VARCHAR(20) NOT NULL,
    "seuilMin" DECIMAL(10,2),
    "seuilMax" DECIMAL(10,2),
    "plageMin" DECIMAL(10,2),
    "plageMax" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "typeCapteur_pkey" PRIMARY KEY ("idTypeCapteur")
);

-- CreateTable
CREATE TABLE "projetCollaboratif" (
    "idProjet" INTEGER NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "objectif" TEXT,
    "statut" "StatutProjet",
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "budget" DECIMAL(12,2),
    "resultats" TEXT,

    CONSTRAINT "projetCollaboratif_pkey" PRIMARY KEY ("idProjet")
);

-- CreateTable
CREATE TABLE "analyse" (
    "idAnalyse" INTEGER NOT NULL,
    "typeAnalyse" "TypeAnalyse",
    "algorithme" VARCHAR(100),
    "resultats" TEXT,
    "parametres" JSONB,
    "dateAnalyse" TIMESTAMP(3),
    "dureeExecution" INTEGER,
    "precisionModele" DECIMAL(5,2),
    "nbDonnees" INTEGER,
    "erreurs" TEXT,

    CONSTRAINT "analyse_pkey" PRIMARY KEY ("idAnalyse")
);

-- CreateTable
CREATE TABLE "utilisateur" (
    "idUtilisateur" TEXT NOT NULL,
    "nom" VARCHAR(50),
    "prenom" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "emailVerified" BOOLEAN DEFAULT false,
    "image" TEXT,
    "password" VARCHAR(255),
    "telephone" VARCHAR(20),
    "active" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "idRole" INTEGER DEFAULT 3,

    CONSTRAINT "utilisateur_pkey" PRIMARY KEY ("idUtilisateur")
);

-- CreateTable
CREATE TABLE "capteur" (
    "idCapteur" INTEGER NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "longitude" DECIMAL(10,8),
    "latitude" DECIMAL(10,8),
    "adresseInstallation" VARCHAR(200),
    "dateInstallation" TIMESTAMP(3),
    "statut" "StatutCapteur" NOT NULL,
    "modele" VARCHAR(100),
    "fabricant" VARCHAR(100),
    "numeroSerie" VARCHAR(50),
    "versionFirmware" VARCHAR(50),
    "derniereMaintenance" TIMESTAMP(3),
    "frequenceCapture" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "idTypeCapteur" INTEGER NOT NULL,
    "idQuartier" INTEGER NOT NULL,

    CONSTRAINT "capteur_pkey" PRIMARY KEY ("idCapteur")
);

-- CreateTable
CREATE TABLE "donneeCapteur" (
    "idDonnee" BIGINT NOT NULL,
    "valeur" DECIMAL(15,5) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "unite" VARCHAR(20) NOT NULL,
    "validee" BOOLEAN,
    "idCapteur" INTEGER NOT NULL,

    CONSTRAINT "donneeCapteur_pkey" PRIMARY KEY ("idDonnee")
);

-- CreateTable
CREATE TABLE "alerte" (
    "idAlerte" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "niveauGravite" "NiveauGravite" NOT NULL,
    "message" TEXT,
    "dateCreation" TIMESTAMP(3),
    "dateResolution" TIMESTAMP(3),
    "statut" "StatutAlerte",
    "valeurMesuree" DECIMAL(15,5),
    "seuilDeclenche" DECIMAL(10,2) NOT NULL,
    "idUtilisateur" TEXT,
    "idCapteur" INTEGER NOT NULL,

    CONSTRAINT "alerte_pkey" PRIMARY KEY ("idAlerte")
);

-- CreateTable
CREATE TABLE "notification" (
    "idNotification" INTEGER NOT NULL,
    "titre" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "dateEnvoi" TIMESTAMP(3),
    "type" "TypeNotification" NOT NULL,
    "statut" "StatutNotification",
    "destinataire" VARCHAR(100),
    "tentative" INTEGER,
    "idAlerte" INTEGER NOT NULL,
    "idUtilisateur" TEXT NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("idNotification")
);

-- CreateTable
CREATE TABLE "rapport" (
    "idRapport" INTEGER NOT NULL,
    "titre" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "TypeRapport",
    "periodeDebut" TIMESTAMP(3),
    "periodeFin" TIMESTAMP(3),
    "format" "FormatRapport",
    "statut" "StatutRapport",
    "createdAt" TIMESTAMP(3),
    "taille" INTEGER,
    "cheminFichier" VARCHAR(500),
    "public" BOOLEAN,
    "idUtilisateur" TEXT NOT NULL,

    CONSTRAINT "rapport_pkey" PRIMARY KEY ("idRapport")
);

-- CreateTable
CREATE TABLE "suggestion" (
    "idSuggestion" INTEGER NOT NULL,
    "titre" VARCHAR(200) NOT NULL,
    "priorite" "PrioriteSuggestion" NOT NULL,
    "statut" "StatutSuggestion" NOT NULL,
    "categorie" "CategorieSuggestion" NOT NULL,
    "dateCreation" TIMESTAMP(3),
    "dateTraitement" TIMESTAMP(3),
    "reponse" TEXT,
    "votes" INTEGER,
    "idQuartier" INTEGER,
    "idUtilisateur" TEXT NOT NULL,

    CONSTRAINT "suggestion_pkey" PRIMARY KEY ("idSuggestion")
);

-- CreateTable
CREATE TABLE "seuilPersonnalise" (
    "idSeuil" INTEGER NOT NULL,
    "seuilMin" DECIMAL(10,2),
    "seuilMax" DECIMAL(10,2),
    "actif" BOOLEAN,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "idTypeCapteur" INTEGER NOT NULL,
    "idUtilisateur" TEXT NOT NULL,

    CONSTRAINT "seuilPersonnalise_pkey" PRIMARY KEY ("idSeuil")
);

-- CreateTable
CREATE TABLE "abonnementQuartier" (
    "idUtilisateur" TEXT NOT NULL,
    "idQuartier" INTEGER NOT NULL,
    "actif" BOOLEAN,
    "dateAbonnement" TIMESTAMP(3),
    "typeAlerte" "TypeAlerte",

    CONSTRAINT "abonnementQuartier_pkey" PRIMARY KEY ("idUtilisateur","idQuartier")
);

-- CreateTable
CREATE TABLE "faitObjetDe" (
    "idCapteur" INTEGER NOT NULL,
    "idAnalyse" INTEGER NOT NULL,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "statut" "StatutAnalyse",

    CONSTRAINT "faitObjetDe_pkey" PRIMARY KEY ("idCapteur","idAnalyse")
);

-- CreateTable
CREATE TABLE "SeBaseSur" (
    "idRapport" INTEGER NOT NULL,
    "idAnalyse" INTEGER NOT NULL,
    "ordre" INTEGER,
    "commentaire" TEXT,

    CONSTRAINT "SeBaseSur_pkey" PRIMARY KEY ("idRapport","idAnalyse")
);

-- CreateTable
CREATE TABLE "participationProjet" (
    "idUtilisateur" TEXT NOT NULL,
    "idProjet" INTEGER NOT NULL,
    "dateParticipation" TIMESTAMP(3),
    "roleProjet" "RoleProjet",
    "actif" BOOLEAN,

    CONSTRAINT "participationProjet_pkey" PRIMARY KEY ("idUtilisateur","idProjet")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "role_nom_key" ON "role"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "quartier_nom_key" ON "quartier"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "typeCapteur_nom_key" ON "typeCapteur"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_email_key" ON "utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "capteur_numeroSerie_key" ON "capteur"("numeroSerie");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateur"("idUtilisateur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateur"("idUtilisateur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilisateur" ADD CONSTRAINT "utilisateur_idRole_fkey" FOREIGN KEY ("idRole") REFERENCES "role"("idRole") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capteur" ADD CONSTRAINT "capteur_idTypeCapteur_fkey" FOREIGN KEY ("idTypeCapteur") REFERENCES "typeCapteur"("idTypeCapteur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capteur" ADD CONSTRAINT "capteur_idQuartier_fkey" FOREIGN KEY ("idQuartier") REFERENCES "quartier"("idQuartier") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donneeCapteur" ADD CONSTRAINT "donneeCapteur_idCapteur_fkey" FOREIGN KEY ("idCapteur") REFERENCES "capteur"("idCapteur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerte" ADD CONSTRAINT "alerte_idUtilisateur_fkey" FOREIGN KEY ("idUtilisateur") REFERENCES "utilisateur"("idUtilisateur") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerte" ADD CONSTRAINT "alerte_idCapteur_fkey" FOREIGN KEY ("idCapteur") REFERENCES "capteur"("idCapteur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_idAlerte_fkey" FOREIGN KEY ("idAlerte") REFERENCES "alerte"("idAlerte") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_idUtilisateur_fkey" FOREIGN KEY ("idUtilisateur") REFERENCES "utilisateur"("idUtilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapport" ADD CONSTRAINT "rapport_idUtilisateur_fkey" FOREIGN KEY ("idUtilisateur") REFERENCES "utilisateur"("idUtilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion" ADD CONSTRAINT "suggestion_idQuartier_fkey" FOREIGN KEY ("idQuartier") REFERENCES "quartier"("idQuartier") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestion" ADD CONSTRAINT "suggestion_idUtilisateur_fkey" FOREIGN KEY ("idUtilisateur") REFERENCES "utilisateur"("idUtilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seuilPersonnalise" ADD CONSTRAINT "seuilPersonnalise_idTypeCapteur_fkey" FOREIGN KEY ("idTypeCapteur") REFERENCES "typeCapteur"("idTypeCapteur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seuilPersonnalise" ADD CONSTRAINT "seuilPersonnalise_idUtilisateur_fkey" FOREIGN KEY ("idUtilisateur") REFERENCES "utilisateur"("idUtilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnementQuartier" ADD CONSTRAINT "abonnementQuartier_idUtilisateur_fkey" FOREIGN KEY ("idUtilisateur") REFERENCES "utilisateur"("idUtilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnementQuartier" ADD CONSTRAINT "abonnementQuartier_idQuartier_fkey" FOREIGN KEY ("idQuartier") REFERENCES "quartier"("idQuartier") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faitObjetDe" ADD CONSTRAINT "faitObjetDe_idCapteur_fkey" FOREIGN KEY ("idCapteur") REFERENCES "capteur"("idCapteur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faitObjetDe" ADD CONSTRAINT "faitObjetDe_idAnalyse_fkey" FOREIGN KEY ("idAnalyse") REFERENCES "analyse"("idAnalyse") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeBaseSur" ADD CONSTRAINT "SeBaseSur_idRapport_fkey" FOREIGN KEY ("idRapport") REFERENCES "rapport"("idRapport") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeBaseSur" ADD CONSTRAINT "SeBaseSur_idAnalyse_fkey" FOREIGN KEY ("idAnalyse") REFERENCES "analyse"("idAnalyse") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participationProjet" ADD CONSTRAINT "participationProjet_idUtilisateur_fkey" FOREIGN KEY ("idUtilisateur") REFERENCES "utilisateur"("idUtilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participationProjet" ADD CONSTRAINT "participationProjet_idProjet_fkey" FOREIGN KEY ("idProjet") REFERENCES "projetCollaboratif"("idProjet") ON DELETE RESTRICT ON UPDATE CASCADE;
