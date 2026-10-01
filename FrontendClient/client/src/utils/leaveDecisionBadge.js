/**
 * "New leave decision" indicator for the Apply Leave nav item.
 *
 * The sidebar shows a small red dot when the signed-in user has a leave request
 * that an approver has DECIDED (approved or rejected) and that decision has not
 * been seen yet. Pending requests are deliberately excluded — nothing has
 * happened for them yet, so a red dot would cry wolf on every single request.
 *
 * The seen-marker is stored per user in localStorage so two people sharing a
 * browser (a shared back-office iPad, say) never mark each other's decisions as
 * read, and it survives a page reload.
 */

// Anything other than these two means "still waiting", so no dot.
const DECIDED = new Set(['approved', 'rejected']);

const key = (userId) => `leaveDecisionsSeen:${userId || 'unknown'}`;

/** Stable per-request id. Falls back to the dates so a row with no id still works. */
export const decisionKey = (l) =>
  String(l?.id ?? `${l?.start_date || ''}~${l?.end_date || ''}`);

/**
 * Returns the ids of decided-but-unseen requests for this user.
 * Pure read — it never writes, so it is safe to call on every render.
 */
export const getUnseenDecisions = (leaves, userId) => {
  if (!Array.isArray(leaves) || !userId) return [];
  let seen = [];
  try {
    const raw = localStorage.getItem(key(userId));
    seen = raw ? JSON.parse(raw) : [];
  } catch {
    seen = [];
  }
  if (!Array.isArray(seen)) seen = [];
  const seenSet = new Set(seen);

  return leaves
    .filter((l) => DECIDED.has(String(l?.status || '').toLowerCase()))
    .map(decisionKey)
    .filter((id) => !seenSet.has(id));
};

/** True when at least one decided request is still unseen. */
export const hasUnseenDecisions = (leaves, userId) =>
  getUnseenDecisions(leaves, userId).length > 0;

/**
 * Marks the given requests as seen. Called when the user actually opens the
 * Apply Leave page — that is the "I have seen it" signal.
 */
export const markDecisionsSeen = (leaves, userId) => {
  if (!Array.isArray(leaves) || !userId) return;
  const decided = leaves
    .filter((l) => DECIDED.has(String(l?.status || '').toLowerCase()))
    .map(decisionKey);
  if (!decided.length) return;

  try {
    const raw = localStorage.getItem(key(userId));
    const seen = raw ? JSON.parse(raw) : [];
    const merged = Array.isArray(seen) ? Array.from(new Set([...seen, ...decided])) : decided;
    localStorage.setItem(key(userId), JSON.stringify(merged));
  } catch {
    /* private mode / quota — the dot simply stays until it can be stored */
  }
};