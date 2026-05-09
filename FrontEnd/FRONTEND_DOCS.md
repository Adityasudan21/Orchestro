# Orchestro — Frontend Documentation

## Overview

**Dev server:** `http://localhost:5173`  
**Stack:** React 18 · TypeScript · Vite 5 · Tailwind CSS 3 · TanStack Query v5 · React Router v6 · Axios  
**Backend proxy:** All `/api/*` requests are proxied by Vite to `http://localhost:8080` — no hardcoded backend URL anywhere in the code.

---

## Running Locally

```bash
cd FrontEnd
npm install       # first time only
npm run dev       # starts dev server on http://localhost:5173
npm run build     # type-check + production build
npx tsc -p tsconfig.app.json --noEmit  # type-check only
```

---

## Project Structure

```
src/
├── api/                # One file per backend resource — all HTTP calls live here
│   ├── axios.ts        # Axios instance, credential injection, 401 redirect
│   ├── auth.api.ts
│   ├── projects.api.ts
│   ├── stories.api.ts
│   ├── tasks.api.ts
│   ├── comments.api.ts
│   ├── attachments.api.ts
│   └── users.api.ts
├── components/
│   ├── common/
│   │   ├── LoadingSpinner.tsx
│   │   ├── StatusBadge.tsx   # Renders TicketStatus as a colored pill
│   │   └── TypeBadge.tsx     # Renders TaskType (DEV/DOC/BUG) as a colored pill
│   └── layout/
│       ├── AppLayout.tsx     # Auth guard + sidebar + <Outlet />
│       └── Sidebar.tsx       # Nav links; Users link visible to ADMIN only
├── context/
│   └── AuthContext.tsx       # Stores user + credentials; login/logout
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ProjectsPage.tsx
│   ├── ProjectDetailPage.tsx
│   ├── StoryDetailPage.tsx
│   ├── TaskDetailPage.tsx
│   └── AdminPage.tsx
├── types/
│   └── index.ts             # All shared TypeScript types and interfaces
├── utils/
│   └── statusColors.ts      # Tailwind class maps for TicketStatus and TaskType
├── App.tsx                  # Route definitions
└── main.tsx                 # React + QueryClient + AuthProvider bootstrap
```

---

## Authentication Flow

Authentication uses **HTTP Basic Auth**. Credentials are base64-encoded and attached to every API request via an Axios interceptor.

### Login sequence

1. User submits username + password on `LoginPage`
2. `setCredentials(username, password)` is called → sets `Authorization: Basic <base64>` on the Axios instance
3. `authApi.login()` fires `POST /api/auth/login` — if valid, returns the `User` object
4. `AuthContext.login()` stores the user in React state and persists credentials + user to `sessionStorage`
5. User is redirected to `/dashboard`

### Session persistence

On page refresh, `AuthContext` reads `orchestro_user` and `orchestro_creds` from `sessionStorage` and restores both the user state and the Axios `Authorization` header.

### Logout

`AuthContext.logout()` clears React state, removes `sessionStorage` keys, and deletes the `Authorization` header from Axios.

### 401 handling

The Axios response interceptor catches any `401 Unauthorized` response, clears credentials, and redirects to `/login`.

### Swapping to JWT

Only two files need to change: `axios.ts` (attach `Bearer <token>` instead of `Basic <base64>`) and `AuthContext.tsx` (store/restore a token instead of credentials). No pages or components change.

---

## Routing

Defined in `App.tsx`. All routes except `/login` are wrapped in `AppLayout`, which redirects to `/login` if the user is not authenticated.

| Path | Component | Description |
|---|---|---|
| `/login` | `LoginPage` | Public — redirects to `/dashboard` if already logged in |
| `/` | — | Redirects to `/dashboard` |
| `/dashboard` | `DashboardPage` | Tasks assigned to the current user |
| `/projects` | `ProjectsPage` | All projects list |
| `/projects/:id` | `ProjectDetailPage` | Stories within a project |
| `/stories/:id` | `StoryDetailPage` | Tasks within a story |
| `/tasks/:id` | `TaskDetailPage` | Full task detail — status, comments, attachments |
| `/admin` | `AdminPage` | User management — hard-redirects non-ADMINs to `/dashboard` |
| `*` | — | Redirects to `/dashboard` |

---

## API Integration

All API calls go through the Axios instance in `axios.ts` with `baseURL: '/api'`. Do **not** include `/api` in the path when calling `api.get(...)` — it is already in the base URL.

### `auth.api.ts`

| Method | Path | Used in |
|---|---|---|
| `authApi.login()` | `POST /api/auth/login` | `LoginPage` — on form submit |
| `authApi.me()` | `GET /api/auth/me` | Available, not currently called in a page |
| `authApi.register(payload)` | `POST /api/auth/register` | `AdminPage` — create new user form |

---

### `projects.api.ts`

| Method | Path | Used in |
|---|---|---|
| `projectsApi.getAll()` | `GET /api/projects` | `ProjectsPage` |
| `projectsApi.getMy()` | `GET /api/projects/my` | Available, not currently wired to a page |
| `projectsApi.getById(id)` | `GET /api/projects/{id}` | `ProjectDetailPage` |
| `projectsApi.create(payload)` | `POST /api/projects` | `ProjectsPage` — create form (ADMIN/MANAGER) |
| `projectsApi.update(id, payload)` | `PUT /api/projects/{id}` | Available, not currently wired to a page |

**Create payload:**
```ts
{ name: string; description?: string; memberIds?: number[] }
```

---

### `stories.api.ts`

| Method | Path | Used in |
|---|---|---|
| `storiesApi.getByProject(projectId)` | `GET /api/projects/{id}/stories` | `ProjectDetailPage` |
| `storiesApi.getById(id)` | `GET /api/stories/{id}` | `StoryDetailPage` |
| `storiesApi.create(projectId, payload)` | `POST /api/projects/{id}/stories` | `ProjectDetailPage` — create form |
| `storiesApi.update(id, payload)` | `PUT /api/stories/{id}` | Available, not currently wired to a page |
| `storiesApi.updateStatus(id, payload)` | `PATCH /api/stories/{id}/status` | Available, not currently wired to a page |
| `storiesApi.assign(id, assigneeId)` | `PATCH /api/stories/{id}/assignee` | `StoryDetailPage` — assign dropdown (ADMIN/MANAGER) |

**Create payload:**
```ts
{ title: string; description?: string; assigneeId?: number; gitLink?: string; commitNumber?: string; branch?: string }
```

---

### `tasks.api.ts`

| Method | Path | Used in |
|---|---|---|
| `tasksApi.getByStory(storyId)` | `GET /api/stories/{id}/tasks` | `StoryDetailPage` |
| `tasksApi.getById(id)` | `GET /api/tasks/{id}` | `TaskDetailPage` |
| `tasksApi.getMy()` | `GET /api/tasks/my` | `DashboardPage` |
| `tasksApi.create(storyId, payload)` | `POST /api/stories/{id}/tasks` | `StoryDetailPage` — create form |
| `tasksApi.update(id, payload)` | `PUT /api/tasks/{id}` | Available, not currently wired to a page |
| `tasksApi.updateStatus(id, payload)` | `PATCH /api/tasks/{id}/status` | `TaskDetailPage` — status buttons |
| `tasksApi.assign(id, assigneeId)` | `PATCH /api/tasks/{id}/assignee` | `TaskDetailPage` — assign dropdown (ADMIN/MANAGER) |

**Create payload:**
```ts
{ title: string; type: TaskType; description?: string; assigneeId?: number; gitLink?: string; commitNumber?: string; branch?: string }
```

---

### `comments.api.ts`

| Method | Path | Used in |
|---|---|---|
| `commentsApi.getByTask(taskId)` | `GET /api/tasks/{id}/comments` | `TaskDetailPage` |
| `commentsApi.getByStory(storyId)` | `GET /api/stories/{id}/comments` | Available, not currently wired to a page |
| `commentsApi.addToTask(taskId, content)` | `POST /api/tasks/{id}/comments` | `TaskDetailPage` — comment input |
| `commentsApi.addToStory(storyId, content)` | `POST /api/stories/{id}/comments` | Available, not currently wired to a page |

---

### `attachments.api.ts`

| Method | Path | Used in |
|---|---|---|
| `attachmentsApi.getByTask(taskId)` | `GET /api/tasks/{id}/attachments` | `TaskDetailPage` |
| `attachmentsApi.getByStory(storyId)` | `GET /api/stories/{id}/attachments` | Available, not currently wired to a page |
| `attachmentsApi.uploadToTask(taskId, file)` | `POST /api/tasks/{id}/attachments` | `TaskDetailPage` — file upload |
| `attachmentsApi.uploadToStory(storyId, file)` | `POST /api/stories/{id}/attachments` | Available, not currently wired to a page |
| `attachmentsApi.downloadUrl(id)` | `/api/attachments/{id}/download` | `TaskDetailPage` — download link (direct browser URL, not Axios) |

---

### `users.api.ts`

| Method | Path | Used in |
|---|---|---|
| `usersApi.getAssignable()` | `GET /api/users/assignable` | `ProjectsPage`, `ProjectDetailPage`, `StoryDetailPage`, `TaskDetailPage` — assignee/member pickers (ADMIN/MANAGER only) |

The `/api/users` and `/api/users/{id}` endpoints are called directly via the raw Axios instance in `AdminPage` (not via a named api module).

---

## Server State — TanStack Query

All data fetching uses `useQuery` and all mutations use `useMutation` from TanStack Query v5.

### Query key conventions

| Data | Query key |
|---|---|
| All projects | `['projects']` |
| Single project | `['project', projectId]` |
| Stories in a project | `['stories', projectId]` |
| Single story | `['story', storyId]` |
| Tasks in a story | `['tasks', storyId]` |
| Single task | `['task', taskId]` |
| My assigned tasks | `['my-tasks']` |
| All users (admin) | `['users']` |
| Assignable users | `['users', 'assignable']` |
| Comments on task | `['comments', 'task', taskId]` |
| Attachments on task | `['attachments', 'task', taskId]` |

### Cache invalidation

After every mutation, `queryClient.invalidateQueries({ queryKey: [...] })` is called with the relevant key to trigger a re-fetch. For example, after assigning a task, `['task', taskId]` is invalidated to refresh the detail view.

The `['users', 'assignable']` query is shared across multiple pages. Because TanStack Query deduplicates by key, only one network request fires even if multiple components mount simultaneously.

---

## Pages — Detailed Breakdown

### `LoginPage` (`/login`)
- Local state: `username`, `password`, `error`, `loading`
- On submit: calls `setCredentials()` → `authApi.login()` → `AuthContext.login()` → navigates to `/dashboard`
- Redirects to `/dashboard` if already authenticated

---

### `DashboardPage` (`/dashboard`)
- Fetches: `tasksApi.getMy()` → `GET /api/tasks/my`
- Displays all tasks assigned to the logged-in user with type badge, status badge, project/story breadcrumb, and branch
- Each task card links to `/tasks/:id`
- ADMIN users see a banner linking to `/admin`

---

### `ProjectsPage` (`/projects`)
- Fetches: `projectsApi.getAll()` → `GET /api/projects`
- ADMIN/MANAGER: shows "+ New Project" button
- Create form (ADMIN/MANAGER only):
  - Fields: name, description, member checkbox list
  - Member list fetched from `usersApi.getAssignable()` when the form is open
  - Submits: `projectsApi.create({ name, description, memberIds })`

---

### `ProjectDetailPage` (`/projects/:id`)
- Fetches: `projectsApi.getById(id)` → `GET /api/projects/{id}`
- Fetches: `storiesApi.getByProject(id)` → `GET /api/projects/{id}/stories`
- ADMIN/MANAGER: shows "+ New Story" button
- Create form (ADMIN/MANAGER only):
  - Fields: title, description, assignee dropdown
  - Assignee list fetched from `usersApi.getAssignable()` when the form is open
  - Submits: `storiesApi.create(projectId, { title, description, assigneeId })`
- Each story card links to `/stories/:id` and shows current assignee and status badge

---

### `StoryDetailPage` (`/stories/:id`)
- Fetches: `storiesApi.getById(id)` → `GET /api/stories/{id}`
- Fetches: `tasksApi.getByStory(id)` → `GET /api/stories/{id}/tasks`
- ADMIN/MANAGER: fetches `usersApi.getAssignable()` for both the story-level assign dropdown and the create task form
- **Story-level assign dropdown** (ADMIN/MANAGER): fires `storiesApi.assign(storyId, assigneeId)` → `PATCH /api/stories/{id}/assignee`
- **Create task form**: fields: title, task type selector (DEV/DOC/BUG), description, assignee dropdown (ADMIN/MANAGER only)
  - Submits: `tasksApi.create(storyId, { title, type, description, assigneeId })`
- Each task card links to `/tasks/:id`

---

### `TaskDetailPage` (`/tasks/:id`)
- Fetches: `tasksApi.getById(id)` → `GET /api/tasks/{id}`
- Fetches: `commentsApi.getByTask(id)` → `GET /api/tasks/{id}/comments`
- Fetches: `attachmentsApi.getByTask(id)` → `GET /api/tasks/{id}/attachments`
- ADMIN/MANAGER: fetches `usersApi.getAssignable()` for the assign dropdown
- **Assign dropdown** (ADMIN/MANAGER): fires `tasksApi.assign(taskId, assigneeId)` → `PATCH /api/tasks/{id}/assignee`
- **Status buttons**: one button per `TicketStatus` value; fires `tasksApi.updateStatus(taskId, { status })` → `PATCH /api/tasks/{id}/status`
  - `ASSIGNED_TO_AI` status shows an informational note about future AI integration
- **Comment form**: text area + Send button; fires `commentsApi.addToTask(taskId, content)` → `POST /api/tasks/{id}/comments`
- **Attachment upload**: file input; fires `attachmentsApi.uploadToTask(taskId, file)` → `POST /api/tasks/{id}/attachments` as `multipart/form-data`
- **Attachment download**: direct browser link to `/api/attachments/{id}/download` (bypasses Axios)

---

### `AdminPage` (`/admin`)
- Hard-redirects non-ADMIN users to `/dashboard` immediately
- Fetches all users directly: `GET /api/users`
- Displays user table: username, email, role (color-coded badge), join date
- **Create user form**: username, email, password, role selector (ADMIN/MANAGER/DEVELOPER)
  - Submits: `authApi.register({ username, email, password, role })` → `POST /api/auth/register`
  - Shows inline server error on failure (e.g. duplicate username)

---

## Role-Based UI Rules

| UI Element | Visible to |
|---|---|
| Sidebar "Users" link | ADMIN only |
| Admin banner on Dashboard | ADMIN only |
| "+ New Project" button | ADMIN, MANAGER |
| Member picker in create project form | ADMIN, MANAGER |
| "+ New Story" button | ADMIN, MANAGER |
| Assignee dropdown in create story form | ADMIN, MANAGER |
| Story-level assign dropdown | ADMIN, MANAGER |
| Assignee dropdown in create task form | ADMIN, MANAGER |
| Task-level assign dropdown | ADMIN, MANAGER |
| Status change buttons | All roles |
| Comment form | All roles |
| File upload | All roles |
| ASSIGNED_TO_AI status button | All roles (AI processing is future) |

---

## Shared Components

### `StatusBadge`
Renders a `TicketStatus` value as a colored pill using `statusColors` and `statusLabel` from `utils/statusColors.ts`.

| Status | Color |
|---|---|
| `TODO` | Gray |
| `IN_PROGRESS` | Blue |
| `IN_REVIEW` | Purple |
| `DONE` | Green |
| `BLOCKED` | Red |
| `ASSIGNED_TO_AI` | Yellow |
| `NEEDS_MORE_INFO` | Orange |

### `TypeBadge`
Renders a `TaskType` as a colored pill.

| Type | Color |
|---|---|
| `DEV` | Indigo |
| `DOC` | Teal |
| `BUG` | Red |

### `AppLayout`
Auth guard — redirects to `/login` if `isAuthenticated` is false. Renders `<Sidebar />` + `<Outlet />`.

### `Sidebar`
Left nav with **My Work** and **Projects** for all users. **Users** link added for ADMIN only. Shows logged-in username and role at the bottom.

---

## TypeScript Types (`src/types/index.ts`)

```ts
type Role = 'ADMIN' | 'MANAGER' | 'DEVELOPER'
type TaskType = 'DEV' | 'DOC' | 'BUG'
type TicketStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED' | 'ASSIGNED_TO_AI' | 'NEEDS_MORE_INFO'

interface User     { id, username, email, role, createdAt }
interface Project  { id, name, description, createdBy, members[], createdAt }
interface Story    { id, projectId, projectName, title, description, assignee, reporter, status, gitLink, commitNumber, branch, createdAt }
interface Task     { id, storyId, storyTitle, projectId, title, description, type, assignee, reporter, status, gitLink, commitNumber, branch, createdAt }
interface Comment  { id, taskId, storyId, user, content, createdAt }
interface Attachment { id, taskId, storyId, fileName, contentType, uploadedBy, createdAt }
```

All payload types (`CreateProjectPayload`, `CreateStoryPayload`, `CreateTaskPayload`, `UpdateStatusPayload`) are also defined here.

---

## Adding a New API Integration

1. Add a method to the relevant file in `src/api/` using the shared Axios instance:
   ```ts
   newMethod: (id: number) => api.get<ResponseType>(`/resource/${id}`).then((r) => r.data)
   ```
2. Use `useQuery` or `useMutation` in the component with a consistent query key
3. Call `queryClient.invalidateQueries` after mutations to refresh related data
4. Add any new status/type values to `src/utils/statusColors.ts` and `src/types/index.ts`
