import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SelectLub CRM",
  description: "Central de Leads WhatsApp — Select Lub Piracicaba",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#080a0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, background: "#080a0f", color: "#f0f6fc", overscrollBehavior: "none" }}>
        {children}
      </body>
    </html>
  );
}
