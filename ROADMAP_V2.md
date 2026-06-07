# Dev Analytics Dashboard — v2 Yol Haritası

Mevcut durum: Temel dashboard çalışıyor — heatmap, dil dağılımı, repo listesi, saat grafiği, public profil sayfası var.

Bu yol haritası projeyi sıradan bir istatistik aracından **gerçekten kullanılan ve dikkat çeken** bir ürüne dönüştürür.

---

## Faz A — Veri Derinliği (En Değerli Kısım)

Şu an commitler var ama içleri boş. Bunu doldurmak her şeyi değiştirir.

### A.1 Commit Detayları
- Commit başına `additions` ve `deletions` çek (GitHub API `/commits/:sha`)
- "Toplam yazılan satır", "toplam silinen satır" kartları ekle
- En büyük commit'ler listesi ("tek seferde 2.400 satır yazmışsın")
- **Neden değerli:** Commit sayısı değil, kod kalitesi ve hacmi gösterir

### A.2 Streak Takibi
- Kaç gün üst üste commit attığını hesapla
- Mevcut streak ve en uzun streak kartı
- Streak kırıldığında neden kırıldığını göster (hafta sonu mu, tatil mi)
- **Neden değerli:** GitHub'ın streak'i yok, bu özellik tek başına kullanıcı çeker

### A.3 GitHub Issues & PR Analizi
- Açtığın / kapattığın issue sayısı
- Merge ettiğin PR sayısı ve ortalama PR boyutu
- Review yaptığın PR sayısı (başkalarının koduna katkı)
- **Neden değerli:** Commit atmak tek metrik değil, bu resmi tamamlar

---

## Faz B — Akıllı İçgörüler

Veri göstermek yetmez — veriyi yorumlayıp kullanıcıya anlat.

### B.1 Otomatik İçgörü Kartları
Sayfanın üstünde dinamik mesajlar:
- "Bu ay geçen aya göre %34 daha az commit attın"
- "En verimli günün Salı, en az üretken günün Cumartesi"
- "TypeScript kullanımın 6 ayda %12'den %94'e çıktı"
- "halisaha reposuna bu yıl en çok commit attın (127)"
- **Neden değerli:** Kullanıcı grafiğe bakmak zorunda kalmaz, önemli olan öne çıkar

### B.2 Yıllık Özet (GitHub Wrapped)
Her yıl Aralık ayında veya istediği zaman:
- O yılın en aktif ayı, günü, saati
- En çok kullanılan dil, en çok büyüyen repo
- Paylaşılabilir görsel kart (OG image gibi ama daha zengin)
- **Neden değerli:** İnsanlar bunu sosyal medyada paylaşır → proje viral olabilir

### B.3 Hedef & Takip
- "Bu hafta 20 commit" gibi hedef koy
- Progress bar ile takip et
- Hedefe ulaşınca dashboard'da kutlama animasyonu
- **Neden değerli:** Gamification — kullanıcıyı her gün geri getirir

---

## Faz C — Kullanıcı Deneyimi

### C.1 Gerçek Zamanlı Sync Durumu
Şu an sync biterken sayfa donuyor. Bunun yerine:
- Server-Sent Events ile sync progress'i gerçek zamanlı göster
- "Repolar çekiliyor: 14/21", "Commitler işleniyor: 847/2.340"
- Tamamlanınca sayfa otomatik güncellenir
- **Neden değerli:** Kullanıcı beklerken ne olduğunu bilir

### C.2 Repo Detay Sayfası
`/dashboard/repos/[reponame]` route'u:
- O repoya ait commit geçmişi grafiği
- Dil dağılımı (sadece o repo)
- En aktif olduğun saatler (o repoda)
- **Neden değerli:** Macro dashboard'dan micro detaya inme imkanı

### C.3 Karşılaştırma Modu
- "Bu ay vs geçen ay" yan yana görünüm
- "Bu yıl vs geçen yıl" heatmap karşılaştırması
- **Neden değerli:** Gelişim görünür hale gelir

---

## Faz D — Sosyal & Paylaşım

### D.1 Embed Widget
README'ye eklenebilir dinamik SVG badge:
```
[![Dev Analytics](https://devanalytics.app/api/badge/emirhandurmus)](https://devanalytics.app/u/emirhandurmus)
```
Gösterdiği bilgi: streak, bu haftaki commit sayısı, en aktif dil
- **Neden değerli:** Her GitHub profilinde reklam gibi çalışır

### D.2 Çoklu Kullanıcı Desteği
Şu an sadece sen giriş yapabiliyorsun.
- Başkaları da kendi GitHub hesabıyla giriş yapıp kendi dashboard'unu görsün
- Her kullanıcı kendi verisini görür, başkasınınkini değil
- **Neden değerli:** Gerçek bir SaaS ürünü olur

### D.3 Profil Özelleştirme
- Public profilde hangi widget'ların göründüğünü seç
- Biyografi / sosyal medya linkleri ekle
- Öne çıkan repo seç (pinned gibi)
- **Neden değerli:** Kullanıcı sahiplenme hissi — "bu benim sayfam"

---

## Faz E — Teknik İyileştirmeler (CV'ye Değer)

### E.1 Otomatik Nightly Sync
- Vercel Cron Job ile her gece 02:00 UTC'de tüm kullanıcılar sync edilir
- Sadece son sync'ten bu yana değişen veri çekilir (incremental)
- **Neden değerli:** Kullanıcı "Yenile" ye basmak zorunda kalmaz

### E.2 Rate Limit Yönetimi
- GitHub API saatte 5000 istek izin verir
- Çok fazla repo olunca kuyruk sistemi (queue) gerekli
- Kalan istek hakkını takip et, aşmak üzereyken yavaşla
- **Neden değerli:** Gerçek bir production sistemi bunu çözmek zorunda

### E.3 Caching Katmanı
- Sık sorgulanan veriler için PostgreSQL materialized view
- Dashboard yüklenince veritabanına 10 istek yerine 1 istek
- **Neden değerli:** Sayfa açılışı şu an ~2 saniye, bunu 200ms'e indir

---

## Öncelik Sırası

```
A.2 Streak  →  B.1 İçgörüler  →  C.1 Gerçek Zamanlı Sync
     →  D.1 Badge  →  D.2 Çoklu Kullanıcı  →  A.1 Commit Detayları
```

**İlk yapılacak:** Streak ve içgörüler — az iş, çok etki.  
**En zorlu:** Çoklu kullanıcı — mimari değişiklik gerektirir ama projeyi gerçek ürüne taşır.  
**En viral potansiyelli:** Badge + Wrapped — insanlar paylaşır.

---

## Hangisi CV'de En Çok Dikkat Çeker?

| Özellik | Teknik Zorluk | Görünürlük |
|---------|---------------|------------|
| Streak takibi | Düşük | Yüksek |
| Gerçek zamanlı sync (SSE) | Yüksek | Orta |
| Badge/embed | Orta | Çok Yüksek |
| Çoklu kullanıcı | Yüksek | Yüksek |
| Wrapped | Orta | Çok Yüksek |
| Rate limit queue | Yüksek | Düşük (ama teknik gösterir) |
