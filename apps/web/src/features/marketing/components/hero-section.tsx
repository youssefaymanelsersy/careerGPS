import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

function HeroSection() {
  return (
    <section className='flex py-12 items-center text-center justify-between gap-3 flex-col min-h-[calc(100vh-var(--header-height))]'>
          <div className="max-w-2xl space-y-4">
            <h3 className='text-3xl font-bold'>Navigate your career path with AI precision</h3>
            <p>Build your personalized roadmap to your dream tech job with our AI-powered structured platform.</p>
            <Button render={<Link to="/sign-up"/>}>
                Start Free <ArrowRight />
            </Button>
          </div>
          {/* TODO: add in-app image */}
    </section>
  )
}

export default HeroSection