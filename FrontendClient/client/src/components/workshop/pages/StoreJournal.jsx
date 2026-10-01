import React, { useState, useEffect, useCallback } from 'react';
import { formatDate as fmtDate, parseDate, toDateKey } from '../../../utils/dates/parseDates';
import { workshopService } from '../services/workshopService';
import { isWorkshopAdmin } from '../../../utils/workshopRole';

const T = {
  bg: '#F4F6F8', surface: '#FFFFFF', bdr: '#E2E8F0', borderLight: '#F1F5F9',
  text: '#0F172A', textSec: '#64748B', textMuted: '#94A3B8',
  primary: '#1E40AF', primaryBg: '#EFF6FF',
  success: '#059669', successBg: '#ECFDF5',
  danger: '#DC2626', dangerBg: '#FEF2F2',
};

const toKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Store Journal - ADMIN ONLY.
 *
 * Calendar + dispatch/restock history, split out of the Workshop "Store" tab so
 * floor staff keep the stock list they actually need while the management view
 * lives here. Registered at /:tenant/workshop/store-journal and guarded in the
 * router, but this component re-checks the role itself: a hidden nav link is
 * convenience, not security, and the data must never render for a worker.
 */
const StoreJournal = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalDispatched: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [section, setSection] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(() => toKey(new Date()));
  const [monthCursor, setMonthCursor] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });

  const isAdmin = isWorkshopAdmin();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await workshopService.getStoreInventory();
      if (res && res.success) {
        const data = res.data || {};
        setHistory(Array.isArray(data.history) ? data.history.map(h => ({
          id: h.id, action: h.action, itemKey: h.item_key, name: h.item_name, sub: h.item_sub || '',
          unit: h.unit || 'pcs', qty: Number(h.qty) || 0, date: toDateKey(parseDate(h.txn_date)) || '',
          pickedBy: h.txn_by || '', notes: h.notes || '', assignedToName: h.assigned_to_name || '',
        })) : []);
        if (data.stats) setStats(data.stats);
      } else {
        setError(res?.error || 'Failed to load store journal');
      }
    } catch (e) {
      setError(e.message || 'Failed to load store journal');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const y = monthCursor.getFullYear();
  const m = monthCursor.getMonth();
  const monthTitle = `${MONTHS[m]} ${y}`;
  const todayKey = toKey(new Date());

  const cells = [];
  const lead = new Date(y, m, 1).getDay() === 0 ? 6 : new Date(y, m, 1).getDay() - 1;
  for (let i = 0; i < lead; i++) cells.push(null);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dayKeyOf = (day) => `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const entriesForDay = (day) => history.filter(h => h.date === dayKeyOf(day));
  const selectedEntries = history.filter(h => h.date === selectedDate);
  const monthPrev = () => setMonthCursor(new Date(y, m - 1, 1));
  const monthNext = () => setMonthCursor(new Date(y, m + 1, 1));

  const totalRestocked = history.reduce((s, h) => s + (h.action === 'RESTOCK' ? (Number(h.qty) || 0) : 0), 0);
  const totalDispatched = Number(stats.totalDispatched) || 0;

  const segBtn = (active) => ({
    padding: '8px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, border: 'none',
    cursor: 'pointer', background: active ? T.primary : T.bg, color: active ? '#fff' : T.textSec,
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
  });

  const navBtn = () => ({
    width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.bdr}`, background: T.surface,
    color: T.textSec, cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', fontFamily: 'inherit',
  });

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 560, margin: '48px auto', padding: '32px 24px', textAlign: 'center', background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 12 }}>
        <i className="fas fa-lock" style={{ fontSize: 28, color: T.textMuted, marginBottom: 12 }} />
        <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: T.text }}>Admin access only</h2>
        <p style={{ margin: 0, fontSize: 13, color: T.textSec }}>
          The store journal (calendar &amp; dispatch history) is available to administrators.
          You can still view and dispatch stock from the Workshop Store tab.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        .sj-wrap { max-width: 1480px; margin: 0 auto; padding: 24px 24px 48px; }
        .sj-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .sj-seg { display: flex; gap: 6px; }
        .sj-bar { padding: 12px 18px; border-bottom: 1px solid ${T.borderLight}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
        .sj-monthnav { display: flex; align-items: center; gap: 8px; }
        .sj-monthlabel { font-size: 13px; font-weight: 800; color: ${T.text}; min-width: 130px; text-align: center; }
        .sj-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 0; min-height: 420px; }
        .sj-cal { padding: 14px; border-right: 1px solid ${T.borderLight}; }
        .sj-side { padding: 16px; background: ${T.bg}; display: flex; flex-direction: column; gap: 12px; }
        .sj-day { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; max-height: 460px; overflow-y: auto; border-right: 1px solid ${T.borderLight}; }
        .sj-wd { text-align: center; font-size: 9px; font-weight: 800; color: ${T.textMuted}; text-transform: uppercase; letter-spacing: .05em; padding: 4px 0; }
        .sj-dow { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .sj-cell { min-height: 54px; border-radius: 8px; border: 1px solid ${T.bdr}; background: ${T.surface}; color: ${T.text}; cursor: pointer; padding: 6px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; font-family: inherit; }
        .sj-stat { background: ${T.surface}; border: 1px solid ${T.borderLight}; border-radius: 10px; padding: 12px 14px; }
        .sj-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; border: 1px solid ${T.borderLight}; }
        @media (max-width: 860px) {
          .sj-grid { grid-template-columns: 1fr; }
          .sj-cal, .sj-day { border-right: none; border-bottom: 1px solid ${T.borderLight}; max-height: none; }
        }
        @media (max-width: 600px) {
          .sj-wrap { padding: 16px 12px 40px; }
          .sj-bar { padding: 10px 12px; }
          .sj-seg { width: 100%; }
          .sj-seg button { flex: 1; justify-content: center; }
          .sj-monthnav { width: 100%; justify-content: space-between; }
          .sj-monthlabel { min-width: 0; font-size: 12px; }
          .sj-cal { padding: 10px; }
          .sj-cell { min-height: 44px; padding: 4px; }
          .sj-side { padding: 12px; }
        }
      `}</style>

      <div className="sj-wrap">
        <div className="sj-head">
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>Store Journal</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: T.textMuted }}>Dispatch &amp; restock calendar · admin only</p>
          </div>
          <button onClick={load} className="btn" style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
            <i className="fas fa-sync-alt" style={{ fontSize: 12 }} /> Refresh
          </button>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
          <div className="sj-bar">
            <div className="sj-seg">
              <button onClick={() => setSection('calendar')} style={segBtn(section === 'calendar')}><i className="fas fa-calendar-days" style={{ fontSize: 11 }} /> Calendar</button>
              <button onClick={() => setSection('history')} style={segBtn(section === 'history')}><i className="fas fa-clock-rotate-left" style={{ fontSize: 11 }} /> History</button>
            </div>

            {section === 'calendar' ? (
              <div className="sj-monthnav">
                <button onClick={monthPrev} style={navBtn()} aria-label="Previous month"><i className="fas fa-chevron-left" style={{ fontSize: 10 }} /></button>
                <span className="sj-monthlabel">{monthTitle}</span>
                <button onClick={monthNext} style={navBtn()} aria-label="Next month"><i className="fas fa-chevron-right" style={{ fontSize: 10 }} /></button>
              </div>
            ) : (
              <span style={{ fontSize: 12, color: T.textSec }}>{history.length} record(s)</span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
              <i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8 }} />Loading journal...
            </div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.danger, fontSize: 13 }}>{error}</div>
          ) : section === 'calendar' ? (
            <div className="sj-grid">
              <div className="sj-cal">
                <div className="sj-dow" style={{ marginBottom: 6 }}>
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (<div key={d} className="sj-wd">{d}</div>))}
                </div>
                <div className="sj-dow">
                  {cells.map((day, i) => {
                    if (!day) return <div key={`e${i}`} />;
                    const key = dayKeyOf(day);
                    const entries = entriesForDay(day);
                    const dispCount = entries.filter(h => h.action === 'DISPATCH').length;
                    const isSel = selectedDate === key;
                    const isToday = todayKey === key;
                    return (
                      <button key={key} onClick={() => setSelectedDate(key)} className="sj-cell"
                        style={{
                          borderColor: isSel ? T.primary : T.bdr,
                          background: isSel ? T.primary : isToday ? T.primaryBg : T.surface,
                          color: isSel ? '#fff' : isToday ? T.primary : T.text,
                        }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{day}</span>
                        {dispCount > 0 && (
                          <span style={{ marginTop: 4, fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 8, background: isSel ? 'rgba(255,255,255,0.25)' : T.successBg, color: isSel ? '#fff' : T.success, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <i className="fas fa-truck" style={{ fontSize: 8 }} /> {dispCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sj-side">
                <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 10 }}>
                  <i className="fas fa-magnifying-glass" style={{ color: T.primary, marginRight: 6 }} />What happened on {fmtDate(selectedDate)}
                </div>

                {selectedEntries.length === 0 ? (
                  <div style={{ fontSize: 12, color: T.textMuted, padding: '14px 0', textAlign: 'center', background: T.bg, borderRadius: 8 }}>No store activity on this day.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedEntries.map(h => (
                      <div key={h.id} className="sj-row" style={{ background: h.action === 'DISPATCH' ? T.dangerBg : T.successBg }}>
                        <i className={`fas ${h.action === 'DISPATCH' ? 'fa-truck' : 'fa-box-open'}`} style={{ color: h.action === 'DISPATCH' ? T.danger : T.success, fontSize: 15, width: 22, textAlign: 'center' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}><span style={{ color: h.action === 'DISPATCH' ? T.danger : T.success, fontWeight: 800 }}>{h.action === 'DISPATCH' ? 'Dispatched' : 'Restocked'}</span> · {h.name}</div>
                          <div style={{ fontSize: 11, color: T.textSec, wordBreak: 'break-word' }}>{h.sub}{h.notes ? ` · ${h.notes}` : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: h.action === 'DISPATCH' ? T.danger : T.success }}>{h.action === 'DISPATCH' ? '−' : '+'}{h.qty} {h.unit}</div>
                          <div style={{ fontSize: 10, color: T.textMuted }}>by {h.pickedBy}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="sj-grid">
              <div className="sj-day">
                {history.length === 0 && <div style={{ textAlign: 'center', color: T.textMuted, padding: 40, fontSize: 13 }}>No dispatch history yet.</div>}
                {history.map(h => (
                  <div key={h.id} className="sj-row" style={{ background: h.action === 'DISPATCH' ? T.dangerBg : T.successBg }}>
                    <i className={`fas ${h.action === 'DISPATCH' ? 'fa-truck' : 'fa-box-open'}`} style={{ color: h.action === 'DISPATCH' ? T.danger : T.success, fontSize: 15, width: 22, textAlign: 'center' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{h.name}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{fmtDate(h.date)} · {h.pickedBy}</div>
                      {h.notes && <div style={{ fontSize: 10, color: T.textMuted, wordBreak: 'break-word' }}>{h.notes}</div>}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: h.action === 'DISPATCH' ? T.danger : T.success, flexShrink: 0 }}>{h.action === 'DISPATCH' ? '−' : '+'}{h.qty} {h.unit}</div>
                  </div>
                ))}
              </div>

              <div className="sj-side">
                <div style={{ fontSize: 12, fontWeight: 800, color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="fas fa-chart-simple" style={{ color: T.primary, fontSize: 11 }} /> Store Activity Summary
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sj-stat">
                    <div style={{ fontSize: 11, color: T.textMuted }}>Total Dispatched</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: T.danger }}>{totalDispatched} <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>coffins</span></div>
                  </div>
                  <div className="sj-stat">
                    <div style={{ fontSize: 11, color: T.textMuted }}>Total Restocked</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: T.success }}>{totalRestocked} <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>units</span></div>
                  </div>
                  <div className="sj-stat">
                    <div style={{ fontSize: 11, color: T.textMuted }}>Transactions</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: T.primary }}>{history.length} <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>records</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreJournal;