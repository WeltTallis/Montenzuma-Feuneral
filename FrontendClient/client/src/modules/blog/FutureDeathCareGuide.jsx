import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Check, ArrowRight, Clock, AlertTriangle, ShieldCheck, Lock, Server,
  Layers, FileText, Users, Truck, CreditCard, Sparkles,
} from '../../utils/icons/icons';
import Footer from '../../components/layout/Footer';

const C = {
  ink: '#15171A',
  bone: '#FAF8F4',
  bone2: '#F3EFE6',
  brass: '#8B7355',
  brassLight: '#A98F6E',
  verdigris: '#3D4F47',
  verdigrisDark: '#2E3F37',
  verdigrisLight: '#4D6359',
  verdigrisTint: '#EBEFEF',
  line: '#E3DDD0',
  lineDark: 'rgba(250,248,244,0.14)',
  gray: '#6B6862',
  grayLight: 'rgba(250,248,244,0.62)',
  accent: '#C77B5E',
};

const FutureDeathCareGuide = () => {
  const navigate = useNavigate();
  const goStart = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/register'); };
  const goTerms = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/terms'); };
  const goContact = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/contact'); };

  const tocItems = [
    'Why Funeral Homes Get Stuck',
    'Smart Intake, Release & Postmortem Tracking',
    'Precision Chemical Inventory Management',
    'Smart Hearse Management & Client Self-Booking',
    'The Integrated Coffin Marketplace',
    'Fully Automated Workflows: Documents to Invoicing',
    'The Digital Family Portal: 24/7 Access & Transparency',
    'The Bottom Line',
  ];

  const painPoints = [
    'Paper intake forms that get lost, misfiled, or illegibly filled in under pressure',
    'Physical ledgers that force staff to re-type the same data two or three times',
    'Disconnected software — one tool for billing, another for schedules, none talking to each other',
    'No quick way to answer a family\u2019s simple question without digging through a filing cabinet',
    'Compliance records that live in binders instead of an auditable digital trail',
  ];

  const qrSteps = [
    { title: 'Scan the case QR code', desc: 'Every case arrives with a unique QR code printed on admission paperwork and affixed to the deceased\u2019s file.' },
    { title: 'Enter a secure staff ID', desc: 'Role-based access ensures only authorized staff see protected case data. Drivers, examiners, and directors each see only what their role requires.' },
    { title: 'Access complete case details instantly', desc: 'Intake forms, postmortem status, custody history, and next actions appear in a single protected view — no filing cabinet required.' },
    { title: 'Sign, timestamp & automate', desc: 'Authorized signers approve intake or release on a premium tablet portal; digital signatures and timestamps auto-update the chain of custody.' },
  ];

  const chemicalFeatures = [
    { icon: Check, title: 'Automatic usage deduction', desc: 'Complete a case and the system deducts the exact chemicals used from stock — no manual counting.' },
    { icon: Server, title: 'Low-stock alerts', desc: 'Get notified before you run out of embalming fluid, cavity fluid, or arterial chemicals at the worst possible time.' },
    { icon: ShieldCheck, title: 'Compliance ready', desc: 'Batch numbers, expiry dates, and usage logs are recorded automatically for environmental and safety audits.' },
    { icon: Sparkles, title: 'Less waste, lower overhead', desc: 'Track consumption patterns per case type to order with confidence and cut spoilage and overstock.' },
  ];

  const hearseFeatures = [
    { icon: Truck, title: 'Availability at a glance', desc: 'Check hearse availability by date, month, or individual time slot in seconds.' },
    { icon: CreditCard, title: 'Transparent pricing', desc: 'Publish fleet prices openly so families can compare routes and vehicles without awkward phone calls.' },
    { icon: Users, title: 'Client self-booking', desc: 'Families book the hearse themselves from a lobby tablet or from home, choosing time slots that fit the service.' },
    { icon: Layers, title: 'Fleet-sharing network', desc: 'Securely ping a partnered funeral home across town to request a vehicle share when your fleet is fully booked.' },
  ];

  const coffinFeatures = [
    { icon: Layers, title: 'Browse the full catalog', desc: 'Families explore every coffin and casket you stock — in high resolution — without stepping onto a showroom floor.' },
    { icon: Check, title: 'Compare with confidence', desc: 'Side-by-side material, finish, and price comparisons give families time and privacy to decide.' },
    { icon: CreditCard, title: 'Reserve from home', desc: 'The e-commerce approach lets families reserve a coffin from their living room, at their own pace.' },
    { icon: FileText, title: 'Auto-synced to the case file', desc: 'The reservation lands directly on the deceased\u2019s case, so the prep team and billing stay in sync instantly.' },
  ];
  const automationSteps = [
  { title: 'Case created', desc: 'A case opens the moment a death is reported — details captured once, used everywhere.' },
  { title: 'Documents generated', desc: 'Death certificates, permits, and service agreements are pre-filled with the family\u2019s data automatically.' },
  { title: 'Invoice issued', desc: 'The system builds the invoice from services selected — no re-typing, no arithmetic errors.' },
  { title: 'Family pays', desc: 'Credit-card checkout happens securely on the tablet portal or from the family portal after hours.' },
  { title: 'Accounting synced', desc: 'Paid invoices update your accounting records instantly. Zero double-entry, zero lost paperwork.' },
];

const portalFeatures = [
  { icon: FileText, title: 'View & download signed documents', desc: 'Every signed intake, release, and agreement is available to the family from any device.' },
  { icon: CreditCard, title: 'Access & pay invoices securely', desc: 'Outstanding balances are visible and payable online — fewer awkward follow-up phone calls.' },
  { icon: Truck, title: 'Manage hearse bookings', desc: 'Reschedule transport and view service schedules at the family\u2019s convenience.' },
  { icon: Layers, title: 'Review coffin reservations', desc: 'Confirm or revisit marketplace reservations before the service without a single phone call.' },
];

const comparison = [
  { metric: 'Intake & release', manual: 'Clipboards, handwritten forms, manual re-entry', automated: 'QR-scanned cases, tablet signatures, auto-filed chain of custody' },
  { metric: 'Paperwork', manual: 'Hours of typing per case, misfiled records', automated: 'Documents pre-filled and generated in seconds', best: true },
  { metric: 'Chemical inventory', manual: 'Manual counts, emergency reorders, expired stock', automated: 'Auto-deduction, low-stock alerts, audit-ready logs' },
  { metric: 'Hearse scheduling', manual: 'Phone tag and paper calendars', automated: 'Live availability, family self-booking, fleet sharing' },
  { metric: 'Coffin selection', manual: 'Showroom-only, rushed decisions', automated: 'Digital marketplace, browse & reserve from home' },
  { metric: 'Payments', manual: 'Cash or cheque, late invoices', automated: 'Card checkout on tablet or family portal, instant sync' },
  { metric: 'Family experience', manual: 'Phone calls, waiting for office hours', automated: '24/7 portal access, full transparency' },
  { metric: 'Compliance', manual: 'Binders and paper trails', automated: 'Timestamps, audit logs, role-based security' },
];

const faqs = [
  {
    question: 'What is a fully automated funeral home?',
    answer: 'A fully automated funeral home uses cloud-based death care software to digitize intake, release, postmortem tracking, chemical inventory, hearse scheduling, coffin sales, invoicing, and family communication. Paperwork is generated automatically, compliance is tracked digitally, and families self-serve through a secure 24/7 portal.'
  },
  {
    question: 'Can families really sign release forms on a tablet?',
    answer: 'Yes. Rest Point\u2019s premium tablet portal allows authorized family members, medical examiners, and drivers to sign digital release forms securely. The system captures the signature and timestamp, creating a fully compliant, paperless chain of custody.'
  },
  {
    question: 'What happens if a funeral home loses internet connection?',
    answer: 'Rest Point is 100% cloud-based with advanced local caching. If the internet briefly drops, tablets can still view critical data and continue intake; everything syncs to the cloud the moment the connection is restored.'
  },
  {
    question: 'How does fully automated software protect sensitive family data?',
    answer: 'All data is encrypted in transit (256-bit SSL) and at rest, with role-based access control so staff only see what their role requires. The family portal runs in a locked, guided session that wipes clean after each use.'
  },
  {
    question: 'Can hearse bookings be handled by the client without calling?',
    answer: 'Yes. Funeral homes can publish transparent fleet pricing, and families can view availability and book the hearse directly from a lobby tablet or from home — and through a partner network, homes can even share vehicles when a fleet is fully booked.'
  },
];

const blogUrl = 'https://restpoint.co.ke/blog/future-of-death-care-software-restpoint';
const faqItems = faqs.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } }));

const postSchema = [
  {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'The Future of Death Care: How Fully Automated Funeral Homes Are Changing the Industry',
    description: 'How cloud-based death care software is transforming funeral home operations — from QR-scanned intake and digital release to hearse self-booking, coffin marketplaces, and fully automated workflows.',
    author: { '@type': 'Person', name: 'Peter Mumo', description: 'Developer at Restpoint' },
    publisher: { '@type': 'Organization', name: 'Rest Point', logo: { '@type': 'ImageObject', url: 'https://restpoint.co.ke/logo.png' } },
    datePublished: '2026-09-04',
    dateModified: '2026-09-04',
    mainEntityOfPage: blogUrl,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://restpoint.co.ke' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://restpoint.co.ke/blog' },
      { '@type': 'ListItem', position: 3, name: 'The Future of Death Care', item: blogUrl },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems,
  },
];
return (
    <>
      <Helmet>
        <title>The Future of Death Care: How Fully Automated Funeral Homes Are Changing the Industry | RestPoint</title>
        <meta name="description" content="Discover how fully automated funeral homes use cloud-based software for QR-scanned intake, digital release, chemical inventory control, hearse self-booking, coffin marketplaces, automated invoicing, and 24/7 family portals. Written by Peter Mumo, Developer at Restpoint." />
        <meta name="keywords" content="future of death care, automated funeral home software, funeral home management system, digital intake and release, funeral home digitization, hearse management software, coffin marketplace, funeral home invoicing, family portal funeral, funeral home compliance software, cloud funeral software Kenya, Restpoint death care" />
        <meta name="author" content="Peter Mumo" />
        <link rel="canonical" href={blogUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content="The Future of Death Care: How Fully Automated Funeral Homes Are Changing the Industry" />
        <meta property="og:description" content="From QR-scanned intake to coffin marketplaces and 24/7 family portals — how modern funeral homes are going fully automated." />
        <meta property="og:url" content={blogUrl} />
        <meta property="og:site_name" content="Rest Point" />
        <meta property="article:published_time" content="2026-09-04" />
        <meta property="article:author" content="https://restpoint.co.ke" />
        <meta property="article:section" content="Death Care Technology" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The Future of Death Care: Fully Automated Funeral Homes" />
        <meta name="twitter:description" content="How cloud-based software is transforming funeral home operations and family experiences." />
        {postSchema.map((s, i) => (
          <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
        ))}
      </Helmet>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;color:${C.gray};background:${C.bone};-webkit-font-smoothing:antialiased}
        h1,h2,h3,h4{font-family:'Fraunces',serif;font-weight:500;letter-spacing:-0.01em;color:${C.ink}}
        h1{font-size:clamp(2.2rem,5vw,3.5rem);line-height:1.12;margin-bottom:1.5rem}
        h2{font-size:clamp(1.8rem,4vw,2.4rem);line-height:1.2;margin-bottom:1.5rem}
        h3{font-size:1.3rem;margin-bottom:1rem}
        h4{font-size:1.05rem;margin-bottom:0.5rem}
        p{line-height:1.85;font-size:1.05rem;color:${C.gray}}

        .mono-label{font-family:'JetBrains Mono',monospace;font-size:0.75rem;letter-spacing:0.14em;text-transform:uppercase;color:${C.brass};font-weight:500}
        .blog-container{background:${C.bone}}

        /* Hero */
        .blog-hero{background:#000000;color:${C.bone};padding:clamp(6rem,10vw,8rem) 0 5rem;position:relative;overflow:hidden}
        .hero-grid-bg{position:absolute;top:0;left:0;right:0;bottom:0;background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;mask-image:linear-gradient(to bottom,black,transparent 80%);-webkit-mask-image:linear-gradient(to bottom,black,transparent 80%)}
        .hero-glow{position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 20% 50%,rgba(61,79,71,0.35) 0%,transparent 60%);pointer-events:none}
        .hero-glow-2{position:absolute;bottom:-120px;right:-80px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(199,123,94,0.22) 0%,transparent 65%);pointer-events:none}
        .hero-content{max-width:880px;margin:0 auto;padding:0 clamp(1.25rem,5vw,2.5rem);position:relative;z-index:1}
        .hero-meta{display:flex;gap:1.8rem;font-size:0.85rem;color:${C.grayLight};margin-top:2rem;font-family:'JetBrains Mono',monospace;align-items:center;flex-wrap:wrap}
        .hero-meta span{display:flex;align-items:center;gap:0.4rem}
        .hero-author{display:flex;align-items:center;gap:0.9rem;margin-top:2.2rem}

        /* Content layout */
        .blog-content{max-width:880px;margin:0 auto;padding:5rem clamp(1.25rem,5vw,2.5rem)}
        .blog-section{margin-bottom:5rem;scroll-margin-top:2.5rem}
        .lead-text{font-size:1.2rem;line-height:1.8;color:${C.gray};margin-bottom:2rem}
        .lead-text strong{color:${C.ink}}

        /* TOC */
        .toc-card{background:${C.bone2};border:1px solid ${C.line};border-radius:12px;padding:2rem;margin-bottom:4rem}
        .toc-list{list-style:none;padding:0;margin:0}
        .toc-item{padding:0.8rem 0;border-bottom:1px solid ${C.line}}
        .toc-item:last-child{border-bottom:none}
        .toc-link{color:${C.verdigris};text-decoration:none;font-size:1rem;display:flex;align-items:center;gap:0.8rem;transition:transform 0.2s ease}
        .toc-link:hover{transform:translateX(4px);color:${C.ink}}
        .toc-num{font-family:'JetBrains Mono',monospace;color:${C.brass};font-size:0.85rem}
        .insight-box{background:${C.bone2};padding:1.5rem 2rem;border-radius:8px;border-left:4px solid ${C.brass};margin-bottom:3rem}
        .insight-box p{font-size:1rem;line-height:1.7;color:${C.ink};margin:0}
        .insight-box.verdigris{border-left-color:${C.verdigris}}
        .insight-box.accent{border-left-color:${C.accent}}

        .list-card{display:grid;gap:0.9rem;margin-bottom:2.5rem}
        .list-item{display:flex;align-items:flex-start;gap:0.9rem;background:${C.bone2};border:1px solid ${C.line};border-radius:10px;padding:1rem 1.2rem}
        .list-item .icon-box{flex-shrink:0}
        .list-item span{font-size:0.98rem;line-height:1.65;color:${C.ink}}

        .feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:2.5rem}
        .feature-card{background:${C.bone2};border:1px solid ${C.line};border-radius:12px;padding:1.5rem;transition:transform 0.25s ease,box-shadow 0.25s ease}
        .feature-card:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(21,23,26,0.08)}
        .feature-card .icon-box{width:44px;height:44px;border-radius:10px;background:${C.verdigrisTint};display:flex;align-items:center;justify-content:center;margin-bottom:1rem}
        .feature-card h4{font-size:1rem}
        .feature-card p{font-size:0.92rem;line-height:1.7;margin:0}

        .steps-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:2.5rem}
        .step-card{display:flex;gap:1rem;background:${C.bone2};border:1px solid ${C.line};border-radius:12px;padding:1.4rem}
        .step-num{font-family:'JetBrains Mono',monospace;font-size:0.9rem;color:${C.brass};padding-top:2px}
        .step-card h4{font-size:0.98rem;margin-bottom:0.3rem}
        .step-card p{font-size:0.9rem;line-height:1.65;margin:0}

        .stat-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin:0 auto 3rem}
        .stat-card{background:${C.ink};color:${C.bone};border-radius:14px;padding:1.6rem;text-align:center}
        .stat-val{font-family:'Fraunces',serif;font-size:clamp(1.8rem,4vw,2.6rem);font-weight:600;color:${C.brassLight}}
        .stat-lbl{font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;color:rgba(250,248,244,0.6);font-family:'JetBrains Mono',monospace;margin-top:0.4rem}
        .compare-table{width:100%;border-collapse:collapse;margin-bottom:2.5rem;background:${C.bone2};border-radius:12px;overflow:hidden;border:1px solid ${C.line}}
        .compare-table th{font-family:'Inter',sans-serif;font-size:0.8rem;letter-spacing:0.06em;text-transform:uppercase;padding:1rem;background:${C.ink};color:${C.bone};text-align:left}
        .compare-table td{padding:0.9rem 1rem;font-size:0.92rem;line-height:1.6;border-top:1px solid ${C.line};vertical-align:top;color:${C.gray}}
        .compare-table td:first-child{font-weight:600;color:${C.ink};white-space:nowrap}
        .compare-table tr:nth-child(even) td{background:rgba(139,115,85,0.04)}

        .cta-wrapper{margin:0 0 4rem}
        .cta-card{background:${C.ink};border-radius:18px;padding:clamp(2.5rem,5vw,4rem);position:relative;overflow:hidden;color:${C.bone}}
        .cta-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${C.brass},${C.brassLight},${C.verdigris},${C.accent})}
        .cta-card h2{color:${C.bone}}
        .cta-card p{color:rgba(250,248,244,0.65)}
        .cta-buttons{display:flex;gap:1rem;flex-wrap:wrap;margin-top:2rem}
        .btn-brass{display:inline-flex;align-items:center;gap:0.6rem;background:${C.bone};color:${C.ink};border:none;padding:0.95rem 2rem;border-radius:50px;font-size:1rem;font-weight:600;cursor:pointer;transition:all 0.3s ease}
        .btn-brass:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(250,248,244,0.15)}
        .btn-ghost{display:inline-flex;align-items:center;gap:0.6rem;background:transparent;color:${C.bone};border:1.5px solid rgba(250,248,244,0.3);padding:0.9rem 2rem;border-radius:50px;font-size:1rem;cursor:pointer;transition:all 0.3s ease}
        .btn-ghost:hover{border-color:${C.bone}}

        .author-card{display:flex;gap:1.4rem;align-items:flex-start;background:${C.bone2};border:1px solid ${C.line};border-radius:14px;padding:1.8rem;margin-bottom:4rem}
        .author-avatar{width:62px;height:62px;border-radius:50%;background:${C.verdigris};color:${C.bone};display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:1.4rem;font-weight:600;flex-shrink:0}
        .author-name{font-family:'Fraunces',serif;font-size:1.15rem;font-weight:600;color:${C.ink};margin-bottom:0.2rem}
        .author-role{font-family:'JetBrains Mono',monospace;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:${C.brass};margin-bottom:0.7rem}
        .author-card p{font-size:0.95rem;line-height:1.7;margin:0}

        .faq-list-block{display:grid;gap:0.8rem;margin-bottom:2.5rem}
        .faq-block-item{border:1px solid ${C.line};border-radius:12px;background:${C.bone2};overflow:hidden}
        .faq-block-q{width:100%;display:flex;justify-content:space-between;align-items:center;gap:1rem;background:none;border:none;padding:1.1rem 1.3rem;cursor:pointer;text-align:left;font-family:'Inter',sans-serif;font-size:1rem;font-weight:600;color:${C.ink}}
        .faq-block-a{max-height:0;overflow:hidden;transition:max-height 0.4s ease}
        .faq-block-a.open{max-height:400px}

        .check-bullet{display:flex;gap:0.8rem;align-items:flex-start;margin-bottom:0.9rem}
        .check-bullet .icon-box{flex-shrink:0;margin-top:2px}
        .check-bullet span{font-size:0.98rem;line-height:1.65;color:${C.gray}}

        @media (max-width:768px){
          .steps-grid,.feature-grid{grid-template-columns:1fr}
          .stat-strip{grid-template-columns:1fr}
          .hero-meta{flex-direction:column;gap:0.5rem;align-items:flex-start}
          .compare-table td:first-child{white-space:normal}
          .author-card{flex-direction:column}
          .cta-buttons{flex-direction:column}
        }
      `}</style>
      <div className="blog-container">
        {/* Hero */}
        <div className="blog-hero">
          <div className="hero-grid-bg" />
          <div className="hero-glow" />
          <div className="hero-glow-2" />
          <div className="hero-content">
            <div className="mono-label" style={{ color: C.brassLight, marginBottom: '1.5rem', display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(139,115,85,0.12)', border: `1px solid ${C.lineDark}`, borderRadius: '20px' }}>
              Death Care Technology &middot; Blog
            </div>
            <h1>The Future of Death Care: How Fully Automated Funeral Homes Are Changing the Industry</h1>
            <p style={{ fontSize: '1.2rem', lineHeight: 1.8, opacity: 0.92, maxWidth: '720px', color: C.grayLight }}>
              From QR-scanned intake and digital release to hearse self-booking, integrated coffin marketplaces, and fully automated workflows — here is how cloud-based software is reshaping the way funeral homes care for families.
            </p>
            <div className="hero-meta">
              <span><Clock size={16} /> 12 min read</span>
              <span><Clock size={16} /> Published September 2026</span>
            </div>
            <div className="hero-author">
              <div className="author-avatar" style={{ width: 44, height: 44, fontSize: '0.95rem' }}>PM</div>
              <div>
                <div style={{ color: C.bone, fontWeight: 600, fontSize: '0.95rem' }}>Written by Peter Mumo</div>
                <div style={{ color: C.grayLight, fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace" }}>Developer at Restpoint</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="blog-content">
          {/* TOC */}
          <div className="toc-card">
            <div className="mono-label" style={{ marginBottom: '1rem', color: C.verdigris }}>Table of Contents</div>
            <ul className="toc-list">
              {tocItems.map((item, idx) => (
                <li key={idx} className="toc-item">
                  <a href={`#section-${idx}`} className="toc-link">
                    <span className="toc-num">{String(idx + 1).padStart(2, '0')}</span>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Intro */}
          <section className="blog-section">
            <p className="lead-text">
              The death care industry is undergoing a technological renaissance. For decades, funeral homes relied on a chaotic mix of <strong>paper forms, physical ledgers, and disconnected software systems</strong> that made daily operations harder than they needed to be.
            </p>
            <p className="lead-text">
              But the future has arrived. Today&rsquo;s <strong>fully automated funeral homes</strong> are leveraging cloud-based technology to streamline operations, ensure flawless compliance, and provide families with a seamless, dignified experience.
            </p>
            <p>
              As a developer at Restpoint, I have worked closely with funeral directors to understand their daily bottlenecks. If you are still managing your funeral home with outdated tools, here is a look at the future of death care software — and why modern directors are making the switch.
            </p>
          </section>

          {/* Section 0 — Why funeral homes get stuck */}
          <section id="section-0" className="blog-section">
            <h2>Why Funeral Homes Get Stuck</h2>
            <p className="lead-text">
              Before we look at the future, it helps to name the problem. Most funeral homes are not failing because of the quality of their care — they are drowning in the operational debt that paperwork and disconnected tools create.
            </p>
            <div className="list-card">
              {painPoints.map((pt, idx) => (
                <div key={idx} className="list-item">
                  <div className="icon-box" style={{ color: C.accent }}>
                    <AlertTriangle size={20} />
                  </div>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
            <div className="insight-box">
              <p>
                <strong>The ripple effect:</strong> every hour a director spends re-entering data, hunting for a paper file, or reconciling a ledger is an hour not spent with a grieving family. Automation removes that distance.
              </p>
            </div>
          </section>

          {/* Section 1 — Smart Intake, Release & Postmortem */}
          <section id="section-1" className="blog-section">
            <h2>1. Smart Intake, Release, and Postmortem Tracking</h2>
            <p className="lead-text">
              The days of clipboards and manual data entry at the front desk are over. Modern death care software transforms intake and release into a highly secure, fully digitized process.
            </p>
            <p>
              Imagine a front desk where staff simply scan a QR code assigned to a case, enter their secure ID, and instantly access the deceased&rsquo;s complete details — from intake forms to postmortem statuses.
            </p>
            <div className="steps-grid">
              {qrSteps.map((step, idx) => (
                <div key={idx} className="step-card">
                  <div className="step-num">{String(idx + 1).padStart(2, '0')}</div>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <h3>Digital Intake &amp; Release</h3>
            <div className="list-card">
              <div className="list-item">
                <div className="icon-box" style={{ color: C.verdigris }}><Check size={20} /></div>
                <span>Authorized family members, medical examiners, or drivers use a premium tablet portal to securely sign digital release forms.</span>
              </div>
              <div className="list-item">
                <div className="icon-box" style={{ color: C.verdigris }}><Check size={20} /></div>
                <span>The system captures timestamps and digital signatures, creating a bulletproof, paperless chain of custody.</span>
              </div>
            </div>
            <h3>Postmortem Coordination</h3>
            <p>
              Directors can track postmortem timelines in real time, ensuring all compliance requirements are met without digging through physical files.
            </p>
            <div className="insight-box verdigris">
              <p>
                <strong>Why it matters:</strong> a single verified digital chain of custody is far stronger than a folder of loose paper. When an auditor, family, or court asks for proof, you produce it in seconds instead of hours.
              </p>
            </div>
          </section>
          {/* Section 2 — Chemical Inventory */}
          <section id="section-2" className="blog-section">
            <h2>2. Precision Chemical Inventory Management</h2>
            <p className="lead-text">
              One of the most overlooked aspects of funeral home operations is prep room management. Next-generation software includes dedicated Chemical Inventory Management modules that bring the same precision you would expect from a hospital pharmacy.
            </p>
            <p>
              Instead of manually counting bottles or running out of embalming fluid at the worst possible time, the software automatically tracks chemical usage.
            </p>
            <div className="feature-grid">
              {chemicalFeatures.map((f, idx) => (
                <div key={idx} className="feature-card">
                  <div className="icon-box" style={{ color: C.verdigris }}><f.icon size={22} /></div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
            <div className="insight-box">
              <p>
                <strong>Bottom line for the prep room:</strong> compliant chemical control is no longer about paper logs — it is about a live, accurate picture of what you have, what you used, and what you need to reorder.
              </p>
            </div>
          </section>

          {/* Section 3 — Hearse Management */}
          <section id="section-3" className="blog-section">
            <h2>3. Smart Hearse Management &amp; Client Self-Booking</h2>
            <p className="lead-text">
              Scheduling logistics can be a nightmare when you have multiple services in a day. Modern software solves this with an intelligent Hearse Management Module.
            </p>
            <p>
              Directors can check hearse availability by date, month, or specific time slots with just a few taps. But the true future of death care pushes this convenience directly to the client.
            </p>
            <div className="feature-grid">
              {hearseFeatures.map((f, idx) => (
                <div key={idx} className="feature-card">
                  <div className="icon-box" style={{ color: C.verdigris }}><f.icon size={22} /></div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
            <p>
              Through the software, funeral homes can post transparent prices for their hearse fleet. Families can then view availability and book the hearse themselves directly from a tablet in the lobby, or from the comfort of their own home.
            </p>
            <p>
              Furthermore, through an interconnected network, your system can securely ping a partnered funeral home across town to request a vehicle share if your fleet is booked. This ensures <strong>no family is ever turned away</strong> due to logistical bottlenecks.
            </p>
            <div className="insight-box accent">
              <p>
                <strong>Key insight:</strong> hearse bookings are often the most stressful logistics a family never expects to manage. Self-booking with transparent pricing turns that stress into a simple, dignified choice.
              </p>
            </div>
          </section>

          {/* Section 4 — Coffin Marketplace */}
          <section id="section-4" className="blog-section">
            <h2>4. The Integrated Coffin Marketplace</h2>
            <p className="lead-text">
              Perhaps the most exciting innovation in modern death care software is the removal of the traditional <em>&ldquo;showroom floor&rdquo;</em> limitation. Our software comes integrated with a digital Coffin Marketplace.
            </p>
            <p>
              Instead of forcing grieving families to make rushed decisions in a lobby, they can browse your entire catalog, compare options, and reserve a coffin from the comfort of their home.
            </p>
            <div className="feature-grid">
              {coffinFeatures.map((f, idx) => (
                <div key={idx} className="feature-card">
                  <div className="icon-box" style={{ color: C.verdigris }}><f.icon size={22} /></div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
            <p>
              This e-commerce approach to death care gives families the time and privacy they need to make important decisions, while automatically syncing the reservation directly to the deceased&rsquo;s case file.
            </p>
            <div className="insight-box">
              <p>
                <strong>Why this matters:</strong> decisions made under pressure are decisions families later regret. A digital marketplace respects the family&rsquo;s pace — and protects your staff from the awkwardness of upselling in a moment of grief.
              </p>
            </div>
          </section>
          {/* Section 5 — Automated Workflows */}
          <section id="section-5" className="blog-section">
            <h2>5. Fully Automated Workflows: From Document Creation to Invoicing</h2>
            <p className="lead-text">
              Why spend hours generating paperwork when your software can do it for you? The most advanced death care platforms offer end-to-end automation.
            </p>
            <p>
              When a case is created, the software automatically generates all necessary documents — death certificates, permits, and service agreements — pre-filled with the family&rsquo;s data. From there, the system seamlessly integrates with invoice generation.
            </p>
            <div className="steps-grid">
              {automationSteps.map((step, idx) => (
                <div key={idx} className="step-card">
                  <div className="step-num">{String(idx + 1).padStart(2, '0')}</div>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <h3>Integrated Payments</h3>
            <div className="list-card">
              <div className="list-item">
                <div className="icon-box" style={{ color: C.verdigris }}><CreditCard size={20} /></div>
                <span>Families can check out and pay via credit card directly through the tablet portal or family portal.</span>
              </div>
              <div className="list-item">
                <div className="icon-box" style={{ color: C.verdigris }}><Check size={20} /></div>
                <span>Once a payment is made, the invoice is automatically marked as paid and synced with your accounting software.</span>
              </div>
              <div className="list-item">
                <div className="icon-box" style={{ color: C.verdigris }}><Check size={20} /></div>
                <span>Zero double-entry, zero lost paperwork.</span>
              </div>
            </div>
            <div className="insight-box verdigris">
              <p>
                <strong>The compounding effect:</strong> one hour of setup on a case saves many hours across documents, billing, and reconciliation. Automation multiplies — it does not just subtract — your staff&rsquo;s time.
              </p>
            </div>
          </section>

          {/* Section 6 — Family Portal */}
          <section id="section-6" className="blog-section">
            <h2>6. The Digital Family Portal: 24/7 Access and Transparency</h2>
            <p className="lead-text">
              Today&rsquo;s families expect the same digital convenience from their funeral home that they get from their bank or favorite retail store.
            </p>
            <p>
              With a secure Family Portal, families are given digital access to their loved one&rsquo;s case. After paying via credit card or signing documents on a tablet, the family can log into the portal from home to:
            </p>
            <div className="feature-grid">
              {portalFeatures.map((f, idx) => (
                <div key={idx} className="feature-card">
                  <div className="icon-box" style={{ color: C.verdigris }}><f.icon size={22} /></div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
            <div className="insight-box accent">
              <p>
                <strong>This level of transparency builds immense trust.</strong> Families feel empowered and informed, while directors save countless hours answering phone calls and digging up paperwork.
              </p>
            </div>
          </section>
          {/* Comparison */}
          <section className="blog-section">
            <h2>The Traditional vs. The Automated Funeral Home</h2>
            <p className="lead-text">
              The difference between a paper-based funeral home and a fully automated one shows up in every single interaction — for staff and families alike.
            </p>
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Traditional</th>
                  <th>Fully Automated</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.metric}</td>
                    <td>{row.manual}</td>
                    <td>{row.automated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="stat-strip">
              <div className="stat-card"><div className="stat-val">24/7</div><div className="stat-lbl">Family portal access</div></div>
              <div className="stat-card"><div className="stat-val">100%</div><div className="stat-lbl">Cloud-based &amp; secure</div></div>
              <div className="stat-card"><div className="stat-val">0</div><div className="stat-lbl">Manual re-entries per case</div></div>
            </div>
          </section>

          {/* FAQ */}
          <section className="blog-section">
            <h2>Frequently Asked Questions</h2>
            <FaqAccordion items={faqs} />
          </section>

          {/* Conclusion */}
          <section id="section-7" className="blog-section">
            <h2>The Bottom Line</h2>
            <p className="lead-text">
              The future of death care is not just about going paperless — it is about creating an <strong>interconnected, highly secure, and automated ecosystem</strong>.
            </p>
            <p>
              From scanning a QR code at the front desk to reserving a coffin from a living room sofa, modern software allows directors to spend less time doing paperwork and more time doing what matters: <strong>caring for grieving families</strong>.
            </p>
            <div className="check-bullet">
              <div className="icon-box" style={{ color: C.verdigris }}><ShieldCheck size={20} /></div>
              <span>Digital intake, release, and postmortem tracking that keeps a bulletproof chain of custody.</span>
            </div>
            <div className="check-bullet">
              <div className="icon-box" style={{ color: C.verdigris }}><Server size={20} /></div>
              <span>Precision chemical inventory so your prep room never runs dry — and auditable compliance is automatic.</span>
            </div>
            <div className="check-bullet">
              <div className="icon-box" style={{ color: C.verdigris }}><Truck size={20} /></div>
              <span>Hearse self-booking and fleet sharing that make sure no family is ever turned away.</span>
            </div>
            <div className="check-bullet">
              <div className="icon-box" style={{ color: C.verdigris }}><Layers size={20} /></div>
              <span>A coffin marketplace that gives families time, privacy, and confidence.</span>
            </div>
            <div className="check-bullet">
              <div className="icon-box" style={{ color: C.verdigris }}><CreditCard size={20} /></div>
              <span>Automated documents, invoicing, and accounting sync — zero double-entry.</span>
            </div>
            <div className="check-bullet">
              <div className="icon-box" style={{ color: C.verdigris }}><Lock size={20} /></div>
              <span>A 24/7 family portal that turns transparency into trust.</span>
            </div>
          </section>

          {/* Author */}
          <div className="author-card">
            <div className="author-avatar">PM</div>
            <div>
              <div className="author-name">Peter Mumo</div>
              <div className="author-role">Developer at Restpoint</div>
              <p>
                Peter builds the tools funeral directors use every day. Working directly with front-desk teams, prep rooms, and directors, he has seen first-hand how automation transforms both operations and the family experience. This article is part of the Restpoint Death Care Technology series.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="cta-wrapper">
            <div className="cta-card">
              <div className="mono-label" style={{ color: C.brassLight, marginBottom: '1.5rem' }}>Get Started Today</div>
              <h2>Are you ready to bring your funeral home into the future?</h2>
              <p>
                Explore Restpoint&rsquo;s cloud-based, 24/7 death care software solutions today to see how automation can transform your operations — and the experience you deliver to every family.
              </p>
              <div className="cta-buttons">
                <button className="btn-brass" onClick={goStart}>Start Free Trial <ArrowRight size={18} /></button>
                <button className="btn-ghost" onClick={goContact}>Book a Demo</button>
              </div>
            </div>
          </div>
        </div>

        <Footer goTerms={goTerms} />
      </div>
    </>
  );
};
/* Small accordion used for the blog FAQ section */
const FaqAccordion = ({ items }) => {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq-list-block">
      {items.map((f, idx) => {
        const isOpen = open === idx;
        return (
          <div key={idx} className="faq-block-item">
            <button
              type="button"
              className="faq-block-q"
              onClick={() => setOpen(isOpen ? null : idx)}
              aria-expanded={isOpen}
            >
              <span>{f.question}</span>
              <span style={{ color: C.brass, flexShrink: 0 }}>{isOpen ? '\u2212' : '+'}</span>
            </button>
            <div className={`faq-block-a${isOpen ? ' open' : ''}`}>
              <p>{f.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FutureDeathCareGuide;