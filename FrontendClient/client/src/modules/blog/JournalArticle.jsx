import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

/* =================================================================
   RESTPOINT JOURNAL - shared editorial template v2
   "The Space Between Grief and Truth" design:
   reading-progress bar, floating engagement dock (like / comment /
   reads), masthead nav, hero, drop-cap chapters, dark pull quote,
   beige chapter, emerald conclusion, community discussion (overlay
   + inline), scrolling banner.
   Views / likes / comments are persisted via the tenant-service
   blog-engagement API (JSON-file storage) at
   /api/v1/restpoint/blog-engagement/<slug>/...
   ================================================================= */

export const JOURNAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  :root{--ink:#000000;--bone:#FAF8F4;--bone2:#F3EFE6;--brass:#8B7355;--brassLight:#A98F6E;--verdigris:#3D4F47;--verdigrisDark:#2E3F37;--line:#E3DDD0;--gray:#8A8780;--grayLight:rgba(0,0,0,0.6);--accent:#C77B5E}
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{font-family:'Inter',system-ui,sans-serif;background:var(--bone);color:var(--ink);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overflow-x:hidden;line-height:1.6}

  /* ============ READING PROGRESS BAR ============ */
  .progress-bar{position:fixed;top:0;left:0;height:3px;width:0%;background:var(--accent);z-index:300;transition:width .1s ease}

  /* ============ FLOATING ENGAGEMENT DOCK ============ */
  .engagement-dock{position:fixed;left:30px;top:50%;transform:translateY(-50%);z-index:120;display:flex;flex-direction:column;gap:1.3rem;padding:1rem .6rem;background:rgba(250,248,244,.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--line);border-radius:50px;box-shadow:0 10px 30px rgba(0,0,0,.06)}
  .dock-item{display:flex;flex-direction:column;align-items:center;gap:.25rem;cursor:pointer;background:transparent;border:none;color:var(--gray);transition:all .3s ease;font-family:inherit;padding:0}
  .dock-item:hover{color:var(--accent);transform:translateY(-3px)}
  .dock-item.liked{color:var(--accent)}
  .dock-item svg{width:18px;height:18px}
  .dock-count{font-family:'JetBrains Mono',monospace;font-size:.62rem;font-weight:600;color:var(--ink)}
  .dock-divider{width:20px;height:1px;background:var(--line);margin:0 auto}

  /* ============ MASTHEAD ============ */
  .blog-nav{padding:2rem clamp(1.5rem,4vw,3rem);display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;font-size:0.75rem;letter-spacing:0.18em;text-transform:uppercase}
  .blog-nav-left{display:flex;align-items:center;gap:0.6rem;font-weight:600;background:none;border:none;cursor:pointer;font-family:inherit;font-size:inherit;letter-spacing:inherit;text-transform:inherit;color:inherit;padding:0}
  .blog-nav-left::before{content:'';width:8px;height:8px;background:var(--accent);border-radius:50%;flex-shrink:0}
  .blog-nav-right{display:flex;gap:2rem;color:var(--gray);flex-wrap:wrap;justify-content:flex-end}

  /* ============ HERO ============ */
  .blog-hero{position:relative;background:var(--bone);padding:2rem clamp(1.5rem,4vw,3rem) 0}
  .hero-content{max-width:1100px;margin:0 auto;text-align:center}
  .hero-meta{display:flex;justify-content:center;gap:2rem;font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--gray);margin-bottom:2rem;flex-wrap:wrap}
  .hero-meta span{display:flex;align-items:center;gap:0.4rem}
  .hero-meta span::before{content:'';width:4px;height:4px;background:var(--accent);border-radius:50%}
  .hero-title{font-family:'Fraunces',serif;font-size:clamp(3.5rem,8vw,7rem);font-weight:300;line-height:0.9;letter-spacing:-0.035em;color:var(--ink);margin-bottom:2.5rem}
  .hero-title em{font-style:italic;font-weight:300;color:var(--accent);display:block}
  .hero-excerpt{font-family:'Fraunces',serif;font-size:clamp(1.1rem,2vw,1.4rem);color:var(--grayLight);line-height:1.5;max-width:720px;margin:0 auto 3rem;font-weight:400}
  .hero-author{display:flex;align-items:center;justify-content:center;gap:1rem;border-top:1px solid var(--line);padding-top:2rem;max-width:400px;margin:0 auto}
  .author-avatar{width:44px;height:44px;border-radius:50%;background:var(--ink);color:var(--bone);display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-weight:500;font-size:1rem}
  .author-info{text-align:left}
  .author-info h4{font-size:0.9rem;font-weight:600;color:var(--ink)}
  .author-info p{font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--gray);letter-spacing:0.1em;text-transform:uppercase}
  .hero-image-container{margin-top:4rem;position:relative;width:100%;height:60vh;min-height:450px;overflow:hidden}
  .hero-image-container img{width:100%;height:100%;object-fit:cover;filter:contrast(1.05)}

  /* ============ ARTICLE BODY ============ */
  .article-body{background:var(--bone);padding:6rem 0;position:relative}
  .article-container{max-width:720px;margin:0 auto;padding:0 1.5rem}
  .article-body>.article-container>p:first-of-type::first-letter{font-family:'Fraunces',serif;font-size:5.5rem;font-weight:400;float:left;line-height:0.85;padding-right:1rem;padding-top:0.5rem;color:var(--accent)}
  .article-body p{font-family:'Inter',sans-serif;font-size:1.15rem;line-height:1.85;color:var(--grayLight);margin-bottom:2rem}
  .article-body p strong{color:var(--ink);font-weight:600}
  .chapter-heading{display:flex;align-items:baseline;gap:1.5rem;margin:4rem 0 2rem;border-bottom:1px solid var(--line);padding-bottom:1.5rem}
  .chapter-heading:first-child{margin-top:0}
  .chapter-num{font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--accent);letter-spacing:0.15em;flex-shrink:0}
  .chapter-title{font-family:'Fraunces',serif;font-size:clamp(1.75rem,3vw,2.5rem);font-weight:400;color:var(--ink);line-height:1.1;letter-spacing:-0.02em}
  .chapter-title em{font-style:italic;color:var(--brass)}

  /* ============ DARK PULL QUOTE ============ */
  .dark-break{background:var(--ink);color:var(--bone);padding:6rem 0;position:relative;overflow:hidden}
  .dark-break::before{content:'';position:absolute;top:0;left:0;width:400px;height:400px;background:radial-gradient(circle,rgba(199,123,94,0.15) 0%,transparent 70%);filter:blur(60px)}
  .pull-quote-container{max-width:900px;margin:0 auto;padding:0 2rem;position:relative;z-index:2;text-align:center}
  .pull-quote-container::before{content:'\u201C';display:block;font-family:'Fraunces',serif;font-size:8rem;color:var(--accent);line-height:0.5;margin-bottom:2rem;opacity:0.8}
  .pull-quote{font-family:'Fraunces',serif;font-size:clamp(1.75rem,3.5vw,2.75rem);font-style:italic;font-weight:300;line-height:1.35;color:var(--bone);margin:0 0 2rem 0}
  .pull-quote-author{font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--brassLight);display:flex;align-items:center;justify-content:center;gap:1rem}
  .pull-quote-author::before,.pull-quote-author::after{content:'';width:30px;height:1px;background:var(--brassLight);opacity:0.5}

  /* ============ SECOND BODY + FIGURE ============ */
  .article-secondary{background:var(--bone2)}
  .article-image{margin:4rem auto;max-width:1000px;border-radius:4px;overflow:hidden}
  .article-image img{width:100%;height:auto;display:block;filter:contrast(1.05)}
  .article-image-caption{display:block;text-align:center;font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:var(--gray);margin-top:1rem;letter-spacing:0.1em;text-transform:uppercase}

  /* ============ EMERALD CONCLUSION ============ */
  .emerald-conclusion{background:var(--verdigrisDark);color:var(--bone);padding:6rem 0}
  .emerald-conclusion .chapter-heading{border-bottom:1px solid rgba(250,248,244,0.15)}
  .emerald-conclusion .chapter-title{color:var(--bone)}
  .emerald-conclusion .chapter-num{color:var(--brassLight)}
  .emerald-conclusion p{color:rgba(250,248,244,0.75)}
  .emerald-conclusion p strong{color:var(--bone)}
  .conclusion-signoff{margin-top:4rem;text-align:center;border-top:1px solid rgba(250,248,244,0.15);padding-top:3rem}
  .conclusion-signoff p{font-family:'Fraunces',serif;font-size:1.5rem;font-style:italic;color:var(--brassLight);margin-bottom:1rem}
  .conclusion-signoff span{font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:rgba(250,248,244,0.5)}

  /* ============ SCROLLING BANNER ============ */
  .blog-banner{background:var(--accent);color:var(--ink);padding:2.5rem 0;overflow:hidden;position:relative}
  .banner-track{display:flex;align-items:center;white-space:nowrap;animation:scroll-text 30s linear infinite;width:max-content}
  .banner-item{font-family:'Fraunces',serif;font-size:clamp(3rem,6vw,5rem);font-weight:400;font-style:italic;padding:0 3rem;display:flex;align-items:center;gap:3rem}
  .banner-item span{font-style:normal;font-weight:300}
  .banner-icon{width:40px;height:40px;border-radius:50%;border:2px solid var(--ink);display:flex;align-items:center;justify-content:center;flex-shrink:0}
  @keyframes scroll-text{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

  /* ===== SHARED CONTENT PRIMITIVES ===== */
  .journal-list{margin:0 0 2rem;padding:0;list-style:none}
  .journal-list li{display:flex;gap:1.1rem;align-items:baseline;padding:0.85rem 0;border-bottom:1px solid var(--line);font-size:1.05rem;line-height:1.7;color:var(--grayLight)}
  .journal-list li:last-child{border-bottom:none}
  .journal-list .n{font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:var(--accent);letter-spacing:0.12em;min-width:2rem;flex-shrink:0}
  .journal-list li strong{color:var(--ink);font-weight:600}
  .journal-qa{margin:3rem 0 0;border-top:1px solid rgba(250,248,244,0.18);padding-top:2.5rem}
  .journal-qa h3{font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--brassLight);margin-bottom:1.6rem;font-weight:500}
  .journal-qa .qa{margin-bottom:1.6rem}
  .journal-qa .q{font-family:'Fraunces',serif;font-size:1.15rem;color:var(--bone);margin-bottom:0.4rem;font-weight:400}
  .journal-qa .a{font-size:0.98rem;line-height:1.75;color:rgba(250,248,244,0.66)}
  .journal-cta{display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;margin-top:3rem}
  .journal-btn{display:inline-flex;align-items:center;gap:0.6rem;background:var(--bone);color:var(--ink);border:none;padding:0.95rem 2rem;border-radius:50px;font-size:0.95rem;font-weight:600;cursor:pointer;transition:all .3s ease;font-family:'Inter',sans-serif}
  .journal-btn:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(0,0,0,0.28)}
  .journal-btn.ghost{background:transparent;color:var(--bone);border:1.5px solid rgba(250,248,244,0.35);box-shadow:none}
  .journal-btn.ghost:hover{border-color:var(--bone);transform:translateY(-2px)}
  .emerald-conclusion .journal-list li{border-bottom:1px solid rgba(250,248,244,0.12);color:rgba(250,248,244,0.75)}
  .emerald-conclusion .journal-list .n{color:var(--brassLight)}
  .emerald-conclusion .journal-list li strong{color:var(--bone)}

  /* ============ DISCUSSION OVERLAY ============ */
  .discussion-overlay{position:fixed;top:0;right:0;bottom:0;width:min(560px,100vw);background:var(--bone);border-left:1px solid var(--line);box-shadow:-30px 0 60px rgba(0,0,0,0.12);z-index:400;transform:translateX(102%);transition:transform .45s cubic-bezier(.16,1,.3,1);display:flex;flex-direction:column}
  .discussion-overlay.open{transform:translateX(0)}
  .do-header{display:flex;justify-content:space-between;align-items:center;padding:1.6rem 1.8rem;border-bottom:1px solid var(--line)}
  .do-title{font-family:'Fraunces',serif;font-size:1.6rem;color:var(--ink);font-weight:400}
  .do-sub{font-family:'JetBrains Mono',monospace;font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--gray);margin-top:0.2rem}
  .do-close{background:none;border:1px solid var(--line);border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink);transition:all .25s ease;flex-shrink:0}
  .do-close:hover{background:var(--bone2);transform:rotate(90deg)}
  .do-list{flex:1;overflow-y:auto;padding:1.5rem 1.8rem;display:flex;flex-direction:column;gap:1.3rem}
  .do-empty{font-family:'Fraunces',serif;font-style:italic;color:var(--gray);text-align:center;padding:3rem 0}
  .do-scrim{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:390;backdrop-filter:blur(2px)}

  /* ============ COMMUNITY COMMENTS ============ */
  .mag-comments{background:var(--bone2);border-top:1px solid var(--line);padding:5rem clamp(1.5rem,4vw,3rem)}
  .mag-wrap{max-width:900px;margin:0 auto}
  .mag-head{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid var(--line);padding-bottom:1.2rem;margin-bottom:2rem;gap:1rem;flex-wrap:wrap}
  .mag-title{font-family:'Fraunces',serif;font-size:clamp(1.8rem,3vw,2.4rem);font-weight:400;color:var(--ink)}
  .mag-title em{font-style:italic;color:var(--accent)}
  .mag-count{font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--gray)}
  .mag-list{display:flex;flex-direction:column;gap:1.4rem}
  .mag-comment{display:flex;gap:1rem;background:var(--bone);border:1px solid var(--line);border-radius:6px;padding:1.4rem}
  .mag-avatar{width:42px;height:42px;border-radius:50%;background:var(--verdigris);color:var(--bone);display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-weight:500;flex-shrink:0}
  .mag-content{flex:1;min-width:0}
  .mag-meta{display:flex;gap:0.8rem;align-items:baseline;margin-bottom:0.5rem;flex-wrap:wrap}
  .mag-name{font-weight:600;font-size:0.9rem;color:var(--ink)}
  .mag-date{font-family:'JetBrains Mono',monospace;font-size:0.62rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray)}
  .mag-text{font-size:0.98rem;line-height:1.7;color:var(--grayLight);margin:0 0 0.8rem}
  .mag-actions{display:flex;gap:1.2rem}
  .mag-action{display:inline-flex;align-items:center;gap:0.45rem;background:none;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:0.68rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--gray);padding:0;transition:color .2s ease}
  .mag-action:hover{color:var(--accent)}
  .mag-form{display:flex;flex-direction:column;gap:0.7rem;margin-bottom:2rem}
  .mag-input,.mag-textarea{width:100%;background:var(--bone);border:1px solid var(--line);border-radius:6px;padding:0.85rem 1rem;font-family:'Inter',sans-serif;font-size:0.95rem;color:var(--ink);outline:none;transition:border-color .2s ease;resize:vertical}
  .mag-input:focus,.mag-textarea:focus{border-color:var(--accent)}
  .mag-submit{align-self:flex-start;display:inline-flex;align-items:center;gap:0.5rem;background:var(--ink);color:var(--bone);border:none;padding:0.8rem 1.6rem;border-radius:50px;font-size:0.85rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .25s ease}
  .mag-submit:hover{background:var(--accent);color:var(--ink)}
  .mag-submit:disabled{opacity:0.6;cursor:wait}

  @media (max-width:768px){
    .blog-nav-right{display:none}
    .hero-title{font-size:3rem}
    .article-image{margin:3rem -1.5rem}
    .chapter-heading{gap:1rem}
  }
  @media (max-width:1180px){
    .engagement-dock{display:none}
  }
`;

/* ---- inline icons (match the Journal design) ---- */
const HeartSvg = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
  </svg>
);
const CommentSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);
const EyeSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const CloseSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);
const ArrowSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);

/* ---- formatting helpers ---- */
const fmtCount = (n) => {
  const v = Number(n) || 0;
  if (v >= 1000) {
    const k = (v / 1000).toFixed(1).replace(/\.0$/, '');
    return k + 'k';
  }
  return String(v);
};

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return days + ' Days Ago';
  if (days < 60) return Math.round(days / 7) + ' Weeks Ago';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ---- building blocks exported for reuse ---- */
const ChapterHead = ({ num, title, em }) => (
  <div className="chapter-heading">
    {num ? <span className="chapter-num">{num}</span> : null}
    <h2 className="chapter-title">{title}{em ? <em> {em}</em> : null}</h2>
  </div>
);

export const JournalFigure = ({ src, alt, caption }) => (
  <figure className="article-image">
    <img src={src} alt={alt || ''} loading="lazy" />
    {caption ? <figcaption className="article-image-caption">{caption}</figcaption> : null}
  </figure>
);

export const JournalList = ({ items }) => (
  <ul className="journal-list">
    {items.map((item, i) => (
      <li key={i}>
        <span className="n">{String(i + 1).padStart(2, '0')}</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const CommentCard = ({ c, onResonate }) => (
  <div className="mag-comment">
    <div className="mag-avatar">{String(c.name || '?').charAt(0).toUpperCase()}</div>
    <div className="mag-content">
      <div className="mag-meta">
        <span className="mag-name">{c.name}</span>
        <span className="mag-date">{fmtDate(c.date)}</span>
      </div>
      <p className="mag-text">{c.text}</p>
      <div className="mag-actions">
        <button className="mag-action" onClick={() => onResonate(c.id)}>
          <HeartSvg size={14} /> {c.resonates || 0} Resonate
        </button>
        <button className="mag-action" type="button">Reply</button>
      </div>
    </div>
  </div>
);

const JournalArticle = ({
  slug = '',
  navMeta = ['Vol. 01', '2026', 'Death Care'],
  heroMeta = [],
  title,
  titleAccent,
  excerpt,
  author = { initials: 'PM', name: 'Peter Mumo', role: 'Developer \u00B7 Restpoint' },
  heroImage,
  chapterOne,
  pullQuote,
  chapterTwo,
  conclusion,
  bannerWords = ['Restpoint Journal', 'The Future of Death Care'],
}) => {
  const navigate = useNavigate();

  // ---- reading progress ----
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setProgress(height > 0 ? Math.min(100, (winScroll / height) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ---- engagement state (views / likes / comments via tenant-service) ----
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const viewRegistered = useRef(false);

  useEffect(() => {
    if (!slug) return undefined;
    let cancelled = false;

    // Count one view per browser session per post.
    const viewKey = 'rp_viewed_' + slug;
    const registerView = async () => {
      try {
        if (!viewRegistered.current && !window.sessionStorage.getItem(viewKey)) {
          viewRegistered.current = true;
          window.sessionStorage.setItem(viewKey, '1');
          const r = await api.post('/blog-engagement/' + slug + '/view');
          if (!cancelled && r.data && r.data.data) setViews(r.data.data.views);
        }
      } catch {
        // offline / gateway down -> keep local state
      }
    };

    const load = async () => {
      try {
        const r = await api.get('/blog-engagement/' + slug);
        if (cancelled || !r.data || !r.data.data) return;
        setViews(r.data.data.views || 0);
        setLikes(r.data.data.likes || 0);
        setComments(Array.isArray(r.data.data.comments) ? r.data.data.comments : []);
      } catch {
        // offline -> zeros
      }
    };

    registerView().then(load);
    return () => { cancelled = true; };
  }, [slug]);

  // Lock body scroll while the discussion overlay is open.
  useEffect(() => {
    document.body.style.overflow = overlayOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [overlayOpen]);

  const toggleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    try {
      const r = await api.post('/blog-engagement/' + slug + '/like', { liked: next });
      if (r.data && r.data.data && r.data.data.likes != null) setLikes(r.data.data.likes);
    } catch {
      // keep optimistic value
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const r = await api.post('/blog-engagement/' + slug + '/comments', {
        name: (name || '').trim() || 'Anonymous',
        text: text.trim(),
      });
      if (r.data && r.data.data && Array.isArray(r.data.data.comments)) {
        setComments(r.data.data.comments);
        setText('');
      }
    } catch {
      // keep the draft so nothing is lost
    } finally {
      setSending(false);
    }
  };

  const resonate = async (id) => {
    setComments((cs) => cs.map((c) => (c.id === id ? { ...c, resonates: (c.resonates || 0) + 1 } : c)));
    try {
      await api.post('/blog-engagement/' + slug + '/comments/' + id + '/resonate');
    } catch {
      // keep optimistic value
    }
  };

  const bannerItem = (hidden) => (
    <div className="banner-item" aria-hidden={hidden ? 'true' : undefined}>
      <span>{bannerWords[0]}</span>
      <div className="banner-icon"><ArrowSvg /></div>
      <em>Read More</em>
      <div className="banner-icon"><ArrowSvg /></div>
      {bannerWords[1] ? (
        <>
          <span>{bannerWords[1]}</span>
          <div className="banner-icon"><ArrowSvg /></div>
          <em>Read More</em>
          <div className="banner-icon"><ArrowSvg /></div>
        </>
      ) : null}
    </div>
  );

  const commentForm = (
    <form className="mag-form" onSubmit={submitComment}>
      <input
        className="mag-input"
        type="text"
        placeholder="Your name (optional)"
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        className="mag-textarea"
        placeholder="Share your thoughts on this story..."
        rows={3}
        value={text}
        maxLength={2000}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="mag-submit" type="submit" disabled={sending || !text.trim()}>
        {sending ? 'Posting...' : 'Post Comment'} <ArrowSvg />
      </button>
    </form>
  );

  const commentCards = comments.map((c) => (
    <CommentCard key={c.id} c={c} onResonate={resonate} />
  ));

  return (
    <>
      <style>{JOURNAL_CSS}</style>

      {/* READING PROGRESS */}
      <div className="progress-bar" style={{ width: progress + '%' }} />

      {/* FLOATING ENGAGEMENT DOCK */}
      <div className="engagement-dock">
        <button className={liked ? 'dock-item liked' : 'dock-item'} onClick={toggleLike} aria-label="Like this story">
          <HeartSvg />
          <span className="dock-count">{fmtCount(likes)}</span>
        </button>
        <div className="dock-divider" />
        <button className="dock-item" onClick={() => setOverlayOpen(true)} aria-label="Open discussion">
          <CommentSvg />
          <span className="dock-count">{fmtCount(comments.length)}</span>
        </button>
        <div className="dock-divider" />
        <div className="dock-item" style={{ cursor: 'default' }} aria-label="Reads">
          <EyeSvg />
          <span className="dock-count">{fmtCount(views)}</span>
        </div>
      </div>

      {/* DISCUSSION OVERLAY */}
      {overlayOpen && <div className="do-scrim" onClick={() => setOverlayOpen(false)} />}
      <div className={overlayOpen ? 'discussion-overlay open' : 'discussion-overlay'}>
        <div className="do-header">
          <div>
            <div className="do-title">Discussion</div>
            <div className="do-sub">{comments.length} {comments.length === 1 ? 'comment' : 'comments'} \u00B7 Restpoint Journal</div>
          </div>
          <button className="do-close" onClick={() => setOverlayOpen(false)} aria-label="Close discussion">
            <CloseSvg />
          </button>
        </div>
        <div className="do-list">
          {comments.length === 0 ? (
            <div className="do-empty">No comments yet. Be the first to share your thoughts.</div>
          ) : commentCards}
        </div>
        <div style={{ borderTop: '1px solid var(--line)', padding: '1.2rem 1.8rem 1.6rem' }}>
          {commentForm}
        </div>
      </div>

      {/* MASTHEAD NAV */}
      <nav className="blog-nav">
        <button
          className="blog-nav-left"
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/'); }}
        >
          Restpoint Journal
        </button>
        <div className="blog-nav-right">
          {navMeta.map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </nav>

      {/* HERO */}
      <header className="blog-hero">
        <div className="hero-content">
          {heroMeta.length > 0 && (
            <div className="hero-meta">
              {heroMeta.map((m, i) => <span key={i}>{m}</span>)}
            </div>
          )}
          <h1 className="hero-title">{title}{titleAccent ? <em>{titleAccent}</em> : null}</h1>
          {excerpt ? <p className="hero-excerpt">{excerpt}</p> : null}
          {author ? (
            <div className="hero-author">
              <div className="author-avatar">{author.initials}</div>
              <div className="author-info">
                <h4>{author.name}</h4>
                <p>{author.role}</p>
              </div>
            </div>
          ) : null}
        </div>
        {heroImage ? (
          <div className="hero-image-container">
            <img src={heroImage.src} alt={heroImage.alt || ''} />
          </div>
        ) : null}
      </header>

      {/* CHAPTER 01 - light bone */}
      <section className="article-body">
        <div className="article-container">
          <ChapterHead num={chapterOne.num} title={chapterOne.title} em={chapterOne.em} />
          {chapterOne.children}
        </div>
      </section>

      {/* DARK PULL QUOTE BREAK */}
      {pullQuote ? (
        <section className="dark-break">
          <div className="pull-quote-container">
            <blockquote className="pull-quote">{pullQuote.text}</blockquote>
            <div className="pull-quote-author">{pullQuote.author}</div>
          </div>
        </section>
      ) : null}

      {/* CHAPTER 02 - beige */}
      <section className="article-body article-secondary">
        <div className="article-container">
          <ChapterHead num={chapterTwo.num} title={chapterTwo.title} em={chapterTwo.em} />
          {chapterTwo.children}
        </div>
      </section>

      {/* EMERALD CONCLUSION */}
      <section className="emerald-conclusion">
        <div className="article-container">
          <ChapterHead num={conclusion.num} title={conclusion.title} em={conclusion.em} />
          {conclusion.children}
          {conclusion.faq ? (
            <div className="journal-qa">
              <h3>Common Questions</h3>
              {conclusion.faq.map((f, i) => (
                <div className="qa" key={i}>
                  <div className="q">{f.question}</div>
                  <div className="a">{f.answer}</div>
                </div>
              ))}
            </div>
          ) : null}
          {conclusion.cta ? (
            <div className="journal-cta">
              <button className="journal-btn" onClick={conclusion.cta.onStart}>
                Start Free Trial <ArrowSvg />
              </button>
              <button className="journal-btn ghost" onClick={conclusion.cta.onDemo}>
                Book a Demo
              </button>
            </div>
          ) : null}
          {conclusion.signoff ? (
            <div className="conclusion-signoff">
              <p>{conclusion.signoff.note}</p>
              <span>{conclusion.signoff.meta}</span>
            </div>
          ) : null}
        </div>
      </section>

      {/* COMMUNITY DISCUSSION */}
      <section className="mag-comments">
        <div className="mag-wrap">
          <div className="mag-head">
            <h2 className="mag-title">Community <em>Discussion</em></h2>
            <div className="mag-count">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</div>
          </div>
          {commentForm}
          <div className="mag-list">
            {comments.length === 0 ? (
              <div className="do-empty">No comments yet. Be the first to share your thoughts.</div>
            ) : commentCards}
          </div>
        </div>
      </section>

      {/* SCROLLING BANNER */}
      <section
        className="blog-banner"
        style={{ cursor: 'pointer' }}
        onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/blog'); }}
      >
        <div className="banner-track">
          {bannerItem(false)}
          {bannerItem(true)}
        </div>
      </section>
    </>
  );
};

export default JournalArticle;
