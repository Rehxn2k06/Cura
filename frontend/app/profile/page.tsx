"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Shield, Edit2, Save, ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      setName(user.name || "");
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);

    try {
      const { getAuth, updateProfile } = await import("firebase/auth");
      const auth = getAuth();

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name,
        });
        useAuthStore.getState().updateUser({ name });
      }

      setEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    }

    setLoading(false);
  };

  if (!user) return null;

  const userInitial = (
    user?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U"
  ).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex justify-center items-start p-6">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >

        {/* 🔥 BACK BUTTON + TITLE */}
        <div className="flex items-center justify-between mb-6">

          <motion.button
            onClick={() => router.push("/")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile
          </h1>

        </div>

        {/* CARD */}
        <div className="bg-white dark:bg-black/60 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-lg">

          {/* USER INFO */}
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 dark:from-green-500 dark:to-cyan-500 flex items-center justify-center text-white dark:text-black text-xl font-bold">
              {userInitial}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user.name || "No Name"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {user.email}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-200 dark:bg-white/10 mb-6" />

          {/* NAME EDIT */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2 block">
              Full Name
            </label>

            <div className="flex gap-3">
              <input
                type="text"
                disabled={!editing}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white outline-none"
              />

              {editing ? (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save"}
                </button>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* EMAIL */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2 block">
              Email Address
            </label>

            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white">
              <Mail className="w-4 h-4 text-blue-500" />
              {user.email}
            </div>
          </div>

          {/* SECURITY */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2 block">
              Security
            </label>

            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white">
              <Shield className="w-4 h-4 text-green-500" />
              Email & Password Authentication
            </div>
          </div>

          {/* LOGOUT */}
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="w-full py-3 mt-4 bg-red-500/90 hover:bg-red-500 text-white rounded-lg font-semibold transition"
          >
            Sign Out
          </button>

        </div>
      </motion.div>
    </div>
  );
}