# Dev Analytics Dashboard — v3 Yol Haritası

Bu yol haritasının odağı tek bir soruya cevap vermek:
**"Neden GitHub profili yerine buna bakayım?"**

Cevap şu olmalı: Çünkü burası sadece rakam göstermiyor — kim olduğunu, nasıl çalıştığını, neyi inşa ettiğini anlatıyor. Ve tamamen senin tarzında.

---

## Faz F — Derin Kişiselleştirme

Şu an ayarlar sayfası var ama sadece widget aç/kapat seviyesinde. Bu faz onu gerçek bir kimlik aracına dönüştürür.

### F.1 Tema Sistemi
Şu an sadece koyu tema var. Kullanıcı kendi rengini seçmeli.

- **Accent rengi seçimi:** Emerald (mevcut), Violet, Rose, Amber, Sky, Cyan
- Seçilen renk tüm vurgu noktalarına yansır: heatmap rengi, progress bar, streak sayıları, aktif linkler
- Seçim DB'ye kaydedilir, public profilde de aynı renk çıkar
- **Neden değerli:** İki farklı kullanıcının profili birbirinden tamamen farklı görünür

### F.2 Profil Layout Seçimi
Public profil sayfasında widget sıralamasını sürükle-bırak ile değiştir.

- Hangi bölüm üstte, hangisi altta — kullanıcı karar verir
- Sıralama DB'ye kaydedilir (`widget_order` jsonb kolonu)
- 3 hazır preset: "Developer" (kod odaklı), "Contributor" (PR/issue odaklı), "Minimalist" (sadece heatmap + streak)
- **Neden değerli:** Profil "benim sayfam" hissini verir

### F.3 Özel Bölümler
Public profilde standart veri dışında kişisel içerik eklenebilsin.

- **"Şu an üzerinde çalıştığım"** — kısa serbest metin (max 150 karakter)
- **"Bu yıl hedefim"** — serbest metin
- **Favori araçlar/teknolojiler** — tag listesi (TypeScript, Neovim, Docker vb.)
- Bunlar sadece sayfada gösterilir, analitik değil kişisel ifade
- **Neden değerli:** CV'de olmayan ama seni anlatan bilgiler

### F.4 Heatmap Özelleştirme
- Renk paleti: Yeşil (GitHub), Mor, Turuncu, Mavi, Kırmızı
- Yoğunluk eşikleri: kaçıncı committe hangi renk tonu çıksın
- **Neden değerli:** Heatmap profilin en görünür parçası, kişisel hale gelmeli

---

## Faz G — Gerçekten Kullanışlı Analitik

Şu an "bu ay kaç commit attın" var. Bu faz "neden böyle davranıyorsun" sorusunu cevaplar.

### G.1 Velocity (Hız) Grafiği
- Son 12 haftanın commit hızı trend grafiği (line chart)
- "Yavaşlıyor musun, hızlanıyor musun?" sorusunu görsel olarak cevaplar
- Projeksiyon: bu hız devam ederse aylık tahmini commit sayısı
- **Neden değerli:** GitHub bunu hiç göstermiyor

### G.2 Çalışma Ritmi Analizi
Mevcut saat heatmap'i var ama yorum yok.

- "Sabah insanı mı gece insanı mı?" otomatik etiketi
- Hafta içi vs hafta sonu çalışma dengesi (pasta/bar grafik)
- En uzun kesintisiz çalışma seansı (aynı gün commit'ler arası süre)
- "Focus günlerin": birden fazla repoya commit attığın günler vs tek repoya odaklandığın günler
- **Neden değerli:** Kendi çalışma alışkanlıklarını görünce değiştirmeye çalışırsın

### G.3 Repo Sağlığı Skoru
Her repo için 0–100 arası skor:
- Son commit ne kadar eski? (terk edilmişlik puanı)
- Star/fork oranı
- Commit sıklığı
- Açık issue sayısı vs kapatılan
- Skor renge yansır: yeşil (aktif), sarı (yavaşlıyor), gri (arşivlenmiş)
- **Neden değerli:** 30 repon var ama gerçekte kaçı yaşıyor?

### G.4 Dil Evrimi
- Aylık dil kullanım yüzdesini zaman serisi olarak göster
- "TypeScript kullanımın 6 ayda %12'den %87'ye çıktı" gibi grafikler
- Kişisel "tech stack" çizelgesi
- **Neden değerli:** Büyümeyi sayılarla kanıtlarsın

### G.5 Commit Kalite Göstergeleri
- Ortalama commit mesajı uzunluğu (kısa mesaj = kötü pratik)
- Tek satır vs çok satır commit oranı
- En büyük commitler listesi ("tek seferde 3.400 satır yazmışsın")
- Fix/feat/refactor/chore dağılımı (conventional commits varsa)
- **Neden değerli:** Kod yazan biri için kalite görünür olmalı

---

## Faz H — Public Profili Gerçek Bir Sayfa Yap

Şu an `/u/username` var ama bir ziyaretçiyi 30 saniyeden fazla tutmuyor.

### H.1 "Developer Card" — Paylaşılabilir Görsel Kart
- Tek butonla PNG olarak indir
- Streak, top dil, en aktif saat, yıllık commit sayısı
- Seçilen tema rengiyle uyumlu tasarım
- Twitter/LinkedIn/Discord'da paylaşmak için optimize boyut (1200×630)
- **Neden değerli:** İnsanlar bunu paylaşır → proje yayılır

### H.2 GitHub Wrapped (Yıllık Özet)
Her yıl veya "oluştur" butonuyla:
- O yılın en aktif ayı, günü, saati
- Toplam yazılan satır
- Kaç repo açıldı, kaçı aktif kaldı
- En büyük commit, en uzun streak
- Dil değişim hikayesi
- Paylaşılabilir özel sayfa: `/u/username/2025`
- **Neden değerli:** Spotify Wrapped etkisi — her yıl beklenen bir şey olur

### H.3 Ziyaretçi Sayacı
- Public profil kaç kez görüntülendi (bot hariç)
- Dashboard'da "Profilini bu hafta X kişi gördü" kartı
- **Neden değerli:** Profil sahiplenme hissi artar, bakım motivasyonu oluşur

### H.4 Sosyal Linkler
Settings'ten:
- Twitter/X, LinkedIn, kişisel site, Discord kullanıcı adı
- Public profilde küçük ikonlar halinde görünür
- **Neden değerli:** Bu sayfa CV alternatifi olabilir, linkler kritik

---

## Faz I — Gamification (Kullanıcıyı Geri Getir)

### I.1 Rozet Sistemi
Otomatik kazanılan başarımlar:
- **İlk Adım** — İlk sync yapıldı
- **Ateş** — 7 günlük streak
- **Alev** — 30 günlük streak
- **Gece Kuşu** — Gece yarısından sonra commit (10+)
- **Hafta Sonu Savaşçısı** — 10 hafta sonu commit
- **Büyük Temizlik** — Tek seferde 1000+ satır silindi
- **Polglot** — 5+ dil kullanıldı
- **Açık Kaynak** — 5+ fork repo'ya commit
- Rozetler public profilde görünür, dashboard'da koleksiyon
- **Neden değerli:** İnsanlar rozet için bile geri döner

### I.2 Haftalık Hedef — Veritabanına Taşı
Şu an localStorage'da. Bu olmasa olmaz:
- Hedef DB'ye kayıtlı (cihaz değişince kaybolmaz)
- Haftalık hedef geçmişi (son 12 haftanın hedef/gerçek grafiği)
- Hedef değiştirme geçmişi ("geçen ay 20, bu ay 30 hedefledin")
- **Neden değerli:** Kullanıcı büyümesini kendi hedefleri üzerinden görür

### I.3 Streak Koruma
- Streak kırılmadan 1 gün önce uyarı (dashboard'da banner)
- "Dün commit atmadın, streakini kaybetmek üzeresin" bildirimi
- **Neden değerli:** Kullanıcıyı siteye bağlar, günlük ziyaret artırır

---

## Faz J — Teknik Altyapı (Arka Planda Değer Üretir)

### J.1 Otomatik Nightly Sync (Vercel Cron)
- Her gece 03:00 UTC'de tüm kullanıcılar sync edilir
- Kullanıcı "Yenile"ye basmak zorunda kalmaz
- Dashboard her sabah güncel veriyle açılır
- `vercel.json` config hazır, deploy edilince aktif olur

### J.2 Incremental Sync
- Şu an her sync tüm veriyi yeniden çekiyor
- Sadece son sync'ten bu yana değişen commitler çekilsin
- `since=last_synced_at` parametresi kullanılır
- Sync süresi 2 dakikadan 10 saniyeye iner
- **Neden değerli:** Hem hız hem GitHub API limiti korunur

### J.3 Rate Limit Koruması
- Her sync öncesi kalan GitHub API hakkı kontrol edilir
- 500'ün altındaysa sync ertelenir, kullanıcıya bilgi verilir
- Dashboard köşesinde API limit göstergesi (opsiyonel)

### J.4 Haftalık Hedef Bildirimleri (E-posta)
- Pazar günleri "bu haftaki özetin" maili
- NextAuth'tan gelen e-posta adresi kullanılır
- Resend veya Nodemailer ile gönderilir
- Kullanıcı isterse kapatabilir (settings'ten)

---

## Öncelik Sırası

```
F.1 Tema  →  F.3 Özel Bölümler  →  G.1 Velocity  →  H.1 Developer Card
  →  I.1 Rozetler  →  H.2 Wrapped  →  G.3 Repo Sağlığı  →  J.1 Nightly Sync
```

**İlk yapılacak (1–2 gün):** F.1 Tema + F.3 Özel Bölümler  
→ Az iş, çok etki. Profil anında daha kişisel görünür.

**En viral potansiyel:** H.1 Developer Card + H.2 Wrapped  
→ Paylaşılabilir içerik üretir, projeyi büyütür.

**En bağlayıcı:** I.1 Rozetler + I.3 Streak Uyarısı  
→ Günlük ziyaret alışkanlığı oluşturur.

**Teknik olarak en etkileyici:** G.1 Velocity + G.4 Dil Evrimi  
→ Hiçbir rakip araçta yok, CV'de konuşulur.

---

## "GitHub Yerine Neden Buna Bakayım?" Tablosu

| Özellik | GitHub | Dev Analytics |
|---------|--------|--------------|
| Commit heatmap | Var | Var + renkli tema |
| Streak | Yok | Var + rozet |
| Saat analizi | Yok | Var |
| Velocity trend | Yok | Var |
| Dil evrimi | Yok | Var |
| Developer Card | Yok | Var (indirilebilir) |
| Yıllık Wrapped | Yok | Var |
| Özelleştirme | Yok | Tam kontrol |
| Paylaşılabilir profil | Var ama sınırlı | Zengin + temalı |
