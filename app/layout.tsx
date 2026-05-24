import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'REMO - Smart Management System',
  description: 'AI-powered restaurant management dashboard with smart scheduling, demand forecasting, and inventory management',
  generator: 'v0.app',
  icons: {
    icon: '/Logo.jpg',
    apple: '/Logo.jpg',
  },
}

import { AuthProvider } from '@/components/providers/auth-provider';
import { LanguageProvider } from '@/components/providers/language-provider';
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
        <Toaster richColors position="top-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
