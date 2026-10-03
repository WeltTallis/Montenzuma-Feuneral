/* ==========================================================================
   Amani Cover — shared UI used by the landing, terms and referral routes.

   These are the pieces the redesign splits into components (site-header,
   site-footer) plus the two Next-only pieces that need replacing here:
     • next/image → FillImage (a plain <img> that fills its parent)
     • next/link  → react-router <Link>
   Every colour utility uses the `ac-` prefix — see the long note in
   src/index.css for why the stock shadcn names cannot be used.
   ========================================================================== */

import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { CONTACT } from './amaniData';
import './AmaniCover.css';

/* Plain <img> that fills its (position:relative) parent, matching what the
   redesign's next/image `fill` prop did. `priority` marks the LCP hero image.
   The `.amani-fill` class (see AmaniCover.css) carries the absolute inset /
   100% sizing as an UNLAYERED rule, because the host app ships an unlayered
   `img { height: auto }` that would otherwise beat Tailwind's `h-full`. */
export function FillImage({ src, alt, className = '', priority = false, sizes }) {
  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={`amani-fill ${className}`}
    />
  );
}

/* On the landing route the header links are in-page anchors; on the sub-routes
   they point back to the landing sections so the nav is never a dead end. */
const LANDING_ANCHORS = [
  { href: '#about', label: 'About' },
  { href: '#how', label: 'How it works' },
  { href: '#faq', label: 'Questions' },
];
const SUB_ANCHORS = [
  { href: '/amani/cover#about', label: 'About' },
  { href: '/amani/cover#how', label: 'How it works' },
  { href: '/amani/cover#faq', label: 'Questions' },
];

/* Sticky header, ported from the redesign's site-header.tsx. */
export function AmaniNav({ inPageLinks, active = '/amani/cover' }) {
  const isLanding = active === '/amani/cover';
  const links = inPageLinks && inPageLinks.length ? inPageLinks : isLanding ? LANDING_ANCHORS : SUB_ANCHORS;
  const applyHref = isLanding ? '#apply' : '/amani/cover#apply';

  return (
    <header className="sticky top-0 z-40 border-b border-ac-border/70 bg-ac-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-6 lg:px-10">
        <Link to="/amani/cover" className="flex items-baseline gap-2" aria-label="Amani Cover home">
          <span className="font-serif text-2xl font-semibold tracking-tight text-ac-primary">Amani</span>
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-ac-accent">Cover</span>
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm text-ac-mutedfg">
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="transition-colors hover:text-ac-primary">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href={CONTACT.phoneHref}
            className="hidden items-center gap-2 text-sm font-medium text-ac-primary lg:flex"
          >
            <Phone className="size-4 text-ac-accent" aria-hidden="true" />
            {CONTACT.phone}
          </a>
          <a
            href={applyHref}
            className="inline-flex h-10 items-center rounded-xl bg-ac-primary px-5 text-sm font-medium text-ac-onprimary transition-colors hover:bg-ac-primary/90"
          >
            Get covered
          </a>
        </div>
      </div>
    </header>
  );
}

/* Sub-page header for /terms and /refer — back link, eyebrow, serif title. */
export function PageHeader({ eyebrow, title, accent, intro }) {
  return (
    <header className="border-b border-ac-border bg-ac-card px-6 py-16 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/amani/cover"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ac-mutedfg transition-colors hover:text-ac-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to Amani Cover
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ac-accent">{eyebrow}</p>
        <h1 className="mt-4 font-serif text-[clamp(2.25rem,4.5vw,3.5rem)] font-medium leading-[1.05] tracking-tight text-balance text-ac-primary">
          {title} {accent && <em className="text-ac-accent">{accent}</em>}
        </h1>
        {intro && (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ac-mutedfg text-pretty">{intro}</p>
        )}
      </div>
    </header>
  );
}


/* Footer, ported from the redesign's site-footer.tsx. Shared by all three
   Amani routes, so the CTA / Explore / Support anchors resolve to the landing
   page when we are not already on it. */
const SUPPORT_LINKS = [
  { hash: 'apply', label: 'Request a call' },
  { hash: 'faq', label: 'Making a claim' },
  { hash: 'faq', label: 'Waiting periods' },
  { hash: 'apply', label: 'Update my cover' },
];
const LEGAL_LINKS = [
  { href: '#', label: 'Privacy policy' },
  { href: '/amani/cover/terms', label: 'Cover terms' },
  { href: '#', label: 'Complaints' },
];

const FOOT_HEADING = 'text-xs font-semibold uppercase tracking-[0.22em] text-ac-onprimary';
const FOOT_LINK = 'text-ac-onprimary/70 transition-colors hover:text-ac-onprimary';

export function AmaniFooter() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/amani/cover';
  const anchor = (hash) => (isLanding ? `#${hash}` : `/amani/cover#${hash}`);

  return (
    <footer className="bg-ac-primary text-ac-onprimary">
      <div className="px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-b border-ac-onprimary/10 py-12 md:flex-row md:items-center md:justify-between lg:py-16">
          <div className="max-w-xl">
            <p className="font-serif text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-tight text-balance">
              Peace of mind for your family, <em className="text-ac-highlight">starting today.</em>
            </p>
            <p className="mt-3 text-ac-onprimary/70">
              Speak to a caring member of our team  any time, day or night.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={anchor('apply')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ac-onprimary px-6 text-sm font-medium text-ac-primary transition-colors hover:bg-ac-onprimary/90"
            >
              Get covered
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <a
              href={CONTACT.phoneHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-ac-onprimary/25 px-6 text-sm font-medium transition-colors hover:bg-ac-onprimary/10"
            >
              <Phone className="size-4" aria-hidden="true" />
              {CONTACT.phone}
            </a>
          </div>
        </div>


        <div className="mx-auto grid max-w-7xl gap-12 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10 lg:py-16">
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-semibold">Amani</span>
              <span className="text-xs font-medium uppercase tracking-[0.25em] text-ac-highlight">Cover</span>
            </p>
            <p className="mt-4 max-w-sm leading-relaxed text-ac-onprimary/70">
              Funeral cover from Montenzuma Monalisa Funeral Home. For over 25 years we have honoured
              every life with dignity, and stood beside the families left behind.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-ac-onprimary/15 px-4 py-2 text-sm text-ac-onprimary/80">
              <span className="size-2 rounded-full bg-ac-highlight" aria-hidden="true" />
              Trusted by 12,000+ families
            </p>
          </div>

          <nav aria-label="Explore" className="lg:col-span-2">
            <h2 className={FOOT_HEADING}>Explore</h2>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              <li><a href={anchor('about')} className={FOOT_LINK}>About</a></li>
              <li><a href={anchor('how')} className={FOOT_LINK}>How it works</a></li>
              <li><a href={anchor('faq')} className={FOOT_LINK}>Questions</a></li>
              <li><a href={anchor('apply')} className={FOOT_LINK}>Apply now</a></li>
              <li><Link to="/amani/cover/terms" className={FOOT_LINK}>Cover terms</Link></li>
              <li><Link to="/amani/cover/refer" className={FOOT_LINK}>Refer a friend</Link></li>
            </ul>
          </nav>

          <nav aria-label="Support" className="lg:col-span-2">
            <h2 className={FOOT_HEADING}>Support</h2>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={anchor(link.hash)} className={FOOT_LINK}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sm:col-span-2 lg:col-span-4">
            <h2 className={FOOT_HEADING}>Contact us</h2>
            <address className="mt-5 flex flex-col gap-4 text-sm not-italic">
              <a href={CONTACT.phoneHref} className={`flex items-start gap-3 ${FOOT_LINK}`}>
                <Phone className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary">24/7 family line</span>
                  {CONTACT.phone}
                </span>
              </a>
              <a href={CONTACT.emailHref} className={`flex items-start gap-3 ${FOOT_LINK}`}>
                <Mail className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary">Email</span>
                  {CONTACT.email}
                </span>
              </a>
              <p className="flex items-start gap-3 text-ac-onprimary/70">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary">Visit us</span>
                  {CONTACT.address}
                </span>
              </p>
              <p className="flex items-start gap-3 text-ac-onprimary/70">
                <Clock className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary">Office hours</span>
                  {CONTACT.hours}
                </span>
              </p>
            </address>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-ac-onprimary/10 py-6 text-xs text-ac-onprimary/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Montenzuma Monalisa Funeral Home. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="transition-colors hover:text-ac-onprimary">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

