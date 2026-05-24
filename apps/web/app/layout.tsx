import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const stencil = localFont({
  src: [
    {
      path: "./fonts/BespokeStencil-Variable.woff2",
      weight: "300 800",
      style: "normal",
    },
    {
      path: "./fonts/BespokeStencil-VariableItalic.woff2",
      weight: "300 800",
      style: "italic",
    },
  ],
  variable: "--font-stencil-src",
  display: "swap",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body-src",
  display: "swap",
});

export const metadata: Metadata = {
  title: "dirtydoor.com",
  description: "Post the dirty doors you find. Mobile-first, mildly cursed.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${stencil.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
