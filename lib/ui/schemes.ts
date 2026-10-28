/**
 * Color schemes.
 *
 * Every scheme fills the same token slots, so any interface (editor, terminal,
 * studio) can be combined with any scheme. Community schemes keep their
 * published palettes (all MIT licensed); slot assignments are ours.
 *
 *   bg[0] canvas      the app background
 *   bg[1] surface     panels and cards
 *   bg[2] raised      hover fills, nested blocks
 *   bg[3] inset       tracks, empty heatmap cells, wells
 *   ink[0..3]         primary → faint text
 */

export type SchemeKind = "dark" | "light";

export type SchemeId =
  | "devboard-night"
  | "tokyo-night"
  | "catppuccin-mocha"
  | "gruvbox-dark"
  | "nord"
  | "dracula"
  | "rose-pine"
  | "solarized-dark"
  | "contrast-dark"
  | "devboard-day"
  | "catppuccin-latte"
  | "gruvbox-light"
  | "solarized-light"
  | "rose-pine-dawn";

export type HueName =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "purple"
  | "pink";

export interface Scheme {
  id: SchemeId;
  name: string;
  kind: SchemeKind;
  bg: [string, string, string, string];
  line: string;
  line2: string;
  ink: [string, string, string, string];
  hue: Record<HueName, string>;
  onAccent: string;
}

export const SCHEMES: Record<SchemeId, Scheme> = {
  "devboard-night": {
    id: "devboard-night",
    name: "Devboard Night",
    kind: "dark",
    bg: ["#0c0e11", "#13161b", "#1a1e25", "#222731"],
    line: "#222832",
    line2: "#323a47",
    ink: ["#e7eaef", "#a8afbb", "#737c8a", "#4c5461"],
    hue: {
      red: "#f47a85",
      orange: "#f4a064",
      yellow: "#e8c56a",
      green: "#5fd396",
      cyan: "#5ccad8",
      blue: "#76a8ff",
      purple: "#b59cf6",
      pink: "#f08cc4",
    },
    onAccent: "#0c0e11",
  },
  "tokyo-night": {
    id: "tokyo-night",
    name: "Tokyo Night",
    kind: "dark",
    bg: ["#16161e", "#1a1b26", "#1f2335", "#292e42"],
    line: "#262a3d",
    line2: "#3b4261",
    ink: ["#c0caf5", "#a9b1d6", "#737aa2", "#545c7e"],
    hue: {
      red: "#f7768e",
      orange: "#ff9e64",
      yellow: "#e0af68",
      green: "#9ece6a",
      cyan: "#7dcfff",
      blue: "#7aa2f7",
      purple: "#bb9af7",
      pink: "#f4a3d0",
    },
    onAccent: "#16161e",
  },
  "catppuccin-mocha": {
    id: "catppuccin-mocha",
    name: "Catppuccin Mocha",
    kind: "dark",
    bg: ["#181825", "#1e1e2e", "#262637", "#313244"],
    line: "#313244",
    line2: "#45475a",
    ink: ["#cdd6f4", "#bac2de", "#7f849c", "#585b70"],
    hue: {
      red: "#f38ba8",
      orange: "#fab387",
      yellow: "#f9e2af",
      green: "#a6e3a1",
      cyan: "#89dceb",
      blue: "#89b4fa",
      purple: "#cba6f7",
      pink: "#f5c2e7",
    },
    onAccent: "#1e1e2e",
  },
  "gruvbox-dark": {
    id: "gruvbox-dark",
    name: "Gruvbox Dark",
    kind: "dark",
    bg: ["#1d2021", "#282828", "#32302f", "#3c3836"],
    line: "#3c3836",
    line2: "#504945",
    ink: ["#ebdbb2", "#d5c4a1", "#a89984", "#7c6f64"],
    hue: {
      red: "#fb4934",
      orange: "#fe8019",
      yellow: "#fabd2f",
      green: "#b8bb26",
      cyan: "#8ec07c",
      blue: "#83a598",
      purple: "#d3869b",
      pink: "#e8a0b4",
    },
    onAccent: "#1d2021",
  },
  nord: {
    id: "nord",
    name: "Nord",
    kind: "dark",
    bg: ["#242933", "#2e3440", "#353c4a", "#3b4252"],
    line: "#3b4252",
    line2: "#4c566a",
    ink: ["#eceff4", "#d8dee9", "#9aa5b9", "#616e88"],
    hue: {
      red: "#bf616a",
      orange: "#d08770",
      yellow: "#ebcb8b",
      green: "#a3be8c",
      cyan: "#88c0d0",
      blue: "#81a1c1",
      purple: "#b48ead",
      pink: "#c895bf",
    },
    onAccent: "#2e3440",
  },
  dracula: {
    id: "dracula",
    name: "Dracula",
    kind: "dark",
    bg: ["#1e1f29", "#282a36", "#2f3241", "#363949"],
    line: "#363949",
    line2: "#44475a",
    ink: ["#f8f8f2", "#cfd0dc", "#8b91b5", "#6272a4"],
    hue: {
      red: "#ff5555",
      orange: "#ffb86c",
      yellow: "#f1fa8c",
      green: "#50fa7b",
      cyan: "#8be9fd",
      blue: "#94a9ff",
      purple: "#bd93f9",
      pink: "#ff79c6",
    },
    onAccent: "#282a36",
  },
  "rose-pine": {
    id: "rose-pine",
    name: "Rosé Pine",
    kind: "dark",
    bg: ["#13111c", "#191724", "#1f1d2e", "#26233a"],
    line: "#26233a",
    line2: "#403d52",
    ink: ["#e0def4", "#c4c1dc", "#908caa", "#6e6a86"],
    hue: {
      red: "#eb6f92",
      orange: "#f0a581",
      yellow: "#f6c177",
      green: "#9ed4ae",
      cyan: "#9ccfd8",
      blue: "#5aa2c4",
      purple: "#c4a7e7",
      pink: "#ebbcba",
    },
    onAccent: "#191724",
  },
  "solarized-dark": {
    id: "solarized-dark",
    name: "Solarized Dark",
    kind: "dark",
    bg: ["#00222b", "#002b36", "#04313d", "#073642"],
    line: "#073642",
    line2: "#164c58",
    ink: ["#eee8d5", "#93a1a1", "#71868d", "#586e75"],
    hue: {
      red: "#dc322f",
      orange: "#cb4b16",
      yellow: "#b58900",
      green: "#859900",
      cyan: "#2aa198",
      blue: "#268bd2",
      purple: "#6c71c4",
      pink: "#d33682",
    },
    onAccent: "#fdf6e3",
  },
  "contrast-dark": {
    id: "contrast-dark",
    name: "High Contrast",
    kind: "dark",
    bg: ["#000000", "#0a0a0a", "#161616", "#222222"],
    line: "#3d3d3d",
    line2: "#6e6e6e",
    ink: ["#ffffff", "#e3e3e3", "#bdbdbd", "#8f8f8f"],
    hue: {
      red: "#ff6b6b",
      orange: "#ffa94d",
      yellow: "#ffe066",
      green: "#69f0ae",
      cyan: "#66e3ff",
      blue: "#82b1ff",
      purple: "#c3a6ff",
      pink: "#ff8ad8",
    },
    onAccent: "#000000",
  },
  "devboard-day": {
    id: "devboard-day",
    name: "Devboard Day",
    kind: "light",
    bg: ["#f2f3f5", "#ffffff", "#f5f6f8", "#e7eaee"],
    line: "#e1e4e9",
    line2: "#cdd2da",
    ink: ["#11141a", "#454e5c", "#6a7381", "#9aa1ac"],
    hue: {
      red: "#cf3a4b",
      orange: "#bd5517",
      yellow: "#9a7100",
      green: "#16864f",
      cyan: "#0d8193",
      blue: "#2a62d6",
      purple: "#7249d2",
      pink: "#bd3a87",
    },
    onAccent: "#ffffff",
  },
  "catppuccin-latte": {
    id: "catppuccin-latte",
    name: "Catppuccin Latte",
    kind: "light",
    bg: ["#e6e9ef", "#eff1f5", "#e8ebf1", "#dce0e8"],
    line: "#ccd0da",
    line2: "#bcc0cc",
    ink: ["#4c4f69", "#5c5f77", "#7c7f93", "#9ca0b0"],
    hue: {
      red: "#d20f39",
      orange: "#fe640b",
      yellow: "#df8e1d",
      green: "#40a02b",
      cyan: "#179299",
      blue: "#1e66f5",
      purple: "#8839ef",
      pink: "#ea76cb",
    },
    onAccent: "#ffffff",
  },
  "gruvbox-light": {
    id: "gruvbox-light",
    name: "Gruvbox Light",
    kind: "light",
    bg: ["#efe3b9", "#fbf1c7", "#f2e5bc", "#ebdbb2"],
    line: "#e2d3a8",
    line2: "#d5c4a1",
    ink: ["#3c3836", "#504945", "#7c6f64", "#a89984"],
    hue: {
      red: "#9d0006",
      orange: "#af3a03",
      yellow: "#b57614",
      green: "#79740e",
      cyan: "#427b58",
      blue: "#076678",
      purple: "#8f3f71",
      pink: "#b16286",
    },
    onAccent: "#fbf1c7",
  },
  "solarized-light": {
    id: "solarized-light",
    name: "Solarized Light",
    kind: "light",
    bg: ["#eee8d5", "#fdf6e3", "#f5efdc", "#ebe4cf"],
    line: "#e4ddc8",
    line2: "#d3cbb7",
    ink: ["#073642", "#586e75", "#657b83", "#93a1a1"],
    hue: {
      red: "#dc322f",
      orange: "#cb4b16",
      yellow: "#b58900",
      green: "#859900",
      cyan: "#2aa198",
      blue: "#268bd2",
      purple: "#6c71c4",
      pink: "#d33682",
    },
    onAccent: "#fdf6e3",
  },
  "rose-pine-dawn": {
    id: "rose-pine-dawn",
    name: "Rosé Pine Dawn",
    kind: "light",
    bg: ["#f2e9e1", "#fffaf3", "#faf4ed", "#f0e7df"],
    line: "#e6ded8",
    line2: "#cecacd",
    ink: ["#464261", "#575279", "#797593", "#9893a5"],
    hue: {
      red: "#b4637a",
      orange: "#d7827e",
      yellow: "#ea9d34",
      green: "#5a8f6a",
      cyan: "#56949f",
      blue: "#286983",
      purple: "#907aa9",
      pink: "#c4718a",
    },
    onAccent: "#fffaf3",
  },
};

export const DARK_SCHEMES: SchemeId[] = [
  "devboard-night",
  "tokyo-night",
  "catppuccin-mocha",
  "gruvbox-dark",
  "nord",
  "dracula",
  "rose-pine",
  "solarized-dark",
  "contrast-dark",
];

export const LIGHT_SCHEMES: SchemeId[] = [
  "devboard-day",
  "catppuccin-latte",
  "gruvbox-light",
  "solarized-light",
  "rose-pine-dawn",
];

export function isSchemeId(v: unknown): v is SchemeId {
  return typeof v === "string" && v in SCHEMES;
}

/** CSS custom properties for one scheme, as a declaration list. */
export function schemeDeclarations(s: Scheme): string {
  const d: string[] = [
    `color-scheme:${s.kind}`,
    `--scheme-kind:${s.kind}`,
    `--bg-0:${s.bg[0]}`,
    `--bg-1:${s.bg[1]}`,
    `--bg-2:${s.bg[2]}`,
    `--bg-3:${s.bg[3]}`,
    `--line:${s.line}`,
    `--line-2:${s.line2}`,
    `--ink-1:${s.ink[0]}`,
    `--ink-2:${s.ink[1]}`,
    `--ink-3:${s.ink[2]}`,
    `--ink-4:${s.ink[3]}`,
    `--on-accent:${s.onAccent}`,
    `--shadow-strength:${s.kind === "dark" ? "0.55" : "0.10"}`,
    `--scrim:${s.kind === "dark" ? "rgba(0,0,0,0.62)" : "rgba(24,28,36,0.32)"}`,
  ];
  for (const [k, v] of Object.entries(s.hue)) d.push(`--hue-${k}:${v}`);
  return d.join(";");
}

/** Inline style variables, for previews rendered with a different scheme. */
export function schemeStyle(s: Scheme): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of schemeDeclarations(s).split(";")) {
    const i = part.indexOf(":");
    const key = part.slice(0, i);
    if (key === "color-scheme") out.colorScheme = part.slice(i + 1);
    else out[key] = part.slice(i + 1);
  }
  return out;
}
