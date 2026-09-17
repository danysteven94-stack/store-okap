import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: "Gadys Shop", template: "%s" },
  description: "Boutique en ligne — connectée à Gadys Entreprise.",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  manifest: "/manifest.webmanifest",
  openGraph: {
    siteName: "Gadys Shop",
    type: "website"
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
