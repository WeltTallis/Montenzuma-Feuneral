import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Home,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import {
  PHOTOS,
  SW,
  aboutPoints,
  coverOptions,
  formatPlanAmount,
  moments,
  promises,
} from './amaniData';
import AmaniApplicationForm from './amaniAplicationForm';
import { AmaniFooter, AmaniNav, FillImage } from './AmaniUi';
import './AmaniCover.css';

/* In-page anchors shown in the header. The "Questions" (#faq) entry was
   removed with the FAQ section; leaving it would produce a header link that
   jumps to a section that no longer exists. */
const NAV_LINKS = [
  { href: '#about', label: 'About' },
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
  const planIcons = {
    Solo: UserRound,
    Family: UsersRound,
    Group: Home,
  };
  const planTitles = {
    Solo: 'Amani Solo',
    Family: 'Amani Family',
    Group: 'Amani Group',
  };

  return (
    <section id="plans" className="amani-plans scroll-mt-20">
      <div className="amani-plans__band">
        <h2 className="amani-plans__title">Choose the cover that fits your home</h2>
        <p className="amani-plans__intro">Simple monthly plans for you, your family and the relatives you support.</p>
      </div>

      <div className="amani-plans__row">
          {coverOptions.map((option) => {
            const PlanIcon = planIcons[option.value] || ShieldCheck;
            const title = planTitles[option.value] || option.label;
            return (
              <article
                key={option.value}
                className={`amani-card${option.value === 'Family' ? ' amani-card--featured' : ''}`}
              >
                {option.value === 'Family' && <span className="amani-card__badge">Most chosen</span>}
                <div className="amani-card__top">
                  <span className="amani-card__icon" aria-hidden="true">
                    <PlanIcon size={26} strokeWidth={1.8} />
                  </span>
                  <h3 className="amani-card__title">{title}</h3>
                </div>
                <p className="amani-card__who">{option.hint}</p>
                <div className="amani-card__pricebox">
                  <div className="amani-card__price">
                    <span className="amani-card__amount">{formatPlanAmount(option.value, option.monthly)}</span>
                    <span className="amani-card__period">/ month</span>
                  </div>
                  <p className="amani-card__cover">{option.features[0]}</p>
                </div>
                <ul className="amani-card__list">
                  {option.features.map((feature) => (
                    <li key={feature}>
                      <Check size={15} strokeWidth={3} aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link className="amani-card__button" to={`/amani/cover/apply?plan=${encodeURIComponent(option.value)}`}>
                  Choose {title}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
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
          className="amani-claim-band__button"
        >
          Submit a claim
          <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}