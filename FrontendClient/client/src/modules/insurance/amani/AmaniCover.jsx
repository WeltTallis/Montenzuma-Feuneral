

import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  FileCheck2,
  LockKeyhole,
  Phone,
  PhoneCall,
  Plus,
  ShieldCheck,
  Star,
} from 'lucide-react';
import {
  CONTACT,
  PHOTOS,
  aboutPoints,
  coverOptions,
  faqs,
  moments,
  promises,
  steps,
} from './amaniData';
import { AmaniFooter, AmaniNav, FillImage } from './AmaniUi';
import './AmaniCover.css';

/* In-page anchors shown in the header, matching the redesign's navLinks. */
const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#how', label: 'How it works' },
  { href: '#faq', label: 'Questions' },
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
        <CareTeam />
        <HowItWorks />
        <Faq />
        <ApplyForm />
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
            Amani Cover helps your family honour a life with dignity  without carrying the
            financial burden alone. Prepare today, so tomorrow they can simply be together.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#apply"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-ac-primary px-7 text-base font-medium text-ac-onprimary shadow-lg shadow-ac-primary/20 transition-colors hover:bg-ac-primary/90"
            >
              Find your cover
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <a
              href={CONTACT.phoneHref}
              className="inline-flex h-13 items-center justify-center rounded-xl border border-ac-primary/20 px-7 text-base font-medium text-ac-primary transition-colors hover:bg-ac-primary/5"
            >
              Speak to someone
            </a>
          </div>

          <div className="mt-12 flex items-center gap-5 border-t border-ac-border pt-8">
            <div className="flex -space-x-3">
              {AVATARS.map((avatar) => (
                <span
                  key={avatar.src}
                  className="relative size-12 overflow-hidden rounded-full ring-4 ring-ac-bg"
                >
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
              <p className="mt-1 text-sm text-ac-mutedfg">Trusted by 12,000+ families</p>
            </div>
          </div>
        </div>


        <div className="relative">
          <div className="grid aspect-[5/5.4] grid-cols-6 grid-rows-6 gap-4">
            <div className="relative col-span-4 row-span-6 overflow-hidden rounded-t-[999px] rounded-b-[2.5rem] shadow-2xl shadow-ac-primary/15">
              <FillImage
                src={PHOTOS.familyHero}
                alt="A multigenerational family embracing together on a sofa in warm afternoon light"
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 66vw, 35vw"
              />
            </div>
            <div className="relative col-span-2 row-span-3 mt-10 overflow-hidden rounded-[2rem]">
              <FillImage
                src={PHOTOS.whiteLilies}
                alt="White lilies and roses in a glass vase beside a framed family photo"
                className="object-cover"
                sizes="(max-width: 1024px) 33vw, 18vw"
              />
            </div>
            <div className="relative col-span-2 row-span-3 mb-10 overflow-hidden rounded-[2rem]">
              <FillImage
                src={PHOTOS.elderlyCouple}
                alt="An elderly couple holding hands and smiling on their porch"
                className="object-cover"
                sizes="(max-width: 1024px) 33vw, 18vw"
              />
            </div>
          </div>

          <figure className="absolute -bottom-8 left-4 max-w-xs rounded-2xl border border-ac-border bg-ac-card p-5 shadow-xl shadow-ac-primary/10 sm:left-[-2rem]">
            <blockquote className="font-serif text-lg leading-snug text-ac-primary">
              &ldquo;When Mama passed, they carried everything. We could simply grieve together.&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-xs text-ac-mutedfg">Grace W., Amani Cover member</figcaption>
          </figure>

          <div className="absolute top-8 left-4 flex items-center gap-3 rounded-full bg-ac-primary px-4 py-2.5 text-ac-onprimary shadow-lg sm:left-[-1rem]">
            <ShieldCheck className="size-5 text-ac-highlight" aria-hidden="true" />
            <span className="text-sm font-medium">Covered by Montenzuma</span>
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
            When the hardest day comes, we take care of the arrangements  so your family can hold
            each other, not paperwork.
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
                  <span className="inline-block rounded-full bg-ac-bg/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ac-primary sm:px-3 sm:py-1 sm:text-xs">
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


/* ── about.tsx ────────────────────────────────────────────────── */
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
              <p className="text-sm italic text-ac-onprimary/85">Peace  You Deserve</p>
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
            For over 25 years, Montenzuma Monalisa Funeral Home has walked beside families in their
            hardest moments. Amani Cover brings that same care forward  so the people you love are
            never left to face it alone.
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

/* ── care-team.tsx ────────────────────────────────────────────── */
const CARE_FEATURES = [
  { icon: PhoneCall, title: 'One call, day or night', text: 'A real person answers our family line, 24 hours a day.' },
  { icon: FileCheck2, title: 'We handle the paperwork', text: 'Your dedicated planner coordinates every arrangement.' },
  { icon: Clock, title: 'Support that stays', text: 'We check in with your family long after the service.' },
];

function CareTeam() {
  return (
    <section aria-labelledby="care-title" className="px-6 lg:px-10">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-ac-primary text-ac-onprimary">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[22rem] lg:min-h-full">
            <FillImage
              src={PHOTOS.consultant}
              alt="A caring Amani advisor talking with a mother and her adult daughter at home"
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ac-highlight">
              Your family planner
            </p>
            <h2
              id="care-title"
              className="mt-4 font-serif text-[clamp(2.25rem,4vw,3.25rem)] font-medium leading-[1.05] tracking-tight text-balance"
            >
              Someone who knows your name  and your family&rsquo;s wishes.
            </h2>
            <p className="mt-6 leading-relaxed text-ac-onprimary/75 text-pretty">
              Every Amani member is paired with a trained planner who listens first, explains
              everything plainly, and stands beside your family when it matters most.
            </p>

            <ul className="mt-10 flex flex-col gap-6">
              {CARE_FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ac-onprimary/10 ring-1 ring-ac-onprimary/15">
                    <Icon className="size-5 text-ac-highlight" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-serif text-xl">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ac-onprimary/70">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <a
              href={CONTACT.phoneHref}
              className="mt-10 inline-flex h-12 items-center justify-center rounded-xl bg-ac-bg px-7 text-sm font-semibold text-ac-primary transition-colors hover:bg-ac-bg/90"
            >
              Call {CONTACT.phone}
            </a>
          </div>
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
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ac-accent">
            A gentler process
          </p>
          <h2 className="mt-4 font-serif text-[clamp(2.25rem,4.5vw,3.5rem)] font-medium leading-[1.05] tracking-tight text-balance text-ac-primary">
            Three simple steps to peace of mind.
          </h2>
        </div>

        <ol className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t-2 border-ac-primary pt-6">
              <span className="font-serif text-5xl text-ac-accent">{index + 1}</span>
              <h3 className="mt-4 font-serif text-2xl text-ac-primary">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-ac-mutedfg">{step.desc}</p>
            </li>
          ))}
        </ol>

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

/* ── faq.tsx ──────────────────────────────────────────────────── */
function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 px-6 py-20 lg:px-10 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ac-accent">Questions</p>
          <h2 className="mt-4 font-serif text-[clamp(2.25rem,4.5vw,3.5rem)] font-medium leading-[1.05] tracking-tight text-balance text-ac-primary">
            Honest answers, kindly given.
          </h2>
          <p className="mt-5 leading-relaxed text-ac-mutedfg">
            {`Can't find what you're looking for? Call us on `}
            <a href={CONTACT.phoneHref} className="font-medium text-ac-primary underline underline-offset-4">
              {CONTACT.phone}
            </a>
            .
          </p>
        </div>

        {/* Native <details> — no React state needed, matches the redesign and
            keeps the accordion keyboard/screen-reader behaviour for free. */}
        <div className="divide-y divide-ac-border border-y border-ac-border">
          {faqs.map((item) => (
            <details key={item.q} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-serif text-xl text-ac-primary [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-ac-border transition-transform group-open:rotate-45">
                  <Plus className="size-4" aria-hidden="true" />
                </span>
              </summary>
              <p className="mt-4 max-w-2xl leading-relaxed text-ac-mutedfg">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ── apply-form.tsx ───────────────────────────────────────────── */
const fieldClass =
  'mt-2 h-12 w-full rounded-xl border border-ac-input bg-ac-bg px-4 text-base text-ac-primary placeholder:text-ac-mutedfg/70 outline-none transition focus:border-ac-accent focus:ring-3 focus:ring-ac-accent/20';
const labelClass = 'block text-sm font-medium text-ac-primary';

function ApplyForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="apply" className="scroll-mt-20 bg-ac-bg px-6 py-20 text-ac-ink lg:px-10 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ac-accent">
            Ready when you are
          </p>
          <h2 className="mt-4 font-serif text-[clamp(2.25rem,4.5vw,3.75rem)] font-medium leading-[1.05] tracking-tight text-balance text-ac-primary">
            Your family&rsquo;s peace <em className="text-ac-accent">begins here.</em>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ac-mutedfg text-pretty">
            Leave your details and a member of our team will call to explain your options —
            clearly, kindly, and with no pressure at all.
          </p>

          <div className="relative mt-10 pb-10 sm:pb-8">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
              <FillImage
                src={PHOTOS.applying}
                alt="A mother calmly applying for cover on her laptop at home while her daughter rests a hand on her shoulder"
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </div>
            <a
              href={CONTACT.phoneHref}
              className="absolute bottom-0 left-4 right-4 flex items-center gap-4 rounded-2xl border border-ac-border bg-ac-card p-4 text-ac-oncard shadow-xl transition-transform hover:-translate-y-0.5 sm:left-6 sm:right-auto sm:p-5"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ac-primary text-ac-onprimary">
                <Phone className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm text-ac-mutedfg">Prefer to talk now?</span>
                <span className="block font-serif text-2xl text-ac-primary">{CONTACT.phone}</span>
              </span>
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-ac-border bg-ac-card p-7 text-ac-oncard shadow-2xl sm:p-10">
          {submitted ? (
            <div className="flex flex-col items-center py-10 text-center" role="status">
              <span className="grid size-16 place-items-center rounded-full bg-ac-primary/10 text-ac-primary">
                <Check className="size-7" aria-hidden="true" />
              </span>
              <h3 className="mt-6 font-serif text-3xl text-ac-primary">Thank you.</h3>
              <p className="mt-3 max-w-sm leading-relaxed text-ac-mutedfg">
                We&rsquo;ve received your request. A caring member of our team will call you
                within one working day.
              </p>
            </div>
          ) : (
            <ApplyFields onDone={() => setSubmitted(true)} />
          )}
        </div>
      </div>
    </section>
  );
}


/* Split out so ApplyForm stays readable — same markup as the redesign. */
function ApplyFields({ onDone }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onDone();
      }}
    >
      <h3 className="font-serif text-3xl text-ac-primary">Begin your Amani Cover</h3>
      <p className="mt-1 text-sm text-ac-mutedfg">
        Takes about 2 minutes. We will guide you from here.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <label className={`${labelClass} sm:col-span-2`}>
          Full name
          <input
            required
            name="name"
            autoComplete="name"
            className={fieldClass}
            placeholder="Your name"
          />
        </label>
        <label className={labelClass}>
          Phone number
          <input
            required
            type="tel"
            name="phone"
            autoComplete="tel"
            className={fieldClass}
            placeholder="Your phone"
          />
        </label>
        <label className={labelClass}>
          Email <span className="font-normal text-ac-mutedfg">(optional)</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            className={fieldClass}
            placeholder="you@example.com"
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Cover you&rsquo;re interested in
          {/* defaultValue on <select> rather than `selected` on an <option> —
              the latter leaves the field uncontrolled and logs a React warning. */}
          <select name="cover" defaultValue="Spouse and children" className={fieldClass}>
            {coverOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        className="mt-8 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-ac-primary text-base font-medium text-ac-onprimary transition-colors hover:bg-ac-primary/90"
      >
        Request a call
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>

      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-ac-border pt-5 text-xs text-ac-mutedfg">
        <li className="flex items-center gap-1.5">
          <LockKeyhole className="size-3.5" aria-hidden="true" /> Secure enquiry
        </li>
        <li className="flex items-center gap-1.5">
          <Check className="size-3.5" aria-hidden="true" /> No obligation
        </li>
        <li className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" aria-hidden="true" /> Confidential
        </li>
      </ul>
    </form>
  );
}

