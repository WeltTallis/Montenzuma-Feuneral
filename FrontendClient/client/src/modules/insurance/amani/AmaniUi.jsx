import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { CONTACT } from './amaniData';
import { IMAGE_VARIANTS } from './imageManifest';
import './AmaniCover.css';

/* ==========================================================================
   KISWAHILI ACCENTS — the page stays in English; these are the ONLY Swahili
   phrases, dropped into warm/friendly spots (drawer, footer) the way Kenyan
   brands actually mix. Each one is glossed so future edits keep the meaning:
     • "Uko covered?"                — "Are you covered?" (Sheng hybrid)
     • "Tuko pamoja nawe."           — "We're together with you."
     • "Tuko hapa 24/7, mchana na usiku." — "We're here 24/7, day and night."
     • "Piga simu"                   — "Make the call" (everyday Kenyan phrase)
     • "Amani ya kweli ni kujua familia yako iko salama."
                                     — "True peace is knowing your family is safe."
     • "Imetengenezwa Kenya, kwa Wakenya." — "Made in Kenya, for Kenyans."
   Urgent actions (Make a claim, form buttons, labels) stay English on purpose.
   ========================================================================== */

const SW = {
  drawerTagline: 'Uko covered? Tuko pamoja nawe.',
  drawerCallNote: 'Tuko hapa 24/7, mchana na usiku.',
  drawerCall: 'Call',
  footerQuote: 'Amani ya kweli ni kujua familia yako iko salama.',
  footerPill: 'Tuko pamoja — trusted by families across Kenya',
  madeIn: 'Imetengenezwa Kenya, kwa Wakenya.',
};

export function FillImage({ src, alt, className = '', priority = false, sizes, width, height }) {
  const entry = IMAGE_VARIANTS[src];

  /* Default `sizes` when the caller does not supply one. 100vw is the safe
     general answer for a full-bleed photo; the hero passes an explicit value.
     Overstating it only costs a slightly-too-large file, never a broken one. */
  const sizesAttr = sizes || '100vw';

  const style = entry?.lqip
    ? { backgroundImage: `url(${entry.lqip})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  return (
    <img
      src={entry ? entry.variants[entry.variants.length - 1].file : src}
      /* The smallest variant as the plain `src` fallback for any browser or
         context that ignores srcset. */
      srcSet={entry ? entry.variants.map((v) => `${v.file} ${v.width}w`).join(', ') : undefined}
      sizes={entry ? sizesAttr : undefined}
      alt={alt}
      width={entry ? entry.width : width}
      height={entry ? entry.height : height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      style={style}
      className={`amani-fill ${className}`}
    />
  );
}

/* On the landing route the header links are in-page anchors; on the sub-routes
   they point back to the landing sections so the nav is never a dead end. */
const LANDING_ANCHORS = [
  { href: '#about', label: 'About' },
  { href: '#how', label: 'How it works' },
  { href: '/amani/claims/track', label: 'Track a claim' },
];
const SUB_ANCHORS = [
  { href: '/amani/cover#about', label: 'About' },
  { href: '/amani/cover#how', label: 'How it works' },
  { href: '/amani/claims/track', label: 'Track a claim' },
];

/* Sticky header: the primary action always opens the claims route. The mobile
   drawer carries the full navigation, payment and support links. */

export function AmaniNav({ inPageLinks, active = '/amani/cover' }) {
  const isLanding = active === '/amani/cover';
  const links = inPageLinks && inPageLinks.length ? inPageLinks : isLanding ? LANDING_ANCHORS : SUB_ANCHORS;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const headerRef = useRef(null);

  /* Drawer links, grouped so ten rows become three scannable sections. */
  const drawerGroups = [
    {
      label: 'Cover',
      links: [
        { href: '/amani/cover', label: 'Amani Cover' },
        { href: isLanding ? '#plans' : '/amani/cover#plans', label: 'Choose cover' },
        { href: isLanding ? '#about' : '/amani/cover#about', label: 'About Amani' },
      ],
    },
    {
      label: 'Payments & claims',
      links: [
        { href: '/amani/payments', label: 'Make a payment' },
        { href: '/amani/claims', label: 'Make a claim' },
        { href: '/amani/claims/track', label: 'Track a claim' },
      ],
    },
    {
      label: 'More',
      links: [
        { href: '/amani/cover/apply', label: 'Apply now' },
        { href: '/amani/cover/terms', label: 'Policy terms' },
        { href: '/amani/cover/refer', label: 'Refer a friend' },
      ],
    },
  ];

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileOpen]);

  /* Hide when scrolling down past the hero, reveal on scroll up or when the
     header itself has keyboard focus (so its links stay reachable). */
  useEffect(() => {
    if (mobileOpen) {
      setHeaderVisible(true);
      return undefined;
    }

    let previousY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const headerHasFocus = headerRef.current?.contains(document.activeElement);

      if (headerHasFocus || currentY < 72 || currentY < previousY - 4) {
        setHeaderVisible(true);
      } else if (currentY > previousY + 4) {
        setHeaderVisible(false);
      }

      previousY = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileOpen]);

  /* Underline-on-hover link; the active link keeps a gold underline. */
  const linkClass = (href) => {
    const isActive = href === active;
    return [
      'relative py-0.5 text-sm transition-colors',
      isActive ? 'font-semibold text-ac-primary' : 'text-ac-mutedfg hover:text-ac-primary',
      'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:transition-transform after:duration-200',
      isActive
        ? 'after:scale-x-100 after:bg-ac-highlight'
        : 'after:scale-x-0 after:bg-ac-accent hover:after:scale-x-100',
    ].join(' ');
  };

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 border-b border-ac-border/70 bg-ac-bg/90 backdrop-blur-md transition-transform duration-300 ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            to="/amani/cover"
            className="flex shrink-0 items-center"
            aria-label="Amani Cover home"
          >
            <img
              src="https://montezumamonalisa.com/wp-content/uploads/2020/01/logo.png"
              alt="Montenzuma Monalisa Funeral Home"
              className="!h-[42px] !w-auto !max-w-[100px] object-contain"
            />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={linkClass(link.href)}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* The 24/7 family line as plain text, not a third button. Only
              shown at xl, where links + CTA are guaranteed to leave room. */}
          <a
            href={CONTACT.phoneHref}
            className="hidden items-center gap-2 whitespace-nowrap text-sm font-semibold text-ac-primary hover:underline hover:underline-offset-4 xl:inline-flex"
          >
            <Phone className="size-4 text-ac-accent" aria-hidden="true" />
            {CONTACT.phone}
          </a>

          <Link
            to="/amani/claims"
            className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-ac-primary px-3.5 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-ac-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-ring sm:h-10 sm:px-5 sm:text-sm"
          >
            Make a claim
          </Link>

          <button
            type="button"
            className="grid size-10 place-items-center rounded-lg border border-ac-border text-ac-primary transition-colors hover:bg-ac-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-ring lg:hidden"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="amani-mobile-menu"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 size-full bg-black/35"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            id="amani-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Amani navigation"
            className="absolute right-0 top-0 flex h-dvh w-[min(88vw,22rem)] flex-col overflow-y-auto bg-ac-bg shadow-2xl"
          >
            <div className="border-b border-ac-border px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xl font-semibold text-ac-primary">Amani Cover</span>
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-lg text-ac-primary hover:bg-ac-card focus-visible:outline-2 focus-visible:outline-ac-ring"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              {/* Kiswahili accent — a warm hello under the drawer title */}
              <p className="mt-1 text-xs italic text-ac-accent">{SW.drawerTagline}</p>
            </div>

            <nav aria-label="Amani mobile" className="flex flex-1 flex-col gap-5 px-5 pt-5">
              {drawerGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ac-accent">
                    {group.label}
                  </p>
                  {group.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-2.5 text-sm font-medium text-ac-ink transition-colors hover:bg-ac-card hover:text-ac-primary focus-visible:outline-2 focus-visible:outline-ac-ring"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                      <ArrowRight className="size-4 shrink-0 text-ac-accent" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              ))}
            </nav>

            <div className="mt-auto border-t border-ac-border p-5">
              {/* Kiswahili accent — availability reassurance above the number */}
              <p className="mb-2 text-center text-[0.6875rem] text-ac-mutedfg">{SW.drawerCallNote}</p>
              <a
                href={CONTACT.phoneHref}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ac-primary px-4 font-semibold text-white transition-colors hover:bg-ac-primary-hover"
              >
                <Phone className="size-4" aria-hidden="true" />
                {SW.drawerCall} {CONTACT.phone}
              </a>
            </div>
          </aside>
        </div>
      )}
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
   Amani routes. */
/* Support links point at the real routes rather than landing anchors, so
   "Making a claim" lands on the claims page instead of scrolling to a
   section. Rendered with <Link to={...}> to match. */
const SUPPORT_LINKS = [
  { to: '/amani/cover/apply', label: 'Talk to our team' },
  { to: '/amani/claims', label: 'Make a claim' },
  { to: '/amani/claims/track', label: 'Track a claim' },
  { to: '/amani/cover/terms', label: 'Waiting periods' },
  { to: '/amani/payments', label: 'Pay your contribution' },
];
const LEGAL_LINKS = [
  { href: '#', label: 'Privacy policy' },
  { href: '/amani/cover/terms', label: 'Policy terms' },
  { href: '#', label: 'Complaints' },
];

/* Footer typography. Cut twice over: the first pass to text-xs/text-sm was
   still reading too large next to the page content, so the headings and links
   are now set in explicit rem values below Tailwind's `sm` step (12px and
   13px) rather than a named scale size. */
const FOOT_HEADING =
  '!text-[14px] !leading-4 !font-medium uppercase tracking-[0.08em] text-ac-onprimary/45';

const FOOT_LINK =
  'text-[13px] leading-5 transition-colors text-ac-onprimary/70 hover:text-ac-onprimary';

const FOOT_COLUMN =
  'flex flex-col gap-2.5 text-[13px]';

export function AmaniFooter() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/amani/cover';
  const anchor = (hash) => (isLanding ? `#${hash}` : `/amani/cover#${hash}`);

  return (
    <footer className="bg-ac-primary text-ac-onprimary">
      <div className="px-6 lg:px-10">
        {/* CTA Section completely removed as requested */}

        {/* Padding cut roughly in half (pt-16/pb-12 -> pt-9/pb-7): the footer's
            height was reading as a second page rather than as a footer. */}
        <div className="mx-auto grid max-w-7xl gap-8 pt-9 pb-7 sm:grid-cols-2 lg:grid-cols-12 lg:gap-7 lg:pt-10 lg:pb-8">
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-semibold">Amani</span>
            </p>
            <p className="mt-3 max-w-sm text-[0.8125rem] leading-relaxed text-ac-onprimary/65">
              Amani Cover is funeral insurance from Montenzuma Monalisa Funeral
              Home, so your family never has to worry about money while they say goodbye. We&rsquo;ve
              been with Kenyan families for over 25 years, and we&rsquo;re here for yours.
            </p>
            {/* Kiswahili accent — the brand promise in the language of the name */}
            <p className="mt-3 max-w-sm font-serif text-sm italic leading-relaxed text-ac-highlight/90">
              &ldquo;{SW.footerQuote}&rdquo;
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-ac-onprimary/15 px-3 py-1 text-[0.6875rem] text-ac-onprimary/75">
              <span className="size-1.5 rounded-full bg-ac-highlight" aria-hidden="true" />
              {SW.footerPill}
            </p>
          </div>

          <nav aria-label="Explore" className="lg:col-span-2">
            <h2 className={FOOT_HEADING}>Explore</h2>
            <ul className="mt-3 flex flex-col gap-2.5 text-[0.8125rem]">
              <li><a href={anchor('about')} className={FOOT_LINK}>About</a></li>
              <li><a href={anchor('how')} className={FOOT_LINK}>How it works</a></li>
              <li><a href={anchor('apply')} className={FOOT_LINK}>Apply now</a></li>
              <li><Link to="/amani/cover/terms" className={FOOT_LINK}>Policy terms</Link></li>
              <li><Link to="/amani/cover/refer" className={FOOT_LINK}>Refer a friend</Link></li>
            </ul>
          </nav>

          <nav aria-label="Support" className="lg:col-span-2">
            <h2 className={FOOT_HEADING}>Support</h2>
            <ul className="mt-3 flex flex-col gap-2.5 text-[0.8125rem]">
              {SUPPORT_LINKS.map((link) => (
                /* `to:`, not an anchor hash. These were switched from landing
                   anchors to real routes, but the markup kept reading
                   `link.hash` - which is undefined on every entry - so all four
                   links rendered as "#undefined" and went nowhere. */
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className={
                      /* "Make a claim" is the one SUPPORT link that is an
                         urgent action rather than an informational page, so it
                         carries the same red as the header's "Submit claim"
                         button - the claim action reads the same wherever it is
                         offered. The other three stay at the muted footer
                         link colour. */
                      link.label === 'Make a claim'
                        ? `${FOOT_LINK} font-medium text-red-300 hover:text-red-200`
                        : FOOT_LINK
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sm:col-span-2 lg:col-span-4">
            <h2 className={FOOT_HEADING}>Contact us</h2>
            <address className="mt-3 flex flex-col gap-3.5 text-[0.8125rem] not-italic">
              <a href={CONTACT.phoneHref} className={`flex items-start gap-2.5 ${FOOT_LINK}`}>
                <Phone className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary font-medium">Call us, day or night</span>
                  {CONTACT.phone}
                </span>
              </a>
              <a href={CONTACT.emailHref} className={`flex items-start gap-2.5 ${FOOT_LINK}`}>
                <Mail className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary font-medium">Write to us</span>
                  {CONTACT.email}
                </span>
              </a>
              <p className="flex items-start gap-2.5 text-ac-onprimary/70">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary font-medium">Visit us</span>
                  {CONTACT.address}
                </span>
              </p>
              <p className="flex items-start gap-2.5 text-ac-onprimary/70">
                <Clock className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary font-medium">Opening hours</span>
                  {CONTACT.hours}
                </span>
              </p>
            </address>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-ac-onprimary/10 py-4 text-xs text-ac-onprimary/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Montenzuma Monalisa Funeral Home. All rights reserved.
            {/* Kiswahili accent — quiet national pride on the last line */}
            <span className="ml-2 italic text-ac-onprimary/45">{SW.madeIn}</span>
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
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