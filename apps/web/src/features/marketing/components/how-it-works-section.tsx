import { TracingBeam } from "@/components/ui/tracing-beam";
import { Upload, Brain, Map } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Sync Your Profile",
    description:
      "Connect your GitHub and upload your CV. Our AI extracts every skill from your experience to build your baseline profile.",
  },
  {
    icon: Brain,
    step: "02",
    title: "AI Maps Your Path",
    description:
      "Our engine identifies skill gaps against your target role and generates a personalized learning roadmap with curated resources.",
  },
  {
    icon: Map,
    step: "03",
    title: "Follow Your Roadmap",
    description:
      "Track your progress, schedule study sessions, take mock interviews, and use ATS tools to land your dream job.",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-20">
      <div className="mb-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          How It Works
        </h2>
        <p className="mt-4 text-muted-foreground">
          Three steps to transform your career trajectory
        </p>
      </div>

      <TracingBeam className="px-6">
        <div className="space-y-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex items-start gap-6">
                <div className="flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-primary/60">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed max-w-xl">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </TracingBeam>
    </section>
  );
}

export default HowItWorksSection;
