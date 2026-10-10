import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Wingtern Lens: learn anything through what you love",
  description:
    "Lens explains any concept through your interests, with a structural analogy, a visual, a worked example, honest limits and a quick check.",
};

export const viewport: Viewport = {
  themeColor: "#102a43",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable} ${playfair.variable} antialiased`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
