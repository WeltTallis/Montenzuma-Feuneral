const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ═══════════════════════════════════════════════════════════════
// DUMMY DATA — with real signature file
// ═══════════════════════════════════════════════════════════════
const DUMMY_DATA = {
    tenant: { name: 'Rest Point Funeral Home', address: 'Moi Avenue, Nairobi, Kenya', phone: '+254 700 000 000', email: 'care@restpoint.co.ke' },
    deceased: { full_name: 'Jane Wanjiru Mwangi', admission_number: 'MON-2024-0837', date_of_birth: '1962-03-14', date_of_death: '2024-11-12', age: 62, gender: 'Female', place_of_death: 'Kenyatta National Hospital', next_of_kin_name: 'Peter Kamau Mwangi', next_of_kin_relationship: 'Son', next_of_kin_phone: '+254 712 345 678', next_of_kin_id_number: '29876543', national_id: '29876543' },
    postmortem: {
        status: 'completed',
        completed_at: '2024-11-13T10:30:00.000Z',
        pathologist_name: 'Dr. Amina S. Karanja',
        pathologist_credentials: 'MBChB, MMed (Pathology)',
        pathologist_license: 'KMPDB/A/9482',
        manner_of_death: 'Natural Causes',
        immediate_cause_of_death: 'Cardiac Arrest',
        underlying_cause_of_death: 'Hypertensive Heart Disease with Coronary Artery Atherosclerosis',
        examination_summary: 'External examination revealed a well-nourished adult female consistent with the reported age. Internal examination confirmed significant hypertrophy of the left ventricle with marked coronary artery atherosclerosis (>75% occlusion of the LAD). No evidence of trauma, foul play, or acute intoxication was identified. The findings are consistent with a cardiac event of natural etiology arising from long-standing hypertensive and atherosclerotic cardiovascular disease.',
        // ── Use real signature file ──
        signature: 'C:\\Users\\User\\Downloads\\restpoint\\FrontendClient\\client\\public\\sig_MON-PETDG4TPYRAHWHK2QVS2026.png',
    },
    verifiedAt: '2024-11-15T14:32:07.412Z',
    sessionId: '7f3a-9c21-eb88',
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function fmtLong(iso) { if (!iso) return 'N/A'; return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
function fmtShort(iso) { if (!iso) return 'N/A'; return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
function esc(s) { if (s == null) return 'N/A'; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function generateBarcodeBars() {
    var p = [
        [8,false],[3,true],[1,false],[1,true],[1,false],[3,true],[2,false],
        [1,true],[2,false],[3,true],[1,false],[2,true],[2,false],
        [1,true],[3,false],[2,true],[1,false],[3,true],[1,false],
        [2,true],[1,false],[1,true],[3,false],[3,true],[2,false],
        [1,true],[2,false],[2,true],[1,false],[3,true],[3,false],
        [2,true],[1,false],[1,true],[2,false],[3,true],[1,false],
        [1,true],[3,false],[3,true],[1,false],[2,true],[2,false],
        [3,true],[1,false],[1,true],[2,false],[2,true],[3,false],
        [1,true],[1,false],[3,true],[2,false],[2,true],[1,false],
        [3,true],[2,false],[1,true],[3,false],[2,true],[1,false],
        [1,true],[2,false],[3,true],[1,false],[2,true],[3,false],
        [2,false],[3,true],[1,false],[1,true],[1,false],[3,true],[8,false],
    ];
    var html = '';
    for (var i = 0; i < p.length; i++) {
        var w = Math.max(1, p[i][0]);
        if (p[i][1]) { html += '<div style="width:' + w + 'px;background:#1a1a1a;height:100%;flex-shrink:0;"></div>'; }
        else { html += '<div style="width:' + w + 'px;height:100%;flex-shrink:0;"></div>'; }
    }
    return html;
}

function fetchLogoBase64(url) {
    return new Promise(function (resolve) {
        var req = https.get(url, { timeout: 8000 }, function (res) {
            if (res.statusCode !== 200) { resolve(null); return; }
            var chunks = [];
            res.on('data', function (chunk) { chunks.push(chunk); });
            res.on('end', function () { resolve('data:image/png;base64,' + Buffer.concat(chunks).toString('base64')); });
        });
        req.on('error', function () { resolve(null); });
        req.on('timeout', function () { req.destroy(); resolve(null); });
    });
}

// ── Load local signature file as base64 ──
function loadSignatureBase64(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log('  Signature file not found, will use fallback');
            return null;
        }
        var buffer = fs.readFileSync(filePath);
        var base64 = 'data:image/png;base64,' + buffer.toString('base64');
        console.log('  Signature loaded (' + Math.round(base64.length / 1024) + ' KB)');
        return base64;
    } catch (e) {
        console.log('  Signature load failed: ' + e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// HTML — fixed height 297mm + overflow hidden = GUARANTEED 1 page
// ═══════════════════════════════════════════════════════════════
function buildHtml(data, logoBase64, signatureBase64) {
    var tenant = data.tenant, deceased = data.deceased, postmortem = data.postmortem, verifiedAt = data.verifiedAt;
    var examDate = fmtLong(postmortem && postmortem.completed_at);
    var signedDate = fmtShort(postmortem && postmortem.completed_at);
    var verifiedDate = fmtShort(verifiedAt);
    var issuedDate = fmtLong(new Date().toISOString());

    // ── Signature: use base64 if provided, otherwise fallback to script font ──
    var pathSig;
    if (signatureBase64) {
        pathSig = '<img src="' + signatureBase64 + '" alt="Signature" style="max-width:100%;max-height:38px;object-fit:contain;" />';
    } else {
        var sn = (postmortem && postmortem.pathologist_name || 'Pathologist').replace(/^Dr\.\s*/i, '').split(' ').slice(0, 2).join(' ');
        pathSig = esc(sn);
    }

    var logoHtml = logoBase64 ? '<img src="' + logoBase64 + '" alt="Logo" style="height:50px;width:auto;max-width:115px;object-fit:contain;" />' : '';
    var barcodeBars = generateBarcodeBars();

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<style>\n'
        + '@page { size: A4; margin: 0; }\n'
        + '* { box-sizing: border-box; margin: 0; padding: 0; }\n'
        + 'html, body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; color: #3a3530; background: #fbfaf7; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; font-size: 15px; }\n'
        + '.sheet { width: 210mm; height: 297mm; overflow: hidden; display: flex; flex-direction: column; background: #fbfaf7; position: relative; }\n'
        + '.sheet-inner { padding: 28px 40px 0; position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; }\n'
        + '.top-rule { width: 100%; height: 1px; background: #1a1a1a; position: relative; opacity: 0.8; }\n'
        + '.top-rule::after { content: ""; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100px; height: 1px; background: #a8906a; opacity: 0.7; }\n'
        + '.top-ornament { text-align: center; margin: 6px 0 7px; color: #a8906a; font-size: 0.68rem; opacity: 0.35; letter-spacing: 0.8em; }\n'
        + '.letterhead { display: flex; flex-direction: column; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid #e8e0d4; position: relative; z-index: 1; }\n'
        + '.home-name { width: 100%; }\n'
        + '.home-name h2 { font-family: "Segoe UI", sans-serif; margin: 0; font-size: 1.38rem; font-weight: 700; color: #1a1a1a; letter-spacing: 0.04em; line-height: 1.15; text-transform: uppercase; }\n'
        + '.letterhead-row { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; }\n'
        + '.logo-left { display: flex; align-items: center; gap: 14px; }\n'
        + '.logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }\n'
        + '.logo-text .address { font-size: 0.66rem; color: #8a7d6e; font-style: normal; font-family: Consolas, "Courier New", monospace; line-height: 1.45; letter-spacing: 0.02em; font-weight: 600; }\n'
        + '.letterhead-right { text-align: right; font-family: Consolas, "Courier New", monospace; font-size: 0.68rem; }\n'
        + '.ref-label { font-family: "Segoe UI", sans-serif; font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.22em; color: #1a1a1a; margin-bottom: 4px; font-weight: 700; }\n'
        + '.ref-number { font-family: Georgia, serif; font-size: 1.05rem; font-weight: 700; color: #1a1a1a; font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }\n'
        + '.ref-date { margin-top: 5px; color: #8a7d6e; font-size: 0.64rem; font-weight: 600; }\n'
        + '.intro-block { margin: 18px 0 20px; position: relative; z-index: 1; padding-left: 15px; border-left: 3px solid #7c2b23; }\n'
        + '.intro-block .dear { font-family: Georgia, serif; font-size: 1rem; font-weight: 700; color: #3a3530; margin-bottom: 7px; }\n'
        + '.intro-block .body-text { font-family: Georgia, serif; font-size: 0.92rem; line-height: 1.6; color: #3a3530; font-weight: 700; max-width: 95%; }\n'
        + '.intro-block .body-text .name { font-style: italic; font-weight: 700; color: #7c2b23; }\n'
        + '.data-heading { display: flex; align-items: center; gap: 9px; font-family: "Segoe UI", sans-serif; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 700; color: #3a3530; margin-bottom: 11px; }\n'
        + '.data-heading::after { content: ""; flex: 1; height: 1px; background: linear-gradient(to right, #a8906a, transparent); opacity: 0.5; }\n'
        + '.data-heading .icon-chip { width: 20px; height: 20px; background: rgba(168,144,106,0.08); display: flex; align-items: center; justify-content: center; color: #a8906a; font-size: 8px; flex-shrink: 0; border: 1px solid rgba(168,144,106,0.18); border-radius: 50%; }\n'
        + '.dual-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px; margin-bottom: 18px; position: relative; z-index: 1; page-break-inside: avoid; }\n'
        + '.data-section { position: relative; z-index: 1; page-break-inside: avoid; }\n'
        + '.dual-sections .info-grid { display: grid; grid-template-columns: 1fr; gap: 7px; }\n'
        + '.info-grid.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 9px 32px; }\n'
        + '.info-row { display: flex; flex-direction: column; gap: 2px; padding-bottom: 7px; border-bottom: 1px dotted #ddd4c6; }\n'
        + '.info-row.full { grid-column: 1 / -1; }\n'
        + '.info-row label { font-family: "Segoe UI", sans-serif; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.12em; color: #6b6157; font-weight: 700; }\n'
        + '.info-row span { font-family: Georgia, serif; font-size: 0.96rem; color: #3a3530; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: 0.01em; line-height: 1.28; }\n'
        + '.summary-box { margin: 14px 0; padding: 14px 18px; background: #f6f2ea; border-left: 4px solid #7c2b23; position: relative; page-break-inside: avoid; border-radius: 0 4px 4px 0; }\n'
        + '.summary-box::after { content: ""; position: absolute; top: 0; right: 0; width: 24px; height: 24px; border-top: 1px solid #a8906a; border-right: 1px solid #a8906a; opacity: 0.25; border-radius: 0 4px 0 0; }\n'
        + '.summary-box::before { content: "\\2767"; font-family: Georgia, serif; font-size: 1.2rem; color: #a8906a; position: absolute; top: 8px; right: 14px; opacity: 0.4; }\n'
        + '.summary-box strong { display: block; margin-bottom: 6px; font-family: Georgia, serif; font-size: 0.96rem; color: #3a3530; font-weight: 700; }\n'
        + '.summary-box p { margin: 0; font-family: Georgia, serif; font-size: 0.84rem; line-height: 1.6; color: #3a3530; font-weight: 600; }\n'
        + '.bottom-section { background: #ffffff; padding: 22px 40px 20px; position: relative; z-index: 1; border-top: 1px solid #e8e0d4; page-break-inside: avoid; margin-top: auto; }\n'
        + '.signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 34px; position: relative; z-index: 1; page-break-inside: avoid; align-items: start; }\n'
        + '.signatures::before { content: ""; position: absolute; top: -12px; left: 0; right: 0; height: 1px; background: linear-gradient(to right, transparent, #a8906a, transparent); opacity: 0.4; }\n'
        + '.sig-block { display: flex; flex-direction: column; min-width: 0; }\n'
        + '.sig-script { font-family: "Brush Script MT", "Lucida Handwriting", cursive; font-size: 1.95rem; color: #3a3530; line-height: 1; margin-bottom: 4px; min-height: 35px; font-weight: 400; word-break: break-word; }\n'
        + '.sig-line { border-top: 1px solid #1a1a1a; padding-top: 4px; margin-bottom: 5px; opacity: 0.5; }\n'
        + '.sig-name { font-family: Georgia, serif; font-weight: 700; font-size: 0.88rem; color: #3a3530; letter-spacing: 0.02em; }\n'
        + '.sig-title { font-family: Georgia, serif; font-size: 0.74rem; color: #6b6157; margin-top: 2px; font-style: italic; font-weight: 600; }\n'
        + '.sig-meta { margin-top: 4px; font-family: Consolas, "Courier New", monospace; font-size: 0.6rem; color: #8a7d6e; line-height: 1.5; letter-spacing: 0.02em; font-weight: 600; }\n'
        + '.barcode-wrap { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; min-width: 0; }\n'
        + '.barcode { display: flex; align-items: flex-start; gap: 0; height: 42px; padding: 2px 4px; background: #fff; border: 1px solid #e8e0d4; max-width: 100%; overflow: hidden; }\n'
        + '.barcode-text { font-family: Consolas, "Courier New", monospace; font-size: 0.68rem; font-weight: 700; color: #1a1a1a; letter-spacing: 0.15em; text-align: left; padding-left: 4px; }\n'
        + '.family-contact { margin-top: 10px; padding-top: 7px; border-top: 1px dotted #ddd4c6; width: 100%; max-width: 100%; overflow: hidden; }\n'
        + '.family-contact .fc-heading { font-family: "Segoe UI", sans-serif; font-size: 0.52rem; text-transform: uppercase; letter-spacing: 0.18em; color: #6b6157; font-weight: 700; margin-bottom: 5px; }\n'
        + '.family-contact .fc-grid { display: grid; grid-template-columns: 1fr; gap: 1px; }\n'
        + '.family-contact .fc-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 2px 0; min-width: 0; }\n'
        + '.family-contact .fc-row .fc-label { font-family: "Segoe UI", sans-serif; font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.1em; color: #6b6157; font-weight: 700; flex-shrink: 0; white-space: nowrap; }\n'
        + '.family-contact .fc-row .fc-value { font-family: Georgia, serif; font-size: 0.76rem; color: #3a3530; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n'
        + '.bottom-ornament { text-align: center; margin-top: 18px; padding-top: 13px; border-top: 1px solid #e8e0d4; position: relative; z-index: 1; }\n'
        + '.bottom-ornament .closing { font-family: Georgia, serif; font-size: 0.84rem; font-style: italic; color: #8a7d6e; font-weight: 700; letter-spacing: 0.02em; }\n'
        + '.bottom-ornament .closing .leaf { color: #a8906a; opacity: 0.5; margin: 0 8px; }\n'
        + '</style>\n</head>\n<body>\n'
        + '<div class="sheet">\n'
        + '  <div class="sheet-inner">\n'
        + '    <div class="top-rule"></div>\n'
        + '    <div class="top-ornament">&#10087;</div>\n'
        + '    <header class="letterhead">\n'
        + '      <div class="home-name"><h2>' + esc(tenant && tenant.name) + '</h2></div>\n'
        + '      <div class="letterhead-row">\n'
        + '        <div class="logo-left">\n'
        + '          <div class="logo">' + logoHtml + '</div>\n'
        + '          <div class="logo-text"><address class="address">' + esc(tenant && tenant.address) + (tenant && tenant.phone ? '<br>Tel: ' + esc(tenant.phone) : '') + (tenant && tenant.email ? ' &middot; ' + esc(tenant.email) : '') + '</address></div>\n'
        + '        </div>\n'
        + '        <div class="letterhead-right">\n'
        + '          <div class="ref-label">Case Reference</div>\n'
        + '          <div class="ref-number">' + esc(deceased && deceased.admission_number) + '</div>\n'
        + '          <div class="ref-date">Issued: ' + issuedDate + '</div>\n'
        + '        </div>\n'
        + '      </div>\n'
        + '    </header>\n'
        + '    <div class="intro-block">\n'
        + '      <div class="dear">Dear Family,</div>\n'
        + '      <div class="body-text">Please find enclosed the postmortem examination report for <span class="name">' + esc(deceased && deceased.full_name) + '</span>. This document has been prepared with care by the attending pathologist and verified by our records team.</div>\n'
        + '    </div>\n'
        + '    <div class="dual-sections">\n'
        + '      <section class="data-section">\n'
        + '        <div class="data-heading"><span class="icon-chip">&#10087;</span>About Your Loved One</div>\n'
        + '        <div class="info-grid">\n'
        + '          <div class="info-row"><label>Full Name</label><span>' + esc(deceased && deceased.full_name) + '</span></div>\n'
        + '          <div class="info-row"><label>Date of Passing</label><span>' + fmtLong(deceased && deceased.date_of_death) + '</span></div>\n'
        + '          <div class="info-row"><label>Age &amp; Gender</label><span>' + (deceased && deceased.age ? deceased.age + ' Years' : 'N/A') + ' &middot; ' + esc(deceased && deceased.gender) + '</span></div>\n'
        + '        </div>\n'
        + '      </section>\n'
        + '      <section class="data-section">\n'
        + '        <div class="data-heading"><span class="icon-chip">&#10087;</span>Requesting Authority</div>\n'
        + '        <div class="info-grid">\n'
        + '          <div class="info-row"><label>Name</label><span>' + esc(deceased && deceased.next_of_kin_name) + '</span></div>\n'
        + '          <div class="info-row"><label>Role</label><span>' + esc(deceased && deceased.next_of_kin_relationship) + '</span></div>\n'
        + '          <div class="info-row"><label>Telephone</label><span>' + esc(deceased && (deceased.next_of_kin_phone || deceased.phone_number)) + '</span></div>\n'
        + '        </div>\n'
        + '      </section>\n'
        + '    </div>\n'
        + '    <section class="data-section">\n'
        + '      <div class="data-heading"><span class="icon-chip">&#10087;</span>Examination Report</div>\n'
        + '      <div class="info-grid two-col">\n'
        + '        <div class="info-row"><label>Date of Examination</label><span>' + examDate + '</span></div>\n'
        + '        <div class="info-row"><label>Attending Pathologist</label><span>' + esc(postmortem && postmortem.pathologist_name) + '</span></div>\n'
        + '        <div class="info-row"><label>Manner of Passing</label><span>' + esc(postmortem && postmortem.manner_of_death) + '</span></div>\n'
        + '        <div class="info-row"><label>Immediate Cause</label><span>' + esc(postmortem && postmortem.immediate_cause_of_death) + '</span></div>\n'
        + '        <div class="info-row full"><label>Underlying Cause</label><span>' + esc(postmortem && postmortem.underlying_cause_of_death) + '</span></div>\n'
        + '      </div>\n'
        + (postmortem && postmortem.examination_summary ? '      <div class="summary-box"><strong>Examination Summary</strong><p>' + esc(postmortem.examination_summary) + '</p></div>\n' : '')
        + '    </section>\n'
        + '  </div>\n'
        + '  <div class="bottom-section">\n'
        + '    <section class="signatures">\n'
        + '      <div class="sig-block">\n'
        + '        <div class="sig-script">' + pathSig + '</div>\n'
        + '        <div class="sig-line"></div>\n'
        + '        <div class="sig-name">' + esc(postmortem && (postmortem.pathologist_name || 'Attending Pathologist')) + '</div>\n'
        + '        <div class="sig-title">' + esc(postmortem && (postmortem.pathologist_credentials || 'Pathologist')) + '</div>\n'
        + '        <div class="sig-meta">' + (postmortem && postmortem.pathologist_license ? 'License: ' + esc(postmortem.pathologist_license) + '<br>' : '') + 'Signed: ' + signedDate + '</div>\n'
        + '      </div>\n'
        + '      <div class="barcode-wrap">\n'
        + '        <div class="barcode">' + barcodeBars + '</div>\n'
        + '        <div class="barcode-text">' + esc(deceased && deceased.admission_number) + '</div>\n'
        + '        <div class="family-contact">\n'
        + '          <div class="fc-heading">Next of Kin</div>\n'
        + '          <div class="fc-grid">\n'
        + '            <div class="fc-row"><span class="fc-label">Name</span><span class="fc-value">' + esc(deceased && deceased.next_of_kin_name) + '</span></div>\n'
        + '            <div class="fc-row"><span class="fc-label">Relationship</span><span class="fc-value">' + esc(deceased && deceased.next_of_kin_relationship) + '</span></div>\n'
        + '            <div class="fc-row"><span class="fc-label">Telephone</span><span class="fc-value">' + esc(deceased && (deceased.next_of_kin_phone || deceased.phone_number)) + '</span></div>\n'
        + '            <div class="fc-row"><span class="fc-label">Verified</span><span class="fc-value">' + verifiedDate + '</span></div>\n'
        + '          </div>\n'
        + '        </div>\n'
        + '      </div>\n'
        + '    </section>\n'
        + '    <div class="bottom-ornament"><div class="closing"><span class="leaf">&#10087;</span>With our deepest sympathies<span class="leaf">&#10087;</span></div></div>\n'
        + '  </div>\n'
        + '</div>\n'
        + '</body>\n</html>';
}

// ═══════════════════════════════════════════════════════════════
// PDF GENERATION
// ═══════════════════════════════════════════════════════════════
async function generatePostmortemPDF(data, outputPath) {
    var browser;
    try {
        // ── 1. Load signature from local file ──
        console.log('  [1/7] Loading signature file...');
        var signatureBase64 = null;
        if (data.postmortem && data.postmortem.signature) {
            signatureBase64 = loadSignatureBase64(data.postmortem.signature);
        }
        if (!signatureBase64) {
            console.log('  Using script font fallback for signature');
        }

        // ── 2. Fetch logo ──
        console.log('  [2/7] Fetching logo...');
        var logoBase64 = await fetchLogoBase64('https://lf.services/wp-content/uploads/2024/09/LFS-Logo2-e1725725010766.png');
        console.log('  ' + (logoBase64 ? 'OK (' + Math.round(logoBase64.length / 1024) + ' KB)' : 'Failed — skipping'));

        // ── 3. Launch Puppeteer ──
        console.log('  [3/7] Launching Puppeteer...');
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'] });

        var page = await browser.newPage();

        // Block ALL external requests — logo + signature are embedded as base64
        await page.setRequestInterception(true);
        page.on('request', function (req) {
            var url = req.url();
            if (url.indexOf('data:') === 0 || url.indexOf('about:') === 0 || url.indexOf('file:') === 0) { req.continue(); }
            else { req.abort(); }
        });

        // ── 4. Viewport ──
        console.log('  [4/7] Viewport...');
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

        // ── 5. HTML ──
        console.log('  [5/7] HTML content...');
        await page.setContent(buildHtml(data, logoBase64, signatureBase64), { waitUntil: 'domcontentloaded', timeout: 15000 });

        // ── 6. Settle ──
        console.log('  [6/7] Settle (500ms)...');
        await new Promise(function (r) { setTimeout(r, 500); });

        // ── 7. PDF ──
        console.log('  [7/7] PDF...');
        await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }, preferCSSPageSize: true });

        var size = fs.statSync(outputPath).size;
        console.log('\n  +-------------------------------------------+');
        console.log('  | PDF generated! 1 page guaranteed.           |');
        console.log('  +-------------------------------------------+');
        console.log('  | File: ' + outputPath);
        console.log('  | Size: ' + (size / 1024).toFixed(1) + ' KB');
        console.log('  | Signature: ' + (signatureBase64 ? 'Embedded' : 'Fallback (script font)'));
        console.log('  | Logo: ' + (logoBase64 ? 'Embedded' : 'Missing'));
        console.log('  +-------------------------------------------+\n');
    } catch (err) {
        console.error('\n  X  Failed:', err.message);
        throw err;
    } finally {
        if (browser) { await browser.close(); console.log('  Browser closed.'); }
    }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
(async function () {
    console.log('\n  ===============================================');
    console.log('  |  Postmortem PDF — With Real Signature       |');
    console.log('  ===============================================\n');

    var outputPath = path.join(__dirname, 'postmortem-report.pdf');
    try {
        await generatePostmortemPDF(DUMMY_DATA, outputPath);
        console.log('  Done! Open postmortem-report.pdf\n');
    } catch (err) {
        console.error('  Failed:', err.message);
        process.exit(1);
    }
})();