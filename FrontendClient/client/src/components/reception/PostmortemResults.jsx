import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Download, Eye, Share2, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import './PostmortemResults.css';

const PostmortemResults = () => {
    const [deceasedId, setDeceasedId] = useState('ADM-2025-00472');
    const [results, setResults] = useState(null);
    const [toast, setToast] = useState('');

    // Mock database of postmortem results
    const postmortemDatabase = {
        'ADM-2025-00472': {
            name: 'Ochieng, James Mwangi',
            deceasedId: 'ADM-2025-00472',
            dateOfDeath: 'June 28, 2025',
            admissionDate: 'June 28, 2025',
            pathologist: 'Dr. Wanjiku Gathoni',
            autopsyStatus: 'Complete',
            reportDate: 'July 1, 2025',
            pages: 12,
            causeOfDeath: 'Acute myocardial infarction',
            findings: [
                { key: 'Heart', value: 'Severe coronary artery disease, 95% blockage of LAD' },
                { key: 'Lungs', value: 'Mild pulmonary edema, consistent with cardiac failure' },
                { key: 'Liver', value: 'Normal size and appearance' },
                { key: 'Kidneys', value: 'Bilateral renal atrophy' },
                { key: 'Toxicology', value: 'Negative for common substances' }
            ],
            conclusion: 'Death due to natural causes - Acute myocardial infarction secondary to severe coronary artery disease.',
            reportUrl: '/reports/ADM-2025-00472.pdf'
        },
        'ADM-2025-00518': {
            name: 'Mutua, Susan Njeri',
            deceasedId: 'ADM-2025-00518',
            dateOfDeath: 'July 3, 2025',
            admissionDate: 'July 3, 2025',
            pathologist: 'Dr. Ahmed Osman',
            autopsyStatus: 'Complete',
            reportDate: 'July 5, 2025',
            pages: 9,
            causeOfDeath: 'Blunt force trauma - Road Traffic Accident',
            findings: [
                { key: 'Head', value: 'Subdural hematoma, bilateral' },
                { key: 'Chest', value: 'Multiple rib fractures, bilateral pneumothorax' },
                { key: 'Abdomen', value: 'Liver laceration, Grade III' },
                { key: 'Extremities', value: 'Compound fracture, left femur' },
                { key: 'Toxicology', value: 'Blood alcohol 0.08%' }
            ],
            conclusion: 'Death due to blunt force trauma sustained in road traffic accident.',
            reportUrl: '/reports/ADM-2025-00518.pdf'
        },
        'ADM-2025-00603': {
            name: 'Kiprop, Daniel Arap',
            deceasedId: 'ADM-2025-00603',
            dateOfDeath: 'July 10, 2025',
            admissionDate: 'July 10, 2025',
            pathologist: 'Dr. Wanjiku Gathoni',
            autopsyStatus: 'Pending',
            reportDate: 'Awaiting completion',
            pages: 0,
            causeOfDeath: 'Suspected pulmonary embolism',
            findings: [
                { key: 'Lungs', value: 'Pending histology examination' },
                { key: 'Heart', value: 'Pending examination' },
                { key: 'Pelvis', value: 'Pending examination' }
            ],
            conclusion: 'Report pending completion of histology and toxicology screening.',
            reportUrl: null
        }
    };

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(''), 3000);
    };

    const handleLookup = () => {
        const record = postmortemDatabase[deceasedId.toUpperCase()];
        if (record) {
            setResults(record);
            showToast('Postmortem results loaded successfully');
        } else {
            showToast('No record found for ID: ' + deceasedId);
            setResults(null);
        }
    };

    const handleDownload = () => {
        if (results && results.reportUrl) {
            showToast('Downloading postmortem report...');
            setTimeout(() => {
                showToast('Report downloaded successfully');
            }, 1500);
        } else {
            showToast('Report not yet available');
        }
    };

    const handlePreview = () => {
        showToast('Opening report preview...');
    };

    const handleShare = () => {
        showToast('Secure share link generated');
    };

    const handleRegenQR = () => {
        showToast('New QR code generated for family access');
    };

    // Generate QR code URL - this is what clients will scan
    const getQRCodeValue = () => {
        return `${window.location.origin}/portal/reports/${deceasedId}`;
    };

    return (
        <div className="postmortem-container">
            {/* Header */}
            <div className="pm-header">
                <button className="back-btn" onClick={() => window.history.back()}>
                    <ArrowLeft size={20} strokeWidth={2} />
                    <span>Back</span>
                </button>
                <div className="pm-title">
                    <FileText size={24} />
                    <h1>Postmortem Results</h1>
                </div>
            </div>

            {/* QR Code Display Section */}
            <div className="pm-qr-section">
                <div className="qr-card">
                    <h2>Client QR Code</h2>
                    <p className="qr-instruction">Clients scan this QR code with their phone camera to view postmortem results</p>

                    <div className="qr-code-wrapper">
                        <QRCodeSVG
                            value={getQRCodeValue()}
                            size={280}
                            level="H"
                            includeMargin
                            bgColor="#FFFFFF"
                            fgColor="#2C2820"
                        />
                    </div>

                    <div className="qr-id-display">
                        <label>Deceased ID:</label>
                        <input
                            type="text"
                            value={deceasedId}
                            onChange={(e) => setDeceasedId(e.target.value.toUpperCase())}
                            placeholder="ADM-2025-00472"
                        />
                        <button className="btn-generate" onClick={handleLookup}>
                            Generate QR
                        </button>
                    </div>

                    <div className="qr-url-preview">
                        <strong>QR Code URL:</strong>
                        <code>{getQRCodeValue()}</code>
                    </div>
                </div>
            </div>

            {/* Results View (shown after lookup) */}
            {results && (
                <div className="pm-results-view">
                    <div className="results-header">
                        <div className="status-badge">
                            <CheckCircle size={16} />
                            <span>{results.autopsyStatus}</span>
                        </div>
                        <h2>Postmortem Report</h2>
                    </div>

                    {/* Profile Card */}
                    <div className="profile-card">
                        <h3 className="profile-name">{results.name}</h3>
                        <div className="profile-details">
                            <div className="detail-item">
                                <span className="label">Deceased ID</span>
                                <span className="value">{results.deceasedId}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Date of Death</span>
                                <span className="value">{results.dateOfDeath}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Pathologist</span>
                                <span className="value">{results.pathologist}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Report Date</span>
                                <span className="value">{results.reportDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Report Preview Card */}
                    <div className="preview-card" onClick={handlePreview}>
                        <div className="preview-icon">
                            <FileText size={32} />
                        </div>
                        <div className="preview-info">
                            <h4>Full Autopsy Report</h4>
                            <p>{results.pages} pages · PDF · Digitally Signed</p>
                        </div>
                        <div className="preview-arrow">
                            <Eye size={20} />
                        </div>
                    </div>

                    {/* Findings Summary */}
                    <div className="findings-card">
                        <h4>Findings Summary</h4>
                        <div className="findings-list">
                            {results.findings.map((finding, index) => (
                                <div key={index} className="finding-item">
                                    <div className="finding-key">{finding.key}</div>
                                    <div className="finding-value">{finding.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cause of Death */}
                    <div className="cause-card">
                        <h4>Cause of Death</h4>
                        <p className="cause-text">{results.causeOfDeath}</p>
                    </div>

                    {/* Conclusion */}
                    <div className="conclusion-card">
                        <h4>Conclusion</h4>
                        <p>{results.conclusion}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button className="btn-action btn-preview" onClick={handlePreview}>
                            <Eye size={18} />
                            Preview
                        </button>
                        <button
                            className="btn-action btn-download"
                            onClick={handleDownload}
                            disabled={!results.reportUrl}
                        >
                            <Download size={18} />
                            Download
                        </button>
                        <button className="btn-action btn-share" onClick={handleShare}>
                            <Share2 size={18} />
                            Share
                        </button>
                    </div>

                    {/* QR Regeneration */}
                    <div className="qr-regen">
                        <button onClick={handleRegenQR}>
                            <RefreshCw size={16} />
                            Generate New QR for Family Access
                        </button>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="toast-notification">
                    {toast}
                </div>
            )}
        </div>
    );
};

export default PostmortemResults;