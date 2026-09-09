import{r as $}from"./chunk-CXHxssQy.js";import{y as W}from"./chunk-CXAmgOhv.js";import{l as ee}from"./chunk-DWc5g_hH.js";import{o as te}from"./chunk-BY9AVXEY.js";import{i as p}from"./index-D6gguvjv.js";var o=$(W(),1),e=te(),re=`
  @import url('https://fonts.googleapis.com/css2?famliley=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display==swap');
  :root {
    --ink: #000000;
    --bone: #FAF8F4;
    --bone2: #F3EFE6;
    --brass: #8B7355;
    --brassLight: #A98F6E;
    --verdigris: #3D4F47;
    --verdigrisDark: #2E3F37;
    --ine: #E3DDD0;
    --gray: #8A8780;
    --grayLight: rgba(0,0,0,0.6);
    --accent: #C77B5E;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bone);
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
    line-height: 1.6;  }

  /* ============ READING PROGRESS BAR ============ */
  .progress-bar {
    position: fixed;    top: 0; left: 0;
    height: 3px; width: 0%;
    background: var(--accent);    z-index: 100;
    transition: width 0.1s ease;
  }

  /* ============ FLOATING ENGAGEMENT DOCK ============ */
  .engagment-dock {
    position: fixed;    left: 30px;    top: 50%;
    transform: translateY(-50%);
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem 0.6rem;
    background: rgba(250, 248, 244, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid var(--line);
    border-radius: 50px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  }
  .dock-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    cursor: pointer;
    background: transparent;
    border: none;
    color: var(--gray);
    transition: all 0.3s ease;
  }
  .dock-item:hover { color: var(--accent); transform: translateY(-3px); }
  .dock-item.liked { color: var(--accent); }
  .dock-item svg { width: 18px; height: 18px; }
  .dock-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--ink);  }
  .dock-divider {
    width: 20px;    height: 1px;
    background: var(--line);    margin: 0 auto;
  }

  /* ============ MASTHEAD ============ */
  .blog-nav {
    padding: 2rem clamp(1.5rem, 4vw, 3rem);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .blog-nav-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 600;
  }
  .blog-nav-left::before {
    content: '';
    width: 8px; height: 8px;
    background: var(--accent);
    border-radius: 50%;
  }
  .blog-nav-right { display: flex; gap: 2rem; color: var(--gray); }

  /* ============ HERO SECTION ============ */
  .blog-hero {
    position: relative;
    background: var(--bone);
    padding: 2rem clamp(1.5rem, 4vw, 3rem) 0;
  }
  .hero-content {
    max-width: 1100px;
    margin: 0 auto;
    text-align: center;
  }
  .hero-meta {
    display: flex;
    justify-content: center;
    gap: 2rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gray);
    margin-bottom: 2rem;
  }
  .hero-meta span { display: flex; align-items: center; gap: 0.4rem; }
  .hero-meta span::before {
    content: '';
    width: 4px; height: 4px;
    background: var(--accent);
    border-radius: 50%;
  }
  .hero-title {
    font-family: 'Fraunces', serif;
    font-size: clamp(3.5rem, 8vw, 7rem);
    font-weight: 300;
    line-height: 0.9;
    letter-spacing: -0.035em;
    color: var(--ink);
    margin-bottom: 2.5rem;
  }
  .hero-title em {
    font-style: italic;
    font-weight: 300;
    color: var(--acent);
    display: block;
  }
  .hero-exceprt {
    font-family: 'Fraunces', serif;
    font-size: clamp(1.1rem, 2vw, 1.4rem);
    color: var(--grayLight);
    line-height: 1.5;
    max-width: 700px;
    margin: 0 auto 3rem;
    font-weight: 400;
  }
  .hero-uthor {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    border-top: 1px solid var(--line);    padding-top: 2rem;
    max-width: 400px;
    margin: 0 auto;
  }
  .uthor-avatar {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: var(--ink);
    color: var(--bone);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Fraunces', serif;
    font-weight: 500;
  }
  .uthor-info { text-align: left; }
  .uthor-info h4 { font-size: 0.9rem; font-weight: 600; color: var(--ink); }
  .uthor-info p {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    color: var(--gray);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .hero-image-container {
    margin-top: 4rem;
    position: relative;
    width: 100%;
    height: 60vh;
    min-height: 450px;
    overflow: hidden;
  }
  .hero-image-container img {
    width: 100%; height: 100%;
    object-fit: cover;
    filter: contrast(1.05) saturate(0.9);
  }

  /* ============ ARTICLE BODY ============ */
  .article-body {
    background: var(--bone);
    padding: 6rem 0;
    position: relative;
  }
  .article-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }
  .article-body > .article-container > p:first-of-type::first-letter {
    font-family: 'Fraunces', serif;
    font-size: 5.5rem;
    font-weight: 400;
    float: left;
    line-height: 0.85;
    padding-right: 1rem;
    padding-top: 0.5rem;
    color: var(--accent);
  }
  .article-body p {
    font-family: 'Inter', sans-serif;
    font-size: 1.15rem;
    line-height: 1.85;
    color: var(--grayLight);
    margin-bottom: 2rem;
  }
  .article-body p strong { color: var(--ink); font-weight: 600; }
  .chapter-heading {
    display: flex;
    align-items: baseline;
    gap: 1.5rem;
    margin: 4rem 0 2rem;
    border-bottom: 1px solid var(--line);
    padding-bottom: 1.5rem;
  }
  .chapter-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--accent);
    letter-spacing: 0.15em;
  }
  .chapter-title {
    font-family: 'Fraunces', serif;
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    font-weight: 400;
    color: var(--ink);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .chapter-title em { font-style: italic; color: var(--brass); }

  /* ============ INLINE ARTICLE IMAGE ============ */
  .article-inline-image {
    margin: 4rem 0;
    border-radius: 4px;
    overflow: hidden;
  }
  .article-inline-image img {
    width: 100%;
    height: auto;
    display: block;
    filter: contrast(1.05) saturate(0.9);
  }
  .article-inline-image figcaption {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--gray);
    margin-top: 1rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-align: center;
  }

  /* ============ FLOWER ETIQUETTE LIST ============ */
  .flower-types {
    list-style: none;
    margin: 3rem 0;
    padding: 0;
    border-top: 1px solid var(--line);
  }
  .flower-type-item {
    padding: 2rem 0;
    border-bottom: 1px solid var(--line);
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 2rem;
    align-items: baseline;
  }
  .flower-type-name {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-weight: 500;
    color: var(--accent);
    font-size: 1.25rem;
  }
  .flower-type-desc {
    font-size: 1rem;
    color: var(--grayLight);
    line-height: 1.6;
  }

  /* ============ DARK BREAK ============ */
  .dark-break {
    background: var(--ink);
    color: var(--bone);
    padding: 6rem 0;
    position: relative;
    overflow: hidden;
  }
  .dark-break::before {
    content: '';
    position: absolute;
    top: 20%; right: -10%;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(199, 123, 94, 0.1) 0%, transparent 70%);
    filter: blur(60px);
  }
  .dark-break-content {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1.5rem;
    position: relative;
    z-index: 2;
  }
  .dark-break p {
    font-family: 'Fraunces', serif;
    font-size: 1.3rem;
    line-height: 1.7;
    color: rgba(250, 248, 244, 0.8);
    margin-bottom: 2rem;
  }
  .dark-break p strong { color: var(--bone); font-weight: 600; }
  .dark-break .chapter-heading { border-color: rgba(250, 248, 244, 0.15); }
  .dark-break .chapter-title { color: var(--bone); }
  .dark-break .chapter-title em { color: var(--brassLight); }

  /* ============ PULL QUOTE ============ */
  .pull-quote-section {
    background: var(--verdigrisDark);
    padding: 8rem 0;
    text-align: center;
  }
  .pull-quote-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 2;
  }
  .pull-quote-container::before {
    content: '"';
    display: block;
    font-family: 'Fraunces', serif;
    font-size: 8rem;
    color: var(--accent);
    line-height: 0.5;
    margin-bottom: 2rem;
    opacity: 0.8;
  }
  .pull-quote {
    font-family: 'Fraunces', serif;
    font-size: clamp(1.75rem, 3.5vw, 2.75rem);
    font-style: italic;
    font-weight: 300;
    line-height: 1.35;
    color: var(--bone);
    margin: 0;
  }

  /* ============ MAGAZINE-STYLE DISCUSSION OVERLAY ============ */
  .discussion-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: var(--bone2);
    z-index: 200;
    overflow-y: auto;
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px);
    transition: opacity 0.5s ease, transform 0.5s ease, visibility 0s 0.5s;
  }
  .discussion-overlay.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    transition: opacity 0.5s ease, transform 0.5s ease, visibility 0s 0s;
  }
  .discussion-header {
    position: sticky;
    top: 0;
    background: rgba(243, 239, 230, 0.9);
    border-bottom: 1px solid var(--line);
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 10;
    backdrop-filter: blur(10px);
  }
  .discussion-title {
    font-family: 'Fraunces', serif;
    font-size: 1.5rem;
    font-weight: 400;
    font-style: italic;
    color: var(--ink);
  }
  .close-discussion {
    background: var(--ink);
    color: var(--bone);
    border: none;
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.3s ease;
  }
  .close-discussion:hover { transform: rotate(90deg); }
  .discussion-content {
    max-width: 800px;
    margin: 4rem auto;
    padding: 0 2rem;
  }
  .discussion-intro {
    text-align: center;
    margin-bottom: 5rem;
  }
  .discussion-intro h2 {
    font-family: 'Fraunces', serif;
    font-size: 3rem;
    font-weight: 300;
    color: var(--ink);
    margin-bottom: 1rem;
    letter-spacing: -0.02em;
  }
  .discussion-intro p {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gray);
  }
  .guestbook-form {
    background: var(--bone);
    border: 1px solid var(--line);
    padding: 2.5rem;
    border-radius: 4px;
    margin-bottom: 6rem;
    text-align: center;
  }
  .guestbook-form h3 {
    font-family: 'Fraunces', serif;
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  .guestbook-form p {
    font-size: 0.9rem;
    color: var(--gray);
    margin-bottom: 2rem;
  }
  .guestbook-input {
    width: 100%;
    background: var(--bone2);
    border: 1px solid var(--line);
    padding: 1.5rem;
    font-family: 'Fraunces', serif;
    font-size: 1.1rem;
    color: var(--ink);
    border-radius: 4px;
    resize: vertical;
    min-height: 120px;
    margin-bottom: 1rem;
    transition: border 0.3s ease;
  }
  .guestbook-input:focus { outline: none; border-color: var(--accent); }
  .guestbook-submit {
    background: var(--ink);
    color: var(--bone);
    border: none;
    padding: 1rem 2.5rem;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.3s ease;
  }
  .guestbook-submit:hover { background: var(--verdigrisDark); }
  .comment-list { display: flex; flex-direction: column; gap: 4rem; }

  .mag-comment {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 2rem;
    padding-bottom: 4rem;
    border-bottom: 1px solid var(--line);
  }
  .mag-comment:last-child { border-bottom: none; }
  .mag-avatar {
    width: 60px; height: 60px;
    border-radius: 50%;
    background: var(--ink);
    color: var(--bone);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Fraunces', serif;
    font-size: 1.5rem;
    font-weight: 500;
  }
  .mag-content { flex: 1; }
  .mag-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .mag-name {
    font-family: 'Fraunces', serif;
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--ink);
  }
  .mag-date {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--gray);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .mag-text {
    font-family: 'Fraunces', serif;
    font-size: 1.25rem;
    line-height: 1.7;
    color: var(--grayLight);
    margin-bottom: 1.5rem;
  }
  .mag-text::first-letter {
    font-size: 3rem;
    float: left;
    line-height: 0.8;
    padding-right: 0.5rem;
    padding-top: 0.3rem;
    color: var(--accent);
    font-weight: 400;
  }
  .mag-actions { display: flex; gap: 1.5rem; }
  .mag-action {
    background: none;
    border: none;
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--gray);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: color 0.3s ease;
  }
  .mag-action:hover { color: var(--accent); }
  .comment-empty {
    font-family: 'Fraunces', serif;
    font-style: italic;
    color: var(--gray);
    text-align: center;
    padding: 3rem 0;
  }

  /* ============ MASSIVE SCROLLING BANNER ============ */
  .blog-banner {
    background: var(--accent);
    color: var(--ink);
    padding: 2.5rem 0;
    overflow: hidden;
  }
  .banner-track {
    display: flex;
    align-items: center;
    white-space: nowrap;
    animation: scroll-text 30s linear infinite;
  }
  .banner-item {
    font-family: 'Fraunces', serif;
    font-size: clamp(3rem, 6vw, 5rem);
    font-weight: 400;
    font-style: italic;
    padding: 0 3rem;
    display: flex;
    align-items: center;
    gap: 3rem;
  }
  .banner-item span { font-style: normal; font-weight: 300; }
  .banner-icon {
    width: 40px; height: 40px;
    border-radius: 50%;
    border: 2px solid var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  @keyframes scroll-text {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  /* ============ RESPONSIVE ============ */
  @media (max-width: 900px) {
    .engagment-dock {
      left: auto;
      right: 20px;
      top: auto;
      bottom: 20px;
      transform: none;
      flex-direction: row;
      padding: 0.8rem 1rem;
      gap: 1rem;
    }
    .dock-item { flex-direction: row; gap: 0.5rem; }
    .dock-divider { width: 1px; height: 20px; margin: 0; }
    .blog-nav-right { display: none; }
    .hero-image-container { height: 40vh; min-height: 300px; }
    .mag-comment { grid-template-columns: 1fr; gap: 1rem; }
    .discussion-content { margin: 2rem auto; }
    .flower-type-item { grid-template-columns: 1fr; gap: 0.5rem; }
  }
/* ============ SHARED CONTENT PRIMITIVES ============ */
  .journal-list{margin:0 0 2rem;padding:0;list-style:none}
  .journal-list li{display:flex;gap:1.1rem;align-items:baseline;padding:0.85rem 0;border-bottom:1px solid var(--line);font-size:1.05rem;line-height:1.7;color:var(--grayLight)}
  .journal-list li:last-child{border-bottom:none}
  .journal-list .n{font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:var(--accent);letter-spacing:0.12em;min-width:2rem;flex-shrink:0}
  .journal-list li strong{color:var(--ink);font-weight:600}
  .dark-break .journal-list li{border-bottom:1px solid rgba(250,248,244,0.12);color:rgba(250,248,244,0.75)}
  .dark-break .journal-list .n{color:var(--brassLight)}
  .dark-break .journal-list li strong{color:var(--bone)}
  .journal-qa{margin:3rem 0 0;border-top:1px solid rgba(250,248,244,0.18);padding-top:2.5rem}
  .journal-qa h3{font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--brassLight);margin-bottom:1.6rem;font-weight:500}
  .journal-qa .qa{margin-bottom:1.6rem}
  .journal-qa .q{font-family:'Fraunces',serif;font-size:1.15rem;color:var(--bone);margin-bottom:0.4rem;font-weight:400}
  .journal-qa .a{font-size:0.98rem;line-height:1.75;color:rgba(250,248,244,0.66)}
  .journal-cta{display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;margin-top:3rem}
  .journal-btn{display:inline-flex;align-items:center;gap:0.6rem;background:var(--bone);color:var(--ink);border:none;padding:0.95rem 2rem;border-radius:50px;font-size:0.95rem;font-weight:600;cursor:pointer;transition:all 0.3s ease;font-family:'Inter',sans-serif}
  .journal-btn:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(0,0,0,0.28)}
  .journal-btn.ghost{background:transparent;color:var(--bone);border:1.5px solid rgba(250,248,244,0.35);box-shadow:none}
  .journal-btn.ghost:hover{border-color:var(--bone);transform:translateY(-2px)}
  .conclusion-signoff{margin-top:4rem;text-align:center;border-top:1px solid rgba(250,248,244,0.15);padding-top:3rem}
  .conclusion-signoff p{font-family:'Fraunces',serif;font-size:1.5rem;font-style:italic;color:var(--brassLight);margin-bottom:1rem}
  .conclusion-signoff span{font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:rgba(250,248,244,0.5)}
`,D=({size:t=18})=>(0,e.jsxs)("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M7 10v12"}),(0,e.jsx)("path",{d:"M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"})]}),ae=()=>(0,e.jsx)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:(0,e.jsx)("path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z"})}),ne=()=>(0,e.jsxs)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"}),(0,e.jsx)("circle",{cx:"12",cy:"12",r:"3"})]}),ie=()=>(0,e.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M18 6 6 18"}),(0,e.jsx)("path",{d:"m6 6 12 12"})]}),I=()=>(0,e.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M5 12h14"}),(0,e.jsx)("path",{d:"m12 5 7 7-7 7"})]}),j=t=>{const n=Number(t)||0;return n>=1e3?(n/1e3).toFixed(1).replace(/\.0$/,"")+"k":String(n)},oe=t=>{if(!t)return"";const n=new Date(t);if(Number.isNaN(n.getTime()))return"";const i=Math.floor((Date.now()-n.getTime())/864e5);return i<=0?"Today":i===1?"Yesterday":i<14?i+" Days Ago":i<60?Math.round(i/7)+" Weeks Ago":n.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})},w=({num:t,title:n,em:i})=>(0,e.jsxs)("div",{className:"chapter-heading",children:[t?(0,e.jsx)("span",{className:"chapter-num",children:t}):null,(0,e.jsxs)("h2",{className:"chapter-title",children:[n,i?(0,e.jsxs)("em",{children:[" ",i]}):null]})]}),pe=({src:t,alt:n,caption:i})=>(0,e.jsxs)("figure",{className:"article-inline-image",children:[(0,e.jsx)("img",{src:t,alt:n||"",loading:"lazy"}),i?(0,e.jsx)("figcaption",{children:i}):null]}),fe=({items:t})=>(0,e.jsx)("ul",{className:"journal-list",children:t.map((n,i)=>(0,e.jsxs)("li",{children:[(0,e.jsx)("span",{className:"n",children:String(i+1).padStart(2,"0")}),(0,e.jsx)("span",{children:n})]},i))}),ue=({items:t})=>(0,e.jsx)("ul",{className:"flower-types",children:t.map((n,i)=>(0,e.jsxs)("li",{className:"flower-type-item",children:[(0,e.jsx)("span",{className:"flower-type-name",children:n.name}),(0,e.jsx)("span",{className:"flower-type-desc",children:n.desc})]},i))}),se=({c:t,onResonate:n})=>(0,e.jsxs)("div",{className:"mag-comment",children:[(0,e.jsx)("div",{className:"mag-avatar",children:String(t.name||"?").charAt(0).toUpperCase()}),(0,e.jsxs)("div",{className:"mag-content",children:[(0,e.jsxs)("div",{className:"mag-meta",children:[(0,e.jsx)("span",{className:"mag-name",children:t.name}),(0,e.jsx)("span",{className:"mag-date",children:oe(t.date)})]}),(0,e.jsx)("p",{className:"mag-text",children:t.text}),(0,e.jsxs)("div",{className:"mag-actions",children:[(0,e.jsxs)("button",{className:"mag-action",onClick:()=>n(t.id),children:[(0,e.jsx)(D,{size:14})," ",t.resonates||0," Resonate"]}),(0,e.jsx)("button",{className:"mag-action",type:"button",children:"Reply"})]})]})]}),xe=({slug:t="",navMeta:n=["Vol. 01","2026","Death Care"],heroMeta:i=[],title:q,titleAccent:N,excerpt:z,author:f={initials:"PM",name:"Peter Mumo",role:"Developer · Restpoint"},heroImage:x,intro:T,chapterOne:d,pullQuote:L,chapterTwo:g,conclusion:s,bannerWords:c=["Restpoint Journal","The Future of Death Care"]})=>{const S=ee(),[J,O]=(0,o.useState)(0);(0,o.useEffect)(()=>{const r=()=>{const a=document.body.scrollTop||document.documentElement.scrollTop,l=document.documentElement.scrollHeight-document.documentElement.clientHeight;O(l>0?Math.min(100,a/l*100):0)};return window.addEventListener("scroll",r,{passive:!0}),r(),()=>window.removeEventListener("scroll",r)},[]);const[_,E]=(0,o.useState)(0),[Y,b]=(0,o.useState)(0),[C,G]=(0,o.useState)(!1),[h,v]=(0,o.useState)([]),[P,le]=(0,o.useState)(""),[u,F]=(0,o.useState)(""),[y,A]=(0,o.useState)(!1),[k,M]=(0,o.useState)(!1),R=(0,o.useRef)(!1);(0,o.useEffect)(()=>{if(!t)return;let r=!1;const a="rp_viewed_"+t,l=async()=>{try{if(!R.current&&!window.sessionStorage.getItem(a)){R.current=!0,window.sessionStorage.setItem(a,"1");const m=await p.post("/blog-engagement/"+t+"/view");!r&&m.data&&m.data.data&&E(m.data.data.views)}}catch{}},X=async()=>{try{const m=await p.get("/blog-engagement/"+t);if(r||!m.data||!m.data.data)return;E(m.data.data.views||0),b(m.data.data.likes||0),v(Array.isArray(m.data.data.comments)?m.data.data.comments:[])}catch{}};return l().then(X),()=>{r=!0}},[t]),(0,o.useEffect)(()=>(document.body.style.overflow=k?"hidden":"",()=>{document.body.style.overflow=""}),[k]);const H=async()=>{const r=!C;G(r),b(a=>Math.max(0,a+(r?1:-1)));try{const a=await p.post("/blog-engagement/"+t+"/like",{liked:r});a.data&&a.data.data&&a.data.data.likes!=null&&b(a.data.data.likes)}catch{}},V=async r=>{if(r.preventDefault(),!(!u.trim()||y)){A(!0);try{const a=await p.post("/blog-engagement/"+t+"/comments",{name:(P||"").trim()||"Anonymous",text:u.trim()});a.data&&a.data.data&&Array.isArray(a.data.data.comments)&&(v(a.data.data.comments),F(""))}catch{}finally{A(!1)}}},U=async r=>{v(a=>a.map(l=>l.id===r?{...l,resonates:(l.resonates||0)+1}:l));try{await p.post("/blog-engagement/"+t+"/comments/"+r+"/resonate")}catch{}},K=c.length>=3?[c[0],c[1],c[2],c[0]]:[c[0],c[1]||c[0],c[0],c[1]||c[0]],B=r=>(0,e.jsx)("div",{className:"banner-item","aria-hidden":r?"true":void 0,children:K.map((a,l)=>(0,e.jsxs)(o.Fragment,{children:[l%2===0?(0,e.jsx)("span",{children:a}):(0,e.jsx)("em",{children:a}),(0,e.jsx)("div",{className:"banner-icon",children:(0,e.jsx)(I,{})})]},l))}),Z=(0,e.jsxs)("form",{className:"guestbook-form",onSubmit:V,children:[(0,e.jsx)("h3",{children:"Share your thoughts"}),(0,e.jsx)("p",{children:"The best reflections surface here — join the conversation."}),(0,e.jsx)("textarea",{className:"guestbook-input",placeholder:"Write your reflection here...",rows:5,value:u,maxLength:2e3,onChange:r=>F(r.target.value)}),(0,e.jsx)("button",{className:"guestbook-submit",type:"submit",disabled:y||!u.trim(),children:y?"Posting...":"Post Comment"})]}),Q=h.map(r=>(0,e.jsx)(se,{c:r,onResonate:U},r.id));return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("style",{children:re}),(0,e.jsx)("div",{className:"progress-bar",style:{width:J+"%"}}),(0,e.jsxs)("div",{className:"engagement-dock",children:[(0,e.jsxs)("div",{className:"dock-item",style:{cursor:"default"},"aria-label":"Reads",children:[(0,e.jsx)(ne,{}),(0,e.jsx)("span",{className:"dock-count",children:j(_)})]}),(0,e.jsx)("div",{className:"dock-divider"}),(0,e.jsxs)("button",{className:C?"dock-item liked":"dock-item",onClick:H,"aria-label":"Like this story",children:[(0,e.jsx)(D,{}),(0,e.jsx)("span",{className:"dock-count",children:j(Y)})]}),(0,e.jsx)("div",{className:"dock-divider"}),(0,e.jsxs)("button",{className:"dock-item",onClick:()=>M(!0),"aria-label":"Open discussion",children:[(0,e.jsx)(ae,{}),(0,e.jsx)("span",{className:"dock-count",children:j(h.length)})]})]}),(0,e.jsxs)("div",{className:k?"discussion-overlay open":"discussion-overlay",children:[(0,e.jsxs)("div",{className:"discussion-header",children:[(0,e.jsx)("div",{className:"discussion-title",children:"The Reader's Lounge"}),(0,e.jsx)("button",{className:"close-discussion",onClick:()=>M(!1),"aria-label":"Close discussion",children:(0,e.jsx)(ie,{})})]}),(0,e.jsxs)("div",{className:"discussion-content",children:[(0,e.jsxs)("div",{className:"discussion-intro",children:[(0,e.jsx)("h2",{children:"Letters & Reflections"}),(0,e.jsxs)("p",{children:["Join the conversation · ",h.length," ",h.length===1?"Comment":"Comments"]})]}),Z,(0,e.jsx)("div",{className:"comment-list",children:h.length===0?(0,e.jsx)("div",{className:"comment-empty",children:"No comments yet. Be the first to share your thoughts."}):Q})]})]}),(0,e.jsxs)("nav",{className:"blog-nav",children:[(0,e.jsx)("button",{className:"blog-nav-left",onClick:()=>{window.scrollTo({top:0,behavior:"smooth"}),S("/")},children:"Restpoint Journal"}),(0,e.jsx)("div",{className:"blog-nav-right",children:n.map((r,a)=>(0,e.jsx)("span",{children:r},a))})]}),(0,e.jsxs)("header",{className:"blog-hero",children:[(0,e.jsxs)("div",{className:"hero-content",children:[i.length>0&&(0,e.jsx)("div",{className:"hero-meta",children:i.map((r,a)=>(0,e.jsx)("span",{children:r},a))}),(0,e.jsxs)("h1",{className:"hero-title",children:[q,N?(0,e.jsx)("em",{children:N}):null]}),z?(0,e.jsx)("p",{className:"hero-excerpt",children:z}):null,f?(0,e.jsxs)("div",{className:"hero-author",children:[(0,e.jsx)("div",{className:"author-avatar",children:f.initials}),(0,e.jsxs)("div",{className:"author-info",children:[(0,e.jsx)("h4",{children:f.name}),(0,e.jsx)("p",{children:f.role})]})]}):null]}),x?(0,e.jsx)("div",{className:"hero-image-container",children:(0,e.jsx)("img",{src:x.src,alt:x.alt||"",loading:"lazy"})}):null]}),(0,e.jsx)("section",{className:"article-body",children:(0,e.jsxs)("div",{className:"article-container",children:[T,d?(0,e.jsx)(w,{num:d.num,title:d.title,em:d.em}):null,d?d.children:null,g?(0,e.jsx)(w,{num:g.num,title:g.title,em:g.em}):null,g?g.children:null]})}),s?(0,e.jsx)("section",{className:"dark-break",children:(0,e.jsxs)("div",{className:"dark-break-content",children:[(0,e.jsx)(w,{num:s.num,title:s.title,em:s.em}),s.children,s.faq?(0,e.jsxs)("div",{className:"journal-qa",children:[(0,e.jsx)("h3",{children:"Common Questions"}),s.faq.map((r,a)=>(0,e.jsxs)("div",{className:"qa",children:[(0,e.jsx)("div",{className:"q",children:r.question}),(0,e.jsx)("div",{className:"a",children:r.answer})]},a))]}):null,s.cta?(0,e.jsxs)("div",{className:"journal-cta",children:[(0,e.jsxs)("button",{className:"journal-btn",onClick:s.cta.onStart,children:["Start Free Trial ",(0,e.jsx)(I,{})]}),(0,e.jsx)("button",{className:"journal-btn ghost",onClick:s.cta.onDemo,children:"Book a Demo"})]}):null,s.signoff?(0,e.jsxs)("div",{className:"conclusion-signoff",children:[(0,e.jsx)("p",{children:s.signoff.note}),(0,e.jsx)("span",{children:s.signoff.meta})]}):null]})}):null,L?(0,e.jsx)("section",{className:"pull-quote-section",children:(0,e.jsx)("div",{className:"pull-quote-container",children:(0,e.jsx)("blockquote",{className:"pull-quote",children:L.text})})}):null,(0,e.jsx)("section",{className:"blog-banner",style:{cursor:"pointer"},onClick:()=>{window.scrollTo({top:0,behavior:"smooth"}),S("/blog/stories")},children:(0,e.jsxs)("div",{className:"banner-track",children:[B(!1),B(!0)]})})]})};export{fe as a,ue as i,xe as n,pe as r,re as t};
