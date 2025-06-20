"use client";

import { ProtectedRoute } from "@/components/protectedRoute";
import {
  RoleBasedContent,
  RoleBasedNavigation,
} from "@/components/RoleBasedNavigation";
import { usePermissions } from "@/lib/hooks/usePermissions";

export default function DashboardPage() {
  const { userRole, isAdmin, isGestionnaire, isCitoyen, isChercheur } =
    usePermissions();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <RoleBasedNavigation />

        <main className="max-w-7xl mx-auto py-6 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de Bord IoT
            </h1>
            <p className="text-gray-600 mt-2">
              Bienvenue dans votre espace personnel. Rôle actuel : {userRole}
            </p>
          </div>

          {/* Contenu basé sur le rôle */}
          <RoleBasedContent />

          {/* Cartes de fonctionnalités selon le rôle */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {/* Carte accessible à tous */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">
                📊 Statistiques générales
              </h3>
              <p className="text-gray-600 mb-4">
                Consultez les données générales du système.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Voir les stats
              </button>
            </div>

            {/* Carte pour Admin et Gestionnaire */}
            {(isAdmin() || isGestionnaire()) && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">
                  🔧 Gestion des capteurs
                </h3>
                <p className="text-gray-600 mb-4">
                  Gérez et configurez les capteurs IoT.
                </p>
                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Gérer les capteurs
                </button>
              </div>
            )}

            {/* Carte pour Admin uniquement */}
            {isAdmin() && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">
                  👥 Gestion des utilisateurs
                </h3>
                <p className="text-gray-600 mb-4">
                  Administrez les comptes utilisateurs.
                </p>
                <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                  Gérer les utilisateurs
                </button>
              </div>
            )}

            {/* Carte pour Citoyen */}
            {isCitoyen() && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">
                  💡 Mes suggestions
                </h3>
                <p className="text-gray-600 mb-4">
                  Proposez des améliorations pour votre quartier.
                </p>
                <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                  Créer une suggestion
                </button>
              </div>
            )}

            {/* Carte pour Chercheur */}
            {isChercheur() && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">
                  📈 Analyses avancées
                </h3>
                <p className="text-gray-600 mb-4">
                  Accédez aux outils d&apos;analyse de données.
                </p>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                  Lancer une analyse
                </button>
              </div>
            )}

            {/* Carte pour Gestionnaire et Admin */}
            {(isGestionnaire() || isAdmin()) && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">
                  ⚠️ Alertes actives
                </h3>
                <p className="text-gray-600 mb-4">
                  Gérez les alertes et notifications.
                </p>
                <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
                  Voir les alertes
                </button>
              </div>
            )}
          </div>

          {/* Informations de debug en mode développement */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Informations de débogage :</h3>
              <ul className="text-sm text-gray-600">
                <li>Rôle utilisateur : {userRole}</li>
                <li>Est Admin : {isAdmin() ? "Oui" : "Non"}</li>
                <li>Est Gestionnaire : {isGestionnaire() ? "Oui" : "Non"}</li>
                <li>Est Citoyen : {isCitoyen() ? "Oui" : "Non"}</li>
                <li>Est Chercheur : {isChercheur() ? "Oui" : "Non"}</li>
              </ul>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
