import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Plane,
  Users,
} from 'lucide-react';
import {
  PHOTOS,
  SW,
  aboutPoints,
  coverOptions,
  formatPlanAmount,
  moments,
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
  { href: '#diaspora', label: 'Diaspora' },
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
        {/* About now sits where the Promise band used to be: the band was
            deleted and its slot became the About section ("Promise became
            About"), so the page reads Hero → Plans → About → Moments → How. */}
        <About />
        <Moments />
        <HowItWorks />
        <Diaspora />
        <ApplySection />
        <ClaimBand />
      </main>

      <AmaniFooter />
    </div>
  );
}

/* ── hero.tsx ─────────────────────────────────────────────────── */
/* download.webp IS the hero: full-bleed photo with a left-weighted scrim,
   the Montenzuma cover name and both CTAs set as ONE straight left-aligned
   column, and the quote card hanging off the bottom edge. */
function Hero() {
  return (
    <section className="relative isolate flex min-h-[75vh] flex-col justify-center overflow-hidden px-6 pb-28 pt-16 lg:min-h-[82vh] lg:px-10 lg:pb-32 lg:pt-20">
      {/* The hero photo — download.webp ONLY, full-bleed and crisp. Tailwind
          bg-cover/bg-center sizes it correctly (the old `.hero-slide` class was
          never defined in CSS, so the image rendered at natural size and tiled). */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/download.webp')" }}
        aria-hidden="true"
      />
      {/* A light left-weighted scrim keeps the white text legible WITHOUT the
          heavy navy wash that used to dull the whole photo. */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(100deg, rgba(16,45,67,0.45) 0%, rgba(16,45,67,0.18) 45%, rgba(16,45,67,0) 78%)' }}
        aria-hidden="true"
      />

      {/* Name + buttons — one straight column, hard to the left. */}
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-ac-highlight" aria-hidden="true" />
            {SW.heroHook}
          </p>

          <p className="mt-5 font-serif text-2xl font-medium leading-snug text-white drop-shadow-sm sm:text-3xl">
            Montenzuma Monalisa Funeral Home
            <span className="mt-1.5 block text-base font-normal italic text-white/80 sm:text-lg">
              Serving Kenyan families with dignity for over 25 years.
            </span>
          </p>

          {/* Buttons — same straight left edge as the name. */}
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row">
            <a
              href="#plans"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-white px-8 text-base font-semibold text-ac-primary shadow-xl shadow-black/25 transition-colors hover:bg-white/90"
            >
              Choose a cover
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <Link
              to="/amani/payments"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-white/40 bg-black/20 px-8 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
            >
              Make a payment
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* The quote — hanging off the bottom edge, clear of the left column. */}
      <figure className="absolute -bottom-8 left-1/2 z-20 w-[min(92vw,30rem)] -translate-x-1/2 rounded-2xl border border-ac-border bg-ac-card p-4 text-center shadow-2xl shadow-black/20 sm:left-auto sm:right-8 sm:translate-x-0 lg:-bottom-10 lg:right-12">
        <blockquote className="font-serif text-base italic leading-snug text-ac-primary sm:text-lg">
          &ldquo;You may never know when you will need it, but when the unexpected happens, having a plan can make the difference.&rdquo;
        </blockquote>
        <figcaption className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ac-mutedfg">
          Amani Cover
        </figcaption>
      </figure>
    </section>
  );
}



function PlanOptions() {
  return (
    <section id="plans" className="scroll-mt-20 px-2 py-10 lg:px-10 lg:py-18">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ac-accent">Choose your cover</p>
          <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-ac-primary sm:text-4xl">Know the contribution before you apply.</h2>
          <p className="mt-3 leading-relaxed text-ac-mutedfg">Select the option that fits the people you want to protect.</p>
        </div>
        <div className="grid items-stretch gap-5 pt-2 sm:grid-cols-2 xl:grid-cols-4">
          {coverOptions.map((option) => (
            <article
              key={option.value}
              className={
                option.value === 'Family'
                  ? 'relative flex min-h-52 flex-col rounded-2xl bg-ac-primary p-5 shadow-lg shadow-ac-primary/30 transition hover:-translate-y-1 xl:-translate-y-2 xl:hover:-translate-y-3'
                  : 'relative flex min-h-52 flex-col rounded-2xl bg-ac-card p-3 shadow-sm transition hover:-translate-y-1 hover:border-ac-accent hover:shadow-md'
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
                <span className={`text-sm font-normal ${option.value === 'Family' ? 'text-white/70' : 'text-ac-mutedfg'}`}>/ month</span>
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
                Apply this cover <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-5 text-xs leading-relaxed text-ac-mutedfg">Submitting an application does not activate cover. Our team will confirm your application and explain payment and start dates.</p>
      </div>
    </section>
  );
}

/* The Promise band (Simple / Flexible / Supportive) was removed: its slot in
   <main> now renders the About section instead ("Promise became About").
   The `promises` data stays in amaniData.js in case it is ever wanted back. */

/* ── moments.tsx ──────────────────────────────────────────────── */
function Moments() {
  return (
    <section aria-labelledby="moments-title" className="px-6 py-20 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ac-accent">
              Why families choose Amani
            </p>
            <h2
              id="moments-title"
              className="mt-4 font-serif text-[clamp(2.25rem,4.5vw,3.5rem)] font-medium leading-[1.05] tracking-tight text-balance text-ac-primary"
            >
              Because every family deserves to <em className="text-ac-accent">simply be together.</em>
            </h2>
          </div>
          <p className="max-w-sm leading-relaxed text-ac-mutedfg text-pretty">
            When the hardest day comes, your cover takes care of the costs and arrangements, so
            your family can hold each other instead of worrying about bills.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:mt-14 lg:auto-rows-[20rem] lg:grid-cols-3">
          {moments.map((moment, index) => {
            const featured = index === 0;
            return (
              <figure
                key={moment.src}
                className={`group relative overflow-hidden rounded-2xl sm:rounded-[2rem] ${featured
                  ? 'col-span-2 aspect-[4/3] sm:aspect-[16/9] lg:row-span-2 lg:aspect-auto'
                  : 'aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto'
                  }`}
              >
                <FillImage
                  src={moment.src}
                  alt={moment.alt}
                  sizes={moment.sizes}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ac-primary/85 via-ac-primary/10 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-8">
                  <span className="inline-block  bg-ac-bg/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ac-primary sm:px-3 sm:py-1 sm:text-xs">
                    {moment.label}
                  </span>
                  <p
                    className={`mt-2 max-w-md font-serif leading-snug text-ac-onprimary text-balance sm:mt-3 ${featured ? 'text-xl sm:text-2xl lg:text-3xl' : 'text-base sm:text-xl lg:text-2xl'
                      }`}
                  >
                    {moment.caption}
                  </p>
                  {/* Kiswahili accent — the proverb under the English caption:
                      "Ahadi ni deni" / "Watoto wetu, jukumu letu" / "Upendo haufi".
                      Renders only when a moment carries an `sw` line. */}
                  {moment.sw && (
                    <p className="mt-1 font-serif text-sm italic text-ac-highlight/90 sm:text-base">
                      {moment.sw}
                    </p>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}


/* ── about.tsx ─────── */
function About() {
  return (
    <section id="about" className="scroll-mt-20 px-6 py-20 lg:px-10 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="relative mx-auto grid w-full max-w-xl grid-cols-5 gap-3 sm:gap-4 lg:max-w-none">
          <div className="relative col-span-3 aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-[2rem]">
            <FillImage
              src={PHOTOS.grandmotherChild}
              alt="A grandmother holding her granddaughter close in a sunlit garden"
              className="object-cover"
              sizes="(max-width: 1024px) 60vw, 30vw"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-3 pt-8 sm:gap-4 sm:pt-16">
            <div className="relative aspect-square overflow-hidden rounded-2xl sm:rounded-[2rem]">
              <FillImage
                src={PHOTOS.hands}
                alt="Hands of three generations resting together on a table"
                className="object-cover"
                sizes="(max-width: 1024px) 40vw, 20vw"
              />
            </div>
            {/* "Amani means peace" — a roundish blue chip with white type, so
                the brand's meaning reads clearly against the white page. */}
            <div className="rounded-2xl bg-ac-primary p-5 text-center shadow-sm sm:p-7">
              <p className="font-serif text-xl text-ac-onprimary sm:text-2xl">Amani</p>
              <p className="text-sm italic text-ac-onprimary/85">means peace</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ac-accent">
            A cover born from care
          </p>
          <h2 className="mt-5 font-serif text-[clamp(2.25rem,4.5vw,3.5rem)] font-medium leading-[1.05] tracking-tight text-balance text-ac-primary">
            More than a policy. <em className="text-ac-accent">A promise to your family.</em>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ac-mutedfg text-pretty">
            Amani means peace. For over 25 years, Montenzuma Monalisa Funeral Home has walked
            beside families through loss. Amani Cover is our funeral insurance, built so the
            people you love never have to face the cost of saying goodbye alone.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {aboutPoints.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ac-primary text-ac-onprimary">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                <span className="leading-relaxed text-ac-primary">{point}</span>
              </li>
            ))}
          </ul>
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
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ac-accent">
              A gentler process
            </p>
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

/* ── diaspora.tsx ─────────────────────────────────────────────── */
/* Amani Diaspora — cover paid from abroad (GB → KE): a dark pitch panel
   with a live product card beside it.

   The design arrived as generic class names (page-width / dark-tag /
   diaspora-panel / country-card / route-line / metric-icon …) and a
   generic <Icon name="…" /> component, NONE of which exist in this app —
   pasted raw it would render unstyled with empty icon slots. It is rebuilt
   with this page's conventions instead: Tailwind + ac-* tokens, the serif
   display face, lucide-react icons (Plane / ArrowRight / Users).

   The CTA originally pointed at #contact — an anchor that exists nowhere
   in the codebase (a dead jump, like the #faq link removed from
   NAV_LINKS). "Cover family from abroad" now targets #apply, which is what
   it actually leads to; "See how it works" keeps #how, which does exist. */
function Diaspora() {
  return (
    <section id="diaspora" className="scroll-mt-20 px-6 py-16 lg:px-10 lg:py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 rounded-[2rem] bg-ac-primary p-8 text-white sm:p-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-14 lg:p-12">

        {/* ── copy ── */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-ac-highlight">
            <Plane className="size-4" aria-hidden="true" />
            Amani Diaspora
          </p>

          <h2 className="mt-5 font-serif text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-tight text-balance">
            You may be far away.<br />Your care doesn’t have to be.
          </h2>

          <p className="mt-5 max-w-xl leading-relaxed text-ac-onprimary/80 text-pretty">
            Protect the people you love back in Kenya. Pay securely from abroad while our local
            team handles every detail with dignity.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/amani/cover/apply?plan=Diaspora"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-white px-7 text-base font-medium text-ac-primary shadow-lg shadow-black/10 transition-colors hover:bg-white/90"
            >
              Cover family from abroad
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-white/25 px-7 text-base font-medium text-white transition-colors hover:bg-white/10"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* ── product card: the "International cover" live widget ── */}
        <div className="overflow-hidden rounded-3xl bg-ac-card text-ac-ink shadow-xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-ac-border px-6 py-5">
            <span className="text-sm font-extrabold text-ac-ink">International cover</span>
            <span className="flex items-center gap-2 text-xs font-bold text-emerald-600">
              <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
              Live
            </span>
          </div>

          <div className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ac-mutedfg">
              Send care home
            </p>

            {/* GB (you) → plane → KE (family) */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="flex flex-col items-center gap-0.5 rounded-2xl border border-ac-border bg-ac-bg px-5 py-3">
                <span className="text-xl leading-none" aria-hidden="true">🇬🇧</span>
                <span className="text-lg font-extrabold text-ac-primary">GB</span>
                <small className="text-[10px] font-bold uppercase tracking-wider text-ac-mutedfg">You</small>
              </span>
              <span className="flex flex-1 items-center gap-2 text-ac-accent" aria-hidden="true">
                <span className="h-px flex-1 bg-ac-border" />
                <Plane className="size-4 shrink-0" />
                <span className="h-px flex-1 bg-ac-border" />
              </span>
              <span className="flex flex-col items-center gap-0.5 rounded-2xl border border-ac-primary bg-ac-primary px-5 py-3">
                <span className="text-xl leading-none" aria-hidden="true">🇰🇪</span>
                <span className="text-lg font-extrabold text-white">KE</span>
                <small className="text-[10px] font-bold uppercase tracking-wider text-white/70">Family</small>
              </span>
            </div>

            {/* monthly cover + price */}
            <div className="mt-6 rounded-2xl bg-ac-bg p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-ac-mutedfg">
                <span>Monthly cover</span>
                <span>5 people</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <strong className="text-2xl font-extrabold text-ac-primary">KES 2,000<span className="ml-1 text-sm font-normal text-ac-mutedfg">/ month</span></strong>
                <span className="text-xs font-bold text-emerald-600">Ready to activate</span>
              </div>
            </div>

            {/* care-team metric */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-ac-border p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ac-primary/10 text-ac-accent">
                <Users className="size-5" aria-hidden="true" />
              </span>
              <span>
                <strong className="block text-sm text-ac-ink">Local care team</strong>
                <small className="text-xs text-ac-mutedfg">Available anywhere in Kenya</small>
              </span>
            </div>
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
    <section id="apply" className="scroll-mt-20 py-20 text-ac-ink lg:py-28">
      <AmaniApplicationForm />
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
      className="scroll-mt-20 border-t border-ac-border bg-ac-card px-6 py-16 lg:px-10 lg:py-20"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[2rem] bg-ac-primary p-8 text-white sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-12">
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
    </section>
  );
}