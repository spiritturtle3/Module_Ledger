import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/app-providers'
import React from 'react'
import PhantomNavbar from '@/components/Nav'

export const metadata: Metadata = {
  title: {
    default: 'ModuLedger | Own the intelligence',
    template: '%s | ModuLedger',
  },
  description:
    'ModuLedger is a decentralized AI model marketplace for discovering, sharing, and owning verifiable AI models on Solana.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        <AppProviders>
          <PhantomNavbar />
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
declare global {
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}
