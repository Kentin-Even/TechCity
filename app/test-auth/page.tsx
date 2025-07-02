"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestAuthPage() {
  const { user, loading, isAuthenticated, userRole } = useAuth();
  const { isAdmin, hasAccess } = usePermissions();
  const [apiResponse, setApiResponse] = useState<{
    status?: number;
    ok?: boolean;
    data?: any;
    error?: string;
  } | null>(null);
  const [cookies, setCookies] = useState<string>("");

  useEffect(() => {
    // Récupérer les cookies du navigateur
    setCookies(document.cookie);
  }, []);

  const testAPI = async () => {
    try {
      const response = await fetch("/api/user/me", {
        method: "GET",
        credentials: "include", // Important pour inclure les cookies
      });

      const data = await response.json();
      setApiResponse({
        status: response.status,
        ok: response.ok,
        data: data,
      });
    } catch (error) {
      setApiResponse({
        error: error.message,
      });
    }
  };

  const testAdminAPI = async () => {
    try {
      const response = await fetch("/api/admin/users?page=1&limit=5", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      setApiResponse({
        status: response.status,
        ok: response.ok,
        data: data,
      });
    } catch (error) {
      setApiResponse({
        error: error.message,
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">
        🔍 Test d&apos;Authentification
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* État de l'authentification */}
        <Card>
          <CardHeader>
            <CardTitle>État de l&apos;Authentification (Client)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Loading:</strong> {loading ? "✅ Oui" : "❌ Non"}
              </p>
              <p>
                <strong>Authentifié:</strong>{" "}
                {isAuthenticated ? "✅ Oui" : "❌ Non"}
              </p>
              <p>
                <strong>Est Admin:</strong> {isAdmin() ? "✅ Oui" : "❌ Non"}
              </p>
              <p>
                <strong>Rôle:</strong> {userRole || "N/A"}
              </p>
              <p>
                <strong>Accès /admin:</strong>{" "}
                {hasAccess("/admin") ? "✅ Oui" : "❌ Non"}
              </p>
            </div>

            {user && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h4 className="font-semibold">Informations Utilisateur:</h4>
                <pre className="text-sm mt-2 overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>Cookies du Navigateur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cookies ? (
                <div className="p-4 bg-gray-100 rounded">
                  <pre className="text-sm overflow-auto whitespace-pre-wrap">
                    {cookies.split(";").map((cookie, index) => (
                      <div key={index}>{cookie.trim()}</div>
                    ))}
                  </pre>
                </div>
              ) : (
                <p>Aucun cookie trouvé</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tests API */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tests API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={testAPI}>Tester /api/user/me</Button>
                <Button onClick={testAdminAPI}>Tester /api/admin/users</Button>
              </div>

              {apiResponse && (
                <div className="p-4 bg-gray-100 rounded">
                  <h4 className="font-semibold mb-2">Réponse API:</h4>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
