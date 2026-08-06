import React from 'react';
import styled, { keyframes } from 'styled-components';

/**
 * OfficialStamp — Vibrant, clean, professional blue rubber stamp component.
 * 
 * Improvements:
 * - Asymmetrical arc tuning: Top arcs are deeper to keep the name high 
 *   and perfectly fitted to the top border.
 * - Bottom arcs are flatter to lift the location and phone number UP 
 *   so they don't fall out of the bottom edge.
 * - Perfect vertical harmony between all text elements and the center date.
 */

const COLORS = {
  stampBlue: '#1D5BD8', // Vibrant, true rubber-stamp royal blue
  stampRed: '#DC2626',  // Vivid crimson red for the date
};

const stampAnimation = keyframes`
  0% {
    transform: translateY(-35px) rotate(-10deg) scale(1.4);
    opacity: 0;
  }
  70% {
    transform: translateY(2px) rotate(-5deg) scale(0.98);
    opacity: 0.95;
  }
  100% {
    transform: translateY(0) rotate(-6deg) scale(1);
    opacity: 1;
  }
`;

const StampWrapper = styled.div`
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  user-select: none;
`;

const StyledSVG = styled.svg`
  animation: ${stampAnimation} 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  
  /* Soft, realistic ink transfer shadow */
  filter: drop-shadow(1px 1px 0px rgba(29, 91, 216, 0.25));
`;

const OfficialStamp = ({
  tenantName = 'FUNERAL HOME',
  tenantPhone = '+254 700 000 000',
  tenantLocation = 'NAIROBI, KENYA',
  recordLabel = 'OFFICIAL INTAKE RECORD',
  stampBlue = COLORS.stampBlue,
  stampRed = COLORS.stampRed,
}) => {
  const formattedDate = new Date()
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();

  const truncate = (text, maxLen) =>
    text && text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;

  const stampName = truncate((tenantName || 'FUNERAL ').toUpperCase(), 28);
  const stampLocation = truncate((tenantLocation || 'NAIROBI, KENYA').toUpperCase(), 32);
  const stampPhone = truncate(`TEL: ${tenantPhone || '+254 700 000 000'}`, 28);

  return (
    <StampWrapper>
      <StyledSVG width="340" height="220" viewBox="0 0 340 220">
        <defs>
          {/* TOP ARCS: Deeper Y-radius (75 & 58) to push name & label UP towards the border */}
          <path id="topOuterArc" d="M 40,110 A 130,75 0 0,1 300,110" />
          <path id="topInnerArc" d="M 65,110 A 105,58 0 0,1 275,110" />
          
          {/* BOTTOM ARCS: Flatter Y-radius (50 & 68) to lift location & phone UP closer to date */}
          <path id="bottomInnerArc" d="M 65,110 A 105,50 0 0,0 275,110" />
          <path id="bottomOuterArc" d="M 40,110 A 130,68 0 0,0 300,110" />

          {/* Subtle ink texture filter */}
          <filter id="cleanGrunge" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" result="rough" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -7" result="edge" />
            <feComposite in="rough" in2="edge" operator="in" />
          </filter>
        </defs>

        <g filter="url(#cleanGrunge)">
          {/* Outer Border */}
          <ellipse cx="170" cy="110" rx="143" ry="90" fill="none" stroke={stampBlue} strokeWidth="3.5" />
          
          {/* Inner Border */}
          <ellipse cx="170" cy="110" rx="130" ry="72" fill="none" stroke={stampBlue} strokeWidth="1.2" />

          {/* Top Outer Text (Tenant Name) */}
          <text fill={stampBlue} fontSize="14" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="2.9">
            <textPath href="#topOuterArc" startOffset="50%" textAnchor="middle">
              {stampName}
            </textPath>
          </text>

          {/* Top Inner Text (Record Label) */}
          <text fill={stampBlue} fontSize="10.5" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="2">
            <textPath href="#topInnerArc" startOffset="50%" textAnchor="middle">
              {recordLabel}
            </textPath>
          </text>

          {/* Center Date Dividing Lines */}
          <line x1="85" y1="88" x2="255" y2="88" stroke={stampBlue} strokeWidth="1.2" strokeDasharray="4,3" />
          <line x1="85" y1="132" x2="255" y2="132" stroke={stampBlue} strokeWidth="1.2" strokeDasharray="4,3" />

          {/* Center Date (Red Ink) */}
          <text x="170" y="118" fill={stampRed} fontSize="26" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" letterSpacing="1.5">
            {formattedDate}
          </text>

          {/* Decorative Stars (Aligned with date center) */}
          <polygon points="95,110 98,116 105,116 100,120 102,126 95,122 88,126 90,120 85,116 92,116" fill={stampBlue} />
          <polygon points="245,110 248,116 255,116 250,120 252,126 245,122 238,126 240,120 235,116 242,116" fill={stampBlue} />

          {/* Bottom Inner Text (Location) - Lifted slightly higher */}
          <text fill={stampBlue} fontSize="10" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="1.8">
            <textPath href="#bottomInnerArc" startOffset="50%" textAnchor="middle">
              {stampLocation}
            </textPath>
          </text>

          {/* Bottom Outer Text (Phone) - Lifted slightly higher */}
          <text fill={stampBlue} fontSize="11" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="1.8">
            <textPath href="#bottomOuterArc" startOffset="50%" textAnchor="middle">
              {stampPhone}
            </textPath>
          </text>
        </g>
      </StyledSVG>
    </StampWrapper>
  );
};

export default OfficialStamp;
export { StampWrapper };