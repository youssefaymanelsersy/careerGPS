import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqData = [
  {
    value: "roadmap-generation",
    question: "How does the AI generate my roadmap?",
    answer:
      "It analyzes your uploaded resume against real-time job market data, identifying the gap between your current skills and the requirements for your target role.",
  },
  {
    value: "change-goal",
    question: "Can I change my career goal later?",
    answer:
      "Yes, you can update your career goal at any time. The AI will automatically regenerate your roadmap based on your new target role and adjust the learning path accordingly.",
  },
  {
    value: "supported-industries",
    question: "What industries are supported?",
    answer:
      "We currently support major industries including technology, finance, healthcare, marketing, engineering, and more. Our AI continuously updates its knowledge base to cover emerging roles and sectors.",
  },
]

function FaqSection() {
  return (
    <section id="faq" className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-3xl font-bold">
          Frequently Asked Questions
        </h2>
        <Accordion defaultValue={["roadmap-generation"]} className="mx-auto space-y-2 max-w-3xl">
          {faqData.map((faq, index) => (
            <AccordionItem className="bg-surface" key={index} value={faq.value}>
              <AccordionTrigger className="border border-border border-b-0">{faq.question}</AccordionTrigger>
              <AccordionContent className="border border-border border-t-0">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

export default FaqSection
