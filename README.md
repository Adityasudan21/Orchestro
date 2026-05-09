# Orchestro

A JIRA-like project management and ticketing tool built with Spring Boot 4 and React. Supports a three-level hierarchy — **Project → Story → Task** — with role-based access control and a roadmap for AI-assisted ticket resolution via Kafka.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 4.0.6 · Java 21 · Spring Security 7 · Hibernate 7 |
| Database | PostgreSQL 17 |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS 3 |
| State | TanStack Query v5 · React Router v6 · Axios |

---

## Features

- **Authentication** — HTTP Basic Auth (stateless, JWT-ready)
- **Three roles** — `ADMIN`, `MANAGER`, `DEVELOPER` with endpoint-level guards
- **Ticket hierarchy** — Projects contain Stories; Stories contain Tasks
- **Task types** — `DEV`, `DOC`, `BUG`
- **Ticket fields** — title, description, git link, branch, commit number, assignee, reporter, status, created date
- **Status workflow** — `TODO → IN_PROGRESS → IN_REVIEW → DONE → BLOCKED`
- **Comments** — threaded comments on Stories and Tasks
- **Attachments** — file upload/download on Stories and Tasks
- **Dashboard** — "My Work" view showing all tasks assigned to the logged-in user
- **Admin panel** — user creation and management (ADMIN only)
- **AI stubs** — `ASSIGNED_TO_AI` and `NEEDS_MORE_INFO` statuses + Kafka hook point in `TaskService` ready for the AI extension

---

## Project Structure

```
Orchestro/
├── OrchestraBackend/          # Spring Boot REST API
│   └── src/main/java/com/Orchestra/OrchestraBackend/
│       ├── config/            # Security, CORS, data seeding
│       ├── controller/        # REST endpoints
│       ├── dto/               # Request/response DTOs
│       ├── model/             # JPA entities + enums
│       ├── repository/        # Spring Data JPA interfaces
│       └── service/           # Business logic
└── FrontEnd/                  # React + TypeScript SPA
    └── src/
        ├── api/               # Typed Axios modules per resource
        ├── components/        # Shared UI components and layout
        ├── context/           # Auth context
        ├── pages/             # Route-level page components
        ├── types/             # Shared TypeScript interfaces
        └── utils/             # Status/type color mappings
```

---

## Getting Started

### Prerequisites

- Java 21
- Maven (or use the included `mvnw` wrapper)
- Node.js 18+
- PostgreSQL running locally

### 1. Database

```sql
CREATE DATABASE DB;
```

### 2. Backend

Update credentials in `OrchestraBackend/src/main/resources/application.properties` if needed, then:

```bash
cd OrchestraBackend
./mvnw spring-boot:run
```

The API starts on **http://localhost:8080**. On first run, a default admin user is created:

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

### 3. Frontend

```bash
cd FrontEnd
npm install
npm run dev
```

The app starts on **http://localhost:5173**. All `/api/*` requests are proxied to the backend — no CORS setup required during development.

---

## API Overview

| Method | Endpoint | Access |
|---|---|---|
| `POST` | `/api/auth/login` | All authenticated |
| `GET` | `/api/auth/me` | All authenticated |
| `POST` | `/api/auth/register` | ADMIN only |
| `GET/POST` | `/api/projects` | All / MANAGER+ |
| `GET/POST` | `/api/projects/:id/stories` | All / MANAGER+ |
| `GET/POST` | `/api/stories/:id/tasks` | All |
| `PATCH` | `/api/tasks/:id/status` | All |
| `GET/POST` | `/api/tasks/:id/comments` | All |
| `POST` | `/api/tasks/:id/attachments` | All |
| `GET` | `/api/users` | ADMIN only |

---

## Roadmap

The codebase is pre-wired for a Kafka + AI-agent extension:

1. **Assign to AI** — setting a task status to `ASSIGNED_TO_AI` will trigger a Kafka publish (stub in `TaskService.updateStatus()`)
2. **AI worker** — a separate microservice will consume from the Kafka topic, analyse the ticket, and open a GitHub PR
3. **Feedback loop** — if the AI cannot complete the ticket it sets status to `NEEDS_MORE_INFO` or reassigns to a human
4. **JWT** — swap Basic Auth for JWT by updating `SecurityConfig` and the Axios interceptor in `src/api/axios.ts` — no page components change
