import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Od-Lagna — Re:Zero Author Q&A Archive",
  description:
    "Comprehensive, searchable index of every Re:Zero author Q&A across events, interviews, and Twitter, featuring granular spoiler protection.",
  openGraph: {
    title: "Od-Lagna — Re:Zero Author Q&A Archive",
    description:
      "Every Q&A by Tappei Nagatsuki indexed in one searchable, spoiler-safe archive.",
    type: "website",
    locale: "en_US",
    siteName: "Od-Lagna",
  },
  twitter: {
    card: "summary_large_image",
    title: "Od-Lagna — Re:Zero Author Q&A Archive",
    description:
      "Every Q&A by Tappei Nagatsuki indexed in one searchable, spoiler-safe archive.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfb" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
};

import { AppShell } from "../components/AppShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('od-lagna-theme');
                  var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && supportDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
