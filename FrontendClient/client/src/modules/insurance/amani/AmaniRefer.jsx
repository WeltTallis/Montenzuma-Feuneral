/* ==========================================================================
   Amani Cover — REFERRAL PAGE  (/amani/cover/refer)

   "Share the peace" lives on its own route: the referral pitch, the three-step
   explainer and the form are a self-contained experience, and inline on the
   landing page they read as a second competing call to action.
   ========================================================================== */

import { useState } from 'react';
import { Check, LockKeyhole, Phone, ShieldCheck, UserPlus } from 'lucide-react';
import { CONTACT, referSteps } from './amaniData';
import { AmaniFooter, AmaniNav, PageHeader } from './AmaniUi';
import './AmaniCover.css';

const fieldClass =
  'mt-2 h-12 w-full rounded-xl border border-ac-input bg-ac-bg px-4 text-base text-ac-primary placeholder:text-ac-mutedfg/70 outline-none transition focus:border-ac-accent focus:ring-3 focus:ring-ac-accent/20';
const labelClass = 'block text-sm font-medium text-ac-primary';

export default function AmaniRefer() {
  const [sent, setSent] = useState(false);

  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/cover/refer" />

      <PageHeader
        eyebrow="Share the peace"
        title="Know someone"
        accent="planning ahead?"
        intro="Refer a friend to Amani Cover. Because the best protection is the kind you’d recommend to the people you love."
      />

      <main className="px-6 py-20 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-16">
          {/* Left: what happens after they send the name. */}
          <div>
            <div className="rounded-[2rem] bg-ac-primary p-8 text-ac-onprimary sm:p-10">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-serif text-2xl">How a referral works</h2>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ac-onprimary/10">
                  <UserPlus className="size-5 text-ac-highlight" aria-hidden="true" />
                </span>
              </div>

              <ol className="mt-8">
                {referSteps.map((step, index) => (
                  <li key={step.num} className="relative flex gap-5 pb-7 last:pb-0">
                    {/* Connector rail between the numbered nodes, skipped on the
                        last step so the line does not dangle past it. */}
                    {index < referSteps.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-px bg-ac-onprimary/15"
                      />
                    )}
                    <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-ac-onprimary/20 bg-ac-primary font-serif text-sm italic text-ac-highlight">
                      {step.num}
                    </span>
                    <div className="pt-1.5">
                      <h3 className="font-serif text-lg leading-snug">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ac-onprimary/70">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-8 rounded-2xl bg-ac-onprimary/10 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ac-onprimary/55">
                  Rather talk?
                </p>
                <a
                  href={CONTACT.phoneHref}
                  className="mt-2 inline-flex items-center gap-2 font-serif text-2xl"
                >
                  <Phone className="size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                  {CONTACT.phone}
                </a>
              </div>
            </div>

            <p className="mt-6 flex items-start gap-3 leading-relaxed text-ac-mutedfg">
              <ShieldCheck className="mt-1 size-5 shrink-0 text-ac-accent" aria-hidden="true" />
              Referrals stay private. We never mention who sent them, and we only use their
              details to make that first call.
            </p>
          </div>

{/* Right: the form. Deliberately short — their name and number is all
              we need, which keeps referring to under a minute of effort. */}
          <div className="rounded-[2rem] border border-ac-border bg-ac-card p-8 shadow-xl shadow-ac-primary/5 sm:p-10">
            {sent ? (
              <div className="flex flex-col items-center py-10 text-center" role="status">
                <span className="grid size-16 place-items-center rounded-full bg-ac-primary/10 text-ac-primary">
                  <Check className="size-7" aria-hidden="true" />
                </span>
                <h2 className="mt-6 font-serif text-3xl text-ac-primary">Thank you.</h2>
                <p className="mt-3 max-w-sm leading-relaxed text-ac-mutedfg">
                  We&rsquo;ve passed their details to our care team. Someone will reach out
                  gently within one working day.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ac-accent">
                  Send a referral
                </p>
                <h2 className="mt-4 font-serif text-3xl leading-tight text-ac-primary sm:text-4xl">
                  Who crossed your mind?
                </h2>
                <p className="mt-4 leading-relaxed text-ac-mutedfg">
                  Leave their details and our care team will reach out gently on your behalf.
                </p>

                <form
                  className="mt-8 flex flex-col gap-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setSent(true);
                  }}
                >
                  <label className={labelClass}>
                    Their name
                    <input
                      required
                      name="referredName"
                      className={fieldClass}
                      placeholder="Their full name"
                    />
                  </label>
                  <label className={labelClass}>
                    Their phone number
                    <input
                      required
                      type="tel"
                      name="referredPhone"
                      className={fieldClass}
                      placeholder="+254 7XX XXX XXX"
                    />
                  </label>
                  <label className={labelClass}>
                    Your name{' '}
                    <span className="font-normal text-ac-mutedfg">(optional)</span>
                    <input
                      name="referrerName"
                      className={fieldClass}
                      placeholder="Your name"
                    />
                  </label>

                  <button
                    type="submit"
                    className="mt-2 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-ac-primary text-base font-medium text-ac-onprimary transition-colors hover:bg-ac-primary/90"
                  >
                    Send referral
                    <UserPlus className="size-4" aria-hidden="true" />
                  </button>

                  <p className="flex items-center justify-center gap-2 text-center text-xs text-ac-mutedfg">
                    <LockKeyhole className="size-3" aria-hidden="true" />
                    Shared only so we can make that first call.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </main>

      <AmaniFooter />
    </div>
  );
}