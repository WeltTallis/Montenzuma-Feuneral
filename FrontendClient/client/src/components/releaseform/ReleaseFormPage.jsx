import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import bwipjs from '@bwip-js/browser';
import {
  Check, Loader2, CheckCircle, X, FileText, User, RotateCcw, ShieldCheck, AlertCircle,
  ArrowRight, Calendar, Clock, Phone, IdCard, Search, MapPin
} from '../../utils/icons/icons';
import styled from 'styled-components';
import { useTenantStore } from '../../modules/seo/useTenantStore';
import OfficialStamp, { StampWrapper } from '../stamp/stamp';
import { resolveTenantBranding } from '../../utils/tenantResolver/tenantBranding';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import { todayKey } from '../../utils/dates/parseDates';

const ReusableSignaturePad = React.lazy(() => import('../../utils/signature/signaturepad'));

const COLORS = {
  ink: '#15171A',
  white: '#FFFFFF',
  gray: '#6B6862',
  grayLight: '#F5F5F5',
  border: '#E5E5E5',
  primary: '#1a1a1a',
  red: '#dc2626',
  success: '#16a34a',
};

const Container = styled.div`
  min-height: 100vh;
  background: ${COLORS.white};
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
  max-width: 900px;
  margin: 0 auto;
  background: ${COLORS.white};
  border-radius: 0;
  box-shadow: none;
  border: none;
  overflow: hidden;
  position: relative;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
`;


const Letterhead = styled.div`
  padding: 2rem 3rem;
  border-bottom: 2px solid ${COLORS.border};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  background: ${COLORS.white};

  @media (max-width: 768px) {
    padding: 1.5rem;
    flex-direction: column;
    gap: 1rem;
  }
`;

const LogoBox = styled.div`
  width: 48px;
  height: 48px;
  background: ${COLORS.ink};
  color: ${COLORS.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Fraunces', serif;
  font-size: 2rem;
  font-weight: 700;
  border-radius: 8px;
  flex-shrink: 0;
`;

const BrandDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const BrandName = styled.h1`
  font-family: 'Fraunces', serif;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: ${COLORS.ink};
  line-height: 1.1;
`;

const BrandMeta = styled.div`
  font-size: 0.85rem;
  color: ${COLORS.gray};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-weight: 500;

  svg {
    opacity: 0.85;
    flex-shrink: 0;
    color: ${COLORS.gray};
  }
`;

const BrandRight = styled.div`
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;

  @media (max-width: 768px) {
    text-align: left;
    width: 100%;
    align-items: flex-start;
  }
`;

const DocTitle = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${COLORS.ink};
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    width: 8px;
    height: 4px;
    background: ${COLORS.ink};
    display: inline-block;
  }
`;

const ReleaseIdBlock = styled.div`
  color: ${COLORS.gray};
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
`;

const ReleaseIdLabel = styled.div`
  color: ${COLORS.gray};
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
`;

const ReleaseIdValue = styled.div`
  color: ${COLORS.ink};
  font-weight: 600;
  font-size: 0.85rem;
`;

const TopMeta = styled.div`
  color: ${COLORS.gray};
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TopMetaItem = styled.div`
  color: ${COLORS.gray};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
`;

const TopMetaLabel = styled.div`
  color: ${COLORS.gray};
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
`;

const TopMetaValue = styled.div`
  color: ${COLORS.ink};
  font-weight: 500;
`;

const BarcodeWrapper = styled.div`
  color: ${COLORS.gray};
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
  padding: 3rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const Section = styled.div`
  margin-bottom: 3rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background: ${COLORS.ink};
  border-radius: 4px;
`;

const SectionNum = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255,255,255,0.5);
  font-family: 'JetBrains Mono', monospace;
`;

const SectionTitle = styled.h2`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${COLORS.white};
  margin: 0;
`;

const Row = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.25rem;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 1024px) {
    flex-wrap: wrap;
  }
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
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

const Col2 = styled(Col)`
  flex: 2;

  @media (max-width: 1024px) {
    flex: 1 1 100%;
  }
`;

const Col05 = styled(Col)`
  flex: 0.5;

  @media (max-width: 1024px) {
    flex: 1 1 30%;
    min-width: 120px;
  }
`;

const Col06 = styled(Col)`
  flex: 0.6;

  @media (max-width: 1024px) {
    flex: 1 1 30%;
    min-width: 140px;
  }
`;

const Col04 = styled(Col)`
  flex: 0.4;

  @media (max-width: 1024px) {
    flex: 1 1 30%;
    min-width: 120px;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${COLORS.gray};
  margin-bottom: 0.5rem;
  font-family: 'Saira', sans-serif;
`;

const Input = styled.input`
  width: 100%;
  height: 2.75rem;
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  padding: 0 0.85rem;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  color: ${COLORS.ink};
  background: ${COLORS.white};
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${COLORS.ink};
    box-shadow: 0 0 0 2px rgba(21, 23, 26, 0.08);
  }

  &:disabled {
    background: ${COLORS.grayLight};
    color: ${COLORS.gray};
    cursor: not-allowed;
    opacity: 0.7;
  }

  &::placeholder {
    color: #a8a29e;
    font-weight: 400;
  }
`;

const InputLg = styled(Input)`
  height: 3rem;
  font-size: 1.05rem;
  font-weight: 500;
`;

const Select = styled.select`
  width: 100%;
  height: 2.75rem;
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  padding: 0 0.85rem;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  color: ${COLORS.ink};
  background: ${COLORS.white};
  transition: all 0.2s ease;
  box-sizing: border-box;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${COLORS.ink};
    box-shadow: 0 0 0 2px rgba(21, 23, 26, 0.08);
  }

  &:disabled {
    background: ${COLORS.grayLight};
    color: ${COLORS.gray};
    cursor: not-allowed;
  }
`;

const CheckGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 2rem;
  padding: 1rem 1.25rem;
  background: ${COLORS.grayLight};
  border: 1px solid ${COLORS.border};
  border-radius: 4px;

  @media (max-width: 768px) {
    gap: 0.75rem 1.5rem;
  }
`;

const CheckItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: ${COLORS.ink};
  cursor: pointer;
  font-weight: 400;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  width: 1.1rem;
  height: 1.1rem;
  border: 1px solid ${COLORS.gray};
  background: ${COLORS.white};
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  border-radius: 2px;
  transition: all 0.2s;

  &:checked {
    background: ${COLORS.ink};
    border-color: ${COLORS.ink};
  }

  &:checked::after {
    content: '';
    position: absolute;
    top: 0.1rem;
    left: 0.3rem;
    width: 0.3rem;
    height: 0.6rem;
    border: solid ${COLORS.white};
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`;

const Radio = styled.input.attrs({ type: 'radio' })`
  appearance: none;
  width: 1.1rem;
  height: 1.1rem;
  border: 1px solid ${COLORS.gray};
  background: ${COLORS.white};
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  border-radius: 50%;

  &:checked {
    border-color: ${COLORS.ink};
  }

  &:checked::after {
    content: '';
    position: absolute;
    top: 0.1875rem;
    left: 0.1875rem;
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: ${COLORS.ink};
  }
`;

const HighlightRow = styled.div`
  background: ${COLORS.grayLight};
  padding: 1.5rem;
  border-radius: 4px;
  border: 1px solid ${COLORS.border};
  margin-bottom: 1.5rem;
`;

const LegalBlock = styled.div`
  padding: 1.5rem;
  background: ${COLORS.grayLight};
  border: 1px solid ${COLORS.border};
  border-left: 4px solid ${COLORS.ink};
  border-radius: 0 4px 4px 0;
  margin-bottom: 2rem;
`;

const LegalText = styled.p`
  font-size: 0.875rem;
  line-height: 1.7;
  color: ${COLORS.gray};
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }

  strong {
    color: ${COLORS.ink};
    font-weight: 600;
  }
`;

const SigCanvasWrap = styled.div`
  border: 1px solid ${COLORS.border};
  border-bottom: 2px solid ${COLORS.ink};
  border-radius: 4px 4px 0 0;
  height: 10rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.white};
  cursor: crosshair;
  position: relative;
  margin-bottom: 0.5rem;
  overflow: hidden;
  width: 100%;

  & > canvas {
    width: 100% !important;
    height: 100% !important;
    touch-action: none;
  }

  @media (max-width: 768px) {
    height: 12rem;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid ${COLORS.border};
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }
`;

const PrimaryButton = styled.button`
  background: ${COLORS.ink};
  color: ${COLORS.white};
  border: none;
  padding: 0.85rem 2rem;
  border-radius: 4px;
  font-family: 'Saira', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  background: ${COLORS.white};
  color: ${COLORS.ink};
  border: 1px solid ${COLORS.border};
  padding: 0.85rem 2rem;
  border-radius: 4px;
  font-family: 'Saira', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${COLORS.grayLight};
    border-color: ${COLORS.ink};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${COLORS.border};
  margin: 2rem 0;
`;

const FlexRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

function ReleaseFormPage() {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = useTenantStore((s) => s.isAdmin);
  const { branding } = resolveTenantBranding();
  const [formData, setFormData] = useState({
    releasedTo: '',
    relationship: '',
    phoneNumber: '',
    idNumber: '',
    facilityName: '',
    releasedBy: '',
    dateReleased: '',
    timeReleased: '',
    destinationType: 'funeral_home',
    receivingFuneralHome: '',
    cityState: '',
    transportBy: '',
    driverName: '',
    additionalWitnesses: '',
    authorizationScope: 'transport_only',
    cremationAuthorized: false,
    embalmingAuthorized: false,
    finalDisposition: '',
    additionalNotes: '',
    termsAccepted: false,
    everythingPaid: true,
  });
  const [deceasedData, setDeceasedData] = useState(null);
  const [postmortemData, setPostmortemData] = useState(null);
  const [signature, setSignature] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [releaseId, setReleaseId] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [loadingDeceased, setLoadingDeceased] = useState(true);
  const [viewMode, setViewMode] = useState(false);
  const [lookupAdmissionNumber, setLookupAdmissionNumber] = useState('');
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const isNewMode = !id || id === 'new' || id === 'undefined';

  // If the route is for creating a new release, render the dedicated Deceased Release component
  // that matches the intake page styles. This lets the receptionist portal use the updated UI.
  if (isNewMode) {
    const DeceasedReleaseForm = React.lazy(() => import('../deceased/register/deceasedRelease'));
    return (
      <Suspense fallback={<Container style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Loader2 size={48} /></Container>}>
        <DeceasedReleaseForm />
      </Suspense>
    );
  }


  useEffect(() => {
    if (location.state?.viewMode) {
      setViewMode(true);
    }
  }, [location]);

  useEffect(() => {
    if (slug) {
      localStorage.setItem('tenantSlug', slug);
    }
  }, [slug]);

  useEffect(() => {
    const fetchDeceasedData = async () => {
      try {
        if (!id || isNewMode) {
          setLoadingDeceased(false);
          return;
        }
        const res = await api.get(ENDPOINTS.DECEASED.DETAIL(id));
        const data = res.data?.data || res.data;
        setDeceasedData(data);
        setAdmissionNumber(data?.admission_number || '');
        setFormData((prev) => ({
          ...prev,
          idNumber: data?.national_id || prev.idNumber,
          phoneNumber: data?.phone_number || prev.phoneNumber,
          facilityName: data?.receiving_officer || prev.facilityName,
        }));
        if (data?.postmortem_record) {
          setPostmortemData(data.postmortem_record);
        }
      } catch (err) {
        console.error('Error fetching deceased:', err);
        // Don't block the form - let the user look up by admission number instead
        setLoadingDeceased(false);
      } finally {
        setLoadingDeceased(false);
      }
    };

    fetchDeceasedData();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };
  const handleAdmissionLookup = async () => {
    if (!lookupAdmissionNumber.trim()) {
      setLookupError('Please enter an admission number.');
      toast.error('Please enter an admission number.');
      return;
    }
    setIsLookupLoading(true);
    setLookupError('');
    try {
      const res = await api.get('/deceased/public/postmortem/search', {
        params: { admission_number: lookupAdmissionNumber.trim() }
      });
      const searchData = res.data?.data;
      const data = searchData?.deceased;
      if (!data) {
        setLookupError('No deceased record found with that admission number.');
        toast.error('No deceased record found with that admission number.');
        return;
      }
      setDeceasedData(data);
      setAdmissionNumber(data?.admission_number || lookupAdmissionNumber.trim());
      setFormData((prev) => ({
        ...prev,
        idNumber: data?.national_id || prev.idNumber,
        phoneNumber: data?.phone_number || prev.phoneNumber,
        facilityName: data?.receiving_officer || prev.facilityName,
      }));
      if (searchData?.postmortem) {
        setPostmortemData(searchData.postmortem);
      }
      toast.success(`Deceased record loaded: ${data?.full_name || 'Unknown'}`);
    } catch (err) {
      console.error('Admission lookup error:', err);
      setLookupError(err?.response?.data?.message || 'No deceased record found with that admission number.');
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowErrors(true);
    if (!formData.termsAccepted) {
      toast.error('Please accept the terms and authorizations to proceed.');
      return;
    }
    if (!formData.releasedTo || !formData.relationship || !formData.phoneNumber || !formData.idNumber || !signature) {
      toast.error('Please fill in all required fields and sign the form.');
      return;
    }
    setSubmitting(true);
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const payload = {
        admission_number: deceasedData?.admission_number || admissionNumber || '',
        name_of_deceased: deceasedData?.full_name || '',
        id_number: formData.idNumber,
        next_kin: formData.releasedTo,
        tell_number: formData.phoneNumber,
        relationship: formData.relationship,
        date_of_removal: formData.dateReleased || today,
        time_of_removal: formData.timeReleased || currentTime,
        mode_of_transport: formData.transportBy,
        permit_number: deceasedData?.permit_number || '',
        everything_paid: !!formData.everythingPaid,
        terms_accepted: !!formData.termsAccepted,
        signature: signature,
        staff_name: formData.releasedBy || 'Staff',
        received_by: formData.facilityName || 'RestPoint Funeral Services',
        items_returned: '',
        notes: [formData.additionalNotes, formData.additionalWitnesses, formData.finalDisposition, formData.driverName, formData.receivingFuneralHome, formData.cityState].filter(Boolean).join('\n'),
      };
      const res = await api.post(ENDPOINTS.RELEASE_FORMS(), payload);
      setReleaseId(res.data?.data?.release_id || res.data?.release_id || res.data?.data?.id || res.data?.id);
      setSubmissionSuccess(true);
      toast.success('Release form submitted successfully!');
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err?.response?.data?.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => window.print();

  if (loadingDeceased) {
    return (
      <Container>
        <FormSheet>
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: COLORS.gray }}>
            <Loader2 style={{ width: 40, height: 40, margin: '0 auto 1rem' }} />
            <p>Loading deceased record...</p>
          </div>
        </FormSheet>
      </Container>
    );
  }

  if (submissionSuccess && releaseId) {
    return (
      <Container>
        <FormSheet>
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <CheckCircle style={{ width: 64, height: 64, color: COLORS.success, marginBottom: '1rem' }} />
            <h2 style={{ fontFamily: "'Saira', sans-serif", marginBottom: '0.5rem' }}>Form Submitted Successfully</h2>
            <p style={{ color: COLORS.gray, marginBottom: '2rem' }}>
              The release form has been recorded. Reference ID: <strong>{releaseId}</strong>
            </p>
            <ActionsContainer style={{ justifyContent: 'center' }}>
              <PrimaryButton onClick={handlePrint}><FileText size={18} /> Print Form</PrimaryButton>
              <SecondaryButton onClick={() => navigate('/dashboard')}><ArrowRight size={18} /> Back to Dashboard</SecondaryButton>
            </ActionsContainer>
          </div>
        </FormSheet>
      </Container>
    );
  }
  if (error) {
    return (
      <Container>
        <FormSheet>
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <AlertCircle style={{ width: 40, height: 40, color: COLORS.red, marginBottom: '1rem' }} />
            <p style={{ color: COLORS.red }}>{error}</p>
            <SecondaryButton onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>Go Back</SecondaryButton>
          </div>
        </FormSheet>
      </Container>
    );
  }

  const fullName = deceasedData?.full_name || [deceasedData?.first_name, deceasedData?.middle_name, deceasedData?.last_name].filter(Boolean).join(' ') || 'Unknown';
  const age = deceasedData?.age ? `${deceasedData.age} years` : 'N/A';
  const sex = deceasedData?.gender || deceasedData?.sex || 'N/A';
  const dateOfDeath = deceasedData?.date_of_death || postmortemData?.date_of_death || 'N/A';
  const placeOfDeath = deceasedData?.place_of_death || postmortemData?.place_of_death || 'N/A';
  const causeOfDeath = postmortemData?.cause_of_death || deceasedData?.cause_of_death || 'Not specified';
  const physician = postmortemData?.physician || deceasedData?.physician || '';

  return (
    <Container>
      <FormSheet>
        <ContentWrapper>
          {/* Letterhead */}
          <Letterhead>
            <LogoBox>{branding?.name?.[0]?.toUpperCase() || 'R'}</LogoBox>
            <BrandDetails>
              <BrandName>{branding?.name || 'RestPoint Funeral Services'}</BrandName>
              <BrandMeta>
                <MapPin size={14} />
                {branding?.address || '123 Main Street, City, State 12345'}
              </BrandMeta>
            </BrandDetails>
            <BrandRight>
              <DocTitle>Release of Remains Authorization</DocTitle>
              <ReleaseIdBlock>
                <ReleaseIdLabel>Release ID</ReleaseIdLabel>
                <ReleaseIdValue>#{releaseId || '--'}</ReleaseIdValue>
              </ReleaseIdBlock>
            </BrandRight>
          </Letterhead>

          <FormBody>
            {/* Section 0: Admission Number Lookup */}
            <Section>
              <SectionHead>
                <SectionNum>00</SectionNum>
                <SectionTitle>{deceasedData ? 'Deceased Record' : 'Locate Deceased by Admission Number'}</SectionTitle>
              </SectionHead>
              {!deceasedData ? (
                <Row>
                  <Col2>
                    <Label>Admission Number</Label>
                    <FlexRow style={{ gap: '8px', alignItems: 'flex-start' }}>
                      <Input
                        type="text"
                        value={lookupAdmissionNumber}
                        onChange={(e) => { setLookupAdmissionNumber(e.target.value); setLookupError(''); }}
                        placeholder="Enter admission number (e.g. ADM-2025-001)"
                      />
                      <PrimaryButton type="button" onClick={handleAdmissionLookup} disabled={isLookupLoading} style={{ whiteSpace: 'nowrap' }}>
                        {isLookupLoading ? <Loader2 size={16} /> : <Search size={16} />}
                        {isLookupLoading ? 'Searching...' : 'Load Record'}
                      </PrimaryButton>
                    </FlexRow>
                    <p style={{ color: COLORS.gray, fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      Enter the patient's admission number to auto-populate the deceased details below.
                    </p>
                    {lookupError && (
                      <div style={{ color: COLORS.red, fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {lookupError}
                      </div>
                    )}
                  </Col2>
                </Row>
              ) : (
                <Row>
                  <Col2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', padding: '0.9rem 1rem', background: COLORS.grayLight, border: `1px solid ${COLORS.border}`, borderRadius: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <User size={16} color={COLORS.ink} />
                        <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {deceasedData?.full_name || 'Unknown'}
                        </strong>
                        <span style={{ color: COLORS.gray, fontSize: '0.85rem' }}>
                          (Admission: {deceasedData?.admission_number || admissionNumber || 'ï¿½'})
                        </span>
                      </div>
                      {isNewMode && (
                        <SecondaryButton type="button" onClick={() => { setDeceasedData(null); setLookupError(''); }} style={{ whiteSpace: 'nowrap' }}>
                          Change
                        </SecondaryButton>
                      )}
                    </div>
                  </Col2>
                </Row>
              )}
            </Section>
            {/* Section 1: Deceased Information */}
            <Section>
              <SectionHead>
                <SectionNum>01</SectionNum>
                <SectionTitle>Deceased Information</SectionTitle>
              </SectionHead>
              <Row>
                <Col2>
                  <Label>Full Name</Label>
                  <Input type="text" value={fullName} readOnly disabled />
                </Col2>
                <Col2>
                  <Label>Sex</Label>
                  <Input type="text" value={sex} readOnly disabled />
                </Col2>
              </Row>
              <Row>
                <Col05>
                  <Label>Age</Label>
                  <Input type="text" value={age} readOnly disabled />
                </Col05>
                <Col>
                  <Label>Date of Death</Label>
                  <Input type="text" value={dateOfDeath} readOnly disabled />
                </Col>
                <Col>
                  <Label>Place of Death</Label>
                  <Input type="text" value={placeOfDeath} readOnly disabled />
                </Col>
              </Row>
              <Row>
                <Col2>
                  <Label>Cause of Death</Label>
                  <Input type="text" value={causeOfDeath} readOnly disabled />
                </Col2>
              </Row>
              <Row>
                <Col2>
                  <Label>Physician</Label>
                  <Input type="text" value={physician} readOnly disabled />
                </Col2>
              </Row>
            </Section>

            {/* Section 2: Next of Kin */}
            <Section>
              <SectionHead>
                <SectionNum>02</SectionNum>
                <SectionTitle>Next of Kin / Authorizing Party</SectionTitle>
              </SectionHead>
              <Row>
                <Col2>
                  <Label>Next of Kin Full Name <span style={{ color: COLORS.red }}>*</span></Label>
                  <Input type="text" name="releasedTo" value={formData.releasedTo} onChange={handleInputChange} placeholder="Last, First, Middle" required />
                </Col2>
                <Col>
                  <Label>Relationship <span style={{ color: COLORS.red }}>*</span></Label>
                  <Select name="relationship" value={formData.relationship} onChange={handleInputChange} required>
                    <option value="">Select relationship</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="sibling">Sibling</option>
                    <option value="other">Other</option>
                  </Select>
                </Col>
              </Row>
              <Row>
                <Col2>
                  <Label>Telephone No. <span style={{ color: COLORS.red }}>*</span></Label>
                  <Input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="(XXX) XXX-XXXX" required />
                </Col2>
              </Row>
              <Row>
                <Col>
                  <Label>ID Number (Govt. Issued) <span style={{ color: COLORS.red }}>*</span></Label>
                  <Input type="text" name="idNumber" value={formData.idNumber} onChange={handleInputChange} placeholder="Driver's License / State ID No." required />
                </Col>
              </Row>
            </Section>

            {/* Section 3: Removal Details */}
            <Section>
              <SectionHead>
                <SectionNum>03</SectionNum>
                <SectionTitle>Removal & Transportation Details</SectionTitle>
              </SectionHead>

              <HighlightRow>
                <Row>
                  <Col2>
                    <Label>Funeral Facility Releasing Remains</Label>
                    <Input type="text" name="facilityName" value={formData.facilityName || branding?.name || ''} onChange={handleInputChange} placeholder="Facility name" />
                  </Col2>
                  <Col>
                    <Label>Name of Releasing Staff</Label>
                    <Input type="text" name="releasedBy" value={formData.releasedBy} onChange={handleInputChange} placeholder="Staff name" />
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Label>Date Released</Label>
                    <Input type="date" name="dateReleased" value={formData.dateReleased} onChange={handleInputChange} />
                  </Col>
                  <Col>
                    <Label>Time Released</Label>
                    <Input type="time" name="timeReleased" value={formData.timeReleased} onChange={handleInputChange} />
                  </Col>
                  <Col>
                    <Label>Transport Method</Label>
                    <Select name="transportBy" value={formData.transportBy} onChange={handleInputChange}>
                      <option value="">Select method</option>
                      <option value="hearse">Hearse</option>
                      <option value="private_vehicle">Private Vehicle</option>
                      <option value="commercial">Commercial Transport</option>
                      <option value="other">Other</option>
                    </Select>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Label>Driver Name (if applicable)</Label>
                    <Input type="text" name="driverName" value={formData.driverName} onChange={handleInputChange} placeholder="Driver full name" />
                  </Col>
                  <Col>
                    <Label>Receiving Funeral Home</Label>
                    <Input type="text" name="receivingFuneralHome" value={formData.receivingFuneralHome} onChange={handleInputChange} placeholder="Receiving facility name" />
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Label>City / State of Destination</Label>
                    <Input type="text" name="cityState" value={formData.cityState} onChange={handleInputChange} placeholder="City, State" />
                  </Col>
                </Row>
              </HighlightRow>

              <Row>
                <Col>
                  <Label>Destination Type</Label>
                  <Select name="destinationType" value={formData.destinationType} onChange={handleInputChange}>
                    <option value="funeral_home">Funeral Home</option>
                    <option value="cemetery">Cemetery</option>
                    <option value="crematory">Crematory</option>
                    <option value="other">Other</option>
                  </Select>
                </Col>
              </Row>
            </Section>

            {/* Section 4: Legal Authorizations */}
            <Section>
              <SectionHead>
                <SectionNum>04</SectionNum>
                <SectionTitle>Legal Authorizations</SectionTitle>
              </SectionHead>

              <LegalBlock>
                <LegalText>
                  <strong>DECLARATION:</strong> I, the undersigned, being the legally authorized next of kin or duly appointed representative of the above-named deceased, do hereby authorize the release, removal, and transportation of the remains from the stated place of death to the specified destination and final destination as indicated in this document.
                </LegalText>
                <LegalText>
                  <strong>CERTIFICATION OF AUTHORITY:</strong> I certify that I possess the legal right and authority to make this authorization under applicable state and local laws. I affirm that no other person holds a superior legal claim to the disposition of these remains.
                </LegalText>
                <LegalText>
                  <strong>INDEMNIFICATION:</strong> I hereby release, indemnify, and hold harmless the funeral home, its officers, directors, employees, agents, assignees, and any contracted transport provider from and against any and all claims, liabilities, damages, costs, and expenses arising out of or related to this authorization.
                </LegalText>
              </LegalBlock>

              <Row>
                <Col>
                  <Label>Authorization Scope</Label>
                  <Select name="authorizationScope" value={formData.authorizationScope} onChange={handleInputChange}>
                    <option value="transport_only">Transport Only</option>
                    <option value="full_release">Full Release</option>
                    <option value="cremation_only">Cremation Only</option>
                  </Select>
                </Col>
              </Row>

              <Row>
                <Col2>
                  <Label>Additional Authorizations</Label>
                  <CheckGrid>
                    <CheckItem>
                      <Checkbox type="checkbox" name="cremationAuthorized" checked={formData.cremationAuthorized} onChange={handleCheckboxChange} />
                      Cremation Authorized
                    </CheckItem>
                    <CheckItem>
                      <Checkbox type="checkbox" name="embalmingAuthorized" checked={formData.embalmingAuthorized} onChange={handleCheckboxChange} />
                      Embalming Authorized
                    </CheckItem>
                  </CheckGrid>
                </Col2>
              </Row>
              <Row>
                <Col2>
                  <CheckGrid>
                    <CheckItem>
                      <Checkbox type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleCheckboxChange} />
                      I have read and accept the above declaration, certification, and indemnification terms <span style={{ color: COLORS.red }}>*</span>
                    </CheckItem>
                  </CheckGrid>
                  {showErrors && !formData.termsAccepted && (
                    <div style={{ color: COLORS.red, fontSize: '0.8rem', marginTop: '0.5rem' }}>You must accept the terms to proceed</div>
                  )}
                </Col2>
              </Row>



              <Row>
                <Col2>
                  <Label>Final Disposition Instructions</Label>
                  <Input type="text" name="finalDisposition" value={formData.finalDisposition} onChange={handleInputChange} placeholder="e.g. Burial, Cremation, etc." />
                </Col2>
              </Row>
            </Section>

            {/* Section 5: Signature */}
            <Section>
              <SectionHead>
                <SectionNum>05</SectionNum>
                <SectionTitle>Authorized Signature</SectionTitle>
              </SectionHead>
              <Row>
                <Col2>
                  <Label>Signature of Authorizing Party <span style={{ color: COLORS.red }}>*</span></Label>
                  <SigCanvasWrap>
                    <Suspense fallback={<div style={{ color: COLORS.gray }}>Loading signature pad...</div>}>
                      <ReusableSignaturePad onChange={setSignature} width={800} height={200} />
                    </Suspense>
                  </SigCanvasWrap>
                  {showErrors && !signature && (
                    <div style={{ color: COLORS.red, fontSize: '0.8rem', marginTop: '0.5rem' }}>Signature is required</div>
                  )}
                </Col2>
              </Row>
              <Row>
                <Col2>
                  <Label>Additional Notes / Witnesses</Label>
                  <Input type="text" name="additionalWitnesses" value={formData.additionalWitnesses} onChange={handleInputChange} placeholder="Witness names or additional notes" />
                </Col2>
              </Row>
            </Section>

            {/* Actions */}
            <ActionsContainer>
              <SecondaryButton type="button" onClick={() => navigate(-1)} disabled={submitting}>
                <X size={18} /> Cancel
              </SecondaryButton>
              <SecondaryButton type="button" onClick={handlePrint}>
                <FileText size={18} /> Print Draft
              </SecondaryButton>
              <PrimaryButton type="submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 size={18} /> : <Check size={18} />}
                {submitting ? 'Submitting...' : 'Submit Authorization'}
              </PrimaryButton>
            </ActionsContainer>
          </FormBody>
        </ContentWrapper>
      </FormSheet>

      <ToastContainer position="bottom-right" />
    </Container>
  );
}

export default ReleaseFormPage;







