import { Suspense } from "react";
import { SuggestionForm } from "@/components/suggestion-form";
import { SuggestionsList } from "@/components/suggestions-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SuggestionsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          💡 Suggestions Citoyennes
        </h1>
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">
              Participez à l&apos;amélioration de votre ville !
            </CardTitle>
            <CardDescription className="text-blue-700">
              Votre voix compte ! Partagez vos idées pour améliorer le système
              de capteurs IoT de votre ville. Que ce soit pour ajouter de
              nouveaux capteurs dans certaines zones, prendre en compte de
              nouveaux paramètres environnementaux, ou signaler des problèmes,
              vos suggestions nous aident à créer une ville plus connectée et
              durable.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulaire de nouvelle suggestion */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              📝 Nouvelle Suggestion
            </h2>
            <SuggestionForm />
          </div>
        </div>

        {/* Liste des suggestions existantes */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              📋 Suggestions Communautaires
            </h2>
            <Suspense
              fallback={
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              }
            >
              <SuggestionsList />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Section d'informations supplémentaires */}
      <div className="mt-12">
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">
              🌱 Types de suggestions appréciées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-800">
                  🏗️ Infrastructure
                </h4>
                <ul className="text-green-700 space-y-1">
                  <li>• Nouveaux emplacements de capteurs</li>
                  <li>• Amélioration de la couverture réseau</li>
                  <li>• Maintenance préventive</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-green-800">
                  🌍 Environnement
                </h4>
                <ul className="text-green-700 space-y-1">
                  <li>• Nouveaux paramètres à mesurer</li>
                  <li>• Zones sensibles à surveiller</li>
                  <li>• Alertes environnementales</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-green-800">
                  ⚡ Améliorations
                </h4>
                <ul className="text-green-700 space-y-1">
                  <li>• Interface utilisateur</li>
                  <li>• Nouvelles fonctionnalités</li>
                  <li>• Accessibilité des données</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
