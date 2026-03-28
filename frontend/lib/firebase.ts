// lib/firebase.ts

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔐 YOUR CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyALP4laTflGHJdS3S2AorSybwDQJ-zc9_k",
  authDomain: "null-pointer-a9c58.firebaseapp.com",
  projectId: "null-pointer-a9c58",
  storageBucket: "null-pointer-a9c58.firebasestorage.app",
  messagingSenderId: "1078175424403",
  appId: "1:1078175424403:web:a50f668b6ff1e78aeb5266",
  measurementId: "G-F0L9WTKZHN",
};

// ✅ Prevent multiple initialization (VERY IMPORTANT)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ AUTH & DB
export const auth = getAuth(app);
export const db = getFirestore(app);

// (Optional future)
export default app;