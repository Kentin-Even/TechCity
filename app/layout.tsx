import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import NotificationStack from "@/components/notification-stack";
import NotificationsPanel from "@/components/notifications-panel";
import { GlobalSSEConnection } from "@/components/global-sse-connection";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tech City IoT - Dashboard",
  description: "Plateforme de monitoring IoT pour la ville intelligente",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Récupération de la session côté serveur
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster />
        {/* Connexion SSE globale pour les notifications et mises à jour */}
        <GlobalSSEConnection />
        <SidebarProvider>
          <AppSidebar session={session} />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex-1">
                  <h1 className="font-semibold">Tech City IoT</h1>
                </div>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
        <NotificationsPanel />

        {/* Système de notifications */}
        <NotificationStack />

        {/* Toaster pour les notifications toast */}
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
