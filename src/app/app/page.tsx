import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Workspace from "@/components/workspace";

export const dynamic = "force-dynamic";
export const metadata = { title: "Workspace", robots: { index: false, follow: false } };

export default async function WorkspacePage() {
  if (!await isAuthenticated()) redirect("/login");
  return <Workspace />;
}
