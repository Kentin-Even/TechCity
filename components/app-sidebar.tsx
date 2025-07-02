"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChartColumn,
  Building2,
  MessageCircle,
  Bell,
  Settings,
  Monitor,
  Database,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/sidebar/nav-user";
import { usePermissions } from "@/lib/hooks/usePermissions";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: ChartColumn,
  },
  {
    title: "Quartiers",
    url: "/quartiers",
    icon: Building2,
  },
  {
    title: "Alertes",
    url: "/alertes",
    icon: Bell,
  },
  {
    title: "Suggestions",
    url: "/suggestions",
    icon: MessageCircle,
  },
];

const gestionnaireNavigationItems = [
  {
    title: "Capteurs",
    url: "/capteurs",
    icon: Monitor,
  },
];

const adminNavigationItems = [
  {
    title: "Administration",
    url: "/admin",
    icon: Settings,
  },
  {
    title: "Capteurs",
    url: "/capteurs",
    icon: Monitor,
  },
];

const chercheurNavigationItems = [
  {
    title: "Données",
    url: "/donnees",
    icon: Database,
  },
];

export function AppSidebar({ session, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const { isAdmin, isGestionnaire, isChercheur } = usePermissions();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="font-semibold text-lg">Tech City IoT</h2>
            <p className="text-sm text-muted-foreground">
              Plateforme de monitoring urbain
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation principale */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.url ||
                      pathname.startsWith(item.url + "/")
                    }
                  >
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation administrateur */}
        {isAdmin() && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        pathname === item.url ||
                        pathname.startsWith(item.url + "/")
                      }
                    >
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {isGestionnaire() && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestionnaire</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {gestionnaireNavigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        pathname === item.url ||
                        pathname.startsWith(item.url + "/")
                      }
                    >
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {isChercheur() && (
          <SidebarGroup>
            <SidebarGroupLabel>Chercheur</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chercheurNavigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        pathname === item.url ||
                        pathname.startsWith(item.url + "/")
                      }
                    >
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <NavUser
          user={
            session?.user
              ? {
                  name: session.user.name,
                  email: session.user.email,
                  image: session.user.image || undefined,
                }
              : undefined
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
