/* ==========================================================================
   Amani Cover — TERMS PAGE  (/amani/cover/terms)

   Eligibility, waiting periods, exclusions and claims paperwork are dense
   reference material, so they live on their own route rather than pushing the
   landing page's fold down. Styled with the same tokens as the landing page.
   ========================================================================== */

import { Link } from 'react-router-dom';
import { Check, Phone, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import {
  CONTACT,
  claimDocuments,
  eligibility,
  exclusions,
  vision,
  waitingPeriods,
} from './amaniData';
import { AmaniFooter, AmaniNav, PageHeader } from './AmaniUi';
import './AmaniCover.css';

const CARD = 'amani-content-card rounded-2xl border border-ac-border bg-ac-card p-8 shadow-sm sm:p-10';
const CARD_ICON = 'grid size-11 place-items-center rounded-full bg-ac-primary/10 text-ac-primary';
const TICK = 'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ac-primary text-ac-onprimary';

export default function AmaniTerms() {
  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/cover/terms" />

      <PageHeader
        eyebrow="The cover, in detail"
        title="Clear terms,"
        accent="written plainly."
        intro="Everything below is the actual wording behind Amani Cover. Read it at your own pace — there is no obligation to apply, and we would rather you understood it first."
      />

      <main className="px-6 py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-5xl">
          {/* Vision / mission — the reason the product exists. */}
          <p className="amani-terms-vision border-l-[3px] border-ac-accent bg-ac-bg py-6 pl-6 pr-6 font-serif text-lg leading-relaxed text-ac-primary sm:text-xl">
            {vision}
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <article className={CARD}>
              <span className={CARD_ICON}>
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-6 font-serif text-2xl text-ac-primary">Eligibility</h2>
              <ul className="mt-5 flex flex-col gap-3">
                {eligibility.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-ac-primary">
                    <span className={TICK}>
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className={CARD}>
              <span className={CARD_ICON}>
                <Plus className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-6 font-serif text-2xl text-ac-primary">Waiting Period</h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-ac-accent">
                Retail Cover
              </p>
              <dl className="mt-5 divide-y divide-ac-border border-t border-ac-border">
                {waitingPeriods.map((row) => (
                  <div
                    key={row.cover}
                    className="flex items-baseline justify-between gap-4 py-4"
                  >
                    <dt className="leading-relaxed text-ac-mutedfg">{row.cover}</dt>
                    <dd className="shrink-0 font-serif text-xl text-ac-primary">{row.period}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </div>

<article className={`${CARD} mt-6`}>
            <span className={CARD_ICON}>
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-serif text-2xl text-ac-primary">Exclusions</h2>
            <p className="mt-2 leading-relaxed text-ac-mutedfg">
              Situations where a benefit is not payable under the policy.
            </p>
            <ol className="mt-6 flex flex-col gap-4">
              {exclusions.map((item, index) => (
                <li key={index} className="flex gap-4 leading-relaxed">
                  <span className="shrink-0 font-serif text-xl text-ac-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-ac-mutedfg">{item}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className={`${CARD} mt-6`}>
            <span className={CARD_ICON}>
              <Check className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-serif text-2xl text-ac-primary">
              Claims Documents Required for Benefit
            </h2>
            <p className="mt-2 leading-relaxed text-ac-mutedfg">
              What our team will ask for when a claim is made.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {claimDocuments.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl bg-ac-bg px-4 py-3 leading-relaxed text-ac-primary"
                >
                  <Check className="mt-1 size-4 shrink-0 text-ac-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          {/* Close: the two things someone reading the fine print wants next. */}
          <div className="mt-16 flex flex-col items-center gap-5 text-center">
            <p className="font-serif text-2xl text-ac-primary">Still deciding?</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/amani/cover#apply"
                className="inline-flex h-13 items-center justify-center rounded-xl bg-ac-primary px-7 text-base font-medium text-white transition-colors hover:bg-ac-primary/90"
              >
                Start an application
              </a>
              <a
                href={CONTACT.phoneHref}
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-ac-primary/20 px-7 text-base font-medium text-ac-primary transition-colors hover:bg-ac-primary/5"
              >
                <Phone className="size-4" aria-hidden="true" /> Talk it through
              </a>
            </div>
            <Link
              to="/amani/cover/refer"
              className="mt-2 text-sm font-medium text-ac-accent underline underline-offset-4"
            >
              Or refer someone you love
            </Link>
          </div>
        </div>
      </main>

      <AmaniFooter />
    </div>
  );
}