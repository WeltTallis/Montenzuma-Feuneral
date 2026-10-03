/**
 * Insurance Service - validation for the two public forms.
 *
 *   POST /insurance/applications  <- /amani/cover/apply  (AmaniApplicationForm)
 *   POST /insurance/claims         <- /amani/claims      (ClaimSubmissionForm)
 *
 * `errors` is keyed by field name so each form can render the message beside
 * the input the visitor actually got wrong, matching the field keys the React
 * forms already use.
 */
import {
  normalisePolicyNumber,
  isPlausiblePolicyNumber,
  isValidPhone,
  isValidEmail,
  VALID_COVER_TYPES,
  MIN_GROUP_MEMBERS,
  type NormalisedApplication,
  type NormalisedClaim,
  type ValidationResult,
} from './policyNumber';

export function validateApplication(body: any = {}): ValidationResult<NormalisedApplication> {
  const errors: Record<string, string> = {};

  const fullName = String(body.fullName || '').trim();
  const idNumber = String(body.idNumber || '').trim();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim();
  const cover = String(body.cover || '').trim();
  const employment = String(body.employment || '').trim();
  const age = Number.parseInt(body.age, 10);

  if (fullName.length < 2) errors.fullName = 'Full name is required.';
  if (!isPlausiblePolicyNumber(idNumber)) {
    errors.idNumber = 'A valid ID or passport number is required.';
  }
  if (!Number.isFinite(age) || age < 18 || age > 120) {
    errors.age = 'You must be 18 or older.';
  }
  if (!isValidPhone(phone)) errors.phone = 'Enter a valid phone number.';
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (!(VALID_COVER_TYPES as readonly string[]).includes(cover)) {
  errors.cover = 'Please choose a cover type.';
}

  /* The declaration tick. Without this check the API would accept an
     application from a client that simply never sent the box - i.e. a
     scripted POST that skipped the legal consent the UI asks for. The claim
     validator already enforced this; the application validator did not. */
  if (body.confirmAccepted !== true) {
    errors.confirmAccepted =
      'Please tick the box to confirm before continuing.';
  }

  /* Group members. The applicant is member 1, so the repeater supplies the
     rest; the 5-person floor is a product rule for Amani Group. Members are
     only read when Group is chosen, so switching away from Group cannot leave
     stale rows attached to a Solo/Family policy. Blank rows the visitor added
     and never filled in are dropped rather than rejected - the form pre-seeds
     rows for the minimum, so a partially-completed group is normal. */
  let members: { fullName: string; phone: string }[] = [];

  if (cover === 'Group') {
    const raw = Array.isArray(body.members) ? body.members : [];
    members = raw
      .filter((m: any) => m && (String(m.fullName || '').trim() || String(m.phone || '').trim()))
      .map((m: any) => ({
        fullName: String(m.fullName || '').trim(),
        phone: String(m.phone || '').trim(),
      }));

    if (members.length + 1 < MIN_GROUP_MEMBERS) {
      errors.members =
        `Amani Group needs at least ${MIN_GROUP_MEMBERS} people. ` +
        `You have added ${members.length + 1}.`;
    }

    members.forEach((m, i) => {
      if (m.fullName.length < 2) {
        errors[`member_${i}_fullName`] = 'Enter this member\u2019s full name.';
      }
      if (!isValidPhone(m.phone)) {
        errors[`member_${i}_phone`] = 'Enter a valid phone number.';
      }
    });
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      fullName,
      /* The ID number, normalised, IS the policy number. */
      policyNumber: normalisePolicyNumber(idNumber),
      idNumber: normalisePolicyNumber(idNumber),
      age: Number.isFinite(age) ? age : null,
      employment,
      phone,
      email: email || null,
      cover,
      coveredCount: cover === 'Group' ? members.length + 1 : 1,
      members,
      confirmAccepted: body.confirmAccepted === true,
    },
  };
}

export function validateClaim(body: any = {}): ValidationResult<NormalisedClaim> {
  const errors: Record<string, string> = {};

  const claimantName = String(body.fullName || '').trim();
  const claimantId = String(body.idNumber || '').trim();
  const phone = String(body.phone || '').trim();
  const relationship = String(body.relationship || '').trim();
  const deceasedName = String(body.deceasedName || '').trim();
  const causeDeath = String(body.causeDeath || '').trim();
  const placeDeath = String(body.placeDeath || '').trim();
  const policyNumber = normalisePolicyNumber(body.policyNumber);
  const deathDate = String(body.deathDate || '').trim();

  if (claimantName.length < 2) errors.fullName = 'Full name is required.';
  if (!isPlausiblePolicyNumber(claimantId)) errors.idNumber = 'A valid ID number is required.';
  if (!isValidPhone(phone)) errors.phone = 'Enter a valid phone number.';
  if (relationship.length < 2) errors.relationship = 'Relationship is required.';

  /* The field the family reads off the policy card. Because the policy number
     IS the holder's ID number, this is the number they quote. */
  if (!isPlausiblePolicyNumber(policyNumber)) {
    errors.policyNumber = 'Policy number is required.';
  }

  if (deceasedName.length < 2) errors.deceasedName = 'Deceased name is required.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deathDate) || Number.isNaN(Date.parse(deathDate))) {
    errors.deathDate = 'Enter a valid date of death.';
  }
  if (causeDeath.length < 2) errors.causeDeath = 'Cause of death is required.';
  if (placeDeath.length < 2) errors.placeDeath = 'Place of death is required.';

  const accepted = body.confirm_accepted === true || body.confirmAccepted === true;
  if (!accepted) {
    errors.confirm_accepted = 'Please tick the box to declare before submitting.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      claimantName,
      claimantId: normalisePolicyNumber(claimantId),
      phone,
      relationship,
      policyNumber,
      deceasedName,
      deathDate,
      causeDeath,
      placeDeath,
      notes: String(body.notes || '').trim() || null,
    },
  };
}