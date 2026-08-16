"use client";

import { collection, getDocs } from "firebase/firestore";
import { db } from "./lib/firebase";
import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("Probando conexión...");

  useEffect(() => {
    async function testFirebase() {
      try {
        await getDocs(collection(db, "iglesias"));

        setStatus("✅ Firebase y Firestore están conectados correctamente.");
      } catch (error) {
        console.error(error);
        setStatus("❌ No se pudo conectar con Firestore.");
      }
    }

    testFirebase();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">{status}</h1>
    </main>
  );
}