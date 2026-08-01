import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../../api/axios';
import { getTenantHeaders } from '../../api/endpoints';
import { ShieldCheck, Search, AlertCircle, Loader } from 'lucide-react';

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #0a0a0a;
  padding: 4rem 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ContentBox = styled.div`
  width: 100%;
  max-width: 500px;
  text-align: center;
`;

const IconBlock = styled.div`
  margin-bottom: 2rem;
  
  svg {
    color: #0a0a0a;
  }
`;

const Title = styled.h1`
  font-family: 'Merriweather', Georgia, serif;
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  color: #666666;
  font-size: 0.9rem;
  margin: 0 0 2rem 0;
  line-height: 1.5;
`;

const ToggleGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
`;

const ToggleBtn = styled.button`
  background: none;
  border: none;
  padding: 0.75rem 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.$active ? '#0a0a0a' : '#999'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border-bottom: 2px solid ${props => props.$active ? '#0a0a0a' : 'transparent'};
  margin-bottom: -2px;
  transition: all 0.2s ease;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const InputGroup = styled.div`
  text-align: left;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #555;
  margin-bottom: 0.5rem;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: 0.875rem;
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
  width: 100%;
  margin-top: 1rem;

  &:hover {
    background: #333;
  }

  &:disabled {
    background: #999;
    cursor: not-allowed;
  }
`;

const ErrorBox = styled.div`
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
  text-align: left;

  svg {
    flex-shrink: 0;
  }
`;

const PostmortemVerifyPage = () => {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState('phone');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tenantSlug = 'montenzuma-monalisa-feuneral-home-nairobi';

  const handleToggle = (type) => {
    setSearchType(type);
    setInputValue('');
    setError('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value) {
      setError('Please enter your details');
      return;
    }

    setLoading(true);
    setError('');

    try {
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
        
        // Create session and navigate to results page
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const tenantSlug = 'montenzuma-monalisa-feuneral-home-nairobi';
        
        // Store data in sessionStorage for persistence across page refreshes
        const sessionData = {
          deceased: {
            ...deceased,
            // Ensure signature fields are explicitly preserved
            signature: deceased?.signature || null,
            pathologist_signature: deceased?.pathologist_signature || null
          },
          postmortem,
          verifiedAt: new Date().toISOString(),
          searchType,
          searchValue: value
        };
        console.log('Storing session data with signature:', {
          signature: sessionData.deceased.signature,
          pathologist_signature: sessionData.deceased.pathologist_signature
        });
        sessionStorage.setItem(`postmortem_session_${sessionId}`, JSON.stringify(sessionData));
        
        // Navigate to results page with session ID in URL
        navigate(`/tenant/${tenantSlug}/postmortem/results/${sessionId}`, {
          state: sessionData
        });
      } else {
        setError('No record found. Please verify your details and try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      const errMsg = err.response?.data?.message;
      if (errMsg) {
        setError(errMsg);
      } else if (err.response?.status === 404) {
        setError('No record found. Please verify your details and try again.');
      } else {
        setError('Unable to verify at this time. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <ContentBox>
        <IconBlock>
          <ShieldCheck size={48} />
        </IconBlock>

        <Title>Identity Verification</Title>
        <Subtitle>
          Enter your details to verify your identity and access the postmortem report
        </Subtitle>

        <ToggleGroup>
          <ToggleBtn 
            $active={searchType === 'phone'} 
            onClick={() => handleToggle('phone')}
          >
            <Search size={14} /> Phone
          </ToggleBtn>
          <ToggleBtn 
            $active={searchType === 'id'} 
            onClick={() => handleToggle('id')}
          >
            <ShieldCheck size={14} /> ID Number
          </ToggleBtn>
          <ToggleBtn 
            $active={searchType === 'deceased_id'} 
            onClick={() => handleToggle('deceased_id')}
          >
            <AlertCircle size={14} /> Deceased ID
          </ToggleBtn>
        </ToggleGroup>

        <form onSubmit={handleVerify}>
          <InputGroup>
            <Label>
              {searchType === 'phone' ? 'Phone Number' : 
               searchType === 'id' ? 'ID Number' : 'Deceased ID'}
            </Label>
            <InputWrapper>
              {searchType === 'phone' && <Search size={18} />}
              {searchType === 'id' && <ShieldCheck size={18} />}
              {searchType === 'deceased_id' && <AlertCircle size={18} />}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError('');
                }}
                placeholder={
                  searchType === 'phone' ? '0712345678' : 
                  searchType === 'id' ? '12345678' : 'MON-PET-XXXXXX-XXXXXX'
                }
                required
                disabled={loading}
              />
            </InputWrapper>
          </InputGroup>

          {error && (
            <ErrorBox>
              <AlertCircle size={18} />
              <span>{error}</span>
            </ErrorBox>
          )}

          <ActionButton type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Verify Identity
              </>
            )}
          </ActionButton>
        </form>
      </ContentBox>
    </PageWrapper>
  );
};

export default PostmortemVerifyPage;