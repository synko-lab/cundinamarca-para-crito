import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

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
let _adminAuth: Auth | undefined;

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    if (!_adminDb) _adminDb = getFirestore(getFirebaseAdminApp());
    return Reflect.get(_adminDb, prop, receiver);
  },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    if (!_adminAuth) _adminAuth = getAuth(getFirebaseAdminApp());
    return Reflect.get(_adminAuth, prop, receiver);
  },
});