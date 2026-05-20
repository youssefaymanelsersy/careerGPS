import { CompassIcon } from 'lucide-react'
import { Link } from 'react-router'
import React from 'react'

interface FooterSection {
  title: string
  links: { label: string; href: string }[]
}

const sections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'How It Works', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Privacy', href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQ', href: '#' },
      { label: 'Help Center', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
]

function FooterSection({ title, links }: FooterSection) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-foreground uppercase">{title}</h4>
      <ul className="mt-2 space-y-1">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Footer() {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-xl font-bold flex items-center gap-1 text-foreground">
              <CompassIcon className="size-6" /> CareerGPS
            </Link>
            <p className="mt-4 text-xs text-muted-foreground">© 2026 CareerGPS. All rights reserved.</p>
          </div>
          {sections.map((section) => (
            <FooterSection key={section.title} {...section} />
          ))}
        </div>
      </div>
    </footer>
  )
}

export default Footer
