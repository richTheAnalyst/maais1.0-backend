# MAAIS Backend

**Mando SHTS Academic Audit & Intervention System — NestJS + Prisma + Neon**

---

## 🏗 Architecture

```
src/
├── auth/                    # JWT auth, refresh tokens, strategies
├── users/                   # Staff, student, parent account management
├── academic-architect/      # Years, terms, departments, subjects, classes
├── grading/                 # Grade entry, smart remarks, HOD locking, audit trail
├── reports/                 # Report card generator, transcript builder
├── archive/                 # Promotion cycle, The Vault search
├── comms/                   # SMS/App notifications, analytics pulse
└── common/
    ├── prisma/              # Global PrismaService
    ├── guards/              # JwtAuthGuard, RolesGuard
    ├── decorators/          # @Public(), @Roles(), @CurrentUser()
    └── interceptors/        # AuditInterceptor
```

---

## ⚡ Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env with your Neon connection string and secrets
```

### 3. Connect to Neon

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a project → `maais`
3. Copy the **Connection string** into `DATABASE_URL` and `DIRECT_URL` in `.env`

### 4. Push schema to Neon

```bash
npm run prisma:generate   # Generate Prisma client
npm run prisma:push       # Push schema to Neon (no migration history)
# OR for production with migration history:
npm run prisma:migrate    # npx prisma migrate dev --name init
```

### 5. Seed initial data

```bash
npm run prisma:seed
# Creates: admin account, departments, subjects, classes, 2024/2025 academic year
```

### 6. Start the server

```bash
npm run start:dev
```

API: `http://localhost:3000/api/v1`  
Swagger: `http://localhost:3000/api/docs`  
Admin: `admin@mandoshts.edu.gh` / `Admin@2024!`

---

## 🔑 Authentication

All protected routes require:
```
Authorization: Bearer <access_token>
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | Email + password → access + refresh token |
| `/api/v1/auth/refresh` | POST | Rotate refresh token |
| `/api/v1/auth/logout` | POST | Invalidate refresh token |
| `/api/v1/auth/me` | GET | Current user |

---

## 📋 API Endpoints Summary

### Academic Architect
| Endpoint | Roles |
|----------|-------|
| `POST /academic/years` | SUPER_ADMIN, HEADMASTER |
| `PATCH /academic/years/:id/activate` | SUPER_ADMIN, HEADMASTER |
| `POST /academic/terms` | SUPER_ADMIN, HEADMASTER |
| `GET /academic/subjects` | All authenticated |
| `POST /academic/classes` | SUPER_ADMIN, HEADMASTER |
| `POST /academic/assignments` | SUPER_ADMIN, HEADMASTER, HOD |

### Grading
| Endpoint | Roles |
|----------|-------|
| `POST /grading/entries` | TEACHER, HOD, HEADMASTER |
| `POST /grading/entries/bulk` | TEACHER, HOD, HEADMASTER |
| `PATCH /grading/entries/:id/lock` | HOD, HEADMASTER |
| `POST /grading/corrections` | TEACHER, HOD, HEADMASTER |
| `GET /grading/audit-tray?termId=` | HOD, HEADMASTER |
| `GET /grading/smart-remarks/:grade` | All authenticated |

### Reports
| Endpoint | Roles |
|----------|-------|
| `POST /reports/report-cards/generate` | HOD, HEADMASTER |
| `POST /reports/report-cards/batch` | HEADMASTER, SUPER_ADMIN |
| `POST /reports/transcripts/generate` | HEADMASTER, SUPER_ADMIN |
| `GET /reports/verify/:hash` | **Public** (QR scan) |

### Archive
| Endpoint | Roles |
|----------|-------|
| `POST /archive/promote` | SUPER_ADMIN, HEADMASTER |
| `GET /archive/vault/search` | HOD, HEADMASTER, SUPER_ADMIN |
| `PATCH /archive/terms/:id/lock` | HEADMASTER, SUPER_ADMIN |
| `GET /archive/health` | HEADMASTER, SUPER_ADMIN |

### Comms
| Endpoint | Roles |
|----------|-------|
| `POST /comms/notify` | HOD, HEADMASTER |
| `POST /comms/emergency` | HEADMASTER, SUPER_ADMIN |
| `GET /comms/analytics/pulse` | HOD, HEADMASTER |
| `GET /comms/notifications/:studentId` | All authenticated |

---

## 🔄 System Flow

```
Teacher submits grades
    → GradeEntry created with classScore + examScore
    → totalScore + grade (A1-F9) auto-computed
    → Smart remarks suggested from grade pool

HOD reviews
    → Flags missing observations (audit tray)
    → Locks grade entries before report release

Headmaster triggers batch
    → ReportCard generated per student
    → SHA256 hash + QR code attached
    → Class positions computed

End of year
    → Headmaster locks all terms
    → Runs Promotion Cycle
    → F1→F2, F2→F3, F3→Alumni (archived)
    → New intake begins
```

---

## 🛡 Security Notes

- Passwords hashed with **Argon2id** (memory-hard, OWASP recommended)
- JWT access tokens: 15min lifetime; refresh tokens: 7d, rotated on use
- All grade changes recorded in `GradeCorrection` with reason + who changed it
- All mutations logged in `AuditLog` with IP + user agent
- Term locking prevents grade edits after HOD approval
- Promotion cycle requires all terms locked (safety check)
- Report cards have immutable SHA256 hash for QR verification

---

## 🗃 Key Prisma Models

| Model | Purpose |
|-------|---------|
| `User` | Auth account (polymorphic: staff / student / parent) |
| `AcademicYear` / `Term` | Academic calendar management |
| `GradeEntry` | Core grade record (classScore + examScore → total + grade) |
| `GradeCorrection` | Immutable audit trail of grade changes |
| `ReportCard` | Compiled per student/term with hash + QR |
| `Transcript` | 3-year history document with hash + QR |
| `PromotionRecord` | Yearly progression snapshot |
| `AuditLog` | System-wide action log for GES compliance |

---

## 📦 Prisma Studio

```bash
npm run prisma:studio
# Opens visual DB browser at http://localhost:5555
```
