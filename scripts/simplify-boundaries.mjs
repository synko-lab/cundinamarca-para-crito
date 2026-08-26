// Re-simplifica los archivos de contornos ya descargados sin volver a
// pedirle nada a Nominatim. Útil si se ajusta el epsilon en
// scripts/lib/simplify.mjs y se quiere aplicar a datos existentes.
//
// Uso: node scripts/simplify-boundaries.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { simplifyGeometry, countPoints, EPSILON_MUNICIPIO, EPSILON_CUNDINAMARCA } from "./lib/simplify.mjs";

const MUNICIPIOS_PATH = path.join(process.cwd(), "public", "data", "municipio-boundaries.json");
const CUNDINAMARCA_PATH = path.join(process.cwd(), "public", "data", "cundinamarca-boundary.json");

async function main() {
  const municipiosRaw = JSON.parse(await readFile(MUNICIPIOS_PATH, "utf-8"));
  let beforePts = 0;
  let afterPts = 0;
  const municipiosOut = {};
  for (const [nombre, geometry] of Object.entries(municipiosRaw)) {
    beforePts += countPoints(geometry);
    const simplified = simplifyGeometry(geometry, EPSILON_MUNICIPIO);
    afterPts += countPoints(simplified);
    municipiosOut[nombre] = simplified;
  }
  await writeFile(MUNICIPIOS_PATH, JSON.stringify(municipiosOut));
  console.log(`Municipios: ${beforePts} -> ${afterPts} puntos (${Math.round((1 - afterPts / beforePts) * 100)}% menos)`);

  const cundinamarcaRaw = JSON.parse(await readFile(CUNDINAMARCA_PATH, "utf-8"));
  const beforeCu = countPoints(cundinamarcaRaw);
  const simplifiedCu = simplifyGeometry(cundinamarcaRaw, EPSILON_CUNDINAMARCA);
  const afterCu = countPoints(simplifiedCu);
  await writeFile(CUNDINAMARCA_PATH, JSON.stringify(simplifiedCu));
  console.log(`Cundinamarca: ${beforeCu} -> ${afterCu} puntos (${Math.round((1 - afterCu / beforeCu) * 100)}% menos)`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
