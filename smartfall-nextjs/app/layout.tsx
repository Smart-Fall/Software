import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartFall - Fall Detection & Health Monitoring",
  description: "Advanced fall detection and vital monitoring for independent living",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#111A96" />
      </head>
      <body>{children}</body>
    </html>
  );
}
