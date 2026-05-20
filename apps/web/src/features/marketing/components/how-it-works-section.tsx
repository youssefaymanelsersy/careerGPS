import React from 'react'
import { Upload, Brain, Map } from 'lucide-react'
import { Surface } from '@/components/ui/surface'

const steps = [
  {
    icon: Upload,
    title: 'Upload CV',
    description: 'Drag and drop your current resume or LinkedIn profile.',
  },
  {
    icon: Brain,
    title: 'AI Extracts Skills',
    description: 'Our engine maps your existing skills against industry demands.',
  },
  {
    icon: Map,
    title: 'Get Your Roadmap',
    description: 'Start navigating your personalized skill tree to your next role.',
  },
]

function HowItWorksSection() {
  return (
    <section id="how-it-works" className='py-12'>
       <h2 className="text-3xl font-bold text-center mb-12">
          3 Simple Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <Surface key={index} className="flex flex-col justify-center items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <step.icon className="size-6" />
              </div>
              <div className='text-center'>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </Surface>
          ))}
        </div>
    </section>
  )
}

export default HowItWorksSection
