import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function getFirebaseAdminApp(): App {
  return getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n"
          ),
        }),
      })
    : getApps()[0]!;
}

let _adminDb: Firestore | undefined;

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    if (!_adminDb) _adminDb = getFirestore(getFirebaseAdminApp());
    return Reflect.get(_adminDb, prop, receiver);
  },
});