import AppShell from "@/components/shell/app-shell";

// Shell data loads alongside the page instead of after it.
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
