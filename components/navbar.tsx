import { auth } from "@/lib/auth";
import NavbarClient from "./navbar-client";

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
  const displayName =
    propName ?? session?.user?.name ?? session?.user?.email ?? "";
  const currentYear = new Date().getFullYear();

  return (
    <NavbarClient
      isLoggedIn={isLoggedIn}
      username={username}
      avatarUrl={avatarUrl}
      displayName={displayName}
      currentYear={currentYear}
    />
  );
}
