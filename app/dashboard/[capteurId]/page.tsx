import { Metadata } from "next";
import CapteurDetailsPage from "@/components/capteur-details";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ capteurId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { capteurId } = await params;

  const capteurNames: Record<string, string> = {
    "1": "PM2.5 - Particules fines",
    "2": "CO2 - Dioxyde de carbone",
    "3": "Température",
    "4": "Humidité",
    "5": "Niveau sonore",
    "6": "Trafic routier",
  };

  const capteurName = capteurNames[capteurId] || "Capteur";

  return {
    title: `${capteurName} | Détails du capteur - Tech City IoT`,
    description: `Monitoring détaillé du capteur ${capteurName} avec données temps réel et historique`,
  };
}

export default async function CapteurDetailsPageRoute({ params }: Props) {
  const { capteurId } = await params;

  // Vérifier que l'ID du capteur est valide
  const validCapteurIds = ["1", "2", "3", "4", "5", "6"];
  if (!validCapteurIds.includes(capteurId)) {
    notFound();
  }

  return <CapteurDetailsPage capteurId={parseInt(capteurId)} />;
}
