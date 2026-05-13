<div align="center">

# ⚙️ Finsight — Backend

**REST API untuk Platform Literasi Keuangan Finsight**

[![Node.js](https://img.shields.io/badge/Node.js-24.13.1-339933?logo=nodedotjs)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.2.1-000?logo=express)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?logo=Prisma&logoColor=white)](https://prisma.io)
[![JWT](https://img.shields.io/badge/Auth-JWT-000?logo=jsonwebtokens)](https://jwt.io)

> Bagian dari Capstone Project **Coding Camp 2026 powered by DBS Foundation**
> Team ID: **CC26-PSU113**

</div>

---

## 📖 Tentang

Repo ini berisi source code **backend** Finsight yang menyediakan REST API untuk manajemen user, transaksi, upload struk, dan integrasi dengan ML Service.

---

## 🗂️ Struktur Folder

```
finsight-backend/
├── docs/                      # Dokumentasi Proyek & API
│   ├── api/
│   │   └── openapi.json       # Dokumentasi OpenAPI (Swagger)
│   └── README.md              # Panduan penggunaan Swagger di VS Code
├── prisma/
│   ├── migrations/            # Folder migrasi database
│   ├── schema.prisma          # Skema database Prisma
│   └── seed.js                # Database seeder awal
├── src/
│   ├── config/
│   │   ├── database.js        # Konfigurasi koneksi database
│   │   └── logger.js          # Konfigurasi logging
│   ├── controllers/
│   │   ├── authController.js       # Logika Register, Login, Profile
│   │   ├── categoryController.js   # Logika CRUD Kategori
│   │   └── transactionController.js # Logika CRUD Transaksi
│   ├── generated/             # Hasil generate Prisma Client
│   ├── middleware/
│   │   ├── auth.js            # Middleware verifikasi JWT
│   │   ├── errorHandler.js    # Global error handler
│   │   └── validate.js        # Middleware validasi input Joi
│   ├── routes/
│   │   ├── authRoutes.js      # Rute terkait autentikasi
│   │   ├── categoryRoutes.js  # Rute terkait kategori
│   │   └── transactionRoutes.js # Rute terkait transaksi
│   ├── uploads/               # Tempat penyimpanan file struk
│   ├── utils/
│   │   └── response.js        # Standarisasi response API
│   ├── validations/
│   │   ├── authValidation.js   # Skema validasi data Auth
│   │   └── categoryValidation.js # Skema validasi data Kategori
│   ├── app.js                 # Setup Express
│   └── server.js              # Entry point aplikasi
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Tech Stack

| Teknologi | Kegunaan |
|---|---|
| Express.js | Web framework |
| PostgreSQL | Database relasional |
| Prisma ORM | Object-Relational Mapping ke PostgreSQL |
| JWT + bcrypt | Autentikasi & hashing password |
| Multer | File upload (struk JPEG/PNG) |
| Axios | Forward request ke ML Service |
| Helmet + CORS | Security headers |
| Morgan | HTTP request logger |
| Jest + Supertest | API Testing |

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js >= 18
- PostgreSQL >= 14 sudah berjalan

### Langkah-langkah

```bash
# 1. Clone repo
git clone https://github.com/finsight-cc26/finsight-backend.git
cd finsight-backend

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit file .env dan sesuaikan nilai variabelnya (terutama DATABASE_URL)

# 4. Buat Database secara manual (jika user Anda tidak punya hak CREATE DB via Prisma)
# Masuk ke PostgreSQL terminal:
psql -U postgres
# Jalankan perintah:
# CREATE DATABASE finsight;
# \q

# 5. Generate Prisma Client
npx prisma generate

# 6. Jalankan migrasi dan seed database
npx prisma migrate dev --name init
npx prisma db seed

# 7. Jalankan dev server
npm run dev
```

Server akan berjalan di **http://localhost:3000**

---

## 🌍 Environment Variables

```env
PORT=3000
NODE_ENV=development

# Database URL untuk Prisma
DATABASE_URL="postgresql://user:password@localhost:5432/finsight?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finsight
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# ML Service
ML_SERVICE_URL=http://localhost:8000

# Frontend (CORS)
FRONTEND_URL=http://localhost:5173
```

---

## 📋 API Endpoints

### Auth
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/register` | ❌ | Daftar akun baru |
| POST | `/login` | ❌ | Login akun |
| POST | `/logout` | ✅ | Logout pengguna |
| GET | `/profile` | ✅ | Mendapatkan data profil user |
| PATCH | `/profile` | ✅ | Memperbarui profil user |

### Category
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/categories` | ✅ | Mengambil kategori default sistem |
| GET | `/categories/custom` | ✅ | Mengambil kategori khusus (custom) pengguna |
| POST | `/categories/custom` | ✅ | Membuat kategori khusus baru |
| PATCH | `/categories/custom/:id` | ✅ | Memperbarui kategori khusus |
| DELETE | `/categories/custom/:id` | ✅ | Menghapus kategori khusus |

> ✅ = Butuh `Authorization: Bearer <token>` atau Token Cookie

---

## 🗄️ Database Schema

Sistem ini menggunakan Prisma dengan tabel utama:
- **`User`**: Mengelola data otentikasi (email, password) dan profil pengguna.
- **`Category`**: Tabel master untuk kategori pendapatan dan pengeluaran.
- **`Transaction`**: Menyimpan log transaksi, terkait ke `User` dan `Category`.
- **`Budget`**: Batasan anggaran untuk tiap kategori spesifik per bulan.
- **`Recommendation` & `InvestmentRecommendation`**: Saran pintar bagi pengguna berdasarkan behavior & profil risikonya.
- **`Alert`**: Pemberitahuan sistem terkait budget/transaksi abnormal.

Lihat selengkapnya di [prisma/schema.prisma](./prisma/schema.prisma).

---

## 🔗 Koneksi ke Service Lain

```
Frontend (React :5173)
  └── HTTP → Backend (Express :3000)
                ├── PostgreSQL (:5432) via Prisma
                └── ML Service (FastAPI :8000)
                      └── POST /ocr/process
```

---

## 📜 Scripts

| Command | Deskripsi |
|---|---|
| `npm run dev` | Dev server dengan nodemon (auto-reload) |
| `npm start` | Production server |
| `npm test` | Menjalankan testing dengan Jest |
| `npm run lint` | Linter dengan ESLint |

---

## 🚢 Deployment

Backend di-deploy ke **VPS** (Railway / Render / self-hosted).

```bash
# Production
npx prisma generate
npx prisma migrate deploy
NODE_ENV=production npm start
```

---

## 👤 Maintainer

**Hidayat Lossen** — Backend Developer
> Coding Camp 2026 | CC26-PSU113
