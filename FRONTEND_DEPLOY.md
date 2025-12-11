# 🎨 Deploy Frontend ke cPanel

Panduan deploy hanya frontend NEVRA ke cPanel hosting Anda.

## Prerequisites:

✅ Domain sudah aktif: `rlabs-studio.cloud`
✅ cPanel access sudah ada
✅ Node.js  terinstall di komputer sudahlokal (untuk build)

---

## Langkah-langkah:

### 1. Siapkan Environment Variables (Opsional)

Jika Anda sudah punya backend API, set URL-nya. Jika belum, biarkan default.

**Buat file `.env.local` di root project:**
```env
# Backend API URL (jika sudah ada)
# VITE_API_BASE_URL=https://api.rlabs-studio.cloud/api

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Clerk Supabase Template
VITE_CLERK_SUPABASE_TEMPLATE=supabase
```

**Catatan:** 
- Jika belum ada backend, biarkan `VITE_API_BASE_URL` tidak di-set (akan pakai default `/api`)
- Frontend akan tetap bisa di-build dan di-deploy, hanya fitur AI yang tidak akan berfungsi sampai backend siap

---

### 2. Install Dependencies & Build

**Di komputer lokal:**
```bash
cd /home/radzzz/Downloads/NEVRA

# Install dependencies
npm install

# Build untuk production
npm run build
```

**Hasil build akan ada di folder `dist/`**

---

### 3. Siapkan File untuk Upload

**File yang perlu di-upload:**
- ✅ Semua file di dalam folder `dist/`
- ✅ Termasuk:
  - `index.html`
  - Folder `assets/`
  - `.htaccess` (penting untuk routing React!)

**Pastikan `.htaccess` ada di folder `dist/`**

---

### 4. Upload ke cPanel

**Via File Manager:**
1. Login ke cPanel
2. Buka **File Manager**
3. Masuk ke folder `public_html` (atau folder domain Anda)
4. **Hapus file default** (jika ada: `index.php`, `cgi-bin`, dll)
5. **Upload semua file dari folder `dist/`**
   - Pilih semua file di `dist/`
   - Upload ke `public_html`
   - Pastikan struktur: `public_html/index.html`, `public_html/assets/`, `public_html/.htaccess`

**Via FTP (Alternatif):**
1. Gunakan FTP client (FileZilla, WinSCP, dll)
2. Connect ke server
3. Upload semua file dari `dist/` ke `public_html/`

---

### 5. Pastikan .htaccess Ter-upload

**Sangat Penting!** File `.htaccess` diperlukan agar routing React bekerja.

**Cek di File Manager:**
1. Di cPanel File Manager, klik **Settings** (kanan atas)
2. Centang **Show Hidden Files (dotfiles)**
3. Save
4. Pastikan file `.htaccess` terlihat di `public_html/`

**Isi `.htaccess` harus:**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

### 6. Test Website

**Buka browser:**
- URL: `https://rlabs-studio.cloud`
- Harus tampil halaman NEVRA

**Test routing:**
- Buka: `https://rlabs-studio.cloud/chat`
- Refresh halaman (F5)
- Harus tetap di halaman `/chat` (tidak 404)

**Jika 404 saat refresh:**
- Pastikan `.htaccess` sudah ter-upload
- Pastikan mod_rewrite aktif di server

---

## Troubleshooting:

### Halaman Blank Putih
- Cek browser console (F12) untuk error
- Pastikan semua file `assets/` ter-upload
- Pastikan `index.html` ada di root `public_html/`

### 404 Error saat Refresh
- Pastikan `.htaccess` sudah ter-upload
- Pastikan "Show Hidden Files" aktif di File Manager
- Cek apakah mod_rewrite aktif (tanya hosting provider)

### Assets tidak Load
- Pastikan path assets benar
- Cek apakah folder `assets/` ter-upload lengkap
- Pastikan permission file benar (644 untuk file, 755 untuk folder)

### API Error (jika belum ada backend)
- Normal jika backend belum di-deploy
- Frontend akan tampil, tapi fitur AI tidak berfungsi
- Setelah backend siap, update `VITE_API_BASE_URL` dan rebuild

---

## Update Frontend (Setelah Ada Backend):

**Ketika backend sudah siap:**

1. Update `.env.local`:
```env
VITE_API_BASE_URL=https://api.rlabs-studio.cloud/api
```

2. Rebuild:
```bash
npm run build
```

3. Upload ulang isi folder `dist/` ke `public_html/`

---

## Ringkasan:

1. ✅ Install dependencies: `npm install`
2. ✅ Build frontend: `npm run build`
3. ✅ Upload isi `dist/` ke `public_html/`
4. ✅ Pastikan `.htaccess` ter-upload
5. ✅ Test: `https://rlabs-studio.cloud`
6. ✅ Test routing: refresh di `/chat`

---

## Catatan Penting:

⚠️ **Frontend bisa di-deploy tanpa backend**, tapi:
- Fitur AI tidak akan berfungsi
- Chat interface tidak bisa generate response
- Semua fitur yang butuh API akan error

✅ **Setelah backend siap:**
- Update `VITE_API_BASE_URL` di `.env.local`
- Rebuild frontend
- Upload ulang ke cPanel

---

## File Structure Setelah Upload:

```
public_html/
├── index.html
├── .htaccess
└── assets/
    ├── index-[hash].js
    ├── index-[hash].css
    └── ...
```

**Pastikan struktur seperti ini!**
