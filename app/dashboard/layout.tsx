import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
              <svg
                className="h-4 w-4 text-zinc-100"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-zinc-100">
              Dev Analytics
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-zinc-400">
                {session.user?.name ?? session.user?.email}
              </span>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              >
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* İçerik */}
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </div>
    </div>
  );
}
