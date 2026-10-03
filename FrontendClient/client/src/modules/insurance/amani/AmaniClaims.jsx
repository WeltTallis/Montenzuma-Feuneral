/* ==========================================================================
   Amani Cover — CLAIMS PAGE  (/amani/claims)

   The claim form document lives in claimAplication.jsx. This shell adds the
   page chrome and, above the form, the list of documents a claimant will be
   asked for — taking that list straight from amaniData.claimDocuments so the
   page can never contradict the Cover Terms page.
   ========================================================================== */

import { Check, Phone } from 'lucide-react';
import ClaimSubmissionForm from './claimAplication';
import { CONTACT, claimDocuments } from './amaniData';
import { AmaniFooter, AmaniNav, PageHeader } from './AmaniUi';
import './AmaniCover.css';

export default function AmaniClaims() {
  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/claims" />

      <PageHeader
        eyebrow="Already covered"
        title="Submit a"
        accent="claim."
        intro="Tell us what happened and a dedicated coordinator will take it from there — guiding you through every step and supporting your family through the process."
      />

      <main className="px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-5xl">
          {/* What we will ask for — same list the Terms page publishes. */}
          <section aria-labelledby="claim-docs" className="rounded-[2rem] border border-ac-border bg-ac-card p-8 shadow-sm sm:p-10">
            <h2 id="claim-docs" className="font-serif text-2xl text-ac-primary">
              What you will need
            </h2>
            <p className="mt-2 leading-relaxed text-ac-mutedfg">
              Bring these to your call — they speed up the claim considerably.
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

            <p className="mt-6 flex items-center gap-2 text-sm text-ac-mutedfg">
              <Phone className="size-4 text-ac-accent" aria-hidden="true" />
              Would rather talk it through? Call{' '}
              <a href={CONTACT.phoneHref} className="font-medium text-ac-primary underline underline-offset-4">
                {CONTACT.phone}
              </a>
            </p>
          </section>

          <div className="mt-14">
            <ClaimSubmissionForm />
          </div>
        </div>
      </main>

      <AmaniFooter />
    </div>
  );
}