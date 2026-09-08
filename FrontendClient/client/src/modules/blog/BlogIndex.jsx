import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { JOURNAL_CSS } from './JournalArticle';

/* =================================================================
   RESTPOINT JOURNAL — /blog index
   Lists every Restpoint Journal story in the editorial design.
   NOTE: /blog redirects to the flagship article; this index now
   lives at /blog/stories.
   ================================================================= */

// 14300 -> "14k", 612 -> "612"
const fmtCount = (n) => {
  const v = Number(n) || 0;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return String(v);
};

const slugFrom = (to) => String(to || '').replace(/^\/blog\//, '');
const statsLabel = (s) =>
  s ? `${fmtCount(s.views)} Reads · ${fmtCount(s.likes)} Likes · ${fmtCount(s.commentCount || 0)} Comments` : null;

const POSTS = [
  {
    to: '/blog/architecture-of-blooms',
    category: 'Vol. 02',
    read: '7 min read',
    date: 'October 2026',
    title: 'The Architecture',
    accent: 'of Blooms.',
    excerpt: 'Why we digitized the floral selection process, replacing glossy catalogs and stressful phone calls with a serene, educational marketplace right on the funeral homes tablet.',
    author: 'Restpoint Design Team',
    featured: true,
  },
  {
    to: '/blog/future-of-death-care-software-restpoint',
    category: 'Field Notes',
    read: '9 min read',
    date: 'September 2026',
    title: 'The Future of',
    accent: 'Death Care.',
    excerpt: 'From QR-scanned intake and digital release to hearse self-booking, coffin marketplaces and 24/7 family portals — how modern funeral homes are going fully automated.',
    author: 'Peter Mumo',
  },
  {
    to: '/blog/bereavement-management',
    category: 'Management Guide',
    read: '12 min read',
    date: 'January 2026',
    title: 'Bereavement Management,',
    accent: 'Done Right.',
    excerpt: 'Streamline funeral claims, member benefits and welfare programs with modern software — best practices for churches, SACCOs and chamas.',
    author: 'Restpoint Editorial',
  },
  {
    to: '/blog/member-contributions',
    category: 'Welfare Guide',
    read: '10 min read',
    date: 'February 2026',
    title: 'Member Contributions,',
    accent: 'Without the Chaos.',
    excerpt: 'End cash-handling chaos and keep the welfare fund audit-ready — a practical contribution system for committees of any size.',
    author: 'Restpoint Editorial',
  },
  {
    to: '/blog/funeral-welfare-management',
    category: 'Field Guide',
    read: '8 min read',
    date: 'March 2026',
    title: 'Funeral Welfare,',
    accent: 'A Modern Guide.',
    excerpt: 'How welfare funds actually work — from member registration to benefit disbursement — and how to run one digitally.',
    author: 'Restpoint Editorial',
  },
];

const INDEX_CSS = `
  .ji-wrap{max-width:1200px;margin:0 auto;padding:5rem clamp(1.5rem,4vw,3rem) 5rem}
  .ji-featured{display:grid;grid-template-columns:1.05fr 1fr;background:var(--ink);color:var(--bone);border-radius:4px;overflow:hidden;cursor:pointer;border:none;text-align:left;width:100%}
  .ji-featured-img{min-height:380px}
  .ji-featured-img img{width:100%;height:100%;object-fit:cover;filter:contrast(1.05)}
  .ji-featured-body{padding:clamp(2rem,4vw,3.5rem);display:flex;flex-direction:column;gap:1.2rem}
  .ji-cat{font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--accent);display:flex;align-items:center;gap:0.5rem}
  .ji-cat::before{content:'';width:4px;height:4px;background:var(--accent);border-radius:50%}
  .ji-featured-body h2{font-family:'Fraunces',serif;font-size:clamp(2.2rem,4vw,3.4rem);font-weight:300;line-height:0.95;letter-spacing:-0.03em;color:var(--bone)}
  .ji-featured-body h2 em{font-style:italic;color:var(--accent)}
  .ji-featured-body p{font-size:1rem;line-height:1.7;color:rgba(250,248,244,0.62);max-width:480px}
  .ji-read{font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--brassLight);display:flex;align-items:center;gap:0.6rem;margin-top:auto}
  .ji-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:1.5rem}
  .ji-card{background:var(--bone);border:1px solid var(--line);border-radius:4px;padding:2rem;display:flex;flex-direction:column;gap:1rem;cursor:pointer;text-align:left;transition:all .3s ease;font-family:inherit}
  .ji-card:hover{transform:translateY(-4px);box-shadow:0 20px 40px rgba(21,23,26,0.08);border-color:var(--brass)}
  .ji-card h3{font-family:'Fraunces',serif;font-size:1.65rem;font-weight:400;line-height:1.05;letter-spacing:-0.02em;color:var(--ink)}
  .ji-card h3 em{font-style:italic;color:var(--accent)}
  .ji-card p{font-size:0.95rem;line-height:1.65;color:var(--grayLight)}
  .ji-meta{font-family:'JetBrains Mono',monospace;font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--gray);display:flex;gap:1.2rem;margin-top:auto;flex-wrap:wrap}
  .ji-stats{font-family:'JetBrains Mono',monospace;font-size:0.68rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent)}
  @media (max-width:920px){.ji-featured{grid-template-columns:1fr}.ji-featured-img{min-height:260px}.ji-grid{grid-template-columns:1fr}}
`;

const BlogIndex = () => {
  const navigate = useNavigate();
  const open = (to) => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate(to); };
  const featured = POSTS[0];
  const rest = POSTS.slice(1);
  // Engagement summary (views / likes / comments per story) from the
  // tenant-service blog-engagement API. Fails soft: offline -> cards simply
  // render without the stats row.
  const [stats, setStats] = useState({});

  useEffect(() => {
    let cancelled = false;
    api.get('/blog-engagement')
      .then((r) => {
        if (!cancelled && r.data && r.data.data && typeof r.data.data === 'object') {
          setStats(r.data.data);
        }
      })
      .catch(() => { /* counts unavailable -> hide the stats rows */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Helmet>
        <title>Restpoint Journal — Field Notes on Death Care Technology | RestPoint</title>
        <meta name="description" content="Field notes and deep dives on death care technology: fully automated funeral homes, bereavement management, member contributions and funeral welfare — from the Restpoint team." />
        <link rel="canonical" href="https://restpoint.co.ke/blog/stories" />
      </Helmet>

      <style>{JOURNAL_CSS}</style>
      <style>{INDEX_CSS}</style>

      {/* MASTHEAD NAV */}
      <nav className="blog-nav">
        <button
          className="blog-nav-left"
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/'); }}
        >
          Restpoint Journal
        </button>
        <div className="blog-nav-right">
          <span>Vol. 01</span>
          <span>2026</span>
          <span>Death Care</span>
        </div>
      </nav>

      {/* HERO */}
      <header className="blog-hero">
        <div className="hero-content">
          <div className="hero-meta">
            <span>Field Notes</span>
            <span>Guides</span>
            <span>2026</span>
          </div>
          <h1 className="hero-title">Restpoint<em>Journal.</em></h1>
          <p className="hero-excerpt">
            Notes from the front desk, the prep room and the portal — on building software that serves grieving families with empathy.
          </p>
          <div className="hero-author">
            <div className="author-avatar">RP</div>
            <div className="author-info">
              <h4>The Restpoint Team</h4>
              <p>Death Care Technology</p>
            </div>
          </div>
        </div>
      </header>

      {/* STORIES */}
      <section className="ji-wrap">
        <button className="ji-featured" onClick={() => open(featured.to)}>
          <div className="ji-featured-img">
            <img
              src="https://images.unsplash.com/photo-1505290420458-b1d24243d6e8?q=80&w=1600&auto=format&fit=crop"
              alt="A calm, architectural space"
              loading="lazy"
            />
          </div>
          <div className="ji-featured-body">
            <div className="ji-cat">{featured.category} · Featured</div>
            <h2>{featured.title}<br /><em>{featured.accent}</em></h2>
            <p>{featured.excerpt}</p>
            {statsLabel(stats[slugFrom(featured.to)]) && (
              <div className="ji-stats">{statsLabel(stats[slugFrom(featured.to)])}</div>
            )}
            <div className="ji-read">Read the story →</div>
          </div>
        </button>

        <div className="ji-grid">
          {rest.map((p) => {
            const st = stats[slugFrom(p.to)];
            return (
              <button key={p.to} className="ji-card" onClick={() => open(p.to)}>
                <div className="ji-cat">{p.category}</div>
                <h3>{p.title}<br /><em>{p.accent}</em></h3>
                <p>{p.excerpt}</p>
                <div className="ji-meta">
                  <span>{p.read}</span>
                  <span>{p.date}</span>
                  <span>{p.author}</span>
                  {st && (
                    <span className="ji-stat">
                      {fmtCount(st.views)} reads · {fmtCount(st.likes)} likes · {fmtCount(st.commentCount || 0)} comments
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SCROLLING BANNER — back to the top of the journal */}
      <section
        className="blog-banner"
        style={{ cursor: 'pointer' }}
        onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate(featured.to); }}
      >
        <div className="banner-track">
          <div className="banner-item">
            <span>Restpoint Journal</span>
            <div className="banner-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </div>
            <em>Read More</em>
            <div className="banner-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </div>
            <span>The Future of Death Care</span>
            <div className="banner-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </div>
            <em>Read More</em>
            <div className="banner-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </div>
          </div>
          <div className="banner-item" aria-hidden="true">
            <span>Restpoint Journal</span>
            <div className="banner-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </div>
            <em>Read More</em>
            <div className="banner-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </div>
            <span>The Future of Death Care</span>
            <div className="banner-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </div>
            <em>Read More</em>
            <div className="banner-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogIndex;

