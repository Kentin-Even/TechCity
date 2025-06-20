import { ModernAuthForm } from "@/components/modern-auth-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tech City IoT
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Bienvenue sur notre plateforme IoT. Connectez-vous ou créez un
            compte pour commencer.
          </p>
        </div>

        <div className="flex justify-center">
          <ModernAuthForm />
        </div>
      </div>
    </div>
  );
}
