'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  AlertCircle,
  FileText,
  Plug,
  Settings,
  User,
  UserPlus,
} from 'lucide-react';
import { UserProfileDropdown } from '@/components/user-profile-dropdown';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agents', label: 'AI Agents', icon: Bot },
  { href: '/incidents', label: 'Incidents', icon: AlertCircle },
  { href: '/logs', label: 'Logs', icon: FileText },
  { href: '/integrations', label: 'Integrations', icon: Plug },
  { href: '/settings', label: 'Settings', icon: Settings },

];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b border-gray-200 dark:border-green-500/10 bg-white dark:bg-black/40 dark:backdrop-blur-lg z-50 flex items-center">
      <div className="w-full max-w-6xl mx-auto px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-12">
          <h1 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-green-400 dark:to-cyan-400 bg-clip-text text-transparent">
              CURA
            </span>
          </h1>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-blue-100 dark:bg-green-500/20 text-blue-700 dark:text-green-400 border border-blue-300 dark:border-green-500/50'
                    : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-green-500/10'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side - User Profile Dropdown */}
        <UserProfileDropdown />
      </div>
    </nav>
  );
}
