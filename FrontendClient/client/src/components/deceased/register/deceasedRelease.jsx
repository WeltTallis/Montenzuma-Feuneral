import { resolveTenantBranding } from '../../../utils/tenantResolver/tenantBranding';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getTenantSlug, getAuthToken } from '../../../utils/globalAuth';
import ReusableSignaturePad from '../../../utils/signature/signaturepad';
import { ToastContainer, toast } from 'react-toastify';
import styled, { keyframes } from 'styled-components';
import { ENDPOINTS } from '../../../api/endpoints';
import OfficialStamp from '../../stamp/stamp';
import env from '../../../utils/config/env';
import bwipjs from '@bwip-js/browser';
import notify from '@/utils/notify';
import axios from 'axios';
import {
  Check, Loader2, CheckCircle, X, FileText, User, RotateCcw, ShieldCheck,
  AlertCircle, ArrowRight, Calendar, Clock, Phone, IdCard, MapPin
} from '../../../utils/icons/icons';

// ─── Color Palette ──────────────────────────────────
const COLORS = {
  ink: '#15171A',
  bone: '#FAF8F4',
  bone2: '#F3EFE6',
  brass: '#8B7355',
  brassLight: '#A98F6E',
  verdigris: '#3D4F47',
  verdigrisDark: '#2E3F37',
  verdigrisLight: '#4D6359',
  verdigrisTint: '#EBEFEF',
  line: '#E3DDD0',
  lineDark: 'rgba(250,248,244,0.14)',
  gray: '#6B6862',
  grayLight: 'rgba(250,248,244,0.62)',
  red: '#9B4A3F',
  redBg: '#F7ECE9',
  redLine: '#E8D2CC',
  success: '#475A43',
  successBg: '#EEF3EC',
  white: '#FFFFFF',
  inkBlue: '#0f33e7',
  stampBlue: '#0f33e7',
  stampRed: '#dc2626',
  gold: '#C9A227',
  goldDark: '#A8851C',
  tickBlue: '#2564eb1b',
  green: '#22c55e',
};

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  min-height: 100vh;
  background: ${COLORS.bone2};
  font-family: 'Saira', sans-serif;
  color: ${COLORS.ink};
  font-size: 15px;
  line-height: 1.5;
  padding: 0;

  .Toastify__toast-container { width: 380px !important; max-width: 90vw !important; padding: 0 !important; }
  .Toastify__toast { border-radius: 8px !important; font-family: 'Saira', sans-serif !important; font-size: 0.85rem !important; padding: 10px 14px !important; min-height: 44px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; margin-bottom: 0.5rem !important; }
  .Toastify__toast-body { padding: 0 !important; margin: 0 !important; font-size: 0.85rem !important; }
`;

const FormSheet = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  background: ${COLORS.white};
  border-radius: 0;
  box-shadow: none;
  border: none;
  overflow: hidden;
  position: relative;
`;

const Watermark = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-35deg);
  font-size: 8rem;
  font-weight: 800;
  color: rgba(21, 23, 26, 0.025);
  font-family: 'Fraunces', serif;
  white-space: nowrap;
  pointer-events: none;
  z-index: 0;
  letter-spacing: 0.2em;
  text-transform: uppercase;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
`;

const Letterhead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem 3rem;
  border-bottom: 1px solid ${COLORS.line};
  background: ${COLORS.white};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${COLORS.verdigris} 0%, ${COLORS.brass} 50%, ${COLORS.verdigris} 100%);
  }

  @media (max-width: 480px) {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 1rem;
    padding: 1.5rem 1rem;
  }
`;

const BrandLeftWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    align-items: center;
  }
`;

const LogoBox = styled.div`
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  & > img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const BrandDetails = styled.div`
  min-width: 0;

  @media (max-width: 480px) {
    text-align: center;
  }
`;

const BrandName = styled.h1`
  font-family: 'Saira', sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  color: ${COLORS.ink};
  line-height: 1.1;
  letter-spacing: -0.02em;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const BrandMeta = styled.div`
  font-size: 0.8rem;
  color: ${COLORS.gray};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.2rem;
  font-weight: 500;
  
  svg { 
    opacity: 0.8;
    flex-shrink: 0;
    color: ${COLORS.brass};
  }

  @media (max-width: 480px) {
    justify-content: center;
  }
`;

const BrandRightWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    align-items: center;
  }
`;

const DocTitle = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${COLORS.verdigris};
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    width: 8px;
    height: 4px;
    background: ${COLORS.brass};
    display: inline-block;
  }

  @media (max-width: 480px) {
    &::before { display: none; }
  }
`;

const BarcodeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const FileIdText = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: ${COLORS.gray};
  text-align: center;
  
  span {
    font-weight: 700;
    color: ${COLORS.ink};
    letter-spacing: 0.05em;
    margin-left: 0.25rem;
  }
`;

const FormBody = styled.div`
  padding: 3rem 4rem;

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`;

const Section = styled.div`
  margin-bottom: 4rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 0.75rem 1.25rem;
  background: ${COLORS.ink}; 
  border-radius: 4px;
`;

const SectionNum = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250,248,244,0.4);
  font-family: 'JetBrains Mono', monospace;
`;

const SectionTitle = styled.h2`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${COLORS.bone};
  margin: 0;
`;

const Row = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 1024px) {
    flex-wrap: wrap;
  }
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.25rem;
  }
`;

const Col = styled.div`
  flex: 1;
  min-width: 0;

  @media (max-width: 1024px) {
    flex: 1 1 45%;
    min-width: 200px;
  }
  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`;

const Col2 = styled(Col)` flex: 2; @media (max-width: 1024px) { flex: 1 1 100%; } `;
const Col05 = styled(Col)` flex: 0.5; @media (max-width: 1024px) { flex: 1 1 30%; min-width: 120px; } `;

const Label = styled.label`
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLORS.brass};
  margin-bottom: 0.5rem;
  font-family: 'Saira', sans-serif;
`;

const InputFieldWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  height: 2.75rem;
  border: none;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 0 2rem 0 0;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  color: ${COLORS.ink};
  transition: border-color 0.2s ease;
  box-sizing: border-box;

  &:focus {
    border: none;
    border-bottom: 1px solid ${COLORS.ink};
    outline: none;
    box-shadow: none;
    background: transparent;
  }

  &:hover {
    border-bottom: 1px solid ${COLORS.ink};
  }

  &:disabled {
    background: transparent;
    color: ${COLORS.gray};
    cursor: not-allowed;
    opacity: 0.8;
  }

  &::placeholder { color: #a8a29e; font-weight: 400; }
`;

const InputLg = styled(Input)`
  height: 3rem;
  font-size: 1.05rem;
  font-weight: 500;
`;

const Select = styled.select`
  width: 100%;
  height: 2.75rem;
  border: none;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 0 2rem 0 0;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  color: ${COLORS.ink};
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  cursor: pointer;

  &:focus {
    border: none;
    border-bottom: 1px solid ${COLORS.ink};
    outline: none;
    box-shadow: none;
    background: transparent;
  }

  &:hover {
    border-bottom: 1px solid ${COLORS.ink};
  }
`;

const TickIconWrapper = styled.div`
  position: absolute;
  right: 0.25rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.tickBlue};
  pointer-events: none;
`;

// Green spinning loader rendered INSIDE the admission number input while searching
const SpinIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.green};

  svg {
    animation: ${spin} 0.8s linear infinite;
  }
`;

const SearchStatus = styled.span`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${COLORS.green};
  white-space: nowrap;
  pointer-events: none;
  z-index: 2;
`;

const ErrorMessage = styled.span`
  color: ${COLORS.red};
  font-size: 0.75rem;
  margin-top: 0.3rem;
  display: block;
  font-family: 'Saira', sans-serif;
`;

const SigCanvasWrap = styled.div`
  border-bottom: 2px solid ${COLORS.ink};
  border-radius: 4px 4px 0 0;
  height: 14rem; 
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.bone};
  cursor: crosshair;
  position: relative;
  margin-bottom: 0.5rem;
  overflow: hidden;
  width: 100%;
  box-shadow: inset 0 1px 2px rgba(21, 23, 26, 0.03);

  & > canvas {
    width: 100% !important;
    height: 100% !important;
    touch-action: none;
  }

  @media (max-width: 1024px) {
    height: 14rem; 
  }
  @media (max-width: 768px) {
    height: 18rem; 
  }
`;

const SigGuideText = styled.div`
  position: absolute;
  bottom: 10px;
  left: 15px;
  font-family: 'Alex Brush', cursive;
  font-size: 1.2rem;
  color: ${COLORS.gray};
  opacity: 0.3;
  pointer-events: none;
  user-select: none;
`;

const SignOffContainer = styled.div`
  position: relative;
  margin-top: 2.5rem;
`;

const SignOffGrid = styled.div`
  display: grid;
  grid-template-columns: 2.5fr 1.5fr;
  gap: 3rem;
  align-items: end;
  grid-template-areas: "sig right";

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "sig"
      "right";
    gap: 2.5rem;
  }
`;

const GridSig = styled.div` grid-area: sig; min-width: 0; `;

const GridRight = styled.div`
  grid-area: right;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative; 
  padding-bottom: 1.5rem;
`;

const GridName = styled.div` min-width: 0; position: relative; z-index: 1; `;
const GridDate = styled.div` min-width: 0; position: relative; z-index: 1; `;

const StampWrapper = styled.div`
  position: absolute;
  bottom: 25px;
  right: -15px;
  width: 240px;
  pointer-events: none;
  transform: rotate(-12deg);
  opacity: 0.92;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
  z-index: 10;

  @media (max-width: 1024px) {
    position: relative;
    bottom: auto;
    right: auto;
    margin: 1rem auto 0;
    transform: rotate(-6deg) scale(0.9);
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid ${COLORS.line};
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }
`;

const PrimaryButton = styled.button`
  background: ${COLORS.verdigris};
  color: ${COLORS.bone};
  border: none;
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Saira', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  text-transform: uppercase;

  &:hover {
    background: ${COLORS.verdigrisDark};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(61, 79, 71, 0.2);
  }

  &:disabled {
    background: ${COLORS.gray};
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const GoldButton = styled.button`
  background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%);
  color: ${COLORS.ink};
  border: 1px solid ${COLORS.goldDark};
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Saira', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(201, 162, 39, 0.25);

  &:hover {
    background: linear-gradient(135deg, ${COLORS.goldDark} 0%, ${COLORS.gold} 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(201, 162, 39, 0.4);
    color: ${COLORS.white};
  }

  &:disabled {
    background: ${COLORS.gray};
    color: ${COLORS.bone};
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const BlackButton = styled.button`
  background: ${COLORS.ink};
  color: ${COLORS.bone};
  border: 1px solid ${COLORS.ink};
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Saira', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(21, 23, 26, 0.2);

  &:hover {
    background: #2a2d31;
    border-color: #2a2d31;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(21, 23, 26, 0.35);
  }

  &:disabled {
    background: ${COLORS.gray};
    border-color: ${COLORS.gray};
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ClearSigButton = styled.button`
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${COLORS.gray};
  background: none;
  border: none;
  padding: 0.25rem 0;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Saira', sans-serif;

  &:hover {
    color: ${COLORS.red};
  }
`;

// ─── Official Footer & Barcode Panel ───────────────────────────────
const FooterPanel = styled.div`
background: ${COLORS.white};
padding: 1rem 2rem; 
display: flex;
justify-content: space-between;
align-items: center;
gap: 2rem;
flex-wrap: wrap;

 @media (max-width: 768px) {
 flex-direction: column;
 padding: 2rem 1.5rem;
 text-align: center;
 }
`;

const FooterText = styled.div`
font-size: 0.65rem;
letter-spacing: 0.1em;
text-transform: uppercase;
color: ${COLORS.gray};
font-family: 'JetBrains Mono', monospace;
text-align: left;
line-height: 1.6;
 
@media (max-width: 768px) {
text-align: center;

}
`;

const Barcode = ({ value }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      try {
        const text = value || 'AWAITING-ID';
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',
          text: text,
          scale: 4,
          height: 10,
          includetext: true,
          textxalign: 'center',
          textsize: 13,
          paddingwidth: 10,
          paddingheight: 5,
        });
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [value]);

  return <canvas ref={canvasRef} style={{ width: '100%', maxWidth: '250px', height: 'auto' }} />;
};

const TextArea = styled.textarea`
  width: 100%;
  min-height: 5.5rem;
  border: none;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 0.5rem 0;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  color: ${COLORS.ink};
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  resize: vertical;

  &:focus {
    border: none;
    border-bottom: 1px solid ${COLORS.ink};
    outline: none;
    box-shadow: none;
    background: transparent;
  }

  &:hover {
    border-bottom: 1px solid ${COLORS.ink};
  }

  &::placeholder { color: #a8a29e; font-weight: 400; }
`;

const DeceasedReleaseForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const getTenantSlug = () => {
    return localStorage.getItem('tenantSlug') ||
      localStorage.getItem('tenant_slug') ||
      (() => {
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          return user.tenantSlug || user.tenant?.slug || 'default';
        } catch {
          return 'default';
        }
      })();
  };
  const sigPadRef1 = useRef(null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoadingDeceasedList, setIsLoadingDeceasedList] = useState(false);
  const [isLoadingDeceased, setIsLoadingDeceased] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFound, setIsFound] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deceasedList, setDeceasedList] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [releaseId, setReleaseId] = useState('');

  const branding = useMemo(() => resolveTenantBranding(), []);

  const {
    name: tenantName,
    displayPhone,
    displayEmail,
    displayLocation,
    tenantCountry,
    displayBranch,
    displayAddress,
    tenantLogoUrl,
    fallback
  } = branding;



  const getLoggedInUserEmail = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.email || user.userEmail || '';
    } catch {
      return '';
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const initialFormData = {
    admission_number: location.state?.permitNumber || '',
    date_admitted: new Date().toISOString().split('T')[0],
    time_received: getCurrentTime(),
    full_name: '',
    gender: '',
    age: '',
    date_of_birth: '',
    date_of_death: '',
    cause_of_death: '',
    place_of_death: '',
    body_status: 'Released',
    contact_person: '',
    next_kin: '',
    relationship: '',
    id_type: 'National ID',
    id_number: '',
    tel_number: '',
    release_date: new Date().toISOString().split('T')[0],
    release_time: getCurrentTime(),
    released_by: '',
    release_notes: '',
    date_of_removal: new Date().toISOString().split('T')[0],
    permit_number: '',
    mode_of_transport: 'hearse',
    terms_accepted: false,
    everything_paid: false,
    signature: '',
    verified_by: getLoggedInUserEmail(),
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      time_received: getCurrentTime(),
      release_time: getCurrentTime(),
    }));

  }, []);

  // Fetch deceased list for the admission dropdown (only unreleased records)
  useEffect(() => {
    const fetchDeceasedList = async () => {
      const tenantSlug = getTenantSlug();
      setIsLoadingDeceasedList(true);
      try {

        const response = await axios.get(`${env.FULL_API_URL}${ENDPOINTS.DECEASED.LIST}`, {
          headers: {
            'x-tenant-slug': tenantSlug,
            'Authorization': `Bearer ${getAuthToken()}`,
          },
        });

        const result = response.data?.data || response.data || [];
        if (Array.isArray(result) && result.length > 0) {
          const unreleased = result.filter((d) =>
            d.body_status !== 'Released' && d.body_status !== 'Transferred'
          );
          setDeceasedList(unreleased);
        }
      } catch (error) {
        console.error('Error fetching deceased list:', error);
      } finally {
        setIsLoadingDeceasedList(false);
      }
    };

    fetchDeceasedList();
  }, []);

  // Pre-fill form when arriving with a deceased ID
  useEffect(() => {
    const fetchDeceasedData = async () => {
      const deceasedId =
        id ||
        location.state?.deceasedId ||
        location.state?.deceasedData?.deceased_id ||
        location.state?.deceasedData?.id;
      if (!deceasedId) return;

      setIsLoadingDeceased(true);
      try {
        const tenantSlug = getTenantSlug();
        const response = await fetch(`${env.FULL_API_URL}${ENDPOINTS.DECEASED.DETAIL(deceasedId)}`, {
          headers: {
            'x-tenant-slug': tenantSlug,
            'Authorization': `Bearer ${getAuthToken()}`,
          },
        });

        const result = await response.json();
        if (response.ok && result.data) {
          fillDeceasedIntoForm(result.data);
          setFormData(prev => ({
            ...prev,
            release_date: new Date().toISOString().split('T')[0],
            release_time: getCurrentTime(),
          }));
        }
      } catch (error) {
        console.error('Error fetching deceased data:', error);
      } finally {
        setIsLoadingDeceased(false);
      }
    };

    fetchDeceasedData();
  }, [id, location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'admission_number' && isFound) setIsFound(false);
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (message.text) setMessage({ type: '', text: '' });
  };

  const fillDeceasedIntoForm = (deceased) => {
    setErrors(prev => ({ ...prev, admission_number: '', full_name: '', gender: '' }));
    setIsFound(true);
    setFormData(prev => ({
      ...prev,
      admission_number: deceased.admission_number || prev.admission_number,
      full_name: deceased.full_name || deceased.name_of_deceased || '',
      gender: deceased.gender || '',
      age: deceased.age || '',
      date_of_birth: deceased.date_of_birth || '',
      date_of_death: deceased.date_of_death || '',
      cause_of_death: deceased.cause_of_death || '',
      place_of_death: deceased.place_of_death || deceased.death_location || '',
      next_kin: deceased.contact_person || deceased.next_kin || deceased.next_of_kin || '',
      contact_person: deceased.contact_person || deceased.next_kin || '',
      relationship: deceased.relationship || deceased.kin_relationship || '',
      id_number: deceased.national_id || deceased.id_number || deceased.nationalId || '',
      tel_number: deceased.tell_no || deceased.tel_number || deceased.phone_number || deceased.contact || '',
      date_admitted: deceased.date_admitted || prev.date_admitted,
      date_of_removal: deceased.date_of_removal || prev.date_of_removal,
    }));
  };

  const handleAdmissionSearch = async () => {
    const admissionNumber = String(formData.admission_number || '').trim();

    if (!admissionNumber) {
      setErrors(prev => ({ ...prev, admission_number: 'Enter an admission number to search' }));
      return;
    }

    setIsSearching(true);
    setIsFound(false);
    setErrors(prev => ({ ...prev, admission_number: '' }));
    setMessage({ type: '', text: '' });

    // Keep the green "Searching..." loader visible inside the input for at least
    // 900ms so the user always sees the search phase, even on instant responses.
    const minDelay = new Promise((resolve) => setTimeout(resolve, 900));

    try {
      const tenantSlug = getTenantSlug();
      const request = axios.get(
        `${env.FULL_API_URL}${ENDPOINTS.DECEASED.BY_ADMISSION(encodeURIComponent(admissionNumber))}`,
        {
          headers: {
            'x-tenant-slug': tenantSlug,
            'Authorization': `Bearer ${getAuthToken()}`,
          },
        }
      );
      const response = await Promise.all([request, minDelay]).then(([res]) => res);

      const result = response.data;
      const deceased = result?.data || (result && result.full_name ? result : null);

      if (!deceased) {
        // Fall back to the locally-loaded list in case the API shape changes
        const local = deceasedList.find(
          (d) => String(d.admission_number).trim() === admissionNumber
        );
        if (local) {
          fillDeceasedIntoForm(local);
          return;
        }
        throw new Error('not-found');
      }

      fillDeceasedIntoForm(deceased);
    } catch (error) {
      // Even on a fast failure, hold the loader up briefly so the state change is visible
      await minDelay;
      // Fall back to the locally-loaded list before reporting a failure
      const local = deceasedList.find(
        (d) => String(d.admission_number).trim() === admissionNumber
      );
      if (local) {
        fillDeceasedIntoForm(local);
        return;
      }
      const apiError = error?.response?.data?.message || error?.message || 'Search failed';
      setIsFound(false);
      setErrors(prev => ({
        ...prev,
        admission_number: apiError === 'No-checkout' || /not found/i.test(String(apiError))
          ? `No deceased record found for admission number "${admissionNumber}".`
          : apiError,
      }));
    } finally {
      setIsSearching(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.admission_number) newErrors.admission_number = 'Admission number is required';
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.date_admitted) newErrors.date_admitted = 'Date admitted is required';
    if (!formData.release_date) newErrors.release_date = 'Release date is required';
    if (!formData.released_by.trim()) newErrors.released_by = 'Released by is required';
    if (!formData.next_kin.trim()) newErrors.next_kin = 'Next of kin is required';
    if (!formData.id_number.trim()) newErrors.id_number = 'ID number is required';
    if (!formData.tel_number.trim()) newErrors.tel_number = 'Telephone number is required';
    if (!formData.terms_accepted) newErrors.terms_accepted = 'You must accept the terms';

    if (formData.tel_number && !/^(\+254|0)[17]\d{8}$/.test(formData.tel_number.replace(/\s/g, ''))) {
      newErrors.tel_number = 'Please enter a valid Kenyan phone number';
    }

    if (sigPadRef1.current?.isEmpty()) {
      newErrors.signature = 'Signature is required to proceed';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken();
      const signatureData = sigPadRef1.current?.toDataURL();
      const freshTime = getCurrentTime();

      const payload = {
        ...formData,
        time_received: freshTime,
        release_time: freshTime,
        age: formData.age ? parseInt(formData.age, 10) : null,
        body_status: 'Released',
        verified_by: formData.verified_by || getLoggedInUserEmail() || null,
        signature: signatureData,
        name_of_deceased: formData.full_name,
        tell_number: formData.tel_number,
      };

      const response = await fetch(`${env.FULL_API_URL}${ENDPOINTS.BODYCHECKOUT.CHECKOUT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Release failed');
      }

      notify.success(
        'Release Successful',
        `${formData.full_name || 'The record'} has been released successfully.`
      );
      if (result.data && result.data.release_id) {
        setReleaseId(result.data.release_id);
      }

      setFormData({
        ...initialFormData,
        verified_by: getLoggedInUserEmail(),
        time_received: getCurrentTime(),
        release_time: getCurrentTime(),
        date_admitted: new Date().toISOString().split('T')[0],
        release_date: new Date().toISOString().split('T')[0],
        date_of_removal: new Date().toISOString().split('T')[0],
      });
      sigPadRef1.current?.clear();
      setErrors({});

      setTimeout(() => {
        navigate(`/tenant/${tenantSlug}/all-deceased`);
      }, 3000);

    } catch (error) {
      toast.error(error.message || 'Release failed. Please try again.');
      setMessage({
        type: 'error',
        text: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      ...initialFormData,
      verified_by: getLoggedInUserEmail(),
      time_received: getCurrentTime(),
      release_time: getCurrentTime(),
      date_admitted: new Date().toISOString().split('T')[0],
      release_date: new Date().toISOString().split('T')[0],
      date_of_removal: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    setMessage({ type: '', text: '' });
    setReleaseId('');
    setIsFound(false);
    setIsSearching(false);
    sigPadRef1.current?.clear();
  };

  const hasValue = (val) => val !== undefined && val !== null && String(val).trim().length > 0;

  if (isLoadingDeceased && !showSuccess) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} color={COLORS.ink} className="animate-spin" />
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: COLORS.gray, fontFamily: 'Saira', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading Record...</p>
        </div>
      </Container>
    );
  }

  if (isSubmitting) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} color={COLORS.ink} className="animate-spin" />
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: COLORS.gray, fontFamily: 'Saira', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Processing Release...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={3}
      />

      <FormSheet>
        <Watermark>OFFICIAL RECORD</Watermark>

        <ContentWrapper>
          <Letterhead>
            <BrandLeftWrapper>
              <LogoBox>
                {tenantLogoUrl && (
                  <img
                    src={tenantLogoUrl}
                    alt={tenantName}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
              </LogoBox>
              <BrandDetails>
                <BrandName>{tenantName}</BrandName>
                {displayLocation && (
                  <BrandMeta><MapPin size={12} /> {displayBranch ? `${displayBranch} · ` : ''}{displayLocation}{tenantCountry ? `, ${tenantCountry}` : ''}</BrandMeta>
                )}
                <BrandMeta><Phone size={12} /> {displayPhone || fallback.phone}{displayEmail ? ` · ${displayEmail}` : fallback.email ? ` · ${fallback.email}` : ''}</BrandMeta>
                <BrandMeta><MapPin size={12} /> {displayAddress || fallback.address || fallback.location}</BrandMeta>
              </BrandDetails>
            </BrandLeftWrapper>

            <BrandRightWrapper>
              <DocTitle>Release Record</DocTitle>
              <BarcodeWrapper>
                <Barcode value={formData.admission_number} />
                <FileIdText>
                  File ID:
                  <span>
                    {isLoadingDeceasedList ? 'Loading...' : (formData.admission_number || 'Enter admission number')}
                  </span>
                </FileIdText>
              </BarcodeWrapper>
            </BrandRightWrapper>
          </Letterhead>

          <FormBody>
            <form onSubmit={handleSubmit} noValidate>
              {/* Section 1 */}
              <Section>
                <SectionHead>
                  <SectionNum>01</SectionNum>
                  <SectionTitle>Receiving & Facility Information</SectionTitle>
                </SectionHead>

                <Row>
                  <Col2>
                    <Label>Admission Number <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputFieldWrapper>
                      <InputLg
                        type="text"
                        name="admission_number"
                        value={formData.admission_number}
                        onChange={handleChange}
                        onBlur={handleAdmissionSearch}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAdmissionSearch();
                          }
                        }}
                        placeholder="Enter admission number to search the database"
                        autoComplete="off"
                      />
                      {isSearching ? (
                        <SearchStatus>
                          <SpinIcon>
                            <Loader2 size={14} />
                          </SpinIcon>
                          Searching...
                        </SearchStatus>
                      ) : hasValue(formData.admission_number) && isFound
                        ? (
                          <TickIconWrapper style={{ color: COLORS.green }}>
                            <Check size={16} strokeWidth={2.5} />
                            <span style={{ fontSize: '0.65rem', color: COLORS.success, fontWeight: 700, marginLeft: '0.3rem' }}>Found</span>
                          </TickIconWrapper>
                        ) : !isSearching && hasValue(formData.admission_number) && !isFound && errors.admission_number
                          ? (
                            <SearchStatus style={{ color: COLORS.red }}>
                              <X size={14} /> Not Found
                            </SearchStatus>
                          ) : null}
                    </InputFieldWrapper>
                    {errors.admission_number && <ErrorMessage>{errors.admission_number}</ErrorMessage>}
                  </Col2>
                  <Col>
                    <Label>Date Admitted <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputFieldWrapper>
                      <InputLg
                        type="date"
                        name="date_admitted"
                        value={formData.date_admitted}
                        onChange={handleChange}
                      />
                      {hasValue(formData.date_admitted) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.date_admitted && <ErrorMessage>{errors.date_admitted}</ErrorMessage>}
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Label>Permit Number</Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="permit_number"
                        value={formData.permit_number}
                        onChange={handleChange}
                        placeholder="Permit/Reference Number"
                      />
                      {hasValue(formData.permit_number) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                  <Col>
                    <Label>Released By <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="released_by"
                        value={formData.released_by}
                        onChange={handleChange}
                        placeholder="Name of person releasing the body"
                      />
                      {hasValue(formData.released_by) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.released_by && <ErrorMessage>{errors.released_by}</ErrorMessage>}
                  </Col>
                </Row>
              </Section>

              {/* Section 2 */}
              <Section>
                <SectionHead>
                  <SectionNum>02</SectionNum>
                  <SectionTitle>Deceased Information</SectionTitle>
                </SectionHead>

                <Row>
                  <Col2>
                    <Label>Full Legal Name of Deceased <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputFieldWrapper>
                      <InputLg
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Enter full legal name"
                      />
                      {hasValue(formData.full_name) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.full_name && <ErrorMessage>{errors.full_name}</ErrorMessage>}
                  </Col2>
                  <Col>
                    <Label>Gender <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputFieldWrapper>
                      <Select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </Select>
                      {hasValue(formData.gender) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.gender && <ErrorMessage>{errors.gender}</ErrorMessage>}
                  </Col>
                </Row>

                <Row>
                  <Col05>
                    <Label>Age</Label>
                    <InputFieldWrapper>
                      <Input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Years"
                      />
                      {hasValue(formData.age) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col05>
                  <Col>
                    <Label>Date of Birth</Label>
                    <InputFieldWrapper>
                      <Input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                      />
                      {hasValue(formData.date_of_birth) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                  <Col>
                    <Label>Date of Death</Label>
                    <InputFieldWrapper>
                      <Input
                        type="date"
                        name="date_of_death"
                        value={formData.date_of_death}
                        onChange={handleChange}
                      />
                      {hasValue(formData.date_of_death) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Label>Cause of Death</Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="cause_of_death"
                        value={formData.cause_of_death}
                        onChange={handleChange}
                        placeholder="As certified on medical document"
                      />
                      {hasValue(formData.cause_of_death) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                  <Col>
                    <Label>Place of Death</Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="place_of_death"
                        value={formData.place_of_death}
                        onChange={handleChange}
                        placeholder="Location/Hospital"
                      />
                      {hasValue(formData.place_of_death) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                  <Col>
                    <Label>Body Status</Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="body_status"
                        value={formData.body_status || 'Released'}
                        readOnly
                        disabled
                      />
                      {hasValue(formData.body_status) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                </Row>
              </Section>

              {/* Section 3 */}
              <Section>
                <SectionHead>
                  <SectionNum>03</SectionNum>
                  <SectionTitle>Next of Kin / Authorizing Party</SectionTitle>
                </SectionHead>

                <Row>
                  <Col2>
                    <Label>Next of Kin Full Name <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="next_kin"
                        value={formData.next_kin}
                        onChange={handleChange}
                        placeholder="Full name of authorizing party"
                      />
                      {hasValue(formData.next_kin) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.next_kin && <ErrorMessage>{errors.next_kin}</ErrorMessage>}
                  </Col2>
                  <Col>
                    <Label>Relationship</Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="relationship"
                        value={formData.relationship}
                        onChange={handleChange}
                        placeholder="e.g. Spouse, Child, Sibling"
                      />
                      {hasValue(formData.relationship) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Label>ID Type</Label>
                    <InputFieldWrapper>
                      <Select
                        name="id_type"
                        value={formData.id_type}
                        onChange={handleChange}
                      >
                        <option value="">Select Identification</option>
                        <option value="National ID">National ID</option>
                        <option value="Passport">Passport</option>
                        <option value="Alien Card">Alien Card</option>
                      </Select>
                      {hasValue(formData.id_type) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                  <Col>
                    <Label>ID / Passport Number <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="id_number"
                        value={formData.id_number}
                        onChange={handleChange}
                        placeholder="Identification number"
                      />
                      {hasValue(formData.id_number) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.id_number && <ErrorMessage>{errors.id_number}</ErrorMessage>}
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Label>Primary Telephone <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputFieldWrapper>
                      <Input
                        type="tel"
                        name="tel_number"
                        value={formData.tel_number}
                        onChange={handleChange}
                        placeholder="e.g., 0712345678"
                      />
                      {hasValue(formData.tel_number) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.tel_number && <ErrorMessage>{errors.tel_number}</ErrorMessage>}
                  </Col>
                  <Col2>
                    <Label>Release Notes</Label>
                    <TextArea
                      name="release_notes"
                      value={formData.release_notes}
                      onChange={handleChange}
                      placeholder="Any additional notes about the release..."
                    />
                  </Col2>
                </Row>
              </Section>

              {/* Section 4 */}
              <Section>
                <SectionHead>
                  <SectionNum>04</SectionNum>
                  <SectionTitle>Removal, Transportation & Release Details</SectionTitle>
                </SectionHead>

                <Row>
                  <Col>
                    <Label>Release Date <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputFieldWrapper>
                      <InputLg
                        type="date"
                        name="release_date"
                        value={formData.release_date}
                        onChange={handleChange}
                      />
                      {hasValue(formData.release_date) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.release_date && <ErrorMessage>{errors.release_date}</ErrorMessage>}
                  </Col>
                  <Col>
                    <Label>Date of Removal</Label>
                    <InputFieldWrapper>
                      <Input
                        type="date"
                        name="date_of_removal"
                        value={formData.date_of_removal}
                        onChange={handleChange}
                      />
                      {hasValue(formData.date_of_removal) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                  <Col>
                    <Label>Mode of Transport</Label>
                    <InputFieldWrapper>
                      <Select
                        name="mode_of_transport"
                        value={formData.mode_of_transport}
                        onChange={handleChange}
                      >
                        <option value="hearse">Hearse / Van</option>
                        <option value="air">Air Transport</option>
                        <option value="rail">Rail</option>
                        <option value="private">Private Vehicle</option>
                        <option value="courier">Courier Service</option>
                        <option value="other">Other</option>
                      </Select>
                      {hasValue(formData.mode_of_transport) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                </Row>

                <Row>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="terms_accepted"
                        checked={formData.terms_accepted}
                        onChange={handleChange}
                        style={{ marginTop: '0.2rem', width: '1rem', height: '1rem', accentColor: COLORS.verdigris }}
                      />
                      <span style={{ fontSize: '0.8rem', color: COLORS.gray, lineHeight: '1.5' }}>
                        I hereby authorize the release and transportation of the deceased. I certify that I am the legally authorized next of kin or representative and have the right to make this authorization.
                      </span>
                    </label>
                    {errors.terms_accepted && <ErrorMessage>{errors.terms_accepted}</ErrorMessage>}

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="everything_paid"
                        checked={formData.everything_paid}
                        onChange={handleChange}
                        style={{ marginTop: '0.2rem', width: '1rem', height: '1rem', accentColor: COLORS.verdigris }}
                      />
                      <span style={{ fontSize: '0.8rem', color: COLORS.gray, lineHeight: '1.5' }}>
                        I confirm that all outstanding charges and payments have been settled.
                      </span>
                    </label>
                  </div>
                </Row>
              </Section>

              {/* Section 5 */}
              <Section>
                <SectionHead>
                  <SectionNum>05</SectionNum>
                  <SectionTitle>Verification & Digital Sign-off</SectionTitle>
                </SectionHead>

                <SignOffContainer>
                  <SignOffGrid>
                    <GridSig>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Label>Authorizing Signature <span style={{ color: COLORS.red }}>*</span></Label>
                        <ClearSigButton type="button" onClick={() => sigPadRef1.current?.clear()}>
                          Clear Pad
                        </ClearSigButton>
                      </div>
                      <SigCanvasWrap>
                        <ReusableSignaturePad ref={sigPadRef1} penColor={COLORS.inkBlue} />
                        <SigGuideText>Sign within boundaries</SigGuideText>
                      </SigCanvasWrap>
                      {errors.signature && <ErrorMessage>{errors.signature}</ErrorMessage>}
                    </GridSig>

                    <GridRight>
                      <GridName>
                        <Label>Released By Officer</Label>
                        <InputFieldWrapper>
                          <Input
                            type="text"
                            name="released_by"
                            value={formData.released_by}
                            onChange={handleChange}
                            placeholder="Officer full name"
                          />
                          {hasValue(formData.released_by) && (
                            <TickIconWrapper>
                              <Check size={16} strokeWidth={2.5} />
                            </TickIconWrapper>
                          )}
                        </InputFieldWrapper>
                      </GridName>

                      <GridDate>
                        <Label>Verified By System User</Label>
                        <InputFieldWrapper>
                          <Input
                            type="text"
                            name="verified_by"
                            value={formData.verified_by}
                            onChange={handleChange}
                            readOnly
                            disabled
                          />
                          {hasValue(formData.verified_by) && (
                            <TickIconWrapper>
                              <Check size={16} strokeWidth={2.5} />
                            </TickIconWrapper>
                          )}
                        </InputFieldWrapper>
                      </GridDate>

                      <StampWrapper>
                        <OfficialStamp
                          tenantName={tenantName}
                          tenantPhone={displayPhone || fallback.phone}
                          tenantLocation={displayLocation || fallback.location}
                          recordLabel="OFFICIAL RELEASE RECORD"
                        />
                      </StampWrapper>
                    </GridRight>
                  </SignOffGrid>
                </SignOffContainer>
              </Section>

              {/* Three Action Buttons */}
              <ActionsContainer>
                <ClearSigButton type="button" onClick={handleClear} style={{ marginRight: 'auto' }}>
                  <RotateCcw size={14} style={{ marginRight: '4px' }} /> Clear Form
                </ClearSigButton>

                <GoldButton type="button" onClick={handleClear} disabled={isSubmitting}>
                  Reset Inputs
                </GoldButton>

                <BlackButton type="button" onClick={() => navigate(-1)} disabled={isSubmitting}>
                  Cancel / Back
                </BlackButton>

                <PrimaryButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting Release...
                    </>
                  ) : (
                    <>
                      Submit Release <ArrowRight size={16} />
                    </>
                  )}
                </PrimaryButton>
              </ActionsContainer>
            </form>
          </FormBody>

          {/* Footer Component */}
          <FooterPanel>
            <FooterText>
              {tenantName} Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}<br />
              - Official Release Record —
            </FooterText>

            <BarcodeWrapper>
              <Barcode value={formData.admission_number} />
              <FileIdText>
                File ID:
                <span>
                  {isLoadingDeceasedList ? 'Loading...' : (formData.admission_number || 'Enter admission number')}
                </span>
              </FileIdText>
            </BarcodeWrapper>
          </FooterPanel>
        </ContentWrapper>
      </FormSheet>
    </Container>
  );
};

export default DeceasedReleaseForm;

