/**
 * Shared record-sheet chrome for the mortuary intake and release forms.
 *
 * Both official records (intake + release) render the IDENTICAL masthead so an
 * officer moving between the two screens sees the same branding, the same
 * condolence line and the same admission-number/barcode verification block.
 * Keeping it here - instead of duplicating ~200 lines of styled-components in
 * each form - guarantees the two sheets can never drift apart.
 *
 * Every field on both sheets uses the same dashed underline treatment and the
 * same em-dash (DASH) for an empty value, so a blank field always reads as
 * "not yet captured" rather than as a rendering bug.
 */
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import styled, { css } from 'styled-components';
import bwipjs from '@bwip-js/browser';

/* The single placeholder for "no value captured yet". Used by the header, the
   record strips and every empty form field so the sheet speaks one language. */
export const DASH = '—';

export const COLORS = {
  ink: '#1A1A1A',
  bone: '#FAF8F4',
  bone2: '#FFFFFF',
  brass: '#6B4045',
  brassLight: '#A98F6E',
  verdigris: '#3D4F47',
  verdigrisDark: '#2E3F37',
  line: '#E2DDD3',
  gray: '#6B6862',
  muted: '#999999',
  red: '#9B4A3F',
  white: '#FFFFFF',
  inkBlue: '#0f33e7',
  gold: '#C9A227',
  goldDark: '#A8851C',
  // The completion tick and the dashed-field accent.
  tick: '#3D4F47',
  tickBlue: '#2564eb1b',
  green: '#22c55e',
  ox: '#7c2b23',
  dashLine: '#c9c3b8',
};

/* --- Sheet gutters ------------------------------------------------------
   Single source of truth for the horizontal padding of the sheet. The header
   (branding on the left, barcode on the right) and the form body MUST use the
   same values at the same breakpoints, otherwise the top content drifts out of
   line with the form's field labels. */
export const GUTTER = '3rem';          // > 1024px
export const GUTTER_TABLET = '2.5rem'; // <= 1024px  (matches FormBody)
export const GUTTER_MOBILE = '1.5rem'; // <= 600px   (matches FormBody)

const EASE = 'cubic-bezier(.32,.72,.24,1)';

/* --- Dashed field treatment ---------------------------------------------
   Dashed at rest -> solid ink on hover -> solid ox on focus. Applied to every
   text input and select on both sheets. */
export const dashedField = css`
  border-bottom: 1px dashed ${COLORS.dashLine};

  &:hover { border-bottom: 1px solid ${COLORS.ink}; }
  &:focus { border-bottom: 1px solid ${COLORS.ox}; outline: none; box-shadow: none; background: transparent; }
`;
/* --- Header shell ------------------------------------------------------ */
export const HeaderWrapper = styled.header`
  /* Side padding = the sheet gutter, so the branding (left) and the barcode +
     verification block (right) sit on exactly the same vertical guides as the
     form's field labels (see FormBody). */
  padding: 2.5rem ${GUTTER};
  position: relative;
  z-index: 1;
  background: transparent;

  /* Breakpoints mirror FormBody exactly so the header can never drift out of
     line with the labels on tablet / small-laptop widths. */
  @media (max-width: 1024px) {
    padding: 2.25rem ${GUTTER_TABLET};
  }
  @media (max-width: 768px) {
    padding: 2rem ${GUTTER_TABLET};
  }
  @media (max-width: 600px) {
    padding: 1.5rem ${GUTTER_MOBILE};
  }
`;

export const HeaderMain = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 3rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 2.5rem;
  }
`;

export const ColLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  flex: 1.2;
  min-width: 0;
`;

export const ColRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  text-align: right;
  gap: 2rem;
  flex: 1;

  @media (max-width: 768px) {
    align-items: flex-start;
    text-align: left;
    width: 100%;
  }
`;

/* --- Greeting block ---------------------------------------------------- */
export const GreetingBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const GreetingWelcome = styled.span`
  font-family: 'Saira', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${COLORS.muted};
`;

/* The slider window is JS-measured so a phrase that WRAPS to two lines is never
   clipped - the window grows to the measured height of the active phrase. */
const SliderWindow = styled.div`
  overflow: hidden;
  position: relative;
  transition: height 0.5s ${EASE};
`;

const SliderTrack = styled.div`
  transition: transform 0.9s cubic-bezier(0.65, 0.05, 0.36, 1);
`;

const SliderPhrase = styled.div`
  padding: 2px 0;
  font-family: 'Saira', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: ${COLORS.ink};
  white-space: normal;

  em { font-style: italic; color: ${COLORS.ox}; }

  @media (max-width: 600px) { font-size: 1.15rem; }
`;

const CONDOLENCE_PHRASES = [
  <>We are <em>deeply sorry</em> for your loss</>,
  <>Please accept our <em>heartfelt condolences</em></>,
  <>We are here for you, <em>every step</em> of the way</>,
  <>May they rest in peace</>,
];

export function CondolenceSlider() {
  const [idx, setIdx] = useState(0);
  const [dims, setDims] = useState({ h: 0, offset: 0 });
  const itemRefs = useRef([]);

  useLayoutEffect(() => {
    const heights = itemRefs.current.map((el) => (el ? el.offsetHeight : 0));
    setDims({
      h: heights[idx] || 0,
      offset: heights.slice(0, idx).reduce((a, b) => a + b, 0),
    });
  }, [idx]);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % CONDOLENCE_PHRASES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <SliderWindow style={{ height: dims.h || undefined }}>
      <SliderTrack style={{ transform: `translateY(-${dims.offset}px)` }}>
        {CONDOLENCE_PHRASES.map((phrase, i) => (
          <SliderPhrase key={i} ref={(el) => { itemRefs.current[i] = el; }}>
            {phrase}
          </SliderPhrase>
        ))}
      </SliderTrack>
    </SliderWindow>
  );
}
/* --- Facility block ---------------------------------------------------- */
export const FacilityInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const SectionLabel = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLORS.brass};
  margin-bottom: 0.25rem;
  display: block;
`;

export const HdrFacLine = styled.div`
  font-size: 0.85rem;
  color: ${COLORS.gray};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;

  svg {
    width: 15px;
    height: 15px;
    color: ${COLORS.brass};
    flex-shrink: 0;
  }
`;

/* Contact glyphs - brand icon set (register/svg/{call, mail, location}.svg),
   inlined with fill="currentColor" so they inherit the brass color above. */
export const HdrIcoPhone = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-140.000000, -7319.000000)">
      <g transform="translate(56.000000, 160.000000)">
        <path d="M94,7167 L94,7169 L96,7169 C96,7167.895 95.105,7167 94,7167 M94,7163 L94,7165 C96.206,7165 98,7166.794 98,7169 L100,7169 C100,7165.686 97.314,7163 94,7163 M94,7159 L94,7161 C98.411,7161 102,7164.589 102,7169 L104,7169 C104,7163.477 99.523,7159 94,7159 M98.652,7177.234 C98.641,7177.265 98.64,7177.27 98.652,7177.234 M98.117,7174.578 C97.422,7174.204 96.719,7173.778 95.992,7173.481 C94.587,7172.908 94.682,7174.602 93.679,7175.151 C93.027,7175.508 92.107,7174.861 91.538,7174.503 C90.544,7173.877 89.663,7173.053 88.931,7172.1 C88.556,7171.613 87.728,7170.697 87.83,7170.014 C87.992,7168.93 89.274,7168.876 88.907,7167.55 C88.711,7166.84 88.36,7166.141 88.097,7165.457 C87.745,7164.54 87.6,7163.953 86.573,7164.003 C85.831,7164.039 85.339,7164.356 84.883,7164.951 C83.649,7166.558 83.835,7168.725 84.664,7170.488 C85.838,7172.983 87.85,7175.335 89.999,7176.855 C91.461,7177.889 93.387,7178.828 95.157,7178.987 C96.453,7179.104 98.266,7178.403 98.73,7176.996 C98.698,7177.094 98.667,7177.189 98.652,7177.234 C98.663,7177.199 98.687,7177.128 98.73,7176.996 C98.777,7176.854 98.8,7176.783 98.811,7176.751 C98.797,7176.793 98.765,7176.891 98.731,7176.993 C99.139,7175.753 99.189,7175.155 98.117,7174.578 M98.811,7176.751 C98.819,7176.727 98.819,7176.725 98.811,7176.751" />
      </g>
    </g>
  </svg>
);

export const HdrIcoMail = () => (
  <svg viewBox="0 -3.5 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-414.000000, -261.000000)">
      <path d="M430,275.916 L426.684,273.167 L415.115,285.01 L444.591,285.01 L433.235,273.147 L430,275.916 L430,275.916 Z M434.89,271.89 L445.892,283.329 C445.955,283.107 446,282.877 446,282.634 L446,262.862 L434.89,271.89 L434.89,271.89 Z M414,262.816 L414,282.634 C414,282.877 414.045,283.107 414.108,283.329 L425.147,271.927 L414,262.816 L414,262.816 Z M445,261 L415,261 L430,273.019 L445,261 L445,261 Z" />
    </g>
  </svg>
);

export const HdrIcoPin = () => (
  <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M25.497 6.503l.001-.003-.004.005L3.5 15.901l11.112 1.489 1.487 11.11 9.396-21.992.005-.006z" />
  </svg>
);
/* --- Right column: date of admission + admission no. + barcode ---------- */
export const DateDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const DateLabel = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLORS.muted};
`;

export const DateValue = styled.span`
  font-family: 'Saira', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${COLORS.ink};
  letter-spacing: 0.02em;
`;

export const VerificationBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;

  @media (max-width: 768px) {
    align-items: flex-start;
  }
`;

export const HdrAdm = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${COLORS.inkBlue};
  letter-spacing: 0.02em;
`;

/* --- Helpers ----------------------------------------------------------- */
export const formatHeaderDate = (value) => {
  if (!value) return DASH;
  const raw = String(value);
  const date = new Date(raw.length <= 10 ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const Barcode = ({ value }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',
          text: value || 'AWAITING-ID',
          scale: 2,
          height: 8,
          includetext: false,
          paddingwidth: 0,
          paddingheight: 0,
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [value]);

  // Flush against the right sheet gutter so the barcode ends on exactly the
  // same vertical guide as the right edge of the form's last field column.
  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: 'auto', maxWidth: '100%', height: '40px', marginLeft: 'auto' }}
    />
  );
};

export default {
  DASH,
  COLORS,
  GUTTER,
  GUTTER_TABLET,
  GUTTER_MOBILE,
  dashedField,
  HeaderWrapper,
  HeaderMain,
  ColLeft,
  ColRight,
  GreetingBlock,
  GreetingWelcome,
  CondolenceSlider,
  FacilityInfo,
  SectionLabel,
  HdrFacLine,
  HdrIcoPhone,
  HdrIcoMail,
  HdrIcoPin,
  DateDisplay,
  DateLabel,
  DateValue,
  VerificationBlock,
  HdrAdm,
  formatHeaderDate,
  Barcode,
};