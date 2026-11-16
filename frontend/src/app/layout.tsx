import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secretar-iA | Trazabilidad Documental Multi-Área",
  description: "Sistema On-Premise de trazabilidad de expedientes, notas y resoluciones en tiempo real.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full antialiased selection:bg-blue-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
