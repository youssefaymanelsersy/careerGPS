import { WobbleCard } from "@/components/ui/wobble-card";
import {
  Route,
  MessageSquare,
  GitCompare,
  FileSearch,
  Calendar,
  FolderGit,
} from "lucide-react";

const features = [
  {
    icon: Route,
    title: "AI Roadmap",
    description:
      "Dynamic learning paths tailored to your target role. Track every milestone as you close skill gaps.",
  },
  {
    icon: MessageSquare,
    title: "Mock Interviews",
    description:
      "Practice with AI-generated technical interviews. Get real-time feedback on your answers and areas to improve.",
  },
  {
    icon: GitCompare,
    title: "Skill Matching",
    description:
      "Upload a job description and instantly see how your skills compare. Know exactly what to learn next.",
  },
  {
    icon: FileSearch,
    title: "ATS Scanner",
    description:
      "Check if your resume passes applicant tracking systems. Get actionable fixes to improve your score.",
  },
  {
    icon: Calendar,
    title: "Weekly Calendar",
    description:
      "Structured study schedule with browser notifications. Stay consistent and never miss a learning session.",
  },
  {
    icon: FolderGit,
    title: "GitHub Sync",
    description:
      "Auto-detect your programming skills from GitHub repositories. No manual entry required.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20">
      <div className="mb-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need to land the job
        </h2>
        <p className="mt-4 mx-auto max-w-2xl text-muted-foreground">
          From skill discovery to interview prep — CareerGPS gives you the tools
          to close the gap between where you are and where you want to be.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <WobbleCard
              key={feature.title}
              containerClassName="bg-surface border border-border h-full"
              className="flex flex-col items-start p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Icon className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </WobbleCard>
          );
        })}
      </div>
    </section>
  );
}

export default FeaturesSection;
