import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { MaintenanceGate } from "@/components/maintenance-gate";
import { getSystemSettings } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PrepWise - AI Mock Interview Platform",
  description: "Master your next interview with AI-powered mock interviews, real-time feedback, and personalized coaching.",
  keywords: ["interview preparation", "AI interview", "mock interview", "career coaching", "job interview", "PrepWise"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSystemSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <MaintenanceGate maintenanceMode={settings.maintenanceMode ?? false}>
            {children}
          </MaintenanceGate>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
