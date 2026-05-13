# Panduan Menggunakan Ekstensi OpenAPI (Swagger) di VS Code

Dokumentasi API untuk project ini disimpan dalam format OpenAPI JSON di dalam folder `docs/api/openapi.json`. Agar file JSON ini dapat dibaca dengan mudah dan interaktif (seperti halaman web Swagger UI), Anda disarankan untuk menginstal ekstensi **OpenAPI (Swagger) Editor** di Visual Studio Code.

Berikut adalah langkah-langkah untuk menginstal dan menggunakannya:

## 1. Cara Menginstal Ekstensi
1. Buka aplikasi **Visual Studio Code**.
2. Masuk ke panel **Extensions** yang berada di sidebar sebelah kiri. Anda juga bisa menggunakan shortcut:
   - **Windows/Linux**: `Ctrl + Shift + X`
   - **Mac**: `Cmd + Shift + X`
3. Di kolom pencarian (search bar) ekstensi, ketik: **`OpenAPI (Swagger) Editor`**.
4. Cari ekstensi bernama **"OpenAPI (Swagger) Editor"** yang dibuat oleh pembuat **42Crunch**. Sebagai alternatif, Anda bisa menginstalnya melalui browser dengan mengunjungi link berikut: [OpenAPI (Swagger) Editor oleh 42Crunch](https://open-vsx.org/extension/42Crunch/vscode-openapi).
5. Klik tombol **Install** pada ekstensi tersebut.

## 2. Cara Melihat Dokumentasi API
Setelah ekstensi berhasil diinstal, Anda dapat langsung melihat antarmuka Swagger dari dokumentasi API kita:

1. Di panel Explorer VS Code, buka folder `docs/api/` dan klik file **`openapi.json`**.
2. Setelah file JSON tersebut terbuka di editor, akan muncul tombol **Preview** atau ikon Swagger di pojok kanan atas layar VS Code Anda.
3. Klik ikon/tombol tersebut. 
4. Jika ikon tidak muncul, Anda juga bisa membukanya melalui *Command Palette*:
   - Tekan shortcut **`Ctrl + Shift + P`** (Windows/Linux) atau **`Cmd + Shift + P`** (Mac).
   - Ketik **`OpenAPI: Preview Swagger`** atau **`OpenAPI: Show preview`** lalu tekan `Enter`.
5. Tab baru akan muncul di sisi layar yang menampilkan Swagger UI. Di sana Anda bisa melihat daftar endpoint, parameter yang dibutuhkan, serta mencoba melakukan *request* langsung dari VS Code.

---

**Catatan**: Jika ada pembaruan *endpoint* API, pastikan file `openapi.json` sudah disesuaikan agar teman-teman tim frontend maupun tim lain dapat melihat dokumentasi terbaru dengan jelas.
