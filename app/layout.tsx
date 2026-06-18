import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Select Lub — CRM",
  description: "Central de Leads WhatsApp — Select Lub Piracicaba",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
