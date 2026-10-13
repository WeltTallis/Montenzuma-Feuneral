import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  PHOTOS,
  SW,
  aboutPoints,
  coverOptions,
  formatPlanAmount,
  moments,
  promises,
  steps,
} from './amaniData';
import AmaniApplicationForm from './amaniAplicationForm';
import { AmaniFooter, AmaniNav, FillImage } from './AmaniUi';
import './AmaniCover.css';

/* In-page anchors shown in the header. The "Questions" (#faq) entry was
   removed with the FAQ section; leaving it would produce a header link that
   jumps to a section that no longer exists. */
const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#how', label: 'How it works' },
  /* A real route, not a landing anchor. This array is passed as `inPageLinks`,
     which OVERRIDES LANDING_ANCHORS entirely inside AmaniNav — so the landing
     header renders these entries and nothing else. Adding the link only to
     LANDING_ANCHORS in AmaniUi.jsx therefore had no effect here, which is why
     it never appeared on the home page. */
  { href: '/amani/claims/track', label: 'Track a claim' },
];

export default function AmaniCover() {
  return (
    <div className="amani-cover">
      <AmaniNav inPageLinks={NAV_LINKS} active="/amani/cover" />

      <main id="top">
        <Hero />
        <PlanOptions />
        <PromiseBand />
        <ImageInterlude />
        <HowItWorks />
        <ApplySection />
        <ClaimBand />
      </main>

      <AmaniFooter />
    </div>
  );
}

/* ── hero.tsx ─────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="amani-hero">
      <div className="amani-hero__inner">
        <div className="amani-hero__copy">
          <p className="amani-hero__eyebrow">{SW.heroHook}</p>
          <h1 className="amani-hero__title">
            Peace of mind for the ones you <em>love most.</em>
          </h1>
          <p className="amani-hero__intro">
            Amani Cover is funeral insurance that helps your family say goodbye
            with dignity, without worrying about the cost. Offered by Montenzuma
            Monalisa Funeral Home, trusted by families for over 25 years.
          </p>
          <div className="amani-hero__actions">
            <a href="#plans" className="amani-hero__button">
              Explore cover options <ArrowRight size={17} aria-hidden="true" />
            </a>
            <Link to="/amani/payments" className="amani-hero__button amani-hero__button--secondary">
              Make a payment <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <p className="amani-hero__price">{SW.heroPriceLine}</p>
        </div>
        <div className="amani-hero__collage" aria-label="Amani Cover family and care photography">
          <div className="amani-hero__image-main">
            <FillImage
              src={PHOTOS.familyHero}
              alt="A multigenerational family embracing together at home"
              priority
              className="object-cover"
              sizes="(max-width: 767px) 92vw, 52vw"
            />
          </div>
          <div className="amani-hero__image-small amani-hero__image-small--flowers">
            <FillImage
              src={PHOTOS.whiteLilies}
              alt="White lilies arranged with care"
              className="object-cover"
              sizes="(max-width: 767px) 30vw, 16vw"
            />
          </div>
          <div className="amani-hero__image-small amani-hero__image-small--family">
            <FillImage
              src={PHOTOS.elderlyCouple}
              alt="An elderly couple smiling together"
              className="object-cover"
              sizes="(max-width: 767px) 25vw, 13vw"
            />
          </div>
          <aside className="amani-hero__trust" aria-label="Montenzuma Monalisa experience">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Trusted family care for 25+ years</span>
          </aside>
        </div>
      </div>
    </section>
  );
}



function PlanOptions() {
  return (
    <section id="plans" className="amani-plans scroll-mt-20 px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="amani-section-intro">
          <div className="amani-section-index"><b>01</b><span>Choose your cover</span></div>
          <div className="amani-section-copy">
            <h2 className="font-serif font-medium text-ac-primary">Know the contribution before you apply.</h2>
            <p className="mt-3 leading-relaxed text-ac-mutedfg">Select the option that fits the people you want to protect. Group cover starts at five people.</p>
          </div>
        </div>
        <div className="amani-plan-grid grid items-stretch pt-2 sm:grid-cols-2 xl:grid-cols-4">
          {coverOptions.map((option) => (
            <article
              key={option.value}
              className={
                option.value === 'Family'
                  ? 'amani-plan-card amani-plan-card--featured relative flex flex-col transition hover:-translate-y-1'
                  : 'amani-plan-card relative flex flex-col transition hover:-translate-y-1 hover:shadow-md'
              }
            >
              {option.value === 'Family' && (
                <span className="absolute -top-3 left-5 rounded-md bg-ac-highlight px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ac-primary">
                  Most popular
                </span>
              )}
              <h3 className={`font-serif text-2xl ${option.value === 'Family' ? 'text-white' : 'text-ac-primary'}`}>{option.label}</h3>
              <p className={`mt-1.5 min-h-10 text-sm leading-relaxed ${option.value === 'Family' ? 'text-white/70' : 'text-ac-mutedfg'}`}>{option.hint}</p>
              <p className={`mt-3 border-t pt-3 text-2xl font-semibold tracking-tight tabular-nums ${option.value === 'Family' ? 'border-white/15 text-white' : 'border-ac-border text-ac-primary'}`}>
                {formatPlanAmount(option.value, option.monthly)}
                <span className={`ml-1 text-sm font-normal ${option.value === 'Family' ? 'text-white/70' : 'text-ac-mutedfg'}`}>/ month</span>
              </p>
              <ul className="mb-4 mt-3 space-y-1.5">
                {option.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-1.5 text-xs leading-snug ${option.value === 'Family' ? 'text-white/85' : 'text-ac-primary'}`}
                  >
                    <Check
                      className={`mt-0.5 size-3.5 shrink-0 ${option.value === 'Family' ? 'text-ac-highlight' : 'text-ac-accent'}`}
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={`/amani/cover/apply?plan=${encodeURIComponent(option.value)}`}
                className={
                  option.value === 'Family'
                    ? 'mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ac-highlight px-4 py-2 text-sm font-semibold text-ac-primary transition-colors hover:bg-ac-highlight/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-ring'
                    : 'mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ac-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ac-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-ring'
                }
              >
                Apply  this cover <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── promise-band.tsx ─ */
function PromiseBand() {
  return (
    <section aria-label="Our promises" className="amani-promise-band bg-ac-primary text-ac-onprimary">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="amani-section-intro amani-section-intro--light">
          <div className="amani-section-index amani-section-index--light"><b>02</b><span>Our promise</span></div>
          <div className="amani-section-copy">
            <h2 className="font-serif font-medium text-white">Care that stays with your family.</h2>
            <p className="mt-3 leading-relaxed text-white/70">Clear cover, thoughtful support and a real person to help when your family needs us.</p>
          </div>
        </div>
        <div className="grid divide-y divide-ac-onprimary/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {promises.map((item, index) => (
            <div key={item.title} className="amani-promise-item flex gap-5 py-9 sm:px-8 first:sm:pl-0">
              <span className="font-serif text-2xl italic text-ac-highlight">0{index + 1}</span>
              <div>
                <h3 className="font-serif text-2xl">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ac-onprimary/70">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImageInterlude() {
  return (
    <section id="about" className="amani-image-interlude" aria-labelledby="amani-promise-title">
      <div className="amani-image-interlude__content">
        <span className="amani-image-interlude__eyebrow">Amani Cover</span>
        <h2 id="amani-promise-title" className="amani-image-interlude__title">
          More than a policy. <em>A promise to your family.</em>
        </h2>
        <p className="amani-image-interlude__intro">
          Amani means peace. For over 25 years, Montenzuma Monalisa Funeral Home
          has walked beside families through loss. Amani Cover is our funeral
          insurance, built so the people you love never have to face the cost
          of saying goodbye alone.
        </p>
        <ul className="amani-image-interlude__points">
          {aboutPoints.map((point) => (
            <li key={point}>
              <Check size={16} aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <div className="amani-image-interlude__promises">
          {moments.map((moment) => (
            <article key={moment.label}>
              <h3>{moment.caption}</h3>
              {moment.sw && <p>{moment.sw}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ── how-it-works.tsx ─────────────────────────────────────────── */
function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 px-6 py-20 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        {/* Two columns: the pitch on the left, the numbered rows on the right. */}
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <div className="amani-section-index mb-4"><b>04</b><span>A gentler process</span></div>
            <h2 className="mt-4 font-serif text-[clamp(2.25rem,4.5vw,3.5rem)] font-medium leading-[1.05] tracking-tight text-balance text-ac-primary">
              Protection, in three simple steps.
            </h2>
            <p className="mt-5 max-w-sm leading-relaxed text-ac-mutedfg">
              You do not have to figure it all out at once. We make every part of your funeral
              cover clear, personal and easy to understand.
            </p>
            <a
              href="#apply"
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ac-primary px-7 text-sm font-semibold text-white shadow-lg shadow-ac-primary/20 transition-colors hover:bg-ac-primary/90"
            >
              Explore your options
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>

          {/* Rows rather than cards: number · title · description on one line,
              separated by hairlines so the block reads as a single list. */}
          <div className="grid gap-0 border-t border-ac-border">
            {steps.map((step) => (
              <div
                key={step.num}
                className="grid gap-3 border-b border-ac-border py-6 sm:grid-cols-[64px_1fr] sm:gap-6 lg:grid-cols-[64px_minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center"
              >
                <span className="font-serif text-2xl italic text-ac-accent">{step.num}</span>
                <h3 className="font-serif text-2xl leading-snug text-ac-primary">{step.title}</h3>
                <p className="text-sm leading-6 text-ac-mutedfg">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>


      </div>
    </section>
  );
}

/* ── apply-form.tsx ───────────────────────────────────────────── */
/* The real application document lives in its own module — see
   amaniAplicationForm.jsx. This section is only the page shell: it owns the
   #apply anchor that every "Find your cover" / "Get covered" CTA links to, and
   supplies the page background + vertical rhythm. All form markup, validation
   and styling belong to the child. */
function ApplySection() {
  return (
    <section id="apply" className="scroll-mt-20 bg-ac-bg py-20 text-ac-ink lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="amani-section-intro">
          <div className="amani-section-index"><b>05</b><span>Start your application</span></div>
          <div className="amani-section-copy">
            <h2 className="font-serif font-medium text-ac-primary">A simple first step towards peace of mind.</h2>
            <p className="mt-3 leading-relaxed text-ac-mutedfg">Tell us who you would like to protect. Our team will guide you through the next steps.</p>
          </div>
        </div>
        <AmaniApplicationForm />
      </div>
    </section>
  );
}

/* ── claim.tsx ────────────────────────────────────────────────── */
/* Members who already hold cover must not be pushed through the application
   form, and the page previously had NO way to start a claim at all. The
   button routes to the claims page. */
function ClaimBand() {
  return (
    <section
      id="claim"
      className="amani-claim-band scroll-mt-20 border-t border-ac-border bg-ac-card px-6 py-16 lg:px-10 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="amani-section-index mb-5"><b>06</b><span>Here when you need us</span></div>
        <div className="amani-claim-card flex flex-col gap-8 bg-ac-primary p-8 text-white sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-12">
          <div className="max-w-xl">
          {/* Kiswahili accent — "Ndiyo" = "Yes", a warm answer to the question
              the eyebrow asks. Everything after stays English. */}
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ac-highlight">
            Already covered? Ndiyo, tuko pamoja.
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
            Make a claim.
          </h2>
          <p className="mt-3 leading-relaxed text-ac-onprimary/80">
            We keep the claims process simple at a difficult time. Submit your claim and a
            dedicated coordinator will explain the next steps and stand beside your family
            through the process.
          </p>
        </div>

        <Link
          to="/amani/claims"
          className="inline-flex h-13 shrink-0 items-center justify-center gap-2.5 rounded-xl bg-ac-accent px-8 text-base font-medium text-white shadow-lg shadow-ac-accent/25 transition-colors hover:bg-ac-accent/90"
        >
          Submit a claim
          <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}