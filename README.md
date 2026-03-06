# 🐄 MandıraM v1.0
### Dijital Hayvan Kayıt ve Yönetim Sistemi

---

## 🚀 Hızlı Başlangıç (5 dakika)

```bash
# 1. Bağımlılıkları kur
npm install

# 2. Ortam değişkenlerini ayarla
cp .env.example .env.local
# → .env.local dosyasını aç, Supabase bilgilerini doldur

# 3. Çalıştır
npm run dev

# → http://localhost:3000 adresinde açılır
```

---

## 📦 Ne var bu pakette?

| Modül | Durum |
|-------|-------|
| 🔐 Giriş / Kayıt (Auth) | ✅ Hazır |
| 📊 Besici Dashboard | ✅ Hazır |
| 🐄 Hayvan Kayıt Formu (5 adım) | ✅ Hazır |
| 📷 Fotoğraf Yükleme | ✅ Hazır |
| 🔍 Arama & Filtreleme | ✅ Hazır |
| 📱 QR Kod Sistemi | ✅ Hazır |
| 🌐 QR Tarama Sayfası | ✅ Hazır |
| ⚙️ Admin Paneli | ✅ Hazır |
| 📱 PWA (Mobil Uygulama) | ✅ Hazır |
| 🖥️ Electron (Masaüstü) | ✅ Hazır |
| 📥 CSV Export | ✅ Hazır |
| 🛒 Marketplace (Phase 2) | 🔜 Yakında |
| 🐑 Kurban Modülü (Phase 3) | 🔜 Yakında |

---

## 🗂 Proje Yapısı

```
mandiram/
├── app/
│   ├── page.tsx              → / (dashboard'a yönlendirir)
│   ├── layout.tsx            → PWA meta tags
│   ├── auth/page.tsx         → Giriş / Kayıt
│   ├── dashboard/page.tsx    → Ana dashboard
│   ├── animals/new/          → Yeni hayvan ekle
│   ├── animals/[id]/         → Hayvan detayı
│   ├── scan/[id]/page.tsx    → QR tarama (public)
│   └── admin/page.tsx        → Admin paneli
├── components/
│   ├── dashboard/
│   │   ├── MandiramDashboard.tsx
│   │   ├── AnimalDetailModal.tsx
│   │   └── AddAnimalModal.tsx
│   └── animal/
│       └── AnimalForm.tsx    → 5 adımlı kayıt formu
├── lib/
│   ├── supabase.ts           → DB bağlantısı
│   └── animals.ts            → CRUD fonksiyonları
├── types/
│   └── index.ts              → TypeScript tipleri
├── public/
│   └── manifest.json         → PWA config
├── supabase/
│   └── migration.sql         → Veritabanı şeması
├── electron/
│   └── main.js               → Desktop app
├── next.config.js            → PWA + Next.js
├── package.json              → Bağımlılıklar
├── .env.example              → Örnek env
└── KURULUM.md                → Detaylı kurulum rehberi
```

---

## 🔐 Supabase Kurulumu

1. [supabase.com](https://supabase.com) → Ücretsiz hesap aç
2. "New Project" → İsim: `mandiram`
3. SQL Editor → `supabase/migration.sql` içeriğini yapıştır → Run
4. Settings → API → URL ve key'leri kopyala → `.env.local`'a yapıştır

Detaylı rehber: `KURULUM.md`

---

## 📱 PWA (Mobil Uygulama)

Sunucuya deploy ettikten sonra mobilde Chrome'u aç:
1. Siteye git
2. Sağ üst menü → "Ana ekrana ekle"
3. Uygulama gibi açılır, kamera erişimi çalışır

---

## 🖥️ Masaüstü EXE

```bash
# Windows .exe oluştur
npm run electron:build:win

# dist/ klasöründe çıkar:
# → MandıraM Setup 1.0.0.exe
# → MandıraM 1.0.0.exe (portable)
```

---

## 🌐 Deployment

```bash
# Vercel (önerilen)
npm i -g vercel
vercel

# Vercel dashboard'da env variables ekle
```

---

## 📞 Phase 2 & Phase 3

- **Phase 2** — Marketplace: Hayvan listeleme, fiyat, WhatsApp butonu
- **Phase 3** — Kurban Modülü: Ortaklı alım, hisse hesaplama

---

**MandıraM v1.0** — Besiciler için dijital altyapı 🐄
