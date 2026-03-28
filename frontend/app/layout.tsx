import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/components/auth-provider'
import { BackgroundEffects } from '@/components/background-effects'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Null Pointer — AI Observability',
  description: 'Enterprise AI Observability & Incident Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.className} transition-colors duration-300 bg-gray-50 text-gray-900 dark:bg-[#05070D] dark:text-white`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <AuthProvider>

            {/* Background (safe) */}
            <BackgroundEffects />

            {/* App Content */}
            <div className="relative min-h-screen">
              {children}
            </div>

          </AuthProvider>
        </ThemeProvider>

        <Analytics />
      </body>
    </html>
  )
}