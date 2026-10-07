
export const CONTACT = {
  phone: '+254 722 268 566',
  phoneHref: 'tel:+254722268566',
  email: 'monte2lisa@yahoo.com',
  emailHref: 'mailto:monte2lisa@yahoo.com',
  address: 'Nairobi Branch, Mbagathi Way, opposite Forces Memorial Hospital',
  hours: 'Open 24 hours, day or night',
};


export const PHOTOS = {

  familyHero: '/amani/top-hero.jpg',
  whiteLilies: 'https://montezumamonalisa.com/wp-content/uploads/2020/01/DSC_4205-768x511.jpg',
  elderlyCouple: '/amani/images/elderly-couple.png',
  motherDaughter: '/amani/images/mother-daughter.png',
  fatherSon: '/amani/images/father-son.png',
  familyTable: '/public/Funeral_Plan_hero.webp',
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
    label: 'The  Montenzuma Promise',
    caption: 'Care that respects every life, every story, every family.',

    sizes: '(max-width: 768px) 100vw, 66vw',
  },
  {
    src: PHOTOS.fatherSon,
    alt: 'A father gently hugging his young son outdoors',
    label: 'Protected',
    caption: 'So the little ones who look up to you are always looked after.',
    sizes: '(max-width: 1024px) 50vw, 33vw',
  },
  {
    src: PHOTOS.motherDaughter,
    alt: 'A mother and her adult daughter leaning foreheads together, smiling',
    label: 'Remembered',
    caption: 'Love lasts a lifetime. So should your care for them.',
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


export const PLANS = {
  Solo: { monthly: 500, from: false, covers: '1 person' },
  Family: { monthly: 1000, from: false, covers: 'You + your household' },
  FamilyGroup: { monthly: 10000, from: true, covers: 'Family + extended family' },
  Group: { monthly: 10000, from: true, covers: '5 or more people' },
};


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
    value: 'Group',
    label: 'Amani Group',
    hint: 'One shared policy for a group of 5 or more people.',
    minMembers: 5,
    monthly: PLANS.Group.monthly,
    features: [PLANS.Group.covers, 'Shared contributions', 'Flexible group size'],
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