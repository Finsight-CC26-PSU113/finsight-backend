<div align="center">

# ⚙️ Finsight — Backend

**REST API untuk Platform Literasi Keuangan Finsight**

[![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=nodedotjs)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4-000?logo=express)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://postgresql.org)
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
├── src/
│   ├── config/
│   │   └── db.js              # PostgreSQL connection pool
│   ├── controllers/
│   │   ├── authController.js       # Register, login, profile
│   │   ├── transactionController.js # CRUD transaksi
│   │   └── uploadController.js     # Upload & forward ke ML Service
│   ├── middleware/
│   │   ├── auth.js            # JWT middleware
│   │   └── errorHandler.js    # Global error handler
│   ├── migrations/
│   │   └── 001_init.sql       # Schema database
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── upload.js
│   │   └── index.js
│   ├── uploads/               # File storage (gitignored)
│   ├── app.js                 # Express setup
│   └── server.js              # Entry point
├── .env.example
└── package.json
```

---

## ⚙️ Tech Stack

| Teknologi | Kegunaan |
|---|---|
| Express.js | Web framework |
| PostgreSQL + `pg` | Database relasional |
| JWT + bcryptjs | Autentikasi & hashing password |
| Multer | File upload (struk JPEG/PNG) |
| Axios | Forward request ke ML Service |
| Helmet + CORS | Security headers |
| Morgan | HTTP request logger |

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
# ← edit .env: isi DB_PASSWORD dan JWT_SECRET

# 4. Setup database
psql -U postgres -c "CREATE DATABASE finsight_db;"
psql -U postgres -d finsight_db -f src/migrations/001_init.sql

# 5. Jalankan dev server
npm run dev
```

Server akan berjalan di **http://localhost:3000**

---

## 🌍 Environment Variables

```env
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finsight_db
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
| POST | `/api/v1/auth/register` | ❌ | Daftar akun baru |
| POST | `/api/v1/auth/login` | ❌ | Login, dapat JWT token |
| GET | `/api/v1/auth/profile` | ✅ | Data profil user |

### Transaksi
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/v1/transactions` | ✅ | Semua transaksi user |
| GET | `/api/v1/transactions/:id` | ✅ | Detail transaksi |
| POST | `/api/v1/transactions` | ✅ | Buat transaksi manual |
| DELETE | `/api/v1/transactions/:id` | ✅ | Hapus transaksi |

### Upload
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/v1/upload/receipt` | ✅ | Upload foto struk → ML Service |

### Lainnya
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/v1/health` | Cek status server |

> ✅ = Butuh `Authorization: Bearer <token>` di header

---

## 🗄️ Database Schema

```sql
users
  id            UUID  PK
  name          VARCHAR
  email         VARCHAR (unique)
  password_hash TEXT
  created_at    TIMESTAMP

transactions
  id          UUID  PK
  user_id     UUID  FK → users
  merchant    VARCHAR
  amount      DECIMAL
  category    VARCHAR
  date        DATE
  items       JSONB
  receipt_url TEXT
  created_at  TIMESTAMP
```

---

## 🔗 Koneksi ke Service Lain

```
Frontend (React :5173)
  └── HTTP → Backend (Express :3000)
                ├── PostgreSQL (:5432)
                └── ML Service (FastAPI :8000)
                      └── POST /ocr/process
```

---

## 📜 Scripts

| Command | Deskripsi |
|---|---|
| `npm run dev` | Dev server dengan nodemon (auto-reload) |
| `npm start` | Production server |

---

## 🚢 Deployment

Backend di-deploy ke **VPS** (Railway / Render / self-hosted).

```bash
# Production
NODE_ENV=production npm start
```

---

## 👤 Maintainer

**Hidayat Lossen** — Backend Developer
> Coding Camp 2026 | CC26-PSU113

