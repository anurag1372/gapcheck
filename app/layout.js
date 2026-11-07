import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/components/AppState";
import Header from "@/components/Header";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Gap Check",
  description: "An honest affordable-ownership gap calculator for Orange County nonprofits.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <AppStateProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-slate-500">
            Prototype. Not legal, financial, lending or tax advice. Numbers labeled ASSUMPTION are made up; every other number
            links to its source and the date we checked it.
          </footer>
        </AppStateProvider>
      </body>
    </html>
  );
}
