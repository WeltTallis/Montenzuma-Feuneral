
import { useParams } from 'react-router-dom';
import { AmaniFooter, AmaniNav, PageHeader } from './AmaniUi';
import AmaniPayPortal from './AmaniPayPortal';
import './AmaniCover.css';

export default function AmaniPayments() {
  const { code } = useParams();
  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/payments" />

      <PageHeader
        eyebrow="Current members"
        title="Check your"
        accent="contribution."
        intro={code ? "Use your secure Amani payment link to pay this policy by M-Pesa." : "Verify your registered cover and monthly contribution, then pay securely by M-Pesa."}
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
