import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SecScan",
  description: "Painel de verificações de segurança",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
