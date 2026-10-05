/* ==========================================================================
   Amani Cover — shared UI used by the landing, terms and referral routes.

   These are the pieces the redesign splits into components (site-header,
   site-footer) plus the two Next-only pieces that need replacing here:
     • next/image → FillImage (a plain <img> that fills its parent)
     • next/link  → react-router <Link>
   Every colour utility uses the `ac-` prefix — see the long note in
   src/index.css for why the stock shadcn names cannot be used.
   ========================================================================== */

import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { CONTACT } from './amaniData';
import { IMAGE_VARIANTS } from './imageManifest';
import './AmaniCover.css';

/* Plain <img> that fills its (position:relative) parent, matching what the
   redesign's next/image `fill` prop did.

   PERFORMANCE
   Every Amani photo used to be a ~1.5-2.4 MB PNG. With a plain `src` the
   browser downloads the full file on every device, so a phone pulled ~27 MB
   before the page was usable — and it re-downloaded those huge files on every
   navigation because <img> gives the browser no width hint to cache against.

   Now:
     • srcSet + sizes  → the browser fetches ONE correctly-sized WebP
                          (a 390px phone gets the 640w file, ~40 KB, not
                          the 1.7 MB PNG). Without `sizes` the browser would
                          assume 100vw and grab the largest variant, so the
                          two attributes only work as a pair.
     • loading="lazy"  → below-the-fold photos are not fetched until they are
                         near the viewport. `priority` opts the LCP hero out.
     • fetchPriority    → only the LCP hero gets "high"; everything else is
                          left alone so it cannot compete with it.
     • decoding="async" → decode off the main thread.
     • LQIP background  → a 24px blurred WebP is painted instantly behind the
                          photo, so there is never a blank white box while the
                          real file loads. This is what removes the "flash".

   IMAGES NOT IN THE MANIFEST (e.g. an avatar added without re-running the
   generator) fall back to the original `src` — this is an optimisation, never
   a hard dependency. */
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
  /* A real route, not a landing anchor, so it works from every page. Someone who
     has already filed a claim comes to the site with one question — where is it
     — and burying that in a footer column meant the most urgent link on the
     whole page was the hardest one to reach. */
  { href: '/amani/claims/track', label: 'Track a claim' },
];
const SUB_ANCHORS = [
  { href: '/amani/cover#about', label: 'About' },
  { href: '/amani/cover#how', label: 'How it works' },
  /* A bereaved family looking for an existing claim should reach the tracker
     from the sticky header on EVERY page, not only from a footer column they
     have to scroll to the bottom of. It sits beside the two content anchors
     because it is the third thing a visitor to any of these pages is actually
     looking for: what is this, how does it work, and where is my claim. */
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
  const mobileLinks = [
    { href: '/amani/cover', label: 'Amani Cover' },
    { href: isLanding ? '#plans' : '/amani/cover#plans', label: 'Choose cover' },
    { href: '/amani/cover/apply', label: 'Apply now' },
    { href: isLanding ? '#about' : '/amani/cover#about', label: 'About Amani' },
    { href: isLanding ? '#how' : '/amani/cover#how', label: 'How it works' },
    { href: '/amani/cover/terms', label: 'Policy terms' },
    { href: '/amani/cover/refer', label: 'Refer a friend' },
    { href: '/amani/payments', label: 'Make a payment' },
    { href: '/amani/claims', label: 'Make a claim' },
    { href: '/amani/claims/track', label: 'Track a claim' },
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

  useEffect(() => {
    if (mobileOpen) {
      setHeaderVisible(true);
      return undefined;
    }

    let previousY = window.scrollY;
    let idleTimer;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const headerHasFocus = headerRef.current?.contains(document.activeElement);

      if (headerHasFocus || currentY < 72 || currentY < previousY - 4) {
        setHeaderVisible(true);
      } else if (currentY > previousY + 4) {
        setHeaderVisible(false);
      }

      previousY = currentY;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setHeaderVisible(true), 480);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [mobileOpen]);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 border-ac-border/70 bg-ac-bg/90 backdrop-blur-md transition-transform duration-300 ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
        {/* Keep the compact claim action and menu trigger side by side on phones. */}
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-18 sm:gap-6 sm:px-6 lg:px-10">
        {/* Logo and section links share the LEFT group. They were separate
            justify-between children before, which put the links in the middle
            of the bar - exactly where the centred phone number now sits, so
            the number was landing on top of them. Grouping them left leaves
            the middle of the bar genuinely free. */}
        <div className="flex shrink-0 items-center gap-8">
          <Link to="/amani/cover" className="flex items-baseline gap-2" aria-label="Amani Cover home">
            <span className="flex items-center gap-2.5">
              <img
                src="https://montezumamonalisa.com/wp-content/uploads/2020/01/logo.png"
                alt="Montenzuma Monalisa Funeral Home"
                className="h-8 w-10 object-contain sm:h-9 sm:w-16"
              />
              <span className="flex flex-col leading-none">
                <span className="font-serif text-xl font-semibold tracking-tight text-ac-primary sm:text-2xl">Amani</span>
                <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-ac-mutedfg">Funeral cover</span>
              </span>
            </span>

          </Link>

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-6 text-sm text-ac-mutedfg lg:gap-7">
              {links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="transition-colors hover:text-ac-primary">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* The 24/7 family line, centred in the bar on request - previously it
            sat in the right-hand group next to the CTA, where it read as one
            more button rather than as the number to call.

            Absolutely positioned rather than a flex sibling, because the bar is
            justify-between: a third flex child would be pushed toward the right
            edge by the width of the CTA, not centred. Hidden until `lg`, which is
            where the links above and the CTA leave enough room for it without
            overlapping either. */}
        <a
          href={CONTACT.phoneHref}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap text-sm font-medium text-ac-primary lg:flex"
        >
          <Phone className="size-4 text-ac-accent" aria-hidden="true" />
          {CONTACT.phone}
        </a>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/amani/claims"
            className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-ac-primary px-3.5 text-[0.8125rem] font-semibold text-white shadow-sm transition-colors hover:bg-ac-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-ring sm:h-10 sm:px-5 sm:text-sm"
          >
            Make a claim
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-lg border border-ac-border text-ac-primary transition-colors hover:bg-ac-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-ring md:hidden"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="amani-mobile-menu"
            onClick={() => setMobileOpen(open => !open)}
          >
            {mobileOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
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
            className="absolute right-0 top-0 flex h-dvh w-[min(88vw,22rem)] flex-col overflow-y-auto bg-ac-bg p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-ac-border pb-4">
              <span className="font-serif text-2xl font-semibold text-ac-primary">Amani</span>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-lg text-ac-primary hover:bg-ac-card focus-visible:outline-2 focus-visible:outline-ac-ring"
                aria-label="Close navigation menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Amani mobile" className="flex flex-col py-3">
              {mobileLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex min-h-12 items-center justify-between border-b border-ac-border/70 px-2 text-sm font-medium text-ac-ink transition-colors hover:bg-ac-card hover:text-ac-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                  <ArrowRight className="size-4 text-ac-accent" aria-hidden="true" />
                </a>
              ))}
            </nav>
            <a
              href={CONTACT.phoneHref}
              className="mt-auto flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ac-primary px-4 font-semibold text-white"
            >
              <Phone className="size-4" aria-hidden="true" />
              Call {CONTACT.phone}
            </a>
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
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-ac-onprimary/15 px-3 py-1 text-[0.6875rem] text-ac-onprimary/75">
              <span className="size-1.5 rounded-full bg-ac-highlight" aria-hidden="true" />
              Trusted by families across Kenya
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
          <p>© {new Date().getFullYear()} Montenzuma Monalisa Funeral Home. All rights reserved.</p>
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