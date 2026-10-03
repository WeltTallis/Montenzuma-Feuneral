import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Star,
} from 'lucide-react';
import {
  PHOTOS,
  aboutPoints,
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
];

export default function AmaniCover() {
  return (
    <div className="amani-cover">
      <AmaniNav inPageLinks={NAV_LINKS} active="/amani/cover" />

      <main id="top">
        <Hero />
        <PromiseBand />
        <Moments />
        <About />
        <HowItWorks />
        <ApplySection />
        <ClaimBand />
      </main>

      <AmaniFooter />
    </div>
  );
}

/* ── hero.tsx ─────────────────────────────────────────────────── */
const AVATARS = [
  { src: PHOTOS.motherDaughter, alt: '' },
  { src: PHOTOS.elderlyCouple, alt: '' },
  { src: PHOTOS.fatherSon, alt: '' },
];

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 pt-10 pb-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:px-10 lg:pt-16 lg:pb-28">
        <div>
          {/* The "By Montenzuma Monalisa Funeral Home" eyebrow pill that used to
              sit above this headline was removed on request — that attribution
              now lives on the hero photo badge ("Covered by Montenzuma"). */}
          <h1 className="font-serif text-[clamp(2.75rem,6vw,5rem)] font-medium leading-[1.02] tracking-tight text-balance text-ac-primary">
            Peace of mind for the ones you <em className="text-ac-accent">love most.</em>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ac-mutedfg text-pretty">
            Amani means peace. Amani Cover is funeral insurance that lets your family say goodbye
            with dignity, without worrying about the cost. Offered by Montenzuma Monalisa Funeral
            Home, trusted by families for over 25 years.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Now a real client-side route to /amani/cover/apply rather than an
                #apply jump. The #apply anchor scrolls to the embedded form on
                this same page; the standalone application page is the fuller
                document and is what the button promises. Matches the header CTA
                wording - "Get covered" names the action instead of describing
                what the button does. */}
            <Link
              to="/amani/cover/apply"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-ac-primary px-7 text-base font-medium text-white shadow-lg shadow-ac-primary/20 transition-colors hover:bg-ac-primary/90"
            >
              Get covered
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            {/* Real client-side route — see /amani/payments in AppRouter.
                Was bg-ac-accent (#1f56c4) - a brighter blue that read as a
                lighter tier next to the navy "Get covered". Now bg-ac-ink
                (#0f3040), the dark desaturated teal-navy already in the Amani
                palette, so the pair is clearly two different colours without
                introducing a hue that is not part of the brand. */}
            <Link
              to="/amani/payments"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-ac-ink px-7 text-base font-medium text-white shadow-lg shadow-ac-ink/20 transition-colors hover:bg-ac-ink/90"
            >
              Make a payment
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-5 border-t border-ac-border pt-8">
            <div className="flex -space-x-3">
              {AVATARS.map((avatar) => (
                <span
                  key={avatar.src}
                  className="relative size-12 overflow-hidden rounded-full ring-4 ring-ac-bg"
                >
                  {/* These avatars render at size-12 (48px). An explicit
                      `sizes="48px"` makes the browser pick the smallest
                      variant; without a correct value it would assume 100vw
                      and download a full-size photo for a 48px circle. */}
                  <FillImage src={avatar.src} alt={avatar.alt} sizes="48px" className="object-cover" />
                </span>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5 text-ac-accent" aria-label="Rated 4.9 out of 5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" aria-hidden="true" />
                ))}
                <span className="ml-2 text-sm font-semibold text-ac-primary">4.9</span>
              </div>
              <p className="mt-1 text-sm text-ac-mutedfg">Trusted by families across Kenya</p>
            </div>
          </div>
        </div>


        {/* MOBILE: this was `aspect-[5/5.4] grid-cols-6 grid-rows-6` at every width, so
            a 390px phone got a 6-column collage squeezed into ~350px (each
            photo ~55px wide) inside a box 380px TALL — unreadable thumbnails
            and a huge empty scroll before the copy. It now collapses to one
            hero photo on phones, which is the only one that matters, and the
            two supporting photos sit side by side underneath it. */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:aspect-[5/5.4] lg:grid-cols-6 lg:grid-rows-6">
              {/* FillImage is position:absolute, so every frame needs an explicit
                  ratio or the grid row collapses to 0px tall on mobile. */}
              <div className="relative col-span-2 row-span-1 aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl shadow-ac-primary/15 sm:aspect-[16/11] sm:rounded-t-[999px] sm:rounded-b-[2.5rem] lg:col-span-4 lg:row-span-6 lg:aspect-auto lg:rounded-t-[999px] lg:rounded-b-[2.5rem]">
                <FillImage
                  src={PHOTOS.familyHero}
                  alt="A multigenerational family embracing together on a sofa in warm afternoon light"
                  priority
                  className="object-cover"
                  /* One column on phones, the 4-of-6 collage slot from lg up.
                     Getting this right is what makes the browser pick the 640w
                     file on a small screen instead of the 1024w one. */
                  sizes="(max-width: 1023px) 92vw, 38vw"
                />
              </div>
              <div className="relative col-span-1 row-span-1 aspect-square overflow-hidden rounded-[2rem] lg:col-span-2 lg:row-span-3 lg:mt-10 lg:aspect-auto">
                <FillImage
                  src={PHOTOS.whiteLilies}
                  alt="White lilies and roses in a glass vase beside a framed family photo"
                  className="object-cover"
                  sizes="(max-width: 1023px) 46vw, 18vw"
                />
              </div>
              <div className="relative col-span-1 row-span-1 aspect-square overflow-hidden rounded-[2rem] lg:col-span-2 lg:row-span-3 lg:mb-10 lg:aspect-auto">
                <FillImage
                  src={PHOTOS.elderlyCouple}
                  alt="An elderly couple holding hands and smiling on their porch"
                  className="object-cover"
                  sizes="(max-width: 1023px) 46vw, 18vw"
                />
              </div>
            </div>

          <figure
            className="
    absolute
    -bottom-14
    left-[-2rem]
    w-[24rem]
    max-w-[calc(100vw-1.5rem)]
    rounded-2xl
    border
    border-ac-border
    bg-ac-card
    p-3
    shadow-xl
    shadow-ac-primary/10

    sm:-bottom-8
    sm:left-[-9.8rem]
    sm:w-[24rem]
  "
          >
            <blockquote className="font-serif text-lg leading-snug text-ac-primary">
              &ldquo;When Mama passed, our cover took care of everything. We could simply grieve together.&rdquo;
            </blockquote>

            <figcaption className="mt-3 text-xs text-ac-mutedfg">
              Grace W., Amani Cover member
            </figcaption>
          </figure>


          <div className="absolute top-8 left-4 flex items-center rounded-2xl  gap-3  bg-ac-primary px-4 py-2.5 text-ac-onprimary shadow-lg sm:left-[-1rem]">
            <ShieldCheck className="size-5 text-ac-highlight" aria-hidden="true" />
            <span className="text-sm font-medium">Covered by Montenzuma Funeral</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── promise-band.tsx ─────────────────────────────────────────── */
function PromiseBand() {
  return (
    <section aria-label="Our promises" className="bg-ac-primary text-ac-onprimary">
      <div className="mx-auto grid max-w-7xl divide-y divide-ac-onprimary/10 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-10">
        {promises.map((item, index) => (
          <div key={item.title} className="flex gap-5 py-9 sm:px-8 first:sm:pl-0">
            <span className="font-serif text-2xl italic text-ac-highlight">0{index + 1}</span>
            <div>
              <h2 className="font-serif text-2xl">{item.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ac-onprimary/70">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

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

        <figure className="relative mt-20 overflow-hidden rounded-[2rem]">
          <div className="relative aspect-[16/10] sm:aspect-[21/9]">
            <FillImage
              src={PHOTOS.familyWalk}
              alt="Three generations of a family walking hand in hand through a park at sunset"
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ac-primary/85 via-ac-primary/25 to-transparent" />
          <figcaption className="absolute inset-x-0 bottom-0 p-8 sm:p-12">
            <p className="max-w-2xl font-serif text-[clamp(1.5rem,3vw,2.5rem)] leading-tight text-ac-onprimary text-balance">
              &ldquo;Care that respects every life, every story, every family.&rdquo;
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-ac-onprimary/70">
              The Montenzuma Monalisa promise
            </p>
          </figcaption>
        </figure>
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
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ac-highlight">
            Already covered?
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