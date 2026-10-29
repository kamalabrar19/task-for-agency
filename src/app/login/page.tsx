import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LoginForm from "@/components/login-form";

export const metadata = { title: "Masuk", robots: { index: false } };

export default async function Login() {
  if (await isAuthenticated()) redirect("/app");
  return <LoginForm />;
}
