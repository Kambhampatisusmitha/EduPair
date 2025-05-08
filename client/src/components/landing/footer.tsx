import { Link } from "wouter";
import Logo from "@/components/ui/logo";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

export default function Footer() {
  const footerSections: FooterSection[] = [
    {
      title: "About",
      links: [
        { label: "Our Story", href: "#" },
        { label: "Team", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Blog", href: "#" },
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Help Center", href: "#" },
        { label: "Learning Guides", href: "#" },
        { label: "Community", href: "#" },
        { label: "Events", href: "#" },
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Terms of Service", href: "#" },
        { label: "Privacy Policy", href: "#" },
        { label: "Cookie Policy", href: "#" },
        { label: "GDPR", href: "#" },
      ]
    },
    {
      title: "Connect",
      links: [
        { label: "Twitter", href: "#" },
        { label: "Facebook", href: "#" },
        { label: "Instagram", href: "#" },
        { label: "LinkedIn", href: "#" },
      ]
    }
  ];

  return (
    <footer className="bg-primary dark:bg-card text-white dark:text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-heading font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>
                      <a className="hover:text-accent dark:hover:text-light-blue transition">
                        {link.label}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <Logo textClassName="text-white" />
          <p className="mt-4 md:mt-0 text-sm">© {new Date().getFullYear()} EduPair. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
