import Image from "next/image";
import { auth } from "@/lib/auth";
import { handleSignOut } from "@/app/actions/auth";
import MobileMenu from "./mobile-menu";

type NavbarProps = {
  username?: string;
  avatarUrl?: string | null;
  displayName?: string | null;
};

export default async function Navbar({
  username: propUsername,
  avatarUrl: propAvatar,
  displayName: propName,
}: NavbarProps = {}) {
  const session = await auth();
  const isLoggedIn = !!session;
  const username = propUsername ?? session?.user?.username ?? "";
  const avatarUrl = propAvatar ?? session?.user?.image ?? null;
  const displayName = propName ?? session?.user?.name ?? session?.user?.email ?? "";
  const currentYear = new Date().getFullYear();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Sol: Logo */}
        <a
          href={isLoggedIn ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/[0.08] ring-1 ring-emerald-500/15">
            <svg className="h-3.5 w-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-zinc-300">Dev Analytics</span>
        </a>

        {/* Sağ: Navigasyon */}
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            {/* Desktop nav */}
            <nav className="hidden items-center gap-0.5 sm:flex">
              <NavLink href="/dashboard/settings">Ayarlar</NavLink>
              <NavLink href={`/u/${username}`}>Profil</NavLink>
              <NavLink href={`/u/${username}/${currentYear}`}>Wrapped</NavLink>
            </nav>

            {/* Desktop: kullanıcı + çıkış */}
            <div className="hidden items-center gap-2 border-l border-zinc-800/60 pl-3 sm:flex">
              {avatarUrl && (
                <Image
                  src={avatarUrl}
                  alt={displayName ?? ""}
                  width={24}
                  height={24}
                  className="rounded-full ring-1 ring-zinc-800"
                />
              )}
              <span className="hidden max-w-[120px] truncate text-xs text-zinc-500 lg:block">
                {displayName}
              </span>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-800/60 hover:text-zinc-400"
                  title="Çıkış Yap"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Mobil hamburger menü */}
            <MobileMenu
              username={username}
              currentYear={currentYear}
              avatarUrl={avatarUrl}
              displayName={displayName}
            />
          </div>
        ) : (
          <a
            href="/"
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            Giriş Yap
          </a>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300"
    >
      {children}
    </a>
  );
}
