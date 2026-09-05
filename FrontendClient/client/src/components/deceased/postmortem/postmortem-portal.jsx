import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import api from '../../../api/axios';
import { ENDPOINTS, getTenantHeaders } from '../../../api/endpoints';
import { useSocket } from '../../../utils/context/socketContext';
import env from '../../../utils/config/env';




const IconBase = ({ children, size = 24, color = 'currentColor', strokeWidth = 2, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

export const Phone = (props) => (
  <IconBase {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </IconBase>
);

export const IdCard = (props) => (
  <IconBase {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="M15 8h2" />
    <path d="M15 12h2" />
    <path d="M7 16h10" />
  </IconBase>
);

export const Search = (props) => (
  <IconBase {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </IconBase>
);

export const Zap = (props) => (
  <IconBase {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </IconBase>
);

export const Lock = (props) => (
  <IconBase {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </IconBase>
);

export const ShieldCheck = (props) => (
  <IconBase {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </IconBase>
);

export const User = (props) => (
  <IconBase {...props}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </IconBase>
);

export const Calendar = (props) => (
  <IconBase {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </IconBase>
);

export const Activity = (props) => (
  <IconBase {...props}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </IconBase>
);

export const Stethoscope = (props) => (
  <IconBase {...props}>
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
    <circle cx="20" cy="10" r="2" />
  </IconBase>
);

export const AlertCircle = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </IconBase>
);

export const ClipboardList = (props) => (
  <IconBase {...props}>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </IconBase>
);

export const FileText = (props) => (
  <IconBase {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </IconBase>
);

export const Download = (props) => (
  <IconBase {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </IconBase>
);

export const Loader = (props) => (
  <IconBase {...props}>
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </IconBase>
);
// --- Styled Components ---
const PortalWrapper = styled.div`
  min-height: 100vh;
  background: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #0a0a0a;
  padding: 4rem 1.5rem;
  display: flex;
  justify-content: center;
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: 3rem;
`;

/* --- Search / Verification Grid --- */
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  max-width: 500px;
  margin: 0 auto;
  width: 100%;
  text-align: center;
`;

const HeaderBlock = styled.div`
  display: grid;
  gap: 0.5rem;
  justify-items: center;
  
  h1 {
    font-family: 'Merriweather', Georgia, serif;
    font-size: 2rem;
    margin: 0;
    font-weight: 900;
    letter-spacing: -0.02em;
  }
  
  p {
    color: #666666;
    font-size: 0.9rem;
    margin: 0;
    max-width: 400px;
    line-height: 1.5;
  }
`;

const VerifyTitle = styled.div`
  margin-top: 1rem;
  
  h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.1rem;
    font-weight: 700;
  }
  
  span {
    font-size: 0.85rem;
    color: #888;
  }
`;

const ToggleGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border-bottom: 2px solid #f0f0f0;
`;

const ToggleBtn = styled.button`
  background: none;
  border: none;
  padding: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => props.$active ? '#0a0a0a' : '#999'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-bottom: 2px solid ${props => props.$active ? '#0a0a0a' : 'transparent'};
  margin-bottom: -2px;
  transition: all 0.2s ease;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const InputGroup = styled.div`
  display: grid;
  gap: 0.5rem;
  text-align: left;
  margin-top: 0.5rem;
`;

const InputLabel = styled.label`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #555;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  svg {
    position: absolute;
    left: 0.75rem;
    color: #999;
    pointer-events: none;
  }
  
  input {
    width: 100%;
    padding: 0.875rem 1rem 0.875rem 2.5rem;
    border: 1px solid #e0e0e0;
    background: #ffffff;
    border-radius: 4px;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
    
    &:focus {
      border-color: #0a0a0a;
    }
  }
`;

const ActionButton = styled.button`
  background: #0a0a0a;
  color: white;
  border: none;
  padding: 0.875rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.2s;
  margin-top: 0.5rem;
  
  &:hover {
    background: #333;
  }
  
  &:disabled {
    background: #999;
    cursor: not-allowed;
  }
`;

const FeaturesRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
  
  span {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8rem;
    color: #888;
    font-weight: 500;
    
    svg {
      width: 14px;
      height: 14px;
      color: #555;
    }
  }
`;

/* --- Report Grid (Borderless) --- */
const ReportWrapper = styled.div`
  display: grid;
  gap: 3rem;
  width: 100%;
  animation: slideUp 0.4s ease-out;
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #0a0a0a;
  
  h2 {
    font-family: 'Merriweather', Georgia, serif;
    font-size: 1.75rem;
    margin: 0.25rem 0 0 0;
    font-weight: 700;
  }
  
  .sub {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
  }
`;

const StatusBadge = styled.span`
  background: #0a0a0a;
  color: white;
  padding: 0.375rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SectionGrid = styled.div`
  display: grid;
  gap: 2rem;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #0a0a0a;
  font-weight: 700;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
  
  svg {
    width: 14px;
    height: 14px;
    color: #666;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem 2rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  
  label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888;
    font-weight: 700;
  }
  
  span {
    font-size: 1rem;
    color: #0a0a0a;
    font-weight: 500;
  }
`;

const SummaryBox = styled.div`
  background: #fafafa;
  border-left: 4px solid #0a0a0a;
  padding: 1.25rem 1.5rem;
  
  p {
    margin: 0;
    color: #333;
    line-height: 1.6;
    font-size: 0.95rem;
  }
`;

const SigGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #f0f0f0;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SigBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  &.right {
    align-items: flex-end;
    text-align: right;
  }
  
  .sig-img {
    height: 60px;
    width: 100%;
    border-bottom: 1px solid #0a0a0a;
    display: flex;
    align-items: center;
    font-family: 'Brush Script MT', cursive;
    font-size: 2rem;
    font-style: italic;
    color: #0a0a0a;
  }
  
  label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888;
    font-weight: 700;
  }
  
  span {
    font-family: monospace;
    font-weight: 700;
    font-size: 0.9rem;
    color: #0a0a0a;
  }
`;

const DownloadBtn = styled.button`
  background: #0a0a0a;
  color: white;
  border: none;
  padding: 1.25rem;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: background 0.2s;
  
  &:hover {
    background: #333;
  }
  
  &:disabled {
    background: #999;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #fff0f0;
  border: 1px solid #ffcccc;
  border-left: 4px solid #e74c3c;
  padding: 1rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #c0392b;
  margin-top: 1rem;
  
  svg {
    flex-shrink: 0;
  }
`;

const ToastMessage = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #0a0a0a;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;

const BackButton = styled.button`
  background: none;
  border: 1px solid #e0e0e0;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  margin-bottom: 1rem;
  
  &:hover {
    border-color: #0a0a0a;
    color: #0a0a0a;
  }
`;

const AutopsyPortal = () => {
  const { slug } = useParams();
  const tenantSlug = slug || 'system_shared';
  const { socket } = useSocket();
  
  const [searchType, setSearchType] = useState('id'); // 'phone', 'id', or 'deceased_id'
  const [inputValue, setInputValue] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleToggle = (type) => {
    setSearchType(type);
    setInputValue('');
    setError('');
  };

  const handleAccessReport = async (e) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value) {
      const fieldLabel = searchType === 'phone' ? 'phone number' : searchType === 'id' ? 'ID number' : 'deceased ID';
      setError('Please enter your ' + fieldLabel);
      return;
    }
    
    setLoading(true);
    setError('');
    setReportData(null);
    
    try {
      // Use public endpoint (no auth required)
      const params = {};
      
      if (searchType === 'phone') {
        params.phone = value;
      } else if (searchType === 'id') {
        params.id_number = value;
      } else if (searchType === 'deceased_id') {
        params.deceased_id = value;
      }
      
      const response = await api.get('/deceased/public/postmortem/search', {
        params,
        headers: {
          'x-tenant-slug': tenantSlug
        }
      });
      
      if (response.data?.success && response.data?.data) {
        const { deceased, postmortem } = response.data.data;
        setReportData(formatRecord({ ...deceased, ...postmortem }));
        setShowReport(true);
        showToast('Record found successfully');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Emit socket notification to next of kin
        if (socket && socket.connected) {
          const notification = {
            tenantSlug,
            type: 'postmortem_accessed',
            priority: 'medium',
            deceasedId: deceased.deceased_id || deceased.id,
            deceasedName: `${deceased.first_name || ''} ${deceased.last_name || ''}`.trim(),
            accessedBy: 'External User (QR Scan)',
            accessTime: new Date().toISOString(),
            accessMethod: 'QR Code Verification',
            searchType,
            searchValue: value,
          };
          socket.emit('postmortem-accessed', notification);
          console.log('[Postmortem Portal] Emitted access notification:', notification);
        } else {
          console.warn('[Postmortem Portal] Socket not connected, notification not sent');
        }
      } else {
        const fieldLabel = searchType === 'phone' ? 'phone number' : searchType === 'id' ? 'ID number' : 'deceased ID';
        setError('No record found matching your ' + fieldLabel + '. Please verify your details and try again.');
      }
    } catch (err) {
      console.error('Search error:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error;
      if (errMsg) {
        setError(errMsg);
      } else if (err.response?.status === 404) {
        const fieldLabel = searchType === 'phone' ? 'phone number' : searchType === 'id' ? 'ID number' : 'deceased ID';
        setError('No record found matching your ' + fieldLabel + '. Please verify your details and try again.');
      } else {
        setError('Unable to search at this time. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatRecord = (record) => ({
    fullName: `${record.first_name || ''} ${record.last_name || ''}`.trim() || record.name || 'N/A',
    admissionNo: record.admission_no || record.admission_number || record.id || 'N/A',
    dateOfBirth: record.date_of_birth || record.dob || 'N/A',
    age: record.age || 'N/A',
    gender: record.gender || 'N/A',
    dateOfDeath: record.date_of_death || record.dod || 'N/A',
    placeOfDeath: record.place_of_death || record.place_of_death || 'N/A',
    kinName: record.kin_name || record.next_of_kin || 'N/A',
    kinRelationship: record.kin_relationship || record.relationship || 'N/A',
    kinTelephone: record.kin_telephone || record.kin_phone || 'N/A',
    kinIdNumber: record.kin_id_number || record.kin_id || 'N/A',
    examDate: record.exam_date || record.postmortem_date || 'N/A',
    examTime: record.exam_time || 'N/A',
    pathologist: record.pathologist || 'N/A',
    facility: record.facility || 'RestPoint Mortuary',
    mannerOfDeath: record.manner_of_death || record.manner || 'N/A',
    immediateCause: record.immediate_cause || record.cause_of_death || 'N/A',
    underlyingCause: record.underlying_cause || 'N/A',
    contributingFactors: record.contributing_factors || 'N/A',
    examinationSummary: record.examination_summary || record.summary || 'No examination summary available.',
    pathologistSignature: record.signature || record.pathologist_signature || record.pathologist || 'N/A',
    verificationId: record.verification_id || record.reference_no || 'N/A',
    digitalTimestamp: record.digital_timestamp || record.report_date || 'N/A',
    status: record.status || record.autopsy_status || 'Completed'
  });

  const handleBack = () => {
    setShowReport(false);
    setReportData(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadPDF = async () => {
    if (!reportData) return;
    showToast('Generating PDF report...');
    try {
      const headers = {
        'Accept': 'application/pdf',
        'x-tenant-slug': tenantSlug
      };
      const response = await fetch(
        `${window.location.origin}/api/deceased/public/postmortem/${reportData.admissionNo}/pdf`,
        {
          method: 'GET',
          headers,
          credentials: 'include'
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        showToast('PDF report opened in new tab');
      } else {
        showToast('PDF generation failed');
      }
    } catch (err) {
      showToast('PDF generation failed');
    }
  };

  return (
    <PortalWrapper>
      <ContentContainer>
        
        {!showReport ? (
          <FormGrid>
            <HeaderBlock>
              <ShieldCheck size={32} color="#0a0a0a" />
              <h1>Autopsy Portal</h1>
              <p>Enter Next of Kin Telephone, ID Number, or Deceased ID to securely verify and download records.</p>
            </HeaderBlock>

            <VerifyTitle>
              <h3>Verify Your Identity</h3>
              <span>Enter your details to access the postmortem report</span>
            </VerifyTitle>

            <ToggleGroup>
              <ToggleBtn $active={searchType === 'phone'} onClick={() => handleToggle('phone')}>
                <Phone /> Phone
              </ToggleBtn>
              <ToggleBtn $active={searchType === 'id'} onClick={() => handleToggle('id')}>
                <IdCard /> ID Number
              </ToggleBtn>
              <ToggleBtn $active={searchType === 'deceased_id'} onClick={() => handleToggle('deceased_id')}>
                <User /> Deceased ID
              </ToggleBtn>
            </ToggleGroup>

            <form onSubmit={handleAccessReport} style={{ display: 'grid', gap: '1.5rem' }}>
              <InputGroup>
                <InputLabel>
                  {searchType === 'phone' ? 'Phone Number' : searchType === 'id' ? 'ID Number' : 'Deceased ID'}
                </InputLabel>
                <InputWrapper>
                  {searchType === 'phone' ? <Phone size={18} /> : searchType === 'id' ? <IdCard size={18} /> : <User size={18} />}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      setError('');
                    }}
                    placeholder={searchType === 'phone' ? '0712345678' : searchType === 'id' ? '12345678' : 'MON-PET-XXXXXX-XXXXXX'}
                    required
                    disabled={loading}
                  />
                </InputWrapper>
              </InputGroup>

              {error && (
                <ErrorMessage>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </ErrorMessage>
              )}

              <ActionButton type="submit" disabled={loading}>
                {loading ? (
                  <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Searching...</>
                ) : (
                  <><Search size={18} /> Access Report</>
                )}
              </ActionButton>
            </form>

            <FeaturesRow>
              <span><Zap size={14} /> Results in seconds</span>
              <span><Lock size={14} /> Secure & Private</span>
            </FeaturesRow>
            
            <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '1rem' }}>
              Secure portal for {tenantSlug}
            </div>
          </FormGrid>
        ) : (
          <ReportWrapper>
            <BackButton onClick={handleBack}>
              ← Back to Search
            </BackButton>
            
            <ReportHeader>
              <div>
                <div className="sub">Official Examination Record</div>
                <h2>{reportData?.fullName}</h2>
              </div>
              <StatusBadge>{reportData?.status}</StatusBadge>
            </ReportHeader>

            <SectionGrid>
              <div>
                <SectionTitle><User /> Decedent Information</SectionTitle>
                <InfoGrid style={{ marginTop: '1.5rem' }}>
                  <InfoItem><label>Admission No.</label><span>{reportData?.admissionNo}</span></InfoItem>
                  <InfoItem><label>Date of Birth</label><span>{reportData?.dateOfBirth}</span></InfoItem>
                  <InfoItem><label>Age</label><span>{reportData?.age}</span></InfoItem>
                  <InfoItem><label>Gender</label><span>{reportData?.gender}</span></InfoItem>
                  <InfoItem><label>Date of Death</label><span>{reportData?.dateOfDeath}</span></InfoItem>
                  <InfoItem><label>Place of Death</label><span>{reportData?.placeOfDeath}</span></InfoItem>
                </InfoGrid>
              </div>

              <div>
                <SectionTitle><User /> Next of Kin / Authorizing Party</SectionTitle>
                <InfoGrid style={{ marginTop: '1.5rem' }}>
                  <InfoItem><label>Kin Name</label><span>{reportData?.kinName}</span></InfoItem>
                  <InfoItem><label>Relationship</label><span>{reportData?.kinRelationship}</span></InfoItem>
                  <InfoItem><label>Telephone</label><span>{reportData?.kinTelephone}</span></InfoItem>
                  <InfoItem><label>ID Number</label><span>{reportData?.kinIdNumber}</span></InfoItem>
                </InfoGrid>
              </div>

              <div>
                <SectionTitle><Stethoscope /> Examination Details & Findings</SectionTitle>
                <InfoGrid style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  <InfoItem><label>Exam Date</label><span>{reportData?.examDate}</span></InfoItem>
                  <InfoItem><label>Exam Time</label><span>{reportData?.examTime}</span></InfoItem>
                  <InfoItem><label>Pathologist</label><span>{reportData?.pathologist}</span></InfoItem>
                  <InfoItem><label>Facility</label><span>{reportData?.facility}</span></InfoItem>
                  <InfoItem><label>Manner of Death</label><span>{reportData?.mannerOfDeath}</span></InfoItem>
                  <InfoItem><label>Immediate Cause</label><span>{reportData?.immediateCause}</span></InfoItem>
                  <InfoItem><label>Underlying Cause</label><span>{reportData?.underlyingCause}</span></InfoItem>
                  <InfoItem><label>Contributing Factors</label><span>{reportData?.contributingFactors}</span></InfoItem>
                </InfoGrid>
                <SummaryBox>
                  <p><strong>Examination Summary:</strong> {reportData?.examinationSummary}</p>
                </SummaryBox>
              </div>
            </SectionGrid>

            <SigGrid>
              <SigBox>
                <div className="sig-img">
                  {(() => {
                    const sig = reportData?.pathologistSignature;
                    // Signature values may be a data-URL, an absolute URL or an
                    // /uploads/... path — render as an IMAGE, otherwise as text.
                    if (sig && /^(data:image|https?:\/\/|\/)/.test(String(sig))) {
                      const src = /^(data:image|https?:\/\/)/.test(String(sig))
                        ? sig
                        : `${env.API_GATEWAY_URL}${String(sig).startsWith('/') ? '' : '/'}${sig}`;
                      return (
                        <img
                          src={src}
                          alt="Pathologist Signature"
                          style={{ maxWidth: '100%', maxHeight: '70px', objectFit: 'contain' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      );
                    }
                    return sig || 'N/A';
                  })()}
                </div>
                <label>Pathologist Signature</label>
              </SigBox>
              <SigBox className="right">
                <label>Verification ID</label>
                <span>{reportData?.verificationId}</span>
                <label style={{ marginTop: '0.5rem' }}>Digital Timestamp</label>
                <span>{reportData?.digitalTimestamp}</span>
              </SigBox>
            </SigGrid>

            <DownloadBtn onClick={handleDownloadPDF}>
              <Download size={18} /> Download Official PDF Report
            </DownloadBtn>
          </ReportWrapper>
        )}

      </ContentContainer>
      
      {toast && <ToastMessage>{toast}</ToastMessage>}
    </PortalWrapper>
  );
};

export default AutopsyPortal;