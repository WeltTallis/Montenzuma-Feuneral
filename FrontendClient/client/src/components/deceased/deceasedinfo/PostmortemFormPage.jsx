import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getTenantSlug, getAuthToken } from '../../../utils/globalAuth';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { showToast } from '../../../utils/toast';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';

const API_GATEWAY_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const BASE_URL = `${API_GATEWAY_URL}`;

// ─── Design Tokens (matches deceasedIntake) ──────────────────────────
const COLORS = {
  ink: '#03071E',
  bone: '#FAF8F4',
  bone2: '#F3EFE6',
  brass: '#8B7355',
  brassLight: '#A98F6E',
  verdigris: '#3D4F47',
  verdigrisDark: '#2E3F37',
  verdigrisLight: '#4D6359',
  verdigrisTint: '#EBEFEF',
  line: '#E3DDD0',
  gray: '#6B6862',
  red: '#9B4A3F',
  redBg: '#F7ECE9',
  redLine: '#E8D2CC',
  success: '#475A43',
  successBg: '#EEF3EC',
  white: '#FFFFFF',
};

const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`;

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${COLORS.bone2};
  font-family: 'Saira', sans-serif;
  color: ${COLORS.ink};
  font-size: 15px;
  line-height: 1.5;
  padding: 0;
  animation: ${fadeIn} 0.3s ease-out;
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  background: ${COLORS.white};
  position: relative;
  overflow: hidden;

  /* Sheet watermark, like the intake form */
  &::before {
    content: 'POSTMORTEM';
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
    letter-spacing: 0.2em;
    text-transform: uppercase;
    z-index: 0;
  }

  > * { position: relative; z-index: 1; }
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem 3rem;
  border-bottom: 1px solid ${COLORS.line};
  background: ${COLORS.white};
  position: relative;
  flex-wrap: wrap;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${COLORS.verdigris} 0%, ${COLORS.brass} 50%, ${COLORS.verdigris} 100%);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
  }
`;

const HeaderBrand = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${COLORS.verdigris};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 6px;

  &::before {
    content: '';
    width: 8px;
    height: 4px;
    background: ${COLORS.brass};
    display: inline-block;
  }
`;

const HeaderTitle = styled.div`
  font-family: 'Fraunces', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: ${COLORS.ink};
  letter-spacing: -0.02em;
  line-height: 1.1;
  text-transform: uppercase;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const HeaderSubtitle = styled.div`
  font-size: 0.8rem;
  color: ${COLORS.gray};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.2rem;
  font-weight: 500;
`;

const HeaderRight = styled.div`
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;

  @media (max-width: 768px) {
    align-items: flex-start;
    text-align: left;
  }
`;

const HeaderMeta = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${COLORS.ink};
  letter-spacing: 0.05em;

  span.label {
    display: block;
    font-weight: 400;
    color: ${COLORS.gray};
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 2px;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  background: ${props => props.$status === 'completed' ? COLORS.successBg : COLORS.redBg};
  color: ${props => props.$status === 'completed' ? COLORS.success : COLORS.red};
  padding: 4px 10px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 1px solid ${props => props.$status === 'completed' ? '#D5E0D3' : COLORS.redLine};
`;

const Section = styled.div`
  margin-bottom: 4rem;
  padding: 0 3rem;

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 3rem;
  }

  @media (max-width: 768px) {
    padding: 0 1.5rem;
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
  color: rgba(250, 248, 244, 0.4);
  font-family: 'JetBrains Mono', monospace;
`;

const SectionTitle = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${COLORS.bone};
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
  flex: ${props => props.$flex || 1};
  min-width: 0;

  @media (max-width: 1024px) {
    flex: 1 1 45%;
    min-width: 200px;
  }
  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`;

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

const Input = styled.input`
  width: 100%;
  height: 2.75rem;
  border: none;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 0 0.5rem 0 0;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  color: ${props => props.$readonly ? COLORS.gray : COLORS.ink};
  transition: border-color 0.2s ease;
  cursor: ${props => props.$readonly ? 'not-allowed' : 'text'};
  box-sizing: border-box;

  &:focus {
    border: none;
    border-bottom: 1px solid ${COLORS.ink};
    outline: none;
    box-shadow: none;
    background: transparent;
  }

  &:hover { border-bottom: 1px solid ${COLORS.ink}; }

  &::placeholder { color: #a8a29e; font-weight: 400; }
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
  padding: 0 0.5rem 0 0;
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

  &:hover { border-bottom: 1px solid ${COLORS.ink}; }
`;

const TextArea = styled.textarea`
  width: 100%;
  border: none;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 0.5rem 0.5rem 0 0;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  color: ${COLORS.ink};
  transition: border-color 0.2s ease;
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
  box-sizing: border-box;

  &:focus {
    border: none;
    border-bottom: 1px solid ${COLORS.ink};
    outline: none;
    box-shadow: none;
    background: transparent;
  }

  &:hover { border-bottom: 1px solid ${COLORS.ink}; }

  &::placeholder { color: #a8a29e; font-weight: 400; }
`;

const FindingItem = styled.div`
  border: 1px solid ${COLORS.line};
  background: ${COLORS.bone};
  padding: 16px;
  border-radius: 4px;
  position: relative;
  margin-bottom: 16px;
`;

const RemoveFindingBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: ${COLORS.gray};
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  padding: 4px 8px;
  transition: color 0.2s;

  &:hover { color: ${COLORS.red}; }
`;

const AddFindingBtn = styled.button`
  background: transparent;
  border: 1.5px dashed ${COLORS.brassLight};
  color: ${COLORS.brass};
  padding: 12px;
  width: 100%;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    border-color: ${COLORS.verdigris};
    color: ${COLORS.verdigris};
    background: ${COLORS.verdigrisTint};
  }
`;

const SignatureWrapper = styled.div`
  position: relative;
  border: none;
  border-bottom: 2px solid ${COLORS.ink};
  background: ${COLORS.bone};
  box-shadow: inset 0 1px 2px rgba(21, 23, 26, 0.03);
`;

const SignatureCanvas = styled.canvas`
  width: 100%;
  height: 180px;
  cursor: crosshair;
  display: block;
  touch-action: none;
`;

const SigActions = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  background: ${COLORS.white};
  border-top: 1px solid ${COLORS.line};
`;

const ClearSigBtn = styled.button`
  background: transparent;
  border: 1px solid ${COLORS.line};
  padding: 6px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.65rem;
  cursor: pointer;
  border-radius: 4px;
  color: ${COLORS.gray};
  transition: all 0.2s;

  &:hover {
    border-color: ${COLORS.verdigris};
    color: ${COLORS.verdigris};
    background: ${COLORS.verdigrisTint};
  }
`;

const FormActions = styled.div`
  margin-top: 40px;
  padding: 24px 3rem;
  border-top: 1px solid ${COLORS.line};
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  @media (max-width: 768px) {
    padding: 24px 1.5rem;
    flex-direction: column-reverse;

    > button { width: 100%; }
  }
`;

const SubmitBtn = styled.button`
  background: ${COLORS.verdigrisDark};
  color: ${COLORS.bone};
  border: none;
  padding: 14px 40px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    background: ${COLORS.verdigris};
    transform: translateY(-1px);
  }

  &:disabled {
    background: ${COLORS.gray};
    cursor: not-allowed;
    transform: none;
  }
`;

const CancelBtn = styled.button`
  background: transparent;
  color: ${COLORS.gray};
  border: 1px solid ${COLORS.line};
  padding: 14px 40px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    border-color: ${COLORS.ink};
    color: ${COLORS.ink};
  }
`;

const LoadingOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: ${COLORS.gray};
  font-size: 14px;
  gap: 12px;
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${COLORS.line};
  border-top-color: ${COLORS.verdigrisDark};
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// ─── Component ───────────────────────────────────────────────────────
const PostmortemFormPage = () => {
  const { deceased_id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [painting, setPainting] = useState(false);

  // Deceased & Request Info
  const [deceasedInfo, setDeceasedInfo] = useState(null);
  const [postmortemRequest, setPostmortemRequest] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    pathologist_name: '',
    external_pathologist_name: '',
    external_pathologist_mobile: '',
    external_pathologist_id: '',
    examination_summary: '',
    cause_of_death: '',
    immediate_cause_of_death: '',
    underlying_cause_of_death: '',
    contributing_conditions: '',
    manner_of_death: '',
    requesting_authority: '',
    custom_findings: '',
    staff_username: '',
    mortuary_name: '',
  });

  // Dynamic Findings - start empty, user adds only what they need
  const [findings, setFindings] = useState([]);

  // ─── Initialize ──────────────────────────────────────────────────
  useEffect(() => {
    const now = new Date();
    setCurrentDateTime(now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }));
    // Generate tracking number immediately
    const tracking = `REQ-${deceased_id}-${Date.now().toString(36).toUpperCase()}`;
    setTrackingNumber(tracking);
    loadData();
  }, [deceased_id]);

  // ─── Load Deceased & Postmortem Request Data ─────────────────────
  const loadData = async () => {
    if (!deceased_id) return;
    setLoading(true);
    try {
      const tenantSlug = getTenantSlug();

      const token = getAuthToken();
      const baseHeaders = {
        'x-tenant-slug': tenantSlug,
        'Authorization': `Bearer ${token}`,
      };

      // 1. Fetch deceased info
      const deceasedRes = await axios.get(
        `${BASE_URL}/deceased/${deceased_id}`,
        { headers: baseHeaders }
      );
      if (deceasedRes.data?.success && deceasedRes.data?.data) {
        setDeceasedInfo(deceasedRes.data.data);
      }

      // 2. Fetch postmortem request to get tracking number
      const postmortemRes = await axios.get(
        `${BASE_URL}/deceased/postmortem/${deceased_id}`,
        { headers: baseHeaders }
      );
      if (postmortemRes.data?.success && postmortemRes.data?.data) {
        const pmData = postmortemRes.data.data;
        setPostmortemRequest(pmData);

        // Update tracking number if existing request has one
        if (pmData.request_id || pmData.tracking_number) {
          const tracking = pmData.request_id || pmData.tracking_number;
          setTrackingNumber(tracking);
        }

        // Pre-populate form with existing data if any
        if (pmData.pathologist_name) setFormData(prev => ({ ...prev, pathologist_name: pmData.pathologist_name }));
        if (pmData.external_pathologist_name) setFormData(prev => ({ ...prev, external_pathologist_name: pmData.external_pathologist_name }));
        if (pmData.external_pathologist_mobile) setFormData(prev => ({ ...prev, external_pathologist_mobile: pmData.external_pathologist_mobile }));
        if (pmData.external_pathologist_id) setFormData(prev => ({ ...prev, external_pathologist_id: pmData.external_pathologist_id }));
        if (pmData.examination_summary) setFormData(prev => ({ ...prev, examination_summary: pmData.examination_summary }));
        if (pmData.cause_of_death) setFormData(prev => ({ ...prev, cause_of_death: pmData.cause_of_death }));
        if (pmData.immediate_cause_of_death) setFormData(prev => ({ ...prev, immediate_cause_of_death: pmData.immediate_cause_of_death }));
        if (pmData.underlying_cause_of_death) setFormData(prev => ({ ...prev, underlying_cause_of_death: pmData.underlying_cause_of_death }));
        if (pmData.contributing_conditions) setFormData(prev => ({ ...prev, contributing_conditions: pmData.contributing_conditions }));
        if (pmData.manner_of_death) setFormData(prev => ({ ...prev, manner_of_death: pmData.manner_of_death }));
        if (pmData.requesting_authority) setFormData(prev => ({ ...prev, requesting_authority: pmData.requesting_authority }));
        if (pmData.custom_findings) setFormData(prev => ({ ...prev, custom_findings: pmData.custom_findings }));
        if (pmData.staff_username) setFormData(prev => ({ ...prev, staff_username: pmData.staff_username }));
        if (pmData.mortuary_name) setFormData(prev => ({ ...prev, mortuary_name: pmData.mortuary_name }));

        // Pre-populate dynamic findings if they exist
        if (pmData.findings && Array.isArray(pmData.findings) && pmData.findings.length > 0) {
          setFindings(pmData.findings);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // If no postmortem request exists, still allow form with just deceased info
      if (error.response?.status !== 404) {
        showToast.error('Failed to load deceased information');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Signature Pad ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let isPainting = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000080';
    };

    resize();
    window.addEventListener('resize', resize);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const start = (e) => {
      e.preventDefault();
      isPainting = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const move = (e) => {
      e.preventDefault();
      if (!isPainting) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const end = () => {
      isPainting = false;
      ctx.beginPath();
    };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchmove', move);
    canvas.addEventListener('touchend', end);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mouseup', end);
      canvas.removeEventListener('mouseleave', end);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', end);
    };
  }, [loading]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getSignatureData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const pixelData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    const isBlank = !pixelData.some((channel, index) => index % 4 !== 3 && channel !== 0);
    if (isBlank) return null;
    return canvas.toDataURL('image/png');
  };

  // ─── Form Handlers ───────────────────────────────────────────────
  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleFindingChange = (index, field) => (e) => {
    const updated = [...findings];
    updated[index] = { ...updated[index], [field]: e.target.value };
    setFindings(updated);
  };

  const addFinding = () => {
    setFindings(prev => [...prev, { title: '', description: '' }]);
  };

  const removeFinding = (index) => {
    if (findings.length <= 1) return;
    setFindings(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const tenantSlug = getTenantSlug();

      // Get user email from localStorage
      let updatedBy = '';
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        updatedBy = user.email || user.username || '';
      } catch (err) {
        // ignore
      }

      // Build payload
      const payload = {
        deceased_id,
        ...formData,
        findings: findings.filter(f => f.title || f.description),
        custom_findings: formData.custom_findings || null,
        status: 'completed',
        updated_by: updatedBy,
      };

      // Add signature if present
      const sigData = getSignatureData();
      if (sigData) {
        payload.signature_base64 = sigData;
      }

      const token = getAuthToken();
      const response = await axios.post(
        `${BASE_URL}/deceased/postmortem/save`,
        payload,
        { headers: { 'x-tenant-slug': tenantSlug, 'Authorization': `Bearer ${token}` } }
      );

      if (response.data?.success) {
        showToast.success('Examination record saved successfully! Status set to COMPLETED.');
        // Auto-open PDF after short delay
        setTimeout(() => {
          window.open(`${BASE_URL}/deceased/postmortem/${deceased_id}/pdf`, '_blank');
        }, 800);
        // Navigate back to deceased detail page
        setTimeout(() => {
          const slug = getTenantSlug();
          navigate(`/tenant/${slug}/deceased/${deceased_id}`);
        }, 1500);
      } else {
        showToast.error(response.data?.message || 'Failed to save record');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showToast.error(error.response?.data?.message || 'Network error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageWrapper>
        <FormContainer>
          <LoadingOverlay>
            <Spinner />
            Loading deceased information...
          </LoadingOverlay>
        </FormContainer>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <ToastContainer position="top-right" />
      <FormContainer>
        {/* ─── HEADER ─────────────────────────────────────────────── */}
        <FormHeader>
          <div>
            <HeaderBrand>RestPoint Mortuary</HeaderBrand>
            <HeaderTitle>Examination Report</HeaderTitle>
            <HeaderSubtitle>Department of Forensics</HeaderSubtitle>
          </div>
          <HeaderRight>
            <HeaderMeta>
              <span className="label">Tracking Number</span>
              {trackingNumber || 'Generating...'}
            </HeaderMeta>
            <HeaderMeta>
              <span className="label">Date & Time</span>
              {currentDateTime}
            </HeaderMeta>
            <HeaderMeta>
              <span className="label">Status</span>
              <StatusBadge $status={postmortemRequest?.status === 'completed' ? 'completed' : 'pending'}>
                {postmortemRequest?.status === 'completed' ? 'Completed' : 'Pending'}
              </StatusBadge>
            </HeaderMeta>
          </HeaderRight>
        </FormHeader>

        <form onSubmit={handleSubmit}>
          {/* ─── SECTION 1: Case & Decedent Info ──────────────────── */}
          <Section>
            <SectionHead>
              <SectionNum>01</SectionNum>
              <SectionTitle>Case & Decedent Information</SectionTitle>
            </SectionHead>
            <Row>
              <Col>
                <Label>Deceased ID</Label>
                <Input type="text" value={deceased_id || ''} $readonly readOnly />
              </Col>
              <Col>
                <Label>Deceased Name</Label>
                <Input
                  type="text"
                  value={deceasedInfo?.full_name || 'Loading...'}
                  $readonly
                  readOnly
                />
              </Col>
              <Col>
                <Label>Admission No.</Label>
                <Input
                  type="text"
                  value={deceasedInfo?.admission_number || deceasedInfo?.admission_no || 'N/A'}
                  $readonly
                  readOnly
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Label>Requesting Authority</Label>
                <Input
                  type="text"
                  value={formData.requesting_authority}
                  onChange={handleInputChange('requesting_authority')}
                  placeholder="e.g., Metropolitan Police Dept"
                />
              </Col>
              <Col>
                <Label>Date of Death</Label>
                <Input
                  type="text"
                  value={deceasedInfo?.date_of_death ? new Date(deceasedInfo.date_of_death).toLocaleDateString() : 'N/A'}
                  $readonly
                  readOnly
                />
              </Col>
            </Row>
          </Section>

          {/* ─── SECTION 2: Pathologist Info ──────────────────────── */}
          <Section>
            <SectionHead>
              <SectionNum>02</SectionNum>
              <SectionTitle>Examining Pathologist</SectionTitle>
            </SectionHead>
            <Row>
              <Col>
                <Label>Internal Pathologist (Staff)</Label>
                <Input
                  type="text"
                  value={formData.pathologist_name}
                  onChange={handleInputChange('pathologist_name')}
                  placeholder="Dr. John Doe"
                />
              </Col>
            </Row>
            <Row>
              <Col $flex={2}>
                <Label>External Pathologist Name</Label>
                <Input
                  type="text"
                  value={formData.external_pathologist_name}
                  onChange={handleInputChange('external_pathologist_name')}
                  placeholder="Leave blank if internal"
                />
              </Col>
              <Col $flex={2}>
                <Label>External Pathologist Mobile</Label>
                <Input
                  type="text"
                  value={formData.external_pathologist_mobile}
                  onChange={handleInputChange('external_pathologist_mobile')}
                  placeholder="(XXX) XXX-XXXX"
                />
              </Col>
            </Row>
            <Row>
              <Col $flex={2}>
                <Label>External Pathologist ID / License</Label>
                <Input
                  type="text"
                  value={formData.external_pathologist_id}
                  onChange={handleInputChange('external_pathologist_id')}
                  placeholder="License or professional ID"
                />
              </Col>
            </Row>
          </Section>

          {/* ─── SECTION 3: Cause of Death ────────────────────────── */}
          <Section>
            <SectionHead>
              <SectionNum>03</SectionNum>
              <SectionTitle>Official Determination of Death</SectionTitle>
            </SectionHead>
            <Row>
              <Col>
                <Label>Immediate Cause of Death</Label>
                <Input
                  type="text"
                  value={formData.immediate_cause_of_death}
                  onChange={handleInputChange('immediate_cause_of_death')}
                  placeholder="The final disease, injury, or complication resulting in death"
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Label>Underlying Cause of Death</Label>
                <Input
                  type="text"
                  value={formData.underlying_cause_of_death}
                  onChange={handleInputChange('underlying_cause_of_death')}
                  placeholder="The disease or injury that initiated the chain of events"
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Label>Contributing Conditions</Label>
                <Input
                  type="text"
                  value={formData.contributing_conditions}
                  onChange={handleInputChange('contributing_conditions')}
                  placeholder="Other significant conditions contributing to death"
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Label>Manner of Death</Label>
                <Select
                  value={formData.manner_of_death}
                  onChange={handleInputChange('manner_of_death')}
                >
                  <option value="">Select manner of death</option>
                  <option value="Natural">Natural</option>
                  <option value="Accident">Accident</option>
                  <option value="Suicide">Suicide</option>
                  <option value="Homicide">Homicide</option>
                  <option value="Undetermined">Undetermined</option>
                </Select>
              </Col>
            </Row>
          </Section>

          {/* ─── SECTION 4: Examination Summary & Findings ────────── */}
          <Section>
            <SectionHead>
              <SectionNum>04</SectionNum>
              <SectionTitle>Examination Summary & Findings</SectionTitle>
            </SectionHead>

            <Row>
              <Col>
                <Label>Examination Summary / Pathologist Statement</Label>
                <TextArea
                  value={formData.examination_summary}
                  onChange={handleInputChange('examination_summary')}
                  placeholder="Provide a clear, narrative summary of the autopsy findings, correlating external and internal examination, histology, and investigative history."
                  rows={5}
                />
              </Col>
            </Row>

            {/* Dynamic Findings - user adds organ/trauma findings as needed */}
            <Row style={{ marginBottom: '12px' }}>
              <Col>
                <Label>Additional Specific Findings (Organ Systems / Trauma)</Label>
              </Col>
            </Row>

            {findings.map((finding, index) => (
              <FindingItem key={index}>
                {findings.length > 1 && (
                  <RemoveFindingBtn type="button" onClick={() => removeFinding(index)}>
                    &times;
                  </RemoveFindingBtn>
                )}
                <Row>
                  <Col $flex={3}>
                    <Label>Finding Title / Organ System</Label>
                    <Input
                      type="text"
                      value={finding.title}
                      onChange={handleFindingChange(index, 'title')}
                      placeholder="e.g., Cardiovascular System"
                    />
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Label>Description / Details</Label>
                    <TextArea
                      value={finding.description}
                      onChange={handleFindingChange(index, 'description')}
                      placeholder="Describe specific findings, weights, abnormalities, etc."
                      rows={3}
                    />
                  </Col>
                </Row>
              </FindingItem>
            ))}

            <AddFindingBtn type="button" onClick={addFinding}>
              + Add Finding Section
            </AddFindingBtn>
          </Section>

          {/* ─── SECTION 5: Signature ─────────────────────────────── */}
          <Section>
            <SectionHead>
              <SectionNum>05</SectionNum>
              <SectionTitle>Examiner Signature</SectionTitle>
            </SectionHead>
            <Row>
              <Col>
                <Label>Draw Signature Below</Label>
                <SignatureWrapper>
                  <SignatureCanvas ref={canvasRef} />
                  <SigActions>
                    <ClearSigBtn type="button" onClick={clearSignature}>
                      Clear Signature
                    </ClearSigBtn>
                  </SigActions>
                </SignatureWrapper>
              </Col>
            </Row>
          </Section>

          {/* ─── ACTIONS ──────────────────────────────────────────── */}
          <FormActions>
            <CancelBtn type="button" onClick={() => navigate(-1)}>
              Cancel
            </CancelBtn>
            <SubmitBtn type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Saving...
                </>
              ) : (
                'Save Examination Record'
              )}
            </SubmitBtn>
          </FormActions>
        </form>
      </FormContainer>
    </PageWrapper>
  );
};

export default PostmortemFormPage;