import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { supabaseAdmin } from "./supabase";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.githubId = (profile as unknown as { id: number }).id;
        token.username = (profile as unknown as { login: string }).login;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.githubId = token.githubId as number;
      session.user.username = token.username as string;
      return session;
    },
    async signIn({ profile, account }) {
      if (!profile || !account) return false;

      const githubProfile = profile as unknown as {
        id: number;
        login: string;
        name: string | null;
        avatar_url: string;
      };

      // Kullanıcıyı veritabanına kaydet veya güncelle
      await supabaseAdmin.from("users").upsert(
        {
          github_id: githubProfile.id,
          username: githubProfile.login,
          name: githubProfile.name,
          avatar_url: githubProfile.avatar_url,
          access_token: account.access_token,
        },
        { onConflict: "github_id" }
      );

      return true;
    },
  },
});
