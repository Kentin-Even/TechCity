// Script pour temporairement contourner la protection sur /admin
// À utiliser UNIQUEMENT pour le diagnostic !

console.log(
  "⚠️ ATTENTION: Ce script va temporairement désactiver la protection sur /admin"
);
console.log("📋 Instructions:");
console.log(
  "1. Modifiez middleware.ts pour exclure /admin des routes protégées"
);
console.log("2. Allez sur http://localhost:3000/admin pour tester");
console.log("3. Remettez la protection après le test");
console.log("");
console.log("🔧 Modification temporaire à faire dans middleware.ts :");
console.log("");
console.log("const protectedRoutes = [");
console.log('  "/dashboard",');
console.log('  "/capteurs",');
console.log('  "/quartiers",');
console.log('  "/alertes",');
console.log('  // "/admin", // <-- Commentez cette ligne temporairement');
console.log("];");
console.log("");
console.log("⚠️ N'OUBLIEZ PAS de remettre la protection après le test !");

export {};
