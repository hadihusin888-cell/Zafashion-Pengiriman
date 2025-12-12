# Aplikasi Cetak Resi & Manajemen Paket

Aplikasi berbasis web untuk mencetak label pengiriman, manajemen stok sederhana, dan input otomatis menggunakan AI (Google Gemini).

**Fitur Utama:**
- **AI Magic Paste:** Copy alamat dari WhatsApp/Marketplace, otomatis terisi.
- **Cetak Resi:** Format A4 (8 label per halaman).
- **Database:** LocalStorage (Offline) + Integrasi Google Sheets (Optional).
- **Deploy:** Bisa dihosting di mana saja (Vercel, Netlify, GitHub Pages, dll).

## Konfigurasi Backend (Google Sheets)
Aplikasi ini bisa berjalan 100% offline (data di browser). Namun, untuk sinkronisasi antar device/karyawan, gunakan Google Sheets:
1. Buat Google Sheet baru di Google Drive Anda.
2. Klik **Extensions** > **Apps Script**.
3. Copy paste kode dari file `Code.js` yang ada di project ini.
4. Klik **Deploy** > **New Deployment**.
   - Select type: **Web App**.
   - Description: V1.
   - Execute as: **Me** (Email Anda).
   - Who has access: **Anyone** (Penting agar aplikasi bisa akses).
5. Klik **Deploy** dan copy **Web App URL**.
6. Buka Aplikasi Web > Menu **Pengaturan** > Paste URL tersebut.

## Cara Deploy (Hosting)

Aplikasi ini adalah **Static Web App**. Anda bisa meng-hostingnya di layanan apapun yang mendukung static site.

### 1. Vercel (Rekomendasi)
1. Push kode ini ke GitHub/GitLab.
2. Login ke [Vercel](https://vercel.com).
3. **Add New Project** > Import repository Git Anda.
4. Di bagian **Environment Variables**, tambahkan:
   - Key: `API_KEY`
   - Value: (API Key Google Gemini Anda dari https://aistudio.google.com/app/apikey)
5. Klik **Deploy**.

### 2. Netlify
1. Drag & drop folder `dist` (setelah menjalankan `npm run build` di komputer Anda) ke Netlify Drop.
2. Atau hubungkan dengan Git. Pastikan mengatur **Build command**: `npm run build` dan **Publish directory**: `dist`.
3. Set Environment Variable `API_KEY` di menu Site Settings > Build & deploy > Environment.

### 3. Hosting Biasa (cPanel/Shared Hosting)
1. Jalankan `npm run build` di komputer lokal Anda.
2. File hasil build akan muncul di folder `dist`.
3. Upload isi folder `dist` ke `public_html` di hosting Anda.
4. **Catatan:** Untuk hosting biasa, Anda perlu mengatur API Key secara manual di dalam file `.env` sebelum build, atau hardcode di `vite.config.ts` (tidak disarankan untuk repo publik).

## Menjalankan di Komputer (Local Development)
1. Install Node.js.
2. Buat file `.env` isi dengan `API_KEY=AIzaSy...`.
3. Jalankan:
   ```bash
   npm install
   npm run dev
   ```
