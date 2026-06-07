# GitHub Analytics Dashboard — Yol Haritası

**Stack:** Next.js 16, React 19, TypeScript, Tailwind 4, Supabase (PostgreSQL), Vercel  
**Hedef:** Portfolio/CV için etkileyici, gerçekten çalışan bir ürün

---

## Mimari Karar: Neden Supabase?

Self-hosted yerine Supabase seçiyoruz çünkü:
- Vercel cron job'larıyla sorunsuz çalışır
- PostgreSQL'in tüm gücü (time-series sorgular, index'ler) mevcut
- Ücretsiz tier demo için yeterli
- CV'de "PostgreSQL + real-time data pipeline" yazabilirsin, bu yeterli

---

## Faz 1 — Temel Altyapı

### 1.1 Veritabanı Kurulumu (Supabase)
- [ ] Supabase projesi oluştur
- [ ] Tabloları migrate et:
  - `users` — GitHub OAuth ile gelen kullanıcı
  - `repositories` — repo metadata
  - `commits` — commit geçmişi (zaman serisi)
  - `repo_languages` — dil dağılımı
  - `daily_stats` — günlük özet (materialized)
- [ ] Index'leri ekle (committed_at, user_id, repo_id)
- [ ] Row Level Security (RLS) kurallarını yaz

### 1.2 GitHub OAuth
- [ ] NextAuth.js kur, GitHub provider ekle
- [ ] Oturum açınca user tablosuna kaydet/güncelle
- [ ] GitHub access token'ı şifreli sakla (Supabase'de)

### 1.3 GitHub API İstemcisi
- [ ] REST + GraphQL istemcisi yaz
- [ ] Rate limit yönetimi: istek sayacı + exponential backoff
- [ ] Token başına kalan istek hakkını takip et

---

## Faz 2 — Veri Pipeline

### 2.1 İlk Senkronizasyon (Initial Sync)
- [ ] Kullanıcının tüm repolarını çek
- [ ] Her repo için son 1 yılın commit'lerini çek
- [ ] Dil dağılımını çek
- [ ] Verileri normalize edip Supabase'e yaz
- [ ] İlerleme durumunu kullanıcıya göster (sync loading ekranı)

### 2.2 Artımlı Güncelleme (Incremental Sync)
- [ ] `last_synced_at` timestamp'iyle sadece yeni veriyi çek
- [ ] Vercel Cron Job: her gece 02:00 UTC'de çalışır
- [ ] Başarısız sync için retry mekanizması

### 2.3 Günlük İstatistik Özeti
- [ ] `daily_stats` tablosunu her sync sonrası güncelle
- [ ] Materialized view ile ağır sorguları önbelleğe al

---

## Faz 3 — Dashboard UI

### 3.1 Ana Sayfa / Genel Bakış
- [ ] Contribution heatmap (GitHub'ınkinden daha detaylı: saat bilgisi de var)
- [ ] Toplam commit / repo / dil sayısı kartları
- [ ] "Bu hafta vs geçen hafta" karşılaştırma satırı

### 3.2 Aktivite Grafikleri
- [ ] Günlük/haftalık/aylık commit trendi (line chart)
- [ ] Saate göre commit ısı haritası ("en verimli saatin 21:00-23:00")
- [ ] Haftanın günlerine göre aktivite bar chart

### 3.3 Dil & Teknoloji Analizi
- [ ] Toplam kod tabanı dil dağılımı (donut chart)
- [ ] Zaman içinde dil değişimi (stacked area chart)
- [ ] Repo bazında dil breakdown

### 3.4 Repo İstatistikleri
- [ ] En aktif repolar (commit sayısına göre)
- [ ] Star/fork geçmişi grafik olarak
- [ ] Repo büyüklük karşılaştırması

### 3.5 Grafik Kütüphanesi
- [ ] Recharts kur (React-native, TypeScript desteği iyi, bundle küçük)
- [ ] Tutarlı renk paleti ve tema sistemi

---

## Faz 4 — Detay & Kalite

### 4.1 Public Profil Sayfası
- [ ] `/u/[username]` route'u — herkese açık
- [ ] Paylaşılabilir link: `dashboard.vercel.app/u/emirhan`
- [ ] OG image (sosyal medyada güzel görünsün)

### 4.2 Filtreler & İnteraktivite
- [ ] Tarih aralığı seçici (son 30 gün / 90 gün / 1 yıl / tüm zamanlar)
- [ ] Repo filtresi (fork'ları gizle, archived'ları gizle)
- [ ] Dil filtresi

### 4.3 Dark Mode
- [ ] Tailwind dark mode desteği
- [ ] Sistem tercihine göre otomatik

### 4.4 Responsive Tasarım
- [ ] Mobil uyumlu layout
- [ ] Dashboard grid'i ekrana göre ölçeklenir

---

## Faz 5 — Yayın & Portfolio

### 5.1 Vercel Deploy
- [ ] Environment variable'ları ayarla
- [ ] Preview deployment branch'i kur
- [ ] Custom domain (isteğe bağlı)

### 5.2 Demo Hesabı
- [ ] Giriş yapmadan görüntülenebilen demo modu
- [ ] Kendi GitHub verin ile dolu, gerçek grafikleri göster

### 5.3 README
- [ ] Proje açıklaması + ekran görüntüleri
- [ ] "Deploy your own" butonu (Vercel one-click deploy)
- [ ] Teknik mimari açıklaması (CV'de konuşma konusu olur)

---

## Başlangıç Sırası

```
Faz 1 (Altyapı) → Faz 2 (Data Pipeline) → Faz 3 (UI) → Faz 4 (Detay) → Faz 5 (Yayın)
```

Faz 2 bitmeden UI'a geçme — gerçek veri olmadan grafik yazmak zaman kaybı.

---

## CV'de Ne Anlatırsın?

- GitHub REST + GraphQL API entegrasyonu ve rate limit yönetimi
- Incremental sync ile verimli veri pipeline'ı
- Time-series veri modelleme ve PostgreSQL index optimizasyonu
- Vercel Cron Job ile zamanlanmış background işlem
- Next.js 16 App Router, Server Components, TypeScript

---

## Tahmini Süre

| Faz | Süre |
|-----|------|
| Faz 1 — Altyapı | 1-2 gün |
| Faz 2 — Data Pipeline | 2-3 gün |
| Faz 3 — UI | 3-4 gün |
| Faz 4 — Detay | 1-2 gün |
| Faz 5 — Yayın | 1 gün |
| **Toplam** | **~10 gün** |
