
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CONTACT, GROUP_COVER_VALUE, MIN_GROUP_MEMBERS, coverOptions, formatPlanAmount, planFor } from './amaniData';
import { InsuranceApiError, submitApplication } from '../../../api/insuranceApi';

const AF = {
  ink: '#12233a',
  inkMuted: '#64748b',
  inkFaint: '#94a3b8',
  navy: '#123e78',
  navyDeep: '#0d2f5e',
  blue: '#2b78b8',
  bluePale: '#dcecf5',
  brass: '#2b78b8',
  border: '#d9e3eb',
  error: '#b4524b',
  success: '#2f7d68',
  sans: "Arial, Helvetica, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};

const getInitialCover = () => {
  if (typeof window === 'undefined') return '';
  const requested = new URLSearchParams(window.location.search).get('plan');
  return coverOptions.some(option => option.value === requested) ? requested : '';
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
  /* Next of kin — who the care team calls when it matters. Name + phone are
     required (mirrored server-side); relationship is optional context. */
  nextOfKinName: '',
  nextOfKinPhone: '',
  nextOfKinRelationship: '',
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

/* Required fields, in document order. `email` and `nextOfKinRelationship`
   are deliberately absent — both are optional and only validated when the
   visitor actually fills them in. */
const REQUIRED_FIELDS = ['fullName', 'idNumber', 'age', 'employment', 'phone', 'nextOfKinName', 'nextOfKinPhone', 'cover'];

const EMPLOYMENT_OPTIONS = [
  { value: 'employed', label: 'Employed' },
  { value: 'self-employed', label: 'Self-employed' },
  { value: 'business', label: 'Business person' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
];

/* SINGLE SOURCE OF TRUTH for validity. Every caller — onChange, onBlur,
   handleSubmit, and the green tick — routes through this. The previous version
   copy-pasted these rules into three places that slowly drifted apart. */
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
    case 'nextOfKinPhone':
      return value.replace(/\D/g, '').length >= 9;
    case 'nextOfKinName':
      return value.trim().length > 1;
    case 'nextOfKinRelationship':
      /* Optional: empty is valid, anything filled in is accepted. */
      return true;
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
    case 'nextOfKinName': return 'Next of kin full name is required.';
    case 'nextOfKinPhone': return 'Enter a valid next of kin phone number.';
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
  /* Frozen at mount so the "Filling Date & Time" stamp cannot drift between
     renders while the visitor is typing. */
  const [fillStamp] = useState(() => formatStamp(new Date()));

  /* The applicant counts toward the Amani Group minimum, so the total on the
     policy is always one more than the number of repeater rows. */
  const groupSize = formData.members.length + 1;
  const isGroup = formData.cover === GROUP_COVER_VALUE;

  /* The chosen plan's real rate, or null until a cover type is picked. Used to
     price the frequency options, so the amounts a member sees are the amounts
     PLANS actually defines rather than a number typed into the markup. */
  const selectedPlan = formData.cover ? planFor(formData.cover) : null;

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
       into the local error state so a server-side rejection (a stale cover
       list, an ID that fails the plausibility check) is shown next to the
       right input rather than swallowed.
       NOTE: `members` carries a `key` used only for React reconciliation; it
       is stripped here so it never reaches the API. */
    try {
      /* Static import (not a dynamic await import) so the API client is part of
         this lazy route's own chunk rather than fetched again on first submit. */
      const result = await submitApplication({
        fullName: formData.fullName,
        idNumber: formData.idNumber,
        age: formData.age,
        employment: formData.employment,
        phone: formData.phone,
        email: formData.email,
        nextOfKinName: formData.nextOfKinName,
        nextOfKinPhone: formData.nextOfKinPhone,
        nextOfKinRelationship: formData.nextOfKinRelationship,
        cover: formData.cover,
        frequency: formData.frequency,
        confirmAccepted: formData.confirmAccepted,
        members: formData.members.map(({ fullName: n, phone: p }) => ({ fullName: n, phone: p })),
      });

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

  /* Wrapper class: green tick once valid, red once touched AND invalid. */
  const getInputWrapClass = (name) => {
    const value = formData[name];
    let classes = 'af-input-wrap';
    if (value !== '' && value != null && isFieldValid(name, value)) classes += ' is-valid';
    if (touched[name] && errors[name]) classes += ' has-error';
    return classes;
  };

  /* ------------------------------------------------------------------
     Document stylesheet. Every selector is scoped under .amani-appform and
     prefixed `af-`, so nothing here can reach the rest of the SPA. The global
     reset (`*`, `body`, `:root`) that the previous version injected has been
     dropped on purpose — the host app already owns those in src/index.css.
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
      --af-gutter: 96px;
      --af-gutter-tablet: 64px;
      /* 32px of padding on EACH side cost a 360px phone 64px of its width —
         nearly a fifth of the screen — before a single character was readable.
         16px keeps a comfortable touch/reading margin while letting the form
         genuinely fill the screen. */
      --af-gutter-mobile: 16px;

      position: relative;
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      overflow: hidden;
      color: ${AF.ink};
      font-family: ${AF.sans};
      font-size: 15px;
      line-height: 1.5;
    }

    .af-watermark {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-family: ${AF.serif}; font-size: 8rem; font-weight: 700;
      color: rgba(23, 60, 90, 0.025); white-space: nowrap; pointer-events: none;
      z-index: 0; letter-spacing: 0.2em; text-transform: uppercase;
    }

    .af-content { position: relative; z-index: 1; }

    .af-doc-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 2rem;
      padding: 3rem var(--af-gutter) 2rem;
      border-bottom: 1px solid var(--af-line);
    }
    .af-hdr-left { flex: 1; min-width: 300px; }
    /* Document title. Was font-size 1.5rem / weight 500, the same visual
       weight as the small grey contact lines, so it read as another line of
       contact info rather than as the title of the form. Now larger, bolder,
       in the accent blue, with a tight leading and a real <h1> above it. */
    .af-hdr-welcome {
      font-family: ${AF.serif};
      font-size: clamp(1.75rem, 6vw, 2.5rem);
      font-weight: 600;
      line-height: 1.12;
      letter-spacing: -0.015em;
      color: var(--af-blue);
      margin: 0 0 0.4rem;
    }
    /* Provider attribution directly under the title — smaller and greyer than
       the title, but darker than the contact lines so the hierarchy is
       title > provider > contact. */
    .af-hdr-provider {
      font-family: ${AF.sans};
      font-size: 0.9rem;
      font-weight: 600;
      color: #334155;
      margin: 0 0 1.35rem;
    }
    .af-hdr-facility { display: flex; flex-direction: column; gap: 0.5rem; }
    .af-fac-line {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.8rem; color: var(--af-gray);
    }
    .af-fac-line svg { width: 14px; height: 14px; stroke: var(--af-blue); flex: none; }

    .af-hdr-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }
    .af-hdr-label {
      font-family: Arial, Helvetica, sans-serif; font-size: 0.65rem;
      letter-spacing: 0.11em; text-transform: uppercase; color: var(--af-gray);
    }
    .af-hdr-value {
      font-family: Arial, Helvetica, sans-serif; font-size: 1rem; font-weight: 500;
      color: var(--af-blue); background: #f3f6f1;
      padding: 0.2rem 0.8rem; border: 1px solid #d7dfd4; border-radius: 4px;
    }

    .af-form-body { padding: 3rem var(--af-gutter) 1.5rem; }
    .af-doc-section { margin-bottom: 3rem; }
    .af-doc-section:last-child { margin-bottom: 0; }

    .af-section-head {
      display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem;
      padding: 0.75rem 1.25rem; background: var(--af-blue); border-radius: 4px;
    }
    .af-section-num {
      font-family: Arial, Helvetica, sans-serif; font-size: 0.75rem;
      font-weight: 500; color: rgba(255, 255, 255, 0.55);
    }
    .af-section-title {
      font-family: ${AF.serif}; font-size: 1.2rem;
      font-weight: 500; color: #fff; margin: 0;
    }

    .af-row { display: flex; gap: 2rem; margin-bottom: 1.75rem; }
    .af-row:last-child { margin-bottom: 0; }
    .af-col { flex: 1 1 0; min-width: 0; }
    .af-field-label { display: block; font-size: 0.8rem; font-weight: 500; margin-bottom: 0.4rem; }
    .af-req { color: var(--af-error); font-size: 0.7rem; margin-left: 4px; }

    .af-input-wrap { position: relative; width: 100%; display: flex; align-items: center; }
    .af-doc-input, .af-doc-select {
      width: 100%; height: 2.75rem; border: none;
      border-bottom: 1.5px dashed #cbd5e1; background: transparent; outline: none;
      padding: 0 2.5rem 0.25rem 0; font-family: ${AF.sans};
      font-size: 1rem; font-weight: 400; color: ${AF.ink};
      transition: border-color 0.2s ease;
      appearance: none; -webkit-appearance: none;
    }
    .af-doc-input:focus, .af-doc-select:focus { border-bottom: 1.5px solid var(--af-blue); }
    .af-doc-input::placeholder { color: var(--af-muted); font-weight: 400; }
    .af-doc-select {
      cursor: pointer;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 0.25rem center;
    }

    .af-tick-icon {
      position: absolute; right: 0.25rem; top: 50%; transform: translateY(-50%);
      width: 1.5rem; height: 1.5rem; border-radius: 50%;
      background: var(--af-tick); color: #fff;
      display: none; place-items: center; pointer-events: none;
    }
    .af-tick-icon svg { width: 16px; height: 16px; }
    .af-input-wrap.is-valid .af-tick-icon { display: grid; }

    .af-err-msg { display: block; color: var(--af-error); font-size: 0.75rem; margin-top: 0.3rem; }
    .af-input-wrap.has-error .af-doc-input,
    .af-input-wrap.has-error .af-doc-select { border-bottom-color: var(--af-error); }

    /* Radio appearance. Scoped to BOTH the legacy .af-radio-opt and the newer
       .af-cover-card so the custom dot is applied either way — without this
       the native radio shows through unstyled inside the cover cards. */
    .af-radio-opt, .af-cover-card { cursor: pointer; }
    .af-radio-opt input, .af-cover-card input {
      appearance: none; -webkit-appearance: none; width: 20px; height: 20px;
      border: 1.5px solid #cbd5e1; border-radius: 50%; position: relative;
      cursor: pointer; margin: 0; transition: all 0.2s; flex: none;
    }
    .af-radio-opt input:checked, .af-cover-card input:checked { border-color: var(--af-blue); }
    .af-radio-opt input:checked::after, .af-cover-card input:checked::after {
      content: ''; position: absolute; top: 3px; left: 3px;
      width: 10px; height: 10px; border-radius: 50%; background: var(--af-blue);
    }
    .af-radio-opt input:focus-visible, .af-cover-card input:focus-visible { outline: 2px solid var(--af-tick); outline-offset: 2px; }
    .af-radio-opt span { font-size: 1rem; }
    .af-input-wrap.has-error .af-radio-group,
    .af-input-wrap.has-error .af-cover-cards {
      padding-left: 4px; border-left: 2px solid var(--af-error);
    }

    /* ---- Amani Group repeater -----------------------------------------
       Cover cards: each option is a full-width tappable card rather than a
       bare radio + label, so the one-line description underneath has room and
       the whole card is a comfortable touch target on a phone. */
    .af-cover-cards { display: flex; flex-direction: column; gap: 0.75rem; padding-top: 0.5rem; width: 100%; }
    .af-cover-card {
      display: flex; align-items: flex-start; gap: 0.85rem;
      padding: 1rem 1.15rem; border: 1.5px solid var(--af-line);
      border-radius: 6px; background: #fff; cursor: pointer;
      transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    }
    .af-cover-card:hover { border-color: #9fb1bf; background: #fbfcfd; }
    .af-cover-card:has(input:checked) {
      border-color: var(--af-blue); background: #edf3f7;
      box-shadow: 0 1px 3px rgba(23, 60, 90, 0.12);
    }
    .af-cover-card input { margin-top: 0.15rem; }
    .af-cover-card-body { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
    .af-cover-card-title { font-size: 1rem; font-weight: 600; color: var(--af-blue); }

  /* Real price, shown on the card itself so nobody has to guess what a plan
     costs. "from" wording for the plans priced as a floor (FamilyGroup/Group). */
  .af-cover-card-price { display: inline-flex; align-items: baseline; gap: 0.2rem; margin-left: 0.5rem; padding: 0.1rem 0.5rem; border-radius: 999px; background: #f3efe7; color: #765f3e; font-size: 0.78rem; font-weight: 700; white-space: nowrap; }
  .af-cover-card-price small { font-size: 0.62rem; font-weight: 600; opacity: 0.75; }

  /* Payment-frequency picker on the application form. */
  .af-freq-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-top: 0.5rem; width: 100%; }
  .af-freq-card { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.8rem 0.9rem; border: 1px solid var(--af-line, #d7e0ea); border-radius: 0.7rem; background: #fff; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s, background 0.15s; }
  .af-freq-card:hover { border-color: #9fb1bf; background: #fbfcfd; }
  .af-freq-card.is-active { border-color: var(--af-blue); background: #f5f8fa; box-shadow: 0 0 0 3px rgba(23, 60, 90, 0.1); }
  .af-freq-card input { margin-top: 0.15rem; accent-color: var(--af-blue); }
  .af-freq-card-body { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
  .af-freq-card-label { font-size: 0.92rem; font-weight: 600; color: var(--af-blue); }
  .af-freq-card-hint { font-size: 0.7rem; color: var(--af-muted, #64748b); }
  .af-freq-card-amount { margin-top: 0.2rem; font-size: 0.85rem; font-weight: 700; color: var(--af-blue); }
  .af-freq-card-amount small { font-size: 0.68rem; font-weight: 500; color: var(--af-muted, #64748b); }
  .af-hint { margin-top: 0.4rem; font-size: 0.72rem; color: var(--af-muted, #64748b); }

  @media (max-width: 560px) {
    .af-freq-cards { grid-template-columns: 1fr; }
  }
    .af-cover-card-hint { font-size: 0.8rem; color: var(--af-gray); line-height: 1.45; }
    .af-cover-card-badge {
      display: inline-block; margin-top: 0.3rem; font-family: Arial, Helvetica, sans-serif;
      font-size: 0.65rem; letter-spacing: 0.08em; text-transform: uppercase;
      color: #765f3e; background: #f5f0e4; border: 1px solid #e4d8bd;
      border-radius: 3px; padding: 0.15rem 0.45rem; align-self: flex-start;
    }
    .af-cover-card:focus-within { outline: 2px solid var(--af-tick); outline-offset: 2px; }

    /* Member rows */
    .af-group-block {
      margin-top: 1.5rem; padding: 1.25rem 1.15rem 1.35rem;
      background: #f6f8f8; border: 1px solid var(--af-line); border-radius: 6px;
    }
    .af-group-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.35rem; }
    .af-group-title { font-size: 0.95rem; font-weight: 600; color: ${AF.ink}; }
    .af-group-count {
      font-family: Arial, Helvetica, sans-serif; font-size: 0.7rem; font-weight: 500;
      letter-spacing: 0.06em; text-transform: uppercase; color: var(--af-blue);
      background: #edf3f7; border: 1px solid #d7e2e9; border-radius: 999px;
      padding: 0.25rem 0.65rem; white-space: nowrap;
    }
    .af-group-count.is-short { color: var(--af-error); background: #fef2f2; border-color: #fecaca; }
    .af-group-note { font-size: 0.78rem; color: var(--af-gray); margin: 0 0 1rem; }

    .af-member-row {
      position: relative; background: #fff; border: 1px solid var(--af-line);
      border-radius: 5px; padding: 1rem 1rem 1.1rem; margin-bottom: 0.85rem;
    }
    .af-member-row.has-error { border-color: #fca5a5; }
    .af-member-head {
      display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
      margin-bottom: 0.85rem;
    }
    .af-member-num {
      font-family: Arial, Helvetica, sans-serif; font-size: 0.65rem;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--af-gray);
    }
    .af-member-remove {
      display: inline-flex; align-items: center; gap: 0.3rem;
      background: transparent; border: none; padding: 0.25rem 0.4rem;
      font-family: inherit; font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.04em; text-transform: uppercase;
      color: var(--af-error); cursor: pointer; border-radius: 4px;
    }
    .af-member-remove:hover { background: #fef2f2; }
    .af-member-remove:focus-visible { outline: 2px solid var(--af-error); outline-offset: 1px; }
    .af-member-remove svg { width: 13px; height: 13px; }

    .af-add-member {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem;
      width: 100%; height: 2.75rem; padding: 0 1.25rem;
      background: #fff; color: var(--af-blue);
      box-shadow: inset 0 0 0 1.5px var(--af-blue);
      border-radius: 4px; font-family: inherit; font-size: 0.9rem;
      font-weight: 600; cursor: pointer; transition: all 0.2s ease;
    }
    .af-add-member:hover { background: #edf3f7; }
    .af-add-member:focus-visible { outline: 2px solid var(--af-tick); outline-offset: 2px; }
    .af-add-member svg { width: 15px; height: 15px; }

    .af-group-summary {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.78rem; color: var(--af-gray); margin: 0.85rem 0 0;
    }

    /* Submit outcome banners. Error is red-tinted, the duplicate-application
       notice is blue-tinted and informational - a duplicate is NOT a failure
       from the visitor's point of view, so it must not look like one. */
    .af-alerts { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 1.5rem; }
    .af-alert {
      display: flex; align-items: flex-start; gap: 0.6rem;
      margin: 0; padding: 0.85rem 1rem;
      font-size: 0.9rem; line-height: 1.5;
      border-radius: 4px; border-left: 3px solid transparent;
    }
    .af-alert-error {
      color: #991b1b; background: #fef2f2; border-left-color: var(--af-error);
    }
    .af-alert-info {
      color: #294b63; background: #edf3f7; border-left-color: var(--af-blue);
    }

    .af-confirm-block {
      margin-top: 1.5rem; padding: 1.1rem 1.3rem 1.25rem; background: #edf3f7;
      border-radius: 4px; display: flex; flex-direction: column; gap: 0.55rem;
      border-left: 3px solid var(--af-blue);
    }
    .af-confirm-label { display: flex; align-items: flex-start; gap: 0.8rem; cursor: pointer; }
    .af-confirm-box {
      appearance: none; -webkit-appearance: none; width: 22px; height: 22px;
      border: 1.5px solid #cbd5e1; border-radius: 4px; background: #fff;
      position: relative; cursor: pointer; margin: 0; flex: none;
    }
    .af-confirm-box:checked { background: var(--af-blue); border-color: var(--af-blue); }
    .af-confirm-box:checked::after {
      content: ''; position: absolute; top: 2px; left: 7px;
      width: 5px; height: 10px; border: solid #fff;
      border-width: 0 2px 2px 0; transform: rotate(45deg);
    }
    .af-confirm-box:focus-visible { outline: 2px solid var(--af-tick); outline-offset: 2px; }
    .af-confirm-label span { font-size: 0.85rem; line-height: 1.5; }

    .af-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; }
    .af-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      height: 2.75rem; padding: 0 1.75rem; border: none; border-radius: 4px;
      font-family: inherit; font-size: 0.95rem; font-weight: 600; cursor: pointer;
      transition: all 0.2s ease;
    }
    .af-btn-primary { background: var(--af-blue); color: #fff; box-shadow: 0 4px 12px rgba(23, 60, 90, 0.16); }
    .af-btn-primary:hover:not(:disabled) { background: var(--af-blue-hover); transform: translateY(-1px); box-shadow: 0 8px 20px rgba(16, 47, 73, 0.24); }
    .af-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
    .af-btn-ghost { background: transparent; color: var(--af-blue); box-shadow: inset 0 0 0 1.5px var(--af-blue); }
    .af-btn-ghost:hover { background: #edf3f7; }

    .af-record-strip {
      font-family: Arial, Helvetica, sans-serif; font-size: 0.65rem;
      letter-spacing: 0.11em; text-transform: uppercase; color: var(--af-gray);
      text-align: center; line-height: 1.7; margin: 2rem var(--af-gutter) 0;
      padding: 0.9rem 1rem 0.4rem; border-top: 1px solid var(--af-line);
    }

    .af-done { padding: 3rem 0; text-align: center; }
    .af-done h3 { font-family: ${AF.serif}; font-size: 2rem; margin: 1rem 0 0.5rem; }
    .af-done p { color: var(--af-gray); margin: 0 auto; max-width: 32rem; }
    .af-done-contact { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; margin-top: 1.25rem; padding: 0.65rem 1rem; border-radius: 6px; background: var(--af-blue); color: #fff; font-weight: 600; text-decoration: none; }
    .af-done-contact:hover { background: var(--af-blue-hover); }
    .af-done-mark {
      display: grid; place-items: center; width: 4rem; height: 4rem; margin: 0 auto;
      border-radius: 50%; background: var(--af-tick); color: #fff;
    }
    .af-done-mark svg { width: 28px; height: 28px; }
    .af-selected-plan { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 2rem; padding: 1rem 1.1rem; border: 1px solid #d7e2e9; border-radius: 6px; background: #edf3f7; color: var(--af-blue); }
    .af-selected-plan div { display: flex; flex-direction: column; gap: 0.15rem; }
    .af-selected-plan span { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--af-gray); }
    .af-selected-plan strong:last-child { white-space: nowrap; }

    @media (max-width: 1024px) {
      .af-doc-header, .af-form-body, .af-record-strip {
        padding-left: var(--af-gutter-tablet); padding-right: var(--af-gutter-tablet);
      }
      .af-row { flex-direction: column; gap: 1.5rem; margin-bottom: 1.5rem; }
      .af-actions { flex-direction: column-reverse; }
      .af-actions .af-btn { width: 100%; }
    }

    /* Phones: the document was inset by a 32px gutter on BOTH sides on top of
       the page's own px-6, so a 360px screen lost ~80px to margins and the
       input rows were cramped. Below 600px the form now goes edge-to-edge
       (it still has the 16px reading gutter, but no extra page padding) and
       the header stacks so the date stamp sits under the title instead of
       competing with it for horizontal space. */
    @media (max-width: 600px) {
      .af-doc-header, .af-form-body, .af-record-strip {
        padding-left: var(--af-gutter-mobile);
        padding-right: var(--af-gutter-mobile);
      }
      .af-hdr-right { align-items: flex-start; width: 100%; }
      .af-watermark { font-size: 4rem; }

      /* Full-bleed: kill the page gutter so the form spans the whole screen,
         and reduce the document's own padding to a comfortable 16px. */
      .amani-appform { max-width: 100%; border-left: none; border-right: none; }
      .af-doc-header { padding: 1.5rem var(--af-gutter-mobile) 1.25rem; gap: 1rem; }
      .af-form-body { padding: 1.75rem var(--af-gutter-mobile) 1.25rem; }
      .af-record-strip { margin: 1.5rem var(--af-gutter-mobile) 0; }

      /* min-width:300px forced the header column to overflow a 360px screen
         once the real padding was accounted for. */
      .af-hdr-left { min-width: 0; }

      .af-doc-section { margin-bottom: 2rem; }
      .af-section-head { padding: 0.65rem 1rem; margin-bottom: 1.25rem; }
      .af-group-block { padding: 1rem 0.85rem 1.1rem; }
      .af-member-row { padding: 0.85rem 0.8rem 0.95rem; }
      .af-selected-plan { align-items: flex-start; flex-direction: column; }
    }
  `;

  return (
    <div className="amani-appform">
      <style>{STYLES}</style>
      <div className="af-watermark" aria-hidden="true">OFFICIAL RECORD</div>

      <div className="af-content">
        {/* Document header */}
        <header className="af-doc-header">
          <div className="af-hdr-left">
            {/* Was one flattened string, "Amani  Cover  Apllication Form
                Montenzuma", in the same weight and colour as the contact lines
                below it — so the document title did not read as a title, and
                "Apllication" was misspelt. Split into a real heading plus a
                provider line, with the title given the heavy Fraunces treatment
                and the accent colour so it is unmistakable on a phone. */}
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
            <div className="af-hdr-label">Filling Date &amp; Time</div>
            <div className="af-hdr-value">{fillStamp}</div>
          </div>
        </header>

        <div className="af-form-body">
          {submitted ? (
            <div className="af-done" role="status">
              <span className="af-done-mark"><TickSvg /></span>
              <h3>Application received</h3>
              <p>
                Your application is pending review; cover is not active yet. Our team will call you
                within one working day to confirm your details, explain payment and agree when
                cover can begin.
              </p>
              <a className="af-done-contact" href={CONTACT.phoneHref}>Talk to our team · {CONTACT.phone}</a>
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
                  <span className="af-section-num">01</span>
                  <h2 className="af-section-title">Personal Information</h2>
                </div>

                <div className="af-row">
                  <div className="af-col">
                    <label className="af-field-label" htmlFor="af-fullName">
                      Full Name <span className="af-req">*</span>
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
                      ID Number <span className="af-req">*</span>
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
                      Employment Status <span className="af-req">*</span>
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

                {/* Next of kin — name + phone are required (the care team
                    calls THIS person), relationship is optional context.
                    Mirrored server-side in validateApplication. */}
                <div className="af-row">
                  <div className="af-col">
                    <label className="af-field-label" htmlFor="af-nextOfKinName">
                      Next of Kin Full Name <span className="af-req">*</span>
                    </label>
                    <div className={getInputWrapClass('nextOfKinName')}>
                      <input
                        id="af-nextOfKinName"
                        data-af-field="nextOfKinName"
                        className="af-doc-input"
                        type="text"
                        name="nextOfKinName"
                        placeholder="Full name of your next of kin"
                        value={formData.nextOfKinName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={Boolean(touched.nextOfKinName && errors.nextOfKinName)}
                        required
                      />
                      <div className="af-tick-icon"><TickSvg /></div>
                      {touched.nextOfKinName && errors.nextOfKinName && (
                        <span className="af-err-msg">{errors.nextOfKinName}</span>
                      )}
                    </div>
                  </div>
                  <div className="af-col">
                    <label className="af-field-label" htmlFor="af-nextOfKinPhone">
                      Next of Kin Phone <span className="af-req">*</span>
                    </label>
                    <div className={getInputWrapClass('nextOfKinPhone')}>
                      <input
                        id="af-nextOfKinPhone"
                        data-af-field="nextOfKinPhone"
                        className="af-doc-input"
                        type="tel"
                        name="nextOfKinPhone"
                        placeholder="0712 345 678"
                        value={formData.nextOfKinPhone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={Boolean(touched.nextOfKinPhone && errors.nextOfKinPhone)}
                        required
                      />
                      <div className="af-tick-icon"><TickSvg /></div>
                      {touched.nextOfKinPhone && errors.nextOfKinPhone && (
                        <span className="af-err-msg">{errors.nextOfKinPhone}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="af-row">
                  <div className="af-col">
                    <label className="af-field-label" htmlFor="af-nextOfKinRelationship">
                      Relationship to Applicant
                    </label>
                    <div className={getInputWrapClass('nextOfKinRelationship')}>
                      <input
                        id="af-nextOfKinRelationship"
                        data-af-field="nextOfKinRelationship"
                        className="af-doc-input"
                        type="text"
                        name="nextOfKinRelationship"
                        placeholder="e.g., Spouse, Parent, Sibling"
                        value={formData.nextOfKinRelationship}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={Boolean(touched.nextOfKinRelationship && errors.nextOfKinRelationship)}
                      />
                      <div className="af-tick-icon"><TickSvg /></div>
                      {touched.nextOfKinRelationship && errors.nextOfKinRelationship && (
                        <span className="af-err-msg">{errors.nextOfKinRelationship}</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 02 — cover selection. Options come from amaniData.coverOptions so
                  this form and the landing page's <select> can never disagree. */}
              <section className="af-doc-section">
                <div className="af-section-head">
                  <span className="af-section-num">02</span>
                  <h2 className="af-section-title">Insurance &amp; Cover Selection</h2>
                </div>

                <div className="af-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <label className="af-field-label">
                    Choose Cover Type <span className="af-req">*</span>
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
                                Full Name <span className="af-req">*</span>
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
                                Phone Number <span className="af-req">*</span>
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
                  <span className="af-section-num">03</span>
                  <h2 className="af-section-title">Contact Details</h2>
                </div>

                <div className="af-row">
                  <div className="af-col">
                    <label className="af-field-label" htmlFor="af-phone">
                      Phone Number <span className="af-req">*</span>
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
                      Email Address <span style={{ fontWeight: 400, color: 'var(--af-muted)' }}>(optional)</span>
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

        {!submitted && (
          <p className="af-record-strip">
            Montenzuma Monalisa Funeral Home · Amani Cover · Nairobi Branch
          </p>
        )}
      </div>
    </div>
  );
}