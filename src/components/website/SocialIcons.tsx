import type { ComponentType, SVGProps } from "react";
import type { LucideIcon } from "lucide-react";
import { MessageCircle, Music2 } from "lucide-react";

type BrandIconProps = SVGProps<SVGSVGElement>;

const FacebookIcon = ({ className, ...props }: BrandIconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className, ...props }: BrandIconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.975 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.975.974-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.975-1.246-2.242-1.308-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.975-.974 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 5.775.13 4.602.402 3.635 1.37 2.668 2.337 2.396 3.51 2.338 4.788 2.28 6.068 2.266 6.477 2.266 12c0 5.523.014 5.932.072 7.212.058 1.277.33 2.45 1.297 3.417.967.967 2.14 1.239 3.417 1.297 1.28.058 1.689.072 7.212.072s5.932-.014 7.212-.072c1.277-.058 2.45-.33 3.417-1.297.967-.967 1.239-2.14 1.297-3.417.058-1.28.072-1.689.072-7.212s-.014-5.932-.072-7.212c-.058-1.277-.33-2.45-1.297-3.417C21.95 2.402 20.777 2.13 19.5 2.072 18.22 2.014 17.811 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const LinkedinIcon = ({ className, ...props }: BrandIconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.127 0 2.063 2.063 0 01-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export interface SocialLinkItem {
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  href: string;
}

export const SOCIAL_ICON_LINKS: SocialLinkItem[] = [
  {
    icon: FacebookIcon,
    label: "Facebook",
    href: "https://www.facebook.com/share/1E6cBWNiC2/",
  },
  {
    icon: InstagramIcon,
    label: "Instagram",
    href: "https://www.instagram.com/raad.institute?igsh=bGVjYWhwa3VyaGVs",
  },
  {
    icon: LinkedinIcon,
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/raad-institute-learning/",
  },
  {
    icon: Music2,
    label: "TikTok",
    href: "https://www.tiktok.com/@raadinstitute?_r=1&_t=ZS-97wxue1bZ4a",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    href: "https://wa.me/message/5YEFIGBL3BP5B1",
  },
];
