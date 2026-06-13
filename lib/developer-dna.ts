export type WorkTimeDimension =
  | "Gece Kuşu"
  | "Sabahçı"
  | "Öğleden Sonracı"
  | "Akşamcı"
  | "Her Saatte";

export type CommitRhythmDimension =
  | "Küçük & Sık"
  | "Büyük & Seyrek"
  | "Patlama Yapan"
  | "Dengeli";

export type LangProfileDimension =
  | "Uzman"
  | "Poliglot"
  | "Geçiş Aşamasında"
  | "Keşifçi";

export type MsgQualityDimension =
  | "Konvansiyonalist"
  | "Minimalist"
  | "Anlatıcı"
  | "Karma";

export type FocusStyleDimension =
  | "Tek Proje"
  | "Çok Ön Yüz"
  | "Keşifçi";

export type DeveloperDNA = {
  workTime: WorkTimeDimension;
  commitRhythm: CommitRhythmDimension;
  langProfile: LangProfileDimension;
  msgQuality: MsgQualityDimension;
  focusStyle: FocusStyleDimension;
  developerType: string;
  topLang: string | null;
  confidence: number; // 0-100, ne kadar veri varsa o kadar güvenilir
};

type HourData = { hour: number; day: number; count: number };

function calcWorkTime(hourData: HourData[]): WorkTimeDimension {
  const byHour = Array.from({ length: 24 }, (_, h) =>
    hourData.filter((d) => d.hour === h).reduce((s, d) => s + d.count, 0)
  );
  const total = byHour.reduce((s, v) => s + v, 0);
  if (total === 0) return "Her Saatte";

  const night = byHour.slice(22).reduce((s, v) => s + v, 0) + byHour.slice(0, 6).reduce((s, v) => s + v, 0);
  const morning = byHour.slice(6, 12).reduce((s, v) => s + v, 0);
  const afternoon = byHour.slice(12, 17).reduce((s, v) => s + v, 0);
  const evening = byHour.slice(17, 22).reduce((s, v) => s + v, 0);

  const max = Math.max(night, morning, afternoon, evening);
  if (max / total < 0.3) return "Her Saatte";
  if (max === night) return "Gece Kuşu";
  if (max === morning) return "Sabahçı";
  if (max === afternoon) return "Öğleden Sonracı";
  return "Akşamcı";
}

function calcCommitRhythm(
  timestamps: string[],
  avgAdditions: number,
  avgDeletions: number,
): CommitRhythmDimension {
  if (timestamps.length < 5) return "Dengeli";

  // Günlük commit dağılımı
  const dayMap = new Map<string, number>();
  for (const ts of timestamps) {
    const d = ts.slice(0, 10);
    dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
  }
  const days = Array.from(dayMap.values());
  const activeDays = days.length;
  const avgPerDay = timestamps.length / Math.max(activeDays, 1);
  const maxDay = Math.max(...days);

  // Burst: tek günde çok fazla commit
  if (maxDay >= 10 && maxDay > avgPerDay * 3) return "Patlama Yapan";

  // Büyük & Seyrek: az commit ama çok satır
  if (avgAdditions + avgDeletions > 200 && avgPerDay < 2) return "Büyük & Seyrek";

  // Küçük & Sık: yüksek frekanslı, az satır değişikliği
  if (avgPerDay >= 3 && avgAdditions + avgDeletions < 100) return "Küçük & Sık";

  return "Dengeli";
}

function calcLangProfile(languageCount: number, topLangPct: number): LangProfileDimension {
  if (languageCount <= 1) return "Uzman";
  if (languageCount >= 5) return "Poliglot";
  // Bir dil > %70 ise uzmanlaşıyor ama henüz uzman değil
  if (topLangPct > 70 && languageCount <= 3) return "Geçiş Aşamasında";
  return "Keşifçi";
}

function calcMsgQuality(
  conventionalPct: number,
  avgMsgLength: number,
): MsgQualityDimension {
  if (conventionalPct >= 60) return "Konvansiyonalist";
  if (avgMsgLength <= 20) return "Minimalist";
  if (avgMsgLength >= 60) return "Anlatıcı";
  return "Karma";
}

function calcFocusStyle(
  repoCount: number,
  topRepoCommitPct: number,
): FocusStyleDimension {
  if (repoCount <= 2 || topRepoCommitPct >= 70) return "Tek Proje";
  if (repoCount >= 6) return "Keşifçi";
  return "Çok Ön Yüz";
}

function buildDeveloperType(
  workTime: WorkTimeDimension,
  langProfile: LangProfileDimension,
  topLang: string | null,
  focusStyle: FocusStyleDimension,
  commitRhythm: CommitRhythmDimension,
): string {
  const parts: string[] = [];

  // Zaman etiketi
  if (workTime === "Gece Kuşu") parts.push("Gece Çalışan");
  else if (workTime === "Sabahçı") parts.push("Sabah Erken Kalkan");
  else if (workTime === "Akşamcı") parts.push("Akşamcı");
  else if (workTime === "Öğleden Sonracı") parts.push("Öğleden Sonra Üretken");

  // Dil etiketi
  if (topLang && langProfile === "Uzman") {
    parts.push(`${topLang} Uzmanı`);
  } else if (langProfile === "Poliglot") {
    parts.push("Poliglot Geliştirici");
  } else if (topLang) {
    parts.push(`${topLang} Yazarı`);
  }

  // Odak / ritim eki
  if (focusStyle === "Keşifçi") parts.push("· Proje Gezgini");
  else if (commitRhythm === "Patlama Yapan") parts.push("· Sprint Ustası");
  else if (commitRhythm === "Küçük & Sık") parts.push("· Sürekli Teslimatçı");

  return parts.join(" ") || "Bağımsız Geliştirici";
}

export type DNAInput = {
  hourData: HourData[];
  commitTimestamps: string[];
  avgAdditions: number;
  avgDeletions: number;
  languageCount: number;
  topLangBytes: number;
  totalLangBytes: number;
  topLang: string | null;
  conventionalPct: number;
  avgMsgLength: number;
  repoCount: number;
  totalCommits: number;
  topRepoCommits: number;
};

export function calcDeveloperDNA(input: DNAInput): DeveloperDNA {
  const {
    hourData, commitTimestamps, avgAdditions, avgDeletions,
    languageCount, topLangBytes, totalLangBytes, topLang,
    conventionalPct, avgMsgLength, repoCount, totalCommits, topRepoCommits,
  } = input;

  const topLangPct = totalLangBytes > 0 ? (topLangBytes / totalLangBytes) * 100 : 0;
  const topRepoCommitPct = totalCommits > 0 ? (topRepoCommits / totalCommits) * 100 : 0;

  const workTime = calcWorkTime(hourData);
  const commitRhythm = calcCommitRhythm(commitTimestamps, avgAdditions, avgDeletions);
  const langProfile = calcLangProfile(languageCount, topLangPct);
  const msgQuality = calcMsgQuality(conventionalPct, avgMsgLength);
  const focusStyle = calcFocusStyle(repoCount, topRepoCommitPct);
  const developerType = buildDeveloperType(workTime, langProfile, topLang, focusStyle, commitRhythm);

  // Güven skoru: ne kadar commit var
  const confidence = Math.min(100, Math.round((totalCommits / 50) * 100));

  return { workTime, commitRhythm, langProfile, msgQuality, focusStyle, developerType, topLang, confidence };
}
