# CareerGPS API Contract

**Source:** `github.com/nhahub/NHA-4-204` · branch `server/feature/roadmap`
**Generated from:** `apps/server/src/modules/**` (every router actually mounted in `apps/server/src/trpc/routers/index.ts` + the one REST route in `apps/server/src/index.ts`)
**Transport:** tRPC over HTTP (`@trpc/server/adapters/express`) + one plain REST/Multer route for file upload + Better Auth's own REST routes.

This doc is generated directly from the code on that branch.

---

## Table of Contents

- [1. Base URLs & Transport](#1-base-urls-transport)
- [2. Authentication model](#2-authentication-model)
  - [Signing up / signing in (Better Auth REST, not tRPC)](#signing-up-signing-in-better-auth-rest-not-trpc)
  - (No custom tRPC auth procedures on this branch — see Better Auth REST below)
- [3. Calling convention used below](#3-calling-convention-used-below)
  - [Standard error shape](#standard-error-shape)
- [4. `user` — profile / availability](#4-user-profile-availability)
  - [`user.getUserInfo` — query, protected](#user-getuserinfo-query-protected)
  - [`user.getUserRoleInfo` — query, protected](#user-getuserroleinfo-query-protected)
  - [`user.setAvailability` — mutation, protected](#user-setavailability-mutation-protected)
- [5. `cv` — CV upload & parsing](#5-cv-cv-upload-parsing)
  - [`POST /cv/parse` — REST, requires session cookie](#post-cv-parse-rest-requires-session-cookie)
  - [`cv.getStatus` — query, protected](#cv-getstatus-query-protected)
  - [`cv.getLatestCV` — query, protected](#cv-getlatestcv-query-protected)
  - [`cv.getCV` — query, protected](#cv-getcv-query-protected)
  - [`cv.getAllCVs` — query, protected](#cv-getallcvs-query-protected)
  - [`cv.getParsedData` — query, protected](#cv-getparseddata-query-protected)
  - [`cv.deleteCV` — mutation, protected](#cv-deletecv-mutation-protected)
- [6. `github` — GitHub sync & manual projects](#6-github-github-sync-manual-projects)
  - [`github.syncProjects` — mutation, protected](#github-syncprojects-mutation-protected)
  - [`github.getStats` — query, protected](#github-getstats-query-protected)
  - [`github.getProjects` — query, protected](#github-getprojects-query-protected)
  - [`github.addManualProject` — mutation, protected](#github-addmanualproject-mutation-protected)
  - [`github.updateProject` — mutation, protected](#github-updateproject-mutation-protected)
  - [`github.deleteProject` — mutation, protected](#github-deleteproject-mutation-protected)
  - [`github.addProjectSkill` / `github.removeProjectSkill` — mutation, protected](#github-addprojectskill-github-removeprojectskill-mutation-protected)
  - [`github.getProjectSkills` — query, protected](#github-getprojectskills-query-protected)
- [7. `skills` — canonical skill registry & user skill strengths](#7-skills-canonical-skill-registry-user-skill-strengths)
  - [`skills.create` — mutation, protected](#skills-create-mutation-protected)
  - [`skills.addUserSkill` — mutation, protected](#skills-adduserskill-mutation-protected)
  - [`skills.updateUserSkill` — mutation, protected](#skills-updateuserskill-mutation-protected)
  - [`skills.getUserSkills` — query, protected](#skills-getuserskills-query-protected)
  - [`skills.getAllSkills` — query, protected](#skills-getallskills-query-protected)
  - [`skills.addManualSkill` — mutation, protected](#skills-addmanualskill-mutation-protected)
  - [`skills.searchSkill` — query, protected](#skills-searchskill-query-protected)
- [8. `curriculum` — per-skill learning steps (`skill_curriculum_nodes`)](#8-curriculum-per-skill-learning-steps-skill-curriculum-nodes)
  - [`curriculum.addCurriculumNodesForSkill` — mutation, protected](#curriculum-addcurriculumnodesforskill-mutation-protected)
  - [`curriculum.updateCurriculumNodesForSkill` — mutation, protected](#curriculum-updatecurriculumnodesforskill-mutation-protected)
  - [`curriculum.getCurriculumNodes` — query, protected](#curriculum-getcurriculumnodes-query-protected)
  - [`curriculum.updateCurriculumNode` — mutation, protected](#curriculum-updatecurriculumnode-mutation-protected)
  - [`curriculum.deleteCurriculumNode` — mutation, protected](#curriculum-deletecurriculumnode-mutation-protected)
- [9. `Resources` — links attached to a curriculum node](#9-resources-links-attached-to-a-curriculum-node)
  - [`Resources.addResourcesForCurriculumNodes` — mutation, protected](#resources-addresourcesforcurriculumnodes-mutation-protected)
  - [`Resources.updateResourcesForCurriculumNode` — mutation, protected](#resources-updateresourcesforcurriculumnode-mutation-protected)
  - [`Resources.getCurriculumNodeResource` — query, protected](#resources-getcurriculumnoderesource-query-protected)
  - [`Resources.updateCurriculumNodeResource` — mutation, protected](#resources-updatecurriculumnoderesource-mutation-protected)
  - [`Resources.deleteCurriculumNodeResource` — mutation, protected](#resources-deletecurriculumnoderesource-mutation-protected)
- [10. `roles` — target job roles & their required skills](#10-roles-target-job-roles-their-required-skills)
  - [`roles.create` — mutation, protected](#roles-create-mutation-protected)
  - [`roles.addSkills` — mutation, protected](#roles-addskills-mutation-protected)
  - [`roles.getAllRoles` — query, protected](#roles-getallroles-query-protected)
  - [`roles.setUserRole` — mutation, protected](#roles-setuserrole-mutation-protected)
  - [`roles.getRoleById` — query, protected](#roles-getrolebyid-query-protected)
- [11. `roadmap` — a specific user's personalized learning path](#11-roadmap-a-specific-user-s-personalized-learning-path)
  - [`roadmap.generate` — mutation, protected](#roadmap-generate-mutation-protected)
  - [`roadmap.completeNode` — mutation, protected](#roadmap-completenode-mutation-protected)
  - [`roadmap.getActiveRoadmap` — query, protected](#roadmap-getactiveroadmap-query-protected)
  - [`roadmap.getUserRoadmaps` — query, protected](#roadmap-getuserroadmaps-query-protected)
  - [`roadmap.deleteUserRoadmap` — mutation, protected](#roadmap-deleteuserroadmap-mutation-protected)
  - [`roadmap.getNodeInfo` — query, protected](#roadmap-getnodeinfo-query-protected)
- [12. `readiness` — role-fit scoring & leaderboards](#12-readiness-role-fit-scoring-leaderboards)
 - [`calendar` — calendar / study-sessions](#calendar)
 - [12. `readiness` — role-fit scoring & leaderboards](#12-readiness-role-fit-scoring-leaderboards)
  - [`readiness.generate` — mutation, protected](#readiness-generate-mutation-protected)
  - [`readiness.getLatestReport` — query, protected](#readiness-getlatestreport-query-protected)
  - [`readiness.getUserReportsHistory` — query, protected](#readiness-getuserreportshistory-query-protected)
  - [`readiness.getGlobalLeaderboard` — query, protected](#readiness-getgloballeaderboard-query-protected)
  - [`readiness.getRoleLeaderboard` — query, protected](#readiness-getroleleaderboard-query-protected)
- [Appendix A — Enum reference](#appendix-a-enum-reference)
- [Appendix B — Things worth confirming with backend before building against this](#appendix-b-things-worth-confirming-with-backend-before-building-against-this)

---

<a id="1-base-urls-transport"></a>
## 1. Base URLs & Transport

| Concern | Path | Notes |
|---|---|---|
| tRPC API (everything below) | `POST/GET http://localhost:3000/trpc/*` | mounted via `createExpressMiddleware` |
| Auth (Better Auth) | `ALL http://localhost:3000/api/auth/*` | sign up / sign in / sign out / session |
| CV upload (REST, not tRPC) | `POST http://localhost:3000/cv/parse` | multipart/form-data, `multer` |
| Health check | `GET http://localhost:3000/` | returns `"OK"` |

Port is hardcoded to `3000` in `index.ts` (not env-driven) — the frontend already points at it via `VITE_SERVER_URL` (`apps/web/src/utils/trpc.ts` / `auth-client.ts`).

**CORS:** `credentials: true`, methods restricted to `GET, POST, OPTIONS`. Every request from the browser **must** send cookies (`fetch(url, { credentials: "include" })` — already wired into the existing `trpcClient`).

<a id="2-authentication-model"></a>
## 2. Authentication model

- Session is a Better Auth HTTP-only cookie (`sameSite: none`, `secure: true`). There is **no bearer token** — the browser just needs to carry the cookie set during sign-in.
- Every tRPC procedure below is either:
  - **`public`** — no session required.
  - **`protected`** — throws `UNAUTHORIZED` (401) if there's no valid session. `ctx.session.user.id` is used internally as the acting user; the frontend never passes a `userId` field itself.
- Almost everything is `protected`. The only `public` procedures on this branch are `auth.createUser` (see §3) — everything else needs a signed-in session first.

<a id="signing-up-signing-in-better-auth-rest-not-trpc"></a>
### Signing up / signing in (Better Auth REST, not tRPC)

Better Auth is mounted wholesale at `/api/auth/*` with `emailAndPassword` enabled and nothing else (no OAuth/social providers configured on this branch).

**Sign up**
```
POST /api/auth/sign-up/email
Content-Type: application/json

{
  "name": "Belal Hassan",
  "email": "belal@example.com",
  "password": "password1234"
}
```
Response `200`: sets the session cookie and returns the created user + session in the body (shape is Better Auth's own, not custom code — treat as opaque and read `user.id`/`user.email` off it).

**Sign in**
```
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "belal@example.com",
  "password": "password1234",
  "rememberMe": true
}
```

**Get current session**
```
GET /api/auth/get-session
```

**Sign out**
```
POST /api/auth/sign-out
```

Use the `better-auth/react` client (`authClient` in `apps/web/src/lib/auth-client.ts`) rather than hand-rolling these calls — it already handles cookie plumbing.

> Note: there are no custom tRPC auth procedures implemented on this branch.

Authentication and session management are provided by Better Auth and are mounted at `/api/auth/*` (sign-up, sign-in, sign-out, session). Use the `better-auth/react` client (`authClient` in `apps/web/src/lib/auth-client.ts`) for browser flows — it handles cookie/session plumbing for you. The server also stores session/account rows in the `auth` DB schema (`apps/server/src/modules/auth/db/schema.ts`).

<a id="3-calling-convention-used-below"></a>
## 3. Calling convention used below

For every procedure: **`module.procedure`**, `query` (GET, read) or `mutation` (POST, write), and whether it's `protected`.

Recommended usage is the existing typed proxy client (already set up in the repo):
```ts
import { trpc } from "@/utils/trpc";

// query (React Query)
const { data } = trpc.roadmap.getActiveRoadmap.useQuery({ roleId });

// mutation
const mutation = trpc.roadmap.completeNode.useMutation();
mutation.mutate({ nodeId });
```
The raw wire format (if you ever need to call it outside the trpc client, e.g. from a script) for a **single, non-batched** call is:
```
GET  /trpc/module.procedure?input={"json":<input>}   // queries
POST /trpc/module.procedure   body: {"json":<input>}  // mutations
```
In the app, `httpBatchLink` batches multiple calls into one request automatically — you don't need to think about this if you use `trpc.*`.

**Every response below is the `data` you get back from `.useQuery()`/`.mutate()` / the `result.json` field of the raw HTTP response — the tRPC envelope (`{ result: { data: { json: ... } } }`) is stripped out already by the client.**

<a id="standard-error-shape"></a>
### Standard error shape

All thrown errors are `TRPCError`s. HTTP status + `code` mapping used throughout this doc:

| `code` | HTTP | Meaning |
|---|---|---|
| `BAD_REQUEST` | 400 | invalid input / business-rule violation (also covers Zod validation failures) |
| `UNAUTHORIZED` | 401 | no session |
| `FORBIDDEN` | 403 | session exists but doesn't own the resource |
| `NOT_FOUND` | 404 | row doesn't exist / doesn't belong to the user |
| `PRECONDITION_FAILED` | 412 | e.g. asking for parsed CV data before parsing finished |
| `INTERNAL_SERVER_ERROR` | 500 | unexpected server failure |

Zod validation errors surface as `BAD_REQUEST` with `error.data.zodError` populated (field-level messages) — worth surfacing directly in form validation UI instead of a generic toast.

---

<a id="4-user-profile-availability"></a>
## 4. `user` — profile / availability

<a id="user-getuserinfo-query-protected"></a>
### `user.getUserInfo` — query, protected
Returns the signed-in user's profile row.

**Input** None
**Example response `200`**
```json
{
  "id": "usr_belal_123",
  "name": "Belal Hassan",
  "email": "belal@example.com",
  "emailVerified": true,
  "image": null,
  "roleId": "8f14e45f-ceea-467e-9d0b-1cae7cb6a4a3",
  "availableDaysPerWeek": 5,
  "availableHoursPerDay": 3,
  "availableWeekdays": [1, 3, 5],
  "timezone": "America/New_York",
  "preferredStartTime": "09:00:00",
  "createdAt": "2026-06-01T09:00:00.000Z",
  "updatedAt": "2026-07-08T10:00:00.000Z"
}
```
**Errors:** `NOT_FOUND` (404) if the session's user row is missing.

<a id="user-getuserroleinfo-query-protected"></a>
### `user.getUserRoleInfo` — query, protected
Returns the `roles` row for the user's current active roadmap.

**Input** None
**Example response `200`**
```json
{
  "id": "8f14e45f-ceea-467e-9d0b-1cae7cb6a4a3",
  "title": "Frontend Engineer",
  "description": "Build modern web apps with React, TypeScript, and accessible UI."
}
```
**Errors:** `NOT_FOUND` (404) if the user has no active roadmap or the referenced role is missing.

<a id="user-setavailability-mutation-protected"></a>
### `user.setAvailability` — mutation, protected
Sets weekly study availability (used by the upcoming calendar/scheduling feature to size study plans — not consumed by any calendar endpoints yet on this branch).

**Input**
```ts
{ availableDaysPerWeek: number /* 1–7 */; availableHoursPerDay: number /* 1–24 */; availableWeekdays?: number[] /* 0=Sun .. 6=Sat */ }
```
**Example request**
```json
{ "availableDaysPerWeek": 5, "availableHoursPerDay": 3, "availableWeekdays": [1, 3, 5] }
```
**Example response `200`**
```json
{
  "id": "usr_belal_123",
  "name": "Belal Hassan",
  "email": "belal@example.com",
  "emailVerified": true,
  "image": null,
  "roleId": "8f14e45f-ceea-467e-9d0b-1cae7cb6a4a3",
  "availableDaysPerWeek": 5,
  "availableHoursPerDay": 3,
  "availableWeekdays": [1, 3, 5],
  "timezone": "America/New_York",
  "preferredStartTime": "09:00:00",
  "createdAt": "2026-06-01T09:00:00.000Z",
  "updatedAt": "2026-07-08T10:00:00.000Z"
}
```
**Errors:** `NOT_FOUND` (404) if the session's user row is somehow missing.

---

<a id="5-cv-cv-upload-parsing"></a>
<a id="calendar"></a>
## `calendar` — calendar / study-sessions

### `calendar.generate` — mutation, protected
Generates a 14-day schedule for the signed-in user based on their active roadmap and availability.

**Input** None

**Example response `200`**
```json
{ "success": true, "count": 8, "events": [ { "event": { "id": "...", "userId": "usr_...", "roadmapNodeId": "...", "sessionIndex": 1, "totalSessionsForNode": 3, "date": "2026-07-09", "startTime": "18:00:00", "endTime": "20:00:00", "status": "scheduled", "createdAt": "...", "updatedAt": "..." }, "nodeTitle": "Intro to React", "nodeDescription": "Learn JSX and components" } ] }
```

### `calendar.getCalendar` — query, protected
Returns scheduled events for a date range or view.

**Input**
```ts
{ view?: "month" | "week"; from?: string; to?: string }
```

**Example response `200`**
```json
{
  "events": [
    { "event": { "id": "...", "userId": "usr_...", "roadmapNodeId": "...", "sessionIndex": 1, "totalSessionsForNode": 3, "date": "2026-07-09", "startTime": "18:00:00", "endTime": "20:00:00", "status": "scheduled", "createdAt": "...", "updatedAt": "..." }, "nodeTitle": "Intro to React", "nodeDescription": "Learn JSX and components" }
  ],
  "needsNewSchedule": false
}
```

### `calendar.getToday` — query, protected
No input. Same response shape as `calendar.getCalendar` but scoped to today's date.

### `calendar.updateEvent` — mutation, protected
Update an existing calendar event owned by the caller. Changing an event's status to `completed` or `skipped` may automatically complete the related roadmap node when all sessions are done.

**Input**
```ts
{ eventId: string /* uuid */, date?: string /* YYYY-MM-DD */, startTime?: string /* HH:MM:SS */, endTime?: string /* HH:MM:SS */, status?: "scheduled" | "completed" | "skipped" }
```

**Example response `200`**
```json
{ "success": true }
```

**Errors:** `NOT_FOUND` (404) if the event doesn't exist or isn't owned by the session user.

### `calendar.deleteEvent` — mutation, protected
**Input** `{ eventId: string /* uuid */ }` → **Response:** `{ "success": true }`. **Errors:** `NOT_FOUND`.

## 5. `cv` — CV upload & parsing

Upload is the **one REST endpoint** in the whole API — everything else in this module is tRPC.

<a id="post-cv-parse-rest-requires-session-cookie"></a>
### `POST /cv/parse` — REST, requires session cookie
Multipart form upload, field name **`file`**, PDF only, **max 5 MB**.

**Example request**
```
POST /cv/parse
Content-Type: multipart/form-data; boundary=...
Cookie: better-auth.session_token=...

------boundary
Content-Disposition: form-data; name="file"; filename="belal_cv.pdf"
Content-Type: application/pdf

<binary PDF bytes>
------boundary--
```

This is synchronous end-to-end (upload → Cloudinary → external parser call → DB write) — the request blocks until parsing finishes or fails, there's no polling/webhook on this branch. Set a generous client-side timeout on this call.

**Success response `200`** (`status: "completed"`)
```json
{
  "cvId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "completed",
  "skills": [
    { "skillName": "React", "strength": 40 },
    { "skillName": "Docker", "strength": 0 }
  ]
}
```
Note: `strength` here is a crude heuristic (40 if the parser reported any proficiency `level`, 0 if it didn't) — not the same `strengthScore` scale used by `skills.addUserSkill` elsewhere; treat it as a starting suggestion for the user to confirm/edit, not a final value.

**Parser reported failure — parser returned `failed` (HTTP `500`)**

```json
{ "errorMessage": "ai service error" }
```

Notes:
- If the external parser returns an invalid payload (schema mismatch) or the returned `cvId` does not match the generated ID, the server responds with HTTP `500` and body:

```json
{ "errorMessage": "Invalid payload from parser service" }
```

The server intentionally returns `500` for parser-side failures so the client can surface a retry/error flow; it does not forward the parser's internal error details to the client.
**Error responses**
| Status | Body | When |
|---|---|---|
| 401 | `{ "error": "Unauthorized" }` | no session |
| 400 | `{ "error": "No file uploaded" }` | missing `file` field |
| 400 | `{ "success": false, "message": "Invalid PDF file." }` | file doesn't start with `%PDF-` |
| 400 | `{ "success": false, "error": "..." }` | Multer error (e.g. file > 5MB, wrong field name) |
| 500 | `{ "errorMessage": "Invalid payload from parser service" }` | parser response failed validation |
| 500 | `{ "error": "Failed to upload CV" }` | Cloudinary/DB failure — already cleaned up server-side |

<a id="cv-getstatus-query-protected"></a>
### `cv.getStatus` — query, protected
**Input:** `{ cvId: string /* uuid */ }`
**Example response**
```json
{ "status": "completed", "errorMessage": null }
```
`status` is one of `"pending" | "parsing" | "completed" | "failed"`. **Errors:** `NOT_FOUND` if not the caller's CV.

<a id="cv-getlatestcv-query-protected"></a>
### `cv.getLatestCV` — query, protected
No input. Returns the most recently created CV row (metadata only, no parsed data).
**Example response**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fileUrl": "https://res.cloudinary.com/.../belal_cv.pdf",
  "fileName": "belal_cv.pdf",
  "mimeType": "application/pdf",
  "status": "completed",
  "createdAt": "2026-07-08T10:00:00.000Z",
  "updatedAt": "2026-07-08T10:00:05.000Z"
}
```
**Errors:** `NOT_FOUND` if the user has never uploaded a CV.

<a id="cv-getcv-query-protected"></a>
### `cv.getCV` — query, protected
**Input:** `{ cvId: string /* uuid */ }` — same shape as `getLatestCV`. **Errors:** `NOT_FOUND`.

<a id="cv-getallcvs-query-protected"></a>
### `cv.getAllCVs` — query, protected
No input. Returns an array of the same shape as `getLatestCV`, newest first. **Errors:** `NOT_FOUND` if the array would be empty (i.e. this throws instead of returning `[]` — handle accordingly).

<a id="cv-getparseddata-query-protected"></a>
### `cv.getParsedData` — query, protected
**Input:** `{ cvId: string /* uuid */ }`
**Example response**
```json
{
  "parsedData": {
    "fullName": "Belal Hassan",
    "email": "belal@example.com",
    "phone": null,
    "location": "Cairo, Egypt",
    "summary": "Full-stack developer...",
    "skills": {
      "technical": [{ "name": "React", "level": "intermediate" }],
      "nonTechnical": [{ "name": "Leadership", "level": null }]
    },
    "experience": [
      { "company": "Acme", "title": "Backend Dev", "startDate": "2024-01", "endDate": null, "description": "..." }
    ],
    "projects": [
      { "name": "CareerGPS", "description": "...", "technologies": ["TypeScript"], "url": null, "startDate": null, "endDate": null }
    ],
    "education": [
      { "institution": "Cairo University", "degree": "BSc", "field": "CS", "major": null, "startDate": "2020", "endDate": "2024" }
    ],
    "certifications": [],
    "languages": ["Arabic", "English"],
    "links": { "github": "https://github.com/...", "linkedin": null, "portfolio": null }
  }
}
```
**Errors:** `NOT_FOUND` (no such CV), `FORBIDDEN` (not yours), `PRECONDITION_FAILED` (status isn't `"completed"` yet — poll `getStatus` first).

<a id="cv-deletecv-mutation-protected"></a>
### `cv.deleteCV` — mutation, protected
**Input:** `{ cvId: string /* uuid */ }` → **Response:** `{ "success": true }`
**Errors:** `NOT_FOUND`, `FORBIDDEN`, `INTERNAL_SERVER_ERROR` (storage or DB deletion failed).

---

<a id="6-github-github-sync-manual-projects"></a>
## 6. `github` — GitHub sync & manual projects

<a id="github-syncprojects-mutation-protected"></a>
### `github.syncProjects` — mutation, protected
Pulls the user's GitHub repos/contributions, infers skills, upserts `projects` + `github_stats`. Can be slow (multiple GitHub API calls) — show a loading state.

**Input**
```json
{ "username": "belalhassan" }
```
**Example response `200`**
```json
{
  "repoCount": 14,
  "activityScore": 62.5,
  "skills": [
    { "skillName": "typescript", "strength": 78 },
    { "skillName": "react", "strength": 65 }
  ]
}
```
**Errors:** `BAD_REQUEST` if the session's user row doesn't exist (shouldn't happen in practice).

<a id="github-getstats-query-protected"></a>
### `github.getStats` — query, protected
No input.
```json
{
  "userId": "usr_belal_123",
  "username": "belalhassan",
  "reposCount": 14,
  "totalStars": 37,
  "activityScore": "62.5",
  "lastSynced": "2026-07-08T10:00:00.000Z"
}
```
Returns `null` (not an error) if the user has never synced.

<a id="github-getprojects-query-protected"></a>
### `github.getProjects` — query, protected
No input. Array, ordered by `complexityScore` descending.
```json
[
  {
    "id": "b1f2...", "userId": "usr_belal_123", "title": "career-gps",
    "description": "", "source": "github", "complexityScore": 24.5,
    "createdAt": "2026-06-01T09:00:00.000Z"
  }
]
```
`source` is `"github" | "manual"`.

<a id="github-addmanualproject-mutation-protected"></a>
### `github.addManualProject` — mutation, protected
Upsert on `(userId, title)`.
**Input**
```ts
{ title: string; description?: string; complexityLevel: "simple" | "moderate" | "complex" }
```
`complexityLevel` maps server-side to a fixed `complexityScore`: simple→5, moderate→15, complex→30.
**Example request**
```json
{ "title": "Portfolio site", "description": "Personal site built with Astro", "complexityLevel": "simple" }
```
**Response:** the created/updated project row (same shape as `getProjects` items, returned as an array from `.returning()` — take `[0]` if you only expect one).

<a id="github-updateproject-mutation-protected"></a>
### `github.updateProject` — mutation, protected
**Input:** `{ projectId: string /* uuid */; title?: string; description?: string; complexityLevel?: "simple"|"moderate"|"complex" }`
**Response:** updated project row. **Errors:** `NOT_FOUND` if not owned by caller.

<a id="github-deleteproject-mutation-protected"></a>
### `github.deleteProject` — mutation, protected
**Input:** `{ projectId: string /* uuid */ }` → `{ "success": true }`. **Errors:** `NOT_FOUND`.

<a id="github-addprojectskill-github-removeprojectskill-mutation-protected"></a>
### `github.addProjectSkill` / `github.removeProjectSkill` — mutation, protected
**Input:** `{ projectId: string /* uuid */; skillId: string /* uuid */ }`
- add → `{ "success": true, "inserted": true }` (`inserted: false` if it already existed — conflict silently ignored)
- remove → `{ "success": true }`
**Errors:** `NOT_FOUND` if the project isn't the caller's.

<a id="github-getprojectskills-query-protected"></a>
### `github.getProjectSkills` — query, protected
**Input:** `{ projectId: string /* uuid */ }`
```json
[
  { "projectId": "b1f2...", "skillId": "8a2c...", "skill": { "id": "8a2c...", "name": "React", "hasNoDependencies": true, "normalizedName": "react" } }
]
```
**Errors:** `NOT_FOUND` if the project isn't the caller's.

---

<a id="7-skills-canonical-skill-registry-user-skill-strengths"></a>
## 7. `skills` — canonical skill registry & user skill strengths

<a id="skills-create-mutation-protected"></a>
### `skills.create` — mutation, protected
Admin/seeding-style batch skill creation with dependency graph + cycle detection. Array in, array out.
**Input**
```ts
Array<{ name: string; hasNoDependencies: boolean; dependencyIds?: string[] }>
```
Rule enforced server-side: `hasNoDependencies: true` ⇒ `dependencyIds` must be empty; `false` ⇒ at least one dependency required. `dependencyIds` entries can be either real skill UUIDs **or** free-text names — the server fuzzy-matches text against existing skills (pg_trgm) and errors if nothing matches closely enough.
**Example request**
```json
[
  { "name": "Redux Toolkit", "hasNoDependencies": false, "dependencyIds": ["React"] }
]
```
**Example response `200`**
```json
[
  { "id": "c9a1...", "name": "Redux Toolkit", "hasNoDependencies": false, "normalizedName": "reduxtoolkit" }
]
```
**Errors:** `BAD_REQUEST` — self-dependency, circular dependency, unmatched dependency name, or the `hasNoDependencies`/`dependencyIds` mismatch above.

<a id="skills-adduserskill-mutation-protected"></a>
### `skills.addUserSkill` — mutation, protected
Upsert on `(userId, skillId)`.
**Input:** `{ skillId: string /* uuid */; strengthScore: number }` — server clamps to `0–100`.
**Example response**
```json
{ "userId": "usr_belal_123", "skillId": "8a2c...", "skillName": "React", "strengthScore": 75 }
```
**Errors:** `BAD_REQUEST` if user or skill row not found.

<a id="skills-updateuserskill-mutation-protected"></a>
### `skills.updateUserSkill` — mutation, protected
Same input/output shape as `addUserSkill` but errors `BAD_REQUEST` if the `(userId, skillId)` pair doesn't already exist (use `addUserSkill` for first-time set).

<a id="skills-getuserskills-query-protected"></a>
### `skills.getUserSkills` — query, protected
No input.
```json
[
  { "userId": "usr_belal_123", "skillId": "8a2c...", "skillName": "React", "strengthScore": 75 }
]
```

<a id="skills-getallskills-query-protected"></a>
### `skills.getAllSkills` — query, protected
No input. Full registry, alphabetical.
```json
[{ "id": "8a2c...", "name": "React", "hasNoDependencies": true, "normalizedName": "react" }]
```

<a id="skills-addmanualskill-mutation-protected"></a>
### `skills.addManualSkill` — mutation, protected
Bulk add by free-text name (fuzzy-matched server-side against the registry — this is the endpoint the "add a skill I know" UI should call, not `skills.create`, which is for admin/curriculum-authoring flows).
**Input**
```ts
Array<{ skillName: string; level: "beginner" | "intermediate" | "expert" | null }>
```
**Example request**
```json
[{ "skillName": "Docker", "level": "beginner" }, { "skillName": "Kubernetess", "level": null }]
```
Each name is fuzzy-matched (pg_trgm) against the registry; on a match the skill is upserted onto the user with a strength derived from `level` (`beginner`→30, `intermediate`→60, `expert`→90 — kept only if higher than the user's existing strength for that skill).

**Example response**
```json
{
  "added": [
    { "skillId": "d4e5...", "skillName": "Docker", "level": "beginner", "strengthScore": 30 }
  ],
  "missing": [
    { "skillName": "Kubernetess", "message": "Skill \"Kubernetess\" not found in our database." }
  ]
}
```

<a id="skills-searchskill-query-protected"></a>
### `skills.searchSkill` — query, protected
Typeahead search, min 2 chars.
**Input:** `{ skillWords: string }`
**Example response**
```json
[{ "name": "React", "id": "8a2c..." }, { "name": "React Native", "id": "9b3d..." }]
```
Returns at most 10 matches, best match first.

---

<a id="8-curriculum-per-skill-learning-steps-skill-curriculum-nodes"></a>
## 8. `curriculum` — per-skill learning steps (`skill_curriculum_nodes`)

These are the **shared, pre-seeded** curriculum steps for a skill — not a specific user's roadmap (that's `roadmap.*`, §10). This module is mostly content-authoring; likely admin-facing rather than end-user-facing.

<a id="curriculum-addcurriculumnodesforskill-mutation-protected"></a>
### `curriculum.addCurriculumNodesForSkill` — mutation, protected
Bulk upsert, keyed on `(skillId, orderIndex)` — re-running with the same `orderIndex` overwrites `title`/`description`.
**Input**
```ts
Array<{ skillId: string /* uuid */; nodes: Array<{ orderIndex: number; title: string; description: string }> }>
```
**Example response**
```json
{
  "inserted": [
    { "id": "n1...", "skillId": "8a2c...", "orderIndex": 0, "title": "React fundamentals", "description": "JSX, components, props" }
  ],
  "failed": [{ "skillId": "bad-id", "reason": "Skill not found" }]
}
```

<a id="curriculum-updatecurriculumnodesforskill-mutation-protected"></a>
### `curriculum.updateCurriculumNodesForSkill` — mutation, protected
Same shape as above but single-skill, and throws instead of soft-failing.
**Input:** `{ skillId: string /* uuid */; nodes: Array<{ orderIndex: number; title: string; description: string }> }`
**Response:** array of upserted nodes. **Errors:** `BAD_REQUEST` if skill not found.

<a id="curriculum-getcurriculumnodes-query-protected"></a>
### `curriculum.getCurriculumNodes` — query, protected
**Input:** `{ skillId: string /* uuid */ }`
```json
[
  {
    "id": "n1...", "skillId": "8a2c...", "orderIndex": 0,
    "title": "React fundamentals", "description": "JSX, components, props",
    "resources": [
      { "id": "r1...", "curriculumNodeId": "n1...", "title": "React docs", "type": "article", "url": "https://react.dev", "displayOrder": 0 }
    ]
  }
]
```
**Errors:** `NOT_FOUND` if the skill has no curriculum yet.

<a id="curriculum-updatecurriculumnode-mutation-protected"></a>
### `curriculum.updateCurriculumNode` — mutation, protected
Partial update by node id.
**Input:** `{ id: string /* uuid */; orderIndex?: number; title?: string; description?: string }` → returns the updated node. **Errors:** `NOT_FOUND`.

<a id="curriculum-deletecurriculumnode-mutation-protected"></a>
### `curriculum.deleteCurriculumNode` — mutation, protected
**Input:** `{ id: string /* uuid */ }` → `{ "success": true }`. **Errors:** `NOT_FOUND`.

---

<a id="9-resources-links-attached-to-a-curriculum-node"></a>
## 9. `Resources` — links attached to a curriculum node

Note the capital `R` — the router is registered as `Resources` (not `resources`) in `appRouter`, so on the client it's `trpc.Resources.*`.

<a id="resources-addresourcesforcurriculumnodes-mutation-protected"></a>
### `Resources.addResourcesForCurriculumNodes` — mutation, protected
Bulk **replace** (deletes existing resources for the node, then inserts the new set) — not a merge.
**Input**
```ts
Array<{ curriculumNodeId: string /* uuid */; resources: Array<{ title: string; type: string; url: string; displayOrder: number }> }>
```
**Example request**
```json
[
  {
    "curriculumNodeId": "n1...",
    "resources": [
      { "title": "React docs", "type": "article", "url": "https://react.dev", "displayOrder": 0 },
      { "title": "React crash course (AR)", "type": "youtube_ar", "url": "https://youtube.com/watch?v=...", "displayOrder": 1 }
    ]
  }
]
```
**Response:** `{ inserted: [...resource rows], failed: [{ curriculumNodeId, reason }] }`. `type` is a free-text string, not a DB enum — whatever values the frontend/curriculum team standardizes on (e.g. `article`, `youtube_en`, `youtube_ar`, `quiz`) need to be agreed by convention.

<a id="resources-updateresourcesforcurriculumnode-mutation-protected"></a>
### `Resources.updateResourcesForCurriculumNode` — mutation, protected
Single-node upsert keyed on `(curriculumNodeId, url)`.
**Input:** `{ curriculumNodeId: string /* uuid */; resources: Array<{ title: string; type: string; url: string; displayOrder: number }> }` → array of upserted rows. **Errors:** `BAD_REQUEST` if node not found.

<a id="resources-getcurriculumnoderesource-query-protected"></a>
### `Resources.getCurriculumNodeResource` — query, protected
**Input:** `{ id: string /* uuid */ }` → single resource row. **Errors:** `NOT_FOUND`.

<a id="resources-updatecurriculumnoderesource-mutation-protected"></a>
### `Resources.updateCurriculumNodeResource` — mutation, protected
Partial update by resource id. **Input:** `{ id: string /* uuid */; title?; type?; url?; displayOrder? }` → updated row. **Errors:** `NOT_FOUND`.

<a id="resources-deletecurriculumnoderesource-mutation-protected"></a>
### `Resources.deleteCurriculumNodeResource` — mutation, protected
**Input:** `{ id: string /* uuid */ }` → `{ "success": true }`. **Errors:** `NOT_FOUND`.

---

<a id="10-roles-target-job-roles-their-required-skills"></a>
## 10. `roles` — target job roles & their required skills

<a id="roles-create-mutation-protected"></a>
### `roles.create` — mutation, protected
Upsert on `title`.
**Input:** `{ title: string; description?: string }` → created/updated role row `{ id, title, description }`.

<a id="roles-addskills-mutation-protected"></a>
### `roles.addSkills` — mutation, protected
**Input**
```ts
{ roleId: string /* uuid */; skills: Array<{ skillId: string /* uuid */; isCore?: boolean /* default false */ }> }
```
**Response:** array of `role_skills` rows `{ roleId, skillId, isCore }`. **Errors:** `BAD_REQUEST` if role or any skill id doesn't exist.

<a id="roles-getallroles-query-protected"></a>
### `roles.getAllRoles` — query, protected
**Input:** `{ includeScore: boolean }` — this is **required**, not optional.
- `includeScore: false` → plain role list, alphabetical:
```json
[{ "id": "8f14...", "title": "Frontend Developer", "description": "..." }]
```
- `includeScore: true` → same rows plus a computed `score` per role for the **caller**, computed by re-running the full readiness evaluation for every role (can be slow with many roles — this recomputes and writes a new `readiness_reports` row per role as a side effect):
```json
[{ "id": "8f14...", "title": "Frontend Developer", "description": "...", "score": 62.3 }]
```

<a id="roles-setuserrole-mutation-protected"></a>
### `roles.setUserRole` — mutation, protected
Sets the caller's target/current role.
**Input:** `{ roleId: string /* uuid */ }` → the updated `user` row (same shape as §4). **Errors:** `INTERNAL_SERVER_ERROR` on failure (not `NOT_FOUND` for a bad `roleId` — a nonexistent `roleId` isn't FK-validated here before the update, worth confirming with backend if you need a friendlier error for a typo'd id).

<a id="roles-getrolebyid-query-protected"></a>
### `roles.getRoleById` — query, protected
**Input:** `{ roleId: string /* uuid */ }`
```json
{
  "id": "8f14...", "title": "Frontend Developer", "description": "...",
  "skills": [
    { "isCore": true, "skill": { "id": "8a2c...", "name": "React", "hasNoDependencies": true, "normalizedName": "react" } }
  ]
}
```
**Errors:** `NOT_FOUND`.

---

<a id="11-roadmap-a-specific-user-s-personalized-learning-path"></a>
## 11. `roadmap` — a specific user's personalized learning path

<a id="roadmap-generate-mutation-protected"></a>
### `roadmap.generate` — mutation, protected
Generates (or regenerates — replaces the active roadmap for that role) the user's roadmap from their current skill gaps for a role. **Takes `roleId`, not `roleName`** — contrast with `readiness.generate` below, which takes `roleName`. Internally this also re-runs the readiness evaluation first, so calling this is enough on its own (no need to call `readiness.generate` first).

**Input**
```json
{ "roleId": "8f14e45f-ceea-467e-9d0b-1cae7cb6a4a3" }
```
**Success response `200`**
```json
{
  "roadmapId": "r1a2...",
  "totalNodes": 12,
  "nodes": [
    {
      "orderIndex": 0,
      "nodeId": "rn1...",
      "status": "inProgress",
      "curriculumTitle": "React fundamentals",
      "skillName": "React",
      "priority": "high",
      "completedAt": null
    }
  ],
  "skillsMissingCurriculum": ["Some Skill With No Curriculum Yet"]
}
```
`status` is "pending" | "inProgress" | "completed" — the first node is auto-set to "inProgress", the rest start "pending". `priority` is "high" | "medium".

**Response note:** each node currently includes only runtime roadmap metadata; it does not include `curriculumDescription` or `resources`. If the client needs the learning content for a specific node, call `roadmap.getNodeInfo`.

`skillsMissingCurriculum` lists gap skills that have no `skill_curriculum_nodes` yet, so no roadmap nodes could be generated for them — worth surfacing as a banner ("some skills don't have learning content yet").

**"Already ready" response `200`** (no `roadmapId` field at all — check for its presence rather than checking `status`)
```json
{ "message": "No skill gaps found. You're ready." }
```

<a id="roadmap-completenode-mutation-protected"></a>
### `roadmap.completeNode` — mutation, protected
Marks a node complete, auto-advances the next `pending` node in that roadmap to `inProgress`, bumps the user's strength for that skill, and (if that was the skill's last node) triggers a readiness re-evaluation.

**Input:** `{ nodeId: string /* uuid */ }`
**Example response**
```json
{
  "nodeId": "rn1...",
  "status": "completed",
  "skillId": "8a2c...",
  "skillFullyCompleted": false,
  "previousStrength": 20,
  "newStrength": 45
}
```
If the node was already completed: `{ "alreadyCompleted": true }` (different shape — check for this key first).
**Errors:** `NOT_FOUND` (node doesn't belong to caller), `BAD_REQUEST` ("You must complete earlier nodes in this skill first." — nodes within a skill are locked to sequential completion).

<a id="roadmap-getactiveroadmap-query-protected"></a>
### `roadmap.getActiveRoadmap` — query, protected
**Input:** `{ roleId: string /* uuid */ }`
```json
{
  "roadmapId": "r1a2...",
  "totalNodes": 12,
  "nodes": [
    {
      "orderIndex": 0, "nodeId": "rn1...", "status": "inProgress",
      "curriculumTitle": "React fundamentals", "skillName": "React",
      "priority": "high", "completedAt": null
    }
  ]
}
```
**Errors:** `NOT_FOUND` if the user has no active roadmap for that role (call `roadmap.generate` first).

<a id="roadmap-getuserroadmaps-query-protected"></a>
### `roadmap.getUserRoadmaps` — query, protected
No input. All roadmaps (active + inactive/history) for the caller, each with full nested nodes → curriculumNode → skill. Heavier payload than `getActiveRoadmap`; use for a "roadmap history" screen, not the main dashboard.

<a id="roadmap-deleteuserroadmap-mutation-protected"></a>
### `roadmap.deleteUserRoadmap` — mutation, protected
**Input:** `{ roadmapId: string /* uuid */ }` → `{ "success": true }`. **Errors:** `NOT_FOUND`.

<a id="roadmap-getnodeinfo-query-protected"></a>
### `roadmap.getNodeInfo` — query, protected
Given a roadmap node, fetch its underlying curriculum node + resources (i.e. the actual learning content for that step).
**Input:** `{ nodeId: string /* uuid */ }`
```json
{
  "id": "n1...", "skillId": "8a2c...", "orderIndex": 0,
  "title": "React fundamentals", "description": "JSX, components, props",
  "resources": [
    { "id": "res1...", "curriculumNodeId": "n1...", "title": "React docs", "type": "article", "url": "https://react.dev", "displayOrder": 0 }
  ]
}
```
**Errors:** `NOT_FOUND` if the node doesn't exist.

---

<a id="12-readiness-role-fit-scoring-leaderboards"></a>
## 12. `readiness` — role-fit scoring & leaderboards

<a id="readiness-generate-mutation-protected"></a>
### `readiness.generate` — mutation, protected
Computes (and persists a new `readiness_reports` + `skill_gap_results` row for) the caller's fit for a role. **Takes `roleName` (free text, case/space-insensitive match), not `roleId`** — the one asymmetric input in the whole API, flag it in the frontend layer (e.g. wrap both calls behind one client-side helper that takes a role object and dispatches the right field).

**Input**
```json
{ "roleName": "Frontend Developer" }
```
**Example response `200`**
```json
{
  "skillMatchScore": 68.4,
  "projectScore": 41.2,
  "generalGithubScore": 55.0,
  "roleGithubScore": 48.9,
  "bonusScore": 3.5,
  "totalScore": 58.1,
  "finalScore": 61.6,
  "missingSkills": ["TypeScript"],
  "weakSkills": ["Testing"],
  "bonusSkillsDetected": ["GraphQL"]
}
```
Note: if there's any missing **core** skill, `finalScore` is server-side capped at **49** regardless of the weighted math — worth mirroring that rule client-side if you ever preview a score before submitting. **Errors:** `BAD_REQUEST` if `roleName` doesn't match any role.

<a id="readiness-getlatestreport-query-protected"></a>
### `readiness.getLatestReport` — query, protected
**Input:** `{ roleId: string }` (not validated as uuid format server-side, just `string` — pass the role's `id` field regardless)
```json
{
  "report": {
    "id": "rep1...", "userId": "usr_belal_123", "roleId": "8f14...",
    "skillMatchScore": "68.4", "generalGithubScore": "55.0",
    "overallReadinessScore": "61.6", "feedback": "Calculated automatically.",
    "createdAt": "2026-07-08T10:00:00.000Z"
  },
  "gaps": {
    "id": "gap1...", "userId": "usr_belal_123", "roleId": "8f14...",
    "missingSkills": { "missing": ["TypeScript"], "weak": ["Testing"] },
    "matchScore": "68.4", "createdAt": "2026-07-08T10:00:00.000Z"
  }
}
```
Numeric score fields come back as **strings** (Postgres `numeric` type) — cast with `Number(...)` before doing math or charting. Both `report` and `gaps` can independently be `null` if none exist yet (no error thrown).

<a id="readiness-getuserreportshistory-query-protected"></a>
### `readiness.getUserReportsHistory` — query, protected
**Input:** `{ roleId: string }` → array of report rows (same shape as `report` above), newest first. Empty array if none, no error.

<a id="readiness-getgloballeaderboard-query-protected"></a>
### `readiness.getGlobalLeaderboard` — query, protected
**Input:** `{ limit?: number /* default 10 */ }`
```json
[
  {
    "userId": "usr_x", "name": "Sara", "image": null,
    "roleId": "8f14...", "finalScore": 82.1, "activityScore": 70,
    "tier": "Diamond"
  }
]
```
`tier` is `"Bronze" | "Silver" | "Gold" | "Diamond" | "Master"`, computed as `finalScore*0.7 + activityScore*0.3` against fixed thresholds (90/75/55/35). One row per user (their best/most recent report across all roles), sorted by score.

<a id="readiness-getroleleaderboard-query-protected"></a>
### `readiness.getRoleLeaderboard` — query, protected
**Input:** `{ roleId: string /* uuid */; limit?: number /* default 10 */ }` → same shape as global leaderboard, scoped to that role.

---

<a id="appendix-a-enum-reference"></a>
## Appendix A — Enum reference

| Field | Values |
|---|---|
| `cv.status` | `pending` \| `parsing` \| `completed` \| `failed` |
| `roadmapNode.status` | `pending` \| `inProgress` \| `completed` |
| `roadmapNode.priority` | `high` \| `medium` |
| `project.source` | `github` \| `manual` |
| `project.complexityLevel` (input only, not stored) | `simple` (→score 5) \| `moderate` (→15) \| `complex` (→30) |
| `skill.level` (CV/manual-add input) | `beginner` \| `intermediate` \| `expert` \| `null` |
| leaderboard `tier` | `Bronze` \| `Silver` \| `Gold` \| `Diamond` \| `Master` |

<a id="appendix-b-things-worth-confirming-with-backend-before-building-against-this"></a>
## Appendix B — Things worth confirming with backend before building against this

1. **`roadmap.generate` takes `roleId`; `readiness.generate` takes `roleName`.** Real inconsistency in the current code, not a typo in this doc — decide whether the frontend hides it behind one helper or backend aligns the two.
2. **`roles.setUserRole`** doesn't validate that `roleId` exists before writing, so a bad id fails with a generic 500 rather than 404/400.
3. **`skills.addManualSkill`**'s `added`/`missing` item shape is inferred from a service function outside this route file — get the exact field names confirmed if the UI needs more than `skillName`.
4. **CV upload strengths** (`0` or `40` heuristic) are on a different scale than the `0–100` `strengthScore` used everywhere else in the skills system — decide in UI whether/how these get reconciled when a user both uploads a CV and manually sets skill strength.
5. Calendar endpoints are implemented on this branch — see the `calendar` section above.
