/* ==========================================================================
   Amani Cover — LANDING PAGE  (/amani/cover)

   A direct port of the redesign prototype at
   ../amani-cover-landing-page-redesign/ (app/page.tsx plus hero, promise-band,
   about, how-it-works, faq and apply-form). Every section below maps 1:1 to a
   component in that prototype, and the markup is kept as close to the original
   as React 18 allows so the page looks identical.

   Only three things changed:
     • next/image <Image fill> → <FillImage>
     • 'use client' dropped (a React app page is already a client)
     • every shadcn colour token renamed to its `ac-` twin (bg-primary →
       bg-ac-primary, text-accent → text-ac-accent, …) because Bootstrap already
       owns .text-primary / .bg-primary across ~100 places in this app.
       See the long note in src/index.css.

   Dense content lives on its own routes:
     /amani/cover/terms · /amani/cover/refer
   ========================================================================== */

import { useState } from 'react';
import {
  ArrowRight,
  Check,
  HeartHandshake,
  LockKeyhole,
  Phone,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { CONTACT, PHOTOS, aboutPoints, coverOptions, faqs, promises, steps } from './amaniData';
import { AmaniFooter, AmaniNav, FillImage } from './AmaniUi';
import './AmaniCover.css';

/* In-page anchors shown in the header, matching the redesign's navLinks. */
const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#how', label: 'How it works' },
  { href: '#faq', label: 'Questions' },
];

export default function AmaniCover() {
  return (
    <div className="amani-cover">
      <AmaniNav inPageLinks={NAV_LINKS} active="/amani/cover" />

      <main id="top">
        <Hero />
        <PromiseBand />
        <About />
        <HowItWorks />
        <Faq />
        <ApplyForm />
      </main>

      <AmaniFooter />
    </div>
  );
}

