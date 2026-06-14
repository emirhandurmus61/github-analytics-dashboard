<div align="center">

<img src="public/globe.svg" width="64" height="64" alt="Dev Analytics Logo" />

# Dev Analytics Dashboard

**GitHub aktiviteni derinlemesine analiz et. Streak'ini koru. Gelişimini paylaş.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/Lisans-MIT-blue)](LICENSE)

</div>

---

## İçindekiler / Table of Contents

- [Türkçe](#-türkçe)
- [English](#-english)

---

# 🇹🇷 Türkçe

## Nedir?

Dev Analytics Dashboard, GitHub commit geçmişini ve aktiviteni görselleştiren, gelişimini takip etmeni ve paylaşmanı sağlayan kapsamlı bir geliştirici analitik platformudur. Basit bir heatmap'in çok ötesine geçerek streak analizi, dil evrimi, çalışma ritmi, rozet sistemi ve sosyal özellikler sunar.

## Özellikler

### Analitik & Görselleştirme
- **Katkı Heatmap'i** — Yıllık commit dağılımı, tema rengiyle renklendirme
- **Velocity Grafiği** — 12 haftalık commit trendi
- **Dil Evrimi** — 12 aylık stacked area chart ile hangi dilde ne kadar zaman harcadığın
- **Çalışma Ritmi Analizi** — Pik saat, gece/sabah etiketi, oturum analizi
- **Commit Kalite Göstergeleri** — Conventional commit oranı, mesaj uzunluğu, en büyük commitler
- **Repo Sağlık Skoru** — 4 faktörlü 0-100 skor sistemi

### Kişiselleştirme
- **6 Tema Rengi** — Emerald, Violet, Rose, Amber, Sky, Cyan
- **Sürükle-Bırak Grid** — Widget'ları dilediğin gibi sırala ve yeniden boyutlandır
- **Public Profil Sayfası** — `/u/kullaniciadı` adresinde özelleştirilebilir profil
- **README Editörü** — Özel içerik yaz veya GitHub profilinden otomatik çek
- **Sosyal Linkler** — Twitter, LinkedIn, Website, Discord

### Gamification
- **Streak Takibi** — Günlük commit serisi, en uzun streak rekoru
- **Streak Koruma Bildirimi** — Akşam 20:00'da "streak tehlikede" uyarısı
- **8 Rozet Sistemi** — 3 nadirlik seviyesi (Common / Rare / Epic)
- **Haftalık Hedef** — Commit hedefi belirle, geçmiş grafikleriyle karşılaştır
- **Gelişmiş Hedef Sistemi** — Günlük, haftalık, aylık, quarterly hedef zincirleme
- **Liderlik Tablosu** — Opt-in sıralama (commit, streak, rozet kategorileri)

### Sosyal & Paylaşım
- **Developer Card** — PNG kart üret, Twitter/LinkedIn'de paylaş
- **GitHub README Widget'ları** — SVG embed (streak, heatmap, dil dağılımı, rozetler)
- **GitHub Wrapped** — Yıllık özet, slide-by-slide deneyimi
- **Arkadaş & Takip Sistemi** — Geliştiricileri takip et, aktivite akışını izle
- **Takip Akışı** — Takip ettiğin kişilerin streak ve commit aktiviteleri
- **Ziyaretçi Sayacı** — Profil görüntülenme istatistikleri

### Bildirimler & Otomasyon
- **Web Push Bildirimleri** — Streak uyarısı, rozet kazanımı, haftalık özet
- **Haftalık E-posta Özeti** — Resend API ile her Pazartesi sabahı
- **Gece Otomatik Sync** — Cron ile gece 23:50'de GitHub verisi güncellenir
- **Incremental Sync** — Sadece değişen veriyi çeker, hızlı ve verimli

### Analiz
- **Developer DNA** — Commit verilerinden kişilik analizi (çalışma zamanı, commit ritmi, dil profili, mesaj stili, odak stili)
- **Yüzdelik Dilim Sıralaması** — Platform genelinde anonim karşılaştırma
- **Akıllı Commit Zaman Çizelgesi** — Filtrelenebilir, aranabilir commit günlüğü

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| UI Bileşenleri | Lucide React, Recharts, @dnd-kit, canvas-confetti |
| Auth | NextAuth.js (GitHub OAuth) |
| Veritabanı | Supabase (PostgreSQL) |
| Push Bildirimi | Web Push API, web-push |
| E-posta | Resend API |
| OG Görseller | @vercel/og + Satori |
| Deploy | Vercel |

## Kurulum

### Gereksinimler

- Node.js 18+
- Supabase hesabı
- GitHub OAuth App

### 1. Repoyu klonla

```bash
git clone https://github.com/emirhandurmus61/github-analytics-dashboard.git
cd github-analytics-dashboard
npm install
```

### 2. Ortam değişkenlerini ayarla

`.env.local` dosyası oluştur:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# GitHub OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:email@ornek.com

# Cron güvenlik
CRON_SECRET=...

# E-posta (opsiyonel)
RESEND_API_KEY=...
```

### 3. Veritabanını oluştur

Supabase SQL Editor'de sırayla çalıştır:

```
supabase/schema.sql
supabase/schema_v2.sql
...
supabase/schema_v12.sql
```

### 4. Geliştirme sunucusunu başlat

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresini aç.

## Proje Yapısı

```
├── app/
│   ├── api/              # API route'ları
│   │   ├── follow/       # Takip sistemi
│   │   ├── card/         # PNG Developer Card
│   │   ├── widget/       # SVG README widget'ları
│   │   ├── push-*/       # Web Push endpoints
│   │   └── cron/         # Otomatik sync
│   ├── dashboard/        # Dashboard widget bileşenleri
│   ├── u/[username]/     # Public profil sayfası
│   ├── leaderboard/      # Liderlik tablosu
│   └── u/[username]/[year]/ # GitHub Wrapped
├── lib/                  # Yardımcı fonksiyonlar
│   ├── streak.ts         # Streak hesaplama
│   ├── badges.ts         # Rozet sistemi
│   ├── developer-dna.ts  # DNA analizi
│   └── themes.ts         # Tema sistemi
├── supabase/             # SQL migration dosyaları
└── components/           # Paylaşılan UI bileşenleri
```

---

# 🇬🇧 English

## What is it?

Dev Analytics Dashboard is a comprehensive developer analytics platform that visualizes your GitHub commit history and activity, helping you track and share your growth. It goes far beyond a simple heatmap — offering streak analysis, language evolution, work rhythm insights, a badge system, and social features.

## Features

### Analytics & Visualization
- **Contribution Heatmap** — Annual commit distribution with theme-colored cells
- **Velocity Chart** — 12-week commit trend graph
- **Language Evolution** — 12-month stacked area chart showing language usage over time
- **Work Rhythm Analysis** — Peak hour detection, night owl / early bird labels, session analysis
- **Commit Quality Metrics** — Conventional commit rate, message length, biggest commits
- **Repo Health Score** — 4-factor scoring system (0–100)

### Customization
- **6 Theme Colors** — Emerald, Violet, Rose, Amber, Sky, Cyan
- **Drag & Drop Grid** — Reorder and resize dashboard widgets freely
- **Public Profile Page** — Customizable profile at `/u/username`
- **README Editor** — Write custom content or pull automatically from your GitHub profile
- **Social Links** — Twitter, LinkedIn, Website, Discord

### Gamification
- **Streak Tracking** — Daily commit streak with all-time longest record
- **Streak Protection Alert** — "Streak at risk" push notification at 8 PM
- **8 Badge System** — 3 rarity levels (Common / Rare / Epic)
- **Weekly Goal** — Set a commit target, compare with history charts
- **Advanced Goal System** — Daily, weekly, monthly, quarterly goals with chaining
- **Leaderboard** — Opt-in ranking by commits, streak, and badges

### Social & Sharing
- **Developer Card** — Generate a PNG card, share on Twitter/LinkedIn
- **GitHub README Widgets** — SVG embeds (streak, heatmap, language distribution, badges)
- **GitHub Wrapped** — Annual summary with a slide-by-slide experience
- **Follow System** — Follow developers, watch their activity feed
- **Activity Feed** — See streak milestones and commit activity from people you follow
- **Visitor Counter** — Profile view statistics

### Notifications & Automation
- **Web Push Notifications** — Streak alerts, badge earned, weekly summary
- **Weekly Email Digest** — Every Monday morning via Resend API
- **Nightly Auto Sync** — GitHub data refreshed nightly via cron
- **Incremental Sync** — Only fetches changed data for speed and efficiency

### Intelligence
- **Developer DNA** — Personality analysis from commit data (work time, commit rhythm, language profile, message style, focus style)
- **Percentile Ranking** — Anonymous platform-wide comparison
- **Smart Commit Timeline** — Filterable, searchable commit journal

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| UI Components | Lucide React, Recharts, @dnd-kit, canvas-confetti |
| Auth | NextAuth.js (GitHub OAuth) |
| Database | Supabase (PostgreSQL) |
| Push Notifications | Web Push API, web-push |
| Email | Resend API |
| OG Images | @vercel/og + Satori |
| Deployment | Vercel |

## Setup

### Requirements

- Node.js 18+
- Supabase account
- GitHub OAuth App

### 1. Clone the repo

```bash
git clone https://github.com/emirhandurmus61/github-analytics-dashboard.git
cd github-analytics-dashboard
npm install
```

### 2. Configure environment variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# GitHub OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:email@example.com

# Cron security
CRON_SECRET=...

# Email (optional)
RESEND_API_KEY=...
```

### 3. Initialize the database

Run in order in the Supabase SQL Editor:

```
supabase/schema.sql
supabase/schema_v2.sql
...
supabase/schema_v12.sql
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── follow/       # Follow system
│   │   ├── card/         # PNG Developer Card
│   │   ├── widget/       # SVG README widgets
│   │   ├── push-*/       # Web Push endpoints
│   │   └── cron/         # Automated sync
│   ├── dashboard/        # Dashboard widget components
│   ├── u/[username]/     # Public profile page
│   ├── leaderboard/      # Leaderboard
│   └── u/[username]/[year]/ # GitHub Wrapped
├── lib/                  # Utility functions
│   ├── streak.ts         # Streak calculation
│   ├── badges.ts         # Badge system
│   ├── developer-dna.ts  # DNA analysis
│   └── themes.ts         # Theme system
├── supabase/             # SQL migration files
└── components/           # Shared UI components
```

## API Reference

| Endpoint | Description |
|----------|-------------|
| `GET /api/card/[username]` | Generate PNG Developer Card |
| `GET /api/widget/streak/[username]` | Streak SVG widget |
| `GET /api/widget/heatmap/[username]` | Heatmap SVG widget |
| `GET /api/widget/langs/[username]` | Language distribution SVG |
| `GET /api/widget/stats/[username]` | Stats SVG widget |
| `GET /api/follow/[username]` | Follow status & counts |
| `POST /api/follow/[username]` | Toggle follow |
| `GET /api/follow/feed` | Activity feed |
| `POST /api/sync` | Trigger manual sync |
| `POST /api/push-subscribe` | Register push subscription |

## License

MIT © [Emirhan Durmuş](https://github.com/emirhandurmus61)
