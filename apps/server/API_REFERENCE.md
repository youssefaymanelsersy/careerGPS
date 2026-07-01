# Backend API Reference

This document serves as the single source of truth for the frontend team to understand all available backend endpoints, what they do, and how to consume them. 

> **Important**: Whenever a new endpoint is added or modified in the backend, this file must be updated accordingly.

---

## 1. Auth Module (`trpc.auth`)
Handles core user creation after OAuth/Session initialization.

- **`createUser`** (Mutation)
  - **Inputs:** `id` (string), `name` (string), `email` (string)
  - **Description:** Inserts or updates a user in the database. Called automatically on initial login.

---

## 2. GitHub Module (`trpc.github`)
Handles syncing and fetching GitHub profile data and projects.

- **`sync`** (Mutation)
  - **Inputs:** `userId` (string), `username` (string)
  - **Description:** Triggers the massive backend pipeline to fetch a user's GitHub activity, languages, and dependencies. It mathematically infers skills and merges them into the `userSkills` table.
- **`getStats`** (Query)
  - **Inputs:** `userId` (string)
  - **Description:** Returns the user's total stars, repository count, and calculated `activityScore`.
- **`getProjects`** (Query)
  - **Inputs:** `userId` (string)
  - **Description:** Returns all projects (GitHub inferred and manual) for a user, sorted dynamically by their `complexityScore`.
- **`addManualProject`** (Mutation)
  - **Inputs:** `userId` (string), `title` (string), `description` (optional string), `complexityLevel` ("simple" | "moderate" | "complex")
  - **Description:** Allows a user to manually submit private/enterprise work to gain project complexity points.

---

## 3. Readiness Module (`trpc.readiness`)
Handles Readiness Scores, Skill Gaps, and Gamification Leaderboards.

- **`generate`** (Mutation)
  - **Inputs:** `userId` (string), `roleName` (string)
  - **Description:** Evaluates a user against a target role, calculating their `finalScore`, applying core skill penalties, and generating a missing skills gap report.
- **`getLatestReport`** (Query)
  - **Inputs:** `userId` (string), `roleId` (string)
  - **Description:** Fetches the single most recent Readiness Report and Skill Gap Result for a user (perfect for loading the dashboard without generating a new score).
- **`getGlobalLeaderboard`** (Query)
  - **Inputs:** `limit` (number, default: 10)
  - **Description:** Returns the top developers across the entire platform, complete with their `activityScore` and calculated Gamification `tier` (Bronze -> Master).
- **`getRoleLeaderboard`** (Query)
  - **Inputs:** `roleId` (string), `limit` (number, default: 10)
  - **Description:** Returns the top developers filtered to a specific role.

---

## 4. Roadmap Module (`trpc.roadmap`)
Handles generating, tracking, and completing AI-driven learning syllabuses.

- **`generate`** (Mutation)
  - **Inputs:** `userId` (string), `roleName` (string)
  - **Description:** Calculates the topological order of missing skills and generates a roadmap. If an active roadmap already exists, it safely returns it without wiping their progress.
- **`getActiveRoadmap`** (Query)
  - **Inputs:** `userId` (string), `roleId` (string)
  - **Description:** Fetches the user's currently active roadmap and all associated steps.
- **`completeStep`** (Mutation)
  - **Inputs:** `userId` (string), `stepId` (string)
  - **Description:** Marks a roadmap step as completed and instantly triggers a background Readiness Evaluation so their dashboard score climbs in real-time.
- **`aiPlan`** (Mutation)
  - **Inputs:** `skillName` (string), `currentStrength` (number), `daysAvailable` (optional), `minutesPerDay` (optional)
  - **Description:** Calls the AI Team's endpoint (or internal logic) to generate a day-by-day customized learning syllabus for a specific skill.

---

## 5. Roles Module (`trpc.roles`)
Handles managing the database of job roles.

- **`getAllRoles`** (Query)
  - **Description:** Returns a list of all roles in the database. Use this to populate the primary "Select Your Role" dropdown!
- **`getRoleById`** (Query)
  - **Inputs:** `roleId` (string)
  - **Description:** Returns a specific role including deep relational data mapping its associated core and bonus skills.
- **`create`** & **`addSkill`** (Mutations)
  - **Description:** Admin endpoints to seed the database with new roles and attach skill dependencies to them.

---

## 6. Skills Module (`trpc.skills`)
Handles managing the global skill dictionary and individual user strengths.

- **`getAllSkills`** (Query)
  - **Description:** Returns the entire dictionary of platform skills. Perfect for populating a search autocomplete field.
- **`addManualSkill`** (Mutation)
  - **Inputs:** `userId` (string), `skillName` (string), `level` ("beginner" | "intermediate" | "expert")
  - **Description:** Allows users to self-report a skill. The backend will safely merge it, taking the highest score between their manual input and their mathematically inferred GitHub strength.
- **`getUserSkills`** (Query)
  - **Inputs:** `userId` (string)
  - **Description:** Fetches every single skill and raw `strengthScore` attached to a specific user.

---

## 7. CV Parsing Module
Managed by the CV Team.

- **`POST /api/cv/parse`** (Express RESTful Route)
  - **Description:** Uploads a CV file (multipart/form-data) to Cloudinary and triggers an async background parse task.
- **`trpc.cv.getStatus`** (Query)
  - **Inputs:** `cvId` (string)
  - **Description:** Polls the database to check if the CV has finished parsing and returns the structured JSON data.
