// Year archetype and working identity, shared by the Wrapped page and its slide images.

export type Archetype = {
  title: string;
  tagline: string;
  badge: string;
  desc: string;
  color: string;
  en: { title: string; tagline: string; badge: string; desc: string };
};

export type Identity = { label: string; emoji: string; en: { label: string } };

export function yearPersona(input: {
  commitDates: string[];
  totalCommits: number;
  longestStreak: number;
  activeRepos: number;
  linesAdded: number;
  linesDeleted: number;
}): { archetype: Archetype; identity: Identity } {
  const hours = input.commitDates.map((d) => new Date(d).getHours());
  const morning = hours.filter((h) => h >= 6 && h < 12).length;
  const afternoon = hours.filter((h) => h >= 12 && h < 18).length;
  const evening = hours.filter((h) => h >= 18 && h < 22).length;
  const night = hours.filter((h) => h >= 22 || h < 6).length;
  const max = Math.max(morning, afternoon, evening, night);
  const share = (n: number) => n / Math.max(input.totalCommits, 1);

  let identity: Identity = { label: "Öğleden sonra kodcusu", emoji: "", en: { label: "Afternoon coder" } };
  if (max === morning && morning > 0) identity = { label: "Sabah kodcusu", emoji: "", en: { label: "Morning coder" } };
  else if (max === evening && evening > 0) identity = { label: "Akşam kodcusu", emoji: "", en: { label: "Evening coder" } };
  else if (max === night && night > 0) identity = { label: "Gece kodcusu", emoji: "", en: { label: "Night coder" } };

  const a = (tr: [string, string, string], en: [string, string, string], badge: string, color: string): Archetype => ({
    title: tr[0],
    tagline: tr[1],
    desc: tr[2],
    badge,
    color,
    en: { title: en[0], tagline: en[1], desc: en[2], badge },
  });

  let archetype = a(
    ["Kaşif", "Yıl boyunca farklı repolarda üretmeye devam ettin.", `${input.totalCommits} commit, ${input.activeRepos} aktif repo.`],
    ["Explorer", "You kept shipping across different repos all year.", `${input.totalCommits} commits across ${input.activeRepos} active repos.`],
    "--explorer",
    "#38bdf8",
  );
  if (night > 0 && night >= max && share(night) > 0.25) {
    archetype = a(
      ["Gece Mimarı", "En iyi işini herkes uyurken çıkarıyorsun.", "Commitlerinin dörtte birinden fazlası gece 22 ile sabah 6 arasında."],
      ["Night Architect", "You do your best work while everyone sleeps.", "More than a quarter of your commits landed between 10pm and 6am."],
      "--nocturnal",
      "#a855f7",
    );
  } else if (morning > 0 && morning >= max && share(morning) > 0.25) {
    archetype = a(
      ["Şafak Kodcusu", "Günün ilk commiti hep senden.", "Commitlerinin dörtte birinden fazlası sabah 6 ile 12 arasında."],
      ["Early Bird", "The day's first commit is usually yours.", "More than a quarter of your commits landed between 6am and noon."],
      "--early-bird",
      "#f59e0b",
    );
  } else if (input.longestStreak >= 10) {
    archetype = a(
      ["Zincir Ustası", "Zinciri kırmayan istikrar.", `${input.longestStreak} gün aralıksız commit.`],
      ["Streak Master", "Consistency that does not break the chain.", `${input.longestStreak} days of commits without a gap.`],
      "--unbroken",
      "#ef4444",
    );
  } else if (input.totalCommits >= 250) {
    archetype = a(
      ["Kod Makinesi", "Terminalin hiç soğumadı.", `${input.totalCommits} commit ile yıl boyunca durmadan ürettin.`],
      ["Code Machine", "Your terminal never cooled down.", `${input.totalCommits} commits, shipped all year long.`],
      "--powerhouse",
      "#10b981",
    );
  } else if (input.linesDeleted > input.linesAdded * 0.35 && input.linesDeleted > 500) {
    archetype = a(
      ["Sadeleştirici", "Az kod, çok iş.", "Eklediğin kadar sildin; kod tabanı hafifledi."],
      ["Simplifier", "Less code, more done.", "You deleted almost as much as you added; the codebase got lighter."],
      "--refactor",
      "#06b6d4",
    );
  }
  return { archetype, identity };
}
