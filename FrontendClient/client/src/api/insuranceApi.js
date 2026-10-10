/**
 * Amani Cover insurance API client.
 *
 * Two audiences:
 *   PUBLIC  - submitApplication / submitClaim back the forms on the public
 *             Amani site. No auth header is sent and none is expected: these
 *             are filled in by bereaved families who have no account.
 *   STAFF   - listPolicies / listClaims / getStats are for the funeral home's
 *             own back office and rely on the gateway's auth.
 *
 * The gateway strips /api/v1/restpoint and proxies /insurance/... to
 * insurance-service.
 *
 * The backend validates the same rules the forms do and returns a per-field
 * `errors` map, so callers can surface the server's messages directly rather
 * than only the client-side ones.
 */
import api from './axios';

const BASE = '/insurance';

/** Thrown for a 4xx so callers can read `errors` without a try/catch on
 *  every response shape. Carries the server's field errors verbatim. */
export class InsuranceApiError extends Error {
  constructor(message, errors = {}, status = 0) {
    super(message);
    this.name = 'InsuranceApiError';
    this.errors = errors;
    this.status = status;
  }
}

/** Normalise an axios rejection into InsuranceApiError. */
function toApiError(err) {
  const status = err?.response?.status ?? 0;
  const data = err?.response?.data ?? {};
  return new InsuranceApiError(
    data.message || data.error || 'Something went wrong. Please try again.',
    data.errors || {},
    status,
  );
}

/**
 * Submit an Amani Cover application.
 *
 * `idNumber` becomes the POLICY NUMBER server-side (normalised), which is what
 * the family quotes on the claim form months later.
 */
export async function submitApplication(payload) {
  try {
    const { data } = await api.post(`${BASE}/applications`, payload);
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

/**
 * File a claim by quoting the policy number (the policy holder's ID number).
 */
export async function submitClaim(payload) {
  try {
    const { data } = await api.post(`${BASE}/claims`, payload);
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

/**
 * Confirm whether an Amani Cover exists for a policy number.
 *
 * Public: used by the payments page, where a member with no account types the
 * number off their policy card. The response deliberately carries no holder
 * details - only `found`, the cover type, status and how many people are
 * covered - so it cannot be used to look someone up.
 */
export async function checkCover(payload) {
  try {
    const { data } = await api.post(BASE + '/cover-check', {
      policyNumber: payload?.policyNumber,
    });
    return { ...data, found: typeof data.found === 'boolean' ? data.found : Boolean(data.coverType) };
  } catch (err) {
    throw toApiError(err);
  }
}

/** Public: send an M-Pesa STK prompt for an active policy contribution. */
export async function startPayment(payload) {
  try {
    const { data } = await api.post(BASE + '/payments/stk-push', {
      policyNumber: payload?.policyNumber,
      policyCode: payload?.policyCode,
      phoneNumber: payload?.phoneNumber,
      months: payload?.months,
    });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

/** Public: load safe plan details for a payment URL. */
export async function getPaymentLink(code) {
  try {
    const { data } = await api.get(BASE + `/payment-links/${encodeURIComponent(code)}`);
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

/** Public: read the status of the payment reference returned by startPayment. */
export async function getPaymentStatus(reference) {
  try {
    const { data } = await api.get(BASE + '/payments/' + encodeURIComponent(reference));
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}
/* Public: look up the progress of a claim already filed against a policy.
 *
 * Takes the same policy number as checkCover (the holder's national ID, read
 * off the policy card) and returns a deliberately thin payload: a short public
 * reference, the status, the deceased's name and the claim's own dates. It
 * never returns the claimant's identity, the cause or place of death, the
 * internal review notes or any document path - see the controller for why.
 */
export async function trackClaim(payload) {
  try {
    const { data } = await api.post(`${BASE}/claim-track`, {
      policyNumber: payload?.policyNumber,
    });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

/** Staff: list policies. */
export async function listPolicies(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  const { data } = await api.get(`${BASE}/policies${query ? `?${query}` : ''}`);
  return data;
}

/** Staff: one policy with its group members and claims. */
export async function getPolicy(policyNumber) {
  const { data } = await api.get(`${BASE}/policies/${encodeURIComponent(policyNumber)}`);
  return data;
}

/** Staff: list claims. */
export async function listClaims(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  const { data } = await api.get(`${BASE}/claims${query ? `?${query}` : ''}`);
  return data;
}

/** Staff: load a complete claim file with policy and contribution history. */
export async function getClaim(claimId) {
  const { data } = await api.get(`${BASE}/claims/${encodeURIComponent(claimId)}`);
  return data;
}

/** Staff: move a claim along its lifecycle. */
export async function updateClaimStatus(claimId, status, reviewNotes) {
  const { data } = await api.patch(`${BASE}/claims/${claimId}/status`, { status, reviewNotes });
  return data;
}

/** Staff: dashboard counts. */
export async function getStats() {
  const { data } = await api.get(`${BASE}/stats`);
  return data;
}

/** Staff: live contribution totals and monthly insurance activity. */
export async function getAnalytics() {
  const { data } = await api.get(`${BASE}/analytics`);
  return data;
}

export const insuranceApi = {
  submitApplication,
  submitClaim,
  checkCover,
  startPayment,
  getPaymentStatus,
  getPaymentLink,
  listPolicies,
  getPolicy,
  listClaims,
  getClaim,
  updateClaimStatus,
  getStats,
  getAnalytics,
};

export default insuranceApi;
