import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://od-lagna.com"),
  alternates: {
    canonical: "/",
  },
  title: "Od-Lagna — Re:Zero Tappei Q&A Archive",
  description:
    "Comprehensive, searchable index of every Tappei Q&A across events, interviews, and Twitter, featuring granular spoiler protection.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Od-Lagna — Re:Zero Tappei Q&A Archive",
    description:
      "Every Q&A by Tappei Nagatsuki indexed in one searchable, spoiler-safe archive.",
    type: "website",
    locale: "en_US",
    siteName: "Od-Lagna",
  },
  twitter: {
    card: "summary_large_image",
    title: "Od-Lagna — Tappei Q&A Archive",
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
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Od-Lagna",
              alternateName: "Re:Zero Tappei Q&A Archive",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://od-lagna.com",
              description:
                "Comprehensive, searchable index of every Tappei Q&A across events, interviews, and Twitter, featuring granular spoiler protection.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://od-lagna.com"}/browse?search={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
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
