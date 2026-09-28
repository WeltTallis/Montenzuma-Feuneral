// FlowerSnowBookingForm.jsx
// Flower booking side panel: two step wizard, autofilled service date and time,
// departed name dedication, free text ribbon color, size cards, flower note chips,
// review step, and the compact confirmation. Rosewood footer inside.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
.fbp-scrim{position:fixed;inset:0;background:rgba(30,18,19,.45);backdrop-filter:blur(2px);z-index:300;animation:fbFade .25s ease}
@keyframes fbFade{from{opacity:0}to{opacity:1}}
.fbp-panel{position:fixed;top:0;right:0;bottom:0;width:min(620px,100vw);z-index:310;background:var(--paper);
  box-shadow:-30px 0 80px rgba(50,30,32,.35);animation:fbpIn .38s cubic-bezier(.16,1,.3,1);
  display:flex;flex-direction:column;overflow:hidden;font:400 16px/1.55 var(--sans);color:var(--ink)}
@keyframes fbpIn{from{transform:translateX(64px);opacity:0}to{transform:none;opacity:1}}
.fbp-close{position:absolute;top:12px;right:12px;z-index:30;width:40px;height:40px;border-radius:50%;
  border:1px solid var(--hair2);background:var(--card);color:var(--rosewood);font-size:22px;line-height:1;
  cursor:pointer;display:grid;place-items:center;padding:0;transition:.2s}
.fbp-close:hover{background:var(--rosewood);color:#FBF3EE;border-color:var(--rosewood)}
.fbp-scroll{overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch;position:relative}
.fbp-panel .snowfall{z-index:0}
*{-webkit-tap-highlight-color:transparent}
.fbp-panel button:focus-visible,.fbp-panel input:focus-visible,.fbp-panel textarea:focus-visible{outline:2px solid var(--rose);outline-offset:2px}
svg{display:block}
.fbp-panel button{font-family:var(--sans);color:var(--ink);cursor:pointer}
.fbp-panel ::selection{background:var(--blush)}
/* page / frame */
.fb-page{position:relative;z-index:1;width:100%}
.frame{position:relative;border:1px solid var(--hair);background:var(--card);box-shadow:0 30px 70px -46px rgba(107,64,69,.45)}
.sheet{position:relative;outline:1px solid var(--hair);outline-offset:7px;margin:7px}
.corner{position:absolute;width:76px;height:76px;color:var(--hair2);pointer-events:none;z-index:2}
.corner.tl{top:8px;left:8px}
.corner.tr{top:8px;right:8px;transform:scaleX(-1)}
.corner.bl{bottom:8px;left:8px;transform:scaleY(-1)}
.corner.br{bottom:8px;right:8px;transform:scale(-1)}
/* head */
.head{text-align:center;padding:26px 24px 0}
.head .sprig{width:min(300px,72vw);height:auto;margin:0 auto 2px}
.head h1{font:600 clamp(1.7rem,5vw,2.05rem)/1.1 var(--serif);letter-spacing:.02em;color:var(--rosewood)}
.head .sub{font:italic 500 .95rem var(--serif);color:var(--rose);margin-top:2px}
.inmemory{font:italic 600 1.05rem var(--serif);color:var(--gold);margin-top:8px;animation:memIn .3s ease}
@keyframes memIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
/* progress steps */
.steps{display:flex;justify-content:space-between;list-style:none;padding:20px 56px 4px}
.stp{flex:1;text-align:center;position:relative}
.stp .dot{width:32px;height:32px;border-radius:50%;border:1.5px solid var(--hair2);background:var(--card);
  display:grid;place-items:center;margin:0 auto 6px;font:800 .74rem var(--sans);color:var(--ink3);transition:.25s;position:relative;z-index:1}
.stp .lbl{font:800 .58rem var(--sans);letter-spacing:.16em;text-transform:uppercase;color:var(--ink3);transition:.25s}
.stp::before{content:"";position:absolute;top:16px;left:calc(-50% + 26px);right:calc(50% + 26px);height:1.5px;background:var(--hair2);transition:.3s}
.stp:first-child::before{display:none}
.stp.ln-on::before{background:var(--blush)}
.stp.current .dot{background:var(--rosewood);border-color:var(--rosewood);color:#FBF3EE;box-shadow:0 0 0 5px var(--blush-xl)}
.stp.current .lbl{color:var(--rosewood)}
.stp.done .dot{background:var(--blush-xl);border-color:var(--rose);color:var(--rosewood)}
.stp.done .lbl{color:var(--rose)}
@media(max-width:430px){.stp .lbl{display:none}.stp::before{top:15px;left:calc(-50% + 24px);right:calc(50% + 24px)}}
/* panes */
.panes{padding:14px 32px 30px}
@media(max-width:600px){.panes{padding:12px 18px 24px}}
.pane{display:none}
.pane.active{display:block;animation:stepIn .35s cubic-bezier(.16,1,.3,1)}
@keyframes stepIn{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}
.fs-title{display:flex;align-items:center;gap:9px;font:800 .68rem var(--sans);letter-spacing:.22em;text-transform:uppercase;color:var(--rose);margin:20px 0 16px}
.fs-title .b{width:16px;height:16px;flex:none}
.fs-title::after{content:"";flex:1;height:1px;background:linear-gradient(to right,var(--hair),transparent)}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:540px){.frow{grid-template-columns:1fr}}
.field{margin-bottom:16px}
.field:last-child{margin-bottom:0}
.field>label{display:block;font:800 .68rem var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--ink2);margin-bottom:.5rem}
.opt{display:inline;text-transform:none;letter-spacing:0;font-weight:600;color:var(--ink3)}
.field input,.field textarea{width:100%;background:#fff;border:1px solid var(--hair2);border-radius:12px;
  padding:.82rem .95rem;font:500 1rem/1.4 var(--sans);color:var(--ink);transition:border-color .2s,box-shadow .2s;min-height:50px}
.field textarea{resize:vertical;min-height:92px}
.field input:focus,.field textarea:focus{outline:none;border-color:var(--rose);box-shadow:0 0 0 3px var(--blush-xl)}
.field ::placeholder{color:var(--ink3)}
.autofilled{font:italic 500 .84rem var(--serif);color:var(--ink3);margin-top:6px}
.tareawrap{position:relative}
.tareawrap textarea{padding-bottom:2.3rem}
.counter{position:absolute;bottom:10px;right:12px;font:700 .66rem var(--sans);color:var(--ink3);background:#fff;padding:1px 5px;border-radius:6px}
/* size cards */
.sizes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
@media(max-width:460px){.sizes{grid-template-columns:1fr 1fr}}
.sizecard{position:relative;border:1px solid var(--hair2);border-radius:14px;background:#fff;padding:.85rem .6rem;text-align:center;transition:.2s}
.sizecard b{display:block;font:600 1.05rem var(--serif);color:var(--ink)}
.sizecard small{display:block;font:600 .64rem var(--sans);letter-spacing:.06em;color:var(--ink3);margin-top:2px}
.sizecard:hover{border-color:var(--rose)}
.sizecard.on{border-color:var(--rosewood);background:var(--blush-xl);box-shadow:0 0 0 1px var(--rosewood)}
.sizecard .tick{position:absolute;top:8px;right:8px;width:18px;height:18px;border-radius:50%;background:var(--rosewood);color:#FBF3EE;display:none;place-items:center}
.sizecard.on .tick{display:grid}
.sizecard .tick svg{width:10px;height:10px}
/* suggestion chips */
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.chip{padding:.45rem .85rem;border:1px dashed var(--hair2);border-radius:999px;background:transparent;
  font:600 .76rem var(--sans);color:var(--ink2);transition:.2s}
.chip:hover{border-color:var(--rose);color:var(--rosewood);border-style:solid}
/* errors */
.err{display:none;font:700 .76rem var(--sans);color:var(--brick);margin-top:6px}
.field.bad input,.field.bad textarea{border-color:var(--brick)}
.field.bad .err{display:block}
.field.bad>label{color:var(--brick)}
/* review */
.review{background:var(--blush-xl);border:1px solid var(--hair);border-radius:14px;padding:6px 18px;margin-bottom:16px}
.rv{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px dashed var(--hair2)}
.rv:last-child{border-bottom:0}
.rv dt{font:800 .64rem var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--ink2);padding-top:3px;flex:none}
.rv dd{font:500 .95rem var(--sans);color:var(--ink);text-align:right;min-width:0;overflow-wrap:anywhere}
/* buttons */
.btnrow{display:flex;gap:12px;margin-top:24px}
.btn-back{flex:0 0 auto;padding:1.05rem 1.5rem;border:1px solid var(--hair2);border-radius:12px;background:#fff;
  color:var(--rosewood);font:800 .78rem var(--sans);letter-spacing:.16em;text-transform:uppercase;transition:.25s}
.btn-back:hover{background:var(--rosewood);color:#FBF3EE;border-color:var(--rosewood)}
.btn-next,.submit{flex:1;padding:1.05rem;background:var(--rosewood);color:#FBF3EE;border:0;border-radius:12px;
  font:800 .84rem var(--sans);letter-spacing:.2em;text-transform:uppercase;transition:.25s;display:flex;align-items:center;justify-content:center;gap:10px}
.btn-next:hover,.submit:hover:not(:disabled){background:var(--rosewood-d)}
.submit:disabled{opacity:.75;cursor:wait}
.btn-next .b,.submit .b{width:16px;height:16px}
.fbspin{width:15px;height:15px;border-radius:50%;border:2px solid rgba(251,243,238,.35);border-top-color:#FBF3EE;animation:fbspin .7s linear infinite;flex:none}
@keyframes fbspin{to{transform:rotate(360deg)}}
.formnote{text-align:center;font:italic 500 .88rem var(--serif);color:var(--ink3);padding:12px 0 0}
/* confirmation: heading first, compact, sprig below the button */
.conf{text-align:center;padding:34px 22px 26px}
.conf h2{font:600 1.65rem/1.1 var(--serif);color:var(--rosewood)}
.csub{font:italic 500 .98rem var(--serif);color:var(--ink2);margin-top:5px}
.cref{display:inline-flex;gap:14px;flex-wrap:wrap;justify-content:center;margin:14px 0;padding:10px 16px;border:1px solid var(--hair);border-radius:10px;font:700 .8rem var(--sans);background:var(--blush-xl)}
.conf .btn-ghost{margin-top:2px}
.conf .sprig{width:min(190px,58vw);height:auto;margin:16px auto 0}
.btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:.72rem 1.35rem;border:1px solid var(--hair2);border-radius:10px;background:#fff;
  font:800 .74rem var(--sans);letter-spacing:.14em;text-transform:uppercase;transition:.25s;color:var(--rosewood)}
.btn-ghost:hover{background:var(--rosewood);color:#FBF3EE;border-color:var(--rosewood)}
/* rosewood footer */
.site-foot{position:relative;overflow:hidden;background:var(--rosewood);color:var(--cream);text-align:center;padding:38px 20px 34px}
.site-foot::before{content:"";position:absolute;left:50%;bottom:-260px;transform:translateX(-50%);width:520px;height:520px;border-radius:50%;border:1.5px solid rgba(243,230,220,.12);pointer-events:none}
.site-foot::after{content:"";position:absolute;left:50%;bottom:-320px;transform:translateX(-50%);width:680px;height:680px;border-radius:50%;border:1px solid rgba(243,230,220,.07);pointer-events:none}
.leafmark{width:42px;height:42px;margin:0 auto 14px;border-radius:50%;background:rgba(243,230,220,.14);border:1px solid rgba(243,230,220,.3);display:grid;place-items:center;position:relative}
.leafmark svg{width:20px;height:20px}
.tagline{font:italic 500 1.12rem/1.5 var(--serif);color:rgba(243,230,220,.85);max-width:40ch;margin:0 auto;position:relative}
.values{display:flex;align-items:center;justify-content:center;gap:14px;margin:20px auto 0;max-width:380px;position:relative}
.values::before,.values::after{content:"";flex:1;height:1px;background:rgba(243,230,220,.2)}
.values span{font:800 .6rem var(--sans);letter-spacing:.26em;text-transform:uppercase;color:rgba(243,230,220,.6)}
.values b{font:600 .9rem var(--serif);color:rgba(243,230,220,.9)}
@media(max-width:600px){.site-foot{padding:40px 20px 36px}}
@media(prefers-reduced-motion:reduce){.fbp-panel *,.fbp-scrim{animation:none!important;transition:none!important}.snowfall{display:none}}
`

const FbSymbols = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
    <defs>
      {/* small bloom icon: bright filled petals with gold center */}
      <symbol id="bloom" viewBox="0 0 24 24">
        <g fill="#F0AFA0" stroke="#C96F63" strokeWidth="1.1" strokeLinejoin="round">
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(72 12 12)" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(144 12 12)" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(216 12 12)" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(288 12 12)" />
        </g>
        <circle cx="12" cy="12" r="1.7" fill="#E9B44C" />
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
      {/* reusable bright flower: solid petals plus gold center, recolorable */}
      <g id="flower6">
        <g fill="var(--pf,#E58B80)" stroke="var(--ps,#C4675B)" strokeWidth="1">
          <ellipse cx="0" cy="-8" rx="3.4" ry="6.5" />
          <ellipse cx="0" cy="-8" rx="3.4" ry="6.5" transform="rotate(60)" />
          <ellipse cx="0" cy="-8" rx="3.4" ry="6.5" transform="rotate(120)" />
          <ellipse cx="0" cy="-8" rx="3.4" ry="6.5" transform="rotate(180)" />
          <ellipse cx="0" cy="-8" rx="3.4" ry="6.5" transform="rotate(240)" />
          <ellipse cx="0" cy="-8" rx="3.4" ry="6.5" transform="rotate(300)" />
        </g>
        <circle r="3.4" fill="#F2C94C" stroke="#C8A262" strokeWidth="1" />
      </g>
      {/* sprig: bright greens, solid bright blooms, side blooms in bright rosewood */}
      <symbol id="sprig" viewBox="0 0 260 64">
        <g id="spg">
          <path d="M118 55C88 53 58 43 35 21" fill="none" stroke="#6FA45B" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M102 51q-3-11 3-19q8 7 4 19Z" fill="#8CC071" />
          <path d="M82 43q-4-10 0-19q8 6 5 19Z" fill="#A5D189" />
          <path d="M62 33q-5-9-3-18q9 5 8 18Z" fill="#8CC071" />
          <path d="M46 23q-6-8-6-17q10 4 11 17Z" fill="#A5D189" />
        </g>
        <use href="#spg" transform="translate(260 0) scale(-1 1)" />
        <use href="#flower6" transform="translate(34 20) scale(.85)" style={{ '--pf': '#D97F86', '--ps': '#B05A62' }} />
        <use href="#flower6" transform="translate(226 20) scale(.85)" style={{ '--pf': '#D97F86', '--ps': '#B05A62' }} />
        <use href="#flower6" transform="translate(130 27) scale(1.4)" />
        <circle cx="122" cy="56" r="2.2" fill="#E9B44C" />
        <circle cx="138" cy="56" r="2.2" fill="#E9B44C" />
      </symbol>
      <symbol id="tick" viewBox="0 0 24 24">
        <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </symbol>
    </defs>
  </svg>
)

/* helpers */

const BLANK = { date: '', time: '', dep: '', ribbon: '', size: '', notes: '', name: '', phone: '', email: '' }
const SIZES = [
  ['Standard', 'Classic tribute'],
  ['Large', 'Full & abundant'],
  ['Grand', 'Statement piece'],
]
const NOTE_CHIPS = ['White lilies', 'Blush roses', 'Seasonal wildflowers', 'Extra greenery', 'No strong fragrance']

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const nowTimeStr = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const fmtTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'pm' : 'am'
  const hh = ((h + 11) % 12) + 1
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`
}

/* main component */

export default function FlowerSnowBookingForm({ open, onBooked, onClose }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)          // 1 arrangement, 2 details, 3 confirmation
  const [form, setForm] = useState(BLANK)
  const [bad, setBad] = useState({})
  const [sending, setSending] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const minDate = todayStr()

  /* autofill date and time whenever the panel opens */
  useEffect(() => {
    if (open) {
      setForm(f => ({ ...f, date: todayStr(), time: nowTimeStr() }))
    }
  }, [open])

  /* Escape closes the panel */
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const set = (k) => ({
    value: form[k],
    onChange: (e) => {
      setForm(f => ({ ...f, [k]: e.target.value }))
      setBad(b => ({ ...b, [k]: false }))
    },
  })

  const setPhone = (e) => {
    const raw = e.target.value
    const plus = raw.trim().startsWith('+')
    const d = raw.replace(/\D/g, '').slice(0, 15)
    setForm(f => ({ ...f, phone: (plus ? '+' : '') + d.replace(/(\d{3})(?=\d)/g, '$1 ') }))
    setBad(b => ({ ...b, phone: false }))
  }

  const toggleSize = (s) => {
    setForm(f => ({ ...f, size: f.size === s ? '' : s }))
  }

  const addChip = (text) => {
    setForm(f => {
      const cur = f.notes.trim()
      if (cur.toLowerCase().includes(text.toLowerCase())) return f
      return { ...f, notes: (cur ? cur.replace(/,\s*$/, '') + ', ' : '') + text }
    })
  }

  const dep = form.dep.trim()

  /* step 1 to step 2: date and time required */
  const goDetails = () => {
    const b = {}
    if (!form.date || form.date < minDate) b.date = true
    if (!form.time) b.time = true
    setBad(prev => ({ ...prev, ...b }))
    if (Object.keys(b).length) return
    setStep(2)
  }

  const submit = async () => {
    const b = {}
    if (form.name.trim().length < 2) b.name = true
    if (!/^[+\d][\d\s().-]{6,}$/.test(form.phone.trim())) b.phone = true
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) b.email = true
    setBad(prev => ({ ...prev, ...b }))
    if (Object.keys(b).length) {
      const first = document.querySelector('.fbp-panel .field.bad input, .fbp-panel .field.bad textarea')
      if (first) first.focus()
      return
    }
    setSending(true)
    try {
      await api.post('/florist/bookings', {
        date: form.date || null,
        time: form.time || null,
        deceased_name: dep || null,
        ribbon_color: form.ribbon.trim() || null,
        size: form.size || null,
        special_instructions: form.notes.trim() || null,
        booked_by: form.name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
      })
      const ref = 'MH-' + Math.random().toString(36).slice(2, 6).toUpperCase()
      const dateStr = form.date
        ? new Date(form.date + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
        + (form.time ? ' · ' + fmtTime(form.time) : '')
        : ''
      setConfirm({
        ref,
        dateStr,
        mem: dep ? `Flowers for ${dep}, arranged with care.` : "We'll confirm by phone within two hours.",
      })
      setStep(3)
    } catch (error) {
      alert(error.friendlyMessage || 'Failed to submit. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const resetAll = () => {
    setForm({ ...BLANK, date: todayStr(), time: nowTimeStr() })
    setBad({})
    setConfirm(null)
    setSending(false)
    setStep(1)
    if (onBooked) onBooked()
  }

  /* review rows for step 2 */
  const reviewRows = (() => {
    const dateStr = form.date
      ? new Date(form.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : ''
    const when = [dateStr, form.time ? fmtTime(form.time) : ''].filter(Boolean).join(' · ')
    return [
      ['When', when],
      ['Departed', dep],
      ['Ribbon color', form.ribbon.trim()],
      ['Size', form.size],
      ['Notes', form.notes.trim()],
    ].filter(r => r[1])
  })()

  const stepClass = (n) =>
    'stp'
    + (n === step ? ' current' : '')
    + (n < step ? ' done' : '')
    + (n <= step && step <= 2 ? ' ln-on' : '')

  return (
    <>
      <div className="fbp-scrim" onClick={onClose} />
      <style dangerouslySetInnerHTML={{ __html: FORM_CSS }} />
      <aside className="fbp-panel" role="dialog" aria-modal="true" aria-label="Flower booking">
        <Snowfall count={10} opacity={0.5} colors={['#E8909B', '#F3B8AC', '#F6D3A0', '#BFD8A8']} bounded />
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
                  {!confirm && dep && <p className="inmemory">Flowers for {dep}</p>}
                </div>

                {!confirm && (
                  <ol className="steps">
                    <li className={stepClass(1)} aria-current={step === 1 ? 'step' : 'false'}>
                      <span className="dot">1</span><span className="lbl">Arrangement</span>
                    </li>
                    <li className={stepClass(2)} aria-current={step === 2 ? 'step' : 'false'}>
                      <span className="dot">2</span><span className="lbl">Details</span>
                    </li>
                  </ol>
                )}

                <div className="panes">

                  {/* STEP 1: arrangement */}
                  {step === 1 && (
                    <section className="pane active">
                      <div className="fs-title"><svg className="b"><use href="#bloom" /></svg>Service</div>
                      <div className="frow">
                        <div className={'field' + (bad.date ? ' bad' : '')}>
                          <label htmlFor="fDate">Service date</label>
                          <input type="date" id="fDate" min={minDate} {...set('date')} />
                          <p className="err">Required</p>
                        </div>
                        <div className={'field' + (bad.time ? ' bad' : '')}>
                          <label htmlFor="fTime">Service time</label>
                          <input type="time" id="fTime" {...set('time')} />
                          <p className="err">Required</p>
                        </div>
                      </div>
                      <p className="autofilled">Set to today, just now. Adjust if the service is later.</p>

                      <div className="field">
                        <label htmlFor="fDep">Departed name <span className="opt">(optional)</span></label>
                        <input type="text" id="fDep" placeholder="e.g. Mary Wanjiku" {...set('dep')} />
                      </div>

                      <div className="fs-title"><svg className="b"><use href="#bloom" /></svg>Arrangement</div>

                      <div className="field">
                        <label htmlFor="fRibbon">Ribbon color <span className="opt">(optional)</span></label>
                        <input type="text" id="fRibbon" placeholder="Type the color you want, e.g. Ivory White" {...set('ribbon')} />
                      </div>

                      <div className="field">
                        <label>Size preference <span className="opt">(optional)</span></label>
                        <div className="sizes">
                          {SIZES.map(([s, sub]) => (
                            <button
                              key={s}
                              type="button"
                              className={'sizecard' + (form.size === s ? ' on' : '')}
                              onClick={() => toggleSize(s)}
                            >
                              <span className="tick"><svg><use href="#tick" /></svg></span>
                              <b>{s}</b>
                              <small>{sub}</small>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="field">
                        <label htmlFor="fNotes">Flower notes <span className="opt">(optional)</span></label>
                        <div className="tareawrap">
                          <textarea id="fNotes" maxLength={300} placeholder="Favourite blooms, colours..." {...set('notes')} />
                          <span className="counter">{form.notes.length} / 300</span>
                        </div>
                        <div className="chips">
                          {NOTE_CHIPS.map(c => (
                            <button key={c} type="button" className="chip" onClick={() => addChip(c)}>{c}</button>
                          ))}
                        </div>
                      </div>

                      <div className="btnrow">
                        <button type="button" className="btn-next" onClick={goDetails}>
                          Continue<svg className="b"><use href="#bloom" /></svg>
                        </button>
                      </div>
                    </section>
                  )}

                  {/* STEP 2: review + details */}
                  {step === 2 && (
                    <section className="pane active">
                      <div className="fs-title"><svg className="b"><use href="#bloom" /></svg>Review</div>
                      <dl className="review">
                        {reviewRows.length
                          ? reviewRows.map(([k, v]) => (
                            <div className="rv" key={k}><dt>{k}</dt><dd>{v}</dd></div>
                          ))
                          : <div className="rv"><dt>Arrangement</dt><dd>Standard, florist's choice</dd></div>}
                      </dl>

                      <div className="fs-title"><svg className="b"><use href="#bloom" /></svg>Your details</div>
                      <div className={'field' + (bad.name ? ' bad' : '')}>
                        <label htmlFor="fName">Full name</label>
                        <input type="text" id="fName" autoComplete="name" {...set('name')} />
                        <p className="err">Please enter your name</p>
                      </div>
                      <div className={'field' + (bad.phone ? ' bad' : '')}>
                        <label htmlFor="fPhone">Phone</label>
                        <input type="tel" id="fPhone" autoComplete="tel" inputMode="tel" value={form.phone} onChange={setPhone} />
                        <p className="err">Enter a valid phone number</p>
                      </div>
                      <div className={'field' + (bad.email ? ' bad' : '')}>
                        <label htmlFor="fEmail">Email</label>
                        <input type="email" id="fEmail" autoComplete="email" inputMode="email" {...set('email')} />
                        <p className="err">Enter a valid email address</p>
                      </div>

                      <div className="btnrow">
                        <button type="button" className="btn-back" onClick={() => setStep(1)}>Back</button>
                        <button className="submit" type="button" onClick={submit} disabled={sending}>
                          {sending
                            ? <><span className="fbspin" />Sending...</>
                            : <><svg className="b"><use href="#bloom" /></svg>Request booking</>}
                        </button>
                      </div>
                      <p className="formnote">No payment now. We'll confirm by phone.</p>
                    </section>
                  )}

                  {/* CONFIRMATION: heading first, sprig below the button */}
                  {step === 3 && confirm && (
                    <section className="pane active">
                      <div className="conf">
                        <h2>Booking received</h2>
                        <p className="csub">{confirm.mem}</p>
                        <div className="cref">
                          {confirm.ref && <span>Ref {confirm.ref}</span>}
                          {confirm.dateStr && <span>{confirm.dateStr}</span>}
                        </div>
                        <div>
                          <button type="button" className="btn-ghost" style={{ marginTop: 0 }} onClick={() => {
                            const slug = localStorage.getItem('tenantSlug') || ''
                            navigate(slug ? `/${slug}/receptionist` : '/reception')
                          }}>
                            Done
                          </button>
                        </div>
                        <svg className="sprig" aria-hidden="true"><use href="#sprig" /></svg>
                      </div>
                    </section>
                  )}

                </div>
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