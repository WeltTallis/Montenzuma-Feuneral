import { Fragment, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

/* =================================================================
   RESTPOINT JOURNAL — shared editorial article template.
   Rendered exactly like the "Architecture of Blooms" reference:
   reading-progress bar, floating engagement dock (reads / like /
   comment), masthead, hero, bone article body (chapters 1 + 2),
   ink dark break (conclusion), verdigris pull-quote section,
   massive scrolling banner, and the full-screen "Reader's
   Lounge" discussion overlay (guestbook + magazine comments).
   Views / likes / comments persist via the tenant-service
   blog-engagement API at
   /api/v1/restpoint/blog-engagment/<slug>/...
   ================================================================= */

export const JOURNAL_CSS = `
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
  .engagement-dock {
    position: fixed;
    left: 24px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem 0.85rem;
    background: rgba(250, 248, 244, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(227, 221, 208, 0.7);
    border-radius: 100px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .engagement-dock:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.06);
  }
  .dock-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
    background: transparent;
    border: none;
    color: #8A8780;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    padding: 0.35rem;
    border-radius: 50%;
    position: relative;
  }
  .dock-item::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: transparent;
    transition: all 0.3s ease;
    z-index: -1;
  }
  .dock-item:hover {
    color: #C77B5E;
    transform: translateY(-2px) scale(1.08);
  }
  .dock-item:hover::after {
    background: rgba(199, 123, 94, 0.08);
  }
  .dock-item.liked {
    color: #C77B5E;
  }
  .dock-item.liked::after {
    background: rgba(199, 123, 94, 0.1);
  }
  .dock-item:active {
    transform: translateY(0) scale(0.95);
  }
  .dock-item svg {
    width: 20px;
    height: 20px;
    stroke-width: 1.75;
    transition: all 0.3s ease;
  }
  .dock-item:hover svg {
    stroke-width: 2;
  }
  .dock-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    font-weight: 600;
    color: #000000;
    letter-spacing: -0.02em;
    line-height: 1;
    min-height: 0.6rem;
  }
  .dock-divider {
    width: 24px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #E3DDD0 50%, transparent);
    margin: 0.25rem auto;
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
    .engagement-dock {
      left: 50%;
      right: auto;
      top: auto;
      bottom: 24px;
      transform: translateX(-50%);
      flex-direction: row;
      padding: 0.9rem 1.5rem;
      gap: 1.25rem;
      border-radius: 100px;
    }
    .dock-item { flex-direction: row; gap: 0.5rem; }
    .dock-item:hover { transform: translateY(-1px) scale(1.05); }
    .dock-item:active { transform: translateY(0) scale(0.98); }
    .dock-divider { width: 1px; height: 24px; margin: 0; background: linear-gradient(180deg, transparent, #E3DDD0 50%, transparent); }
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
  <figure className="article-inline-image">
    <img src={src} alt={alt || ''} loading="lazy" />
    {caption ? <figcaption>{caption}</figcaption> : null}
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

export const JournalFlowerList = ({ items }) => (
  <ul className="flower-types">
    {items.map((it, i) => (
      <li className="flower-type-item" key={i}>
        <span className="flower-type-name">{it.name}</span>
        <span className="flower-type-desc">{it.desc}</span>
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
  author = { initials: 'PM', name: 'Peter Mumo', role: 'Developer · Restpoint' },
  heroImage,
  intro,
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

  const bannerWordsFull =
    bannerWords.length >= 3
      ? [bannerWords[0], bannerWords[1], bannerWords[2], bannerWords[0]]
      : [bannerWords[0], bannerWords[1] || bannerWords[0], bannerWords[0], bannerWords[1] || bannerWords[0]];

  const bannerItem = (hidden) => (
    <div className="banner-item" aria-hidden={hidden ? 'true' : undefined}>
      {bannerWordsFull.map((w, i) => (
        <Fragment key={i}>
          {i % 2 === 0 ? <span>{w}</span> : <em>{w}</em>}
          <div className="banner-icon"><ArrowSvg /></div>
        </Fragment>
      ))}
    </div>
  );

  const commentForm = (
    <form className="guestbook-form" onSubmit={submitComment}>
      <h3>Share your thoughts</h3>
      <p>The best reflections surface here — join the conversation.</p>
      <textarea
        className="guestbook-input"
        placeholder="Write your reflection here..."
        rows={5}
        value={text}
        maxLength={2000}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="guestbook-submit" type="submit" disabled={sending || !text.trim()}>
        {sending ? 'Posting...' : 'Post Comment'}
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
        <button className="dock-item" style={{ cursor: 'default' }} aria-label={`${fmtCount(views)} reads`} title={`${fmtCount(views)} reads`}>
          <EyeSvg />
          <span className="dock-count">{fmtCount(views)}</span>
        </button>
        <div className="dock-divider" />
        <button className={liked ? 'dock-item liked' : 'dock-item'} onClick={toggleLike} aria-label={liked ? 'Unlike this story' : 'Like this story'} title={`${fmtCount(likes)} likes`}>
          <HeartSvg filled={liked} />
          <span className="dock-count">{fmtCount(likes)}</span>
        </button>
        <div className="dock-divider" />
        <button className="dock-item" onClick={() => setOverlayOpen(true)} aria-label={`${fmtCount(comments.length)} comments`} title={`${fmtCount(comments.length)} comments`}>
          <CommentSvg />
          <span className="dock-count">{fmtCount(comments.length)}</span>
        </button>
      </div>

      {/* READER'S LOUNGE OVERLAY */}
      <div className={overlayOpen ? 'discussion-overlay open' : 'discussion-overlay'}>
        <div className="discussion-header">
          <div className="discussion-title">The Reader's Lounge</div>
          <button className="close-discussion" onClick={() => setOverlayOpen(false)} aria-label="Close discussion">
            <CloseSvg />
          </button>
        </div>
        <div className="discussion-content">
          <div className="discussion-intro">
            <h2>Letters &amp; Reflections</h2>
            <p>Join the conversation · {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</p>
          </div>
          {commentForm}
          <div className="comment-list">
            {comments.length === 0 ? (
              <div className="comment-empty">No comments yet. Be the first to share your thoughts.</div>
            ) : commentCards}
          </div>
        </div>
      </div>

      {/* MASTHEAD */}
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
            <img src={heroImage.src} alt={heroImage.alt || ''} loading="lazy" />
          </div>
        ) : null}
      </header>

      {/* ARTICLE BODY — chapters 1 + 2 */}
      <section className="article-body">
        <div className="article-container">
          {intro}
          {chapterOne ? <ChapterHead num={chapterOne.num} title={chapterOne.title} em={chapterOne.em} /> : null}
          {chapterOne ? chapterOne.children : null}
          {chapterTwo ? <ChapterHead num={chapterTwo.num} title={chapterTwo.title} em={chapterTwo.em} /> : null}
          {chapterTwo ? chapterTwo.children : null}
        </div>
      </section>
{/* DARK BREAK — conclusion */}
      {conclusion ? (
        <section className="dark-break">
          <div className="dark-break-content">
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
      ) : null}

      {/* PULL QUOTE */}
      {pullQuote ? (
        <section className="pull-quote-section">
          <div className="pull-quote-container">
            <blockquote className="pull-quote">{pullQuote.text}</blockquote>
          </div>
        </section>
      ) : null}

      {/* SCROLLING BANNER */}
      <section
        className="blog-banner"
        style={{ cursor: 'pointer' }}
        onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/blog/stories'); }}
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