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
    data.message || 'Something went wrong. Please try again.',
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

export const insuranceApi = {
  submitApplication,
  submitClaim,
  listPolicies,
  getPolicy,
  listClaims,
  updateClaimStatus,
  getStats,
};

export default insuranceApi;