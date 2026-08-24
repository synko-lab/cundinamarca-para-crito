// Agrega lat/lng a las 14 iglesias sembradas por seed-iglesias.mjs y al
// municipio de Girardot (que no tenía coordenadas). Los valores vienen de
// geocodificar la dirección pública ya registrada de cada iglesia contra
// OpenStreetMap/Nominatim; donde no había dirección publicada se usó el
// centro del municipio como aproximación explícita (se deja anotado en
// la descripción).
//
// Uso: node --env-file=.env scripts/add-iglesia-coords.mjs

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore(app);

const NOTA_APROX_CALLE =
  "Coordenadas aproximadas a nivel de calle (geocodificación de la dirección pública vía OpenStreetMap), no del edificio exacto.";
const NOTA_APROX_MUNICIPIO =
  "Sin dirección exacta publicada: coordenadas aproximadas al centro del municipio.";

const IGLESIAS = [
  { id: "xXKGbFHhLmyb1xSUPApK", lat: 5.0182148, lng: -73.9951769, nota: NOTA_APROX_CALLE },
  { id: "bpAOKq2G9QAeZgVtEUMv", lat: 4.8078463, lng: -74.3526561, nota: NOTA_APROX_CALLE },
  { id: "rkac1UMrijfkXarQ6umm", lat: 5.0145645, lng: -74.4726442, nota: NOTA_APROX_CALLE },
  { id: "2aNI8mtZNORxcH59iFMq", lat: 4.6111758, lng: -74.226072, nota: NOTA_APROX_CALLE },
  { id: "rBwX6L3yZxWXGfLLmzTr", lat: 4.5794, lng: -74.2168, nota: NOTA_APROX_MUNICIPIO },
  { id: "zhAIeC1MHgcsDszeom6Q", lat: 4.7084819, lng: -74.2129995, nota: NOTA_APROX_CALLE },
  { id: "LSbw4590uxV5lFZb3j9p", lat: 4.7168598, lng: -74.2136799, nota: NOTA_APROX_CALLE },
  { id: "DmQ121C07C8F44JgitcJ", lat: 4.8697, lng: -74.1439, nota: NOTA_APROX_MUNICIPIO },
  { id: "rs8YAWT42h9Dsd2TWDFL", lat: 4.9414412, lng: -74.0229291, nota: NOTA_APROX_CALLE },
  { id: "mkfAJrmFOqR7trE7bZo9", lat: 4.85304, lng: -74.0616952, nota: NOTA_APROX_CALLE },
  { id: "ydG6NLFYDHlGNdUpzg5W", lat: 4.7340966, lng: -74.259941, nota: NOTA_APROX_CALLE },
  { id: "ilV6tZ05qiUrRIEoAtbD", lat: 4.337, lng: -74.364, nota: NOTA_APROX_MUNICIPIO },
  { id: "XSGAWzO5CsmQrESME570", lat: 4.3046383, lng: -74.8030739, nota: NOTA_APROX_MUNICIPIO },
  { id: "HNLD667ckYk6fLNI0Av7", lat: 5.0676021, lng: -74.6003946, nota: NOTA_APROX_CALLE },
];

async function main() {
  for (const ig of IGLESIAS) {
    const ref = db.collection("iglesias").doc(ig.id);
    const doc = await ref.get();
    if (!doc.exists) {
      console.log(`  ! No existe: ${ig.id}`);
      continue;
    }
    const descripcionActual = doc.data().descripcion ?? "";
    await ref.update({
      lat: ig.lat,
      lng: ig.lng,
      descripcion: `${descripcionActual} ${ig.nota}`.trim(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`  + ${doc.data().nombre} -> ${ig.lat}, ${ig.lng}`);
  }

  const girardotSnap = await db.collection("municipios").where("nombre", "==", "Girardot").limit(1).get();
  if (!girardotSnap.empty) {
    await girardotSnap.docs[0].ref.update({
      lat: 4.3046383,
      lng: -74.8030739,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log("  + Municipio Girardot -> 4.3046383, -74.8030739");
  }

  console.log("Listo.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
