# ⚡ ConflictFree — Smart Timetable System

A full-stack university timetable management system with real-time conflict detection. Built with **Node.js + Express + MySQL** (API) and **React + Vite** (Web).

---

## Features

| Feature | Description |
|---|---|
| 🔐 Auth | JWT-based login with bcrypt hashing and role-based access |
| 👑 Admin | Full CRUD: timetable slots, courses, enrollments, conflict resolution |
| 🎓 Faculty | View personal teaching schedule (calendar + list views) |
| 📚 Student | View enrolled course timetable (calendar + list views) |
| ⚠️ Conflict Detection | Blocks overlapping room/faculty bookings at creation time |
| 📅 Calendar View | Interactive weekly grid showing slots positioned by time |
| 🔔 Notifications | Live conflict bell counter for admins, auto-refreshes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · Vite 7 · React Router 7 · Axios · Vanilla CSS |
| Backend | Node.js · Express 5 · MySQL2 · JWT · bcrypt |
| Database | MySQL 8 |
| DevOps | Docker Compose · npm workspaces · concurrently |

---

## Project Structure

```
conflictfree/
├── apps/
│   ├── api/          # Express REST API
│   │   └── src/
│   │       ├── config/        # DB pool, schema.sql, seed.js
│   │       ├── controllers/   # Route handlers
│   │       ├── middleware/    # JWT auth + role guard
│   │       ├── models/        # (data layer — in progress)
│   │       └── routes/        # Express routers
│   └── web/          # React frontend
│       └── src/
│           ├── components/    # Navbar, Sidebar, Dashboards, Calendar
│           ├── context/       # AuthContext (JWT session)
│           ├── pages/         # Login, Dashboard
│           ├── services/      # Axios API calls
│           └── styles/        # Per-component CSS + theme tokens
├── docker-compose.yml
└── package.json     # Monorepo root (npm workspaces)
```

---

## Getting Started (Local Development)

### Prerequisites
- Node.js ≥ 18
- MySQL 8 running locally

### 1. Clone and install

```bash
git clone <repo-url>
cd conflictfree
npm install
```

### 2. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env` and set your database credentials and a strong `JWT_SECRET`.

### 3. Create the database and run schema

```bash
mysql -u root -p < apps/api/src/config/schema.sql
```

### 4. Seed sample data (optional)

```bash
cd apps/api && npm run seed
```

This creates sample users, courses, timetable slots, and enrollments.

**Default login credentials after seeding:**
| Role | Email | Password |
|---|---|---|
| Admin | admin@school.com | Admin@123 |
| Faculty | anika@school.com | Faculty@123 |
| Student | alice@student.com | Student@123 |

### 5. Start development servers

```bash
# From project root — starts both API and Web
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:5000

---

## Docker (optional)

```bash
docker-compose up --build
```

> Make sure to update `MYSQL_ROOT_PASSWORD` and `JWT_SECRET` in `docker-compose.yml` before using in any shared environment.

---

## API Reference

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/register` | Public | Register |
| GET | `/api/auth/users?role=faculty` | Admin | List users by role |

### Timetable
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/timetable/me` | Any | My timetable (role-aware) |
| GET | `/api/timetable/slots` | Admin | All slots |
| POST | `/api/timetable/slots` | Admin | Create slot (with conflict check) |
| PATCH | `/api/timetable/slots/:id` | Admin | Update/reschedule slot |
| DELETE | `/api/timetable/slots/:id` | Admin | Delete slot |

### Conflicts
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/conflicts` | Admin | List all active conflicts |
| PATCH | `/api/conflicts/:id/resolve` | Admin | Resolve conflict (delete slot) |

### Courses
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/courses` | Any auth | List courses |
| POST | `/api/courses` | Admin | Create course |
| DELETE | `/api/courses/:id` | Admin | Delete course |

### Enrollments
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/enrollments` | Admin | List all enrollments |
| POST | `/api/enrollments` | Admin | Enroll student in course |
| DELETE | `/api/enrollments/:id` | Admin | Remove enrollment |

---

## Security Notes

- Change `JWT_SECRET` to a cryptographically random string before any deployment
- Never commit `.env` files — only commit `.env.example`
- Auth endpoints are rate-limited (20 requests / 15 minutes)
- CORS is configurable via `CORS_ORIGIN` env variable

---

## License

ISC
