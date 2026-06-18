import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Select Lub — CRM",
  description: "Central de Leads WhatsApp — Select Lub Piracicaba",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen font-sans antialiased bg-zinc-950 text-zinc-100">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
