// Descarga el polígono administrativo de cada municipio de la colección
// "municipios" (vía OpenStreetMap/Nominatim) y lo guarda en un archivo
// estático que el mapa carga una sola vez, en vez de pedirlo en vivo al
// abrir la página (evitar 70 solicitudes a Nominatim por cada visita).
//
// Uso: node --env-file=.env scripts/fetch-municipio-boundaries.mjs

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore(app);

const OUT_PATH = path.join(process.cwd(), "public", "data", "municipio-boundaries.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBoundary(nombre) {
  const url = `https://nominatim.openstreetmap.org/search?format=geojson&polygon_geojson=1&limit=1&countrycodes=co&q=${encodeURIComponent(
    `${nombre}, Cundinamarca, Colombia`
  )}`;
  const res = await fetch(url, { headers: { "User-Agent": "cundinamarca-para-cristo-app/1.0 (build script)" } });
  if (!res.ok) return null;
  const data = await res.json();
  const feature = data?.features?.[0];
  if (!feature || !feature.geometry) return null;
  return feature.geometry;
}

async function main() {
  const snap = await db.collection("municipios").get();
  const municipios = snap.docs.map((d) => d.data().nombre).filter(Boolean).sort((a, b) => a.localeCompare(b, "es"));

  console.log(`Descargando contornos de ${municipios.length} municipios (~1 por segundo)...`);

  const result = {};
  let ok = 0;
  let fail = 0;

  for (const nombre of municipios) {
    try {
      const geometry = await fetchBoundary(nombre);
      if (geometry) {
        result[nombre] = geometry;
        ok++;
        console.log(`  ✓ ${nombre}`);
      } else {
        fail++;
        console.log(`  ✗ ${nombre} (sin resultado)`);
      }
    } catch (err) {
      fail++;
      console.log(`  ✗ ${nombre} (error: ${err.message})`);
    }
    await sleep(1100);
  }

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(result));

  console.log(`\nListo: ${ok} contornos guardados, ${fail} fallidos.`);
  console.log(`Archivo: ${OUT_PATH}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
