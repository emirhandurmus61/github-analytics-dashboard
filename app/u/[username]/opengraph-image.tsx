import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase";

export const alt = "Dev Analytics — GitHub Profili";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("name, avatar_url")
    .eq("username", username)
    .single();

  const { count: commitCount } = await supabaseAdmin
    .from("daily_stats")
    .select("count", { count: "exact", head: true })
    .eq(
      "user_id",
      (
        await supabaseAdmin
          .from("users")
          .select("id")
          .eq("username", username)
          .single()
      ).data?.id ?? ""
    );

  const { count: repoCount } = await supabaseAdmin
    .from("repositories")
    .select("count", { count: "exact", head: true })
    .eq(
      "user_id",
      (
        await supabaseAdmin
          .from("users")
          .select("id")
          .eq("username", username)
          .single()
      ).data?.id ?? ""
    );

  const displayName = user?.name ?? username;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#27272a",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" fill="#f4f4f5" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <span style={{ color: "#71717a", fontSize: 18 }}>Dev Analytics</span>
        </div>

        {/* Main */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {user?.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              width={80}
              height={80}
              style={{ borderRadius: 40 }}
              alt=""
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ color: "#f4f4f5", fontSize: 52, fontWeight: 700 }}>
              {displayName}
            </span>
            <span style={{ color: "#71717a", fontSize: 28 }}>@{username}</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 48 }}>
          {[
            { label: "Repo", value: repoCount ?? 0 },
            { label: "Aktif Gün (1 yıl)", value: commitCount ?? 0 },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span style={{ color: "#f4f4f5", fontSize: 40, fontWeight: 700 }}>
                {value}
              </span>
              <span style={{ color: "#71717a", fontSize: 20 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
