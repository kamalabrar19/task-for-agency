import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Agency Workspace", description: "Workspace internal tim agency" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body>{children}</body></html>;
}
