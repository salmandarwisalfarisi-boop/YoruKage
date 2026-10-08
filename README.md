# 🌙 YoruKage (夜影)

> **Modern, Ad-free & Aesthetic Anime Streaming and Discovery Web Platform.**  
> Built with **SvelteKit 5 (Runes)**, **Tailwind CSS**, and powered by the **AniList GraphQL API**.

---

## ⚠️ Status Proyek (Catatan Dalam Pengembangan / Work In Progress)

> [!WARNING]
> **Proyek ini sedang aktif dalam tahap pengembangan (Under Active Development).**  
> Beberapa fitur, integrasi streaming server, dan UI/UX masih terus disempurnakan. Kontribusi, feedback, dan saran fitur sangat dipersilakan!

---

## ✨ Fitur Utama

- **🎨 Modern Dark UI / Aesthetic Design**
  - Antarmuka futuristik dengan floating pill navbar, glassmorphism, dan micro-interaction yang responsif.
  - Skema warna elegan dark mode berbasis nuansa amber/gold.
- **⚡ AniList GraphQL Integration**
  - Menampilkan daftar anime **Trending**, **Seasonal**, **Popular**, **Top Rated**, dan **Upcoming Movies**.
  - Detail lengkap anime: sinopsis, skor, studio, trailer resmi, relasi cerita, serta rekomendasi anime serupa.
- **🔍 Fast Search & Filter (`Ctrl+K`)**
  - Modal quick-search keyboard-accessible (`Ctrl+K` / `Cmd+K`) dengan riwayat pencarian terbaru.
  - Halaman eksplorasi filter katalog berdasarkan genre, format (TV, Movie, OVA, dsb), season, tahun, dan urutan popularitas.
- **📅 Airing Schedule**
  - Jadwal rilis episode anime mingguan secara berkala berdasarkan waktu tayang langsung.
- **📺 Streaming Player Interface**
  - Halaman pemutar video lengkap dengan navigasi episode (Next/Prev), switch server (Sub/Dub/Backup), dan autoplay simulator.
- **💾 Local Storage Persistence**
  - **Continue Watching**: Melacak progress episode dan durasi tontonan pengguna secara lokal tanpa wajib login server.
  - **Favorites & Watchlist**: Simpan daftar anime favorit ke bookmark.
  - **Title Language Switcher**: Dukungan pergantian penamaan judul antara *English* dan *Romaji / JP*.

---

## 🛠️ Tech Stack

- **Framework**: [SvelteKit 5](https://kit.svelte.dev/) (menggunakan paradigma Svelte 5 Runes: `$state`, `$derived`, `$effect`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide Svelte](https://lucide.dev/)
- **Data Source**: [AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs/)
- **Runtime & Bundler**: Node.js & Vite

---

## 🚀 Memulai (Local Development)

### 1. Clone Repository
```bash
git clone https://github.com/salmandarwisalfarisi-boop/YoruKage.git
cd YoruKage
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Jalankan Development Server
```bash
npm run dev
```
Buka browser dan akses alamat `http://localhost:5173`.

### 4. Build untuk Production
```bash
npm run build
npm run preview
```

---

## 🗺️ Roadmap Fitur Mendatang

- [ ] Integrasi provider source streaming langsung (M3U8 / HLS Stream scraper)
- [ ] Opsi Skip Intro / Outro otomatis pada video player
- [ ] Sinkronisasi akun AniList & MyAnimeList (OAuth2)
- [ ] Komentar episode & integrasi komunitas
- [ ] PWA (Progressive Web App) untuk mode layar penuh di mobile

---

## ⚖️ DMCA & Disclaimer

**YoruKage** tidak menyimpan atau mengunggah file video apapun di server sendiri. Semua konten, informasi, dan media diambil dari layanan publik pihak ketiga serta AniList API untuk tujuan edukasi dan portofolio pengembangan web.

---

## 📄 Lisensi
Didistribusikan di bawah lisensi MIT. Silakan gunakan untuk eksplorasi dan pembelajaran.
