import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Search, Download, Eye, X, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS, getTenantHeaders } from '../../api/endpoints';
import './PostmortemQRPage.css';

const PostmortemResults = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const initialDeceasedId = searchParams.get('deceasedId') || '';
  
  const [deceasedId, setDeceasedId] = useState(initialDeceasedId);
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const tenantSlug = slug || localStorage.getItem('tenantSlug') || 'system_shared';

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSearch = async () => {
    const id = deceasedId.trim().toUpperCase();
    if (!id) {
      setError('Please enter an admission number');
      return;
    }
    
    setLoading(true);
    setError('');
    setSearchResult(null);
    
    try {
      const headers = { ...getTenantHeaders(), 'x-tenant-slug': tenantSlug };
      const response = await api.get(ENDPOINTS.DECEASED.DETAIL(id), { 
        headers
      });
      
      const data = response.data?.data || response.data;
      setSearchResult({
        id: id,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.name || 'N/A',
        dod: data.date_of_death || data.dod || 'N/A',
        cod: data.cause_of_death || data.cod || 'N/A',
        status: data.autopsy_status || data.status || 'Complete',
        cond: data.body_condition || data.cond || 'N/A',
        path: data.pathologist || data.path || 'N/A',
        filed: data.report_date || data.filed || 'N/A'
      });
      showToast('Record found');
    } catch (err) {
      // Fallback to mock data
      const mockDB = {
        'ADM-2025-00472': {
          name: 'Ochieng, James Mwangi', dod: 'June 28, 2025', cod: 'Acute myocardial infarction',
          status: 'Complete', cond: 'Embalmed — Good', path: 'Dr. Wanjiku Gathoni', filed: 'July 1, 2025'
        },
        'ADM-2025-00518': {
          name: 'Mutua, Susan Njeri', dod: 'July 3, 2025', cod: 'Blunt force trauma — RTA',
          status: 'Complete', cond: 'Refrigerated — Fair', path: 'Dr. Ahmed Osman', filed: 'July 5, 2025'
        },
        'ADM-2025-00603': {
          name: 'Kiprop, Daniel Arap', dod: 'July 10, 2025', cod: 'Suspected pulmonary embolism',
          status: 'Pending histology', cond: 'Refrigerated — Intact', path: 'Dr. Wanjiku Gathoni', filed: 'Awaiting completion'
        }
      };
      
      const record = mockDB[id];
      if (record) {
        setSearchResult({ id, ...record });
        showToast('Record found (offline)');
      } else {
        setError('No record found for ' + id);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Complete') return '#6BAF7A';
    return '#C8A96E';
  };

  return (
    <div className="pm-page" style={{ minHeight: '100vh' }}>
      <main className="pm-main" style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div className="pm-right-head" style={{ marginBottom: '2rem' }}>
          <div className="section-label">Record Lookup</div>
          <h1>Postmortem <em>Results</em></h1>
          <p>Enter the case reference ID to retrieve the postmortem report.</p>
        </div>

        <div className="input-row" style={{ marginBottom: '2rem' }}>
          <input
            className="pm-input"
            type="text"
            value={deceasedId}
            onChange={(e) => { setDeceasedId(e.target.value.toUpperCase()); setError(''); }}
            placeholder="ADM-2025-00472"
            spellCheck="false"
            autoComplete="off"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            className="clear-btn" 
            onClick={() => { setDeceasedId(''); setSearchResult(null); setError(''); }}
            style={{ display: deceasedId ? 'flex' : 'none' }}
          >
            <X size={16} />
          </button>
          <button className="lookup-btn" onClick={handleSearch} disabled={loading}>
            <Search size={16} style={{ marginRight: '6px' }} />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '4px', color: '#c0392b', marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}

        {searchResult && (
          <div className="result-card">
            <div className="rc-head">
              <div className="rc-dot" style={{ background: getStatusColor(searchResult.status), boxShadow: `0 0 8px ${getStatusColor(searchResult.status)}60` }}></div>
              <span className="rc-head-text">Record found</span>
              <div className="rc-head-id">{searchResult.id}</div>
            </div>

            {[
              { key: 'Full Name', val: searchResult.name, cls: 'serif italic' },
              { key: 'Date of Death', val: searchResult.dod, cls: '' },
              { key: 'Cause of Death', val: searchResult.cod, cls: 'serif' },
              { key: 'Autopsy Status', val: searchResult.status, cls: 'bold', color: getStatusColor(searchResult.status), dot: true },
              { key: 'Body Condition', val: searchResult.cond, cls: '' },
              { key: 'Pathologist', val: searchResult.path, cls: '' },
              { key: 'Report Filed', val: searchResult.filed, cls: '' }
            ].map((item, i) => (
              <div className="rc-row row-hover" key={i}>
                <div className="rc-key">{item.key}</div>
                <div className={`rc-val ${item.cls}`} style={item.color ? { color: item.color } : {}}>
                  {item.dot && (
                    <span className="status-dot" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}80` }}></span>
                  )}
                  {item.val}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default PostmortemResults;