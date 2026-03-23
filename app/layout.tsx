import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { initializeDatabase } from "@/lib/db/service";

export const metadata: Metadata = {
  title: "SmartFall - Fall Detection & Health Monitoring",
  description:
    "Advanced fall detection and vital monitoring for independent living",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

// Initialize database on app startup
initializeDatabase().catch((error) => {
  console.error("Failed to initialize database:", error);
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // return (
  //   <html lang="en">
  //     <head>
  //       <meta name="theme-color" content="#111A96" />
  //     </head>
  //     <body>{children}</body>
  //   </html>
  // );
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/vendor/fumadocs-ui.css" />
      </head>
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
