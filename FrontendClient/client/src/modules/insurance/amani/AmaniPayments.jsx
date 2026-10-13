
import AmaniPayPortal from './AmaniPayPortal';
import { AmaniFooter, AmaniNav } from './AmaniUi';
import './AmaniCover.css';

export default function AmaniPayments() {
  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/payments" />
      <AmaniPayPortal showTopbar={false} />
      <AmaniFooter />
    </div>
  );
}
