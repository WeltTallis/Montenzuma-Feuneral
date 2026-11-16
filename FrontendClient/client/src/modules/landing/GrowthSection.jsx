const growthPillars = [
  {
    title: 'Multi branch growth',
    text: 'Start with one branch. Expand into a network without losing control.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-5h6v5" />
        <path d="M9 10h.01M12 10h.01M15 10h.01" />
      </svg>
    ),
  },
  {
    title: 'Complete data isolation',
    text: 'Each branch keeps its own records, staff, stock and operations.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <circle cx="12" cy="15" r="1.2" />
        <path d="M12 16.2V18" />
      </svg>
    ),
  },
  {
    title: 'Fleet visibility',
    text: 'Track every vehicle and trip across the business, in real time.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 13h13v5H3z" />
        <path d="M16 14h3l2 3v1h-5" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="18" cy="18" r="1.6" />
        <path d="M6 13V9h7v4" />
      </svg>
    ),
  },
  {
    title: 'Cross-branch optimization',
    text: 'Move vehicles, coffins and supplies where they\'re needed most.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.3 7L12 12l8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
];

export default function GrowthSection() {
  return (
    <section
      className="growth-section"
      style={{
        padding: 'clamp(5rem, 9vw, 8rem) 0',
        borderTop: '1px solid rgba(26, 25, 22, 0.09)',
        background: '#f6f3ed',
      }}
    >
      <div style={{ width: 'min(1080px, 88%)', margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.74rem',
            fontWeight: 600,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#8b7355',
            marginBottom: '1.5rem',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '24px',
              height: '1px',
              background: '#8b7355',
            }}
          />
          Grow with us
        </div>

        <h1
          style={{
            margin: 0,
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 400,
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.015em',
            maxWidth: '18ch',
            color: '#1a1916',
          }}
        >
          Built to scale, branch by branch.
        </h1>

        <p
          style={{
            marginTop: '1.4rem',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            color: '#56514a',
            maxWidth: '48ch',
          }}
        >
          We understand most funeral homes start with one location. As you grow,
          Rest Point helps you add branches while keeping records and resources
          organised.
        </p>

        <div
          className="growth-section-grid"
          style={{
            marginTop: '3.5rem',
            display: 'grid',
            gap: 0,
            borderTop: '1px solid rgba(26, 25, 22, 0.09)',
          }}
        >
          {growthPillars.map((pillar, index) => (
            <article
              key={pillar.title}
              style={{
                padding: '2rem 1.5rem 1.5rem',
                borderRight: index < growthPillars.length - 1 ? '1px solid rgba(26, 25, 22, 0.09)' : 'none',
                position: 'relative',
                transition: 'background .4s ease',
                background: 'transparent',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  color: '#1a1916',
                  marginBottom: '1.6rem',
                  transition: 'transform .4s cubic-bezier(.2,.7,.3,1), color .4s',
                }}
              >
                {pillar.icon}
              </div>

              <h3
                style={{
                  margin: '0 0 0.6rem',
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontWeight: 500,
                  fontSize: '1.18rem',
                  lineHeight: 1.25,
                  color: '#1a1916',
                }}
              >
                {pillar.title}
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  color: '#8a847b',
                }}
              >
                {pillar.text}
              </p>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .growth-section .icon svg {
          width: 100%;
          height: 100%;
          stroke: currentColor;
          fill: none;
          stroke-width: 1.4;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .growth-section article:hover {
          background: #fffdf9;
        }
        .growth-section article:hover > div:first-child {
          transform: translateY(-3px);
          color: #8b7355;
        }
        .growth-section-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        @media (max-width: 920px) {
          .growth-section-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .growth-section article:nth-child(2) { border-right: none; }
          .growth-section article:nth-child(1),
          .growth-section article:nth-child(2) { border-bottom: 1px solid rgba(26, 25, 22, 0.09); }
        }
        @media (max-width: 560px) {
          .growth-section { padding: 3.5rem 0 !important; }
          .growth-section-grid { grid-template-columns: 1fr; margin-top: 2rem !important; }
          .growth-section article { border-right: none !important; border-bottom: 1px solid rgba(26, 25, 22, 0.09); }
          .growth-section article:last-child { border-bottom: none; }
        }
      `}</style>
    </section>
  );
}
