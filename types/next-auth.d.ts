import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      githubId?: number;
      username?: string;
    } & DefaultSession["user"];
  }
}
