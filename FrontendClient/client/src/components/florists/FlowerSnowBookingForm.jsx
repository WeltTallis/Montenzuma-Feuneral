// FlowerSnowBookingForm.jsx
// ── "Flower booking" — botanical side panel ───────────────────────────────────
// Slides in from the right over the browse/detail view. Rendered exactly like
// the approved mockup: cream paper frame, corner flourishes, service /
// arrangement / card / details fieldsets, rosewood submit + footer.

import { useState } from 'react'
import api from '../../api/axios'
import Snowfall from './Snowfall'

const FORM_CSS = `
:root{
  --paper:#FBF6F1; --card:#FFFEFB;
  --hair:#F0E3DC; --hair2:#E0C9C0;
  --rosewood:#6B4045; --rosewood-d:#573438;
  --rose:#B98480; --blush:#DCAEA6; --blush-xl:#F6E7E2;
  --gold:#C8A262; --stem:#96A88B;
  --ink:#4A3B3C; --ink2:#7A6664; --ink3:#B09A94;
  --brick:#A4544C; --cream:#F3E6DC;
  --serif:'Cormorant Garamond',Georgia,serif;
  --sans:'Karla','Segoe UI',sans-serif;
}
/* ── side panel chrome ── */
.fbp-scrim{position:fixed;inset:0;background:rgba(30,18,19,.45);backdrop-filter:blur(2px);z-index:300;animation:fbFade .25s ease}
.fbp-panel{position:fixed;top:0;right:0;bottom:0;width:min(560px,100vw);z-index:310;background:var(--paper);
  box-shadow:-30px 0 80px rgba(50,30,32,.35);animation:fbpIn .38s cubic-bezier(.16,1,.3,1);
  display:flex;flex-direction:column;overflow:hidden;font:400 16px/1.55 var(--sans);color:var(--ink)}
@keyframes fbpIn{from{transform:translateX(64px);opacity:0}to{transform:none;opacity:1}}
@keyframes fbFade{from{opacity:0}to{opacity:1}}
.fbp-close{position:absolute;top:14px;right:14px;z-index:30;width:34px;height:34px;border-radius:50%;
  border:1px solid var(--hair2);background:var(--card);color:var(--rosewood);font-size:20px;line-height:1;
  cursor:pointer;display:grid;place-items:center;padding:0;transition:.2s}
.fbp-close:hover{background:var(--rosewood);color:#FBF3EE;border-color:var(--rosewood)}
.fbp-scroll{overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch;position:relative}
.fbp-panel .snowfall{z-index:0}
*{-webkit-tap-highlight-color:transparent}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[role="button"]:focus-visible{outline:2px solid var(--rose);outline-offset:2px}
svg{display:block}
button{font-family:var(--sans);color:inherit}
::selection{background:var(--blush)}
/* ── page / frame ── */
.fb-page{position:relative;z-index:1;width:100%;padding:54px 0 0}
.frame{position:relative;border:1px solid var(--hair);background:var(--card);box-shadow:0 30px 70px -46px rgba(107,64,69,.45)}
.sheet{position:relative;outline:1px solid var(--hair);outline-offset:7px;margin:7px}
.corner{position:absolute;width:84px;height:84px;color:var(--hair2);pointer-events:none;z-index:2}
.corner.tl{top:9px;left:9px}
.corner.tr{top:9px;right:9px;transform:scaleX(-1)}
.corner.bl{bottom:9px;left:9px;transform:scaleY(-1)}
.corner.br{bottom:9px;right:9px;transform:scale(-1)}
/* ── head ── */
.head{position:relative;text-align:center;padding:44px 30px 8px}
.head .sprig{width:230px;height:58px;margin:0 auto 6px;color:var(--stem)}
.head h1{font:600 2.05rem/1.1 var(--serif);letter-spacing:.02em;color:var(--rosewood)}
.head .sub{font:italic 500 .98rem var(--serif);color:var(--rose);margin-top:4px}
/* ── form ── */
form{padding:6px 44px 34px}
@media(max-width:600px){form{padding:6px 22px 26px}.head{padding:36px 20px 4px}}
fieldset{border:0;padding:26px 0 8px;border-bottom:1px solid var(--hair)}
fieldset:last-of-type{border-bottom:0}
.fs-title{display:flex;align-items:center;gap:9px;font:700 .67rem var(--sans);letter-spacing:.22em;text-transform:uppercase;color:var(--rose);margin-bottom:18px}
.fs-title .b{width:15px;height:15px;color:var(--blush);flex:none}
.fs-title::after{content:"";flex:1;height:1px;background:linear-gradient(to right,var(--hair),transparent)}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:600px){.frow{grid-template-columns:1fr}}
.field{margin-bottom:16px}
.field:last-child{margin-bottom:0}
.field>label{display:block;font:700 .65rem var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--ink2);margin-bottom:.5rem}
.opt{display:inline;text-transform:none;letter-spacing:0;font-weight:500;color:var(--ink3)}
.inp{position:relative}
.inp svg{position:absolute;left:0;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--blush);pointer-events:none}
.inp input,.inp select{padding-left:30px}
.field input,.field select,.field textarea{width:100%;background:transparent;border:0;border-bottom:1px solid var(--hair2);padding:.6rem .15rem;font:500 .98rem var(--sans);color:var(--ink);transition:border-color .25s}
.field textarea{resize:vertical;min-height:80px;border:1px solid var(--hair2);padding:.7rem .8rem;margin-top:4px}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--rose)}
.field ::placeholder{color:var(--ink3)}
.selectwrap{position:relative}
.selectwrap select{appearance:none;padding-right:24px}
.selectwrap>svg{position:absolute;right:0;left:auto;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--blush);pointer-events:none}
/* ── pills / reveal / counters ── */
.pills{display:flex;flex-wrap:wrap;gap:8px}
.pills input{position:absolute;opacity:0;pointer-events:none}
.pills label{display:inline-block;padding:.5rem .95rem;border:1px solid var(--hair2);font:600 .8rem var(--sans);color:var(--ink2);cursor:pointer;transition:.2s;margin:0;background:transparent}
.pills label:hover{border-color:var(--rose);color:var(--rosewood)}
.pills input:checked+label{background:var(--rosewood);border-color:var(--rosewood);color:#FBF3EE}
.pills input:focus-visible+label{outline:2px solid var(--rose);outline-offset:2px}
.reveal{display:grid;grid-template-rows:0fr;transition:grid-template-rows .3s ease}
.reveal.open{grid-template-rows:1fr}
.reveal>div{overflow:hidden}
.reveal .field{padding-top:14px}
.tareawrap{position:relative}
.counter{position:absolute;bottom:8px;right:10px;font:600 .64rem var(--sans);color:var(--ink3)}
/* ── qty stepper + selections ── */
.qty{display:inline-flex;align-items:stretch;border:1px solid var(--hair2)}
.qty button{width:32px;height:36px;display:grid;place-items:center;border:0;background:transparent;cursor:pointer;transition:.2s;font-size:15px;line-height:1;padding:0}
.qty button:hover{background:var(--rosewood);color:#FBF3EE}
.qty span{min-width:36px;display:grid;place-items:center;font-weight:700;font-size:.92rem;border-left:1px solid var(--hair2);border-right:1px solid var(--hair2)}
.selrow{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--hair)}
.selrow .thumb{width:46px;height:36px;border-radius:6px;object-fit:cover;flex:none;border:1px solid var(--hair2)}
.selrow .info{flex:1;min-width:0}
.selrow .nm{font:600 .92rem var(--sans);color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.selrow .tg{font:italic 500 .84rem var(--serif);color:var(--rose);margin-top:1px}
.selrow .rm{background:none;border:none;cursor:pointer;color:var(--ink3);font-size:17px;line-height:1;padding:2px 4px;transition:color .15s}
.selrow .rm:hover{color:var(--brick)}
.seltotal{display:flex;justify-content:space-between;align-items:center;padding:12px 0 2px;font:700 .64rem var(--sans);letter-spacing:.18em;text-transform:uppercase;color:var(--ink2)}
.seltotal b{font:600 1.05rem var(--serif);color:var(--rosewood);letter-spacing:.02em;text-transform:none}
/* ── errors ── */
.err{display:none;font:600 .72rem var(--sans);color:var(--brick);margin-top:5px}
.field.bad input,.field.bad select,.field.bad textarea{border-color:var(--brick)}
.field.bad .err{display:block}
.field.bad>label{color:var(--brick)}

/* ── submit ── */
.submit{width:100%;padding:1.1rem;background:var(--rosewood);color:#FBF3EE;border:0;font:700 .84rem var(--sans);letter-spacing:.24em;text-transform:uppercase;cursor:pointer;transition:.25s;display:flex;align-items:center;justify-content:center;gap:11px}
.submit:hover:not(:disabled){background:var(--rosewood-d)}
.submit:disabled{opacity:.75;cursor:wait}
.submit .b{width:15px;height:15px;color:var(--blush)}
.fbspin{width:14px;height:14px;border-radius:50%;border:2px solid rgba(251,243,238,.35);border-top-color:#FBF3EE;animation:fbspin .7s linear infinite;flex:none}
@keyframes fbspin{to{transform:rotate(360deg)}}
.formnote{text-align:center;font:italic 500 .86rem var(--serif);color:var(--ink3);padding:12px 0 0}
/* ── confirmation ── */
.conf{text-align:center;padding:56px 30px}
.conf .sprig{width:200px;height:50px;margin:0 auto 10px;color:var(--stem)}
.ccheck{width:52px;height:52px;background:var(--rosewood);display:grid;place-items:center;margin:0 auto 18px;color:#FBF3EE}
.ccheck svg{width:23px;height:23px}
.conf h2{font:600 1.9rem var(--serif);color:var(--rosewood)}
.csub{font:italic 500 .98rem var(--serif);color:var(--ink2);margin-top:4px}
.cref{display:inline-flex;gap:16px;flex-wrap:wrap;justify-content:center;margin:22px 0;padding:12px 16px;border:1px solid var(--hair);font:600 .8rem var(--sans);background:var(--blush-xl)}
.cactions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.btn-ghost{display:inline-flex;align-items:center;gap:8px;margin-top:18px;padding:.72rem 1.5rem;border:1px solid var(--hair2);background:#fff;font:700 .76rem var(--sans);letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:.25s;color:var(--rosewood)}
.btn-ghost:hover{background:var(--rosewood);color:#FBF3EE;border-color:var(--rosewood)}
/* ── rosewood footer — flush inside ── */
.site-foot{position:relative;overflow:hidden;background:var(--rosewood);color:var(--cream);text-align:center;padding:48px 20px 44px}
.site-foot::before{content:"";position:absolute;left:50%;bottom:-260px;transform:translateX(-50%);width:520px;height:520px;border-radius:50%;border:1.5px solid rgba(243,230,220,.12);pointer-events:none}
.site-foot::after{content:"";position:absolute;left:50%;bottom:-320px;transform:translateX(-50%);width:680px;height:680px;border-radius:50%;border:1px solid rgba(243,230,220,.07);pointer-events:none}
.leafmark{width:42px;height:42px;margin:0 auto 16px;border-radius:50%;background:rgba(243,230,220,.14);border:1px solid rgba(243,230,220,.3);display:grid;place-items:center}
.leafmark svg{width:20px;height:20px}
.tagline{font:italic 500 1.2rem/1.5 var(--serif);color:rgba(243,230,220,.85);max-width:40ch;margin:0 auto}
.values{display:flex;align-items:center;justify-content:center;gap:16px;margin:26px auto 0;max-width:380px}
.values::before,.values::after{content:"";flex:1;height:1px;background:rgba(243,230,220,.2)}
.values span{font:700 .62rem var(--sans);letter-spacing:.26em;text-transform:uppercase;color:rgba(243,230,220,.6)}
.values b{font:600 .95rem var(--serif);color:rgba(243,230,220,.9)}
@media(max-width:600px){.site-foot{padding:40px 20px 36px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.snowfall{display:none}}
`

// __SYMS__

const FbSymbols = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
    <defs>
      <symbol id="bloom" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(72 12 12)" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(144 12 12)" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(216 12 12)" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(288 12 12)" />
        </g>
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </symbol>
      <symbol id="cornerfl" viewBox="0 0 90 90">
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
      <symbol id="sprig" viewBox="0 0 260 64">
        <g id="spL" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <path d="M118 54C88 52 58 42 36 20" />
          <path d="M104 50q-3-10 3-18q7 7 3 18Z" fill="currentColor" opacity=".28" stroke="none" />
          <path d="M86 44q-4-9 0-18q7 6 4 18Z" fill="currentColor" opacity=".22" stroke="none" />
          <path d="M66 34q-5-8-3-17q8 5 7 17Z" fill="currentColor" opacity=".22" stroke="none" />
          <path d="M50 24q-6-7-6-16q9 4 10 16Z" fill="currentColor" opacity=".18" stroke="none" />
          <circle cx="124" cy="54" r="2" fill="currentColor" stroke="none" />
        </g>
        <use href="#spL" transform="translate(260 0) scale(-1 1)" />
        <g transform="translate(118 8) scale(2)">
          <use href="#bloom" width="12" height="12" style={{ color: 'inherit' }} />
        </g>
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="130" cy="17" r="5.5" />
          <path d="M130 8.5v-3M136.5 17h3M130 25.5v3M123.5 17h-3M134.6 12.4l2.1-2.1M134.6 21.6l2.1 2.1M125.4 21.6l-2.1 2.1M125.4 12.4l-2.1-2.1" />
        </g>
      </symbol>
    </defs>
  </svg>
)

// __COMP__

const BLANK = { date: '', dep: '', svc: '', notes: '', msg: '', name: '', phone: '', email: '' }
const SERVICES = [['Funeral service', 'Funeral'], ['Memorial', 'Memorial'], ['Celebration of life', 'Celebration of life'], ['Graveside', 'Graveside']]

export default function FlowerSnowBookingForm({ open, selected = [], quantities = {}, arrangements = [], onQtyChange, onRemove, onBooked, onClose }) {
  const [form, setForm] = useState(BLANK)
  const [bad, setBad] = useState({})
  const [sending, setSending] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const totalItems = selected.reduce((s, id) => s + (quantities[id] || 1), 0)
  const selItems = selected.map(id => arrangements.find(a => a.id === id)).filter(Boolean)
  const hasPrices = selItems.some(a => a.price != null)
  const totalPrice = selItems.reduce((s, a) => s + (a.price != null ? a.price * (quantities[a.id] || 1) : 0), 0)

  const d0 = new Date()
  const minDate = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`

  const set = (k) => ({
    value: form[k],
    onChange: (e) => {
      setForm(f => ({ ...f, [k]: e.target.value }))
      setBad(b => ({ ...b, [k]: false }))
    },
  })

  const validate = () => {
    const b = {}
    if (!form.date || form.date < minDate) b.date = true
    if (!form.svc) b.svc = true
    if (form.name.trim().length < 2) b.name = true
    if (!/^[+\d][\d\s().-]{6,}$/.test(form.phone.trim())) b.phone = true
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) b.email = true
    setBad(b)
    if (Object.keys(b).length) {
      const first = document.querySelector('.fbp-panel .field.bad input, .fbp-panel .field.bad select, .fbp-panel .field.bad textarea')
      if (first) first.focus()
      return false
    }
    return true
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSending(true)
    try {
      const names = selected.map(id => {
        const arr = arrangements.find(a => a.id === id)
        return (arr?.name || arr?.title || 'Arrangement') + ' ×' + (quantities[id] || 1)
      }).join(', ')
      const instructions = [form.svc && `Service type: ${form.svc}`, form.notes && `Flower notes: ${form.notes}`].filter(Boolean).join(' | ')
      await api.post('/florist/bookings', {
        arrangement_name: names,
        deceased_name: form.dep || null,
        booked_by: form.name || null,
        date: form.date || null,
        phone: form.phone || null,
        email: form.email || null,
        card_message: form.msg || null,
        quantity: totalItems,
        special_instructions: instructions || null
      })
      const ref = 'MH-' + Math.random().toString(36).slice(2, 6).toUpperCase()
      const dateStr = form.date ? new Date(form.date + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : ''
      setConfirm({ ref, dateStr })
    } catch (error) {
      alert(error.friendlyMessage || 'Failed to submit. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const resetAll = () => {
    setForm(BLANK)
    setBad({})
    setConfirm(null)
    if (onBooked) onBooked()
  }

  if (!open) return null

  return (
    <>
      <div className="fbp-scrim" onClick={onClose} />
      <style dangerouslySetInnerHTML={{ __html: FORM_CSS }} />
      <aside className="fbp-panel" role="dialog" aria-modal="true" aria-label="Flower booking">
        <Snowfall count={8} opacity={0.45} colors={['#DCAEA6', '#F0D9C8', '#E5C1B8']} bounded />
        <FbSymbols />
        <button className="fbp-close" onClick={onClose} aria-label="Close booking panel">×</button>

        <div className="fbp-scroll">
          <div className="fb-page">
            <div className="frame">
              <svg className="corner tl"><use href="#cornerfl" /></svg>
              <svg className="corner tr"><use href="#cornerfl" /></svg>
              <svg className="corner bl"><use href="#cornerfl" /></svg>
              <svg className="corner br"><use href="#cornerfl" /></svg>

              <div className="sheet">
                <div className="head">
                  <svg className="sprig"><use href="#sprig" /></svg>
                  <h1>Flower booking</h1>
                  <p className="sub">Hand-arranged · Delivered with grace</p>
                </div>

                {confirm ? (
                  <div className="conf">
                    <svg className="sprig"><use href="#sprig" /></svg>
                    <div className="ccheck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg></div>
                    <h2>Booking received</h2>
                    <p className="csub">We&apos;ll confirm by phone within two hours.</p>
                    <div className="cref">
                      {confirm.ref && <span>Ref {confirm.ref}</span>}
                      {confirm.dateStr && <span>{confirm.dateStr}</span>}
                    </div>
                    <div className="cactions">
                      <button type="button" className="btn-ghost" style={{ marginTop: 0 }} onClick={resetAll}>Make another booking</button>
                    </div>
                  </div>
                ) : (
                  <form noValidate onSubmit={submit}>
                    <fieldset>
                      <div className="fs-title"><svg className="b"><use href="#bloom" /></svg>Your selections</div>
                      {selItems.map(a => {
                        const qty = quantities[a.id] || 1
                        return (
                          <div key={a.id} className="selrow">
                            <img className="thumb" src={a.img || a.portrait} alt={a.name || a.title} />
                            <div className="info">
                              <div className="nm">{a.name || a.title}</div>
                              <div className="tg">{a.tag} · {a.note}</div>
                            </div>
                            <div className="qty">
                              <button type="button" aria-label="Decrease" onClick={() => onQtyChange && onQtyChange(a.id, qty - 1)}>−</button>
                              <span>{qty}</span>
                              <button type="button" aria-label="Increase" onClick={() => onQtyChange && onQtyChange(a.id, qty + 1)}>+</button>
                            </div>
                            <button type="button" className="rm" aria-label="Remove" onClick={() => onRemove && onRemove(a.id)}>×</button>
                          </div>
                        )
                      })}
                      <div className="seltotal">
                        <span>{totalItems} arrangement{totalItems !== 1 ? 's' : ''} total</span>
                        {hasPrices && <b>≈ ${totalPrice.toLocaleString()}</b>}
                      </div>
                    </fieldset>

                    <fieldset>
                      <div className="fs-title"><svg className="b"><use href="#bloom" /></svg>Service</div>
                      <div className="frow">
                        <div className={'field' + (bad.date ? ' bad' : '')}>
                          <label htmlFor="fDate">Service date</label>
                          <div className="inp">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5.5" width="14" height="14.5" rx="1" /><path d="M5 9.5h14M9 3.5v4M15 3.5v4" /></svg>
                            <input type="date" id="fDate" min={minDate} {...set('date')} />
                          </div>
                          <p className="err">Required</p>
                        </div>
                        <div className="field">
                          <label htmlFor="fDep">Departed <span className="opt">(optional)</span></label>
                          <div className="inp">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4" /><path d="M5 20c1.2-3.6 3.9-5.4 7-5.4s5.8 1.8 7 5.4" /></svg>
                            <input type="text" id="fDep" {...set('dep')} />
                          </div>
                        </div>
                      </div>
                      <div className={'field' + (bad.svc ? ' bad' : '')}>
                        <label>Service type</label>
                        <div className="pills">
                          {SERVICES.map(([val, label], i) => (
                            <span key={val}>
                              <input type="radio" name="svc" id={'svc' + i} value={val} checked={form.svc === val} onChange={() => { setForm(f => ({ ...f, svc: val })); setBad(b => ({ ...b, svc: false })) }} />
                              <label htmlFor={'svc' + i}>{label}</label>
                            </span>
                          ))}
                        </div>
                        <p className="err">Required</p>
                      </div>
                    </fieldset>

                    <fieldset>
                      <div className="fs-title"><svg className="b"><use href="#bloom" /></svg>Arrangement</div>
                      <div className="field">
                        <label htmlFor="fNotes">Flower notes <span className="opt">(optional)</span></label>
                        <div className="tareawrap">
                          <textarea id="fNotes" maxLength={300} placeholder="Favourite blooms, colours…" {...set('notes')} />
                          <span className="counter">{form.notes.length} / 300</span>
                        </div>
                      </div>
                    </fieldset>

                    <fieldset>
                      <div className="fs-title"><svg className="b"><use href="#bloom" /></svg>Card message</div>
                      <div className="field">
                        <label htmlFor="fMsg">Sympathy card <span className="opt">(optional)</span></label>
                        <div className="tareawrap">
                          <textarea id="fMsg" maxLength={200} {...set('msg')} />
                          <span className="counter">{form.msg.length} / 200</span>
                        </div>
                      </div>
                    </fieldset>

                    <fieldset>
                      <div className="fs-title"><svg className="b"><use href="#bloom" /></svg>Your details</div>
                      <div className={'field' + (bad.name ? ' bad' : '')}>
                        <label htmlFor="fName">Full name</label>
                        <div className="inp">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4" /><path d="M5 20c1.2-3.6 3.9-5.4 7-5.4s5.8 1.8 7 5.4" /></svg>
                          <input type="text" id="fName" {...set('name')} />
                        </div>
                        <p className="err">Required</p>
                      </div>
                      <div className="frow">
                        <div className={'field' + (bad.phone ? ' bad' : '')}>
                          <label htmlFor="fPhone">Phone</label>
                          <div className="inp">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.4 1.6a12.5 12.5 0 0 0 4.8 4.8L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
                            <input type="tel" id="fPhone" {...set('phone')} />
                          </div>
                          <p className="err">Required</p>
                        </div>
                        <div className={'field' + (bad.email ? ' bad' : '')}>
                          <label htmlFor="fEmail">Email</label>
                          <div className="inp">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="6" width="16" height="12" rx="1" /><path d="M4 7l8 6 8-6" /></svg>
                            <input type="email" id="fEmail" {...set('email')} />
                          </div>
                          <p className="err">Required</p>
                        </div>
                      </div>
                    </fieldset>

                    <button className="submit" type="submit" disabled={sending}>
                      {sending
                        ? <><span className="fbspin" />Sending…</>
                        : <><svg className="b"><use href="#bloom" /></svg>Request booking</>}
                    </button>
                    <p className="formnote">No payment now — we&apos;ll confirm by phone.</p>
                  </form>
                )}
              </div>

              <footer className="site-foot">
                <div className="leafmark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#F3E6DC" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z" /><path d="M4 20c4-6.5 8.5-10 13-12.5" />
                  </svg>
                </div>
                <p className="tagline">Every farewell, arranged with grace.</p>
                <div className="values">
                  <span>Dignity</span><b>·</b><span>Care</span><b>·</b><span>Respect</span>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}