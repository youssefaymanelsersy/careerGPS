export type SkillLevel = "beginner" | "intermediate" | "expert";

export const SKILL_LEVELS: SkillLevel[] = ["beginner", "intermediate", "expert"];

export interface SyncedSkill {
  skillName: string;
  strength: number;
}

export interface OnboardingSkill {
  skillName: string;
  level: SkillLevel;
}

const LEVEL_TO_STRENGTH: Record<SkillLevel, number> = {
  beginner: 25,
  intermediate: 50,
  expert: 75,
};

export function levelToStrength(level: SkillLevel): number {
  return LEVEL_TO_STRENGTH[level];
}

export function strengthToLevel(strength: number): SkillLevel {
  if (strength < 30) return "beginner";
  if (strength < 60) return "intermediate";
  return "expert";
}

export function mergeAndDedupeSkills(
  githubSkills: SyncedSkill[],
  cvSkills: SyncedSkill[],
): SyncedSkill[] {
  const map = new Map<string, number>();

  for (const s of githubSkills) {
    map.set(s.skillName.toLowerCase(), s.strength);
  }

  for (const s of cvSkills) {
    const key = s.skillName.toLowerCase();
    const existing = map.get(key);
    if (existing === undefined || s.strength > existing) {
      map.set(key, s.strength);
    }
  }

  return Array.from(map.entries()).map(([skillName, strength]) => ({
    skillName: skillName.charAt(0).toUpperCase() + skillName.slice(1),
    strength,
  }));
}
