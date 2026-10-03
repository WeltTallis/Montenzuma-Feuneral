'use client'


import { ArrowRight, Check, LockKeyhole, Phone, Plus, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useState } from 'react'


// Local assets from /public — self-hosted so the page never depends on a third-party CDN.
const familyPhoto = '/family-hero.png'
const aboutPhoto = 'https://images.unsplash.com/photo-1631613638629-159205c5fce7?auto=format&fit=crop&w=1200&q=88'
const promisePhoto = 'https://images.unsplash.com/photo-1741940365437-e55b919a89d3?auto=format&fit=crop&w=1800&q=90'
const supportPhoto = '/support-guide.png'

// Shared button styling — larger, fully rounded, with a lift + shadow on hover.
const btnBase =
  'h-14 gap-2.5 rounded-md border-0 px-8 text-[0.95rem] font-semibold tracking-tight shadow-[0_10px_30px_rgba(0,41,107,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,41,107,0.3)] active:translate-y-0 has-data-[icon=inline-end]:pr-8 has-data-[icon=inline-start]:pl-8 [&_svg:not([class*=\'size-\'])]:size-5'
const btnBlue = `${btnBase} bg-[var(--blue)] text-white hover:bg-[#0B3F8A]`
const btnPlum = `${btnBase} bg-[var(--plum)] text-white shadow-[0_10px_30px_rgba(95,15,64,0.25)] hover:bg-[#7A1250] hover:shadow-[0_18px_40px_rgba(95,15,64,0.32)]`

const benefitCards = [
  { num: '01', title: 'Dignified service', text: 'Support for a respectful funeral that reflects the life being honoured.' },
  { num: '02', title: 'Family flexibility', text: 'Choose protection that works for the size and needs of your family.' },
  { num: '03', title: 'Personal guidance', text: 'A dedicated care team to make every next step feel more manageable.' },
  { num: '04', title: 'Clear, simple cover', text: 'Straightforward plans and compassionate answers — without confusion.' },
]

const steps = [
  { num: '01', title: 'Tell us about yourself', desc: 'Share a few details so we can understand what protection feels right.' },
  { num: '02', title: 'Choose your cover', desc: 'Explore a plan and contribution that fits your family and your budget.' },
  { num: '03', title: 'Feel prepared', desc: 'Apply securely and keep your loved ones protected for the years ahead.' },
]

const faqs = [
  { question: 'Who can apply for Amani Cover?', answer: 'Adults seeking funeral protection for themselves or their family can apply. Our care team will help you choose the most suitable level of cover — kindly and without pressure.' },
  { question: 'Can I cover members of my family?', answer: 'Yes. Our Family and Legacy options are designed to protect multiple family members under one easy-to-manage plan.' },
  { question: 'When does my cover begin?', answer: 'Once your application is approved and your first contribution is received, your Amani Cover is active from day one. We will confirm everything in writing.' },
  { question: 'How do I make a claim?', answer: 'Call our support line at any time. A dedicated care coordinator will explain the next steps and support your family throughout the process.' },
  { question: 'What happens after I submit my application?', answer: 'We review your details, confirm your options, and contact you with clear next steps. There is no obligation to continue at any point.' },
]

const stripItems = [
  { title: 'Simple', text: 'Easy application and clear guidance' },
  { title: 'Flexible', text: 'Cover shaped around your family' },
  { title: 'Supportive', text: 'A caring team when you need us' },
]

export default function Page() {
  const [openFaq, setOpenFaq] = useState<number>(0)
  const [submitted, setSubmitted] = useState(false)

  return (
    <main id="top" className="min-h-screen overflow-hidden bg-white text-[var(--ink)]">
      {/* HERO */}
      <section className="relative mx-auto grid max-w-[1400px] items-stretch pt-10 sm:pt-14 lg:grid-cols-[1.02fr_0.98fr] lg:pt-16">
        <div className="relative z-10 flex items-center px-6 py-14 sm:px-8 lg:px-20 lg:py-24">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[clamp(3rem,6.4vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.04em]">
              Peace of mind, <em className="italic text-[var(--brand)]">when it matters.</em>
            </h1>
            <p className="mt-7 max-w-[540px] text-base leading-7 text-[var(--muted-ink)] sm:text-lg sm:leading-8">
              Amani Cover helps your family honour a life with dignity without carrying the financial burden alone. Arranged with care by Montenzuma Monalisa.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className={btnBlue} render={<a href="#apply" />}>
                Find your cover <ArrowRight data-icon="inline-end" />
              </Button>
              <Button size="lg" className={btnPlum} render={<a href="#payment" />}>
                Make a payment
              </Button>
            </div>
          </div>
        </div>

        <div className="relative min-h-[440px] overflow-hidden rounded-tl-[40px] sm:rounded-tl-[64px] lg:min-h-full">
          <Image src={familyPhoto} alt="A multigenerational family together at home" fill priority className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand)]/55 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 rounded-3xl bg-[var(--brand)]/85 p-6 text-white backdrop-blur-md sm:bottom-8 sm:left-8 sm:right-auto sm:max-w-[360px]">
            <p className="font-serif text-2xl leading-tight">&ldquo;Care that respects every life, every story, every family.&rdquo;</p>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Our promise to you</p>
          </div>
          <div className="absolute right-7 top-7 hidden size-24 place-items-center rounded-full bg-white/10 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur sm:grid">
            Here<br />for you<br />always
          </div>
        </div>
      </section>

      {/* DARK STRIP */}
      <section className="bg-[var(--brand)] text-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-white/10 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-10">
          {stripItems.map((item, index) => (
            <div key={item.title} className="flex gap-5 py-7 sm:px-6 lg:px-10">
              <span className="font-serif text-2xl italic text-white/55">0{index + 1}</span>
              <div>
                <h2 className="font-serif text-xl">{item.title}</h2>
                <p className="mt-1 text-sm text-white/60">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1160px] items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <div className="relative mx-auto w-full max-w-[480px]">
            <div className="aspect-[4/5] overflow-hidden rounded-t-[220px] rounded-b-[32px] bg-[var(--blue-bg)] p-3">
              <div className="relative size-full overflow-hidden rounded-t-[210px] rounded-b-[24px]">
                <Image src={aboutPhoto} alt="A mother and child sharing a quiet moment together" fill className="object-cover object-center" sizes="(max-width: 1024px) 80vw, 40vw" />
              </div>
            </div>
            <div className="absolute -bottom-8 -right-3 grid size-36 place-items-center rounded-full bg-[var(--sect)] text-center text-[var(--blue)] shadow-xl sm:-right-10">
              <p className="font-serif text-xl leading-tight">Amani<br /><span className="text-sm italic">means peace</span></p>
            </div>
          </div>
          <div>
            <p className="eyebrow text-[var(--blue)]">A cover born from care</p>
            <h2 className="mt-5 font-serif text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.98] tracking-[-0.04em]">
              More than a policy. <em className="italic text-[var(--blue)]">A promise.</em>
            </h2>
            <p className="mt-7 text-lg leading-8 text-[var(--muted-ink)]">
              From Montenzuma Monalisa Funeral Home comes Amani Cover a thoughtful way to prepare today, so your loved ones can focus on what truly matters tomorrow.
            </p>
            <div className="mt-9 grid gap-6 border-t border-[var(--line)] pt-8 sm:grid-cols-2">
              <div>
                <p className="font-serif text-4xl text-[var(--blue)]">24/7</p>
                <p className="mt-1 text-sm font-semibold text-[var(--muted-ink)]">Family assistance line</p>
              </div>
              <div>
                <p className="font-serif text-4xl text-[var(--blue)]">1 team</p>
                <p className="mt-1 text-sm font-semibold text-[var(--muted-ink)]">From planning to farewell</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="bg-[var(--sect)] px-6 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[32px] bg-[var(--brand)] p-8 text-white sm:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/65">Why Amani Cover</p>
              <h2 className="mt-5 max-w-[430px] font-serif text-4xl leading-[0.98] tracking-[-0.03em] sm:text-5xl">
                Care that covers the details.
              </h2>
              <p className="mt-7 max-w-[420px] leading-7 text-white/75">
                We combine practical financial protection with the human support families deserve  at every step, with every conversation.
              </p>
              <a href="#how-it-works" className="mt-9 inline-flex items-center gap-3 border-b border-white/40 pb-2 text-sm font-bold hover:border-white">
                See how it works <ArrowRight className="size-4" />
              </a>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {benefitCards.map((card) => (
                <article key={card.num} className="rounded-[28px] bg-[var(--brand)] p-7 text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,48,64,0.25)] sm:p-8">
                  <span className="font-serif text-base italic text-white/55">{card.num}</span>
                  <h3 className="mt-8 font-serif text-2xl">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROMISE */}
      <section className="relative isolate overflow-hidden bg-[var(--brand)] py-20 text-center text-white sm:py-28 lg:py-32">
        <Image src={promisePhoto} alt="" fill aria-hidden="true" className="-z-10 object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 -z-10 bg-[var(--brand)]/85" />
        <div className="relative mx-auto max-w-[760px] px-6">
          <p className="eyebrow text-white/75">Our promise</p>
          <h2 className="mt-5 font-serif text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02] tracking-[-0.03em]">
            Amani means <em className="italic text-white">peace.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-[560px] text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
            When the moment comes, your family should feel held  not hurried. That is the heart of everything we do.
          </p>
          <Button size="lg" className={`${btnBlue} mt-8`} render={<a href="#apply" />}>
            Begin a conversation <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="eyebrow text-[var(--blue)]">A gentler process</p>
            <h2 className="section-title mt-4">Protection, in three simple steps.</h2>
            <p className="mt-5 max-w-sm leading-7 text-[var(--muted-ink)]">You do not have to figure it all out at once. We make each part clear, personal, and easy to understand.</p>
            <Button size="lg" className={`${btnBlue} mt-7`} render={<a href="#apply" />}>
              Explore your options <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid gap-0 border-t border-[var(--line)]">
            {steps.map((step) => (
              <div key={step.num} className="grid gap-5 border-b border-[var(--line)] py-6 sm:grid-cols-[80px_1fr_1.2fr] sm:items-center">
                <span className="font-serif text-2xl italic text-[var(--blue)]">{step.num}</span>
                <h3 className="font-serif text-2xl">{step.title}</h3>
                <p className="text-sm leading-6 text-[var(--muted-ink)]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPLY */}
      <section id="apply" className="bg-[var(--brand)] px-6 py-16 text-white lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="relative">
            <p className="eyebrow text-white/65">Ready when you are</p>
            <h2 className="mt-4 max-w-xl font-serif text-4xl leading-[0.98] tracking-[-0.03em] sm:text-5xl">Your family&rsquo;s peace begins here.</h2>
            <p className="mt-5 max-w-md leading-7 text-white/75">Tell us how to reach you. A member of our team will call to explain your options — clearly and kindly.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/85">
              <span className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2"><LockKeyhole className="size-3.5" /> Secure enquiry</span>
              <span className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2"><Check className="size-3.5" /> No obligation</span>
              <span className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2"><ShieldCheck className="size-3.5" /> Confidential</span>
            </div>
            <div className="pointer-events-none absolute -bottom-24 -right-24 size-64 rounded-full border border-white/[0.06]" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 size-44 rounded-full border border-white/[0.06]" />
          </div>
          <form className="rounded-2xl bg-[var(--brand)] p-6 text-white shadow-2xl ring-1 ring-white/10 sm:p-8" onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}>
            <h3 className="font-serif text-2xl">Begin your Amani Cover</h3>
            <p className="mt-1 text-sm text-white/65">Takes about 2 minutes. We will guide you from here.</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/75">
                Full name
                <input required name="name" className="mt-1 h-12 rounded-md border border-[var(--brd)] bg-white px-4 text-sm font-normal normal-case tracking-normal outline-none transition placeholder:text-[var(--tx4)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15" placeholder="Your name" />
              </label>
              <label className="flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/75">
                Phone number
                <input required type="tel" name="phone" className="mt-1 h-12 rounded-md border border-[var(--brd)] bg-white px-4 text-sm font-normal normal-case tracking-normal outline-none transition placeholder:text-[var(--tx4)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15" placeholder="Your phone" />
              </label>
              <label className="flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/75 sm:col-span-2">
                Email address <span className="font-normal normal-case tracking-normal">(optional)</span>
                <input type="email" name="email" className="mt-1 h-12 rounded-md border border-[var(--brd)] bg-white px-4 text-sm font-normal normal-case tracking-normal outline-none transition placeholder:text-[var(--tx4)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15" placeholder="you@example.com" />
              </label>
              <label className="flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/75 sm:col-span-2">
                Cover you&rsquo;re interested in
                <select name="cover" className="mt-1 h-12 rounded-md border border-[var(--brd)] bg-white px-4 text-sm font-normal normal-case tracking-normal outline-none transition focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15">
                  <option>Essential simple, dependable support</option>
                  <option selected>Family  cover for the people closest to you</option>
                  <option>Legacy  our most complete care</option>
                </select>
              </label>
            </div>
            <Button type="submit" size="lg" className={`${btnBlue} mt-7 w-full`}>
              {submitted ? 'Request received — we will be in touch' : 'Request a call'} <ArrowRight data-icon="inline-end" />
            </Button>
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-white/55">
              <LockKeyhole className="size-3" /> Your details are treated with care and kept secure.
            </p>
          </form>
        </div>
      </section>

      {/* PAYMENT */}
      <section id="payment" className="border-b border-[var(--line)] bg-[var(--sect)] px-6 py-14 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-2xl bg-[var(--brand)] p-7 text-white ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <p className="eyebrow text-white/70">Already covered?</p>
            <h2 className="mt-3 font-serif text-3xl">Make a payment with ease.</h2>
            <p className="mt-2 text-white/70">Use our secure payment channel to keep your Amani Cover up to date.</p>
          </div>
          <Button size="lg" className={btnPlum}>
            Make a payment <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </section>

      {/* QUESTIONS */}
      <section id="questions" className="bg-white px-6 py-20 text-[var(--tx)] lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="eyebrow text-[var(--blue)]">Questions, answered</p>
            <h2 className="mt-5 font-serif text-4xl leading-[0.98] tracking-[-0.03em] sm:text-5xl">A little clarity brings a lot of peace.</h2>
            <p className="mt-6 leading-7 text-[var(--muted-ink)]">Can&rsquo;t find your answer? Our care team is ready to help.</p>
            <div className="relative mt-8 min-h-56 overflow-hidden rounded-xl bg-[var(--field)]">
              <Image src={supportPhoto} alt="A support advisor ready to answer questions" fill className="object-cover" sizes="(max-width: 1024px) 90vw, 35vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-transparent to-transparent" />
            </div>
            <a href="tel:+254722268566" className="mt-6 inline-flex items-center gap-2 font-medium text-[var(--blue)] hover:text-[#0B3F8A]">
              <Phone className="size-4" /> Speak with our team
            </a>
          </div>
          <div className="border-t border-[var(--line)]">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div key={faq.question} className="border-b border-[var(--line)]">
                  <button
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-5 py-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-serif text-xl sm:text-2xl">{faq.question}</span>
                    <span className={`grid size-9 shrink-0 place-items-center rounded-md border border-[var(--line)] text-[var(--blue)] transition ${isOpen ? 'rotate-45 bg-[var(--blue)] text-white' : ''}`}>
                      <Plus className="size-4" />
                    </span>
                  </button>
                  {isOpen && <p className="max-w-2xl pb-7 pr-12 text-sm leading-7 text-[var(--muted-ink)]">{faq.answer}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative isolate overflow-hidden bg-[var(--brand)] px-6 py-14 text-white lg:px-10">
        <Image src={supportPhoto} alt="" fill aria-hidden="true" className="-z-10 object-cover object-center opacity-15" />
        <div className="absolute inset-0 -z-10 bg-[var(--brand)]/90" />
        <div className="relative mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_1fr] md:items-start">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md border border-white/30 text-white">
                <Sparkles className="size-4" />
              </span>
              <div>
                <span className="block font-serif text-lg">Montenzuma Monalisa</span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Amani Cover</span>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">Funeral home insurance, arranged with dignity and care. Amani  peace of mind, made simple for the people you love.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#apply" className={`${btnBlue} inline-flex`}>Start an application</a>
              <a href="tel:+254722268566" className={`${btnBlue} inline-flex`}>Call for help</a>
            </div>
          </div>
          <div className="text-sm leading-7 text-white/75 md:pl-10">
            <h3 className="font-serif text-2xl text-white">Nairobi Branch</h3>
            <p className="mt-3">Address: Mbagathi Way, Opp. Forces Memorial Hospital</p>
            <p>Tel: (020) 2346928/9</p>
            <p>Phone: +254 722 268 566, +254 722 827 652</p>
            <p>Fax: (020) 8068115</p>
            <p>Email: <a className="text-white underline decoration-white/30 underline-offset-4 hover:text-white" href="mailto:monte2lisa@yahoo.com">monte2lisa@yahoo.com</a></p>
            <p className="mt-5 text-xs text-white/45">© 2026 Montenzuma Monalisa · Amani Cover. UI concept.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}