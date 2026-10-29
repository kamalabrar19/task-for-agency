"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch { /* storage diblokir */ }
}

export default function ThemeToggle({ className = "btn-ghost" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  return <button type="button" className={className} aria-label="Ganti tema" onClick={() => { applyTheme(!dark); setDark(!dark); }}>{dark ? <Sun size={15} /> : <Moon size={15} />}</button>;
}
