import { devCardImage } from "@/lib/og/dev-card";
import { langOf } from "@/lib/og/widget-data";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const url = new URL(req.url);
  const img = await devCardImage({ username, format: url.searchParams.get("format"), searchParams: url.searchParams, lang: langOf(req) });
  return img ?? new Response("Not found", { status: 404 });
}
