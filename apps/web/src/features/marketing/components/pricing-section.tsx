import React, { useState } from 'react'
import { Surface } from '@/components/ui/surface'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const tiers = [
  {
    name: 'Scout',
    monthlyPrice: '$0',
    yearlyPrice: '$0',
    period: 'forever',
    yearlyPeriod: 'forever',
    description: 'Perfect for getting started',
    features: ['1 Career Roadmap', 'Basic Skill Extraction'],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Navigator Pro',
    monthlyPrice: '$19',
    yearlyPrice: '$190',
    period: 'month',
    yearlyPeriod: 'year',
    description: 'Most Popular',
    features: ['Unlimited Dynamic Roadmaps', 'Advanced AI Mentor Access', 'Resume & Portfolio Builder'],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    name: 'Fleet',
    monthlyPrice: '$49',
    yearlyPrice: '$490',
    period: 'user / mo',
    yearlyPeriod: 'user / yr',
    description: 'For teams and organizations',
    features: ['Everything in Pro', 'Team Dashboard', 'Custom Skill Trees'],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground text-lg">Choose the plan that works best for you</p>
        </div>

        <div className="flex justify-center mb-10">
          <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}>
            <TabsList>
              <TabsTrigger className="uppercase" value="monthly">Monthly</TabsTrigger>
              <TabsTrigger className="uppercase" value="yearly">Annual <span className='text-success text-xs'>2 months free</span> </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <Surface
              key={tier.name}
              variant={tier.highlighted ? 'secondary' : 'default'}
              className={`flex flex-col ${tier.highlighted ? 'border-primary ring-2 ring-primary' : ''}`}
            >
              {tier.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="foreground" size="lg">
                  {tier.description}
                </Badge>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    {billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice}
                  </span>
                  <span className="text-muted-foreground">
                    / {billingCycle === 'monthly' ? tier.period : (tier.yearlyPeriod || 'year')}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckIcon className='size-4 text-success' />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={tier.highlighted ? "default" : "outline"}
              >
                {tier.cta}
              </Button>
            </Surface>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PricingSection
