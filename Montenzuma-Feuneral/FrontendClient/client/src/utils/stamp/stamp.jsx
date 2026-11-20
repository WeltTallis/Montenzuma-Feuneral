import React from 'react';
import styled, { keyframes } from 'styled-components';

/**
 * OfficialStamp — Vibrant, clean, professional blue rubber stamp component.
 * 
 * Improvements:
 * - Inner border repositioned to avoid cutting through text
 * - Proper spacing between text and borders
 * - Clean, professional rubber stamp appearance
 */

const COLORS = {
  stampBlue: '#0f33e7', 
  stampRed:  '#b91c1c', // Muted deep red for the date (less harsh)
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
  padding: 0px;
  user-select: none;
`;

const StyledSVG = styled.svg`
  animation: ${stampAnimation} 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  
  /* Soft, realistic ink transfer shadow */
  filter: drop-shadow(1px 1px 0px rgba(36, 65, 124, 0.35));
`;

const OfficialStamp = ({
  tenantName = 'FUNERAL HOME',
  tenantPhone = '+254-722-827-652',
  tenantLocation = 'NAIROBI, KENYA',
  recordLabel = 'OFFICIAL INTAKE RECORD',
  adress   = ' Raila Odinga Wy, Nairobi',
  stampBlue = COLORS.stampBlue,
  stampRed = COLORS.stampRed,
}) => {
  const formattedDate = new Date()
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();

  const truncate = (text, maxLen) =>
    text && text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;

  const name = (tenantName || 'FUNERAL HOME').toUpperCase().trim();
  const stampName = truncate(name, 34);
  const stampLocation = truncate((tenantLocation || 'NAIROBI, KENYA').toUpperCase(), 28);
  const stampPhone = truncate(`TEL: ${tenantPhone || '+254 700 000 000'}`, 26);
  const stampAddress = truncate((adress || '').toUpperCase(), 28);

  // Dynamically fit the tenant name along the top arc:
  // shrink font size and letter-spacing as the name gets longer,
  // so big funeral-home names never overflow the stamp.
  const nameLen = stampName.length;
  const nameFontSize = nameLen <= 12 ? 20 : nameLen <= 16 ? 18 : nameLen <= 20 ? 16 : nameLen <= 26 ? 14 : 12.5;
  const nameLetterSpacing = nameLen <= 12 ? 4.5 : nameLen <= 16 ? 3.5 : nameLen <= 20 ? 2.5 : nameLen <= 26 ? 1.8 : 1.2;

  return (
    <StampWrapper>
      <StyledSVG width="340" height="230" viewBox="0 0 340 230">
        <defs>
          {/* TOP ARCS: Wider sweep for long funeral-home names */}
          <path id="topOuterArc" d="M 30,115 A 140,74 0 0,1 310,115" />
          <path id="topInnerArc" d="M 55,115 A 115,54 0 0,1 285,115" />

          {/* BOTTOM ARCS: Properly spaced from borders */}
          <path id="bottomInnerArc" d="M 55,115 A 115,52 0 0,0 285,115" />
          <path id="bottomOuterArc" d="M 30,115 A 140,66 0 0,0 310,115" />

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
          <ellipse cx="170" cy="115" rx="150" ry="95" fill="none" stroke={stampBlue} strokeWidth="4.5" />
          
          {/* Inner Border - Moved further out to avoid text */}
          <ellipse cx="170" cy="115" rx="125" ry="67" fill="none" stroke={stampBlue} strokeWidth="1.5" />

          {/* Top Outer Text (Tenant Name) */}
          <text fill={stampBlue} fontSize={nameFontSize} fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" letterSpacing={nameLetterSpacing}>
            <textPath href="#topOuterArc" startOffset="50%" textAnchor="middle">
              {stampName}
            </textPath>
          </text>

          {/* Top Inner Text (Record Label) */}
          <text fill={stampBlue} fontSize="14" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="2.5">
            <textPath href="#topInnerArc" startOffset="50%" textAnchor="middle">
              {recordLabel}
            </textPath>
          </text>

          {/* Center Date Dividing Lines */}
          <line x1="85" y1="92" x2="255" y2="92" stroke={stampBlue} strokeWidth="1.2" strokeDasharray="4,3" />
          <line x1="85" y1="138" x2="255" y2="138" stroke={stampBlue} strokeWidth="1.2" strokeDasharray="4,3" />

          {/* Center Date (Red Ink) */}
          <text x="170" y="123" fill={stampRed} fontSize="32" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" letterSpacing="2">
            {formattedDate}
          </text>

          {/* Decorative Stars */}
          <polygon points="98,115 101,120 106,120 102,123 104,128 98,125 92,128 94,123 90,120 95,120" fill={stampBlue} />
          <polygon points="242,115 245,120 250,120 246,123 248,128 242,125 236,128 238,123 234,120 239,120" fill={stampBlue} />

          {/* Bottom Inner Text (Address) */}
          {stampAddress && (
            <text fill={stampBlue} fontSize="10.5" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="1.6">
              <textPath href="#bottomInnerArc" startOffset="50%" textAnchor="middle">
                {stampAddress}
              </textPath>
            </text>
          )}

          {/* Bottom Outer Text (Location / Phone) */}
          <text fill={stampBlue} fontSize="12" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="1.8">
            <textPath href="#bottomOuterArc" startOffset="50%" textAnchor="middle">
              {stampPhone} · {stampLocation}
            </textPath>
          </text>
        </g>
      </StyledSVG>
    </StampWrapper>
  );
};

export default OfficialStamp;
export { StampWrapper };