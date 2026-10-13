import { useState } from 'react';
import { Plus, Trash2, Smartphone, Send, CheckCircle2, Copy, RefreshCw, Calendar, ArrowRight, MessageSquare, ShieldCheck } from 'lucide-react';
import { CONTACT, GROUP_COVER_VALUE, MIN_GROUP_MEMBERS, coverOptions, formatPlanAmount, planFor } from './amaniData';
import { InsuranceApiError, submitApplication, sendPolicySms } from '../../../api/insuranceApi';

const AF = {
  ink: '#12263a',
  inkMuted: '#5a7080',
  inkFaint: '#8799a7',
  navy: '#0b2e4a',
  navyDeep: '#071f33',
  navyMid: '#0e5a78',
  blue: '#0e7c9b',
  aqua: '#8ed8e6',
  bluePale: '#e3f2f6',
  field: '#f1f6f9',
  brass: '#0e7c9b',
  border: '#e3edf2',
  error: '#c0392b',
  success: '#15803d',
  sans: "'Source Sans 3', system-ui, sans-serif",
  serif: "'Merriweather', Georgia, serif",
};

const getInitialCover = () => {
  if (typeof window === 'undefined') return '';
  const requested = new URLSearchParams(window.location.search).get('plan');
  const normalized = requested === 'FamilyGroup' ? GROUP_COVER_VALUE : requested;
  return coverOptions.some(option => option.value === normalized) ? normalized : '';
};

const createInitial = () => {
  const cover = getInitialCover();
  return ({
    fullName: '',
    idNumber: '',
    age: '',
    employment: '',
    phone: '',
    email: '',
    cover,
    members: cover === GROUP_COVER_VALUE
      ? Array.from({ length: MIN_GROUP_MEMBERS - 1 }, () => newMember())
      : [],
    confirmAccepted: false,
    /* How often they intend to pay. Recorded at application time so the care
       team and the payments page agree on the schedule from day one. Defaults
       to monthly — the plan every member can afford — rather than leaving it
       blank and guessing later. */
    frequency: 'monthly',
  });
};

/* Payment frequencies offered on the application form. `months` is how many
   monthly contributions one payment covers. Quarterly is 3 months at the
   monthly rate with NO discount: there is no pricing engine in this codebase,
   so promising a saving the backend cannot honour would be a false claim.
   A real multi-month discount belongs in PLANS as an explicit rate. */
export const PAY_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly', months: 1, hint: 'Every month' },
  { value: 'quarterly', label: 'Quarterly', months: 3, hint: 'Every 3 months' },
];

/* Stable React keys for the repeater rows. A plain array index cannot be the
   key: deleting row 1 of 5 would make React reuse row 2's DOM node for row 1's
   data, which silently shifts every value down one box. */
let memberKeySeq = 0;
const newMember = () => ({ key: `af-member-${++memberKeySeq}`, fullName: '', phone: '' });

/* Required fields, in document order. `email` is deliberately absent — it is
   optional and is only validated when the visitor actually fills it in. */
const REQUIRED_FIELDS = ['fullName', 'idNumber', 'age', 'employment', 'phone', 'cover'];

const EMPLOYMENT_OPTIONS = [
  { value: 'employed', label: 'Employed' },
  { value: 'self-employed', label: 'Self-employed' },
  { value: 'business', label: 'Business person' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
];

/* SINGLE SOURCE OF TRUTH for validity. Every caller — onChange, onBlur,
   handleSubmit, and the green tick — routes through this. */
function isFieldValid(name, value) {
  switch (name) {
    case 'fullName':
      return value.trim().length > 1;
    case 'idNumber':
      return value.trim().length >= 4;
    case 'age': {
      const age = parseInt(value, 10);
      return value !== '' && Number.isFinite(age) && age >= 18 && age <= 120;
    }
    case 'employment':
    case 'cover':
      return value != null && value !== '';
    case 'phone':
      return value.replace(/\D/g, '').length >= 9;
    case 'email':
      /* Optional: empty is valid, filled-in must match. */
      return value.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'confirmAccepted':
      return value === true;
    default:
      return true;
  }
}

function errorMessageFor(name) {
  switch (name) {
    case 'fullName': return 'Full name is required.';
    case 'idNumber': return 'Valid ID number is required.';
    case 'age': return 'You must be 18 or older.';
    case 'employment': return 'Please select your employment status.';
    case 'phone': return 'Enter a valid phone number.';
    case 'email': return 'Enter a valid email address.';
    case 'cover': return 'Please choose a cover type.';
    case 'confirmAccepted': return 'Please tick the box to confirm before continuing.';
    default: return 'This field is required.';
  }
}

/* ---- Amani Group member rules ---------------------------------------
   Kept separate from isFieldValid because these fields live in an array and
   are never read off `formData` by name. Phone is required per member — a
   group policy needs a number for each person so the family line can reach
   them when it matters. */
function memberFieldValid(field, value) {
  const v = value == null ? '' : String(value);
  switch (field) {
    case 'fullName':
      return v.trim().length > 1;
    case 'phone':
      return v.replace(/\D/g, '').length >= 9;
    default:
      return true;
  }
}

function memberErrorFor(field) {
  switch (field) {
    case 'fullName': return "Enter this member's full name.";
    case 'phone': return 'Enter a valid phone number.';
    default: return 'This field is required.';
  }
}

/* Guarded: an invalid Date would otherwise render "Invalid Date" straight into
   the document header. */
function formatStamp(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const TickSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function AmaniApplicationForm() {
  const [formData, setFormData] = useState(createInitial);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationResult, setApplicationResult] = useState(null);
  /* Repeater state. Keyed by the row's stable `key`, never by array index, so
     deleting a middle row does not make one person's error message appear on
     somebody else's input. */
  const [memberErrors, setMemberErrors] = useState({});
  const [memberTouched, setMemberTouched] = useState({});
  const [groupTouched, setGroupTouched] = useState(false);
  const [groupError, setGroupError] = useState(undefined);
  /* Submit outcome: an error banner (server fault or a rejected payload) and
     a notice for the duplicate-application case. Both are cleared on the next
     attempt so a stale "could not save" never sits above a fresh form. */
  const [submitError, setSubmitError] = useState('');
  const [submitNotice, setSubmitNotice] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);
  const [showAltPhone, setShowAltPhone] = useState(false);
  const [altPhone, setAltPhone] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  /* Frozen at mount so the "Filling Date & Time" stamp cannot drift between
     renders while the visitor is typing. */
  const [fillStamp] = useState(() => formatStamp(new Date()));

  const selectedPlan = formData.cover ? planFor(formData.cover) : null;
  const policyNumberLabel = applicationResult?.policyNumber || applicationResult?.publicCode || '';
  const coverLabel = coverOptions.find((option) => option.value === (applicationResult?.coverType || formData.cover))?.label
    || applicationResult?.coverType
    || (coverOptions.find((option) => option.value === formData.cover)?.label || 'Family');
  const premiumValue = applicationResult?.monthlyPremium ?? selectedPlan?.monthly ?? planFor(formData.cover)?.monthly ?? 1000;
  const statusLabel = applicationResult?.status || 'active';
  const beneficiariesLabel = applicationResult?.beneficiaries || 'Next of kin not recorded.';

  const handleResendSms = async (targetPhone) => {
    const phoneToSend = targetPhone || formData.phone;
    if (!phoneToSend) return;
    setResendLoading(true);
    setResendStatus(null);
    try {
      const polNum = applicationResult?.policyNumber || applicationResult?.publicCode || formData.idNumber;
      await sendPolicySms(polNum, {
        phone: phoneToSend,
        type: 'registration',
      });
      setResendStatus({
        type: 'success',
        text: `SMS successfully dispatched to ${phoneToSend}!`,
      });
    } catch (err) {
      setResendStatus({
        type: 'error',
        text: err?.message || 'Could not send SMS at this moment. Please try again.',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleCopyPaymentLink = () => {
    if (applicationResult?.paymentLink) {
      navigator.clipboard.writeText(applicationResult.paymentLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  /* The applicant counts toward the Amani Group minimum, so the total on the
     policy is always one more than the number of repeater rows. */
  const groupSize = formData.members.length + 1;
  const isGroup = formData.cover === GROUP_COVER_VALUE;

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: nextValue }));

    /* Re-validate on every keystroke, but only once the field has been blurred
       — otherwise a red error flashes up while typing the first character. */
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: isFieldValid(name, nextValue) ? undefined : errorMessageFor(name),
      }));
    }
  };

  /* ---- Amani Group repeater -------------------------------------------
     These live outside the generic handleChange because they edit one row of
     an array rather than a top-level form field. `key` is never rewritten —
     only the named property is replaced, so React keeps the row's DOM node
     (and therefore its focus and caret position) while you type. */
  const addMember = () => {
    setFormData((prev) => ({ ...prev, members: [...prev.members, newMember()] }));
    /* A freshly added, empty row has no errors of its own — but the group as a
       whole may still be short of the minimum, so re-evaluate that. */
    setGroupTouched(false);
  };

  const updateMember = (key, field, value) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.key === key ? { ...m, [field]: value } : m)),
    }));

    if (memberTouched[key]?.[field]) {
      setMemberErrors((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [field]: memberFieldValid(field, value) ? undefined : memberErrorFor(field),
        },
      }));
    }
  };

  const removeMember = (key) => {
    setFormData((prev) => ({ ...prev, members: prev.members.filter((m) => m.key !== key) }));
    setMemberErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setMemberTouched((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  /* Switching away from Group must take the repeater with it, otherwise a
     Solo/Family application would still submit the leftover member rows. */
  const handleCoverChange = (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, cover: value }));
    setGroupTouched(false);
    setGroupError(undefined);

    if (value !== GROUP_COVER_VALUE) {
      setFormData((prev) => ({ ...prev, members: [] }));
      setMemberErrors({});
      setMemberTouched({});
      return;
    }

    /* Pre-seed with the minimum minus the applicant so the visitor is never
       staring at a completely empty section wondering what is missing. */
    setFormData((prev) => {
      const needed = MIN_GROUP_MEMBERS - 1 - prev.members.length;
      if (needed <= 0) return prev;
      const seeded = Array.from({ length: needed }, newMember);
      return { ...prev, members: [...prev.members, ...seeded] };
    });
  };

  /* Blur handler for a repeater field — marks it touched so the error only
     appears after the visitor has actually interacted with that box. */
  const handleMemberBlur = (key, field) => {
    const member = formData.members.find((m) => m.key === key);
    const value = member ? member[field] : '';

    setMemberTouched((prev) => ({ ...prev, [key]: { ...prev[key], [field]: true } }));
    setMemberErrors((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: memberFieldValid(field, value) ? undefined : memberErrorFor(field),
      },
    }));
  };

  const handleBlur = (event) => {
    const { name, type, checked, value } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: isFieldValid(name, nextValue) ? undefined : errorMessageFor(name),
    }));
  };

  const handleReset = () => {
    setFormData(createInitial());
    setErrors({});
    setTouched({});
    setMemberErrors({});
    setMemberTouched({});
    setGroupTouched(false);
    setGroupError(undefined);
    setSubmitError('');
    setSubmitNotice('');
    setApplicationResult(null);
    setSubmitted(false);
  };

  /* async: the submit is a real network call to insurance-service now, not the
       old local setTimeout. */
  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    const nextTouched = {};
    /* Required first so the error summary reads in document order, then the
       optional email and the declaration. */
    const fields = [...REQUIRED_FIELDS, 'email', 'confirmAccepted'];

    fields.forEach((field) => {
      nextTouched[field] = true;
      if (!isFieldValid(field, formData[field])) {
        nextErrors[field] = errorMessageFor(field);
      }
    });

    setTouched(nextTouched);
    setErrors(nextErrors);

    const firstBad = fields.find((field) => nextErrors[field]);
    if (firstBad) {
      /* Focus the offending control directly. The old code relied on
         querySelector('.has-error'), a class React may not have committed to the
         DOM yet on the same tick. */
      const node = document.querySelector(`[data-af-field="${firstBad}"]`);
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof node.focus === 'function') node.focus({ preventScroll: true });
      }
      return;
    }

    /* Amani Group only: enforce the minimum headcount and validate every
       additional person. Checked AFTER the main fields so a visitor who has
       not filled in their own name is not also told their group is too small. */
    if (isGroup) {
      const nextMemberErrors = {};
      const nextMemberTouched = {};

      formData.members.forEach((member) => {
        const rowErrors = {};
        const rowTouched = {};
        ['fullName', 'phone'].forEach((field) => {
          rowTouched[field] = true;
          if (!memberFieldValid(field, member[field])) {
            rowErrors[field] = memberErrorFor(field);
          }
        });
        if (Object.keys(rowErrors).length) nextMemberErrors[member.key] = rowErrors;
        nextMemberTouched[member.key] = rowTouched;
      });

      setMemberErrors(nextMemberErrors);
      setMemberTouched(nextMemberTouched);
      setGroupTouched(true);

      if (groupSize < MIN_GROUP_MEMBERS) {
        setGroupError(
          `Amani Group needs at least ${MIN_GROUP_MEMBERS} people. You have added ${groupSize}.`,
        );
      } else {
        setGroupError(undefined);
      }

      /* Focus the first offending repeater row, falling back to the first
         member box when the group is simply too small. */
      const badMemberKey = Object.keys(nextMemberErrors)[0] || formData.members[0]?.key;
      if (groupSize < MIN_GROUP_MEMBERS || badMemberKey) {
        const node = badMemberKey
          ? document.querySelector(`[data-af-member="${badMemberKey}"]`)
          : null;
        if (node) {
          node.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof node.focus === 'function') node.focus({ preventScroll: true });
        }
        return;
      }
    }

    setIsSubmitting(true);
    /* Real submit to insurance-service. The backend validates the same rules
       this form does and returns a per-field `errors` map, which is merged
       into the local error state so a server-side rejection is shown next to
       the right input rather than swallowed.
       NOTE: `members` carries a `key` used only for React reconciliation; it
       is stripped here so it never reaches the API. */
    try {
      const result = await submitApplication({
        fullName: formData.fullName,
        idNumber: formData.idNumber,
        age: formData.age,
        employment: formData.employment,
        phone: formData.phone,
        email: formData.email,
        cover: formData.cover,
        coverType: formData.cover,
        coveredCount: formData.members.length + 1,
        frequency: formData.frequency,
        confirmAccepted: formData.confirmAccepted,
        members: formData.members.map(({ fullName: n, phone: p }) => ({ fullName: n, phone: p })),
      });

      setApplicationResult(result);
      setSubmitted(true);

      /* A duplicate submission returns 200 with `duplicate: true`. That is
         still a success from the family's point of view, but they should be
         told they already applied rather than left wondering. */
      if (result?.duplicate) {
        setSubmitNotice(result.message);
      }
    } catch (err) {
      if (err instanceof InsuranceApiError) {
        if (err.status >= 500) {
          /* A server fault is not the visitor's fault: do NOT paint their
             form red, just say we could not save it and let them retry. */
          setSubmitError(
            'We could not save your application just now. Please try again, or call us on (020) 2346928.',
          );
        } else {
          setErrors((prev) => ({ ...prev, ...err.errors }));
          setSubmitError(err.message);

          const firstField = Object.keys(err.errors || {})[0];
          if (firstField) {
            const node = document.querySelector(`[data-af-field="${firstField}"]`);
            if (node) {
              node.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (typeof node.focus === 'function') node.focus({ preventScroll: true });
            }
          }
        }
      } else {
        setSubmitError(
          'We could not save your application just now. Please try again, or call us on (020) 2346928.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Wrapper class: tick once valid, red once touched AND invalid. */
  const getInputWrapClass = (name) => {
    const value = formData[name];
    let classes = 'af-input-wrap';
    if (value !== '' && value != null && isFieldValid(name, value)) classes += ' is-valid';
    if (touched[name] && errors[name]) classes += ' has-error';
    return classes;
  };

  /* ------------------------------------------------------------------
     Sleek stylesheet. Every selector is scoped under .amani-appform and
     prefixed `af-`, so nothing here can reach the rest of the SPA.
     Borderless: separation comes from soft fills, rings and shadows.
     ------------------------------------------------------------------ */
  const STYLES = `
    .amani-appform {
      --af-line: ${AF.border};
      --af-gray: ${AF.inkMuted};
      --af-muted: ${AF.inkFaint};
      --af-error: ${AF.error};
      --af-blue: ${AF.navy};
      --af-blue-hover: ${AF.navyDeep};
      --af-tick: ${AF.blue};
      --af-aqua: ${AF.aqua};
      --af-tint: ${AF.bluePale};
      --af-field: ${AF.field};
      --af-ring: 0 0 0 4px rgba(14, 124, 155, 0.16);
      --af-gutter: 56px;
      --af-gutter-tablet: 36px;
      --af-gutter-mobile: 18px;

      position: relative;
      width: 100%;
      max-width: 1120px;
      margin: 0 auto;
      overflow: hidden;
      border-radius: 10px;

      box-shadow: 0 2px 6px rgba(11, 46, 74, 0.05), 0 28px 70px rgba(11, 46, 74, 0.13);
      color: ${AF.ink};
      font-family: ${AF.sans};
      font-size: 15px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .amani-appform *, .amani-appform *::before, .amani-appform *::after { box-sizing: border-box; }

    .af-content { position: relative; }

    /* ---------- Header ---------- */
    .af-doc-header {
      position: relative; overflow: hidden;
      display: flex; justify-content: space-between; align-items: flex-end;
      flex-wrap: wrap; gap: 1.75rem;
      padding: 2.75rem var(--af-gutter) 2.5rem;
      background: linear-gradient(110deg, ${AF.navyDeep} 0%, ${AF.navy} 48%, ${AF.navyMid} 100%);
      color: #fff;
    }
    .af-doc-header::before, .af-doc-header::after {
      content: ''; position: absolute; border-radius: 50%; pointer-events: none;
    }
    .af-doc-header::before { top: -7rem; right: 8%; width: 18rem; height: 18rem; background: rgba(142, 216, 230, 0.09); }
    .af-doc-header::after { bottom: -9rem; right: -4rem; width: 22rem; height: 22rem; background: rgba(14, 124, 155, 0.28); }
    .af-hdr-left, .af-hdr-right { position: relative; z-index: 1; }
    .af-hdr-left { flex: 1; min-width: 0; }
    .af-hdr-mark {
      display: grid; place-items: center; width: 44px; height: 44px; margin-bottom: 1.1rem;
      border-radius: 14px; background: rgba(255, 255, 255, 0.12); color: ${AF.aqua};
    }
    .af-hdr-welcome {
      margin: 0 0 0.35rem;
      font-family: ${AF.serif};
      font-size: clamp(1.6rem, 3.8vw, 2.4rem);
      font-weight: 700; line-height: 1.12; letter-spacing: -0.03em;
      color: #fff;
    }
    .af-hdr-provider { margin: 0 0 1.4rem; font-size: 1rem; font-weight: 600; color: ${AF.aqua}; }
    .af-hdr-facility { display: flex; flex-wrap: wrap; gap: 0.55rem 1.6rem; }
    .af-fac-line { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: rgba(255, 255, 255, 0.78); }
    .af-fac-line svg { width: 15px; height: 15px; stroke: ${AF.aqua}; flex: none; }

    .af-hdr-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; }
    .af-hdr-label { font-size: 0.78rem; font-weight: 600; color: rgba(255, 255, 255, 0.68); }
    .af-hdr-value {
      padding: 0.4rem 1rem; border-radius: 999px;
      background: rgba(255, 255, 255, 0.13); color: #fff;
      font-size: 0.92rem; font-weight: 600; font-variant-numeric: tabular-nums;
    }

    /* ---------- Body ---------- */
    .af-form-body { padding: 2.75rem var(--af-gutter) 2.5rem; }
    .af-doc-section { margin-bottom: 2.75rem; }
    .af-doc-section:last-of-type { margin-bottom: 0; }

    .af-section-head { display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1.5rem; }
    .af-section-num {
      display: grid; place-items: center; flex: none; width: 34px; height: 34px;
      border-radius: 50%; background: var(--af-tint); color: ${AF.navy};
      font-size: 0.82rem; font-weight: 700;
    }
    .af-section-title {
      margin: 0; font-family: ${AF.serif}; font-size: 1.25rem; font-weight: 700;
      letter-spacing: -0.02em; color: ${AF.navy};
    }

    .af-selected-plan {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      margin-bottom: 2.25rem; padding: 1.1rem 1.4rem; border-radius: 16px;
      background: linear-gradient(120deg, ${AF.navy}, ${AF.navyMid}); color: #fff;
      box-shadow: 0 12px 30px rgba(11, 46, 74, 0.18);
    }
    .af-selected-plan > div { display: flex; flex-direction: column; gap: 0.15rem; }
    .af-selected-plan span { font-size: 0.8rem; color: ${AF.aqua}; font-weight: 600; }
    .af-selected-plan strong { font-size: 1.05rem; font-weight: 700; }

    .af-row { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; }
    .af-row:last-child { margin-bottom: 0; }
    .af-col { flex: 1 1 0; min-width: 0; }
    .af-field-label { display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 600; color: ${AF.ink}; }
    .af-req { margin-left: 3px; color: var(--af-error); font-size: 0.8rem; }

    /* ---------- Inputs: soft filled fields ---------- */
    .af-input-wrap { position: relative; display: flex; flex-wrap: wrap; align-items: center; width: 100%; }
    .af-doc-input, .af-doc-select {
      width: 100%; height: 52px; padding: 0 2.75rem 0 1rem;
      border: 0; border-radius: 12px; outline: none;
      background: var(--af-field); color: ${AF.ink};
      box-shadow: inset 0 0 0 1.5px transparent;
      font-family: ${AF.sans}; font-size: 1rem; font-weight: 400;
      transition: background 0.18s ease, box-shadow 0.18s ease;
      appearance: none; -webkit-appearance: none;
    }
    .af-doc-input:hover, .af-doc-select:hover { background: #ebf2f6; }
    .af-doc-input:focus, .af-doc-select:focus {
      background: #fff;
      box-shadow: inset 0 0 0 1.5px ${AF.blue}, var(--af-ring);
    }
    .af-doc-input::placeholder { color: var(--af-muted); }
    .af-doc-select {
      cursor: pointer;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%235a7080' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 1rem center;
    }
    .af-input-wrap.is-valid .af-doc-select { background-image: none; }

    .af-tick-icon {
      position: absolute; right: 14px; top: 26px; transform: translateY(-50%);
      display: none; place-items: center; width: 22px; height: 22px;
      border-radius: 50%; background: var(--af-tick); color: #fff; pointer-events: none;
    }
    .af-tick-icon svg { width: 13px; height: 13px; }
    .af-input-wrap.is-valid .af-tick-icon { display: grid; }

    .af-err-msg { display: block; width: 100%; margin-top: 0.4rem; color: var(--af-error); font-size: 0.8rem; font-weight: 500; }
    .af-input-wrap.has-error .af-doc-input,
    .af-input-wrap.has-error .af-doc-select {
      background: #fff6f5; box-shadow: inset 0 0 0 1.5px var(--af-error);
    }
    .af-input-wrap.has-error .af-doc-input:focus,
    .af-input-wrap.has-error .af-doc-select:focus { box-shadow: inset 0 0 0 1.5px var(--af-error), 0 0 0 4px rgba(192, 57, 43, 0.14); }

    /* ---------- Radios & selectable cards ---------- */
    .af-cover-card input, .af-freq-card input {
      position: relative; flex: none; width: 22px; height: 22px; margin: 0;
      border-radius: 50%; background: #fff; cursor: pointer;
      box-shadow: inset 0 0 0 1.5px #b5c7d1;
      appearance: none; -webkit-appearance: none; transition: background 0.15s ease, box-shadow 0.15s ease;
    }
    .af-cover-card input:checked, .af-freq-card input:checked { background: ${AF.blue}; box-shadow: none; }
    .af-cover-card input:checked::after, .af-freq-card input:checked::after {
      content: ''; position: absolute; inset: 6px; border-radius: 50%; background: #fff;
    }

    .af-cover-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.9rem; width: 100%; }
    .af-input-wrap.has-error .af-cover-cards { padding: 0.5rem; margin: -0.5rem; border-radius: 20px; background: #fff6f5; }

    .af-cover-card {
      display: flex; align-items: flex-start; gap: 0.9rem;
      padding: 1.15rem 1.25rem; border-radius: 16px; background: #fff; cursor: pointer;
      box-shadow: inset 0 0 0 1.5px #dce8ee;
      transition: box-shadow 0.18s ease, background 0.18s ease, transform 0.18s ease;
    }
    .af-cover-card:hover { box-shadow: inset 0 0 0 1.5px #9fc4d1; background: #fbfdfe; }
    .af-cover-card:has(input:checked) {
      background: var(--af-tint);
      box-shadow: inset 0 0 0 2px ${AF.blue}, 0 10px 26px rgba(14, 124, 155, 0.14);
    }
    .af-cover-card:focus-within { outline: 3px solid rgba(14, 124, 155, 0.35); outline-offset: 2px; }
    .af-cover-card input { margin-top: 0.1rem; }
    .af-cover-card-body { display: flex; flex-direction: column; gap: 0.3rem; min-width: 0; }
    .af-cover-card-title { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem 0.6rem; font-size: 1.02rem; font-weight: 700; color: ${AF.navy}; }
    .af-cover-card-price {
      display: inline-flex; align-items: baseline; gap: 0.2rem;
      padding: 0.15rem 0.6rem; border-radius: 999px;
      background: ${AF.navy}; color: #fff; font-size: 0.78rem; font-weight: 700; white-space: nowrap;
    }
    .af-cover-card:has(input:checked) .af-cover-card-price { background: ${AF.blue}; }
    .af-cover-card-price small { font-size: 0.66rem; font-weight: 600; opacity: 0.8; }
    .af-cover-card-hint { font-size: 0.85rem; color: var(--af-gray); line-height: 1.5; }
    .af-cover-card-badge {
      align-self: flex-start; margin-top: 0.15rem; padding: 0.15rem 0.6rem;
      border-radius: 999px; background: #fff; color: ${AF.blue};
      font-size: 0.75rem; font-weight: 700; box-shadow: inset 0 0 0 1px rgba(14, 124, 155, 0.3);
    }

    /* Payment frequency */
    .af-freq-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; width: 100%; }
    .af-freq-card {
      display: flex; align-items: flex-start; gap: 0.8rem;
      padding: 1rem 1.15rem; border-radius: 16px; background: #fff; cursor: pointer;
      box-shadow: inset 0 0 0 1.5px #dce8ee;
      transition: box-shadow 0.18s ease, background 0.18s ease;
    }
    .af-freq-card:hover { box-shadow: inset 0 0 0 1.5px #9fc4d1; }
    .af-freq-card.is-active { background: var(--af-tint); box-shadow: inset 0 0 0 2px ${AF.blue}; }
    .af-freq-card:focus-within { outline: 3px solid rgba(14, 124, 155, 0.35); outline-offset: 2px; }
    .af-freq-card input { margin-top: 0.1rem; }
    .af-freq-card-body { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
    .af-freq-card-label { font-size: 0.98rem; font-weight: 700; color: ${AF.navy}; }
    .af-freq-card-hint { font-size: 0.8rem; color: var(--af-gray); }
    .af-freq-card-amount { margin-top: 0.3rem; font-size: 0.95rem; font-weight: 700; color: ${AF.navy}; }
    .af-freq-card-amount small { font-size: 0.75rem; font-weight: 500; color: var(--af-gray); }
    .af-hint { margin-top: 0.5rem; font-size: 0.8rem; color: var(--af-gray); }

    /* ---------- Group members ---------- */
    .af-group-block { margin-top: 1.75rem; padding: 1.5rem; border-radius: 20px; background: #f5f9fb; }
    .af-group-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.4rem; }
    .af-group-title { font-family: ${AF.serif}; font-size: 1.05rem; font-weight: 700; color: ${AF.navy}; }
    .af-group-count {
      padding: 0.25rem 0.8rem; border-radius: 999px; white-space: nowrap;
      background: #e1f4e8; color: ${AF.success}; font-size: 0.8rem; font-weight: 700;
    }
    .af-group-count.is-short { background: #fdeceb; color: var(--af-error); }
    .af-group-note { margin: 0 0 1.25rem; font-size: 0.88rem; color: var(--af-gray); }

    .af-member-row {
      margin-bottom: 0.9rem; padding: 1.1rem 1.25rem 1.3rem; border-radius: 16px; background: #fff;
      box-shadow: 0 6px 18px rgba(11, 46, 74, 0.06);
    }
    .af-member-row.has-error { box-shadow: inset 0 0 0 1.5px #f2b8b3, 0 6px 18px rgba(11, 46, 74, 0.06); }
    .af-member-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.9rem; }
    .af-member-num { font-size: 0.85rem; font-weight: 700; color: ${AF.blue}; }
    .af-member-remove {
      display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.8rem;
      border: 0; border-radius: 999px; background: transparent; cursor: pointer;
      color: var(--af-error); font-family: inherit; font-size: 0.8rem; font-weight: 600;
      transition: background 0.15s ease;
    }
    .af-member-remove:hover { background: #fdeceb; }
    .af-member-remove:focus-visible { outline: 2px solid var(--af-error); outline-offset: 1px; }
    .af-member-remove svg { width: 14px; height: 14px; }

    .af-add-member {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      width: 100%; height: 50px; padding: 0 1.25rem; border: 0; border-radius: 12px;
      background: var(--af-tint); color: ${AF.navy}; cursor: pointer;
      font-family: inherit; font-size: 0.95rem; font-weight: 700;
      transition: background 0.18s ease;
    }
    .af-add-member:hover { background: #d3ecf2; }
    .af-add-member:focus-visible { outline: 3px solid rgba(14, 124, 155, 0.4); outline-offset: 2px; }
    .af-add-member svg { width: 16px; height: 16px; }

    /* ---------- Declaration, alerts, actions ---------- */
    .af-confirm-block { margin-top: 2.25rem; padding: 1.25rem 1.4rem; border-radius: 18px; background: var(--af-tint); }
    .af-confirm-label { display: flex; align-items: flex-start; gap: 0.9rem; cursor: pointer; }
    .af-confirm-box {
      position: relative; flex: none; width: 24px; height: 24px; margin: 0; border-radius: 8px;
      background: #fff; cursor: pointer; box-shadow: inset 0 0 0 1.5px #9fc4d1;
      appearance: none; -webkit-appearance: none; transition: background 0.15s ease, box-shadow 0.15s ease;
    }
    .af-confirm-box:checked { background: ${AF.navy}; box-shadow: none; }
    .af-confirm-box:checked::after {
      content: ''; position: absolute; top: 4px; left: 8px; width: 6px; height: 11px;
      border: solid #fff; border-width: 0 2.5px 2.5px 0; transform: rotate(45deg);
    }
    .af-confirm-box:focus-visible { outline: 3px solid rgba(14, 124, 155, 0.4); outline-offset: 2px; }
    .af-confirm-label span { font-size: 0.9rem; line-height: 1.55; }
    .af-confirm-block .af-err-msg { margin-left: 2.4rem; width: auto; }

    .af-alerts { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 1.5rem; }
    .af-alert { display: flex; align-items: flex-start; gap: 0.6rem; margin: 0; padding: 0.95rem 1.15rem; border-radius: 14px; font-size: 0.92rem; line-height: 1.5; }
    .af-alert-error { background: #fdeceb; color: #922b21; }
    .af-alert-info { background: var(--af-tint); color: ${AF.navy}; }

    .af-actions { display: flex; justify-content: flex-end; gap: 0.9rem; margin-top: 2rem; }
    .af-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      height: 52px; padding: 0 2rem; border: 0; border-radius: 7px; cursor: pointer;
      font-family: inherit; font-size: 1rem; font-weight: 700;
      transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
    }
    .af-btn:focus-visible { outline: 3px solid rgba(14, 124, 155, 0.45); outline-offset: 3px; }
    .af-btn-primary { background: ${AF.navy}; color: #fff; box-shadow: 0 10px 26px rgba(11, 46, 74, 0.22); }
    .af-btn-primary:hover:not(:disabled) { background: ${AF.navyDeep}; transform: translateY(-2px); box-shadow: 0 14px 32px rgba(11, 46, 74, 0.28); }
    .af-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
    .af-btn-ghost { background: var(--af-tint); color: ${AF.navy}; }
    .af-btn-ghost:hover { background: #d3ecf2; }

    /* ---------- Success state ---------- */
    .af-done { padding: 1rem 0 0.5rem; text-align: center; }
    .af-done h3 { margin: 1.1rem 0 0.5rem; font-family: ${AF.serif}; font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 700; letter-spacing: -0.02em; color: ${AF.navy}; }
    .af-done p { max-width: 36rem; margin: 0 auto; color: var(--af-gray); }
    .af-done-mark {
      display: grid; place-items: center; width: 4.5rem; height: 4.5rem; margin: 0 auto;
      border-radius: 50%; background: linear-gradient(135deg, ${AF.navy}, ${AF.navyMid}); color: ${AF.aqua};
      box-shadow: 0 14px 30px rgba(11, 46, 74, 0.22);
    }
    .af-done-mark svg { width: 30px; height: 30px; }
    .af-done-policy-badge {
      display: inline-flex; align-items: center; gap: 0.5rem; margin: 1.25rem 0 0.5rem;
      padding: 0.5rem 1.3rem; border-radius: 999px; background: var(--af-tint);
      color: ${AF.navy}; font-size: 0.95rem;
    }
    .af-done-cards {
      display: grid; grid-template-columns: minmax(240px, 320px) minmax(0, 1fr); gap: 1.25rem;
      max-width: 900px; margin: 2rem auto; text-align: left; align-items: stretch;
    }
    .af-monthly-card { grid-column: 1 / -1; }

    .af-policy-box {
      padding: 1.5rem 1.4rem; border-radius: 20px; color: #fff;
      background: linear-gradient(160deg, ${AF.navy}, ${AF.navyDeep});
      box-shadow: 0 16px 38px rgba(11, 46, 74, 0.2);
    }
    .af-policy-head { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.1rem; font-weight: 700; color: ${AF.aqua}; }
    .af-policy-grid { display: grid; gap: 0.85rem; }
    .af-policy-row { display: grid; gap: 0.15rem; padding-bottom: 0.85rem; border-bottom: 1px solid rgba(255, 255, 255, 0.12); }
    .af-policy-row:last-child { padding-bottom: 0; border-bottom: 0; }
    .af-policy-label { font-size: 0.8rem; font-weight: 600; color: rgba(255, 255, 255, 0.6); }
    .af-policy-value { font-size: 1.02rem; font-weight: 700; color: #fff; word-break: break-word; }

    .af-sms-box { padding: 1.5rem; border-radius: 20px; background: #fff; box-shadow: 0 14px 38px rgba(11, 46, 74, 0.1); }
    .af-sms-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.9rem; margin-bottom: 1.1rem; }
    .af-sms-head-title { display: flex; align-items: center; gap: 0.6rem; font-size: 1rem; font-weight: 700; color: ${AF.navy}; }
    .af-sms-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.8rem; border-radius: 999px; background: #e1f4e8; color: ${AF.success}; font-size: 0.78rem; font-weight: 700; }
    .af-sms-preview-phone { margin-bottom: 1.25rem; padding: 1rem 1.2rem; border-radius: 16px; background: #f5f9fb; }
    .af-sms-preview-top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.6rem; color: var(--af-gray); font-size: 0.75rem; font-weight: 600; }
    .af-sms-bubble {
      padding: 0.95rem 1.15rem; border-radius: 18px 18px 18px 4px;
      background: ${AF.navy}; color: #fff; font-size: 0.92rem; line-height: 1.55; word-break: break-word;
    }
    .af-sms-bubble a { color: ${AF.aqua}; font-weight: 700; text-decoration: underline; }
    .af-sms-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.7rem; }
    .af-action-btn {
      display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.65rem 1.1rem;
      border: 0; border-radius: 999px; background: var(--af-tint); color: ${AF.navy}; cursor: pointer;
      font-family: inherit; font-size: 0.88rem; font-weight: 700; transition: background 0.18s ease;
    }
    .af-action-btn:hover:not(:disabled) { background: #d3ecf2; }
    .af-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .af-action-btn:focus-visible { outline: 3px solid rgba(14, 124, 155, 0.4); outline-offset: 2px; }
    .af-alt-phone-row { display: flex; gap: 0.6rem; width: 100%; margin-top: 0.85rem; }
    .af-alt-input {
      flex: 1; min-width: 0; height: 46px; padding: 0 1rem; border: 0; border-radius: 12px; outline: none;
      background: var(--af-field); font-family: inherit; font-size: 0.95rem;
    }
    .af-alt-input:focus { background: #fff; box-shadow: inset 0 0 0 1.5px ${AF.blue}, var(--af-ring); }

    .af-monthly-card {
      padding: 1.75rem; border-radius: 20px; color: #fff;
      background: linear-gradient(120deg, ${AF.navyDeep}, ${AF.navyMid});
      box-shadow: 0 18px 42px rgba(11, 46, 74, 0.22);
    }
    .af-monthly-head { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.45rem; font-size: 1.08rem; font-weight: 700; color: #fff; }
    .af-monthly-head svg { color: ${AF.aqua}; }
    .af-monthly-desc { max-width: 640px; margin-bottom: 1.25rem; color: rgba(255, 255, 255, 0.78); font-size: 0.92rem; line-height: 1.6; }
    .af-paylink-row {
      display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
      margin-bottom: 1.1rem; padding: 0.7rem 0.8rem 0.7rem 1.1rem; border-radius: 14px; background: rgba(255, 255, 255, 0.1);
    }
    .af-paylink-url { overflow: hidden; color: #e8f4f8; font-size: 0.88rem; text-overflow: ellipsis; white-space: nowrap; }
    .af-paylink-copy {
      display: inline-flex; flex-shrink: 0; align-items: center; gap: 0.35rem; padding: 0.5rem 0.9rem;
      border: 0; border-radius: 999px; background: rgba(255, 255, 255, 0.18); color: #fff; cursor: pointer;
      font-family: inherit; font-size: 0.82rem; font-weight: 700; transition: background 0.15s ease;
    }
    .af-paylink-copy:hover { background: rgba(255, 255, 255, 0.28); }
    .af-cta-paynow {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem; width: 100%;
      padding: 1rem 1.5rem; border-radius: 999px; background: ${AF.aqua}; color: ${AF.navy};
      font-size: 1rem; font-weight: 800; text-decoration: none;
      transition: background 0.18s ease, transform 0.18s ease;
    }
    .af-cta-paynow:hover { background: #a8e3ee; transform: translateY(-2px); }
    .af-cta-paynow:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
    .af-done-contact {
      display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0.65rem 1.4rem;
      border: 0; border-radius: 999px; background: var(--af-tint); color: ${AF.navy};
      font-family: inherit; font-size: 0.95rem; font-weight: 700; text-decoration: none; cursor: pointer;
      transition: background 0.18s ease;
    }
    .af-done-contact:hover { background: #d3ecf2; }

    /* ---------- Responsive ---------- */
    @media (max-width: 1024px) {
      .af-doc-header, .af-form-body { padding-left: var(--af-gutter-tablet); padding-right: var(--af-gutter-tablet); }
      .af-done-cards { grid-template-columns: minmax(0, 1fr); }
    }

    @media (max-width: 720px) {
      .af-row { flex-direction: column; gap: 1.35rem; margin-bottom: 1.35rem; }
      .af-freq-cards { grid-template-columns: 1fr; }
      .af-actions { flex-direction: column-reverse; }
      .af-actions .af-btn { width: 100%; }
    }

    @media (max-width: 600px) {
      .amani-appform { border-radius: 20px; }
      .af-doc-header { padding: 1.75rem var(--af-gutter-mobile) 1.6rem; gap: 1.1rem; }
      .af-form-body { padding: 1.75rem var(--af-gutter-mobile) 1.5rem; }
      .af-hdr-right { align-items: flex-start; width: 100%; }
      .af-hdr-facility { flex-direction: column; gap: 0.5rem; }
      .af-doc-section { margin-bottom: 2.25rem; }
      .af-selected-plan { align-items: flex-start; flex-direction: column; }
      .af-group-block { padding: 1.1rem 0.9rem; }
      .af-member-row { padding: 0.95rem 0.9rem 1.1rem; }
      .af-cover-cards { grid-template-columns: 1fr; }
      .af-confirm-block { padding: 1.1rem 1rem; }
      .af-done h3 { font-size: 1.5rem; }
      .af-policy-box, .af-sms-box, .af-monthly-card { min-width: 0; padding: 1.15rem; }
      .af-sms-head { align-items: flex-start; flex-direction: column; }
      .af-sms-badge { max-width: 100%; overflow-wrap: anywhere; }
      .af-sms-preview-phone { padding: 0.8rem; }
      .af-sms-preview-top { align-items: flex-start; flex-direction: column; gap: 0.2rem; }
      .af-sms-bubble { padding: 0.85rem; font-size: 0.88rem; overflow-wrap: anywhere; }
      .af-sms-actions { align-items: stretch; flex-direction: column; }
      .af-action-btn { justify-content: center; min-height: 46px; }
      .af-alt-phone-row { flex-direction: column; }
    }

    @media (prefers-reduced-motion: reduce) {
      .amani-appform * { transition-duration: 0.01ms !important; }
      .af-btn-primary:hover:not(:disabled), .af-cta-paynow:hover { transform: none; }
    }
  `;

  return (
    <div className="amani-appform">
      <style>{STYLES}</style>

      <div className="af-content">
        {/* Document header */}
        <header className="af-doc-header">
          <div className="af-hdr-left">
            <div className="af-hdr-mark" aria-hidden="true">
              <ShieldCheck size={22} />
            </div>
            <h1 className="af-hdr-welcome">
              Amani Cover Application Form
            </h1>
            <p className="af-hdr-provider">
              Montenzuma Monalisa Funeral Home
            </p>
            <div className="af-hdr-facility">
              <div className="af-fac-line">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                (020) 2346928/9
              </div>
              <div className="af-fac-line">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22,6 12,13 2,6" /></svg>
                monte2lisa@yahoo.com
              </div>
              <div className="af-fac-line">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Mbagathi Way, Opp. Forces Memorial Hospital
              </div>
            </div>
          </div>
          <div className="af-hdr-right">
            <div className="af-hdr-label">Filling date &amp; time</div>
            <div className="af-hdr-value">{fillStamp}</div>
          </div>
        </header>

        <div className="af-form-body">
          {submitted ? (
            <div className="af-done" role="status">
              <span className="af-done-mark"><TickSvg /></span>
              <h3>Application Received &amp; Cover Active</h3>
              <p>
                Welcome to Amani Cover. Your insurance application has been registered, and an instant confirmation SMS has been dispatched to your phone.
              </p>

              {(applicationResult?.publicCode || applicationResult?.policyNumber) && (
                <div className="af-done-policy-badge">
                  Policy Number: <strong>{applicationResult.publicCode || applicationResult.policyNumber}</strong>
                </div>
              )}

              <div className="af-done-cards">
                <aside className="af-policy-box">
                  <div className="af-policy-head">
                    <ShieldCheck size={16} />
                    <span>Policy Details</span>
                  </div>
                  <div className="af-policy-grid">
                    <div className="af-policy-row">
                      <span className="af-policy-label">Policy Number</span>
                      <span className="af-policy-value">{policyNumberLabel}</span>
                    </div>
                    <div className="af-policy-row">
                      <span className="af-policy-label">Cover Plan</span>
                      <span className="af-policy-value">{coverLabel}</span>
                    </div>
                    <div className="af-policy-row">
                      <span className="af-policy-label">Premium</span>
                      <span className="af-policy-value">Ksh {Number(premiumValue || 0).toLocaleString('en-KE')}</span>
                    </div>
                    <div className="af-policy-row">
                      <span className="af-policy-label">Status</span>
                      <span className="af-policy-value">{String(statusLabel).toLowerCase()}</span>
                    </div>
                    <div className="af-policy-row">
                      <span className="af-policy-label">Beneficiaries</span>
                      <span className="af-policy-value">{beneficiariesLabel}</span>
                    </div>
                  </div>
                </aside>

                {/* Instant SMS confirmation card */}
                <div className="af-sms-box">
                  <div className="af-sms-head">
                    <div className="af-sms-head-title">
                      <MessageSquare size={18} color="var(--af-tick)" />
                      <span>Instant SMS Confirmation</span>
                    </div>
                    <span className="af-sms-badge">
                      <CheckCircle2 size={13} />
                      Sent to {applicationResult?.smsPhone || formData.phone}
                    </span>
                  </div>

                  <div className="af-sms-preview-phone">
                    <div className="af-sms-preview-top">
                      <span>SMS Gateway · Africa&apos;s Talking</span>
                      <span>Delivered just now</span>
                    </div>
                    <div className="af-sms-bubble">
                      {applicationResult?.smsPreview || (
                        <>
                          Montenzuma Monalisa Funeral Home: Thank you for registering for the Amani Cover. Your application has been received. Your Policy No is {policyNumberLabel}. We are honored to protect your family&apos;s future. Pay premium:{' '}
                          <a href={applicationResult?.paymentLink || 'https://paymontenzuma.restpoint.co.ke'}>{applicationResult?.paymentLink || 'https://paymontenzuma.restpoint.co.ke'}</a>. For assistance, call 0740045355.
                        </>
                      )}
                    </div>
                  </div>

                  <div className="af-sms-actions">
                    <button
                      type="button"
                      className="af-action-btn"
                      onClick={() => handleResendSms(formData.phone)}
                      disabled={resendLoading}
                    >
                      <RefreshCw size={14} />
                      {resendLoading ? 'Sending SMS…' : 'Resend SMS to my phone'}
                    </button>

                    <button
                      type="button"
                      className="af-action-btn"
                      onClick={() => setShowAltPhone(!showAltPhone)}
                    >
                      <Smartphone size={14} />
                      Send to another phone
                    </button>
                  </div>

                  {showAltPhone && (
                    <div className="af-alt-phone-row">
                      <input
                        type="tel"
                        className="af-alt-input"
                        placeholder="Enter phone number (e.g. 07XX XXX XXX)"
                        value={altPhone}
                        onChange={(e) => setAltPhone(e.target.value)}
                      />
                      <button
                        type="button"
                        className="af-action-btn"
                        style={{ background: 'var(--af-blue)', color: '#fff' }}
                        disabled={resendLoading || !altPhone.trim()}
                        onClick={() => handleResendSms(altPhone)}
                      >
                        <Send size={14} />
                        Send now
                      </button>
                    </div>
                  )}

                  {resendStatus && (
                    <div
                      style={{
                        marginTop: '0.85rem',
                        padding: '0.7rem 1rem',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        background: resendStatus.type === 'success' ? '#e1f4e8' : '#fdeceb',
                        color: resendStatus.type === 'success' ? '#15803d' : '#c0392b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      {resendStatus.type === 'success' ? <CheckCircle2 size={16} /> : null}
                      <span>{resendStatus.text}</span>
                    </div>
                  )}
                </div>

                {/* Monthly payment link & schedule card */}
                <div className="af-monthly-card">
                  <div className="af-monthly-head">
                    <Calendar size={18} />
                    <span>Monthly Payment Link &amp; Automatic Reminders</span>
                  </div>
                  <div className="af-monthly-desc">
                    Your personal M-Pesa payment link is active. We will automatically send this link via SMS to your phone every month before your premium due date so you never miss a contribution.
                  </div>

                  {applicationResult?.paymentLink && (
                    <div className="af-paylink-row">
                      <span className="af-paylink-url">{applicationResult.paymentLink}</span>
                      <button
                        type="button"
                        className="af-paylink-copy"
                        onClick={handleCopyPaymentLink}
                      >
                        <Copy size={13} />
                        {copiedLink ? 'Copied!' : 'Copy link'}
                      </button>
                    </div>
                  )}

                  {applicationResult?.paymentLink && (
                    <a
                      className="af-cta-paynow"
                      href={applicationResult.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Pay first month now with M-Pesa <ArrowRight size={18} />
                    </a>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.9rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <a className="af-done-contact" href={CONTACT.phoneHref}>
                  Talk to our team · {CONTACT.phone}
                </a>
                <button
                  type="button"
                  className="af-done-contact"
                  onClick={handleReset}
                >
                  Register another member
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {selectedPlan && (
                <div className="af-selected-plan" role="status">
                  <div>
                    <span>Your selected cover</span>
                    <strong>{coverOptions.find(option => option.value === formData.cover)?.label}</strong>
                  </div>
                  <strong>{formatPlanAmount(formData.cover, selectedPlan.monthly)} / month</strong>
                </div>
              )}

              {/* Section 01 — personal information */}
              <section className="af-doc-section">
                <div className="af-section-head">
                  <span className="af-section-num">1</span>
                  <h2 className="af-section-title">Personal information</h2>
                </div>

                <div className="af-row">
                  <div className="af-col">
                    <label className="af-field-label" htmlFor="af-fullName">
                      Full name <span className="af-req">*</span>
                    </label>
                    <div className={getInputWrapClass('fullName')}>
                      <input
                        id="af-fullName"
                        data-af-field="fullName"
                        className="af-doc-input"
                        type="text"
                        name="fullName"
                        placeholder="Enter full legal name"
                        value={formData.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={Boolean(touched.fullName && errors.fullName)}
                        required
                      />
                      <div className="af-tick-icon"><TickSvg /></div>
                      {touched.fullName && errors.fullName && (
                        <span className="af-err-msg">{errors.fullName}</span>
                      )}
                    </div>
                  </div>
                  <div className="af-col">
                    <label className="af-field-label" htmlFor="af-idNumber">
                      ID number <span className="af-req">*</span>
                    </label>
                    <div className={getInputWrapClass('idNumber')}>
                      <input
                        id="af-idNumber"
                        data-af-field="idNumber"
                        className="af-doc-input"
                        type="text"
                        name="idNumber"
                        placeholder="National ID / Passport"
                        value={formData.idNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={Boolean(touched.idNumber && errors.idNumber)}
                        required
                      />
                      <div className="af-tick-icon"><TickSvg /></div>
                      {touched.idNumber && errors.idNumber && (
                        <span className="af-err-msg">{errors.idNumber}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="af-row">
                  <div className="af-col">
                    <label className="af-field-label" htmlFor="af-age">
                      Age <span className="af-req">*</span>
                    </label>
                    <div className={getInputWrapClass('age')}>
                      <input
                        id="af-age"
                        data-af-field="age"
                        className="af-doc-input"
                        type="number"
                        name="age"
                        min="18"
                        max="120"
                        placeholder="Years"
                        value={formData.age}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={Boolean(touched.age && errors.age)}
                        required
                      />
                      <div className="af-tick-icon"><TickSvg /></div>
                      {touched.age && errors.age && (
                        <span className="af-err-msg">{errors.age}</span>
                      )}
                    </div>
                  </div>
                  <div className="af-col">
                    <label className="af-field-label" htmlFor="af-employment">
                      Employment status <span className="af-req">*</span>
                    </label>
                    <div className={getInputWrapClass('employment')}>
                      <select
                        id="af-employment"
                        data-af-field="employment"
                        className="af-doc-select"
                        name="employment"
                        value={formData.employment}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={Boolean(touched.employment && errors.employment)}
                        required
                      >
                        <option value="">Select status&hellip;</option>
                        {EMPLOYMENT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="af-tick-icon"><TickSvg /></div>
                      {touched.employment && errors.employment && (
                        <span className="af-err-msg">{errors.employment}</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 02 — cover selection. Options come from amaniData.coverOptions so
                  this form and the landing page's <select> can never disagree. */}
              <section className="af-doc-section">
                <div className="af-section-head">
                  <span className="af-section-num">2</span>
                  <h2 className="af-section-title">Insurance &amp; cover selection</h2>
                </div>

                <div className="af-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <label className="af-field-label">
                    Choose cover type <span className="af-req">*</span>
                  </label>
                  <div className={getInputWrapClass('cover')} style={{ width: '100%' }}>
                    <div className="af-cover-cards" role="radiogroup" aria-label="Choose cover type">
                      {coverOptions.map((option) => (
                        <label className="af-cover-card" key={option.value}>
                          <input
                            type="radio"
                            name="cover"
                            value={option.value}
                            checked={formData.cover === option.value}
                            onChange={handleCoverChange}
                            onBlur={handleBlur}
                          />
                          <span className="af-cover-card-body">
                            <span className="af-cover-card-title">
                              {option.label}
                              <span className="af-cover-card-price">
                                {formatPlanAmount(option.value, option.monthly)}
                                <small>/month</small>
                              </span>
                            </span>
                            <span className="af-cover-card-hint">{option.hint}</span>
                            {option.minMembers && (
                              <span className="af-cover-card-badge">
                                Min. {option.minMembers} people
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                    {touched.cover && errors.cover && (
                      <span className="af-err-msg">{errors.cover}</span>
                    )}
                  </div>
                </div>

                {/* How often they want to pay. Optional and pre-set to monthly,
                    so it can never be the reason a form fails to submit. */}
                <div className="af-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <label className="af-field-label">How would you like to pay?</label>
                  <div className="af-freq-cards" role="radiogroup" aria-label="Payment frequency">
                    {PAY_FREQUENCIES.map((option) => (
                      <label
                        className={`af-freq-card${formData.frequency === option.value ? ' is-active' : ''}`}
                        key={option.value}
                      >
                        <input
                          type="radio"
                          name="frequency"
                          value={option.value}
                          checked={formData.frequency === option.value}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, frequency: e.target.value }))
                          }
                        />
                        <span className="af-freq-card-body">
                          <span className="af-freq-card-label">{option.label}</span>
                          <span className="af-freq-card-hint">{option.hint}</span>
                          {selectedPlan && (
                            <span className="af-freq-card-amount">
                              KES{' '}
                              {(
                                selectedPlan.monthly * option.months
                              ).toLocaleString('en-KE')}
                              <small>
                                {' '}
                                {option.months > 1
                                  ? `(${option.months} months)`
                                  : 'per month'}
                              </small>
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                  {!selectedPlan && (
                    <span className="af-hint">Choose a cover type above to see your amounts.</span>
                  )}
                </div>

                {/* Amani Group only — the repeater for everyone else on the
                    policy. Rendered conditionally so Solo/Family applications
                    never show it, and cleared when the cover type changes. */}
                {isGroup && (
                  <div className="af-group-block">
                    <div className="af-group-head">
                      <span className="af-group-title">Group members</span>
                      <span
                        className={
                          groupSize >= MIN_GROUP_MEMBERS
                            ? 'af-group-count'
                            : 'af-group-count is-short'
                        }
                      >
                        {groupSize} of {MIN_GROUP_MEMBERS} min.
                      </span>
                    </div>

                    <p className="af-group-note">
                      You are member 1. Add everyone else on this policy &mdash;
                      an Amani Group needs at least {MIN_GROUP_MEMBERS} people in total.
                    </p>

                    {formData.members.map((member, index) => {
                      const rowErrors = memberErrors[member.key] || {};
                      const rowHasError = Boolean(rowErrors.fullName || rowErrors.phone);
                      return (
                        <div
                          className={rowHasError ? 'af-member-row has-error' : 'af-member-row'}
                          key={member.key}
                        >
                          <div className="af-member-head">
                            <span className="af-member-num">Member {index + 2}</span>
                            <button
                              type="button"
                              className="af-member-remove"
                              onClick={() => removeMember(member.key)}
                            >
                              <Trash2 aria-hidden="true" />
                              Remove
                            </button>
                          </div>

                          <div className="af-row" style={{ marginBottom: 0 }}>
                            <div className="af-col">
                              <label className="af-field-label" htmlFor={`af-m-${member.key}-name`}>
                                Full name <span className="af-req">*</span>
                              </label>
                              <div
                                className={
                                  memberTouched[member.key]?.fullName && rowErrors.fullName
                                    ? 'af-input-wrap has-error'
                                    : 'af-input-wrap'
                                }
                              >
                                <input
                                  id={`af-m-${member.key}-name`}
                                  data-af-member={member.key}
                                  className="af-doc-input"
                                  type="text"
                                  value={member.fullName}
                                  placeholder="Their full name"
                                  onChange={(e) => updateMember(member.key, 'fullName', e.target.value)}
                                  onBlur={() => handleMemberBlur(member.key, 'fullName')}
                                  aria-invalid={Boolean(memberTouched[member.key]?.fullName && rowErrors.fullName)}
                                  required
                                />
                                <div className="af-tick-icon"><TickSvg /></div>
                                {memberTouched[member.key]?.fullName && rowErrors.fullName && (
                                  <span className="af-err-msg">{rowErrors.fullName}</span>
                                )}
                              </div>
                            </div>

                            <div className="af-col">
                              <label className="af-field-label" htmlFor={`af-m-${member.key}-phone`}>
                                Phone number <span className="af-req">*</span>
                              </label>
                              <div
                                className={
                                  memberTouched[member.key]?.phone && rowErrors.phone
                                    ? 'af-input-wrap has-error'
                                    : 'af-input-wrap'
                                }
                              >
                                <input
                                  id={`af-m-${member.key}-phone`}
                                  data-af-member={member.key}
                                  className="af-doc-input"
                                  type="tel"
                                  value={member.phone}
                                  placeholder="07XX XXX XXX"
                                  onChange={(e) => updateMember(member.key, 'phone', e.target.value)}
                                  onBlur={() => handleMemberBlur(member.key, 'phone')}
                                  aria-invalid={Boolean(memberTouched[member.key]?.phone && rowErrors.phone)}
                                  required
                                />
                                <div className="af-tick-icon"><TickSvg /></div>
                                {memberTouched[member.key]?.phone && rowErrors.phone && (
                                  <span className="af-err-msg">{rowErrors.phone}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button type="button" className="af-add-member" onClick={addMember}>
                      <Plus aria-hidden="true" />
                      Add another member
                    </button>

                    {groupError && <span className="af-err-msg">{groupError}</span>}
                  </div>
                )}
              </section>

              {/* Section 03 — contact */}
              <section className="af-doc-section">
                <div className="af-section-head">
                  <span className="af-section-num">3</span>
                  <h2 className="af-section-title">Contact details</h2>
                </div>

                <div className="af-row">
                  <div className="af-col">
                    <label className="af-field-label" htmlFor="af-phone">
                      Phone number <span className="af-req">*</span>
                    </label>
                    <div className={getInputWrapClass('phone')}>
                      <input
                        id="af-phone"
                        data-af-field="phone"
                        className="af-doc-input"
                        type="tel"
                        name="phone"
                        placeholder="e.g. 0722 268 566"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={Boolean(touched.phone && errors.phone)}
                        required
                      />
                      <div className="af-tick-icon"><TickSvg /></div>
                      {touched.phone && errors.phone && (
                        <span className="af-err-msg">{errors.phone}</span>
                      )}
                    </div>
                  </div>
                  <div className="af-col">
                    <label className="af-field-label" htmlFor="af-email">
                      Email address <span style={{ fontWeight: 400, color: 'var(--af-muted)' }}>(optional)</span>
                    </label>
                    <div className={getInputWrapClass('email')}>
                      <input
                        id="af-email"
                        data-af-field="email"
                        className="af-doc-input"
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={Boolean(touched.email && errors.email)}
                      />
                      <div className="af-tick-icon"><TickSvg /></div>
                      {touched.email && errors.email && (
                        <span className="af-err-msg">{errors.email}</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Declaration */}
              <div className={touched.confirmAccepted && errors.confirmAccepted ? 'has-error' : undefined}>
                <div className="af-confirm-block">
                  <label className="af-confirm-label">
                    <input
                      className="af-confirm-box"
                      type="checkbox"
                      name="confirmAccepted"
                      checked={formData.confirmAccepted}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <span>
                      I confirm that the details above are true and correct, and I understand that
                      Amani Cover is arranged by Montenzuma Monalisa Funeral Home. I have read the
                      cover terms and agree to be contacted about my application.
                    </span>
                  </label>
                  {touched.confirmAccepted && errors.confirmAccepted && (
                    <span className="af-err-msg">{errors.confirmAccepted}</span>
                  )}
                </div>
              </div>

              {/* Server outcome banners. Both are announced (role=alert / role=status) so
                  a screen-reader user hears the result of the submit, not just
                  sees the form disappear. */}
              {(submitError || submitNotice) && (
                <div className="af-alerts">
                  {submitError && (
                    <p className="af-alert af-alert-error" role="alert">
                      {submitError}
                    </p>
                  )}
                  {submitNotice && (
                    <p className="af-alert af-alert-info" role="status">
                      {submitNotice}
                    </p>
                  )}
                </div>
              )}

              <div className="af-actions">
                <button type="button" className="af-btn af-btn-ghost" onClick={handleReset}>
                  Clear form
                </button>
                <button type="submit" className="af-btn af-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting…' : 'Submit application'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}