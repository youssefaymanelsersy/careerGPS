import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { FlipWords } from "@/components/ui/flip-words";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";
import { Link } from "react-router";
import { useOutsideClick } from "@/hooks/use-outside-click";

const featureCards = [
  {
    src: "/roadmap.jpeg",
    title: "AI Roadmap",
    label: "Roadmap",
    description:
      "Dynamic learning paths tailored to your target role. Track every milestone as you close skill gaps.",
    content:
      "Our AI analyzes your resume, GitHub profile, and target role to generate a personalized learning roadmap. Each step is broken down into actionable milestones with curated resources — articles, videos, and projects. As you complete nodes, the roadmap adapts, recommending next steps based on your pace and the latest job market data. Visualize your entire career trajectory on an interactive canvas with color-coded skill groups.",
  },
  {
    src: "/mock-interview.jpeg",
    title: "Mock Interviews",
    label: "Interview",
    description:
      "Practice with AI-generated technical interviews. Get real-time feedback on your answers.",
    content:
      "Choose your target role or paste a job description, and our AI generates realistic technical interview questions tailored to your experience level. Answer in your own words and receive detailed feedback — including strengths, weaknesses, and specific growth areas. Track your progress across multiple sessions with a 30-minute timer and auto-submit. Build confidence before the real thing with unlimited practice sessions.",
  },
  {
    src: "/skill-matching.jpeg",
    title: "Skill Matching",
    label: "Skills",
    description:
      "Upload a job description and see how your skills compare. Know exactly what to learn next.",
    content:
      "Paste any job description and our engine instantly compares it against the skills extracted from your resume and GitHub. You get a match percentage along with a detailed breakdown: skills you already have, skills you're missing, and a prioritized list of what to learn. This feeds directly into your roadmap, ensuring every gap is addressed in order of importance to the role you're targeting.",
  },
];

function HeroSection() {
  const [active, setActive] = useState<
    (typeof featureCards)[number] | null
  >(null);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  const onClose = useCallback(() => setActive(null), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
    }
    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, onClose);

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4">
            <motion.button
              key={`close-${active.title}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full border border-border bg-background p-2 hover:bg-muted"
              onClick={onClose}
            >
              <X className="size-4" />
            </motion.button>

            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="w-full max-w-[500px] h-full max-h-[90vh] flex flex-col rounded-3xl border border-border bg-surface overflow-hidden"
            >
              <motion.div layoutId={`image-${active.title}-${id}`}>
                <img
                  src={active.src}
                  alt={active.title}
                  className="w-full h-64 object-cover object-top rounded-ss-3xl rounded-se-3xl"
                />
              </motion.div>

              <div className="flex flex-col flex-1 overflow-auto p-6">
                <motion.h3
                  layoutId={`title-${active.title}-${id}`}
                  className="text-xl font-bold"
                >
                  {active.title}
                </motion.h3>
                <motion.p
                  layoutId={`desc-${active.title}-${id}`}
                  className="mt-1 text-sm text-muted-foreground"
                >
                  {active.description}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-6 text-sm text-muted-foreground leading-relaxed"
                >
                  {active.content}
                </motion.div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <section className="flex min-h-screen flex-col items-center justify-center overflow-hidden py-20 pt-[calc(var(--header-height)+5rem)]">
        <BackgroundBeams className="absolute inset-0 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-3xl text-center px-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="text-foreground">
              <FlipWords
                words={["Navigate", "Build", "Master", "Accelerate"]}
                duration={2500}
                className="text-primary inline-block"
              />
            </span>
            <br />
            <span className="text-foreground">your career path</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              with AI precision
            </span>
          </h1>

          <TextGenerateEffect
            words="Personalized roadmaps, skill gap analysis, and AI-powered mock interviews to land your dream tech job."
            className="mt-6 text-lg text-muted-foreground font-normal"
            duration={0.4}
          />

          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" render={<Link to="/sign-up" />}>
              Start Free <ArrowRight />
            </Button>

            <Button
              variant="outline"
              size="lg"
              render={<Link to="/#how-it-works" />}
            >
              How It Works
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-4">
            {featureCards.map((card) => (
              <motion.div
                key={card.title}
                layoutId={`card-${card.title}-${id}`}
                onClick={() => setActive(card)}
                className="group relative overflow-hidden rounded-xl border border-border bg-surface shadow-lg cursor-pointer transition-shadow hover:shadow-xl"
              >
                <motion.div layoutId={`image-${card.title}-${id}`}>
                  <img
                    src={card.src}
                    alt={card.title}
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
                <div className="p-3">
                  <motion.h3
                    layoutId={`title-${card.title}-${id}`}
                    className="text-sm font-semibold"
                  >
                    {card.title}
                  </motion.h3>
                  <motion.p
                    layoutId={`desc-${card.title}-${id}`}
                    className="mt-1 text-xs text-muted-foreground line-clamp-2"
                  >
                    {card.description}
                  </motion.p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default HeroSection;
