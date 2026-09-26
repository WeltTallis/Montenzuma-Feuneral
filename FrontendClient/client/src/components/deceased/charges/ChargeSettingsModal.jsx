import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import {
  DollarSign, Save, ArrowLeft, Tag, Clock, Calendar, RefreshCw,
  X, Check, FlaskConical, CreditCard, FileText, Settings
} from '../../utils/icons/icons';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import env from '../../utils/config/env';

// Base API URL (kept for parity with the standalone page)
const BASE_API = env.API_URL || 'https://restpoint.co.ke/api/v1/restpoint';

// Fonts match the Scanner Bridge side panel (ScanDocumentModal)
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
`;

/* Palette copied from the Scanner Bridge side panel (components/scanner/ScanDocumentModal.jsx)
   so this panel looks identical: dark-teal header, white body, sharp corners,
   grey fields and a black primary action. */
const C = {
  black: '#0a0a0a',
  dark: '#1a1a1a',
  gray: '#777777',
  border: '#c8c8c8',
  borderLight: '#e0e0e0',
  bgField: '#f7f7f5',
  white: '#ffffff',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#2563eb',
  headFrom: '#0f3040',
  headTo: '#163f52',
  headLine: '#0b2936',
};

const FONT_SANS = "'Source Sans 3', -apple-system, sans-serif";
const FONT_SERIF = "'Merriweather', Georgia, serif";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// ===============================
// Panel chrome — mirrors the Scanner Bridge side panel
// ===============================
const Scrim = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 10, .38);
  opacity: 0;
  visibility: hidden;
  transition: opacity .18s ease-out, visibility .18s;
  z-index: 90;

  &.show {
    opacity: 1;
    visibility: visible;
  }
`;

const Panel = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(520px, 100vw);
  height: 100vh;
  background: ${C.white};
  border-left: 1px solid ${C.border};
  box-shadow: -18px 0 44px -18px rgba(10, 10, 10, .35);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${slideIn} .2s ease-out;

  &.open {
    transform: translateX(0);
  }
`;

const PanelHead = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 24px;
  flex-shrink: 0;
  background: linear-gradient(135deg, ${C.headFrom} 0%, ${C.headTo} 100%);
  border-bottom: 1px solid ${C.headLine};
  box-shadow: 0 8px 18px rgba(15, 48, 64, .16);
`;

const HeadIcon = styled.span`
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 8px;
  background: rgba(255, 255, 255, .12);
  border: 1px solid rgba(255, 255, 255, .18);
  color: ${C.white};
`;

const IconBtn = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, .28);
  background: rgba(255, 255, 255, .08);
  color: ${C.white};
  display: grid;
  place-items: center;
  cursor: pointer;
  flex: 0 0 auto;

  &:hover {
    background: rgba(255, 255, 255, .18);
    border-color: ${C.white};
  }
`;

const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: ${C.border} transparent;
`;

const ModalFooter = styled.footer`
  padding: 14px 24px;
  border-top: 1px solid ${C.borderLight};
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  background: ${C.white};
`;

// ===============================
// Styled Components (rate config form)
// ===============================
const PanelTitle = styled.h2`
  font-family: ${FONT_SERIF};
  font-size: 17px;
  font-weight: 700;
  color: ${C.white};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PanelSubtitle = styled.span`
  display: block;
  margin: 4px 0 0 52px;
  color: rgba(255, 255, 255, .72);
  font: 11px ${FONT_SANS};
  letter-spacing: .04em;
`;

const Group = styled.div`
  margin-bottom: 18px;
`;

const GroupLabel = styled.div`
  font-size: 10px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: ${C.gray};
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${C.borderLight};
  }
`;

const Segment = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: ${C.bgField};
  border: 1px solid ${C.borderLight};
  border-radius: 8px;
  padding: 3px;
`;

const SegmentIndicator = styled.div`
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc(50% - 3px);
  background: ${C.black};
  border-radius: 6px;
  transition: transform .25s ease-out;
  transform: ${props => props.$isHourly ? 'translateX(100%)' : 'translateX(0)'};
`;

const SegmentBtn = styled.button`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 6px;
  border: none;
  background: none;
  cursor: pointer;
  font: 600 12.5px ${FONT_SANS};
  color: ${props => props.$active ? '#ffffff' : C.gray};
  transition: color .2s ease-out;
`;

const CurrencyGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const CurrencyCard = styled.label`
  position: relative;
  padding: 11px 12px;
  cursor: pointer;
  background: ${C.white};
  border: 1px solid ${C.border};
  border-radius: 8px;
  transition: border-color .2s ease-out, box-shadow .2s ease-out;

  ${props => props.$selected && `
    border-color: ${C.black};
    box-shadow: 0 0 0 3px rgba(10, 10, 10, .08);
  `}

  &:hover {
    border-color: ${C.black};
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
`;

const CurCode = styled.span`
  font-family: ${FONT_SERIF};
  font-size: 15px;
  font-weight: 700;
  color: ${C.dark};
  display: block;
`;

const CurName = styled.span`
  font-size: 11px;
  color: ${C.gray};
  display: block;
  margin-top: 1px;
`;

const CurCheck = styled.span`
  position: absolute;
  top: 9px;
  right: 9px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${C.black};
  color: ${C.white};
  display: grid;
  place-items: center;
  opacity: ${props => props.$selected ? 1 : 0};
  transform: ${props => props.$selected ? 'scale(1)' : 'scale(.5)'};
  transition: all .2s ease-out;
`;

const Control = styled.div`
  display: flex;
  align-items: center;
  background: ${C.bgField};
  border: 1px solid ${C.border};
  border-radius: 8px;
  transition: border-color .2s ease-out, box-shadow .2s ease-out;

  &:focus-within {
    border-color: ${C.black};
    background: ${C.white};
    box-shadow: 0 0 0 3px rgba(10, 10, 10, .06);
  }
`;

const ControlPrefix = styled.span`
  padding: 10px 3px 10px 13px;
  font: 600 12.5px ${FONT_SANS};
  color: ${C.gray};
  flex-shrink: 0;
`;

const ControlInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  outline: none;
  font: 600 14.5px ${FONT_SANS};
  color: ${C.dark};
  padding: 10px 4px;
  font-variant-numeric: tabular-nums;

  &::placeholder {
    color: ${C.gray};
    font-weight: 400;
  }
`;

const ControlSuffix = styled.span`
  padding: 10px 13px 10px 3px;
  font-size: 11.5px;
  color: ${C.gray};
  flex-shrink: 0;
`;

const Hint = styled.p`
  font-size: 12px;
  color: ${C.gray};
  margin-top: 6px;
  padding-left: 2px;
  font-weight: 400;
`;

const Summary = styled.div`
  background: linear-gradient(135deg, ${C.headFrom} 0%, ${C.headTo} 100%);
  border-radius: 8px;
  padding: 16px 18px;
  color: ${C.white};
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    right: -50px;
    bottom: -50px;
    width: 130px;
    height: 130px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, .18);
  }
`;

const SummaryKicker = styled.div`
  font-size: 10px;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .72);
  font-weight: 700;
  margin-bottom: 7px;
`;

const SummaryRate = styled.div`
  font-family: ${FONT_SERIF};
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;

  small {
    font-family: ${FONT_SANS};
    font-size: 12px;
    color: rgba(255, 255, 255, .7);
    font-weight: 400;
  }
`;

const SummaryNote = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, .72);
  font-weight: 400;
  margin: 3px 0 12px;
`;

const SummaryRows = styled.div`
  border-top: 1px solid rgba(255, 255, 255, .16);
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, .16);
  font-size: 12px;

  &:last-child {
    border-bottom: none;
  }

  span:first-child {
    color: rgba(255, 255, 255, .72);
    font-weight: 400;
  }

  span:last-child {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
`;

const PanelFoot = styled.footer`
  padding: 14px 24px;
  border-top: 1px solid ${C.borderLight};
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  background: ${C.white};
`;

const Btn = styled.button`
  flex: 1;
  padding: 12px 18px;
  border-radius: 8px;
  font: 700 13.5px ${FONT_SANS};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background .2s ease-out, border-color .2s ease-out, color .2s ease-out;
`;

const GhostBtn = styled(Btn)`
  background: ${C.white};
  border: 1px solid ${C.border};
  color: ${C.dark};

  &:hover {
    border-color: ${C.black};
    color: ${C.black};
  }
`;

const SaveBtn = styled(Btn)`
  background: ${C.black};
  color: ${C.white};
  border: none;

  &:hover:not(:disabled) {
    background: ${C.dark};
  }

  &:disabled {
    opacity: .55;
    cursor: wait;
  }

  svg {
    color: ${C.white};
  }
`;

const Spin = styled.div`
  animation: spin .9s linear infinite;
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Strip = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  background: ${C.bgField};
  border: 1px solid ${C.borderLight};
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 18px;
`;

const StripAvatar = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${C.headFrom};
  color: ${C.white};
  display: grid;
  place-items: center;
  font-family: ${FONT_SERIF};
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
`;

const StripName = styled.div`
  font-weight: 600;
  font-size: 13.5px;
  color: ${C.dark};
`;

const StripMeta = styled.div`
  font-size: 11.5px;
  color: ${C.gray};
`;

// Main Component
const ChargeSettingsModal = ({ isOpen, onClose, deceasedId, deceasedData, onUpdate }) => {
  // Form state
  const [chargeSettings, setChargeSettings] = useState({
    rateProfile: 'standard',
    currency: 'KES',
    chargeType: 'daily',
    dailyRate: '',
    hourlyRate: '',
    usdRate: '',
  });
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load existing charge settings when the modal opens
  useEffect(() => {
    if (!isOpen || !deceasedId) return;

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const response = await api.get(ENDPOINTS.DECEASED.CHARGE_SETTINGS(deceasedId));
        if (response.data?.success) {
          const data = response.data.data;
          setChargeSettings({
            rateProfile: data.rateProfile || 'standard',
            currency: data.currency || 'KES',
            chargeType: data.chargeType || 'daily',
            dailyRate: data.dailyRate || '',
            hourlyRate: data.hourlyRate || '',
            usdRate: data.usdRate || '130',
          });
        }
      } catch (error) {
        console.error('Error fetching charge settings:', error);
        toast.error(error.response?.data?.message || 'Failed to load charge settings');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen, deceasedId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'dailyRate' || name === 'hourlyRate' || name === 'usdRate') {
      // numeric-only, no leading zeros
      let cleanValue = value.replace(/[^\d]/g, '').replace(/^0+/, '');
      cleanValue = cleanValue === '' ? '' : parseInt(cleanValue, 10);
      setChargeSettings((prev) => ({ ...prev, [name]: cleanValue }));
    } else {
      setChargeSettings((prev) => ({ ...prev, [name]: value }));
    }
  };

  const setFreq = (freq) => {
    setChargeSettings((prev) => ({ ...prev, chargeType: freq }));
  };

  const setCurrency = (cur) => {
    setChargeSettings((prev) => ({ ...prev, currency: cur }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deceasedId) return;

    setLoading(true);
    try {
      const dailyRate = chargeSettings.dailyRate === '' ? 0 : parseInt(chargeSettings.dailyRate, 10);
      const hourlyRate = chargeSettings.hourlyRate === '' ? 0 : parseInt(chargeSettings.hourlyRate, 10);
      const usdRate = chargeSettings.usdRate === '' ? 0 : parseInt(chargeSettings.usdRate, 10);

      // Basic validation
      if (chargeSettings.chargeType === 'daily' && (!dailyRate || dailyRate <= 0)) {
        throw new Error('Please enter a valid daily rate.');
      }
      if (chargeSettings.chargeType === 'hourly' && (!hourlyRate || hourlyRate <= 0)) {
        throw new Error('Please enter a valid hourly rate.');
      }
      if (chargeSettings.currency === 'USD' && (!usdRate || usdRate <= 0)) {
        throw new Error('Please enter a valid USD exchange rate.');
      }

      const apiData = {
        rateProfile: chargeSettings.rateProfile,
        currency: chargeSettings.currency,
        chargeType: chargeSettings.chargeType,
        dailyRate,
        hourlyRate,
        usdRate,
        isHomeDefault: false,
      };

      const response = await api.put(ENDPOINTS.DECEASED.UPDATE_CHARGE_SETTINGS(deceasedId), apiData);

      if (response.data?.success) {
        toast.success('Charge configuration saved.');
        if (onUpdate) onUpdate();
        onClose();
      } else {
        throw new Error(response.data?.message || 'Failed to update charge settings');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMorgue = () => {
    if (!deceasedData?.date_admitted) return 0;
    const admissionDate = new Date(deceasedData.date_admitted);
    if (isNaN(admissionDate.getTime())) return 0;
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.floor((startOfDay(new Date()) - startOfDay(admissionDate)) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const symbols = { KES: 'KSh', USD: '$' };
  const formatVal = (val) => (val ? parseInt(val, 10).toLocaleString('en-US') : '');
  const fmt = (n) => (n ? `${symbols[chargeSettings.currency]} ${parseInt(n, 10).toLocaleString('en-US')}` : 'Not set');

  const currentRate = chargeSettings.chargeType === 'daily' ? chargeSettings.dailyRate : chargeSettings.hourlyRate;
  const projection = currentRate
    ? (chargeSettings.chargeType === 'daily' ? currentRate * 30 : currentRate * 24 * 30)
    : 0;

  if (!isOpen) return null;

  return (

    <>

      <GlobalStyle />
      <Scrim onClick={onClose} />

      <Panel className="open" role="dialog" aria-modal="true" aria-label="Charge configuration">
        <PanelHead>
          <div>
            <PanelTitle>
              <HeadIcon><DollarSign size={20} /></HeadIcon>
              Charge configuration
            </PanelTitle>
            <PanelSubtitle>{deceasedId} · Billing — daily and hourly rates for this record</PanelSubtitle>
          </div>
          <IconBtn onClick={onClose} aria-label="Close">
            <X size={14} />
          </IconBtn>
        </PanelHead>

        <PanelBody>
          {/* Client strip */}
          <Strip>
            <StripAvatar>{deceasedData?.full_name?.charAt(0) || 'C'}</StripAvatar>
            <div>
              <StripName>{deceasedData?.full_name || 'Client'}</StripName>
              <StripMeta>
                Admitted {deceasedData?.date_admitted ? new Date(deceasedData.date_admitted).toLocaleDateString() : '—'} · {getDaysInMorgue()} days in morgue
              </StripMeta>
            </div>
          </Strip>

          <form onSubmit={handleSubmit}>
            {/* Frequency */}
            <Group>
              <GroupLabel>Charge frequency</GroupLabel>
              <Segment>
                <SegmentIndicator $isHourly={chargeSettings.chargeType === 'hourly'} />
                <SegmentBtn
                  type="button"
                  $active={chargeSettings.chargeType === 'daily'}
                  onClick={() => setFreq('daily')}
                >
                  <Calendar size={13} />
                  Per day
                </SegmentBtn>
                <SegmentBtn
                  type="button"
                  $active={chargeSettings.chargeType === 'hourly'}
                  onClick={() => setFreq('hourly')}
                >
                  <Clock size={13} />
                  Per hour
                </SegmentBtn>
              </Segment>
            </Group>

            {/* Currency */}
            <Group>
              <GroupLabel>Currency</GroupLabel>
              <CurrencyGrid>
                <CurrencyCard
                  $selected={chargeSettings.currency === 'KES'}
                  onClick={() => setCurrency('KES')}
                >
                  <input type="radio" name="currency" value="KES" checked={chargeSettings.currency === 'KES'} onChange={() => setCurrency('KES')} />
                  <CurCode>KES</CurCode>
                  <CurName>Kenyan Shilling</CurName>
                  <CurCheck $selected={chargeSettings.currency === 'KES'}><Check size={9} /></CurCheck>
                </CurrencyCard>
                <CurrencyCard
                  $selected={chargeSettings.currency === 'USD'}
                  onClick={() => setCurrency('USD')}
                >
                  <input type="radio" name="currency" value="USD" checked={chargeSettings.currency === 'USD'} onChange={() => setCurrency('USD')} />
                  <CurCode>USD</CurCode>
                  <CurName>US Dollar</CurName>
                  <CurCheck $selected={chargeSettings.currency === 'USD'}><Check size={9} /></CurCheck>
                </CurrencyCard>
              </CurrencyGrid>
            </Group>

            {/* Rate */}
            <Group>
              <GroupLabel>{chargeSettings.chargeType === 'daily' ? 'Daily rate' : 'Hourly rate'}</GroupLabel>
              <Control>
                <ControlPrefix>{symbols[chargeSettings.currency]}</ControlPrefix>
                <ControlInput
                  type="text"
                  inputMode="numeric"
                  name={chargeSettings.chargeType === 'daily' ? 'dailyRate' : 'hourlyRate'}
                  value={formatVal(currentRate)}
                  onChange={handleInputChange}
                  placeholder={chargeSettings.chargeType === 'daily' ? '4,000' : '200'}
                />
                <ControlSuffix>/ {chargeSettings.chargeType === 'daily' ? 'day' : 'hour'}</ControlSuffix>
              </Control>
              <Hint>
                {chargeSettings.chargeType === 'daily'
                  ? 'Charged once for each day in care.'
                  : 'Charged for every hour in care.'}
              </Hint>
              <Hint>This setting applies only to this deceased record. Home defaults are managed in Settings.</Hint>
            </Group>

            {/* FX (USD only) */}
            {chargeSettings.currency === 'USD' && (
              <Group>
                <GroupLabel>Exchange rate</GroupLabel>
                <Control>
                  <ControlPrefix>1 USD =</ControlPrefix>
                  <ControlInput
                    type="text"
                    inputMode="numeric"
                    name="usdRate"
                    value={formatVal(chargeSettings.usdRate)}
                    onChange={handleInputChange}
                    placeholder="130"
                  />
                  <ControlSuffix>KES</ControlSuffix>
                </Control>
                <Hint>Converts USD charges for local statements.</Hint>
              </Group>
            )}

            {/* Summary */}
            <Summary>
              <SummaryKicker>Billing summary</SummaryKicker>
              <SummaryRate>
                {currentRate ? `${fmt(currentRate)}` : 'Not set'} <small>/ {chargeSettings.chargeType === 'daily' ? 'day' : 'hour'}</small>
              </SummaryRate>
              <SummaryNote>
                {currentRate
                  ? `Estimated 30-day charge · ${fmt(projection)}`
                  : 'Enter a rate to see a projection.'}
              </SummaryNote>
              <SummaryRows>
                <SummaryRow>
                  <span>Frequency</span>
                  <span>{chargeSettings.chargeType === 'daily' ? 'Daily' : 'Hourly'}</span>
                </SummaryRow>
                <SummaryRow>
                  <span>Currency</span>
                  <span>{chargeSettings.currency}</span>
                </SummaryRow>
                {chargeSettings.currency === 'USD' && chargeSettings.usdRate && (
                  <SummaryRow>
                    <span>Exchange rate</span>
                    <span>{formatVal(chargeSettings.usdRate)} KES</span>
                  </SummaryRow>
                )}
              </SummaryRows>
            </Summary>

            <PanelFoot>
              <GhostBtn type="button" onClick={onClose}>
                Discard
              </GhostBtn>
              <SaveBtn type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spin><RefreshCw size={14} /></Spin>
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Save configuration
                  </>
                )}
              </SaveBtn>
            </PanelFoot>
          </form>
        </PanelBody>
      </Panel>

    </>

  );

};

export default ChargeSettingsModal;