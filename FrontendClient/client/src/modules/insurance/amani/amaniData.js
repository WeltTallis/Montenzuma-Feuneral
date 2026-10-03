/* ==========================================================================
   Amani Cover — shared content.

   Ported from the redesign's lib/site.ts, plus the policy terms and referral
   flow that live on their own routes. One source of truth for all three pages
   so the landing / terms / referral copy can never drift apart.
   ========================================================================== */

/* Contact details — from the redesign's lib/site.ts CONTACT. */
export const CONTACT = {
  phone: '0800 26 26 4',
  phoneHref: 'tel:0800262640',
  email: 'care@amanicover.com',
  emailHref: 'mailto:care@amanicover.com',
  address: '14 Peace Avenue, City Centre',
  hours: 'Mon–Fri 8:00–17:00 · Sat 9:00–13:00',
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
  grandmotherChild: '/amani/images/grandmother-child.png',
  hands: '/amani/images/hands.png',
  familyWalk: '/amani/images/family-walk.png',
  consultant: '/amani/images/consultant.png',
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

/* Promise band. */
export const promises = [
  { title: 'Dignity', text: 'A farewell that honours every life and story.' },
  { title: 'Certainty', text: 'Clear cover, clear terms, no surprises.' },
  { title: 'Presence', text: 'A caring person beside your family, day or night.' },
];

/* How it works. */
export const steps = [
  {
    title: 'Tell us about your family',
    desc: 'Share a few details and we will call you back — no forms to wrestle with.',
  },
  {
    title: 'Choose your cover',
    desc: 'We explain each option in plain language so you can decide with confidence.',
  },
  {
    title: 'Rest easy',
    desc: 'Your cover is active. When the time comes, one call is all it takes.',
  },
];

/* About section bullet points. */
export const aboutPoints = [
  'One trusted team, from planning to farewell',
  'Plain-language terms your whole family understands',
  'Fast, caring claims — often settled within 48 hours',
];

/* FAQ. */
export const faqs = [
  {
    q: 'Who can be covered under Amani Cover?',
    a: 'You can cover yourself, your spouse, your children, and even your parents and in-laws. Our team will help you choose the right members for your family.',
  },
  {
    q: 'Is there a waiting period?',
    a: 'Yes. Natural causes have a short waiting period after your first payment, while accidental death is covered from day one. We will explain the exact terms on your call.',
  },
  {
    q: 'What happens when I need to make a claim?',
    a: 'Call our 24/7 family line. A dedicated planner will guide you through every step and coordinate the funeral directly, so your family is not left handling paperwork alone.',
  },
  {
    q: 'Can I change my cover later?',
    a: 'Of course. As your family grows or changes, you can upgrade or adjust your cover at any time by speaking with our team.',
  },
];

/* Cover options offered in the apply form. */
export const coverOptions = [
  { value: 'Just me', label: 'Just me' },
  { value: 'Me and my spouse', label: 'Me and my spouse' },
  { value: 'Spouse and children', label: 'My spouse and children' },
  { value: 'Extended family', label: 'My extended family, parents included' },
];

/* Referral flow (its own route). */
export const referSteps = [
  { num: '01', title: 'Send their name', desc: 'A name and number is all we need to get started.' },
  { num: '02', title: 'We reach out', desc: 'Our care team calls them kindly — no hard sell, ever.' },
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