import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingClient from "./landing-client";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  async function handleSignIn() {
    "use server";
    await signIn("github", { redirectTo: "/dashboard" });
  }

  return <LandingClient signInAction={handleSignIn} />;
}
