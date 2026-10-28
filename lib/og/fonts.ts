/**
 * Recursive for PNG images (next/og). Google Fonts serves static TTF
 * instances per MONO value when asked without a browser user agent. Loaded
 * once per server instance; if the network is unavailable the images fall
 * back to the bundled default font.
 */
type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 600 | 800; style: "normal" };

let cache: Promise<OgFont[]> | null = null;

async function load(mono: 0 | 1, weights: (400 | 600 | 800)[], name: string): Promise<OgFont[]> {
  const spec = weights.map((w) => `${mono},${w}`).join(";");
  const css = await fetch(`https://fonts.googleapis.com/css2?family=Recursive:MONO,wght@${spec}`, { cache: "force-cache" }).then((r) => r.text());
  const urls = [...css.matchAll(/font-weight:\s*(\d+);[\s\S]*?src:\s*url\(([^)]+)\)\s*format\('truetype'\)/g)];
  return Promise.all(
    urls.map(async ([, w, url]) => ({
      name,
      data: await fetch(url, { cache: "force-cache" }).then((r) => r.arrayBuffer()),
      weight: Number(w) as 400 | 600 | 800,
      style: "normal" as const,
    })),
  );
}

export function ogFonts(): Promise<OgFont[]> {
  if (!cache) {
    cache = Promise.all([load(0, [400, 600, 800], "RecSans"), load(1, [400, 600, 800], "RecMono")])
      .then(([a, b]) => [...a, ...b])
      .catch(() => {
        cache = null;
        return [];
      });
  }
  return cache;
}

export const OG_SANS = "RecSans";
export const OG_MONO = "RecMono";
