import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: `${SITE.name} — Website & sistem web untuk bisnis Anda`, template: `%s · ${SITE.name}` },
  description: SITE.tagline,
};

const themeInit = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
    <body>{children}<a href="/" className="watermark" aria-label={SITE.name}>{SITE.name}</a></body>
  </html>;
}
