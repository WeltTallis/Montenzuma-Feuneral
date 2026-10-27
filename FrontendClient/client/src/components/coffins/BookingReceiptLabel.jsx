import React, { useEffect, useMemo, useRef } from 'react';
import bwipjs from '@bwip-js/browser';
import { format } from 'date-fns';
import { useTenantStore } from '../../modules/seo/useTenantStore';
import { resolveTenantBranding } from '../../utils/tenantResolver/tenantBranding';

//Booking receipt label — opened from the reservation detail side panel

const PAY = {
  paid: { badge: 'mz-rct-badge-paid', label: 'Paid' },
  deposited: { badge: 'mz-rct-badge-deposited', label: 'Deposited' },
  unpaid: { badge: 'mz-rct-badge-reserved', label: 'Reserved' },
};

/* Escape a value before it goes into the HTML string (client names, notes …). */
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* Code 128 accepts a limited character set, so sanitise the booking id. */
function barcodeTextFor(booking) {
  var raw = booking && (booking.id || booking.order_id || booking.orderId);
  var clean = String(raw == null ? '' : raw).replace(/[^A-Za-z0-9-]/g, '');
  return clean || 'BOOKING';
}

/* ── Shared styles: used by BOTH the on-screen preview and the print iframe ── */
var RECEIPT_CSS = `
.mz-rct-receipt {
  width: 100%; max-width: 420px; background: #ffffff; color: #1a1a1a;
  border-radius: 20px; padding: 36px 28px 28px; position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,.08);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
/* Perforation cutouts on the sides (paper receipt effect) */
.mz-rct-receipt::before, .mz-rct-receipt::after {
  content: ''; position: absolute; width: 24px; height: 24px;
  background: #f5f5f7; border-radius: 50%; top: 50%; transform: translateY(-50%);
}
.mz-rct-receipt::before { left: -12px; }
.mz-rct-receipt::after { right: -12px; }

.mz-rct-hdr { text-align: center; margin-bottom: 24px; }
.mz-rct-brandmark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 56px; height: 56px; background: #1a1d29; border-radius: 16px; margin-bottom: 12px;
}
.mz-rct-brandmark svg { width: 32px; height: 32px; }
.mz-rct-brandname { font-size: 26px; font-weight: 800; color: #1a1a1a; letter-spacing: 2.5px; margin-bottom: 4px; }
.mz-rct-brandsub { font-size: 11px; font-weight: 500; color: #6b7280; letter-spacing: 1.5px; text-transform: uppercase; }

.mz-rct-summary {
  background: #f3f4f6; border-radius: 14px; padding: 14px 16px; margin-bottom: 20px;
  display: flex; align-items: center; gap: 14px; position: relative;
}
.mz-rct-cicon {
  width: 48px; height: 48px; background: #1a1d29; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mz-rct-cicon svg { width: 26px; height: 26px; }
.mz-rct-cinfo { flex: 1; min-width: 0; }
.mz-rct-model { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 2px; }
.mz-rct-meta, .mz-rct-qty { font-size: 11px; color: #6b7280; margin-top: 2px; }

.mz-rct-badge {
  position: absolute; top: 10px; right: 10px; font-size: 9px; font-weight: 700;
  letter-spacing: 1px; text-transform: uppercase; padding: 4px 9px; border-radius: 999px;
}
.mz-rct-badge-reserved { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.mz-rct-badge-paid { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.mz-rct-badge-deposited { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }

.mz-rct-divider { border: none; border-top: 1.5px dotted #d1d5db; margin: 20px 0; }

.mz-rct-rows { display: flex; flex-direction: column; gap: 14px; }
.mz-rct-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.mz-rct-row .lbl { font-size: 12px; color: #6b7280; flex-shrink: 0; }
.mz-rct-row .val { font-size: 13px; font-weight: 600; color: #1a1a1a; text-align: right; word-break: break-word; }
.mz-rct-row .val.mono { font-family: 'Courier New', monospace; letter-spacing: .3px; }

.mz-rct-amount { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.mz-rct-amount .lbl { font-size: 13px; color: #6b7280; font-weight: 600; }
.mz-rct-amount .val { font-size: 24px; font-weight: 800; letter-spacing: -.5px; color: #1a1a1a; }

.mz-rct-status {
  display: flex; align-items: center; gap: 12px; background: #f3f4f6;
  border-radius: 14px; padding: 12px 14px; margin-bottom: 20px;
}
.mz-rct-statusicon { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.mz-rct-circle { width: 16px; height: 16px; border-radius: 50%; }
.mz-rct-circle.red { background: #ef4444; }
.mz-rct-circle.green { background: #22c55e; }
.mz-rct-statuslabel { font-size: 13px; font-weight: 700; color: #1a1a1a; }
.mz-rct-statusts { font-size: 11px; color: #6b7280; font-family: 'Courier New', monospace; }

.mz-rct-barcode-sec { text-align: center; margin-bottom: 18px; }
.mz-rct-bc { display: flex; justify-content: center; min-height: 58px; margin-bottom: 6px; }
.mz-rct-bc canvas, .mz-rct-bc img { display: block; margin: 0 auto; max-width: 100%; }
.mz-rct-bcnum {
  font-family: 'Courier New', monospace; font-size: 13px; font-weight: 700;
  letter-spacing: .28em; color: #1a1a1a;
}
.mz-rct-foot {
  text-align: center; font-size: 10.5px; line-height: 1.6; color: #6b7280;
  border-top: 1.5px dotted #d1d5db; padding-top: 14px;
}
.mz-rct-foot a { color: #6b7280; }
`;

function fmt12(t) {
  var m = String(t || '').match(/(\d{1,2}):(\d{2})/);
  if (!m) return '';
  var h = parseInt(m[1], 10);
  var ap = h >= 12 ? 'PM' : 'AM';
  var h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ':' + m[2] + ' ' + ap;
}

/* ── Modal chrome (preview only — never printed) ─────────────────────────── */
var MODAL_CSS = `
.mz-rct-ov {
  position: fixed; inset: 0; z-index: 130; overflow-y: auto; padding: 24px;
  background: rgba(17,24,39,.55); backdrop-filter: blur(4px);
  display: flex; align-items: flex-start; justify-content: center;
}
.mz-rct-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; max-width: 100%; }
.mz-rct-tools { display: flex; gap: 8px; }
.mz-rct-tools button {
  border: none; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 6px;
  transition: all .12s;
}
.mz-rct-tools .go { background: #1a1d29; color: #fff; }
.mz-rct-tools .go:hover { background: #2a2f45; }
.mz-rct-tools .no { background: #fff; color: #374151; border: 1px solid #e5e7eb; }
.mz-rct-tools .no:hover { color: #111827; border-color: #9ca3af; }
.mz-rct-preview { background: #f5f5f7; padding: 4px; border-radius: 24px; }
`;

/* The printed document: just the receipt, centred, colour-accurate. */
var PRINT_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #fff; padding: 0; display: block;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .mz-rct-printwrap { display: flex; justify-content: center; padding: 0; }
  @page { size: auto; margin: 10mm; }
` + RECEIPT_CSS;

/* Build the receipt markup. Shared by preview and print. */
function receiptHtml(b, fmt, printedAt, barcodeText) {
  var pay = PAY[b.status] || PAY.unpaid;
  var price = Number(b.price || 0);
  var collected = b.status === 'paid' ? price
    : b.status === 'deposited' ? Math.min(Number(b.deposit || 0), price)
      : 0;
  var balance = Math.max(price - collected, 0);
  var dateStr = b.date ? format(b.date, 'dd MMM yyyy') : '—';
  var timeStr = b.time ? fmt12(b.time) + ' EAT' : '—';
  var rows = [
    ['Receipt ID', barcodeText, true],
    ['Customer', b.clientName || '—', false],
    ['Phone', b.phone || '—', true],
    ['Deceased', b.deceasedName || '—', false],
    ['Reservation Date', dateStr, true],
    ['Reservation Time', timeStr, true],
  ];
  var coffinSvg =
    '<svg viewBox="0 0 24 24" fill="none" stroke="#f4d03f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M8 3h8l2.5 5v11a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2V8z"/>' +
    '<line x1="12" y1="10" x2="12" y2="20"/>' +
    '<line x1="9.5" y1="13" x2="14.5" y2="13"/>' +
    '</svg>';

  return '' +
    '<div class="mz-rct-receipt">' +
    '<div class="mz-rct-hdr">' +
    '<div class="mz-rct-brandmark">' + coffinSvg + '</div>' +
    '<div class="mz-rct-brandname">' + (brand?.name || 'tenant') + '</div>' +

    '<div class="mz-rct-summary">' +
    '<div class="mz-rct-cicon">' + coffinSvg + '</div>' +
    '<div class="mz-rct-cinfo">' +
    '<p class="mz-rct-model">' + esc(b.coffinType || 'Coffin') + '</p>' +
    '<p class="mz-rct-meta">' + esc(b.phone ? 'Client phone ' + b.phone : 'Coffin reservation') + '</p>' +
    '<p class="mz-rct-qty">Quantity: 1' + (b.notes ? ' &middot; ' + esc(b.notes) : '') + '</p>' +
    '</div>' +
    '<span class="mz-rct-badge ' + pay.badge + '">' + esc(pay.label) + '</span>' +
    '</div>' +

    '<hr class="mz-rct-divider">' +

    '<div class="mz-rct-rows">' +
    rows.map(function (r) {
      return '<div class="mz-rct-row"><span class="lbl">' + esc(r[0]) + '</span>' +
        '<span class="val' + (r[2] ? ' mono' : '') + '">' + esc(r[1]) + '</span></div>';
    }).join('') +
    '<div class="mz-rct-row"><span class="lbl">Coffin Price</span><span class="val">' + esc(fmt(price)) + '</span></div>' +
    '<div class="mz-rct-row"><span class="lbl">Balance Due</span><span class="val">' + esc(fmt(balance)) + '</span></div>' +
    '</div>' +

    '<hr class="mz-rct-divider">' +

    '<div class="mz-rct-amount">' +
    '<span class="lbl">Amount Paid</span>' +
    '<span class="val">' + esc(fmt(collected)) + '</span>' +
    '</div>' +

    '<div class="mz-rct-status">' +
    '<div class="mz-rct-statusicon">' +
    '<span class="mz-rct-circle red"></span>' +
    '<span class="mz-rct-circle green"></span>' +
    '</div>' +
    '<div>' +
    '<p class="mz-rct-statuslabel">' + esc(pay.label) +
    (b.status === 'deposited' && b.deposit > 0 ? ' &middot; ' + esc(fmt(b.deposit)) : '') +
    '</p>' +
    '<p class="mz-rct-statusts">' + esc(printedAt) + ' EAT</p>' +
    '</div>' +
    '</div>' +

    '<div class="mz-rct-barcode-sec">' +
    '<div class="mz-rct-bc" data-code="' + esc(barcodeText) + '"></div>' +
    '<div class="mz-rct-bcnum">' + esc(barcodeText) + '</div>' +
    '</div>' +

    'For inquiries, contact ' +
    '<a href="https://montezumamonalisa.com/support" target="_blank" style="text-decoration:none;">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5px;">' +
    '<circle cx="12" cy="12" r="10"/>' +
    '<path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4"/>' +
    '<path d="M12 17h.01"/>' +
    '</svg>' +
    'https://montezumamonalisa.com/support</a>' +
    ' or call ' +
    '<a href="tel:+254722827652" style="text-decoration:none;white-space:nowrap;">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5px;">' +
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.79a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.34 1.83.58 2.79.7A2 2 0 0 1 22 16.92z"/>' +
    '</svg>' +
    '+254 722 827 652</a><br>' +
    '</p>' +
    '</div>';
}

export default function BookingReceiptLabel({ booking, money, onClose }) {
  var rootRef = useRef(null);
  var fmt = typeof money === 'function' ? money : function (n) { return 'KES ' + Number(n || 0).toLocaleString(); };
  var { tenantData } = useTenantStore();
  var brand = useMemo(function () { return resolveTenantBranding(tenantData); }, [tenantData]);
  var barcodeText = useMemo(function () { return barcodeTextFor(booking); }, [booking]);
  var printedAt = useMemo(function () { return format(new Date(), 'yyyy-MM-dd HH:mm'); }, [booking]);
  var html = useMemo(function () {
    if (!booking) return '';
    return receiptHtml(booking, fmt, printedAt, barcodeText, brand);
  }, [booking, fmt, printedAt, barcodeText, brand]);

  /* Paint the real Code 128 into the preview slot. */
  useEffect(function () {
    if (!rootRef.current) return;
    var slot = rootRef.current.querySelector('.mz-rct-bc');
    if (!slot) return;
    slot.innerHTML = '';
    try {
      var canvas = document.createElement('canvas');
      bwipjs.toCanvas(canvas, {
        bcid: 'code128',
        text: barcodeText,
        scale: 3,
        height: 14,
        includetext: false,
        paddingwidth: 0,
        paddingheight: 0,
        background: '#ffffff',
      });
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Barcode ' + barcodeText);
      slot.appendChild(canvas);
    } catch (e) {
      console.error('Barcode generation error:', e);
      slot.textContent = barcodeText;
    }
  }, [barcodeText, html]);

  if (!booking) return null;

  /* Print: same markup, canvas swapped for a PNG so the iframe reproduces it. */
  function handlePrint() {
    var imgTag = '';
    var canvas = rootRef.current && rootRef.current.querySelector('.mz-rct-bc canvas');
    if (canvas) {
      try { imgTag = '<img class="mz-rct-barcode-img" src="' + canvas.toDataURL('image/png') + '" alt="' + esc(barcodeText) + '">'; }
      catch (e) { console.error('Barcode export error:', e); }
    }
    var printHtml = html.replace(
      '<div class="mz-rct-bc" data-code="' + esc(barcodeText) + '"></div>',
      '<div class="mz-rct-bc">' + imgTag + '</div>'
    );

    var frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(frame);

    var doc = frame.contentWindow.document;
    doc.open();
    doc.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<title>Receipt ' + esc(barcodeText) + '</title>' +
      '<style>' + PRINT_CSS + '</style></head><body>' +
      '<div class="mz-rct-printwrap">' + printHtml + '</div>' +
      '</body></html>'
    );
    doc.close();

    window.setTimeout(function () {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch (e) {
        console.error('Print error:', e);
      }
      window.setTimeout(function () {
        if (frame.parentNode) frame.parentNode.removeChild(frame);
      }, 1500);
    }, 400);
  }

  function stop(event) { event.stopPropagation(); }

  return (
    <div className="mz-rct-ov" onClick={onClose} role="dialog" aria-modal="true" aria-label="Reservation receipt label">
      <style dangerouslySetInnerHTML={{ __html: MODAL_CSS + RECEIPT_CSS }} />
      <div className="mz-rct-wrap" onClick={stop}>
        <div className="mz-rct-tools">
          <button type="button" className="go" onClick={handlePrint}>&#128421;&#65039; Print Label</button>
          <button type="button" className="no" onClick={onClose}>Close</button>
        </div>
        <div className="mz-rct-preview">
          <div ref={rootRef} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}



