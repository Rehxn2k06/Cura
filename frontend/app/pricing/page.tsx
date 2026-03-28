"use client";

import { PricingCards } from '@/components/pricing-cards';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { UserProfileDropdown } from '@/components/user-profile-dropdown';

export default function PricingPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">

        {/* 🔥 NAVBAR */}
        <nav className="flex items-center justify-between pt-6 px-8 max-w-7xl mx-auto">

          {/* LEFT SIDE */}
          <div className="flex items-center gap-4">

            {/* BACK BUTTON */}
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* LOGO */}
            <Link href="/" className="text-xl font-bold">
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Null Pointer
              </span>
            </Link>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">

            {!user ? (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-foreground hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                >
                  Get Started
                </Link>
              </>
            ) : (
              // 🔥 PROFILE ICON DROPDOWN (MATCHES YOUR APP)
              <UserProfileDropdown />
            )}

          </div>
        </nav>

        {/* CONTENT */}
        <PricingCards />

        {/* FOOTER */}
        <footer className="border-t border-border mt-16 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground text-sm">
            <p>&copy; 2024 Null Pointer. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </div>
  );
}