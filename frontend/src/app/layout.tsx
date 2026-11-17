import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secretar·iA | Secretaría Privada — Gobierno de Mendoza",
  description: "Sistema Ministerial de Trazabilidad Documental, Despacho y Remitos Oficiales. Ministerio de Gobierno, Infraestructura y Desarrollo Territorial.",
  icons: {
    icon: "/escudo-mendoza.svg",
    shortcut: "/escudo-mendoza.svg",
    apple: "/escudo-mendoza.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full antialiased selection:bg-[#000f9f] selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
