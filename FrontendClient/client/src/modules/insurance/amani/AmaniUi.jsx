import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, CreditCard, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { CONTACT } from './amaniData';
import { IMAGE_VARIANTS } from './imageManifest';
import './AmaniCover.css';
import './AmaniNav.css';

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
      fetchpriority={priority ? 'high' : undefined}
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

/* ==========================================================================
   NAV — a floating, rounded bar (see AmaniNav.css).
   • Left: brand mark + wordmark, then the main links as soft pills.
   • Right: 24/7 phone chip (xl), "Pay" (md+), and the primary "Make a claim".
   • Below lg the links move into a slide-in drawer, grouped in three sections.
   • Hides when scrolling down past the hero, returns on scroll up or when the
     header has keyboard focus. No borders anywhere: depth comes from shadow.
   ========================================================================== */

export function AmaniNav({ inPageLinks, active = '/amani/cover' }) {
  const isLanding = active === '/amani/cover';
  const links = inPageLinks && inPageLinks.length ? inPageLinks : isLanding ? LANDING_ANCHORS : SUB_ANCHORS;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef(null);
  const closeRef = useRef(null);

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

  /* Lock page scroll while the drawer is open; Escape closes it; focus moves
     to the close button so keyboard users land inside the dialog. */
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileOpen]);

  /* Hide when scrolling down past the hero, reveal on scroll up or when the
     header itself has keyboard focus (so its links stay reachable). Also
     tracks `scrolled` so the bar can deepen its shadow once the page moves. */
  useEffect(() => {
    if (mobileOpen) {
      setHeaderVisible(true);
      return undefined;
    }

    let previousY = window.scrollY;
    setScrolled(previousY > 8);

    const handleScroll = () => {
      const currentY = window.scrollY;
      const headerHasFocus = headerRef.current?.contains(document.activeElement);

      setScrolled(currentY > 8);

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

  const closeMenu = () => setMobileOpen(false);

  return (
    <header
      ref={headerRef}
      className={`an-header${headerVisible ? '' : ' is-hidden'}${scrolled ? ' is-scrolled' : ''}`}
    >
      <div className="an-bar">
        <Link to="/amani/cover" className="an-brand" aria-label="Amani Cover home">
          <span className="an-brand__mark" aria-hidden="true">A</span>
          <span className="an-brand__text">
            <span className="an-brand__name">Amani</span>
            <small>by Montenzuma Monalisa</small>
          </span>
        </Link>

        <nav aria-label="Main" className="an-links">
          <ul>
            {links.map((link) => {
              const isActive = link.href === active;
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`an-link${isActive ? ' is-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="an-actions">
          {/* The 24/7 family line, shown only where there is guaranteed room. */}
          <a href={CONTACT.phoneHref} className="an-phone">
            <span className="an-phone__icon" aria-hidden="true">
              <Phone size={16} />
            </span>
            <span className="an-phone__text">
              <small>24/7 family line</small>
              {CONTACT.phone}
            </span>
          </a>

          <Link to="/amani/payments" className="an-btn an-btn--soft an-pay">
            <CreditCard size={16} aria-hidden="true" />
            Pay
          </Link>

          <Link to="/amani/claims" className="an-btn an-btn--primary an-claim">
            Make a claim
            <ArrowRight size={16} aria-hidden="true" />
          </Link>

          <button
            type="button"
            className="an-menu"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="amani-mobile-menu"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="an-drawer-root">
          <button
            type="button"
            className="an-scrim"
            aria-label="Close navigation menu"
            onClick={closeMenu}
          />
          <aside
            id="amani-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Amani navigation"
            className="an-drawer"
          >
            <div className="an-drawer__head">
              <div className="an-drawer__top">
                <span className="an-drawer__title">Amani Cover</span>
                <button
                  ref={closeRef}
                  type="button"
                  className="an-drawer__close"
                  aria-label="Close navigation menu"
                  onClick={closeMenu}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              {/* Kiswahili accent — a warm hello under the drawer title */}
              <p className="an-drawer__tag">{SW.drawerTagline}</p>
            </div>

            <nav aria-label="Amani mobile" className="an-drawer__nav">
              {drawerGroups.map((group) => (
                <div key={group.label} className="an-group">
                  <p className="an-group__label">{group.label}</p>
                  {group.links.map((link) => (
                    <a key={link.label} href={link.href} className="an-drawer__link" onClick={closeMenu}>
                      {link.label}
                      <ArrowRight size={16} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              ))}
            </nav>

            <div className="an-drawer__foot">
              {/* Kiswahili accent — availability reassurance above the number */}
              <p>{SW.drawerCallNote}</p>
              <a href={CONTACT.phoneHref} className="an-btn an-btn--primary an-btn--block">
                <Phone size={16} aria-hidden="true" />
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
    <header className="amani-page-header an-pagehead">
      <div className="amani-page-header__content an-pagehead__inner">
        <Link to="/amani/cover" className="an-back">
          <ArrowLeft size={16} aria-hidden="true" /> Back to Amani Cover
        </Link>
        <p className="an-eyebrow">{eyebrow}</p>
        <h1 className="an-pagehead__title">
          {title} {accent && <em>{accent}</em>}
        </h1>
        {intro && <p className="an-pagehead__intro">{intro}</p>}
      </div>
    </header>
  );
}

/* Footer, shared by all three Amani routes.
   Support links point at the real routes rather than landing anchors, so
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

export function AmaniFooter() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/amani/cover';
  const anchor = (hash) => (isLanding ? `#${hash}` : `/amani/cover#${hash}`);

  return (
    <footer className="an-footer">
      <div className="an-footer__wrap">
        <div className="an-footer__grid">
          <div className="an-footer__brand">
            <p className="an-footer__logo">Amani</p>
            <p className="an-footer__about">
              Amani Cover is funeral insurance from Montenzuma Monalisa Funeral
              Home, so your family never has to worry about money while they say goodbye. We&rsquo;ve
              been with Kenyan families for over 25 years, and we&rsquo;re here for yours.
            </p>
            {/* Kiswahili accent — the brand promise in the language of the name */}
            <p className="an-footer__quote">&ldquo;{SW.footerQuote}&rdquo;</p>
            <p className="an-footer__pill">
              <span aria-hidden="true" />
              {SW.footerPill}
            </p>
          </div>

          <nav aria-label="Explore" className="an-footer__col an-footer__col--explore">
            <h2>Explore</h2>
            <ul>
              <li><a href={anchor('about')}>About</a></li>
              <li><a href={anchor('how')}>How it works</a></li>
              <li><a href={anchor('apply')}>Apply now</a></li>
              <li><Link to="/amani/cover/terms">Policy terms</Link></li>
              <li><Link to="/amani/cover/refer">Refer a friend</Link></li>
            </ul>
          </nav>

          <nav aria-label="Support" className="an-footer__col an-footer__col--support">
            <h2>Support</h2>
            <ul>
              {SUPPORT_LINKS.map((link) => (
                /* "Make a claim" is the one SUPPORT link that is an urgent
                   action rather than an informational page, so it keeps a red
                   tint — the claim action reads the same wherever it appears. */
                <li key={link.label}>
                  <Link to={link.to} className={link.label === 'Make a claim' ? 'is-urgent' : undefined}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="an-footer__col an-footer__col--contact">
            <h2>Contact us</h2>
            <address>
              <a href={CONTACT.phoneHref} className="an-contact">
                <span className="an-contact__icon" aria-hidden="true"><Phone size={16} /></span>
                <span>
                  <strong>Call us, day or night</strong>
                  {CONTACT.phone}
                </span>
              </a>
              <a href={CONTACT.emailHref} className="an-contact">
                <span className="an-contact__icon" aria-hidden="true"><Mail size={16} /></span>
                <span>
                  <strong>Write to us</strong>
                  {CONTACT.email}
                </span>
              </a>
              <p className="an-contact">
                <span className="an-contact__icon" aria-hidden="true"><MapPin size={16} /></span>
                <span>
                  <strong>Visit us</strong>
                  {CONTACT.address}
                </span>
              </p>
              <p className="an-contact">
                <span className="an-contact__icon" aria-hidden="true"><Clock size={16} /></span>
                <span>
                  <strong>Opening hours</strong>
                  {CONTACT.hours}
                </span>
              </p>
            </address>
          </div>
        </div>
      </div>

      <div className="an-footer__bar">
        <div className="an-footer__bar-inner">
          <p>
            © {new Date().getFullYear()} Montenzuma Monalisa Funeral Home. All rights reserved.
            {/* Kiswahili accent — quiet national pride on the last line */}
            <span className="an-footer__made">{SW.madeIn}</span>
          </p>
          <ul>
            {LEGAL_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}