/* ==========================================================================
   Amani Cover — shared content.

   Ported from the redesign's lib/site.ts, plus the policy terms and referral
   flow that live on their own routes. One source of truth for all three pages
   so the landing / terms / referral copy can never drift apart.

   KISWAHILI ACCENTS: the site stays in English — the `SW` export below (and
   the optional `sw:` lines on moments) are the ONLY Swahili on the pages.
   They are warm flourishes dropped into friendly spots, the way Kenyan brands
   actually mix. Every phrase is glossed right where it is written so future
   edits never lose the meaning. Functional copy (prices, form labels, urgent
   actions) is never translated.
   ========================================================================== */

/* Contact details — Nairobi Branch of Montenzuma Monalisa Funeral Home, the
   provider behind Amani Cover. These are the real branch details: address,
   both mobile lines, the landline and the branch email.
   Note: the CONSUMERS of this object (nav, hero, care team, faq, apply, refer,
   terms and the footer address block) read exactly these six keys, so the
   shape is kept identical — changing a value updates every page at once. */
export const CONTACT = {
  phone: '+254 722 268 566',
  phoneHref: 'tel:+254722268566',
  email: 'monte2lisa@yahoo.com',
  emailHref: 'mailto:monte2lisa@yahoo.com',
  address: 'Nairobi Branch, Mbagathi Way, opposite Forces Memorial Hospital',
  hours: 'Open 24 hours, day or night',
};

/* Local images copied out of the redesign's public/images. Every photo the
   landing page references lives here so the paths never drift from the files
   shipped in client/public/amani/images. */
export const PHOTOS = {
  /* Hero photo — deliberately the ORIGINAL landing-page image and not one of
     the redesign's newer renders. The pre-redesign Amani page declared
     `const familyPhoto = '/family-hero.png'`, and that file ships at the root
     of client/public/amani rather than inside images/. */
  familyHero: '/amani/images/hero.jpg',
  whiteLilies: 'https://montezumamonalisa.com/wp-content/uploads/2020/01/DSC_4205-768x511.jpg',
  elderlyCouple: '/amani/images/elderly-couple.png',
  motherDaughter: '/amani/images/mother-daughter.png',
  fatherSon: '/amani/images/father-son.png',
  familyTable: '/amani/images/insured.jpg',
  grandmotherChild: '/amani/images/mum.jpg',
  hands: '/amani/insurance.png',
  familyWalk: '/amani/insurance.png',
  consultant: '/amani/support-guide.png',
  applying: '/amani/images/applying.png',
};

/* ------------------------------------------------------------------
   KISWAHILI ACCENTS — one place for every Swahili flourish on the site.
   The pages stay English; components pull from here so the phrases can
   never drift apart. Glosses are inline so the meaning travels with the
   copy. Delete any line and remove where it renders — nothing else breaks.
------------------------------------------------------------------ */
export const SW = {
  /* "Are you covered?" — Je = question particle, uko = "you are" (Sheng hybrid,
     exactly how Kenyans say it). The hero hook. */
  heroHook: 'Je, uko covered?',

  /* "I am covered." — the confident reply, for a confirmation chip / badge. */
  coveredChip: 'Niko covered',

  /* "Funeral cover from KES 500 a month — your family, safe." — price whisper
     under the hero hook. */
  heroPriceLine: 'Bima ya mazishi kuanzia KES 500 kwa mwezi.',

  /* "Start now" — small accent CTA, for links that are not urgent actions. */
  cta: 'Anza sasa',

  /* "We are here 24/7, day and night." — reassurance near any phone number. */
  alwaysHere: 'Tuko hapa 24/7, mchana na usiku.',

  /* "True peace is knowing your family is safe." — footer brand quote; the
     word Amani literally means peace, so the name finishes the sentence. */
  footerQuote: 'Amani ya kweli ni kujua familia yako iko salama.',

  /* "Together — trusted by families across Kenya." — footer trust pill. */
  footerPill: 'Tuko pamoja — trusted by families across Kenya',

  /* "Made in Kenya, for Kenyans." — quiet national pride, bottom line. */
  madeIn: 'Imetengenezwa Kenya, kwa Wakenya.',
};

/* Moments gallery — from the redesign's components/moments.tsx.
   `sw` is the optional Kiswahili accent line for each slide (a short proverb
   or whisper under the English caption). Components that don't read `sw`
   simply ignore it — adding it breaks nothing.
     • "Ahadi ni deni."            — a promise is a debt (a Swahili proverb:
                                     a promise must be kept)
     • "Watoto wetu, jukumu letu." — our children, our responsibility
     • "Upendo haufi."             — love does not die */
export const moments = [
  {
    src: PHOTOS.familyTable,
    alt: 'A large multigenerational family sharing a meal and laughing around a dining table',
    label: 'The  Montenzuma Promise',
    caption: 'Care that respects every life, every story, every family.',
    sw: 'Ahadi ni deni.',
    sizes: '(max-width: 768px) 100vw, 66vw',
  },
  {
    src: PHOTOS.fatherSon,
    alt: 'A father gently hugging his young son outdoors',
    label: 'Protected',
    caption: 'So the little ones who look up to you are always looked after.',
    sw: 'Watoto wetu, jukumu letu.',
    sizes: '(max-width: 1024px) 50vw, 33vw',
  },
  {
    src: PHOTOS.motherDaughter,
    alt: 'A mother and her adult daughter leaning foreheads together, smiling',
    label: 'Remembered',
    caption: 'Love lasts a lifetime. So should your care for them.',
    sw: 'Upendo haufi.',
    sizes: '(max-width: 1024px) 50vw, 33vw',
  },
];

/* Promise band. Exactly THREE entries — the band is a 3-column grid
   (sm:grid-cols-3) so a fourth item would break the row. */
export const promises = [
  { title: 'Simple', text: 'An easy application, and someone to guide you through every step.' },
  { title: 'Flexible', text: 'Choose cover for just yourself, your household or a whole group.' },
  { title: 'Supportive', text: 'A real person to talk to, whenever you need us.' },
];

/* How it works. THREE steps. `num` is the "01 / 02 / 03" marker rendered in the
   left cell of the HowItWorks row — keep it in sync with array order. */
export const steps = [
  {
    num: '01',
    title: 'Tell us about yourself',
    desc: 'Share a few simple details so we can understand who you want to protect.',
  },
  {
    num: '02',
    title: 'Choose your cover',
    desc: 'Pick the plan and contribution that fits your family and your budget.',
  },
  {
    num: '03',
    title: 'Rest easier',
    desc: 'Apply securely, and your family will never have to face the cost of a funeral alone.',
  },
];

/* About section bullet points. THREE items, matching the three-tall stat/point
   block beneath the About copy. */
export const aboutPoints = [
  'A dignified send-off - the cost of a respectful farewell is taken care of',
  'Fits your family - cover for one person, a household or a group',
  'Real people - a dedicated care team, not a call centre',
];

/* MONTHLY CONTRIBUTIONS — the single source of truth for what a plan costs.

   These are REAL amounts, not placeholders. Every surface that quotes a price
   reads them from here so the apply form, the cover page and the payment
   portal can never disagree about what someone owes:

     • Amani Solo   — KES 500 / month, one person
     • Amani Family — KES 1,000 / month, applicant + household
     • Amani Group  — from KES 10,000 / month, 5+ people

   Why this replaced a single flat figure: the portal used to default every
   member to a hardcoded KES 2,000 contribution regardless of which plan they
   had actually applied for. That was guess work — a Solo member was quoted
   four times their real premium, and a Group policy (10k+) was under-quoted.
   The amount shown on the payments page is now the amount stored on the
   policy record itself (insurance_policies.monthly_premium, written at
   application time from `monthly` below and echoed back by
   POST /insurance/cover-check), falling back to `monthly` only if an older
   policy predates that column.

   `from: true` marks Group as a floor rather than a fixed price — group
   pricing scales with how many people are on the policy, so the UI must not
   present it as "exactly 10,000". */
export const PLANS = {
  Solo: { monthly: 500, from: false, covers: '1 person' },
  Family: { monthly: 1000, from: false, covers: 'You + your household' },
  FamilyGroup: { monthly: 10000, from: true, covers: 'Family + extended family' },
  Group: { monthly: 10000, from: true, covers: '5 or more people' },
  /* Developer test product: a REAL policy priced at KES 1 so the whole
     M-Pesa STK flow (prompt → PIN → callback → dashboard row) can be
     exercised in production for the cost of one shilling. */
  Test: { monthly: 1, from: false, covers: 'Test cover — KES 1 (testing only)' },
};

/* Cover options offered in the apply form AND rendered as plan cards on the
   cover page. These are the three real Amani products (NOT the old
   Essential/Family/Legacy marketing tiers):
     • Amani Solo   — one person
     • Amani Family — the applicant plus their household
     • Amani Group  — a shared policy for a group, MINIMUM 5 individuals
   `minMembers` is what the form enforces: picking Group reveals an "add
   another individual" repeater and blocks submit until the policy has at
   least that many people on it.
   `monthly` is copied from PLANS so the price lives in exactly one place.
   `features` is the card checklist shown under the price on the plan cards.
   The FIRST feature is derived from PLANS[...].covers so the "who is covered"
   line can never contradict the plan data; the remaining lines are card
   marketing copy and live only here.
   NOTE: the dead insurance/mani/ folder still renders these in a <select>
   with defaultValue="Family"; Family is still the middle option, so that
   placeholder stays valid. */
export const coverOptions = [
  {
    value: 'Solo',
    label: 'Amani Solo',
    hint: 'Funeral cover for just you.',
    monthly: PLANS.Solo.monthly,
    features: [`Covers ${PLANS.Solo.covers}`, 'Fixed monthly contribution', 'Digital application'],
  },
  {
    value: 'Family',
    label: 'Amani Family',
    hint: 'Funeral cover for you and your household.',
    monthly: PLANS.Family.monthly,
    features: [PLANS.Family.covers, 'One simple monthly premium', 'Digital application'],
  },
  {
    value: 'FamilyGroup',
    label: 'Amani Family Group',
    hint: 'Cover for your family and your extended family.',
    monthly: PLANS.FamilyGroup.monthly,
    features: [PLANS.FamilyGroup.covers, 'One shared policy', 'Scales with your group'],
  },
  {
    value: 'Test',
    label: 'Developer Test ',
    hint: 'KES 1 a month  developer testing only.',
    monthly: PLANS.Test.monthly,
    features: ['Covers ' + PLANS.Test.covers, 'Real STK push at KES 1', 'Digital application'],
  },
];

/* Look up a plan's details by its cover value. Falls back to Solo so a
   policy row with an unexpected cover_type still renders a real price
   instead of NaN. */
export function planFor(coverType) {
  return PLANS[coverType] || PLANS.Solo;
}

/* Format a monthly contribution for display: "KES 500" or "from KES 10,000". */
export function formatPlanAmount(coverType, amount) {
  const plan = planFor(coverType);
  const value = Number(amount || plan.monthly);
  const formatted = `KES ${value.toLocaleString('en-KE')}`;
  return plan.from ? `from ${formatted}` : formatted;
}

/* The value that switches the form into "add the rest of the group" mode. */
export const GROUP_COVER_VALUE = 'Group';

/* Smallest number of individuals an Amani Group policy may cover. The
   applicant is themselves one of them, so the repeater must supply the
   remaining MIN_GROUP_MEMBERS - 1 people. */
export const MIN_GROUP_MEMBERS = 5;

/* Referral flow (its own route). THREE steps — rendered as a connected rail. */
export const referSteps = [
  { num: '01', title: 'Send their name', desc: 'A name and a phone number is all we need.' },
  { num: '02', title: 'We get in touch', desc: 'Our care team will call them kindly. No pressure, no hard sell.' },
  { num: '03', title: 'They decide', desc: 'They choose the cover that feels right for their own family.' },
];

/* ------------------------------------------------------------------
   Real product terms supplied by Montenzuma Monalisa Funeral Insurance.
   NOTE: the source copy arrived truncated mid-sentence (several clauses
   ended on a dangling "or"/"or,"). The wording below closes each clause in
   its most natural way; confirm against the policy wording before
   publishing, since exclusions are contractually sensitive.
------------------------------------------------------------------ */
export const vision =
  'Amani means peace. We started Amani Cover because losing someone is hard enough without worrying about how to pay for the funeral. We wanted to offer simple, affordable funeral insurance, so that families and communities can say goodbye to the people they love with dignity, and with peace of mind.';

export const eligibility = ['Anyone living in Kenya'];

export const waitingPeriods = [
  { cover: 'Accidents & sudden illness', period: 'No waiting period (0 days)' },
  { cover: 'Chronic illness & natural causes', period: '1 month' },
];

export const exclusions = [
  'Death resulting directly or indirectly from active participation in mutiny, riot, strikes, military or popular uprising, insurrection, rebellion, revolution, military or usurped power, martial law or stage of siege, or any of the events or causes which determine the proclamation thereof.',
  'Death resulting directly or indirectly from intentional self-injury, suicide, or the influence of alcohol or drugs, or medical or surgical treatment.',
  'Death resulting directly or indirectly from mountaineering necessitating the use of guides or ropes, winter sports, big game shooting or riding, or driving in any kind of race, or motorcycling above 250cc.',
  'Death resulting directly or indirectly from aviation, other than as a fare-paying passenger in an aircraft operated by a regular air line or established charter service.',
  'Death resulting directly or indirectly from participation in any hazardous sport or pursuit, including rock climbing, scuba diving, hang-gliding and aided speed contests of any kind.',
];

export const claimDocuments = [
  'Death notification',
  'Burial permit and police abstract (accidental deaths only)',
  "Copy of the deceased's ID or birth certificate",
  "Copy of the registered beneficiary's ID",
  'Completed claim form',
];