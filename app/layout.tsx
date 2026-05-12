import type { Metadata } from "next";
import "./globals.css";
import { NextAuthProvider } from "@/components/session-provider";

export const metadata: Metadata = {
  title: "CRM Amplifica",
  description: "Sistema de gestión comercial Amplifica",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
