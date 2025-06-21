import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Jira Assistant",
  description: "Jira Assistant helping update Jira issues",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-white dark:bg-slate-900 min-h-[100dvh] flex flex-col`}
      >
        <Providers>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </Providers>
        <ThemeToggle />
      </body>
    </html>
  );
}
