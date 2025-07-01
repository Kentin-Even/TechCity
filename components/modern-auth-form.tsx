"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOut, useSession } from "@/lib/auth-client";
import { User, LogOut } from "lucide-react";
import Link from "next/link";

export function ModernAuthForm() {
  const { data: session } = useSession();

  if (session) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Bienvenue !</CardTitle>
          <CardDescription>
            Connecté en tant que{" "}
            <span className="font-semibold">
              {session.user?.name || session.user?.email}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600">
            Vous êtes maintenant connecté à votre compte.
          </div>
          <Button
            onClick={async () => {
              await signOut();
              window.location.reload();
            }}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Authentification</CardTitle>
        <CardDescription>
          Connectez-vous ou créez un compte pour accéder à l&apos;application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href="/sign-in" className="block">
          <Button className="w-full" size="lg">
            Se connecter
          </Button>
        </Link>
        <Link href="/sign-up" className="block">
          <Button variant="outline" className="w-full" size="lg">
            Créer un compte
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
