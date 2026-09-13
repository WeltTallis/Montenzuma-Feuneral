const TRIAL_REQUESTS_KEY = 'restpoint_trial_requests';

export function readTrialRequests() {
  try {
    const raw = localStorage.getItem(TRIAL_REQUESTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to parse trial requests:', error);
    return [];
  }
}

export function saveTrialRequests(requests) {
  localStorage.setItem(TRIAL_REQUESTS_KEY, JSON.stringify(requests));
}

export function addTrialRequest(payload) {
  const existing = readTrialRequests();
  const record = {
    id: `trial-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    source: 'landing-demo-panel',
    ...payload,
  };

  const next = [record, ...existing].slice(0, 250);
  saveTrialRequests(next);
  return record;
}
