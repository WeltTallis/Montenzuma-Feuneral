import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Check, Clock, ChevronRight } from '../../utils/icons/icons';
import { toDateKey, todayKey } from '../../utils/dates/parseDates';
import './FlowerBookingForm.css';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fmtDateStr = date => toDateKey(date) || '';
const addDays = (date, amount) => {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + amount);
  return result;
};

const FlowerBookingForm = ({
  newBooking,
  setNewBooking,
  submitBooking,
  placingOrder,
  editingBookingId,
  evCountByDate,
  onClose,
}) => {
  const [serviceTimePickerOpen, setServiceTimePickerOpen] = useState(false);
  const [draftServiceHour, setDraftServiceHour] = useState('9');
  const [draftServiceMinute, setDraftServiceMinute] = useState('00');
  const [draftServicePeriod, setDraftServicePeriod] = useState('AM');
  const [bookingCalendarOpen, setBookingCalendarOpen] = useState(false);
  const [bookingCalendarMonth, setBookingCalendarMonth] = useState(() => new Date());
  const [bookingSamplePreviews, setBookingSamplePreviews] = useState([]);
  const samplePreviewUrlsRef = useRef(new Set());

  useEffect(() => () => {
    samplePreviewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  const renderNewBooking = () => {
    // Shared styling tokens — mirror the Create Arrangement panel exactly
    const lbl = { display: 'block', fontSize: '9px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9C9389', marginBottom: '8px' };
    const inp = { width: '100%', padding: '12px 14px', border: '1px solid #EAE7E2', borderRadius: '8px', fontSize: '13px', fontFamily: "'DM Sans', system-ui, sans-serif", background: '#FAF9F7', color: '#1C1A17', outline: 'none' };
    const monthStart = new Date(bookingCalendarMonth.getFullYear(), bookingCalendarMonth.getMonth(), 1);
    const calendarStart = (monthStart.getDay() + 6) % 7;
    const calendarDays = Array.from({ length: 42 }, (_, index) => addDays(monthStart, index - calendarStart));
    const chosenDate = newBooking.funeral_date
      ? new Date(`${newBooking.funeral_date}T00:00:00`)
      : null;
    const chosenDateLabel = chosenDate
      ? chosenDate.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
      : 'Choose a service date';
    return (
      <div className="flower-booking-form-panel">
        <div className="flower-booking-form-header">
          <div>
            <h2>New Flower Booking</h2>
            <p>Capture the arrangement and service details in one place.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close new flower booking"
            className="flower-booking-form-close"
          >×</button>
        </div>

        <form onSubmit={submitBooking} className="flower-booking-form">
          <div className="flower-booking-form-grid">
            <section className="flower-booking-form-section">
              <h3>Flower details</h3>
          <label style={lbl} htmlFor="flower-arrangement-types">Arrangement / Requested Flower Item(s)</label>
          <textarea
            id="flower-arrangement-types"
            rows={2}
            style={{ ...inp, resize: 'vertical', marginBottom: '8px' }}
            placeholder="Record the request as given: full set, casket flowers only, 4 extra rings, portrait flowers, 100 stems"
            value={newBooking.arrangement_type}
            onChange={e => setNewBooking(prev => ({ ...prev, arrangement_type: e.target.value }))}
          />
          <label style={lbl} htmlFor="flower-designs">Flower Design(s)</label>
          <textarea
            id="flower-designs"
            rows={2}
            style={{ ...inp, resize: 'vertical', marginBottom: '8px' }}
            placeholder="Optional — e.g. Casket spray, portrait flowers"
            value={newBooking.flower_designs}
            onChange={e => setNewBooking(prev => ({ ...prev, flower_designs: e.target.value }))}
          />
          <label style={lbl} htmlFor="flower-initials">Initials / Dedication</label>
          <input
            id="flower-initials"
            type="text"
            style={{ ...inp, marginBottom: '8px' }}
            placeholder="e.g. Mum, Shosho, Mum & Dad"
            value={newBooking.initials}
            onChange={e => setNewBooking(prev => ({ ...prev, initials: e.target.value }))}
          />
          <label style={lbl} htmlFor="flower-coffin-type">Coffin Type</label>
          <input
            id="flower-coffin-type"
            type="text"
            style={{ ...inp, marginBottom: 0 }}
            placeholder="e.g. Standard, half couch, full couch"
            value={newBooking.coffin_type}
            onChange={e => setNewBooking(prev => ({ ...prev, coffin_type: e.target.value }))}
          />

            </section>

            <section className="flower-booking-form-section">
              <h3>Service schedule</h3>
          <label style={{ ...lbl, marginBottom: '8px' }} id="flower-service-date-label">
            Funeral / Service Date <span style={{ color: '#A39A8E', fontWeight: 400, textTransform: 'none' }}>optional</span>
          </label>
          <div className="flower-booking-date-picker">
            <button
              type="button"
              className="flower-booking-date-trigger"
              aria-labelledby="flower-service-date-label"
              aria-haspopup="dialog"
              aria-expanded={bookingCalendarOpen}
              onClick={() => {
                if (!bookingCalendarOpen && chosenDate) {
                  setBookingCalendarMonth(new Date(chosenDate.getFullYear(), chosenDate.getMonth(), 1));
                }
                setBookingCalendarOpen(open => !open);
              }}
            >
              <Calendar size={17} />
              <span>{chosenDateLabel}</span>
              <ChevronRight size={15} />
            </button>
            {bookingCalendarOpen && (
              <div className="flower-booking-date-popover" role="dialog" aria-label="Choose funeral or service date">
                <div className="flower-booking-calendar-heading">
                  <strong>{MONTHS[bookingCalendarMonth.getMonth()]} {bookingCalendarMonth.getFullYear()}</strong>
                  <div>
                    <button
                      type="button"
                      aria-label="Previous month"
                      onClick={() => setBookingCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    >‹</button>
                    <button
                      type="button"
                      aria-label="Next month"
                      onClick={() => setBookingCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                    >›</button>
                  </div>
                </div>
                <div className="flower-booking-calendar-weekdays">
                  {WEEKDAYS.map(day => <span key={day}>{day}</span>)}
                </div>
                <div className="flower-booking-calendar-days">
                  {calendarDays.map(day => {
                    const dateKey = fmtDateStr(day);
                    const isSelected = dateKey === newBooking.funeral_date;
                    const hasBookings = (evCountByDate[dateKey] || 0) > 0;
                    return (
                      <button
                        key={dateKey}
                        type="button"
                        aria-pressed={isSelected}
                        className={[
                          day.getMonth() !== bookingCalendarMonth.getMonth() ? 'outside-month' : '',
                          dateKey === todayKey() ? 'today' : '',
                          isSelected ? 'selected' : '',
                        ].filter(Boolean).join(' ')}
                        title={hasBookings ? `${dateKey} · ${evCountByDate[dateKey]} existing booking${evCountByDate[dateKey] === 1 ? '' : 's'}` : dateKey}
                        onClick={() => {
                          setNewBooking(prev => ({ ...prev, funeral_date: dateKey }));
                          setBookingCalendarOpen(false);
                        }}
                      >
                        {day.getDate()}
                        {hasBookings && <span aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flower-booking-calendar-shortcuts">
                  <button type="button" onClick={() => {
                    setNewBooking(prev => ({ ...prev, funeral_date: todayKey() }));
                    setBookingCalendarOpen(false);
                  }}>Today</button>
                  <button type="button" onClick={() => {
                    setNewBooking(prev => ({ ...prev, funeral_date: fmtDateStr(addDays(new Date(), 1)) }));
                    setBookingCalendarOpen(false);
                  }}>Tomorrow</button>
                  <button type="button" onClick={() => {
                    setNewBooking(prev => ({ ...prev, funeral_date: '' }));
                    setBookingCalendarOpen(false);
                  }}>Clear</button>
                </div>
              </div>
            )}
          </div>
          <label style={{ ...lbl, marginBottom: '12px' }} htmlFor="flower-service-time">
            Service Time <span style={{ color: '#A39A8E', fontWeight: 400, textTransform: 'none' }}>optional</span>
          </label>
          <div style={{ position: 'relative', marginBottom: '22px' }}>
            <button
              id="flower-service-time"
              type="button"
              aria-haspopup="dialog"
              aria-expanded={serviceTimePickerOpen}
              onClick={() => {
                if (!serviceTimePickerOpen) {
                  const [hour, minute] = newBooking.service_time
                    ? newBooking.service_time.split(':').map(Number)
                    : [9, 0];
                  setDraftServiceHour(String(hour % 12 || 12));
                  setDraftServiceMinute(String(minute || 0).padStart(2, '0'));
                  setDraftServicePeriod(hour >= 12 ? 'PM' : 'AM');
                }
                setServiceTimePickerOpen(open => !open);
              }}
              style={{
                ...inp,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: 0,
                textAlign: 'left',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Clock size={17} />
              <span style={{ flex: 1 }}>
                {newBooking.service_time
                  ? (() => {
                    const [hour, minute] = newBooking.service_time.split(':').map(Number);
                    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
                  })()
                  : 'Select service time'}
              </span>
              <ChevronRight size={15} />
            </button>
            {serviceTimePickerOpen && (
              <div
                role="dialog"
                aria-label="Select service time"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  zIndex: 30,
                  width: 'min(300px, calc(100vw - 56px))',
                  padding: '14px 16px 16px',
                  border: '1px solid #E3DDD0',
                  borderRadius: '12px',
                  background: '#fff',
                  boxShadow: '0 18px 48px rgba(21, 23, 26, .18)',
                }}
              >
                <div style={{ marginBottom: '8px', color: '#8A8780', fontSize: '10px', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>Service time</div>
                <div style={{ marginBottom: '12px', color: '#15171A', fontSize: '28px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                  {draftServiceHour}:{draftServiceMinute}<span style={{ marginLeft: '6px', color: '#6B6862', fontSize: '13px' }}>{draftServicePeriod}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'grid', gap: '5px', color: '#6B6862', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                    Hour
                    <select
                      value={draftServiceHour}
                      onChange={event => setDraftServiceHour(event.target.value)}
                      style={{ ...inp, marginBottom: 0, padding: '8px 10px', fontWeight: 700 }}
                    >
                      {Array.from({ length: 12 }, (_, index) => String(index + 1)).map(hour => (
                        <option key={hour} value={hour}>{hour}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: '5px', color: '#6B6862', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                    Minute
                    <select
                      value={draftServiceMinute}
                      onChange={event => setDraftServiceMinute(event.target.value)}
                      style={{ ...inp, marginBottom: 0, padding: '8px 10px', fontWeight: 700 }}
                    >
                      {Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0')).map(minute => (
                        <option key={minute} value={minute}>{minute}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
                  {['AM', 'PM'].map(period => (
                    <button
                      key={period}
                      type="button"
                      aria-pressed={draftServicePeriod === period}
                      onClick={() => setDraftServicePeriod(period)}
                      style={{
                        height: '36px',
                        border: `1px solid ${draftServicePeriod === period ? '#15171A' : '#E3DDD0'}`,
                        borderRadius: '8px',
                        color: draftServicePeriod === period ? '#fff' : '#6B6862',
                        background: draftServicePeriod === period ? '#15171A' : '#fff',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {period}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setNewBooking(prev => ({ ...prev, service_time: '' }));
                      setServiceTimePickerOpen(false);
                    }}
                    style={{ height: '36px', border: '1px solid #E3DDD0', borderRadius: '8px', background: '#fff', color: '#6B6862', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceTimePickerOpen(false)}
                    style={{ height: '36px', border: '1px solid #E3DDD0', borderRadius: '8px', background: '#fff', color: '#6B6862', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const hour12 = Number(draftServiceHour);
                      const hour24 = (hour12 % 12) + (draftServicePeriod === 'PM' ? 12 : 0);
                      setNewBooking(prev => ({
                        ...prev,
                        service_time: `${String(hour24).padStart(2, '0')}:${draftServiceMinute}`,
                      }));
                      setServiceTimePickerOpen(false);
                    }}
                    style={{ height: '36px', border: '1px solid #3D4F47', borderRadius: '8px', background: '#3D4F47', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
            </section>

            <section className="flower-booking-form-section">
              <h3>Logistics &amp; notes</h3>
          <label style={lbl} htmlFor="flower-route">Route / Service Location</label>
          <input
            id="flower-route"
            type="text"
            style={{ ...inp, marginBottom: '22px' }}
            placeholder="e.g. Montezuma to Mbumbuni"
            value={newBooking.route}
            onChange={e => setNewBooking(prev => ({ ...prev, route: e.target.value }))}
          />
          <label style={lbl} htmlFor="flower-vehicle-plate">Hearse / Vehicle Number Plate</label>
          <input
            id="flower-vehicle-plate"
            type="text"
            style={{ ...inp, marginBottom: '22px' }}
            placeholder="e.g. KCV 095H"
            value={newBooking.vehicle_plate}
            onChange={e => setNewBooking(prev => ({ ...prev, vehicle_plate: e.target.value.toUpperCase() }))}
          />
          {/* ── Special instructions ── */}
          <label style={lbl}>Special Remarks</label>
          <textarea
            rows={3}
            style={{ ...inp, resize: 'vertical', marginBottom: '22px' }}
            placeholder="Extra stems, hearse details, car plate, or other instructions"
            value={newBooking.remarks}
            onChange={e => setNewBooking(prev => ({ ...prev, remarks: e.target.value }))}
          />

            </section>

            <section className="flower-booking-form-section">
              <h3>Reference photos</h3>
          <label style={lbl}>Client Reference Photos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ ...inp, marginBottom: '22px', padding: '10px 12px' }}
            onChange={e => {
              const files = Array.from(e.target.files || []);
              e.target.value = '';
              const newPreviews = files.map(file => ({
                name: file.name,
                url: URL.createObjectURL(file),
              }));
              newPreviews.forEach(preview => samplePreviewUrlsRef.current.add(preview.url));
              // Append new photos so each selection adds to the gallery
              // instead of replacing what was already chosen (real-time update).
              setBookingSamplePreviews(prev => [...prev, ...newPreviews]);
              setNewBooking(prev => ({ ...prev, sample_uploads: [...(prev.sample_uploads || []), ...files] }));
            }}
          />
          {bookingSamplePreviews.length > 0 && (
            <div className="flower-booking-upload-previews" aria-label="Selected reference photos">
              {bookingSamplePreviews.map((preview, index) => (
                <figure key={`${preview.name}-${index}`}>
                  <img src={preview.url} alt={preview.name} />
                  <figcaption>{preview.name}</figcaption>
                </figure>
              ))}
            </div>
          )}
          <p style={{ margin: '-14px 0 22px', color: '#6E675E', fontSize: '12px', lineHeight: 1.5 }}>
            Add photos showing the exact design the family requested. These will be saved with the booking.
          </p>
            </section>

            <section className="flower-booking-form-section">
              <h3>Deceased information</h3>
          <label style={lbl}>Deceased Name *</label>
          <input
            type="text"
            style={{ ...inp, marginBottom: '16px' }}
            placeholder="Name of the deceased"
            value={newBooking.deceased_name}
            onChange={e => setNewBooking(prev => ({ ...prev, deceased_name: e.target.value }))}
            required
          />

          <label style={lbl}>Priority Level</label>
          <select
            style={{ ...inp, marginBottom: '22px' }}
            value={newBooking.priority || 'Normal'}
            onChange={e => setNewBooking(prev => ({ ...prev, priority: e.target.value }))}
          >
            <option value="Normal">Normal</option>
            <option value="Urgent">Urgent</option>
          </select>

            </section>

            <section className="flower-booking-form-section">
              <h3>Client / T-Cord coordinator</h3>
          <label style={lbl} htmlFor="flower-contact-name">Family / T-Cord Contact Name</label>
          <input
            id="flower-contact-name"
            type="text"
            placeholder="e.g. Felistus"
            style={{ ...inp, marginBottom: 0 }}
            value={newBooking.contact_name}
            onChange={e => setNewBooking(prev => ({ ...prev, contact_name: e.target.value }))}
          />
            </section>
          </div>

          {/* Footer actions — mirrors Create Arrangement */}
          <div className="flower-booking-form-footer">
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '11px 20px',
                borderRadius: '8px',
                background: 'transparent',
                color: '#574F47',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: '1px solid #EAE7E2',
                cursor: 'pointer',
                fontFamily: "'DM Sans', system-ui, sans-serif"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={placingOrder}
              style={{
                padding: '11px 24px',
                borderRadius: '8px',
                background: '#475A43',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: placingOrder ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: placingOrder ? 0.65 : 1
              }}
            >
              <Check size={14} />
              {placingOrder
                ? (editingBookingId ? 'Saving Changes…' : 'Placing Order…')
                : (editingBookingId ? 'Save Changes' : 'Place Order')}
            </button>
          </div>
        </form>
      </div>
    );

  };

  return renderNewBooking();
};

export default FlowerBookingForm;
