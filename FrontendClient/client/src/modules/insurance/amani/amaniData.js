/* ==========================================================================
   Amani Cover — shared content.

   Ported from the redesign's lib/site.ts, plus the policy terms and referral
   flow that live on their own routes. One source of truth for all three pages
   so the landing / terms / referral copy can never drift apart.
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
  address: 'Nairobi Branch Mbagathi Way, Opp. Forces Memorial Hospital',
  hours: 'Open 24 hours · call us day or night',
};

/* Local images copied out of the redesign's public/images. Every photo the
   landing page references lives here so the paths never drift from the files
   shipped in client/public/amani/images. */
export const PHOTOS = {
  /* Hero photo — deliberately the ORIGINAL landing-page image and not one of
     the redesign's newer renders. The pre-redesign Amani page declared
     `const familyPhoto = '/family-hero.png'`, and that file ships at the root
     of client/public/amani rather than inside images/. */
  familyHero: '/amani/family-hero.png',
  whiteLilies: '/amani/images/white-lilies.png',
  elderlyCouple: '/amani/images/elderly-couple.png',
  motherDaughter: '/amani/images/mother-daughter.png',
  fatherSon: '/amani/images/father-son.png',
  familyTable: '/amani/family-hero.png',
  grandmotherChild: '/amani/familycovered.png',
  hands: '/amani/images/hands.png',
  familyWalk: '/amani/insurance.png',
  consultant: '/amani/support-guide.png',
  applying: '/amani/images/applying.png',
};

/* Moments gallery — from the redesign's components/moments.tsx. */
export const moments = [
  {
    src: PHOTOS.familyTable,
    alt: 'A large multigenerational family sharing a meal and laughing around a dining table',
    label: 'Together',
    caption: 'For the gatherings that keep a family whole.',
    sizes: '(max-width: 768px) 100vw, 66vw',
  },
  {
    src: PHOTOS.fatherSon,
    alt: 'A father gently hugging his young son outdoors',
    label: 'Protected',
    caption: 'For the little ones who look to you.',
    sizes: '(max-width: 1024px) 50vw, 33vw',
  },
  {
    src: PHOTOS.motherDaughter,
    alt: 'A mother and her adult daughter leaning foreheads together, smiling',
    label: 'Remembered',
    caption: 'For the bonds that last beyond a lifetime.',
    sizes: '(max-width: 1024px) 50vw, 33vw',
  },
];

/* Promise band. Exactly THREE entries — the band is a 3-column grid
   (sm:grid-cols-3) so a fourth item would break the row. */
export const promises = [
  { title: 'Simple', text: 'An easy application, with clear guidance at every step.' },
  { title: 'Flexible', text: 'Cover shaped around the size and needs of your family.' },
  { title: 'Supportive', text: 'A caring team beside you when you need us most.' },
];

/* How it works. THREE steps. `num` is the "01 / 02 / 03" marker rendered in the
   left cell of the HowItWorks row — keep it in sync with array order. */
export const steps = [
  {
    num: '01',
    title: 'Tell us about yourself',
    desc: 'Share a few details so we can understand what protection feels right for you.',
  },
  {
    num: '02',
    title: 'Choose your cover',
    desc: 'Explore a plan and contribution that fits your family and your budget.',
  },
  {
    num: '03',
    title: 'Feel prepared',
    desc: 'Apply securely and keep your loved ones protected for the years ahead.',
  },
];

/* About section bullet points. THREE items, matching the three-tall stat/point
   block beneath the About copy. */
export const aboutPoints = [
  'Dignified service -   support for a respectful farewell',
  'Family flexibility  -  choose protection that fits your household',
  'Personal guidance  -   a dedicated care team, not a call centre',
];

/* FAQ. The accordion grows vertically, so the COUNT is free — this is the full
   set of questions, in the order they appear. */
export const faqs = [
  {
    q: 'Who can apply for Amani Cover?',
    a: 'Adults seeking funeral protection for themselves or their family can apply. Our care team will help you choose the most suitable level of cover — kindly and without pressure.',
  },
  {
    q: 'Can I cover members of my family?',
    a: 'Yes. Our Family and Legacy options are designed to protect multiple family members under one easy-to-manage plan.',
  },
  {
    q: 'When does my cover begin?',
    a: 'Once your application is approved and your first contribution is received, your Amani Cover is active from day one. We will confirm everything to you in writing.',
  },
  {
    q: 'How do I make a claim?',
    a: 'Call our support line at any time. A dedicated care coordinator will explain the next steps and support your family throughout the process.',
  },
  {
    q: 'What happens after I submit my application?',
    a: 'We review your details, confirm your options, and contact you with clear next steps. There is no obligation to continue at any point.',
  },
];

/* Cover options offered in the apply form <select>. THREE plan levels — the
   select height is fixed (h-12), so the count does not affect layout.
   NOTE: AmaniCover's <select> uses defaultValue="Family" to match the middle
   option below; if you rename a value, update that defaultValue too. */
export const coverOptions = [
  { value: 'Essential', label: 'Essential  simple, dependable support' },
  { value: 'Family', label: 'Family  cover for the people closest to you' },
  { value: 'Legacy', label: 'Legacy  our most complete care' },
];

/* Referral flow (its own route). THREE steps — rendered as a connected rail. */
export const referSteps = [
  { num: '01', title: 'Send their name', desc: 'A name and number is all we need to get started.' },
  { num: '02', title: 'We reach out', desc: 'Our care team calls them kindly no hard sell, ever.' },
  { num: '03', title: 'They choose', desc: 'They pick the cover that feels right for their own family.' },
];

/* ------------------------------------------------------------------
   Real product terms supplied by Montenzuma Monalisa Funeral Insurance.
   NOTE: the source copy arrived truncated mid-sentence (several clauses
   ended on a dangling "or"/"or,"). The wording below closes each clause in
   its most natural way; confirm against the policy wording before
   publishing, since exclusions are contractually sensitive.
------------------------------------------------------------------ */
export const vision =
  'Driven by our vision and mission, we saw the need to bring the most elusive peace of mind in the case of demise of a loved one in family and society by offering a relevant and pocket-friendly insurance solution that allows loved ones and society as a whole the peace of mind in arranging for the send off of the departed loved one.';

export const eligibility = ['Residents of Kenya'];

export const waitingPeriods = [
  { cover: 'Accidents & acute ailments', period: '0 days' },
  { cover: 'Chronic & natural ailments', period: '1 month' },
];

export const exclusions = [
  'Death resulting directly or indirectly from active participation in mutiny, riot, strikes, military or popular uprising, insurrection, rebellion, revolution, military or usurped power, martial law or stage of siege, or any of the events or causes which determine the proclamation thereof.',
  'Death resulting directly or indirectly from intentional self-injury, suicide, or the influence of alcohol or drugs, or medical or surgical treatment.',
  'Death resulting directly or indirectly from mountaineering necessitating the use of guides or ropes, winter sports, big game shooting or riding, or driving in any kind of race, or motorcycling above 250cc.',
  'Death resulting directly or indirectly from aviation, other than as a fare-paying passenger in an aircraft operated by a regular air line or established charter service.',
  'Death resulting directly or indirectly from participation in any hazardous sport or pursuit, including rock climbing, scuba diving, hang-gliding and aided speed contests of any kind.',
];

export const claimDocuments = [
  'Death Notification',
  'Burial permit & police abstract in case of accidental death',
  'Copy of ID / Birth Certificate of the deceased',
  'Copy of ID of registered beneficiary',
  'Completed Claim form',
];