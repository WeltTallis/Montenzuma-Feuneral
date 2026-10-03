/* ==========================================================================
   Amani Cover — APPLICATION PAGE  (/amani/cover/apply)

   The application document itself lives in amaniAplicationForm.jsx; this
   module is only the page shell around it — nav, a short back-link header and
   the shared footer — so the form gets a full page of its own instead of
   competing with the rest of the landing page.
   ========================================================================== */

import AmaniApplicationForm from './amaniAplicationForm';
import { AmaniFooter, AmaniNav } from './AmaniUi';
import './AmaniCover.css';

export default function AmaniApply() {
  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/cover/apply" />

      <main className="bg-ac-bg">
        <AmaniApplicationForm />
      </main>

      <AmaniFooter />
    </div>
  );
}