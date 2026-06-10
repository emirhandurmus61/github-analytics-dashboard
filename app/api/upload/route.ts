import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Dosya bulunamadi" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Desteklenmeyen dosya tipi. JPEG, PNG, GIF, WebP, SVG kullanin." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Dosya 5MB'dan buyuk olamaz" }, { status: 400 });
  }

  const username = session.user.username;
  const ext = file.name.split(".").pop() ?? "png";
  const fileName = `${username}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from("profile-images")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: "Yukleme basarisiz: " + error.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("profile-images")
    .getPublicUrl(fileName);

  return NextResponse.json({ url: urlData.publicUrl });
}
