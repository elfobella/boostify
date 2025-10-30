import Link from "next/link"

const footerLinks = {
  company: [
    { href: "/about", label: "About Us" },
    { href: "/services", label: "Services" },
    { href: "/blog", label: "Blog" },
    { href: "/careers", label: "Careers" },
  ],
  support: [
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/cookies", label: "Cookies" },
    { href: "/legal", label: "Legal" },
  ],
}

export function FooterLinks() {
  return (
    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
      <div>
        <h3 className="text-sm font-semibold mb-4 text-gray-100">Company</h3>
        <ul className="space-y-3">
          {footerLinks.company.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-gray-400 opacity-60 hover:text-blue-400 transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-4 text-gray-100">Support</h3>
        <ul className="space-y-3">
          {footerLinks.support.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-gray-400 opacity-60 hover:text-blue-400 transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-4 text-gray-100">Legal</h3>
        <ul className="space-y-3">
          {footerLinks.legal.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-gray-400 opacity-60 hover:text-blue-400 transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-4 text-gray-100">Follow Us</h3>
        <ul className="space-y-3">
          <li>
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
            >
              Twitter
            </Link>
          </li>
          <li>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
            >
              GitHub
            </Link>
          </li>
          <li>
            <Link
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
            >
              LinkedIn
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}

