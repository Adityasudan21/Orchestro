# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Orchestro** is a JIRA-like ticketing tool with a Spring Boot 4.x backend and a React + TypeScript frontend. The data hierarchy is **Project → Story → Task** (Task types: DEV, DOC, BUG). Three roles: ADMIN, MANAGER, DEVELOPER. Auth is Basic Auth (JWT-ready). The architecture is intentionally designed to support a future Kafka + AI-agent extension where tasks with status `ASSIGNED_TO_AI` get queued for an AI worker that opens GitHub PRs.

---

## Commands

### Backend (`OrchestraBackend/`)

```bash
./mvnw spring-boot:run          # Start dev server on :8080
./mvnw compile                  # Compile only
./mvnw test                     # Run all tests
./mvnw test -Dtest=ClassName    # Run a single test class
./mvnw package -DskipTests      # Build JAR
```

### Frontend (`FrontEnd/`)

```bash
npm run dev      # Start Vite dev server on :5173
npm run build    # Type-check + production build
npx tsc -p tsconfig.app.json --noEmit  # Type-check only (no emit)
```

### Database

The backend auto-creates/migrates tables via `spring.jpa.hibernate.ddl-auto=update`. On first run a default admin is seeded: **username `admin`, password `admin123`** (see `DataInitializer.java`). Database config is in `OrchestraBackend/src/main/resources/application.properties`.

Seed scripts are available at the repo root: `seed_users.sql` and `seed_data.sql` for loading sample data into a running database.

---

## Backend Architecture

**Stack**: Spring Boot 4.0.6 / Java 21 / Spring Security 7 / Hibernate 7 / PostgreSQL. Uses `tools.jackson` (Jackson 3.x) — not the old `com.fasterxml.jackson`.

**Package layout** (`com.Orchestra.OrchestraBackend`):

| Package | Purpose |
|---|---|
| `model/` | JPA entities + enums (`Role`, `TaskType`, `TicketStatus`) |
| `repository/` | Spring Data JPA interfaces |
| `dto/request/` | Validated inbound payloads |
| `dto/response/` | Outbound DTOs with static `.from(entity)` factory methods |
| `service/` | Business logic; controllers never touch repositories directly |
| `controller/` | Thin REST layer; delegates entirely to services |
| `config/` | Security, CORS, Jackson, data seeding, rate limiting |
| `exception/` | `GlobalExceptionHandler` + typed exceptions |

**Key architectural decisions:**
- Controllers never serialize entities — always use `*Response` DTOs via `from()`.
- Services are `@Transactional` at class level with `readOnly = true` overrides on queries.
- `CustomUserDetailsService` loads users for Spring Security; `DaoAuthenticationProvider` is explicitly registered (not auto-configured), which causes a harmless WARN on startup — do not remove the `DaoAuthenticationProvider` bean.
- CORS allows `localhost:5173` and `localhost:3000`.
- `spring.jpa.hibernate.ddl-auto=update` — schema evolves automatically in dev. Do not use in production.
- `PagedResponse<T>` is the standard wrapper for paginated endpoints — use `PagedResponse.from(page, mapper)` in controllers.

**Security**: All endpoints require Basic Auth except no explicit public permit (login is just any authenticated `POST /api/auth/login`). Role guards use `@PreAuthorize` on controllers + `SecurityConfig` path matchers. `ADMIN`-only: `/api/users/**`, `POST /api/auth/register`. `ADMIN`/`MANAGER`-only: project creation/update, story creation/update.

**Rate limiting**: `RateLimitFilter` applies a sliding-window limit of 10 requests per IP per 60 seconds to `POST /api/auth/login`. Implemented as a `OncePerRequestFilter` using an in-memory `ConcurrentHashMap` — not distributed; resets on restart.

**TicketStatus enum** includes future AI states: `ASSIGNED_TO_AI` and `NEEDS_MORE_INFO`. The stub for Kafka integration is a comment in `TaskService.updateStatus()`. Do not remove these statuses.

**Jackson / date serialization**: `spring.jackson.serialization.write-dates-as-timestamps` cannot be set in `application.properties` in Spring Boot 4.x (the property binding breaks with `tools.jackson`). Configure via Java bean if needed — `Jackson2ObjectMapperBuilderCustomizer` is also removed in Spring Boot 4.x.

**New models (added post-launch):**
- `ActivityLog` — tracks create/update/delete actions on entities; written by services, read via `GET /{entity}/{id}/activity`.
- `Notification` — per-user in-app notifications; created by services on relevant events (assignment, comment, status change).

**New request DTOs:**
- `ChangePasswordRequest` / `VerifyPasswordRequest` — used by `UserController` for the change-password flow.
- `UpdateRoleRequest` / `UpdateTypeRequest` — used by admin endpoints to patch a user's role or a task's type.

---

## Frontend Architecture

**Stack**: React 18 + TypeScript + Vite 8 + Tailwind CSS 3 + TanStack Query v5 + React Router v6 + Axios. Vite 8 uses rolldown (not esbuild) as its bundler.

**Auth flow**: `AuthContext` stores the logged-in `User` and writes credentials to `sessionStorage`. The Axios instance (`src/api/axios.ts`) injects `Authorization: Basic <base64>` on every request and redirects to `/login` on 401. Swapping to JWT only requires changing the Axios interceptor and `AuthContext` — no pages change.

**Data fetching**: All server state goes through TanStack Query (`useQuery` / `useMutation`). Query keys follow the pattern `['resource', id]` (e.g. `['task', taskId]`, `['comments', 'task', taskId]`). Invalidate by key after mutations. Paginated endpoints return `PagedResponse<T>` — use `data.content` for the items and `data.totalPages` for pagination controls.

**Page routing** (`App.tsx`):
- `/login` — public, redirects to `/dashboard` if already authenticated
- All other routes are wrapped in `AppLayout` which redirects to `/login` if not authenticated
- `/dashboard` → `GET /api/tasks/my` (my assigned tasks) + `GET /api/stories/my` (my assigned stories)
- `/my-projects` → `GET /api/projects/my` (projects where the user is assignee/reporter/member)
- `/projects` → all projects list
- `/projects/:id` → project detail with stories, comments, attachments, and activity log
- `/stories/:id` → story detail with tasks, comments, attachments, and activity log
- `/tasks/:id` → full task detail with comments, attachments, status controls, and activity log
- `/admin` → user management (ADMIN only)

**API modules** (`src/api/`): One file per resource. Each exports a plain object with typed methods. Import the specific api module, not the axios instance, in components.

| Module | Endpoints covered |
|---|---|
| `auth.api.ts` | login, register |
| `projects.api.ts` | CRUD, members, pagination |
| `stories.api.ts` | CRUD, status, pagination |
| `tasks.api.ts` | CRUD, status, type |
| `comments.api.ts` | create/list for tasks and stories |
| `attachments.api.ts` | upload/download/delete for tasks and stories |
| `notifications.api.ts` | `getMy`, `getUnreadCount`, `markRead`, `markAllRead` |
| `activity.api.ts` | `getForProject`, `getForStory`, `getForTask` |
| `users.api.ts` | list, update role, change password, verify password |

**Shared types** (`src/types/index.ts`): Single source of truth for `User`, `Project`, `Story`, `Task`, `Comment`, `Attachment`, `ActivityLog`, `Notification`, `PagedResponse<T>`, `TicketStatus`, `TaskType`, `Role`, and all create/update payload types.

**Shared components** (`src/components/common/`):

| Component | Purpose |
|---|---|
| `AssigneeSelect` | Searchable user dropdown for assignee/reporter fields |
| `ChangePasswordDialog` | Modal for changing password with live current-password verification |
| `CommentText` | Renders comment content with `@mention` highlighting |
| `MentionTextarea` | Textarea with `@mention` autocomplete triggered by `@` |
| `Pagination` | Page number controls backed by `PagedResponse` metadata |
| `StatusSelect` | Inline dropdown for changing `TicketStatus` |
| `StatusBadge` / `TypeBadge` | Read-only colored badges |
| `LoadingSpinner` | Centered spinner for loading states |

**Status colors** (`src/utils/statusColors.ts`): Tailwind class mappings for `TicketStatus` and `TaskType`. Update here when adding new statuses — do not inline color classes in components.

**Utilities** (`src/utils/`):
- `statusColors.ts` — Tailwind class maps for status/type badges.
- `timeAgo.ts` — human-readable relative timestamps (e.g. "3h ago", "yesterday").

**@mention system**: `MentionTextarea` detects `@` and queries `GET /api/users` to show an autocomplete dropdown. Submitted comment text is stored as plain text with `@username` tokens. `CommentText` parses the stored text and wraps matching `@username` tokens in a highlight span. Dotted usernames (e.g. `@rohan.sharma`) are supported.

**Vite proxy**: All `/api/*` requests from the dev server are proxied to `http://localhost:8080`, so no CORS issues during development and no hardcoded backend URL in frontend code.
