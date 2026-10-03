/* ==========================================================================
   Amani Cover — CLAIMS PAGE  (/amani/claims)

   Deliberately just the page chrome around the form. The claim document
   (claimAplication.jsx) already renders its own brand strip, the "Submit a
   Claim" intro AND the "What's Needed" list, so this page must NOT add a
   PageHeader or repeat that document list — doing so stacked three headings
   and duplicated the document checklist above the form.
   ========================================================================== */

import ClaimSubmissionForm from './claimAplication';
import { AmaniFooter, AmaniNav } from './AmaniUi';
import './AmaniCover.css';

export default function AmaniClaims() {
  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/claims" />

      <main className="bg-ac-bg">
        <ClaimSubmissionForm />
      </main>

      <AmaniFooter />
    </div>
  );
}