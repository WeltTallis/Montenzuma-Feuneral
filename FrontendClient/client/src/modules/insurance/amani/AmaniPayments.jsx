/* ==========================================================================
   Amani Cover — PAYMENTS PAGE  (/amani/payments)

   Reached from the hero's "Make a payment" CTA and the footer. There is no
   payment gateway wired up yet, so this page deliberately does NOT pretend to
   collect money — it explains how a contribution is made and routes the
   visitor to the branch. The paybill / bank details are marked PLACEHOLDER:
   fill them in from the real account before publishing, otherwise a customer
   could pay the wrong number.
   ========================================================================== */

import { AlertCircle, Building2, Mail, MapPin, Phone, Smartphone } from 'lucide-react';
import { CONTACT } from './amaniData';
import { AmaniFooter, AmaniNav, PageHeader } from './AmaniUi';
import './AmaniCover.css';

const METHODS = [
  {
    icon: Smartphone,
    title: 'M-Pesa',
    lines: [
      'Dial the USSD code we send you when your cover is activated.',
      'Send the contribution to the paybill number on your policy confirmation.',
    ],
    placeholder: true,
  },
  {
    icon: Building2,
    title: 'Bank transfer',
    lines: [
      'Transfer to the Montenzuma Monalisa Funeral Home account.',
      'Quote your policy number so the payment is matched to your cover.',
    ],
    placeholder: true,
  },
  {
    icon: Phone,
    title: 'By phone',
    lines: [
      `Call the branch on ${CONTACT.phone} and we will take the details with you.`,
      'Useful if you are paying on behalf of someone else.',
    ],
    placeholder: false,
  },
];

export default function AmaniPayments() {
  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/payments" />

      <PageHeader
        eyebrow="Already covered?"
        title="Make a"
        accent="payment."
        intro="Keeping your Amani Cover up to date is simple. Choose the method that suits you — and if you are unsure, call us and we will walk you through it."
      />

      <main className="px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {METHODS.map(({ icon: Icon, title, lines, placeholder }) => (
              <article key={title} className="rounded-[2rem] border border-ac-border bg-ac-card p-7 shadow-sm">
                <span className="grid size-11 place-items-center rounded-full bg-ac-primary/10 text-ac-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-6 font-serif text-xl text-ac-primary">{title}</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {lines.map((line) => (
                    <li key={line} className="text-sm leading-6 text-ac-mutedfg">
                      {line}
                    </li>
                  ))}
                </ul>
                {placeholder && (
                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-ac-bg px-3 py-2 text-xs leading-5 text-ac-mutedfg">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-ac-accent" aria-hidden="true" />
                    Paybill and account details are confirmed on your policy document.
                  </p>
                )}
              </article>
            ))}
          </div>

          <section className="mt-12 rounded-[2rem] bg-ac-primary p-8 text-ac-onprimary sm:p-10">
            <h2 className="font-serif text-2xl">Need a hand?</h2>
            <p className="mt-3 max-w-xl leading-relaxed text-ac-onprimary/80">
              Our care team will confirm your balance and take your payment details with you —
              clearly and kindly.
            </p>
            <address className="mt-7 grid gap-4 text-sm not-italic sm:grid-cols-3">
              <a href={CONTACT.phoneHref} className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary">Call</span>
                  {CONTACT.phone}
                </span>
              </a>
              <a href={CONTACT.emailHref} className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary">Email</span>
                  {CONTACT.email}
                </span>
              </a>
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ac-highlight" aria-hidden="true" />
                <span>
                  <span className="block text-ac-onprimary">Visit</span>
                  {CONTACT.address}
                </span>
              </p>
            </address>
          </section>
        </div>
      </main>

      <AmaniFooter />
    </div>
  );
}