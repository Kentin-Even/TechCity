import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";
import { checkAccess, Role } from "./lib/permissions";

// Routes qui nécessitent une authentification
const protectedRoutes = [
  "/dashboard",
  "/capteurs",
  "/quartiers",
  "/alertes",
  "/rapports",
  "/utilisateurs",
  "/analyses",
  "/notifications",
  "/suggestions",
  "/profil",
  "/profile",
  "/abonnements",
  "/donnees",
  "/projets",
  "/admin",
];

// Routes publiques (accessible sans authentification)
const publicRoutes = ["/", "/sign-in", "/sign-up", "/unauthorized"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si la route est publique
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Vérifier si la route nécessite une protection
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  try {
    // Vérifier la session utilisateur
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      // Rediriger vers la page de connexion si non authentifié
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Récupérer le rôle de l'utilisateur depuis la base de données
    // Note: Dans un vrai projet, vous devriez optimiser cela avec une cache
    const userResponse = await fetch(new URL("/api/user/me", request.url), {
      headers: {
        ...request.headers,
        cookie: request.headers.get("cookie") || "",
      },
    });

    if (!userResponse.ok) {
      const signInUrl = new URL("/sign-in", request.url);
      return NextResponse.redirect(signInUrl);
    }

    const userData = await userResponse.json();
    const userRole: Role = userData.role?.nom || "Citoyen";

    // Vérifier les permissions pour cette route
    if (!checkAccess(userRole, pathname)) {
      const unauthorizedUrl = new URL("/unauthorized", request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Erreur dans le middleware:", error);
    // En cas d'erreur, rediriger vers la page de connexion
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Faire correspondre toutes les routes sauf :
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
