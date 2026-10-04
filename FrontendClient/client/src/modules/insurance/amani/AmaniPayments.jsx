/* ==========================================================================
   Amani Cover — PAYMENTS PAGE  (/amani/payments)

   Standard Amani shell (nav -> page header -> content -> footer) around ONE
   section: the member payment portal, <AmaniPayPortal>.

   That section is a direct port of the standalone `amani/pay/` design
   prototype and owns the whole flow:
     1. The visitor types their policy number - which, for Amani Cover, IS
        their national ID number: the single thing printed on the policy card.
     2. We ask insurance-service whether cover exists for it
        (POST /insurance/cover-check). That endpoint returns ONLY whether cover
        was found plus its type/status/count - never the holder's name, phone,
        members or claims. So this page cannot become a way to look a person up.
     3. Only on a hit does the payment step appear.

   The lookup used to live here as <CoverLookup>/<PaymentPanel>; both were
   removed when the portal took over, because the design's plan/receipt states
   are only reachable from inside the portal's own state machine.

   The "Need a hand?" contact card was dropped from this page on request - it
   repeated the branch details. The information itself is untouched: CONTACT in
   amaniData.js is unchanged and still feeds the landing page, the portal's
   error copy and <AmaniFooter>'s address block.

   THERE IS STILL NO PAYMENT GATEWAY WIRED UP - see the note at the top of
   AmaniPayPortal.jsx.
   ========================================================================== */

import { AmaniFooter, AmaniNav, PageHeader } from './AmaniUi';
import AmaniPayPortal from './AmaniPayPortal';
import './AmaniCover.css';

export default function AmaniPayments() {
  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/payments" />

      <PageHeader
        eyebrow="Already covered?"
        title="Make a"
        accent="payment."
        intro="Keeping your Amani Cover up to date is simple. Check your policy below and we will show you how to contribute — or if you are unsure, call us and we will walk you through it."
      />

      <main className="px-4 pb-16 pt-10 sm:px-6 lg:px-10 lg:pb-20">
        <div className="mx-auto max-w-5xl">
          {/* Lookup + payment step. AmaniPayPortal owns both (it has to — the
              design's plan/receipt states are only reachable after a hit). */}
          <AmaniPayPortal />
        </div>
      </main>

      <AmaniFooter />
    </div>
  );
}
