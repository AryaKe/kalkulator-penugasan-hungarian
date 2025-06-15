Untuk menjalankan proyek Vue 3 + Vite dengan algoritma Hungarian yang telah saya buatkan, Anda perlu menginstal beberapa dependensi. Berikut panduan lengkapnya:

### 1. **Prasyarat**
Pastikan Anda telah menginstal:
- Node.js (versi 14.18+, 16+, atau yang lebih baru)
- npm (biasanya sudah terinstal bersama Node.js) atau yarn (opsional)

### 2. **Langkah-langkah Instalasi**

#### **A. Membuat Proyek Vite + Vue 3**
Jalankan perintah berikut di terminal/command prompt:

```bash
npm create vite@latest assignment-solver -- --template vue
```

#### **B. Masuk ke direktori proyek**
```bash
cd assignment-solver
```

#### **C. Instal dependensi tambahan**
Tidak perlu instal dependensi tambahan karena proyek ini hanya menggunakan Vue 3 dan Vite yang sudah termasuk dalam template. Namun jika ingin menambahkan CSS framework (opsional):

```bash
npm install  # atau 'yarn'
```

#### **D. Ganti konten proyek**
Ganti seluruh isi folder `src` dengan kode yang saya berikan (file `App.vue`, `main.js`, folder `components`, dan file `hungarian.js`).

### 3. **Menjalankan Aplikasi**

#### **Mode Pengembangan**
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:5173`

#### **Build untuk Produksi**
```bash
npm run build
```
File hasil build akan berada di folder `dist`

### 4. **Struktur File yang Harus Ada**
Pastikan struktur file Anda seperti ini setelah instalasi:

```
assignment-solver/
├── node_modules/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── MatrixInput.vue
│   │   └── StepsDisplay.vue
│   ├── App.vue
│   ├── main.js
│   └── hungarian.js
├── index.html
├── package.json
├── vite.config.js
└── ...file lainnya
```

### 5. **Jika Mengalami Masalah**
Jika ada error saat menjalankan, coba:
1. Hapus folder `node_modules` dan file `package-lock.json`
2. Jalankan `npm install` lagi
3. Periksa versi Vue di `package.json` harus 3.x

### 6. **Dependensi Utama yang Diinstal Otomatis**
Dengan template Vite Vue 3, Anda akan mendapatkan:
- `vue` (v3.x)
- `vite` (build tool)
- `@vitejs/plugin-vue` (plugin Vue untuk Vite)

Tidak perlu library tambahan lainnya karena algoritma Hungarian murni diimplementasikan dalam JavaScript.
