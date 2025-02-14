import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { environment } from "@/env/environment";
import { ThemeModeScript } from "flowbite-react";
import "@/app/globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: environment.app.name
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <ThemeModeScript />
      </head>
      <body className={`${inter.className} antialised`}>{children}</body>
    </html>
  );
}