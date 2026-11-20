const PAYMENT_TERMINAL_IMAGE =
  'https://www.pesapal.com/media/118168/accept-fast-and-secure-transactions-a.png';

export default function CardPaymentIntegration() {
  return (
    <section id="card-payments" className="card-payment-section">
      <div className="card-payment-inner">
        <div className="card-payment-copy">
          <span className="card-payment-kicker">Available upon request :   PESAPAL</span>
          <h2>Card. Tap. Pay.</h2>
          <p>
            Card and contactless tap to pay integration can be added to your
            Rest Point payment workflow, giving families another convenient
            way to pay in person.
          </p>
          <p>
            Accept payments at the Frontdesk and keep your team 's payment process
            connected to the rest of your funeral home operations.
          </p>
        </div>
        <div className="card-payment-image">
          <img
            src={PAYMENT_TERMINAL_IMAGE}
            alt="Card payment terminal for tap and pay"
            loading="lazy"
          />
        </div>
      </div>

      <style>{`
        .card-payment-section {
          padding: clamp(4rem, 8vw, 7rem) 0;
          background-color:  #fff;
   
  
        }
        .card-payment-inner {
          width: min(1100px, 88%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
          align-items: center;
          gap: clamp(2rem, 6vw, 5rem);
        }
        .card-payment-kicker {
          display: inline-block;
          margin-bottom: 1rem;
          color: #8b7355;
          font-size: 0.74rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        #card-payments .card-payment-copy h2 {
          margin: 0 0 1.25rem;
          color: #000 !important;
          font-family: Fraunces, Georgia, serif;
          font-size: clamp(2.3rem, 5vw, 3.8rem);
          font-weight: 400;
          line-height: 1.08;
        }
        .card-payment-copy p {
          max-width: 54ch;
          margin: 0 0 1rem;
          color: #56514a;
          font-size: 1rem;
          line-height: 1.8;
        }
        .card-payment-image {
          overflow: hidden;
     
     
          box-shadow: 0 18px 48px rgba(26, 25, 22, 0.08);
        }
        .card-payment-image img {
          display: block;
          width: 100%;
          max-height: 450px;
          margin: 0 auto;
          object-fit: fill;
        }
        @media (max-width: 760px) {
          .card-payment-section { padding: 3.5rem 0; }
          .card-payment-inner {
            grid-template-columns: minmax(0, 1fr);
            gap: 2rem;
          }
          .card-payment-image { max-width: 540px; }
        }
        @media (max-width: 420px) {
          .card-payment-inner { width: 90%; }
          .card-payment-copy h2 { font-size: clamp(2rem, 10vw, 2.5rem); }
          .card-payment-copy p { font-size: 0.95rem; }
        }
      `}</style>
    </section>
  );
}
