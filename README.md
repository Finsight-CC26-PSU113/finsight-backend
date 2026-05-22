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

Repo ini berisi source code **backend** Finsight yang menyediakan REST API untuk autentikasi, kategori, transaksi, budget, dashboard summary, rekomendasi, dan integrasi dengan service AI untuk klasifikasi transaksi.

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
├── prisma.config.ts           # Konfigurasi Prisma CLI dan seed command
├── src/
│   ├── config/
│   │   ├── database.js        # Konfigurasi koneksi database
│   │   └── logger.js          # Konfigurasi logging
│   ├── controllers/
│   │   ├── authController.js       # Logika Register, Login, Profile
│   │   ├── budgetController.js     # Logika CRUD Budget
│   │   ├── categoryController.js   # Logika CRUD Kategori
│   │   ├── dashboardController.js  # Logika ringkasan dashboard
│   │   ├── recommendationController.js # Logika rekomendasi
│   │   └── transactionController.js # Logika CRUD Transaksi + klasifikasi AI
│   ├── generated/             # Hasil generate Prisma Client
│   ├── middleware/
│   │   ├── auth.js            # Middleware verifikasi JWT
│   │   ├── errorHandler.js    # Global error handler
│   │   └── validate.js        # Middleware validasi input Joi
│   ├── routes/
│   │   ├── authRoutes.js      # Rute terkait autentikasi
│   │   ├── budgetRoutes.js    # Rute budget
│   │   ├── categoryRoutes.js  # Rute terkait kategori
│   │   ├── dashboardRoutes.js # Rute dashboard summary
│   │   ├── recommendationRoutes.js # Rute rekomendasi
│   │   └── transactionRoutes.js # Rute terkait transaksi
│   ├── utils/
│   │   ├── alertService.js    # Trigger alert saat budget melewati threshold
│   │   └── response.js        # Standarisasi response API
│   ├── validations/
│   │   ├── authValidation.js   # Skema validasi data Auth
│   │   ├── budgetValidation.js # Skema validasi data Budget
│   │   ├── categoryValidation.js # Skema validasi data Kategori
│   │   ├── recommendationValidation.js # Skema validasi data Rekomendasi
│   │   └── transactionValidation.js # Skema validasi data Transaksi
│   ├── app.js                 # Setup Express
│   └── server.js              # Entry point aplikasi
├── test/
│   ├── postman/
│   │   ├── finsight.postman_collection.json
│   │   └── finsight.postman_environment.json
│   └── testing/               # Test automation Jest
├── .env.example
├── package.json
├── prisma.config.ts
└── README.md
```

---

## ⚙️ Tech Stack

| Teknologi        | Kegunaan                                |
| ---------------- | --------------------------------------- |
| Express.js       | Web framework                           |
| PostgreSQL       | Database relasional                     |
| Prisma ORM       | Object-Relational Mapping ke PostgreSQL |
| JWT + bcrypt     | Autentikasi & hashing password          |
| CORS             | Cross-origin access untuk frontend      |
| Jest + Supertest | API Testing                             |

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

# 4. Generate Prisma Client
npx prisma generate

# 5. Jalankan migrasi database
npx prisma migrate dev --name init

# 6. Seed database
npx prisma db seed

# 7. Jalankan test
npm test

# 8. Jalankan dev server
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

# Auth
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# AI Service
AI_SERVICE_URL=http://localhost:8000
# Alias lama masih didukung: ML_SERVICE_URL

# Frontend (CORS)
CLIENT_URL=http://localhost:5173
```

---

## 📋 API Endpoints

### Auth

| Method | Endpoint             | Auth | Deskripsi                    |
| ------ | -------------------- | ---- | ---------------------------- |
| POST   | `/api/auth/register` | ❌   | Daftar akun baru             |
| POST   | `/api/auth/login`    | ❌   | Login akun                   |
| POST   | `/api/auth/logout`   | ✅   | Logout pengguna              |
| GET    | `/api/auth/profile`  | ✅   | Mendapatkan data profil user |
| PATCH  | `/api/auth/profile`  | ✅   | Memperbarui profil user      |

### Category

| Method | Endpoint                 | Auth | Deskripsi                                   |
| ------ | ------------------------ | ---- | ------------------------------------------- |
| GET    | `/categories`            | ✅   | Mengambil kategori default sistem           |
| GET    | `/categories/custom`     | ✅   | Mengambil kategori khusus (custom) pengguna |
| POST   | `/categories/custom`     | ✅   | Membuat kategori khusus baru                |
| PATCH  | `/categories/custom/:id` | ✅   | Memperbarui kategori khusus                 |
| DELETE | `/categories/custom/:id` | ✅   | Menghapus kategori khusus                   |

### Transaction

| Method | Endpoint                                 | Auth | Deskripsi                             |
| ------ | ---------------------------------------- | ---- | ------------------------------------- |
| GET    | `/api/transactions`                      | ✅   | Mengambil daftar transaksi milik user |
| POST   | `/api/transactions`                      | ✅   | Membuat transaksi income/expense      |
| GET    | `/api/transactions/:id`                  | ✅   | Detail transaksi                      |
| PUT    | `/api/transactions/:id`                  | ✅   | Update transaksi                      |
| DELETE | `/api/transactions/:id`                  | ✅   | Hapus transaksi                       |
| POST   | `/api/transactions/classify`             | ✅   | Klasifikasi transaksi via AI service  |
| PUT    | `/api/transactions/:id/category`         | ✅   | Override kategori hasil klasifikasi   |
| PUT    | `/api/transactions/:id/anomaly-feedback` | ✅   | Feedback flag anomali transaksi       |

### Budget

| Method | Endpoint           | Auth | Deskripsi                              |
| ------ | ------------------ | ---- | -------------------------------------- |
| GET    | `/api/budgets`     | ✅   | Mengambil budget milik user            |
| POST   | `/api/budgets`     | ✅   | Membuat / mengubah budget per kategori |
| PUT    | `/api/budgets/:id` | ✅   | Update nominal budget                  |
| DELETE | `/api/budgets/:id` | ✅   | Hapus budget                           |

### Dashboard

| Method | Endpoint                 | Auth | Deskripsi                                  |
| ------ | ------------------------ | ---- | ------------------------------------------ |
| GET    | `/api/dashboard/summary` | ✅   | Ringkasan income, expense, balance, budget |

### Recommendations

| Method | Endpoint                          | Auth | Deskripsi                  |
| ------ | --------------------------------- | ---- | -------------------------- |
| GET    | `/api/recommendations`            | ✅   | Mengambil rekomendasi user |
| PUT    | `/api/recommendations/:id/status` | ✅   | Update status rekomendasi  |

> ✅ = Butuh `Authorization: Bearer <token>` atau Token Cookie

---

## 🗄️ Database Schema

Sistem ini menggunakan Prisma dengan tabel utama:

- **`User`**: Mengelola data otentikasi (email, password) dan profil pengguna.
- **`Category`**: Tabel master untuk kategori pendapatan dan pengeluaran.
- **`UserCategory`**: Kategori custom milik user.
- **`Transaction`**: Menyimpan log transaksi, terkait ke `User`, `Category`, dan `UserCategory`.
- **`TransactionFeedback`**: Menyimpan feedback user saat override kategori.
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
                    └── AI Service (FastAPI :8000)
                      └── POST /predict
```

---

## 📜 Scripts

| Command        | Deskripsi                               |
| -------------- | --------------------------------------- |
| `npm run dev`  | Dev server dengan nodemon (auto-reload) |
| `npm start`    | Production server                       |
| `npm test`     | Menjalankan testing dengan Jest         |
| `npm run lint` | Linter dengan ESLint                    |

## 🧪 Testing

Test berada di folder [test/testing](./test/testing) dan mencakup integration test untuk API utama serta unit test untuk alert budget.

### Postman Testing Guide

Collection Postman ada di [test/postman/finsight.postman_collection.json](./test/postman/finsight.postman_collection.json) dan environment ada di [test/postman/finsight.postman_environment.json](./test/postman/finsight.postman_environment.json).

Urutan testing yang paling aman:

1. `Auth`
1. `User`
1. `Default Categories`
1. `Custom Categories`
1. `Transactions`
1. `Budgets`
1. `Dashboard`
1. `Recommendations`

Catatan penggunaan variable:

- `token` akan terisi dari `Register` atau `Login`
- `system_category_id` diambil dari kategori default sistem
- `custom_category_id` diambil dari hasil `Create Custom Category`
- `transaction_id` diambil dari hasil `Create Transaction`
- `budget_id` diambil dari hasil `Create Budget`
- `recommendation_id` diambil dari hasil `Get Recommendations`

Tips: jalankan `Register` atau `Login` dulu supaya request berikutnya yang butuh auth bisa langsung dipakai.

```bash
npm test
```

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
