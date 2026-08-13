import React, { useState, useEffect } from 'react';
import { Shield, Zap, MessageCircle, Mail, Globe } from '../../utils/icons/icons';
import styled from 'styled-components';

// ------------------- DATA -------------------
const SUPPORT = { phone: '0740045355', email: 'infowelttallis@gmail.com' };

const colors = {
  dangerRed: '#C0392B',
  kinSuccess: '#00A896',
  kinDanger: '#E71D36',
  autopsySuccess: '#6A0572',
  autopsyDanger: '#37fc00',
};

const FooterBar = styled.footer`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 0.65rem 1.25rem;
  background: #0f172a;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  font-size: 0.75rem;
  gap: 0.75rem;
  overflow: hidden;

  > * {
    min-width: 0;
  }

  @media (max-width: 900px) {
    justify-content: center;
  }

  @media (max-width: 600px) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
  }
`;

const Section = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 0.8rem;
  flex-shrink: 1;

  /* Prevent long text from pushing the footer wider */
  > * {
    min-width: 0;
  }

  span {
    min-width: 0;
  }

  @media (max-width: 900px) {
    justify-content: center;
    flex-wrap: wrap;
  }

  @media (max-width: 600px) {
    width: 100%;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.55rem;

    &:first-child {
      grid-column: auto;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 0.75rem;
    }
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
  flex-shrink: 0;

  svg {
    flex-shrink: 0;
  }
`;

const NavLink = styled.a`
  color: #94a3b8;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 0.2s ease;

  &:hover {
    color: #60a5fa;
  }

  svg {
    flex-shrink: 0;
  }
`;

const Status = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #10b981;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;

  span {
    width: 6px;
    height: 6px;
    min-width: 6px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 8px #10b981;
  }
`;

const RedText = styled.span`
  color: ${colors.autopsyDanger};
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
  display: inline-block;
  vertical-align: bottom;

  @media (max-width: 600px) {
    max-width: 140px;
  }
`;

const ProductId = styled.span`
  font-size: 0.7rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
`;

const SystemMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex-wrap: wrap;

  > div {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    white-space: nowrap;
  }

  svg {
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    width: 100%;
    gap: 0.6rem;
    justify-content: flex-start;
  }
`;
// ------------------- COMPONENT -------------------
const FooterComponent = () => {
  const [latency, setLatency] = useState('24ms');
  const [userName, setUserName] = useState('User');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const name = user.full_name || user.name || user.username || user.email || 'User';
        setUserName(name);
      }
    } catch (e) {
      setUserName('User');
    }
  }, []);

  // Generate a random product ID
  const generateProductId = () => {
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `WT-RSP-CLOUD.V2.1-${currentYear}-${randomCode}`;
  };
  const [productId] = useState(generateProductId());

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(`${Math.floor(Math.random() * 10) + 21}ms`);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <FooterBar>
      {/* BRAND & USER */}
      <Section>
        <Brand>
          <Shield size={14} /> © {currentYear} WELT TALLIS Inc
        </Brand>
        <div style={{ opacity: 0.5 }}>|</div>
        <span>
          {' '}
          - Logged in as : <RedText>{userName}</RedText>
        </span>
      </Section>

      {/* SUPPORT LINKS */}
      <Section>
        <NavLink href={`https://wa.me/${SUPPORT.phone}`} target="_blank">
          <MessageCircle size={14} /> WhatsApp
        </NavLink>
        <NavLink href={`mailto:${SUPPORT.email}`}>
          <Mail size={14} /> Contact
        </NavLink>
      </Section>

      {/* SYSTEM STATUS */}
      <Section style={{ alignItems: 'flex-end' }}>
        <Status>
          <span /> Operational
        </Status>
        <SystemMeta>
          <div>
            <Zap size={12} /> {latency}
          </div>
          <div>
            <Globe size={12} /> v2.1
          </div>
          <ProductId>Product ID: {productId}</ProductId>
        </SystemMeta>
      </Section>
    </FooterBar>
  );
};

export default FooterComponent;
