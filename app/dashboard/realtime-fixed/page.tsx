import { Metadata } from "next";
import RealtimeDashboardFixed from "@/components/realtime-dashboard-fixed";

export const metadata: Metadata = {
  title: "Dashboard Temps Réel Corrigé | Tech City IoT",
  description:
    "Monitoring en temps réel des capteurs IoT urbains - Version corrigée",
};

export default function RealtimeFixedPage() {
  return <RealtimeDashboardFixed />;
}
