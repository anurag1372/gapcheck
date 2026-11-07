import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/components/AppState";
import Header from "@/components/Header";
import DemoChecklist from "@/components/DemoChecklist";

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
          <div className="mx-auto flex max-w-[1440px] gap-6 px-6">
            <DemoChecklist />
            <main className="min-w-0 flex-1 py-8">{children}</main>
          </div>
          <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-slate-500">
            Prototype. Not legal, financial, lending or tax advice. Numbers labeled ASSUMPTION are made up; every other number
            links to its source and the date we checked it.
          </footer>
        </AppStateProvider>
      </body>
    </html>
  );
}
