# GitHub Analytics Dashboard — v4 Yol Haritası
> Haziran 2026 — Mevcut durumu analiz ederek nereye gidileceğini planlar

---

## Projenin Mevcut Gücü

V3 yol haritasında planlananların büyük çoğunluğu tamamlandı:

| Özellik | Durum |
|---------|-------|
| 6 tema rengi (emerald/violet/rose/amber/sky/cyan) | ✅ |
| Public profil + widget sırası + preset layoutlar | ✅ |
| Özel bölümler (currently working on, yearly goal, tech tags, social links) | ✅ |
| Velocity grafiği (12 haftalık trend) | ✅ |
| Çalışma ritmi analizi (peak hour, gece/sabah etiketi, session analizi) | ✅ |
| Repo sağlık skoru (0–100, 4 faktörlü) | ✅ |
| Dil evrimi (12 aylık stacked area chart) | ✅ |
| Commit kalite göstergeleri (conventional, mesaj uzunluğu, biggest commits) | ✅ |
| Developer Card SVG (badge endpoint) | Kısmi |
| GitHub Wrapped `/u/[username]/[year]` | ✅ |
| Ziyaretçi sayacı + dashboard kartı | ✅ |
| Sosyal linkler (Twitter, LinkedIn, website, Discord) | ✅ |
| 8 rozet (3 nadirlik seviyesi) | ✅ |
| Haftalık hedef DB'ye kaydedilmiş + geçmiş grafik | ✅ |
| Streak koruma banner'ı | ✅ |
| Nightly cron sync | ✅ |
| Incremental sync | ✅ |
| Rate limit koruması | ✅ |
| Özelleştirilebilir grid (sürükle-bırak, span değiştirme) | ✅ |
| README editörü (özel veya GitHub'dan çek) | ✅ |
| Mobil responsive tasarım | ✅ |

**Sonuç:** Proje V3'te planlananların tamamına yakınını bitirdi. Şimdi onu gerçekten rakipsiz kılacak bir sonraki seviyeye taşıma zamanı.

---

## Faz 1 — Viral Büyüme Motorları (Öncelik: Yüksek)

Bu fazdaki her özellik platforma dışarıdan yeni kullanıcı çeker.

### 1.1 Paylaşılabilir PNG Developer Card

**Neden önemli:** Twitter/LinkedIn/Discord'da paylaşılan bir görsel → binlerce kişi görür → organik büyüme.

**Ne yapılacak:**
- `/api/card/[username]` endpoint'i `@vercel/og` ile PNG üretir
- Kart içeriği: avatar, isim, Developer DNA etiketi, en uzun streak, top 3 dil, yıllık commit sayısı, rozet sayısı
- Tema rengi otomatik devralınır (her kullanıcının kartı farklı görünür)
- 3 boyut: Twitter banner (1500×500), kare (600×600), LinkedIn (1200×630)
- Dashboard'da "Kartı İndir" + "Twitter'da Paylaş" butonları
- Public profilde embed olabilir (`<img>` etiketiyle)

**Teknik:** `@vercel/og` + Satori → saf JSX → PNG. Supabase'den veri çek, 5 dakika cache.

---

### 1.2 GitHub README Widget'ları (Embed SVG)

**Neden önemli:** Geliştiricilerin büyük kısmı GitHub profilini özelleştiriyor. Bunu desteklemek = platforma sürekli trafik.

**Ne yapılacak:**
- `/api/widget/streak/[username]` → SVG
- `/api/widget/heatmap/[username]` → SVG (mini 12 haftalık görünüm)
- `/api/widget/langs/[username]` → SVG (top 5 dil, progress bar)
- `/api/widget/badges/[username]` → SVG (kazanılan rozetler)
- Parametre: `?theme=violet&bg=dark` gibi özelleştirme
- 1 saatlik CDN cache — veri güncel kalır ama GitHub'a yük olmaz
- Settings'te "README'ye Ekle" bölümü: kopyalanabilir markdown snippet'leri

**Örnek:**
```markdown
![Streak](https://app.com/api/widget/streak/kullanici?theme=violet)
```

---

### 1.3 Wrapped — Slide-by-Slide Deneyimi

**Neden önemli:** Wrapped sayfası var ama tüm veriyi tek sayfada gösteriyor. Viral olmayan format.

**Ne yapılacak:**
- Her bölüm tam ekran slide: `useKeyboard`, swipe gesture (mobile)
- Bölümler: Yıla Hoşgeldin → En Büyük Anın → En Uzun Streak → Pik Saatin → Dilin Evrimi → Developer DNA → Rozet Koleksiyonu → Paylaş
- Her slide'da "Bu anı paylaş" butonu → o slide'ın PNG'sini `@vercel/og` ile üretir
- Yıl seçici: 2022, 2023, 2024, 2025, 2026...
- Confetti animasyonu son slide'da (canvas-confetti)
- Otomatik "Yıllık Özetini Gör" bildirimi Ocak 1'de

---

### 1.4 Opt-in Liderlik Tablosu

**Neden önemli:** Gamification'ın en güçlü silahı. İnsanlar sıralamaya girmek için çalışır.

**Ne yapılacak:**
- `/leaderboard` sayfası (public, giriş gerektirmez)
- Kategoriler: Bu Hafta En Çok Commit, En Uzun Streak, En Çok Rozet
- Filtreler: bu hafta / bu ay / tüm zamanlar
- Dil bazlı sıralama: "TypeScript geliştiricileri arasında"
- Settings'te opt-in toggle (varsayılan: kapalı)
- Listeye giren kullanıcılar için profil sayfasına "Top 10 bu hafta" rozeti

---

## Faz 2 — Derinlik & Analitik (Öncelik: Orta)

Mevcut kullanıcıları platformda tutan, "wow" dedirten özellikler.

### 2.1 Developer DNA — Kişilik Analizi

**Neden önemli:** Kişiselleştirilmiş içerik her zaman paylaşılır. "Ben buyum" hissi yaratır.

**Ne yapılacak:**
Commit verilerinden otomatik çıkarılan çok boyutlu analiz:

| Boyut | Örnek Etiketler |
|-------|----------------|
| Çalışma zamanı | Gece Kuşu / Sabahçı / Öğleden Sonracı |
| Commit ritmi | Küçük & Sık / Büyük & Seyrek / Patlama Yapan |
| Dil profili | Uzman (tek dil) / Poliglot / Geçiş Aşamasında |
| Mesaj kalitesi | Konvansiyonalist / Minimalist / Anlatıcı |
| Odak stili | Tek Proje / Çok Ön Yüz / Keşifçi |

Sonuç olarak tek bir "Developer Tipi" etiketi:
- "Gece Çalışan Rust Uzmanı"
- "Sabahın Erken Saatlerinde TypeScript Yazarı"
- "Hafta Sonu Açık Kaynak Katkıcısı"

Profil sayfasında özel bir rozet gibi göster. Paylaşılabilir.

---

### 2.2 Repo Detay Sayfası

**Neden önemli:** `/dashboard/repos/[reponame]` sayfası var ama içi boş.

**Ne yapılacak:**
- Repo'ya özel 52 haftalık commit heatmap
- Commit büyüklük dağılımı (scatter plot: tarih × additions)
- Dosya değişim sıklığı analizi (hangi dosya en çok değişti — commit mesajlarından)
- PR akışı: açılma → review → merge süresi ortalama
- Issue açık/kapalı trendi (line chart)
- Büyük commit timeline (en fazla satır değiştiren 10 commit)
- Repo sağlık skoru açıklaması (neden bu puan aldı)
- "Bu repoyu paylaş" → `/u/[username]?highlight=[reponame]`

---

### 2.3 Akıllı Commit Zaman Çizelgesi

**Neden önemli:** "Ne zaman ne yaptım" sorusunun görsel cevabı. Geliştiriciler için interaktif günlük.

**Ne yapılacak:**
- Dikey timeline: haftalar → içinde günler
- Her gün hover'da: commit mesajları, repo, +/- satır
- Filtreler: repo, dil (repo'nun primary language'ına göre), commit tipi
- "Bugün" hızlı erişim modu — o günün commit'leri detaylı
- Arama: commit mesajı içinde full-text search
- Export: belirli tarih aralığını CSV/JSON olarak indir

---

### 2.4 Karşılaştırmalı Analiz — Yüzdelik Dilim

**Neden önemli:** Sayıların anlamı ancak referans noktasıyla oluşur.

**Ne yapılacak:**
- Opt-in anonim veri havuzu (kullanıcılar katılmak isterse)
- Percentile hesapla: "Commit sayısında kullanıcıların %73'ünden üsttesin"
- Dil bazlı karşılaştırma: "TypeScript yazanlar arasında top 20%"
- Streak karşılaştırması: "Bu ayki streak'in platformun ortalamasının 2x'i"
- Dashboard'da yeni "Sıralaman" kartı
- Veri tamamen anonim — kullanıcı adı/repo paylaşılmaz

---

### 2.5 Gelişmiş Hedef Sistemi

**Neden önemli:** Haftalık commit hedefi var ama tek boyutlu.

**Ne yapılacak:**
- Hedef tipleri: Günlük commit, Haftalık PR, Aylık aktif gün, Quarterly yeni repo
- Hedef zincirleme: bir hedefi tamamlayınca sıradaki açılır
- Başarı takvimi: her hedefi tamamladığın günler yeşil işaretli
- "Şu anda 3 günlük serisin var, 7'yi geçersen rozet kazanırsın" anlık bildirim
- Hedef geçmişi grafiği: hedef vs gerçek, son 26 hafta

---

## Faz 3 — Bağlantı & Bildirimler (Öncelik: Orta)

Kullanıcıyı düzenli olarak platforma geri çeken mekanikler.

### 3.1 Web Push Bildirimleri

**Neden önemli:** En etkili re-engagement kanalı — uygulama açık olmasa bile çalışır.

**Ne yapılacak:**
- Settings'ten bildirim izni isteği
- Bildirim türleri:
  - "Streak'in tehlikede! Bugün henüz commit yapmadın" (akşam 20:00'da)
  - "Bu hafta hedefinizin %80'indesin, 3 commit daha!"
  - "Yeni rozet kazandın: Gece Kuşu 🦉"
  - "Haftalık özetin hazır"
- Bildirim saatini kullanıcı seçer
- Service Worker ile implement (Next.js app router uyumlu)

---

### 3.2 Haftalık E-posta Özeti

**Neden önemli:** Pasif kullanıcıları geri çeken, platforma değer katan içerik.

**Ne yapılacak:**
- Her Pazartesi sabahı (Resend API)
- İçerik:
  - Geçen haftanın commit sayısı vs önceki hafta (% değişim)
  - Streak durumu + haftalık hedef sonucu
  - Kazanılan rozetler
  - En aktif gün ve saat
  - "Bu hafta platformdaki sıralaman: #X"
- Tek tıkla unsubscribe (CAN-SPAM uyumlu)
- HTML şablon: proje tema rengiyle uyumlu, dark mode

---

### 3.3 Arkadaş & Takip Sistemi

**Neden önemli:** Sosyal bağlantı = uzun vadeli kullanım.

**Ne yapılacak:**
- Public profil sayfasında "Takip Et" butonu (giriş gerekli)
- Takip edilen kişilerin aktiviteleri: "kullanici 7 günlük streak kırdı"
- "Arkadaşlarınla Kıyas": kendi streak/commit vs takip ettiğin kişi
- Takipçi sayısı public profilde görünür
- Bildirim: "kullanici seni takip etmeye başladı"
- (Spam önlemi: günde max 20 takip)

---

## Faz 4 — Araç Entegrasyonları (Uzun Vadeli)

### 4.1 VS Code Extension

**Ne yapılacak:**
- Status bar: `✅ 3 commit | 🔥 14 gün streak`
- Side panel: mini dashboard (günlük commit bar, hedef progress)
- Commit yapılınca anında güncelleme (webhook veya poll)
- "Bugün X commit'in var, hedefe Y kaldı" notification
- Marketplace'e publish: `github-analytics-dashboard`

### 4.2 CLI Aracı

**Ne yapılacak:**
- `npx @github-analytics/cli stats` → terminal'de ASCII dashboard
- `npx @github-analytics/cli streak` → streak durumu
- `npx @github-analytics/cli sync` → manuel sync tetikle
- CI/CD entegrasyonu: PR açılınca repo health skoru yorum olarak

### 4.3 GitHub Actions Entegrasyonu

**Ne yapılacak:**
- `github-analytics/update-readme@v1` action
- Her push'ta README'yi otomatik güncelle (streak, commit sayısı)
- Configurable: hangi widget'lar gösterilsin

---

## Faz 5 — Monetizasyon

### 5.1 Pro Plan (~$6/ay)
- Tüm tema renkleri + özel hex renk girişi
- Sınırsız rozet koleksiyonu (yeni rozetler)
- Haftalık e-posta özeti
- PNG Developer Card tüm boyutlar
- API erişimi (kendi verinizi JSON olarak çekin)
- İstatistik geçmişi: son 3 yıl (ücretsizde 1 yıl)
- VS Code extension premium özellikler
- Öncelikli sync (kuyruğa girmeden)

### 5.2 Takım Planı (~$15/ay, 5 kişiye kadar)
- Birden fazla GitHub hesabı
- Takım dashboard: kimin ne kadar commit yaptığı
- Toplam takım streak
- PR review süresi takibi
- Haftalık takım raporu e-posta
- Özel marka (logo değiştirme)

---

## Hızlı Kazanımlar — Bu Hafta Yapılabilir

| # | Özellik | Etki | Zorluk | Süre |
|---|---------|------|--------|------|
| 1 | Developer DNA kişilik analizi | ⭐⭐⭐⭐⭐ | Düşük | 1 gün |
| 2 | PNG Developer Card (`/api/card`) | ⭐⭐⭐⭐⭐ | Orta | 2 gün |
| 3 | SVG README widget'ları | ⭐⭐⭐⭐ | Orta | 2 gün |
| 4 | Repo detay sayfası içini doldur | ⭐⭐⭐⭐ | Orta | 2 gün |
| 5 | Wrapped slide-show modu | ⭐⭐⭐⭐ | Orta | 2 gün |
| 6 | Web Push bildirimleri | ⭐⭐⭐ | Orta | 1 gün |
| 7 | Haftalık e-posta özeti (Resend) | ⭐⭐⭐⭐ | Orta | 1 gün |
| 8 | Opt-in liderlik tablosu | ⭐⭐⭐ | Orta | 2 gün |

---

## Retention Döngüsü

```
İlk Giriş
    ↓
Sync → İlk veri → "Wow" etkisi
    ↓
Rozet kazanır, streak başlar
    ↓
Akşam bildirim: "Streak'in tehlikede"
    ↓  
Geri döner, commit atar
    ↓
Pazartesi e-posta: haftalık özet
    ↓
Developer Card paylaşır → Yeni kullanıcı
    ↓
Liderlik tablosuna bakar → Rekabet
    ↓
Takip eder / takipçi alır → Sosyal bağ
    ↓
Pro'ya geçer → Revenue
```

---

## Teknik Borç & Altyapı

- [ ] **N+1 sorunu:** Repo commit sayıları ayrı ayrı çekiliyor (`Promise.all` var ama yine de N sorgu). `GROUP BY repo_id` ile tek sorguda çözülmeli
- [ ] **Redis/Upstash cache:** Dashboard verisi sayfa yüklenince hesaplanıyor. 5 dakikalık cache eklenmeli
- [ ] **Webhook sync:** Manuel/cron sync yerine GitHub webhook ile gerçek zamanlı
- [ ] **Sync kuyruğu:** Eş zamanlı çok sync isteğinde rate limit koruması (Bull/Upstash Queue)
- [ ] **Error boundary:** Widget hata verirse tüm dashboard çöküyor. Her widget izole edilmeli
- [ ] **Lighthouse skoru:** Public profil sayfası LCP optimize edilmeli (avatar lazy load, font preload)
- [ ] **Tip güvenliği:** Bazı `as unknown` cast'ler var, Zod ile API response doğrulama eklenmeli

---

## "GitHub Yerine Neden Buna Bakayım?" — Güncel Tablo

| Özellik | GitHub | Dev Analytics |
|---------|--------|--------------|
| Commit heatmap | Var | Var + renkli tema + mobil |
| Streak takibi | Yok | Var + koruma bildirimi + rozet |
| Saat/gün analizi | Yok | Var (heatmap + rhythm) |
| Velocity trend | Yok | Var (12 haftalık) |
| Dil evrimi | Yok | Var (12 aylık stacked chart) |
| Commit kalite analizi | Yok | Var (conventional, mesaj uzunluğu) |
| Repo sağlık skoru | Yok | Var (4 faktörlü, 0–100) |
| Developer DNA | Yok | Yakında |
| Paylaşılabilir PNG kart | Yok | Yakında |
| README widget'ları | Yok | Yakında |
| Yıllık Wrapped | Yok | Var (slide modu yakında) |
| Özelleştirilebilir profil | Yok | Var (6 tema, widget sırası, README) |
| Liderlik tablosu | Yok | Yakında |
| Haftalık e-posta özeti | Yok | Yakında |
| Push bildirimleri | Yok | Yakında |

---

*v4 — Haziran 2026*
