import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/app-providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ModuLedger | Decentralized AI Model Marketplace",
    template: "%s | ModuLedger",
  },
  description: "Publish, discover, and own AI models with verifiable provenance on Solana.",
  applicationName: "ModuLedger",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
