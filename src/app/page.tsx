import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Workspace from "@/components/workspace";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!await isAuthenticated()) redirect("/login");
  return <Workspace />;
}
