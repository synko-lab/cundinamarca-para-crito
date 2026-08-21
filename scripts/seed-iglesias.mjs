// Reemplaza por completo la colección "iglesias" en Firestore con el
// listado de 14 iglesias bautistas confirmadas por fuentes públicas.
//
// Uso: node --env-file=.env scripts/seed-iglesias.mjs
//
// Requiere FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY
// en el entorno (las mismas que usa src/lib/firebase-admin.ts).

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

const NOTA_TRANSPARENCIA =
  "Información recopilada de fuentes públicas (sitio web, redes sociales o registros oficiales). Los campos marcados como \"No publicado\" no cuentan con dato verificable disponible en fuentes públicas al momento de la consulta.";

const NP = "No publicado";

function horario(titulo, horaInicio, horaFin = "") {
  return { titulo, horaInicio, horaFin };
}

const IGLESIAS = [
  {
    nombre: "Primera Iglesia Bautista de Zipaquirá",
    municipio: "Zipaquirá",
    direccion: "Calle 6 No. 3-57",
    barrio: "La Concepción",
    telefono: "8525442 / 8512097 · Cel/WhatsApp: 313 290 1522 / 311 514 9222",
    email: "leninzip@gmail.com",
    pastor: "José Lenin Ortiz",
    horarios: {
      Miércoles: [horario("Culto", "18:00", "20:00")],
      Domingo: [horario("Culto", "09:30", "13:00"), horario("Culto", "17:00", "19:00")],
    },
    descripcion: `Redes sociales: Facebook @iglesiabautistazipaquira. ${NOTA_TRANSPARENCIA}`,
  },
  {
    nombre: "Iglesia Bautista Gracia y Verdad",
    municipio: "Facatativá",
    direccion: "Carrera 2 No. 2-19",
    barrio: "Centro",
    telefono: "843 4420 / 892 0288 · Cel: 320 321 6570",
    email: "jhonreforma@gmail.com / harverjhon@hotmail.com",
    pastor: "Jhon Harverson Espitia",
    horarios: {},
    descripcion: `Horario no publicado — contactar por teléfono para confirmar. Redes sociales: Instagram @ibautista.graciayverdad, Facebook @ibbgraciayverdad. ${NOTA_TRANSPARENCIA}`,
  },
  {
    nombre: "Primera Iglesia Bautista de Villeta",
    municipio: "Villeta",
    direccion: "Carrera 6 No. 2-01",
    barrio: "Alfonso López",
    telefono: "844 4146 / 844 6337 · Cel: 310 339 6150",
    email: "canitasogr@hotmail.com",
    pastor: "Orlando Gantiva Romero",
    horarios: {},
    descripcion: `Horario no publicado. ${NOTA_TRANSPARENCIA}`,
  },
  {
    nombre: "Iglesia Bautista Visión de Dios",
    municipio: "Soacha",
    direccion: "Calle 13 No. 1A-15",
    barrio: "San Marcos",
    telefono: "712 6379 · Cel: 312 527 9469",
    email: "familiaortizvelez@yahoo.es",
    pastor: "Ortiz Guerrero",
    horarios: {},
    descripcion: NOTA_TRANSPARENCIA,
  },
  {
    nombre: "Iglesia Bautista Fundamental Palabras de Vida",
    municipio: "Soacha",
    direccion: NP,
    barrio: NP,
    telefono: "312 331 8540",
    email: "cristoeslaluzdelmundojuan316@gmail.com",
    pastor: "Carlos Mario Gómez",
    horarios: {},
    descripcion: `Dirección y barrio no publicados en fuentes consultadas. ${NOTA_TRANSPARENCIA}`,
  },
  {
    nombre: "Iglesia Bautista Reformada Vida en Cristo",
    municipio: "Funza",
    direccion: "Calle 8 No. 12-30",
    barrio: "El Prado",
    telefono: "WhatsApp: +57 322 811 1888 / +57 321 984 6600",
    email: NP,
    pastor: NP,
    horarios: {},
    descripcion: `Cobertura: Funza, Mosquera, Madrid, El Rosal, Subachoque, Facatativá, Fontibón. ${NOTA_TRANSPARENCIA}`,
  },
  {
    nombre: "Iglesia Bautista de la Sabana",
    municipio: "Funza",
    direccion: "Carrera 15 No. 10-50",
    barrio: "La Chaguya",
    telefono: NP,
    email: NP,
    pastor: "Víctor Clavijo",
    horarios: {},
    descripcion: NOTA_TRANSPARENCIA,
  },
  {
    nombre: "Iglesia Bautista Valle de Tenjo",
    municipio: "Tenjo",
    direccion: NP,
    barrio: "El Estanco (vereda)",
    telefono: NP,
    email: NP,
    pastor: NP,
    horarios: {},
    descripcion: `Sede educativa asociada: Seminario Bautista de Colombia — Km 2.5 vía La Punta, Finca Berea. Cobertura: Cajicá, Chía, Tabio, Zipaquirá y alrededores. Dirección exacta del templo, teléfono, correo y horario no publicados en fuentes consultadas. ${NOTA_TRANSPARENCIA}`,
  },
  {
    nombre: "Iglesia Bautista Reformada El Redentor",
    municipio: "Cajicá",
    direccion: 'Carrera 6 No. 11-19, salón de eventos "El Misterio"',
    barrio: "El Tejar",
    telefono: NP,
    email: NP,
    pastor: NP,
    horarios: {
      Domingo: [horario("Oración e himnos", "08:00", "08:45"), horario("Sermón expositivo", "08:45", "")],
      Miércoles: [horario("Oración", "19:30", "")],
    },
    descripcion: `Cobertura: Cajicá, Chía, Tabio, Zipaquirá. Teléfono y correo no publicados en fuentes consultadas. ${NOTA_TRANSPARENCIA}`,
  },
  {
    nombre: "Iglesia Bíblica Bautista Nuevos Horizontes",
    municipio: "Chía",
    direccion: "Carrera 9 No. 75, 2° piso",
    barrio: "Centro",
    telefono: "304 383 6267",
    email: "ibbnuevoshorizonteschia@gmail.com",
    pastor: "Martín Gabriel Jiménez Cruz",
    horarios: {},
    descripcion: `Horario no publicado. ${NOTA_TRANSPARENCIA}`,
  },
  {
    nombre: "Iglesia Bíblica Bautista Independiente Roca Fuerte",
    municipio: "Madrid",
    direccion: "Calle 11A No. 10-80",
    barrio: "Echavarría",
    telefono: "317 863 3441",
    email: "rocafuertemadrid@gmail.com",
    pastor: "Willian Suárez",
    horarios: {},
    descripcion: `Horario no publicado. ${NOTA_TRANSPARENCIA}`,
  },
  {
    nombre: "Iglesia Bautista Sumapaz",
    municipio: "Fusagasugá",
    direccion: NP,
    barrio: NP,
    telefono: NP,
    email: NP,
    pastor: NP,
    horarios: {},
    descripcion: `Cuenta con redes sociales y un canal de YouTube/podcast propio, pero sin ficha pública detallada de dirección, contacto ni horarios. ${NOTA_TRANSPARENCIA}`,
  },
  {
    nombre: 'Iglesia Bautista del Sur "La Gloria Eterna del Nuevo Pueblo"',
    municipio: "Girardot",
    direccion: NP,
    barrio: NP,
    telefono: NP,
    email: NP,
    pastor: NP,
    horarios: {},
    descripcion: `Representante ante el Comité Municipal de Libertad Religiosa: Vladimir Arteaga Villa. Registrada oficialmente ante la Alcaldía de Girardot, pero sin ficha pública detallada de dirección, contacto ni horarios. ${NOTA_TRANSPARENCIA}`,
  },
  {
    nombre: "Iglesia Bautista del Sur — Voz de Salvación",
    municipio: "Guaduas",
    direccion: "Carrera 9 No. 8-20 sur",
    barrio: "Villa del Paraíso",
    telefono: NP,
    email: NP,
    pastor: NP,
    horarios: {},
    descripcion: `Contacto disponible solo vía formulario en su sitio web. Teléfono, correo y horario no publicados en fuentes consultadas. ${NOTA_TRANSPARENCIA}`,
  },
];

async function deleteCollection(collectionName) {
  const snap = await db.collection(collectionName).get();
  if (snap.empty) return 0;
  const batches = [];
  let batch = db.batch();
  let count = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    count++;
    if (count % 400 === 0) {
      batches.push(batch.commit());
      batch = db.batch();
    }
  }
  batches.push(batch.commit());
  await Promise.all(batches);
  return snap.size;
}

async function main() {
  console.log("Borrando iglesias existentes...");
  const deleted = await deleteCollection("iglesias");
  console.log(`  ${deleted} documento(s) eliminado(s).`);

  console.log("Insertando nuevas iglesias...");
  for (const ig of IGLESIAS) {
    const ref = await db.collection("iglesias").add({
      ...ig,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`  + ${ig.nombre} (${ig.municipio}) -> ${ref.id}`);
  }

  console.log(`Listo. ${IGLESIAS.length} iglesias insertadas.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error en la migración:", err);
    process.exit(1);
  });
