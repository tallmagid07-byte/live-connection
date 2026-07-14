import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
});

export const metadata = {
  title: "Live Connection",
  description: "Se comprendre sans parler, juste en partageant une chanson.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-night text-ink font-sans min-h-screen">{children}</body>
    </html>
  );
}
