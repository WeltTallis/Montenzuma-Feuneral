import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { C, formatDate } from './theme';
import RouteOptimizer from '../../hearse/RouteOptimizer';
import api from '../../../api/axios';
import { notify } from '../../../utils/notify';
import { getTenantHeaders } from '../../../api/endpoints';

const SectionHead = styled.div`
  font-size: 12px; 
  font-weight: 700; 
  letter-spacing: 0.1em;
  text-transform: uppercase; 
  margin-bottom: 16px; 
  display: flex; 
  align-items: center; 
  gap: 8px;
  
  /* Default style: Half underline */
  width: fit-content;
  padding-bottom: 4px;
  border-bottom: 2px solid ${C.black};
  color: ${C.black};
  
  span { 
    opacity: 0.5; 
    font-size: 10px; 
  }
  
  ${p => p.$mt0 && 'margin-top: 0;'}

  /* Primary style: Solid black background bar */
  ${p => p.$primary && `
    background: ${C.black};
    color: white;
    padding: 8px 16px;
    border-radius: 2px;
    border-bottom: none;
    width: 100%;
  `}
`;

const Btn = styled.button`
  padding: 8px 16px; 
  border-radius: 4px; 
  font-weight: 600; 
  font-size: 13px;
  cursor: pointer; 
  border: 1px solid ${C.border || '#e0e0e0'}; 
  background: white; 
  color: ${C.dark || '#1a1a1a'};
  transition: 0.15s; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  
  &:hover { 
    background: ${C.bgField || '#f7f7f5'}; 
    border-color: ${C.gray || '#777777'}; 
  }
  
  ${p => p.$primary && `
    background: ${C.black}; 
    color: white; 
    border-color: ${C.black};
    &:hover { 
      background: #333; 
      border-color: #333;
    }
  `}
  
  ${p => p.$sm && `padding: 6px 12px; font-size: 12px;`}
`;

const DataTable = styled.table`
  width: 100%;
  min-width: 620px;
  border-collapse: collapse;
  
  th { 
    text-align: left; 
    font-size: 11px; 
    text-transform: uppercase; 
    color: ${C.gray}; 
    padding: 12px 8px; 
    border-bottom: 2px solid ${C.borderLight || '#e0e0e0'}; 
    white-space: nowrap; 
  }
  
  td { 
    padding: 12px 8px; 
    font-size: 13px; 
    border-bottom: 1px solid ${C.borderLight || '#e0e0e0'}; 
    vertical-align: middle; 
  }
  
  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const TableScroll = styled.div`
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  border: 1px solid ${C.borderLight || '#e0e0e0'};
  border-radius: 6px;
`;

const StatusTag = styled.span`
  display: inline-flex; 
  align-items: center; 
  gap: 6px; 
  padding: 4px 10px;
  border-radius: 4px; 
  font-size: 11px; 
  font-weight: 700;
  background: ${p => p.$info ? C.infoBg : C.bgField};
  color: ${p => p.$info ? C.info : C.gray};
  border: 1px solid ${p => p.$info ? '#bfdbfe' : C.borderLight};
`;

const DocumentsTab = ({ documents, deceasedId }) => {
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localDocs, setLocalDocs] = useState(null);
  const fileInputRef = useRef(null);

  // Documents live in the shared uploads folder (<upload>/<slug>/documents/<deceasedId>)
  // and are served back by the documents-service — fetch the real list ourselves so
  // freshly-uploaded files always appear (the parent's `deceased.documents` is often absent).
  useEffect(() => {
    if (!deceasedId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/documents/${deceasedId}`, { headers: getTenantHeaders(), withCredentials: false });
        if (!cancelled) {
          const list = res.data?.files || res.data?.data || [];
          setLocalDocs(Array.isArray(list) ? list : []);
        }
      } catch (e) { /* keep whatever the parent passed */ }
    })();
    return () => { cancelled = true; };
  }, [deceasedId]);

  const normalizeDocument = (doc = {}) => {
    const documentId = doc.document_id ?? doc.documentId ?? doc.id ?? null;
    const name = doc.original_name || doc.originalName || doc.name || doc.file_name || doc.fileName || doc.stored_name || doc.storedName || 'Untitled Document';
    const type = doc.category || doc.mime_type || doc.mimeType || doc.type || 'General';
    const uploadedAt = doc.uploaded_at || doc.uploadedAt || doc.created_at || doc.createdAt || null;

    return {
      ...doc,
      documentId,
      originalName: name,
      category: type,
      mimeType: doc.mime_type || doc.mimeType || doc.type || type,
      uploadedAt,
      uploaded_at: uploadedAt,
    };
  };

  const docs = (localDocs ?? (Array.isArray(documents) ? documents : [])).map(normalizeDocument);

  const handleUploadDocument = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !deceasedId) {
      notify.error('Upload failed', 'Missing file or deceased ID');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);

      // IMPORTANT: Content-Type must be explicitly null so the browser sets the
      // multipart/form-data header WITH the correct boundary. The global api
      // instance defaults to application/json which would otherwise override the
      // browser's automatic Content-Type and break multer parsing on the backend.
      const headers = {
        'Content-Type': null,
        'x-tenant-slug': localStorage.getItem('tenantSlug') || localStorage.getItem('tenant_slug') || ''
      };
      // Only add auth headers if available (don't spread getTenantHeaders to avoid
      // inheriting the application/json Content-Type from the api instance)
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const slug = localStorage.getItem('tenantSlug');
        if (slug) headers['x-tenant-slug'] = slug;
      } catch (e) { /* localStorage may not be available */ }

      formData.append('deceasedId', String(deceasedId));

      let response;
      try {
        response = await api.post('/documents/upload', formData, {
          headers,
          withCredentials: false
        });
      } catch (uploadError) {
        if (uploadError.response?.status !== 404) throw uploadError;
        response = await api.post(`/documents/upload/${String(deceasedId)}`, formData, { headers, withCredentials: false });
      }

      if (response.data?.success || response.data?.document) {
        notify.success('Document uploaded', response.data?.message || 'Document uploaded successfully');
        const refreshed = await api.get(`/documents/${deceasedId}`, { headers: getTenantHeaders(), withCredentials: false });
        const list = refreshed.data?.files || refreshed.data?.data || [];
        setLocalDocs(Array.isArray(list) ? list : []);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        notify.error('Upload failed', response.data?.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      const status = error.response?.status;
      const msg = error.response?.data?.message;
      let title = 'Upload failed';
      let detail = 'Failed to upload document. Please try again later.';
      if (status === 400) {
        detail = msg || 'Invalid file type. Only PDFs, images, and Word documents are allowed.';
      } else if (status === 413) {
        detail = 'File is too large (max 50MB).';
      } else if (status === 404) {
        detail = msg || 'Document upload endpoint or deceased record was not found.';
      } else if (msg) {
        detail = msg;
      }
      notify.error(title, detail);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Open the Restpoint document reader as a full standalone page in a new
  // browser tab — NOT embedded in an iframe inside the deceased profile. The
  // viewer (client/public/restpoint-document-reader.html) auto-reads the auth
  // token + tenant slug from localStorage, fetches the deceased's documents
  // from the documents-service via the API gateway, and renders them with
  // PDF.js. The deceasedId acts as the session-like identifier that scopes
  // the viewer to this deceased person's document library.
  const openDocumentViewer = (doc) => {
    const normalized = normalizeDocument(doc);
    const docId = normalized?.documentId ?? normalized?.document_id ?? normalized?.id;
    const params = new URLSearchParams();
    params.set('deceasedId', deceasedId);
    if (docId) params.set('docId', docId);
    // session-like token so the URL never exposes a raw database id directly
    params.set('session', Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    window.open(`/document-read.html?${params.toString()}`, '_blank', 'noopener');
  };

  return (
    <>
      {showRouteOptimizer && <RouteOptimizer onClose={() => setShowRouteOptimizer(false)} />}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleUploadDocument}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
          <Btn
            $primary
            onClick={triggerFileUpload}
            disabled={isUploading}
            style={{ cursor: 'pointer' }}
          >
            {isUploading ? 'Uploading...' : '+ Upload Document'}
          </Btn>
        </div>
        <div style={{ fontSize: '12px', color: '#777777', fontWeight: 500 }}>
          {docs.length} document{docs.length !== 1 ? 's' : ''} uploaded
        </div>
      </div>

      {/* Keep wide document columns readable without widening the mobile page. */}
      <TableScroll>
        <DataTable>
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Type</th>
              <th>Uploaded Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: C.gray, padding: '24px 0' }}>No documents uploaded</td></tr>
            ) : docs.map((doc, i) => {
              const uploadDate = doc.uploadedAt || doc.uploaded_at || doc.created_at || doc.createdAt;
              return (
              <tr key={doc.documentId ?? doc.document_id ?? i}>
                <td style={{ fontWeight: 600 }}>{doc.originalName || 'Untitled Document'}</td>
                <td><StatusTag $info>{doc.category || doc.mimeType || 'General'}</StatusTag></td>
                <td>{uploadDate ? formatDate(uploadDate) : '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  <Btn
                    $sm
                    onClick={() => openDocumentViewer(doc)}
                    title="Open document preview in a new page"
                  >
                    <i className="far fa-images" style={{ marginRight: 5, fontSize: 11 }} /> View
                  </Btn>
                </td>
              </tr>
            );
            })}
          </tbody>
        </DataTable>
      </TableScroll>
    </>
  );
};

export default DocumentsTab;