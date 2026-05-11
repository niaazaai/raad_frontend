import { Facebook, Linkedin, Mail, MapPin, Phone, Twitter, Youtube } from "iconoir-react";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Programs", href: "/explore-courses" },
  { label: "Campus", href: "/#campus" },
  { label: "Team", href: "/#team" },
  { label: "Contact", href: "/contact" },
];

const RESOURCE_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Terms of Use", href: "/#" },
  { label: "FAQ", href: "/#" },
];

const SOCIAL_LINKS = [
  { icon: Facebook, label: "Facebook", href: "/#" },
  { icon: Twitter, label: "Twitter / X", href: "/#" },
  { icon: Linkedin, label: "LinkedIn", href: "/#" },
  { icon: Youtube, label: "YouTube", href: "/#" },
];

const colTitleClass =
  "text-white/90 font-semibold text-sm uppercase tracking-widest mb-4";

const linkClass =
  "text-white/55 hover:text-white transition-colors text-sm";

const CURRENT_YEAR = new Date().getFullYear();

const WebsiteFooter = () => {
  return (
    <footer className="border-t border-white/8 bg-[#030710]">
      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Column 1 – Brand */}
          <div className="flex flex-col gap-5">
            <a href="/" aria-label="Raad LMS – Home">
              <img
                src="/logo.png"
                alt="Raad Professional Development Institute"
                className="h-10 w-auto object-contain"
              />
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-white/55">
              Empowering Afghanistan&apos;s next generation of global
              professionals.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:border-white/25 hover:text-white"
                >
                  <Icon width={15} height={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 – Quick Links */}
          <div>
            <h3 className={colTitleClass}>Quick Links</h3>
            <ul className="flex flex-col gap-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 – Resources */}
          <div>
            <h3 className={colTitleClass}>Resources</h3>
            <ul className="flex flex-col gap-2.5">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 – Contact */}
          <div>
            <h3 className={colTitleClass}>Contact</h3>
            <ul className="flex flex-col gap-3.5">
              <li>
                <a
                  href="https://maps.google.com/?q=Kabul,Afghanistan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} flex items-start gap-2.5`}
                >
                  <MapPin
                    width={15}
                    height={15}
                    className="mt-0.5 shrink-0 text-white/40"
                  />
                  <span>Kabul, Afghanistan</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@raad.af"
                  className={`${linkClass} flex items-center gap-2.5`}
                >
                  <Mail
                    width={15}
                    height={15}
                    className="shrink-0 text-white/40"
                  />
                  <span>info@raad.af</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+93700000000"
                  className={`${linkClass} flex items-center gap-2.5`}
                >
                  <Phone
                    width={15}
                    height={15}
                    className="shrink-0 text-white/40"
                  />
                  <span>+93 (0) 700 000 000</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/6 px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-center text-xs text-white/35 sm:flex-row sm:text-left">
          <span>
            &copy; {CURRENT_YEAR} Raad Professional Development Institute. All
            rights reserved.
          </span>
          <span className="text-white/25">Designed for excellence</span>
        </div>
      </div>
    </footer>
  );
};

export default WebsiteFooter;
