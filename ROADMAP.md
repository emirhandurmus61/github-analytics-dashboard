# GitHub Analytics Dashboard — Yol Haritası

**Stack:** Next.js 16, React 19, TypeScript, Tailwind 4, Supabase (PostgreSQL), Vercel  
**Hedef:** Portfolio/CV için etkileyici, gerçekten çalışan bir ürün

---

## Faz 1 — Temel Altyapı ✅

### 1.1 Veritabanı Kurulumu (Supabase) ✅
- [x] Supabase projesi oluştur
- [x] Tabloları migrate et (users, repositories, commits, repo_languages, daily_stats)
- [x] Index'leri ekle
- [x] Row Level Security (RLS) kurallarını yaz

### 1.2 GitHub OAuth ✅
- [x] NextAuth.js kur, GitHub provider ekle
- [x] Oturum açınca user tablosuna kaydet/güncelle
- [x] GitHub access token'ı sakla

### 1.3 GitHub API İstemcisi ✅
- [x] REST istemcisi yaz (fetchAllPages ile pagination)
- [ ] Rate limit yönetimi: exponential backoff
- [ ] Token başına kalan istek hakkını takip et

---

## Faz 2 — Veri Pipeline ✅

### 2.1 İlk Senkronizasyon ✅
- [x] Kullanıcının tüm repolarını çek
- [x] Her repo için son 1 yılın commit'lerini çek
- [x] Dil dağılımını çek
- [x] Verileri normalize edip Supabase'e yaz
- [x] Sync loading ekranı (spinner + mesaj)

### 2.2 Artımlı Güncelleme (Kısmi)
- [x] "Yenile" butonu ile manuel sync
- [ ] Vercel Cron Job: her gece otomatik sync
- [ ] Başarısız sync için retry mekanizması

### 2.3 Günlük İstatistik Özeti ✅
- [x] `daily_stats` tablosunu her sync sonrası güncelle

---

## Faz 3 — Dashboard UI (Devam ediyor 🔄)

### 3.1 Ana Sayfa / Genel Bakış ✅
- [x] Contribution heatmap
- [x] Toplam commit / repo / dil sayısı kartları
- [ ] "Bu hafta vs geçen hafta" karşılaştırma satırı

### 3.2 Aktivite Grafikleri
- [x] Son 30 gün commit bar chart
- [ ] Saate göre commit ısı haritası ("en verimli saatin 21:00-23:00")
- [ ] Haftanın günlerine göre aktivite

### 3.3 Dil & Teknoloji Analizi (Kısmi)
- [x] Dil dağılımı (progress bar)
- [ ] Zaman içinde dil değişimi (stacked area chart)

### 3.4 Repo İstatistikleri
- [ ] En aktif repolar (commit sayısına göre tablo)
- [ ] Repo büyüklük karşılaştırması

### 3.5 Grafik Kütüphanesi
- [x] Recharts kuruldu

---

## Faz 4 — Detay & Kalite

### 4.1 Public Profil Sayfası ✅
- [x] `/u/[username]` route'u — herkese açık
- [x] Paylaşılabilir link
- [ ] OG image (sosyal medyada önizleme)

### 4.2 Filtreler & İnteraktivite
- [ ] Tarih aralığı seçici (son 30 gün / 90 gün / 1 yıl)
- [ ] Repo filtresi (fork'ları gizle)

### 4.3 Dark Mode ✅
- [x] Proje baştan dark mode (zinc-950 base)

### 4.4 Responsive Tasarım
- [ ] Mobil uyumlu layout
- [ ] Dashboard grid'i ekrana göre ölçeklenir

---

## Faz 5 — Yayın & Portfolio

### 5.1 Vercel Deploy
- [ ] Environment variable'ları Vercel'e ekle
- [ ] Deploy et
- [ ] Custom domain (isteğe bağlı)

### 5.2 Demo Modu
- [ ] Giriş yapmadan görüntülenebilen demo profil

### 5.3 README
- [ ] Proje açıklaması + ekran görüntüleri
- [ ] "Deploy your own" butonu
- [ ] Teknik mimari açıklaması
