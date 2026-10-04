/* ==========================================================================
   Amani Cover — CLAIMS PAGE  (/amani/claims)

   Deliberately just the page chrome around the form. The claim document
   (claimAplication.jsx) already renders its own brand strip, the "Submit a
   Claim" intro AND the "What's Needed" list, so this page must NOT add a
   PageHeader or repeat that document list — doing so stacked three headings
   and duplicated the document checklist above the form.

   Below the form sits <AmaniClaimTracker>, so a family who has ALREADY filed a
   claim can look up its progress instead of having to phone the branch. It is
   placed after the form, not before, because the overwhelmingly common reason
   to land here is to submit a first claim.
   ========================================================================== */

import ClaimSubmissionForm from './claimAplication';
import AmaniClaimTracker from './AmaniClaimTracker';
import { AmaniFooter, AmaniNav } from './AmaniUi';
import './AmaniCover.css';

export default function AmaniClaims() {
  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/claims" />

      <main className="bg-ac-bg">
        <ClaimSubmissionForm />
        <AmaniClaimTracker />
      </main>

      <AmaniFooter />
    </div>
  );
}