// lib/firebase.ts

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔐 YOUR CONFIG
const firebaseConfig = {
  apiKey: " ",
  authDomain: " ",
  projectId:  " ",
  storageBucket: " ",
  messagingSenderId: " ",
  appId:  ",
  measurementId: " ",
};

// ✅ Prevent multiple initialization (VERY IMPORTANT)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ AUTH & DB
export const auth = getAuth(app);
export const db = getFirestore(app);

// (Optional future)
export default app;