/**
 * Insurance Service - smoke test.
 *
 *   npm test -w @montezuma/insurance-service
 *
 * Covers the two rules that, if wrong, silently corrupt real customer data:
 *   1. Policy number normalisation - the ID number typed on an application and
 *      the ID number quoted on a claim months later must resolve to the SAME
 *      policy, however differently they were typed.
 *   2. Validation - the Amani Group minimum of 5 people, and the field rules
 *      the two public forms depend on.
 *
 * Pure logic, no database: this runs anywhere, which is what makes it useful
 * in CI. The DB paths are exercised by `npm run migrate` against a real server.
 */
import {
  normalisePolicyNumber,
  isPlausiblePolicyNumber,
  isValidPhone,
  isValidEmail,
  MIN_GROUP_MEMBERS,
} from '../models/policyNumber';
import { validateApplication, validateClaim } from '../models/validation';

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(
      `  FAIL  ${name}\n        expected ${JSON.stringify(expected)}` +
        `\n        got      ${JSON.stringify(actual)}`,
    );
  }
}

console.log('\npolicy number normalisation');
/* The whole point: every messy variant collapses to one policy. */
check('plain ID', normalisePolicyNumber('29384716'), '29384716');
check('leading/trailing space', normalisePolicyNumber('  29384716  '), '29384716');
check('trailing newline (OCR)', normalisePolicyNumber('29384716\n'), '29384716');
check('internal whitespace', normalisePolicyNumber('2938 4716'), '29384716');
check('AMNI- prefix', normalisePolicyNumber('AMNI-29384716'), '29384716');
check('lowercase amani prefix', normalisePolicyNumber('amani cover 29384716'), '29384716');
check('null-safe', normalisePolicyNumber(null), '');
check('undefined-safe', normalisePolicyNumber(undefined), '');

check(
  'all messy variants agree',
  new Set([
    normalisePolicyNumber('29384716'),
    normalisePolicyNumber(' 29384716 '),
    normalisePolicyNumber('AMNI-29384716'),
    normalisePolicyNumber('amani cover 29384716'),
  ]).size,
  1,
);

console.log('\nplausibility');
check('valid 8-digit ID', isPlausiblePolicyNumber('29384716'), true);
check('valid passport', isPlausiblePolicyNumber('A1234567'), true);
check('too short rejected', isPlausiblePolicyNumber('12'), false);
check('empty rejected', isPlausiblePolicyNumber(''), false);
check('junk rejected', isPlausiblePolicyNumber('!!!!'), false);

console.log('\nphone / email');
check('kenyan mobile', isValidPhone('0712345678'), true);
check('+254 form', isValidPhone('+254712345678'), true);
check('too short', isValidPhone('12345'), false);
check('empty email allowed (optional)', isValidEmail(''), true);
check('valid email', isValidEmail('a@b.co'), true);
check('invalid email', isValidEmail('nope'), false);

console.log('\napplication validation');
const baseApp = {
  fullName: 'Wanjiku Kamau',
  idNumber: '29384716',
  age: '34',
  employment: 'employed',
  phone: '0712345678',
  email: 'wanjiku@example.com',
  cover: 'Solo',
  confirmAccepted: true,
};
check('valid Solo application', validateApplication(baseApp).valid, true);

/* THE ID NUMBER BECOMES THE POLICY NUMBER */
check(
  'policy number == the ID number',
  validateApplication(baseApp).value.policyNumber,
  '29384716',
);
check(
  'messy ID is normalised into the policy number',
  validateApplication({ ...baseApp, idNumber: ' AMNI-29384716 ' }).value.policyNumber,
  '29384716',
);

check('under 18 rejected', validateApplication({ ...baseApp, age: '16' }).valid, false);
check('missing name rejected', validateApplication({ ...baseApp, fullName: '' }).valid, false);
check('bad cover rejected', validateApplication({ ...baseApp, cover: 'Platinum' }).valid, false);
check(
  'declaration required',
  validateApplication({ ...baseApp, confirmAccepted: false }).valid,
  false,
);

/* Amani Group minimum of 5 */
const groupApp = { ...baseApp, cover: 'Group' };
check(
  `Group with only 1 person rejected (min ${MIN_GROUP_MEMBERS})`,
  validateApplication(groupApp).valid,
  false,
);
check(
  'Group error message mentions the minimum',
  /at least 5/.test(validateApplication(groupApp).errors.members || ''),
  true,
);
check(
  `Group with ${MIN_GROUP_MEMBERS} people accepted`,
  validateApplication({
    ...groupApp,
    members: Array.from({ length: MIN_GROUP_MEMBERS - 1 }, (_, i) => ({
      fullName: `Member ${i + 2}`,
      phone: '0712345678',
    })),
  }).valid,
  true,
);
check(
  'covered_count counts the applicant too',
  validateApplication({
    ...groupApp,
    members: Array.from({ length: 4 }, () => ({ fullName: 'A Person', phone: '0712345678' })),
  }).value.coveredCount,
  5,
);
check(
  'switching away from Group drops members',
  validateApplication({
    ...baseApp,
    cover: 'Solo',
    members: [{ fullName: 'X', phone: '0712345678' }],
  }).value.members.length,
  0,
);

console.log('\nclaim validation');
const baseClaim = {
  fullName: 'Kamau Njoroge',
  idNumber: '30112233',
  phone: '0722000111',
  relationship: 'Son',
  policyNumber: '29384716',
  deceasedName: 'Mary Wanjiku',
  deathDate: '2025-11-02',
  causeDeath: 'Natural causes',
  placeDeath: 'Nairobi',
  confirm_accepted: true,
};
check('valid claim', validateClaim(baseClaim).valid, true);
check(
  'claim policy number normalised',
  validateClaim({ ...baseClaim, policyNumber: ' amni-29384716 ' }).value.policyNumber,
  '29384716',
);
check(
  'missing policy number rejected',
  validateClaim({ ...baseClaim, policyNumber: '' }).valid,
  false,
);
check(
  'bad date rejected',
  validateClaim({ ...baseClaim, deathDate: '02/11/2025' }).valid,
  false,
);
check(
  'declaration required',
  validateClaim({ ...baseClaim, confirm_accepted: false }).valid,
  false,
);

console.log('\nend-to-end: apply, then claim quoting that number');
const applied = validateApplication(baseApp);
const claimed = validateClaim({ ...baseClaim, policyNumber: applied.value.policyNumber });
check('application accepted', applied.valid, true);
check('claim on that policy number accepted', claimed.valid, true);
check(
  'claim resolves to the applied policy number',
  claimed.value.policyNumber === applied.value.policyNumber,
  true,
);

console.log('\ncover-check input handling');
/* The payments page posts whatever the visitor typed off their policy card,
   so the lookup must normalise exactly the way the application form does -
   otherwise "AMNI-29384716" would miss a policy stored as "29384716". */
check(
  'cover-check normalises an AMNI- prefixed number',
  normalisePolicyNumber('AMNI-29384716'),
  '29384716',
);
check(
  'cover-check normalises a padded number',
  normalisePolicyNumber('  29384716 '),
  '29384716',
);
check(
  'cover-check accepts an empty string as not-a-number',
  isPlausiblePolicyNumber(''),
  false,
);
/* A short/garbage number must never reach the database as a lookup key. */
check('garbage rejected as a policy number', isPlausiblePolicyNumber('!!!'), false);
check('single char rejected as a policy number', isPlausiblePolicyNumber('5'), false);

console.log('\nclaim-track input handling');
/* Claim tracking reuses the SAME credential and the SAME normaliser as
   cover-check: the bereaved family reads the number off the same policy card.
   If these ever diverge, a family could pay against a policy but be told their
   claim does not exist (or worse, the reverse). */
check(
  'claim-track normalises an AMNI- prefixed number',
  normalisePolicyNumber('AMNI-29384716'),
  normalisePolicyNumber('29384716'),
);
check(
  'claim-track normalises a padded number',
  normalisePolicyNumber('  29384716 '),
  normalisePolicyNumber('29384716'),
);
check(
  'claim-track and cover-check agree on the same typed input',
  normalisePolicyNumber('AMNI- 29384716 ') === normalisePolicyNumber(' amni-29384716'),
  true,
);
/* Tracking a claim is the more sensitive of the two lookups - it reveals that
   a death was reported - so the same plausibility gate must apply. */
check('claim-track rejects garbage as a policy number', isPlausiblePolicyNumber('!!!'), false);
check('claim-track rejects a blank number', isPlausiblePolicyNumber('   '), false);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);