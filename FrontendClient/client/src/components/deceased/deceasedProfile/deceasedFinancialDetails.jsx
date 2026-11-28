import React, { useState, useEffect, useMemo } from 'react';

// ============================================================
// CHARGE CATALOGUE — single source of truth for prices.
// Edit amounts here; nothing else in the file changes.
// Each charge can be:
//   fixed      → one flat amount
//   daily      → amount × daysHeld
//   tiered     → amount depends on a selected severity/option
//   custom     → user enters amount (and optionally a description)
//   waivedBy   → auto-waived when a sibling toggle is on
// ============================================================
const CHARGE_CATALOGUE = [
  {
    id: 'embalming',
    title: 'Embalming',
    desc: 'Preservation and preparation of the body',
    type: 'fixed',
    amount: 8000,
    defaultOn: true,
  },
  {
    id: 'storage',
    title: 'Daily Storage',
    desc: 'Cold-room storage, billed per day the body is held',
    type: 'daily',
    amount: 2000,
    defaultOn: true,
  },
  {
    id: 'prep',
    title: 'Body Preparation & Dressing',
    desc: 'Washing, grooming and dressing for viewing',
    type: 'fixed',
    amount: 2500,
    defaultOn: true,
  },
  {
    id: 'facility',
    title: 'Facility Fee',
    desc: 'Use of mortuary facilities and equipment',
    type: 'fixed',
    amount: 5000,
    defaultOn: true,
  },
  {
    id: 'reconstruction',
    title: 'Body Reconstruction',
    desc: 'Restoration after trauma / damage — pick the severity tier',
    type: 'tiered',
    defaultOn: false,
    tiers: [
      { id: 'minor', label: 'Minor', amount: 8000, note: 'Small abrasions, minimal shaping' },
      { id: 'moderate', label: 'Moderate', amount: 18000, note: 'Facial / limb repair, some suturing' },
      { id: 'severe', label: 'Severe', amount: 35000, note: 'Extensive trauma, major restoration' },
      { id: 'custom', label: 'Custom', amount: 0, note: 'Enter the quoted amount below' },
    ],
  },
  {
    id: 'airlift',
    title: 'Hearse Transfer to JKIA',
    desc: 'Airlift transport from facility to Jomo Kenyatta Intl.',
    type: 'fixed',
    amount: 15000,
    defaultOn: false,
  },
  {
    id: 'coffin_wrap',
    title: 'Coffin Wrapping & Packaging',
    desc: 'Protective wrapping and packaging for transit',
    type: 'fixed',
    amount: 15000,
    defaultOn: false,
  },
  {
    id: 'embalm_cert',
    title: 'Embalming Certificate',
    desc: 'Official certificate for travel / repatriation',
    type: 'fixed',
    amount: 10000,
    defaultOn: true,
    waivedBy: 'coffin_bundle',
  },
  {
    id: 'booking',
    title: 'Booking & Check-in',
    desc: 'Airline booking and cargo check-in coordination',
    type: 'fixed',
    amount: 10000,
    defaultOn: true,
    waivedBy: 'coffin_bundle',
  },
  {
    id: 'seal_cert',
    title: 'Seal Certificate',
    desc: 'Tamper-proof seal and certificate',
    type: 'fixed',
    amount: 5000,
    defaultOn: true,
    waivedBy: 'coffin_bundle',
  },
  {
    id: 'custom',
    title: 'Custom Charge',
    desc: 'Any other charge — describe and enter the amount',
    type: 'custom',
    defaultOn: false,
  },
];

// ============================================================
// UTILITY
// ============================================================
const fmt = (n) =>
  'KES ' + Math.round(Number(n) || 0).toLocaleString('en-KE');

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ChargeSchedule({
  deceasedId = '1366',
  deceased = {
    full_name: 'ANN MOLLY W. IGAMBA',
    received_on: '12TH NOV 2026',
    received_from: 'AAR KIAMBU',
    branch: 'MONTEZUMA NBI',
    days_held: 5,
  },
  onBack,
}) {
  // ── State ───────────────────────────────────────────────────
  const [selected, setSelected] = useState(() => {
    const s = {};
    CHARGE_CATALOGUE.forEach((c) => { s[c.id] = !!c.defaultOn; });
    return s;
  });

  // Per-charge editable amounts (defaults from catalogue, overridable)
  const [chargeAmounts, setChargeAmounts] = useState(() => {
    const a = {};
    CHARGE_CATALOGUE.forEach((c) => { a[c.id] = c.amount; });
    return a;
  });

  const [daysHeld, setDaysHeld] = useState(deceased.days_held || 1);
  const [tierChoice, setTierChoice] = useState('moderate');
  const [reconstructionCustom, setReconstructionCustom] = useState(0);
  const [customAmount, setCustomAmount] = useState(0);
  const [customDesc, setCustomDesc] = useState('');
  const [waiveBundle, setWaiveBundle] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Derived: line items ─────────────────────────────────────
  const lineItems = useMemo(() => {
    return CHARGE_CATALOGUE
      .filter((c) => selected[c.id])
      .map((c) => {
        let amount = 0;
        let note = '';

        if (c.type === 'fixed') {
          amount = Number(chargeAmounts[c.id] || c.amount || 0);
        } else if (c.type === 'daily') {
          const dailyRate = Number(chargeAmounts[c.id] || c.amount || 0);
          amount = dailyRate * Math.max(1, Number(daysHeld) || 1);
          note = `${dailyRate.toLocaleString()} × ${daysHeld} day${daysHeld > 1 ? 's' : ''}`;
        } else if (c.type === 'tiered') {
          const tier = c.tiers.find((t) => t.id === tierChoice) || c.tiers[0];
          amount = tier.id === 'custom' ? reconstructionCustom : tier.amount;
          note = `${tier.label}${tier.id === 'custom' ? '' : ' severity'}`;
        } else if (c.type === 'custom') {
          amount = customAmount;
          note = customDesc || 'Custom charge';
        }

        const isWaived = !!(c.waivedBy && waiveBundle);
        return {
          ...c,
          lineAmount: amount,
          note,
          isWaived,
          appliedAmount: isWaived ? 0 : amount,
        };
      });
  }, [selected, daysHeld, tierChoice, reconstructionCustom, customAmount, customDesc, waiveBundle, chargeAmounts]);

  const subtotal = lineItems.reduce((s, i) => s + i.appliedAmount, 0);
  const waivedTotal = lineItems.reduce(
    (s, i) => s + (i.isWaived ? i.lineAmount : 0),
    0
  );

  // ── Helpers ─────────────────────────────────────────────────
  const toggle = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const setChargeAmount = (id, value) => {
    setChargeAmounts((prev) => ({ ...prev, [id]: value }));
  };

  const onCount = Object.values(selected).filter(Boolean).length;

  const handlePrint = () => window.print();

  const handleSubmit = () => {
    setSubmitted(true);
    // Hook your API here:
    // await axios.post(`/api/deceased/${deceasedId}/charges`, payload)
    const payload = {
      deceasedId,
      daysHeld,
      waiveBundle,
      lineItems: lineItems.map((i) => ({
        id: i.id,
        title: i.title,
        amount: i.lineAmount,
        waived: i.isWaived,
        note: i.note,
      })),
      subtotal,
      waivedTotal,
      total: subtotal,
    };
    // eslint-disable-next-line no-console
    console.log('Charge schedule payload →', payload);
  };

  // Reset the "submitted" banner after a few seconds
  useEffect(() => {
    if (!submitted) return;
    const t = setTimeout(() => setSubmitted(false), 4000);
    return () => clearTimeout(t);
  }, [submitted]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={styles.page}>
      <style>{cssReset}</style>

      <div style={styles.sheet}>
        {/* ───── Masthead ───── */}
        <header style={styles.masthead}>
          <div style={styles.mastMain}>
            <div style={styles.mastLeft}>
              <h1 style={styles.siteName}>
                Montezuma Monalisa Funeral Home Ltd · Head Office
              </h1>
              <span style={styles.secLabel}>Facility</span>
              <p style={styles.facLine}>0722 268 566, 0722 827 652</p>
              <p style={styles.facLine}>info@montezumamonalisa.com</p>
              <p style={styles.facLine}>P.O. Box 51340 - 00200 Nairobi, Kenya</p>
            </div>
            <div style={styles.mastRight}>
              <div style={{ textAlign: 'right' }}>
                <span style={styles.mastLabel}>Charge Date</span>
                <div style={styles.mastValue}>
                  {new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={styles.mastLabel}>Admission No.</span>
                <div style={styles.admNo}>{deceasedId}</div>
              </div>
            </div>
          </div>
        </header>

        <div style={styles.formBody}>
          {/* ───── 01 · Deceased & Engagement ───── */}
          <section style={styles.section}>
            <SectionHead num="01" title="Deceased & Engagement Details" />
            <table style={styles.engageTable}>
              <tbody>
                <tr>
                  <td style={styles.engageKey}>Deceased Name</td>
                  <td style={styles.engageVal}>
                    <strong>{deceased.full_name || '—'}</strong>
                  </td>
                </tr>
                <tr>
                  <td style={styles.engageKey}>Received On</td>
                  <td style={styles.engageVal}>
                    {deceased.received_on || '—'} · From {deceased.received_from || '—'}
                  </td>
                </tr>
                <tr>
                  <td style={styles.engageKey}>Branch</td>
                  <td style={styles.engageVal}>{deceased.branch || '—'}</td>
                </tr>
                <tr>
                  <td style={styles.engageKey}>Days Held</td>
                  <td style={styles.engageVal}>
                    <input
                      type="number"
                      min="1"
                      value={daysHeld}
                      onChange={(e) => setDaysHeld(Math.max(1, Number(e.target.value) || 1))}
                      style={styles.daysInput}
                    />
                    <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: '0.85rem' }}>
                      days
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ───── 02 · Select Charges ───── */}
          <section style={styles.section}>
            <SectionHead num="02" title="Select the Charges to Apply" />

            {/* Waiver banner */}
            <label style={styles.waiverBanner}>
              <input
                type="checkbox"
                checked={waiveBundle}
                onChange={(e) => setWaiveBundle(e.target.checked)}
                style={styles.waiverCheckbox}
              />
              <div style={{ flex: 1 }}>
                <div style={styles.waiverTitle}>
                  Coffin was purchased from our funeral home
                </div>
                <div style={styles.waiverDesc}>
                  Tick this to waive the <strong>Embalming Certificate</strong>,{' '}
                  <strong>Booking &amp; Check-in</strong>, and{' '}
                  <strong>Seal Certificate</strong> charges. Optional — leave
                  unticked if the coffin came from elsewhere.
                </div>
              </div>
            </label>

            {/* Charge picker — waived (bailed) items show first so they stay visible */}
            <div style={styles.picker}>
              {[...CHARGE_CATALOGUE]
                .sort((a, b) => {
                  const aWaived = !!(a.waivedBy && waiveBundle);
                  const bWaived = !!(b.waivedBy && waiveBundle);
                  if (aWaived && !bWaived) return -1;
                  if (!aWaived && bWaived) return 1;
                  return 0;
                })
                .map((c) => {
                  const on = !!selected[c.id];
                  const waived = !!(c.waivedBy && waiveBundle);
                  return (
                    <div
                      key={c.id}
                      style={{
                        ...styles.pickRow,
                        ...(on ? styles.pickRowOn : null),
                        ...(waived ? styles.pickRowWaived : null),
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(c.id)}
                        style={styles.pickCheckbox}
                        aria-label={`Toggle ${c.title}`}
                      />

                      <div style={styles.pickBody}>
                        <div style={styles.pickTitle}>
                          {c.title}
                          {c.type === 'daily' && on && (
                            <span style={styles.qtyChip}>
                              × {daysHeld} day{daysHeld > 1 ? 's' : ''}
                            </span>
                          )}
                          {waived && (
                            <span style={styles.waivedChip}>— waived</span>
                          )}
                        </div>
                        <div style={styles.pickDesc}>{c.desc}</div>

                        {/* Editable charge amount — overrides the catalogue default */}
                        {on && (
                          <div style={styles.editAmountWrap}>
                            <label style={styles.editAmountLabel}>Amount</label>
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={chargeAmounts[c.id] || ''}
                              onChange={(e) =>
                                setChargeAmount(c.id, e.target.value)
                              }
                              style={styles.editAmountInput}
                              placeholder={fmt(c.amount)}
                            />
                          </div>
                        )}

                      {/* Reconstruction tier selector */}
                      {c.type === 'tiered' && on && (
                        <div style={styles.tierBlock}>
                          <div style={styles.tierLabel}>Severity</div>
                          <div style={styles.tierRow}>
                            {c.tiers.map((t) => (
                              <label
                                key={t.id}
                                style={{
                                  ...styles.tierOption,
                                  ...(tierChoice === t.id
                                    ? styles.tierOptionActive
                                    : null),
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`tier-${c.id}`}
                                  value={t.id}
                                  checked={tierChoice === t.id}
                                  onChange={() => setTierChoice(t.id)}
                                  style={{ display: 'none' }}
                                />
                                <div style={styles.tierName}>{t.label}</div>
                                <div style={styles.tierAmount}>
                                  {t.id === 'custom'
                                    ? 'Enter amount'
                                    : fmt(t.amount)}
                                </div>
                              </label>
                            ))}
                          </div>
                          {tierChoice === 'custom' && (
                            <div style={styles.customInline}>
                              <label style={styles.customLabel}>Quoted amount</label>
                              <input
                                type="number"
                                min="0"
                                step="100"
                                value={reconstructionCustom || ''}
                                onChange={(e) =>
                                  setReconstructionCustom(Number(e.target.value) || 0)
                                }
                                style={styles.customInput}
                                placeholder="0"
                              />
                            </div>
                          )}
                          <div style={styles.tierNote}>
                            {
                              c.tiers.find((t) => t.id === tierChoice)?.note
                            }
                          </div>
                        </div>
                      )}

                      {/* Free-text custom charge */}
                      {c.type === 'custom' && on && (
                        <div style={styles.customBlock}>
                          <div style={styles.customInline}>
                            <label style={styles.customLabel}>Description</label>
                            <input
                              type="text"
                              value={customDesc}
                              onChange={(e) => setCustomDesc(e.target.value)}
                              style={{ ...styles.customInput, flex: '1 1 220px' }}
                              placeholder="e.g. Repairs after damage"
                            />
                          </div>
                          <div style={styles.customInline}>
                            <label style={styles.customLabel}>Amount</label>
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={customAmount || ''}
                              onChange={(e) =>
                                setCustomAmount(Number(e.target.value) || 0)
                              }
                              style={styles.customInput}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        ...styles.pickAmount,
                        ...(waived ? styles.pickAmountWaived : null),
                        ...(!on ? styles.pickAmountOff : null),
                      }}
                    >
                      {!on
                        ? '—'
                        : waived
                          ? (
                            <>
                              <s>{fmt(getLineAmount(c, daysHeld, tierChoice, reconstructionCustom, customAmount))}</s>
                              <span style={styles.freeLabel}>FREE</span>
                            </>
                          )
                          : c.type === 'custom' || (c.type === 'tiered' && tierChoice === 'custom')
                            ? (getLineAmount(c, daysHeld, tierChoice, reconstructionCustom, customAmount) > 0
                              ? fmt(getLineAmount(c, daysHeld, tierChoice, reconstructionCustom, customAmount))
                              : 'Enter amount')
                            : fmt(getLineAmount(c, daysHeld, tierChoice, reconstructionCustom, customAmount))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div style={styles.totals}>
              <div style={styles.totalRow}>
                <span>Selected charges</span>
                <span style={styles.totalAmt}>{onCount}</span>
              </div>
              <div style={styles.totalRow}>
                <span>Subtotal</span>
                <span style={styles.totalAmt}>{fmt(subtotal)}</span>
              </div>
              <div style={{ ...styles.totalRow, color: 'var(--muted)' }}>
                <span>Waived</span>
                <span style={styles.totalAmt}>
                  {waivedTotal > 0 ? '− ' + fmt(waivedTotal) : '—'}
                </span>
              </div>
              <div style={styles.grandRow}>
                <span>Total Payable</span>
                <span style={styles.grandAmt}>{fmt(subtotal)}</span>
              </div>
            </div>

            <div style={styles.chargeNote}>
              <strong>Notes.</strong> Tick only the charges that apply to this
              case — every line is optional. Daily storage is billed for each
              day the body is held. Body reconstruction is priced by severity
              tier (or a custom quote). Where the coffin was purchased from us,
              tick the box above to waive the embalming certificate, booking /
              check-in and seal certificate.
            </div>
          </section>

          {/* ───── Actions ───── */}
          <div style={styles.actions}>
            {onBack && (
              <button type="button" onClick={onBack} style={styles.btnBlack}>
                ← Back
              </button>
            )}
            <button type="button" onClick={handlePrint} style={styles.btnBlack}>
              Print / Save as PDF
            </button>
            <button type="button" onClick={handleSubmit} style={styles.btnPrimary}>
              Submit Schedule
            </button>
          </div>

          {submitted && (
            <div style={styles.successBanner}>
              Charge schedule submitted for approval.
            </div>
          )}
        </div>

        <div style={styles.recordStrip}>
          Montezuma Monalisa Funeral Home Ltd
          <br />
          — Official Charge Schedule —
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================
function SectionHead({ num, title }) {
  return (
    <div style={styles.sectionHead}>
      <span style={styles.sectionNum}>{num}</span>
      <h2 style={styles.sectionTitle}>{title}</h2>
    </div>
  );
}

/** Pure helper: compute a single charge's line amount */
function getLineAmount(c, daysHeld, tierChoice, reconstructionCustom, customAmount, chargeAmounts) {
  if (c.type === 'fixed') return Number(chargeAmounts?.[c.id] || c.amount || 0);
  if (c.type === 'daily') return Number(chargeAmounts?.[c.id] || c.amount || 0) * Math.max(1, Number(daysHeld) || 1);
  if (c.type === 'tiered') {
    const tier = c.tiers.find((t) => t.id === tierChoice) || c.tiers[0];
    return tier.id === 'custom' ? reconstructionCustom : tier.amount;
  }
  if (c.type === 'custom') return customAmount;
  return 0;
}

// ============================================================
// INLINE CSS (kept as JS objects so the component is drop-in)
// ============================================================
const cssReset = `
  @import url('https://fonts.googleapis.com/css2?family=Saira:wght@300;400;600;700;800&display=swap');
  :root {
    --ink: #15171A; --bone: #FAF8F4; --white: #FFFFFF;
    --line: #E4E0D8; --line-strong: #9A938A;
    --brass: #A98F6E; --verdigris: #2E7D6B;
    --green: #22C55E; --red: #B03A2E; --gray: #A8A29E;
    --muted: #8A857C; --pen: #2A3670;
    --maroon: #722F37; --maroon-dark: #5C242B;
    --pine: #1A2A27; --pine-light: #24352F; --cream: #E9EBDD;
  }
  @keyframes csFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`;

const styles = {
  page: {
    background: '#EFEAE1',
    fontFamily: "'Saira', 'Segoe UI', system-ui, Roboto, Arial, sans-serif",
    color: 'var(--ink)',
    padding: '24px 12px 0',
    minHeight: '100vh',
    fontSize: 15,
    lineHeight: 1.5,
  },
  sheet: {
    width: '100%',
    maxWidth: 1080,
    margin: '0 auto',
    background: 'var(--white)',
    boxShadow: '0 2px 18px rgba(21, 23, 26, 0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  masthead: {
    padding: '2.2rem clamp(16px, 4vw, 56px) 1.4rem',
    borderBottom: '1px solid var(--line)',
  },
  mastMain: {
    display: 'flex',
    gap: '2.5rem',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  mastLeft: { flex: '1 1 340px', minWidth: 0 },
  mastRight: {
    flex: '0 1 auto',
    minWidth: 210,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '1.1rem',
  },
  siteName: {
    margin: 0,
    fontSize: 'clamp(1rem, 2.6vw, 1.3rem)',
    fontWeight: 700,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    lineHeight: 1.35,
  },
  secLabel: {
    display: 'block',
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'var(--brass)',
    margin: '1.2rem 0 0.45rem',
  },
  facLine: {
    fontSize: '0.82rem',
    color: 'var(--ink)',
    margin: '0.28rem 0',
  },
  mastLabel: {
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
  },
  mastValue: { fontSize: '0.95rem', fontWeight: 600, marginTop: '0.25rem' },
  admNo: {
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontSize: '1.15rem',
    fontWeight: 700,
    letterSpacing: '0.14em',
    marginTop: '0.25rem',
  },
  formBody: { padding: '2.6rem clamp(16px, 4vw, 56px) 1.5rem' },
  section: { marginBottom: '2.4rem' },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.4rem',
    padding: '0.7rem 1.2rem',
    background: 'var(--ink)',
    borderRadius: 4,
  },
  sectionNum: {
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontSize: '0.7rem',
    color: 'rgba(250, 248, 244, 0.4)',
  },
  sectionTitle: {
    margin: 0,
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontSize: '0.78rem',
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--bone)',
  },
  engageTable: {
    width: '100%',
    border: '1px solid var(--line)',
    borderCollapse: 'collapse',
  },
  engageKey: {
    width: '33%',
    padding: '0.75rem 1rem',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--muted)',
    fontWeight: 700,
    borderBottom: '1px solid var(--line)',
  },
  engageVal: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--line)',
  },
  daysInput: {
    width: 64,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    borderBottom: '1px dashed var(--line-strong)',
    padding: '2px 4px',
    fontFamily: 'ui-monospace, monospace',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--pen)',
    textAlign: 'center',
  },
  waiverBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.85rem',
    padding: '0.9rem 1rem',
    background: 'rgba(46, 125, 107, 0.06)',
    border: '1px solid rgba(46, 125, 107, 0.25)',
    borderRadius: 4,
    marginBottom: '1rem',
    cursor: 'pointer',
    userSelect: 'none',
  },
  waiverCheckbox: {
    appearance: 'none',
    WebkitAppearance: 'none',
    width: 20,
    height: 20,
    flexShrink: 0,
    marginTop: 1,
    border: '1.5px solid var(--verdigris)',
    borderRadius: 3,
    background: 'var(--white)',
    cursor: 'pointer',
    position: 'relative',
    accentColor: 'var(--verdigris)',
  },
  waiverTitle: { fontWeight: 700, color: 'var(--verdigris)', fontSize: '0.85rem' },
  waiverDesc: { fontSize: '0.78rem', color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 },
  picker: {
    border: '1px solid var(--line)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  pickRow: {
    display: 'grid',
    gridTemplateColumns: '24px 1fr auto',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '0.85rem 1rem',
    borderBottom: '1px solid var(--line)',
    transition: 'background 0.15s ease',
  },
  pickRowOn: { background: 'rgba(46, 125, 107, 0.05)' },
  pickRowWaived: { background: 'rgba(168, 162, 158, 0.06)' },
  pickCheckbox: {
    appearance: 'none',
    WebkitAppearance: 'none',
    width: 20,
    height: 20,
    marginTop: 3,
    border: '1.5px solid var(--ink)',
    borderRadius: 3,
    background: 'var(--white)',
    cursor: 'pointer',
    accentColor: 'var(--verdigris)',
  },
  pickBody: { minWidth: 0 },
  pickTitle: {
    fontWeight: 700,
    fontSize: '0.9rem',
    color: 'var(--ink)',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  pickDesc: {
    fontSize: '0.78rem',
    color: 'var(--muted)',
    marginTop: 2,
    lineHeight: 1.4,
  },
  qtyChip: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: '0.7rem',
    color: 'var(--pen)',
    background: 'rgba(42,54,112,0.06)',
    padding: '1px 6px',
    borderRadius: 3,
    fontWeight: 700,
  },
  waivedChip: {
    fontSize: '0.68rem',
    fontWeight: 700,
    color: 'var(--gray)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  pickAmount: {
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontWeight: 700,
    fontSize: '0.88rem',
    color: 'var(--ink)',
    textAlign: 'right',
    whiteSpace: 'nowrap',
    paddingTop: 2,
  },
  pickAmountWaived: { color: 'var(--gray)' },
  pickAmountOff: { color: 'var(--gray)' },
  freeLabel: { color: 'var(--verdigris)', fontWeight: 700, fontSize: '0.75rem', marginLeft: 6 },
  tierBlock: {
    marginTop: '0.7rem',
    padding: '0.65rem 0.75rem',
    background: 'var(--bone)',
    borderRadius: 4,
    border: '1px solid var(--line)',
  },
  tierLabel: {
    fontSize: '0.66rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--brass)',
    marginBottom: 6,
  },
  tierRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 6,
  },
  tierOption: {
    padding: '7px 9px',
    border: '1px solid var(--line)',
    borderRadius: 4,
    background: 'var(--white)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tierOptionActive: {
    borderColor: 'var(--verdigris)',
    background: 'rgba(46,125,107,0.07)',
    boxShadow: '0 0 0 1px var(--verdigris) inset',
  },
  tierName: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink)' },
  tierAmount: { fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 },
  tierNote: {
    fontSize: '0.72rem',
    color: 'var(--muted)',
    marginTop: 6,
    fontStyle: 'italic',
  },
  customBlock: { marginTop: '0.7rem' },
  customInline: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  customLabel: {
    fontSize: '0.66rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--brass)',
    minWidth: 80,
  },
  customInput: {
    flex: '0 0 130px',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    borderBottom: '1px dashed var(--line-strong)',
    padding: '2px 4px',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    color: 'var(--pen)',
    fontWeight: 600,
  },
  editAmountWrap: {
    marginTop: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  editAmountLabel: {
    fontSize: '0.66rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--brass)',
    minWidth: 70,
  },
  editAmountInput: {
    flex: '0 0 120px',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    borderBottom: '1px dashed var(--line-strong)',
    padding: '2px 4px',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    color: 'var(--pen)',
    fontWeight: 600,
  },
  totals: {
    marginTop: '1.5rem',
    marginLeft: 'auto',
    width: '100%',
    maxWidth: 460,
    borderTop: '2px solid var(--ink)',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.55rem 0.75rem',
    fontSize: '0.85rem',
    borderBottom: '1px solid var(--line)',
    color: 'var(--muted)',
  },
  totalAmt: {
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontWeight: 700,
  },
  grandRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0.75rem 0.55rem',
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--ink)',
    borderTop: '1px solid var(--ink)',
    marginTop: '0.25rem',
  },
  grandAmt: {
    fontFamily: 'ui-monospace, Consolas, monospace',
    color: 'var(--maroon)',
  },
  chargeNote: {
    marginTop: '1.5rem',
    padding: '0.85rem 1rem',
    background: 'var(--bone)',
    borderLeft: '3px solid var(--brass)',
    fontSize: '0.78rem',
    color: 'var(--muted)',
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    marginTop: '2.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--line)',
  },
  btnBlack: {
    border: '1px solid var(--pine)',
    borderRadius: 4,
    padding: '0.9rem 1.6rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    fontFamily: 'inherit',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--ink)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
  },
  btnPrimary: {
    border: 'none',
    borderRadius: 4,
    padding: '0.9rem 1.6rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    fontFamily: 'inherit',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    background: 'var(--maroon)',
    color: 'var(--bone)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
  },
  successBanner: {
    marginTop: '1rem',
    padding: '0.85rem 1rem',
    background: 'rgba(34,197,94,0.08)',
    color: '#15803D',
    border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: 4,
    fontSize: '0.82rem',
    fontWeight: 600,
    animation: 'csFade 0.3s ease-out',
  },
  recordStrip: {
    margin: '2rem clamp(16px, 4vw, 56px) 0',
    padding: '0.9rem 1rem 0.4rem',
    borderTop: '1px solid var(--line)',
    textAlign: 'center',
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontSize: '0.62rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--gray)',
    lineHeight: 1.8,
  },
};

export default DeceasedFinancialDetails;