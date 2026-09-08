// FlowerSnowBookingForm.jsx
// ── "Flower Snow" booking form — botanical rosewood & cream ───────────────────
// Imported and used by Samples.jsx. Only the essentials: service date, name of
// the deceased (optional), your name and phone — plus the selected arrangements
// with quantity steppers. Posts to /florist/bookings.

import { useState } from 'react'
import api from '../../api/axios'
import Snowfall from './Snowfall'

const FORM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Karla:wght@400;500;600;700&display=swap');
body { background: #FBF6F1; }
.fb-page {
  position: relative; z-index: 1; min-height: 100vh; min-height: 100dvh;
  background: #FBF6F1; color: #4A3B3C;
  font: 400 16px/1.55 'Karla', 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  display: flex; justify-content: center; padding: 54px 16px 0;
  animation: fbFade 0.4s ease;
}
@keyframes fbFade { from { opacity: 0; } to { opacity: 1; } }
.fb-frame {
  position: relative; border: 1px solid #F0E3DC; background: #FFFEFB;
  box-shadow: 0 30px 70px -46px rgba(107,64,69,.45); max-width: 720px; width: 100%;
}
.fb-sheet { position: relative; outline: 1px solid #F0E3DC; outline-offset: 7px; margin: 7px; }
.fb-corner { position: absolute; width: 84px; height: 84px; color: #E0C9C0; pointer-events: none; z-index: 2; }
.fb-corner.tl { top: 9px; left: 9px; }
.fb-corner.tr { top: 9px; right: 9px; transform: scaleX(-1); }
.fb-corner.bl { bottom: 9px; left: 9px; transform: scaleY(-1); }
.fb-corner.br { bottom: 9px; right: 9px; transform: scale(-1); }
.fb-head { position: relative; text-align: center; padding: 44px 30px 8px; }
.fb-sprig { width: 230px; height: 58px; margin: 0 auto 6px; color: #96A88B; display: block; }
.fb-head h1 { font: 600 2.05rem/1.1 'Cormorant Garamond', Georgia, serif; letter-spacing: .02em; color: #6B4045; margin: 6px 0 0; }
.fb-head .sub { font: italic 500 .98rem 'Cormorant Garamond', Georgia, serif; color: #B98480; margin: 4px 0 0; }
.fb-form { padding: 6px 44px 34px; }
@media (max-width: 600px) { .fb-form { padding: 6px 22px 26px; } .fb-head { padding: 36px 20px 4px; } }
.fb-section { border: 0; padding: 26px 0 8px; margin: 0; border-bottom: 1px solid #F0E3DC; }
.fb-section:last-of-type { border-bottom: 0; }
.fb-fs-title {
  display: flex; align-items: center; gap: 9px;
  font: 700 .67rem 'Karla', sans-serif; letter-spacing: .22em; text-transform: uppercase;
  color: #B98480; margin-bottom: 18px;
}
.fb-fs-title .b { width: 15px; height: 15px; color: #DCAEA6; flex: none; }
.fb-fs-title::after { content: ""; flex: 1; height: 1px; background: linear-gradient(to right, #F0E3DC, transparent); }
.fb-frow { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 600px) { .fb-frow { grid-template-columns: 1fr; } }
.fb-field { margin-bottom: 16px; }
.fb-field:last-child { margin-bottom: 0; }
.fb-field > label { display: block; font: 700 .65rem 'Karla', sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #7A6664; margin-bottom: .5rem; }
.fb-field .opt { display: inline; text-transform: none; letter-spacing: 0; font-weight: 500; color: #B09A94; }
.fb-inp { position: relative; }
.fb-inp svg { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #DCAEA6; pointer-events: none; }
.fb-inp input { padding-left: 30px; }
.fb-field input {
  width: 100%; background: transparent; border: 0; border-bottom: 1px solid #E0C9C0;
  padding: .6rem .15rem; font: 500 .98rem 'Karla', sans-serif; color: #4A3B3C;
  transition: border-color .25s; outline: none;
}
.fb-field input:focus { border-color: #B98480; }
.fb-field input::placeholder { color: #B09A94; }
.fb-field.bad input { border-color: #A4544C; }
.fb-err { display: none; font: 600 .72rem 'Karla', sans-serif; color: #A4544C; margin-top: 5px; }
.fb-field.bad .fb-err { display: block; }
.fb-field.bad > label { color: #A4544C; }
.fb-back {
  background: none; border: none; cursor: pointer; padding: 0; margin-bottom: 18px;
  font: 500 .8rem 'Karla', sans-serif; color: #B09A94;
  display: flex; align-items: center; gap: 8px; transition: color .2s;
}
.fb-back:hover { color: #6B4045; }
.fb-sel-card { border: 1px solid #F0E3DC; border-radius: 12px; background: #F6E7E2; padding: 4px 14px; margin: 2px 0 6px; }
.fb-sel-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid #F0E3DC; }
.fb-sel-thumb { width: 52px; height: 40px; border-radius: 8px; object-fit: cover; flex-shrink: 0; border: 1px solid #E0C9C0; }
.fb-sel-info { flex: 1; min-width: 0; }
.fb-sel-name { font: 600 .95rem 'Karla', sans-serif; color: #4A3B3C; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fb-sel-tag { font: italic 500 .85rem 'Cormorant Garamond', Georgia, serif; color: #B98480; margin-top: 2px; }
.fb-qty { display: flex; align-items: center; border: 1px solid #E0C9C0; }
.fb-qty button { width: 30px; height: 34px; display: grid; place-items: center; border: 0; background: transparent; cursor: pointer; transition: .2s; color: #6B4045; font-size: 15px; line-height: 1; padding: 0; }
.fb-qty button:hover { background: #6B4045; color: #FBF3EE; }
.fb-qty span { min-width: 30px; display: grid; place-items: center; font: 700 .92rem 'Karla', sans-serif; color: #4A3B3C; border-left: 1px solid #E0C9C0; border-right: 1px solid #E0C9C0; }
.fb-sel-remove { background: none; border: none; cursor: pointer; color: #B09A94; font-size: 18px; line-height: 1; padding: 2px 5px; transition: color .15s; flex-shrink: 0; }
.fb-sel-remove:hover { color: #A4544C; }
.fb-sel-total { display: flex; justify-content: space-between; align-items: center; padding: 12px 0 10px; font: 700 .64rem 'Karla', sans-serif; letter-spacing: .18em; text-transform: uppercase; color: #7A6664; }
.fb-sel-total b { font: 600 1.05rem 'Cormorant Garamond', Georgia, serif; color: #6B4045; letter-spacing: .02em; text-transform: none; }
.fb-submit {
  width: 100%; padding: 1.1rem; background: #6B4045; color: #FBF3EE; border: 0;
  font: 700 .84rem 'Karla', sans-serif; letter-spacing: .24em; text-transform: uppercase;
  cursor: pointer; transition: .25s; display: flex; align-items: center; justify-content: center;
  gap: 11px; margin-top: 10px;
}
.fb-submit:hover:not(:disabled) { background: #573438; }
.fb-submit:disabled { opacity: .75; cursor: wait; }
.fb-submit .b { width: 15px; height: 15px; color: #DCAEA6; }
.fb-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(251,243,238,.35); border-top-color: #FBF3EE; animation: fbSpin .7s linear infinite; flex-shrink: 0; }
@keyframes fbSpin { to { transform: rotate(360deg); } }
.fb-formnote { text-align: center; font: italic 500 .86rem 'Cormorant Garamond', Georgia, serif; color: #B09A94; padding: 12px 0 0; margin: 0; }
`

const FbSymbols = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
    <defs>
      <symbol id="fb-bloom" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(72 12 12)" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(144 12 12)" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(216 12 12)" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(288 12 12)" />
        </g>
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </symbol>
      <symbol id="fb-cornerfl" viewBox="0 0 90 90">
        <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <path d="M8 84C22 60 36 42 62 26" />
          <path d="M34 56q-2-11 6-18q6 8 2 18Z" fill="currentColor" opacity=".25" stroke="none" />
          <path d="M50 42q-3-10 3-18q7 7 4 18Z" fill="currentColor" opacity=".22" stroke="none" />
          <path d="M24 70q-9-3-11-12q10 0 14 10Z" fill="currentColor" opacity=".2" stroke="none" />
          <circle cx="66" cy="23" r="2.4" fill="currentColor" stroke="none" />
          <circle cx="73" cy="30" r="1.7" fill="currentColor" stroke="none" opacity=".7" />
          <circle cx="61" cy="32" r="1.7" fill="currentColor" stroke="none" opacity=".7" />
        </g>
      </symbol>
      <symbol id="fb-sprig" viewBox="0 0 260 64">
        <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <path d="M118 54C88 52 58 42 36 20" />
          <path d="M104 50q-3-10 3-18q7 7 3 18Z" fill="currentColor" opacity=".28" stroke="none" />
          <path d="M86 44q-4-9 0-18q7 6 4 18Z" fill="currentColor" opacity=".22" stroke="none" />
          <path d="M66 34q-5-8-3-17q8 5 7 17Z" fill="currentColor" opacity=".22" stroke="none" />
          <path d="M50 24q-6-7-6-16q9 4 10 16Z" fill="currentColor" opacity=".18" stroke="none" />
          <circle cx="124" cy="54" r="2" fill="currentColor" stroke="none" />
          <path d="M142 54c30-2 60-12 82-34" />
          <path d="M156 50q3-10-3-18q-7 7-3 18Z" fill="currentColor" opacity=".28" stroke="none" />
          <path d="M174 44q4-9 0-18q-7 6-4 18Z" fill="currentColor" opacity=".22" stroke="none" />
          <path d="M194 34q5-8 3-17q-8 5-7 17Z" fill="currentColor" opacity=".22" stroke="none" />
          <path d="M210 24q6-7 6-16q-9 4-10 16Z" fill="currentColor" opacity=".18" stroke="none" />
          <circle cx="136" cy="54" r="2" fill="currentColor" stroke="none" />
        </g>
        <g transform="translate(118 6) scale(1.9)">
          <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
            <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" />
            <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(72 12 12)" />
            <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(144 12 12)" />
            <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(216 12 12)" />
            <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(288 12 12)" />
          </g>
        </g>
      </symbol>
    </defs>
  </svg>
)

// __FORM_IMPL__

export default function FlowerSnowBookingForm({ selected = [], quantities = {}, arrangements = [], onBack, onDone, onQtyChange, onRemove }) {
  const [form, setForm] = useState({ deceased: '', date: '', yourName: '', phone: '' })
  const [bad, setBad] = useState({})
  const [sending, setSending] = useState(false)

  const totalItems = selected.reduce((s, id) => s + (quantities[id] || 1), 0)
  const selItems = selected.map(id => arrangements.find(a => a.id === id)).filter(Boolean)
  const hasPrices = selItems.some(a => a.price != null)
  const totalPrice = selItems.reduce((s, a) => s + (a.price != null ? a.price * (quantities[a.id] || 1) : 0), 0)

  const d0 = new Date()
  const minDate = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`

  const set = (key) => ({
    value: form[key],
    onChange: (e) => {
      setForm(f => ({ ...f, [key]: e.target.value }))
      setBad(b => ({ ...b, [key]: false }))
    },
  })

  const validate = () => {
    const b = {}
    if (!form.date || form.date < minDate) b.date = true
    if (form.yourName.trim().length < 2) b.yourName = true
    if (!/^[+\d][\d\s().-]{6,}$/.test(form.phone.trim())) b.phone = true
    setBad(b)
    return Object.keys(b).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!selected.length) { alert('Please select at least one arrangement.'); return }
    if (!validate()) {
      const first = document.querySelector('.fb-field.bad input')
      if (first) first.focus()
      return
    }
    setSending(true)
    try {
      const names = selected.map(id => {
        const arr = arrangements.find(a => a.id === id)
        return (arr?.name || arr?.title || 'Arrangement') + ' ×' + (quantities[id] || 1)
      }).join(', ')
      await api.post('/florist/bookings', {
        arrangement_name: names,
        deceased_name: form.deceased || null,
        booked_by: form.yourName || null,
        funeral_home: null,
        date: form.date || null,
        phone: form.phone || null,
        email: null,
        card_message: null,
        quantity: totalItems,
        special_instructions: null
      })
      onDone(form)
    } catch (error) {
      alert(error.friendlyMessage || 'Failed to submit. Please try again.')
      setSending(false)
    }
  }

  return (
    <div className="fb-page">
      <style dangerouslySetInnerHTML={{ __html: FORM_CSS }} />
      <FbSymbols />
      <Snowfall count={10} opacity={0.55} colors={['#DCAEA6', '#F0D9C8', '#E5C1B8']} />

      <div className="fb-frame">
        <svg className="fb-corner tl"><use href="#fb-cornerfl" /></svg>
        <svg className="fb-corner tr"><use href="#fb-cornerfl" /></svg>
        <svg className="fb-corner bl"><use href="#fb-cornerfl" /></svg>
        <svg className="fb-corner br"><use href="#fb-cornerfl" /></svg>

        <div className="fb-sheet">
          <div className="fb-head">
            <svg className="fb-sprig"><use href="#fb-sprig" /></svg>
            <h1>Flower Snow</h1>
            <p className="sub">Hand-arranged · Delivered with grace</p>
          </div>

          <form className="fb-form" onSubmit={submit} noValidate>
            <button type="button" className="fb-back" onClick={onBack}>← All arrangements</button>

            <div className="fb-fs-title"><svg className="b"><use href="#fb-bloom" /></svg>Your selections</div>
            <div className="fb-sel-card">
              {selItems.map(a => {
                const qty = quantities[a.id] || 1
                return (
                  <div key={a.id} className="fb-sel-row">
                    <img className="fb-sel-thumb" src={a.img || a.portrait} alt={a.name || a.title} />
                    <div className="fb-sel-info">
                      <div className="fb-sel-name">{a.name || a.title}</div>
                      <div className="fb-sel-tag">{a.tag} · {a.note}</div>
                    </div>
                    <div className="fb-qty">
                      <button type="button" aria-label="Decrease quantity" onClick={() => onQtyChange && onQtyChange(a.id, qty - 1)}>−</button>
                      <span>{qty}</span>
                      <button type="button" aria-label="Increase quantity" onClick={() => onQtyChange && onQtyChange(a.id, qty + 1)}>+</button>
                    </div>
                    <button type="button" className="fb-sel-remove" aria-label="Remove arrangement" onClick={() => onRemove && onRemove(a.id)}>×</button>
                  </div>
                )
              })}
              <div className="fb-sel-total">
                <span>{totalItems} arrangement{totalItems !== 1 ? 's' : ''} total</span>
                {hasPrices && <b>≈ ${totalPrice.toLocaleString()}</b>}
              </div>
            </div>

            <fieldset className="fb-section">
              <div className="fb-fs-title"><svg className="b"><use href="#fb-bloom" /></svg>The service</div>
              <div className="fb-frow">
                <div className={'fb-field' + (bad.date ? ' bad' : '')}>
                  <label htmlFor="fbDate">Service date</label>
                  <div className="fb-inp">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5.5" width="14" height="14.5" rx="1" /><path d="M5 9.5h14M9 3.5v4M15 3.5v4" /></svg>
                    <input type="date" id="fbDate" min={minDate} {...set('date')} />
                  </div>
                  <p className="fb-err">Please choose a valid service date.</p>
                </div>
                <div className="fb-field">
                  <label htmlFor="fbDeceased">Name of deceased <span className="opt">(optional)</span></label>
                  <div className="fb-inp">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4" /><path d="M5 20c1.2-3.6 3.9-5.4 7-5.4s5.8 1.8 7 5.4" /></svg>
                    <input type="text" id="fbDeceased" placeholder="Full name" {...set('deceased')} />
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset className="fb-section">
              <div className="fb-fs-title"><svg className="b"><use href="#fb-bloom" /></svg>Your details</div>
              <div className="fb-frow">
                <div className={'fb-field' + (bad.yourName ? ' bad' : '')}>
                  <label htmlFor="fbName">Full name</label>
                  <div className="fb-inp">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4" /><path d="M5 20c1.2-3.6 3.9-5.4 7-5.4s5.8 1.8 7 5.4" /></svg>
                    <input type="text" id="fbName" placeholder="First and last name" {...set('yourName')} />
                  </div>
                  <p className="fb-err">Please tell us your name.</p>
                </div>
                <div className={'fb-field' + (bad.phone ? ' bad' : '')}>
                  <label htmlFor="fbPhone">Phone</label>
                  <div className="fb-inp">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.4 1.6a12.5 12.5 0 0 0 4.8 4.8L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
                    <input type="tel" id="fbPhone" placeholder="(555) 000-0000" {...set('phone')} />
                  </div>
                  <p className="fb-err">Enter a valid phone number.</p>
                </div>
              </div>
            </fieldset>

            <button type="submit" className="fb-submit" disabled={sending}>
              {sending
                ? <><span className="fb-spinner" />Sending…</>
                : <><svg className="b"><use href="#fb-bloom" /></svg>Request booking — {totalItems}</>}
            </button>
            <p className="fb-formnote">No payment now — we&apos;ll confirm by phone.</p>
          </form>
        </div>
      </div>
    </div>
  )
}