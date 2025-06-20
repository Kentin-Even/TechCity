import { Metadata } from "next";
import RealtimeDashboard from "@/components/realtime-dashboard";

export const metadata: Metadata = {
  title: "Dashboard Temps Réel | Tech City IoT",
  description: "Monitoring en temps réel des capteurs IoT urbains",
};

export default function RealtimePage() {
  return <RealtimeDashboard />;
}
