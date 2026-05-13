import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import DataPrefetcher from "@/components/DataPrefetcher";

const appSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const appMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/white-icon.svg" />
          {/* Preconnect: eliminate DNS+TLS cost on first call to external services */}
          <link rel="preconnect" href="https://clerk.accounts.dev" />
          <link rel="preconnect" href="https://codeforces.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://rnvracsuifsgqppkgnhv.supabase.co" />
          {/* Speculation Rules: prefetch key pages for instant navigation */}
          <script
            type="speculationrules"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                prefetch: [
                  { where: { href_matches: "/cp-ladder" }, eagerness: "moderate" },
                  { where: { href_matches: "/roadmaps/*" }, eagerness: "conservative" },
                  { where: { href_matches: "/system-design/*" }, eagerness: "conservative" },
                ],
              }),
            }}
          />
        </head>
        <body
          className={`${appSans.variable} ${appMono.variable} font-sans`}
          suppressHydrationWarning
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen bg-background flex flex-col">
              <Navbar />
              <DataPrefetcher />
              <main className="flex-1">{children}</main>
              <Toaster />
              <Sonner theme="dark" richColors position="bottom-center" />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
