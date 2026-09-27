import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Clariva — Run Your Entire School From One Login",
  description:
    "Clariva runs your school's students, staff, fees, grades, attendance and parent communication in one platform. Join the waitlist for early access.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${fraunces.variable} ${plexSans.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}