# Orchestro — Backend API Documentation

## Overview

**Base URL:** `http://localhost:8080/api`  
**Stack:** Spring Boot 4.0.6 · Java 21 · PostgreSQL · Spring Security 7  
**Authentication:** HTTP Basic Auth on every request (`Authorization: Basic base64(username:password)`)

---

## Roles & Permissions

| Role | Capabilities |
|---|---|
| `ADMIN` | Full access — user management, project/story/task CRUD, assign to anyone |
| `MANAGER` | Create/update projects, stories, tasks; assign to MANAGER or DEVELOPER (not ADMIN) |
| `DEVELOPER` | Read everything; create tasks/comments/attachments; cannot assign |

Role hierarchy enforcement on assignment: a **MANAGER cannot assign a ticket to an ADMIN**.

---

## Data Hierarchy

```
Project
  └── Story
        └── Task  (types: DEV | DOC | BUG)
              ├── Comments
              └── Attachments
Story
  ├── Comments
  └── Attachments
```

---

## Enums

### `TicketStatus`
| Value | Description |
|---|---|
| `TODO` | Default state — not started |
| `IN_PROGRESS` | Actively being worked on |
| `IN_REVIEW` | Submitted for review |
| `DONE` | Completed |
| `BLOCKED` | Cannot proceed |
| `ASSIGNED_TO_AI` | Queued for AI agent (Kafka integration — future) |
| `NEEDS_MORE_INFO` | AI agent requires clarification (future) |

### `TaskType`
`DEV` · `DOC` · `BUG`

### `Role`
`ADMIN` · `MANAGER` · `DEVELOPER`

---

## Common Response Shapes

### UserResponse
```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com",
  "role": "ADMIN",
  "createdAt": "2026-05-10T10:00:00"
}
```

### ProjectResponse
```json
{
  "id": 1,
  "name": "Orchestro",
  "description": "Main project",
  "createdBy": { "...UserResponse" },
  "members": [ { "...UserResponse" } ],
  "createdAt": "2026-05-10T10:00:00"
}
```

### StoryResponse
```json
{
  "id": 1,
  "projectId": 1,
  "projectName": "Orchestro",
  "title": "User Authentication",
  "description": "Implement login flow",
  "assignee": { "...UserResponse or null" },
  "reporter": { "...UserResponse" },
  "status": "TODO",
  "gitLink": "https://github.com/org/repo",
  "commitNumber": "abc123",
  "branch": "feature/auth",
  "createdAt": "2026-05-10T10:00:00"
}
```

### TaskResponse
```json
{
  "id": 1,
  "storyId": 1,
  "storyTitle": "User Authentication",
  "projectId": 1,
  "title": "Build login API",
  "description": "POST /api/auth/login endpoint",
  "type": "DEV",
  "assignee": { "...UserResponse or null" },
  "reporter": { "...UserResponse" },
  "status": "IN_PROGRESS",
  "gitLink": "https://github.com/org/repo",
  "commitNumber": "def456",
  "branch": "feature/login-api",
  "createdAt": "2026-05-10T10:00:00"
}
```

### CommentResponse
```json
{
  "id": 1,
  "taskId": 1,
  "storyId": null,
  "user": { "...UserResponse" },
  "content": "Looks good!",
  "createdAt": "2026-05-10T10:00:00"
}
```

### AttachmentResponse
```json
{
  "id": 1,
  "taskId": 1,
  "storyId": null,
  "fileName": "diagram.png",
  "contentType": "image/png",
  "uploadedBy": { "...UserResponse" },
  "createdAt": "2026-05-10T10:00:00"
}
```

---

## Endpoints

---

### Auth

#### `POST /api/auth/login`
Validates credentials and returns the logged-in user.  
**Access:** All authenticated users  
**Request body:** none (credentials via Basic Auth header)  
**Response:** `UserResponse`

```bash
curl -u admin:admin123 -X POST http://localhost:8080/api/auth/login
```

---

#### `GET /api/auth/me`
Returns the currently authenticated user.  
**Access:** All authenticated users  
**Response:** `UserResponse`

```bash
curl -u admin:admin123 http://localhost:8080/api/auth/me
```

---

#### `POST /api/auth/register`
Creates a new user account.  
**Access:** ADMIN only  
**Request body:**
```json
{
  "username": "bob",
  "email": "bob@example.com",
  "password": "secret123",
  "role": "DEVELOPER"
}
```
**Response:** `UserResponse` (201 Created)

```bash
curl -u admin:admin123 -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","email":"bob@example.com","password":"secret123","role":"DEVELOPER"}'
```

---

### Users

#### `GET /api/users`
Returns all users.  
**Access:** ADMIN only  
**Response:** `UserResponse[]`

---

#### `GET /api/users/{id}`
Returns a single user by ID.  
**Access:** ADMIN only  
**Response:** `UserResponse`

---

#### `GET /api/users/assignable`
Returns users that the caller is allowed to assign tickets to.  
- **ADMIN** → all users  
- **MANAGER** → MANAGER + DEVELOPER only  

**Access:** ADMIN, MANAGER  
**Response:** `UserResponse[]`

```bash
curl -u manager:pass http://localhost:8080/api/users/assignable
```

---

### Projects

#### `GET /api/projects`
Returns all projects.  
**Access:** All authenticated users  
**Response:** `ProjectResponse[]`

---

#### `GET /api/projects/my`
Returns projects where the caller is a member.  
**Access:** All authenticated users  
**Response:** `ProjectResponse[]`

---

#### `GET /api/projects/{id}`
Returns a single project.  
**Access:** All authenticated users  
**Response:** `ProjectResponse`

---

#### `POST /api/projects`
Creates a new project.  
**Access:** ADMIN, MANAGER  
**Request body:**
```json
{
  "name": "Orchestro",
  "description": "Ticketing platform",
  "memberIds": [2, 3, 4]
}
```
`memberIds` is optional — omit to create a project with no members.  
**Response:** `ProjectResponse` (201 Created)

---

#### `PUT /api/projects/{id}`
Updates a project's name, description, and member list.  
**Access:** ADMIN, MANAGER  
**Request body:** same shape as `POST /api/projects`  
**Response:** `ProjectResponse`

---

#### `DELETE /api/projects/{id}`
Deletes a project.  
**Access:** ADMIN only  
**Response:** 204 No Content

---

### Stories

#### `GET /api/projects/{projectId}/stories`
Returns all stories in a project.  
**Access:** All authenticated users  
**Response:** `StoryResponse[]`

---

#### `POST /api/projects/{projectId}/stories`
Creates a story inside a project.  
**Access:** ADMIN, MANAGER  
**Request body:**
```json
{
  "title": "User Authentication",
  "description": "Implement login, register, and session flows",
  "assigneeId": 3,
  "gitLink": "https://github.com/org/repo",
  "commitNumber": "abc123",
  "branch": "feature/auth"
}
```
All fields except `title` are optional.  
**Response:** `StoryResponse` (201 Created)

---

#### `GET /api/stories/{id}`
Returns a single story.  
**Access:** All authenticated users  
**Response:** `StoryResponse`

---

#### `PUT /api/stories/{id}`
Updates a story's fields.  
**Access:** ADMIN, MANAGER  
**Request body:** same shape as `POST /api/projects/{projectId}/stories`  
**Response:** `StoryResponse`

---

#### `PATCH /api/stories/{id}/status`
Updates only the status of a story.  
**Access:** All authenticated users  
**Request body:**
```json
{ "status": "IN_PROGRESS" }
```
**Response:** `StoryResponse`

---

#### `PATCH /api/stories/{id}/assignee`
Assigns a story to a user.  
**Access:** ADMIN, MANAGER  
**Role rule:** MANAGER cannot assign to an ADMIN user (returns 403).  
**Request body:**
```json
{ "assigneeId": 4 }
```
**Response:** `StoryResponse`

---

### Tasks

#### `GET /api/stories/{storyId}/tasks`
Returns all tasks in a story.  
**Access:** All authenticated users  
**Response:** `TaskResponse[]`

---

#### `POST /api/stories/{storyId}/tasks`
Creates a task inside a story.  
**Access:** All authenticated users  
**Request body:**
```json
{
  "title": "Build login API",
  "description": "POST /api/auth/login endpoint",
  "type": "DEV",
  "assigneeId": 3,
  "gitLink": "https://github.com/org/repo",
  "commitNumber": "def456",
  "branch": "feature/login-api"
}
```
`type` is required. All other fields except `title` are optional.  
**Response:** `TaskResponse` (201 Created)

---

#### `GET /api/tasks/my`
Returns all tasks assigned to the authenticated user.  
**Access:** All authenticated users  
**Response:** `TaskResponse[]`

---

#### `GET /api/tasks/{id}`
Returns a single task.  
**Access:** All authenticated users  
**Response:** `TaskResponse`

---

#### `PUT /api/tasks/{id}`
Updates a task's fields.  
**Access:** All authenticated users  
**Request body:** same shape as `POST /api/stories/{storyId}/tasks`  
**Response:** `TaskResponse`

---

#### `PATCH /api/tasks/{id}/status`
Updates only the status of a task.  
**Access:** All authenticated users  
**Request body:**
```json
{ "status": "IN_REVIEW" }
```
**Response:** `TaskResponse`

> Setting status to `ASSIGNED_TO_AI` is accepted. Future: this will publish to the Kafka topic `ai-ticket-queue` for the AI agent.

---

#### `PATCH /api/tasks/{id}/assignee`
Assigns a task to a user.  
**Access:** ADMIN, MANAGER  
**Role rule:** MANAGER cannot assign to an ADMIN user (returns 403).  
**Request body:**
```json
{ "assigneeId": 5 }
```
**Response:** `TaskResponse`

---

### Comments

#### `GET /api/tasks/{taskId}/comments`
Returns all comments on a task.  
**Access:** All authenticated users  
**Response:** `CommentResponse[]`

---

#### `POST /api/tasks/{taskId}/comments`
Adds a comment to a task.  
**Access:** All authenticated users  
**Request body:**
```json
{ "content": "This looks good, merging soon." }
```
**Response:** `CommentResponse` (201 Created)

---

#### `GET /api/stories/{storyId}/comments`
Returns all comments on a story.  
**Access:** All authenticated users  
**Response:** `CommentResponse[]`

---

#### `POST /api/stories/{storyId}/comments`
Adds a comment to a story.  
**Access:** All authenticated users  
**Request body:**
```json
{ "content": "Story scope looks good." }
```
**Response:** `CommentResponse` (201 Created)

---

### Attachments

#### `GET /api/tasks/{taskId}/attachments`
Returns all attachments on a task.  
**Access:** All authenticated users  
**Response:** `AttachmentResponse[]`

---

#### `POST /api/tasks/{taskId}/attachments`
Uploads a file attachment to a task.  
**Access:** All authenticated users  
**Request:** `multipart/form-data` with field name `file`  
**Response:** `AttachmentResponse` (201 Created)

```bash
curl -u alice:pass -X POST http://localhost:8080/api/tasks/1/attachments \
  -F "file=@/path/to/diagram.png"
```

---

#### `GET /api/stories/{storyId}/attachments`
Returns all attachments on a story.  
**Access:** All authenticated users  
**Response:** `AttachmentResponse[]`

---

#### `POST /api/stories/{storyId}/attachments`
Uploads a file attachment to a story.  
**Access:** All authenticated users  
**Request:** `multipart/form-data` with field name `file`  
**Response:** `AttachmentResponse` (201 Created)

---

#### `GET /api/attachments/{id}/download`
Downloads an attachment file.  
**Access:** All authenticated users  
**Response:** File stream with `Content-Disposition: attachment` header

```bash
curl -u alice:pass http://localhost:8080/api/attachments/1/download -O
```

---

## Error Responses

| HTTP Status | When |
|---|---|
| `400 Bad Request` | Validation failure on request body (`@NotNull`, `@NotBlank`, etc.) |
| `401 Unauthorized` | Missing or invalid Basic Auth credentials |
| `403 Forbidden` | Authenticated but insufficient role (e.g. DEVELOPER calling assign) |
| `404 Not Found` | Requested resource does not exist |
| `500 Internal Server Error` | Unexpected server error |

Error body shape:
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Story not found: 99",
  "timestamp": "2026-05-10T10:00:00"
}
```

---

## Running Locally

```bash
# Prerequisites: PostgreSQL running, database named 'DB' created

cd OrchestraBackend
./mvnw spring-boot:run
# Server starts on http://localhost:8080
```

**Default seeded admin account:** `admin / admin123`

File uploads are stored in the `uploads/` directory relative to where the server is started (configured via `app.upload.dir` in `application.properties`).

---

## Future: Kafka / AI Extension

The `ASSIGNED_TO_AI` and `NEEDS_MORE_INFO` statuses are already part of the `TicketStatus` enum. When set, a future Kafka producer in `TaskService.updateStatus()` will publish to the `ai-ticket-queue` topic. An AI worker microservice will consume the message, attempt to resolve the ticket, open a GitHub PR, and update the ticket status accordingly.

No changes to the API contract will be needed when this extension is implemented.
