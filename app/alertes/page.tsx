"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SeuilsPersonnalises from "@/components/seuils-personnalises";
import NotificationsPanel from "@/components/notifications-panel";
import { Bell, Settings } from "lucide-react";

export default function AlertesPage() {
  const [activeTab, setActiveTab] = useState("seuils");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gestion des Alertes</h1>
        <p className="text-gray-600">
          Configurez vos alertes personnalisées et consultez vos notifications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="seuils" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Seuils Personnalisés
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seuils" className="mt-6">
          <SeuilsPersonnalises />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsPanel maxHeight="600px" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
