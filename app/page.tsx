import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingClient from "./landing-client";
import Navbar from "@/components/navbar";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  async function handleSignIn() {
    "use server";
    await signIn("github", { redirectTo: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#08080a]">
      <Navbar />
      <main className="flex-1">
        <LandingClient signInAction={handleSignIn} />
      </main>
    </div>
  );
}
