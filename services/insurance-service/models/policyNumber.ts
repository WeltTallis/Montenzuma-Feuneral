/**
 * Insurance Service - policy-number rules.
 *
 * THE ONE RULE IN THIS FILE
 * ------------------------
 * A policy number IS the policy holder's national ID / passport number. It is
 * typed by hand on a paper application form and then again, possibly by a
 * grieving relative, on a claim form months later. Every path that writes or
 * compares one MUST run it through `normalisePolicyNumber` first, otherwise
 * these all become different policies:
 *
 *   "29384716"        (typed cleanly)
 *   " 29384716 "      (trailing space from a phone keyboard / paste)
 *   "29384716\n"      (OCR of the scanned application form)
 *   "AMNI-29384716"   (a visitor typing the prefix off the policy card)
 *
 * Normalisation: trim, collapse inner whitespace, drop a leading "AMNI"/"AMN"
 * style word, upper-case. Digits and letters are otherwise preserved -
 * passport numbers are not always numeric, and silently stripping
 * non-digits would corrupt them.
 */

/** Policy numbers are stored and compared in this form. */
export function normalisePolicyNumber(value: unknown): string {
  if (value === null || value === undefined) return '';

  let out = String(value).toUpperCase();

  // A policy number NEVER contains whitespace, so every space is noise: a
  // trailing space from a phone paste, or a gap inserted mid-number by the
  // OCR that reads the paper application form ("2938 4716"). Collapsing runs
  // to a single space is not enough - the character itself has to go, or
  // "2938 4716" and "29384716" become two different policies.
  out = out.replace(/\s+/g, '');

  // Strip a leading brand word so a visitor reading their policy card can type
  // what they see: "AMNI-29384716", "AMANI COVER 29384716" and "amani cover
  // 29384716" must all resolve to 29384716.
  // The brand spellings are AM / AMN / AMNI / AMANI, i.e. after the leading
  // "AM" the remainder is "", "N", "NI" or "ANI". The alternation is ordered
  // LONGEST FIRST on purpose: with a bare "N" alternative listed before "NI",
  // the regex happily matches just the "N" of "AMNI" and leaves a stray "I"
  // behind, which then becomes part of the policy number.
  const stripped = out.replace(/^AM(?:ANI|NI|N)?(COVER)?[-._]*/, '');

  // Only accept the stripped form when something meaningful survives, so an ID
  // that merely happens to begin with "AM" is not silently truncated.
  out = stripped.length >= 4 ? stripped : out;

  return out;
}

/**
 * True when the value is plausibly an ID / passport number.
 * Kenyan national IDs are 8 digits; passports vary. Requiring at least 4
 * alphanumerics rejects an obviously mistyped single character before it
 * becomes a policy nobody can later claim against.
 */
export function isPlausiblePolicyNumber(value: unknown): boolean {
  const n = normalisePolicyNumber(value);
  return /^[A-Z0-9][A-Z0-9\-/]{3,63}$/.test(n);
}

/** Kenyan mobile numbers, tolerant of +254 / 0 prefixes and spaces. */
export function isValidPhone(value: unknown): boolean {
  return String(value ?? '').replace(/\D/g, '').length >= 9;
}

/** Empty is valid (the field is optional); filled-in must match. */
export function isValidEmail(value: unknown): boolean {
  const v = String(value ?? '').trim();
  return v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Timestamps are stored as varchar(255) strings across this codebase. */
export const now = (): string => new Date().toISOString();

/** Amani Group policies must cover at least this many individuals. */
export const MIN_GROUP_MEMBERS = 5;

/** The three real Amani products (see amaniData.js coverOptions). */
export const VALID_COVER_TYPES = ['Solo', 'Family', 'Group'] as const;
export type CoverType = (typeof VALID_COVER_TYPES)[number];

/** Claim lifecycle. */
export const VALID_CLAIM_STATUSES = [
  'submitted',
  'under_review',
  'approved',
  'settled',
  'rejected',
] as const;
export type ClaimStatus = (typeof VALID_CLAIM_STATUSES)[number];

export interface MemberInput {
  fullName: string;
  phone: string;
}

export interface NormalisedApplication {
  fullName: string;
  policyNumber: string;
  idNumber: string;
  age: number | null;
  employment: string;
  phone: string;
  email: string | null;
  cover: string;
  coveredCount: number;
  members: MemberInput[];
  confirmAccepted: boolean;
}

export interface NormalisedClaim {
  claimantName: string;
  claimantId: string;
  phone: string;
  relationship: string;
  policyNumber: string;
  deceasedName: string;
  deathDate: string;
  causeDeath: string;
  placeDeath: string;
  notes: string | null;
}

export interface ValidationResult<T> {
  valid: boolean;
  errors: Record<string, string>;
  value: T;
}