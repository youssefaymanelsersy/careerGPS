import { CompassIcon } from "lucide-react";
import { Link } from "react-router";

interface FooterSection {
  title: string;
  links: { label: string; href: string }[];
}

const sections: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Privacy", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
];

function FooterColumn({ title, links }: FooterSection) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
        {title}
      </h4>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xl font-bold text-foreground"
            >
              <CompassIcon className="size-6 text-primary" /> CareerGPS
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Navigate your career with AI-powered roadmaps, interviews, and
              skill tracking.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} CareerGPS. All rights reserved.
            </p>
          </div>
          {sections.map((section) => (
            <FooterColumn key={section.title} {...section} />
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
