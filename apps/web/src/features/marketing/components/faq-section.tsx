import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    value: "roadmap-generation",
    question: "How does the AI generate my roadmap?",
    answer:
      "It analyzes your uploaded resume and GitHub profile against real-time job market data, identifying the gap between your current skills and the requirements for your target role. The roadmap breaks down exactly what you need to learn, in what order.",
  },
  {
    value: "change-goal",
    question: "Can I change my career goal later?",
    answer:
      "Yes, you can update your career goal at any time from your profile. The AI will automatically regenerate your roadmap based on your new target role and adjust the learning path accordingly.",
  },
  {
    value: "ats-scanner",
    question: "How does the ATS Scanner work?",
    answer:
      "Upload your resume as a PDF and our AI evaluates it against common applicant tracking system criteria. You'll get a compatibility score along with specific, actionable suggestions to improve your resume's chances of passing automated filters.",
  },
  {
    value: "skill-matching",
    question: "What is skill matching?",
    answer:
      "Paste any job description and we'll compare it against the skills extracted from your resume. You'll get a match percentage and a detailed breakdown showing which skills you have, which you're missing, and what you should prioritize learning.",
  },
  {
    value: "mock-interviews",
    question: "How do mock interviews work?",
    answer:
      "Choose your target career or paste a job description, and the AI will generate realistic technical interview questions. Answer in your own words and receive detailed feedback on your responses, including strengths and areas for improvement.",
  },
  {
    value: "free-tier",
    question: "Is CareerGPS free to use?",
    answer:
      "Yes! The free tier includes 1 ATS scan and 1 skill match per day, plus 2 mock interviews per month. Paid plans unlock unlimited access to all features. You can get started immediately after signing up.",
  },
];

function FaqSection() {
  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-muted-foreground">
            Got questions? We've got answers.
          </p>
        </div>

        <Accordion
          defaultValue={["roadmap-generation"]}
          variant="surface"
          className="max-w-3xl mx-auto"
        >
          {faqData.map((faq) => (
            <AccordionItem
              key={faq.value}
              value={faq.value}
              className="border-none"
            >
              <AccordionTrigger chevronClassName="size-6" className="px-6 py-5 text-base font-medium text-start hover:bg-surface-secondary/50 transition-colors data-[state=open]:bg-surface-secondary/30 data-[state=open]:font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5 text-base text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export default FaqSection;
