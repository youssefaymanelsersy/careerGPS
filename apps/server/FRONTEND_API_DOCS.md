# Backend API Documentation for Frontend Team

This document outlines the tRPC and REST endpoints available in the backend for the Next.js frontend to consume. 

## Base URL
- **Local Development**: `http://localhost:3000`
- **tRPC Route Prefix**: `/api/trpc`
- **REST Route Prefix**: `/api`

---

## 1. Authentication (Better Auth)
Authentication is handled by **Better Auth**. The Next.js frontend should use the Better Auth client SDK to manage sessions.

- **`POST /api/auth/sign-in`**
- **`POST /api/auth/sign-out`**
- **`GET /api/auth/session`**

---

## 2. tRPC Endpoints

Our backend exposes a type-safe tRPC router which should be consumed using the `@trpc/client` or `@trpc/react-query` bindings in the frontend.

### A. Skills (`trpc.skills`)
Handles querying available skills and user proficiencies.

- **`skills.getAllSkills`**
  - **Type**: `query`
  - **Description**: Returns a complete list of all skills defined in the database, ordered alphabetically.
  - **Returns**: `Array<{ id, name, hasNoDependencies, createdAt }>`

### B. Roles (`trpc.roles`)
Handles querying available job roles and the skills required for them.

- **`roles.getAllRoles`**
  - **Type**: `query`
  - **Description**: Returns a list of all available job roles (e.g., "Full Stack Developer", "Backend Engineer").
  - **Returns**: `Array<{ id, title, description }>`

- **`roles.getRoleSkills`**
  - **Type**: `query`
  - **Input**: `{ roleId: string }`
  - **Description**: Returns all required skills for a specific role.

### C. GitHub Integration (`trpc.github`)
Handles connecting the user's GitHub account and inferring skills from their repositories.

- **`github.syncProjects`**
  - **Type**: `mutation`
  - **Description**: Triggers a synchronization of the user's GitHub repositories, commits, and dependencies. Automatically infers missing skills and updates their strength scores.
  
- **`github.addManualProject`**
  - **Type**: `mutation`
  - **Input**: `{ title, description, skillsUsed: string[], repoUrl?: string }`
  - **Description**: Allows the user to manually submit a private or enterprise project to get credit for skills that cannot be inferred from public GitHub repositories.

### D. Readiness Gamification (`trpc.readiness`)
Handles evaluating the user's progress against a specific role.

- **`readiness.evaluateRole`**
  - **Type**: `mutation`
  - **Input**: `{ roleId: string }`
  - **Description**: Calculates the user's readiness score (0-100) for a specific role based on their skills, projects, and GitHub activity. Generates a new `skillGapResult`.
  - **Returns**: `{ finalScore, skillMatchScore, projectScore, missingSkills, weakSkills }`

- **`readiness.getLatestReport`**
  - **Type**: `query`
  - **Input**: `{ roleId: string }`
  - **Description**: Retrieves the user's most recent readiness report for a specific role.

- **`readiness.getLeaderboard`**
  - **Type**: `query`
  - **Input**: `{ roleId?: string, limit?: number }`
  - **Description**: Returns the top developers ranked by their readiness score and activity score.

### E. Guidance & Roadmaps (`trpc.roadmap`)
Handles generating and progressing through the AI-generated learning syllabus.

- **`roadmap.generateLearningRoadmap`**
  - **Type**: `mutation`
  - **Input**: `{ roleId: string }`
  - **Description**: Analyzes the user's `skillGapResult` and generates a high-level learning syllabus (roadmap). If an active roadmap already exists for the role, it returns the existing one.
  - **Returns**: `{ roadmapId, totalSteps, steps: Array<{ step, skill, priority }> }`

- **`roadmap.generateSkillInternalRoadmap`**
  - **Type**: `mutation`
  - **Input**: `{ stepId: string, durationDays?: number, dailyMinutes?: number }`
  - **Description**: Uses the HuggingFace API to break down a high-level step (e.g. "TypeScript") into a detailed daily plan. The backend caches results globally so that any two users with the same skill, proficiency level, and requested duration/minutes get the exact same roadmap instantly without triggering redundant LLM generation!
  - **Returns**: `{ goal, duration_days, milestones, first_week_plan }`

- **`roadmap.completeStep`**
  - **Type**: `mutation`
  - **Input**: `{ roadmapId: string, stepId: string }`
  - **Description**: Marks a specific step in the roadmap as completed. **Instantly boosts the user's skill strength** in the database and re-evaluates their readiness score in real-time.

### F. Resumes / CV (`trpc.cv`)
Handles CV parsing and AI evaluation.

- **`cv.upload`**
  - **Type**: `mutation`
  - **Input**: `{ fileBase64: string, roleId: string }`
  - **Description**: Uploads a PDF or DOCX file to Cloudinary, sends it to the AI Agent Team for parsing, and saves the extracted skills and projects to the user's profile.

---

## Example Usage (Frontend)

```tsx
import { trpc } from "@/utils/trpc";

export function RoadmapWidget({ roleId }) {
    // 1. Fetch the Roadmap
    const { data: roadmap } = trpc.roadmap.generateLearningRoadmap.useQuery({ roleId });
    
    // 2. Complete a Step
    const completeStep = trpc.roadmap.completeStep.useMutation({
        onSuccess: () => {
            // Refetch the leaderboard or readiness score instantly!
            utils.readiness.getLatestReport.invalidate();
        }
    });

    return (
        <button onClick={() => completeStep.mutate({ roadmapId: roadmap.id, stepId: "123" })}>
            Complete Step
        </button>
    );
}
```
