import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ActivityTrackerProvider } from "@/components/ActivityTrackerProvider";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: "CadetMate - Coming Soon",
  description: "All-in-One Platform for UK Deck Cadets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) { 
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bricolage.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="theme"
        >
          <ActivityTrackerProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}