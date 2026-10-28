/**
 * Language identity colors (GitHub Linguist). These are data colors, not UI
 * colors, so they stay fixed across schemes. Unknown languages get a stable
 * scheme hue so they still harmonize with the active palette.
 */
export const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  CSS: "#663399",
  SCSS: "#c6538c",
  HTML: "#e34c26",
  Java: "#b07219",
  "C++": "#f34b7d",
  "C#": "#178600",
  C: "#555555",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Shell: "#89e051",
  Dart: "#00B4AB",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Astro: "#ff5a03",
  Lua: "#000080",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  Scala: "#c22d40",
  Zig: "#ec915c",
  Nix: "#7e7eff",
  Dockerfile: "#384d54",
  "Jupyter Notebook": "#DA5B0B",
  MDX: "#fcb32c",
  Solidity: "#AA6746",
  "Objective-C": "#438eff",
  PowerShell: "#012456",
  R: "#198CE7",
  Julia: "#a270ba",
  Clojure: "#db5855",
  OCaml: "#ef7a08",
  Perl: "#0298c3",
  Makefile: "#427819",
  Assembly: "#6E4C13",
};

const FALLBACK = [
  "var(--hue-purple)",
  "var(--hue-cyan)",
  "var(--hue-orange)",
  "var(--hue-pink)",
  "var(--hue-blue)",
  "var(--hue-yellow)",
  "var(--hue-green)",
  "var(--hue-red)",
];

export function langColor(lang: string | null | undefined): string {
  if (!lang) return "var(--ink-4)";
  const known = LANG_COLORS[lang];
  if (known) return known;
  let h = 0;
  for (let i = 0; i < lang.length; i++) h = (h * 31 + lang.charCodeAt(i)) >>> 0;
  return FALLBACK[h % FALLBACK.length];
}
