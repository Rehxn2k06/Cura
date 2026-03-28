'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';
import { User, Settings, LogOut, CreditCard, Eye } from 'lucide-react';
import Link from 'next/link';

export function UserProfileDropdown() {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const router = useRouter();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
    setIsOpen(false);
  };

  // ✅ FIXED (NO CRASH EVER)
  const userInitial = (
    user?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    'U'
  ).toUpperCase();

  const menuItems = [
    { label: 'Profile', icon: User, href: '/profile' },
    { label: 'Settings', icon: Settings, href: '/settings' },
    { label: 'Billing', icon: CreditCard, href: '/pricing' },
  ];

  return (
    <div className="relative">
      {/* Avatar Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 dark:from-green-500 dark:to-cyan-500 flex items-center justify-center text-white dark:text-black font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/50 dark:hover:shadow-green-500/50 transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {userInitial}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-12 right-0 w-64 z-50"
            >
              <div className="bg-white dark:bg-black/80 dark:backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg dark:shadow-green-500/20">

                {/* Menu Items */}
                <nav className="py-2">
                  {menuItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                        >
                          <Icon className="w-4 h-4 text-blue-600 dark:text-green-400" />
                          <span>{item.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Divider */}
                <div className="h-px bg-gray-200 dark:bg-white/10" />

                {/* Logout */}
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </motion.button>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}