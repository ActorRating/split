import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/split/auth-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Split — The internet can't agree",
  description:
    "Every day, one impossible question. Vote and see where you stand.",
  openGraph: {
    title: "Split — The internet can't agree",
    description:
      "Every day, one impossible question. Vote and see where you stand.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      {/* skip-nav for keyboard users */}
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-purple-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>

        <AuthProvider>{children}</AuthProvider>

        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast:
                "!bg-[#161616] !border-white/[0.09] !text-white/88 !shadow-2xl !backdrop-blur-2xl !rounded-2xl",
              title: "!text-white/88 !text-sm !font-medium",
              description: "!text-white/48 !text-xs",
              success: "!border-green-500/20",
              error: "!border-red-500/20",
            },
          }}
        />
      </body>
    </html>
  );
}
