# MandıraM — Kurulum Rehberi
## .env Ayarları, Supabase Kurulumu, Deployment

---

## 1. PROJE OLUŞTURMA

```bash
# Next.js projesi kur
npx create-next-app@latest mandiram --typescript --tailwind --app

cd mandiram

# Gerekli paketleri yükle
npm install @supabase/supabase-js qrcode @types/qrcode next-pwa
npm install -D @types/node
```

---

## 2. SUPABASE KURULUMU

### 2.1 Proje Oluştur
1. https://supabase.com → "New Project"
2. Organization: kendi hesabın
3. Project name: `mandiram`
4. Database password: Güçlü bir şifre yaz → **kaydet!**
5. Region: `West EU (Ireland)` → Türkiye'ye en yakın
6. "Create new project" → ~2 dk bekle

### 2.2 SQL Migration Çalıştır
1. Sol menü → **SQL Editor**
2. "New query"
3. `supabase_migration.sql` dosyasının tüm içeriğini yapıştır
4. **Run** (F5)
5. "Success" mesajı görmelisin

### 2.3 Storage Bucket Oluştur
1. Sol menü → **Storage**
2. "New bucket"
   - Name: `animal-media`
   - Public bucket: **KAPALI** (private)
   - File size limit: `10485760` (10MB)
3. Bucket oluştuktan sonra → Policies sekmesi
4. "New policy" → Template: "Give users access to own folder"

### 2.4 Auth Ayarları
1. Sol menü → **Authentication** → Settings
2. Site URL: `http://localhost:3000` (geliştirme için)
3. Redirect URLs: `http://localhost:3000/auth/callback`
4. Email confirmations: İstersen kapat (geliştirmede kolaylık için)

### 2.5 API Anahtarları Al
1. Sol menü → **Settings** → API
2. Şunları kopyala:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon/public key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role key** (SUPABASE_SERVICE_ROLE_KEY) ← GİZLİ TUT!

---

## 3. .env DOSYASI

Proje kök dizinine `.env.local` dosyası oluştur:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MandıraM

# Production'da değiştir:
# NEXT_PUBLIC_APP_URL=https://mandiram.com
```

⚠️ `.gitignore` dosyasında `.env.local` olduğunu kontrol et!

---

## 4. GELİŞTİRME ORTAMI

```bash
# Geliştirme sunucusunu başlat
npm run dev

# Tarayıcıda aç:
# http://localhost:3000
```

---

## 5. PWA KURULUMU

### 5.1 next-pwa Config

`next.config.js` dosyasını şöyle düzenle:

```js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supabase-images',
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
  ],
})

module.exports = withPWA({
  reactStrictMode: true,
  images: { domains: ['your-project.supabase.co'] },
})
```

### 5.2 Manifest Dosyası

`public/manifest.json` oluştur:

```json
{
  "name": "MandıraM - Hayvan Kayıt",
  "short_name": "MandıraM",
  "description": "Dijital hayvan kayıt ve takip sistemi",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#1b4332",
  "theme_color": "#2D6A4F",
  "icons": [
    { "src": "/icons/icon-72x72.png",   "sizes": "72x72",   "type": "image/png" },
    { "src": "/icons/icon-96x96.png",   "sizes": "96x96",   "type": "image/png" },
    { "src": "/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/dashboard.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow" }
  ],
  "categories": ["business", "utilities"],
  "lang": "tr"
}
```

### 5.3 Head Tag (app/layout.tsx içine ekle)

```tsx
<head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#2D6A4F" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="MandıraM" />
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
</head>
```

### 5.4 Mobil Kamera Erişimi (fotoğraf yükleme)

AnimalForm içindeki file input'unu şöyle güncelle:

```tsx
<input
  type="file"
  accept="image/*"
  capture="environment"   // ← Bu satır kamerayı açar!
  // capture="user"       // ← Selfie kamera için
/>
```

---

## 6. ELECTRON (EXE) KURULUMU

### 6.1 Electron Kur

```bash
npm install --save-dev electron electron-builder concurrently wait-on
```

### 6.2 electron/main.js Oluştur

```js
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 900, minHeight: 600,
    icon: path.join(__dirname, '../public/icons/icon-512x512.png'),
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    titleBarStyle: 'hiddenInset',
    title: 'MandıraM',
  })

  const isDev = process.env.NODE_ENV !== 'production'
  win.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../out/index.html')}`)

  if (isDev) win.webContents.openDevTools()
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
```

### 6.3 package.json Güncelle

```json
{
  "main": "electron/main.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "export": "next export",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:3000 && electron .\"",
    "electron:build": "npm run build && npm run export && electron-builder",
    "electron:build:win": "npm run build && npm run export && electron-builder --win"
  },
  "build": {
    "appId": "com.mandiram.app",
    "productName": "MandıraM",
    "directories": { "output": "dist" },
    "win": {
      "target": [{ "target": "nsis", "arch": ["x64"] }],
      "icon": "public/icons/icon-512x512.png"
    },
    "mac": {
      "target": "dmg",
      "icon": "public/icons/icon-512x512.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "installerIcon": "public/icons/icon-512x512.png",
      "installerHeaderIcon": "public/icons/icon-512x512.png"
    }
  }
}
```

### 6.4 EXE Oluştur

```bash
# Windows için .exe
npm run electron:build:win

# dist/ klasöründe .exe çıkar
# dist/MandıraM Setup 1.0.0.exe
```

---

## 7. DEPLOYMENT (VERCEL)

```bash
# Vercel CLI kur
npm i -g vercel

# Deploy
vercel

# Environment variables ekle (Vercel dashboard'da):
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# NEXT_PUBLIC_APP_URL=https://mandiram.com (domaini bağladıktan sonra)
```

### Domain Bağlama
1. Vercel dashboard → Settings → Domains
2. `mandiram.com` ekle
3. DNS provider'ında CNAME/A kaydı ekle (Vercel gösterir)
4. ~10 dk içinde aktif

---

## 8. PROJE KLASÖR YAPISI

```
mandiram/
├── app/
│   ├── auth/page.tsx          ← Login/Register
│   ├── dashboard/page.tsx     ← Besici dashboard
│   ├── animals/
│   │   ├── new/page.tsx       ← Yeni hayvan ekle
│   │   └── [id]/page.tsx      ← Hayvan detayı
│   ├── scan/[id]/page.tsx     ← QR tarama (public)
│   ├── admin/page.tsx         ← Admin paneli
│   └── layout.tsx
├── components/
│   └── animal/
│       └── AnimalForm.tsx
├── lib/
│   ├── supabase.ts
│   └── animals.ts
├── types/
│   └── index.ts
├── public/
│   ├── manifest.json          ← PWA
│   └── icons/                 ← PWA ikonları
├── electron/
│   └── main.js                ← Desktop app
├── .env.local                 ← GİZLİ (git'e yükleme!)
└── next.config.js
```

---

## 9. HIZLI BAŞLANGIÇ ÖZETİ

```
1. supabase.com → proje oluştur → SQL migration çalıştır
2. .env.local dosyasını doldur
3. npm install && npm run dev
4. http://localhost:3000/auth → kayıt ol
5. /dashboard → hayvan ekle
6. PWA için mobilde Chrome → "Ana ekrana ekle"
7. EXE için: npm run electron:build:win
```

---

## 10. SORUN GİDERME

| Sorun | Çözüm |
|-------|-------|
| Supabase bağlantı hatası | `.env.local` URL ve key'leri kontrol et |
| Fotoğraf yüklenmüyor | Storage bucket'ın adı `animal-media` olmalı |
| RLS hatası | SQL migration'ı tekrar çalıştır |
| QR oluşturmuyor | `qrcode` paketi yüklü mü? `npm install qrcode` |
| PWA çalışmıyor | `manifest.json` public klasöründe mi? HTTPS gerekli (localhost OK) |
| EXE build hatası | `electron-builder` ve `concurrently` yüklü mü? |
