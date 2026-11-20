/**
 * "New leave decision" indicator for the Apply Leave nav item.
 *
 * The sidebar shows a red COUNT badge when the signed-in user has leave
 * requests that an approver has DECIDED (approved or rejected) and that the
 * user has not seen yet. Pending requests are deliberately excluded — nothing
 * has happened for them yet, so a badge would cry wolf on every request.
 *
 * The count is what the UI renders. The previous bare 8px dot could not tell
 * "one approval" from "five decisions waiting", which is the difference between
 * checking later today and checking right now.
 *
 * The seen-marker is stored per user in localStorage so two people sharing a
 * browser (a shared back-office iPad, say) never mark each other's decisions as
 * read, and it survives a page reload.
 */

// Anything other than these two means "still waiting", so no badge.
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
 * How many decided requests are still unseen — the number the sidebar badge
 * renders. Kept separate from hasUnseenDecisions so the existing boolean callers
 * keep working untouched.
 */
export const countUnseenDecisions = (leaves, userId) =>
  getUnseenDecisions(leaves, userId).length;

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