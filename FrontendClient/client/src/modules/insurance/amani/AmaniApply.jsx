/* ==========================================================================
   Amani Cover — APPLICATION PAGE  (/amani/cover/apply)

   The application document itself lives in amaniAplicationForm.jsx; this
   module is only the page shell around it — nav, a short back-link header and
   the shared footer — so the form gets a full page of its own instead of
   competing with the rest of the landing page.
   ========================================================================== */

import AmaniApplicationForm from './amaniAplicationForm';
import { AmaniFooter, AmaniNav, PageHeader } from './AmaniUi';
import './AmaniCover.css';

export default function AmaniApply() {
  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/cover/apply" />

      <PageHeader
        eyebrow="Amani Cover"
        title="A thoughtful step"
        accent="for your family."
        intro="Complete your details and choose the cover that feels right. Our team will confirm your application and help with the next steps."
      />

      <main className="bg-ac-bg px-4 py-10 sm:px-6 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="amani-section-index mb-6"><b>01</b><span>Your application</span></div>
          <AmaniApplicationForm />
        </div>
      </main>

      <AmaniFooter />
    </div>
  );
}