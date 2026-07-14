export type TemplateDesign = "classic" | "modern" | "minimalist";

export interface Skill {
  name: string;
  level: string | null;
}

export interface SkillsContainer {
  technical: Skill[];
  nonTechnical: Skill[];
}

export interface Experience {
  company: string | null;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface Project {
  name: string | null;
  description: string | null;
  technologies: string[];
  url: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface Education {
  institution: string | null;
  degree: string | null;
  field: string | null;
  major: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface Certification {
  name: string | null;
  issuer: string | null;
  date: string | null;
}

export interface Links {
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
}

export interface ParsedCVData {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: SkillsContainer;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  languages: string[];
  links: Links;
}

export interface OptimizationMeta {
  warnings: string[];
  unaddressed_gaps: string[];
  changes_summary: string[];
}

export interface CvOptimizationResponse {
  status: string;
  data: ParsedCVData;
  meta: OptimizationMeta;
}
