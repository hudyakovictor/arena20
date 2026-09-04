import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal Arena — aibackend",
  description: "Бэкенд Signal Arena: детерминированный движок, валидация по seed, планировщик, ИИ-конвейер контента.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-[#070B14] text-[#DCE4F2] antialiased">{children}</body>
    </html>
  );
}
