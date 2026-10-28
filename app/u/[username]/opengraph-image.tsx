import { ImageResponse } from "next/og";
import { devCardImage } from "@/lib/og/dev-card";

export const alt = "Devboard profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The shared preview of /u/[username] is the same Developer Card people download.
export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const img = await devCardImage({ username, format: "og", lang: "en" });
  return img ?? new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", background: "#0c0e11" }} />, size);
}
