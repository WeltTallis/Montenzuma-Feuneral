// One-off patcher: rewrites the coffinTransfers.jsx waitingHint block and
// the "Mark In Transit" action to the simplified 2-status model.
const fs = require('fs');
const f = 'FrontendClient/client/src/components/coffins/coffinTransfers.jsx';
let s = fs.readFileSync(f, 'utf8');
const before = s;

// 1) waitingHint: drop the 'transferring' branches, simplify the labels.
const oldHintBlock = `type === 'incoming'
        ? // I am the SOURCE / dispatcher (another branch requested my stock).
          r.status === 'pending'
          ? \`${dest?.name || 'The requesting branch'} is waiting for your approval\`
          : r.status === 'approved'
            ? 'Approved \u2014 prepare the dispatch'
            : r.status === 'transferring'
              ? \`Awaiting delivery confirmation by ${dest?.name || 'the requesting branch'}\`
              : null
        : // I am the REQUESTER (I asked another branch for stock).
          r.status === 'pending'
            ? \`Waiting for ${origin?.name || 'the source branch'} to approve & dispatch\`
            : r.status === 'approved'
              ? \`${origin?.name || 'Source branch'} approved \u2014 preparing dispatch\`
              : r.status === 'transferring'
                ? 'Goods in transit \u2014 confirm delivery when they arrive'
                : null;`;
const newHintBlock = `type === 'incoming'
        ? // I am the SOURCE / dispatcher (another branch requested my stock).
          r.status === 'pending'
          ? \`${dest?.name || 'The requesting branch'} is waiting for your approval\`
          : r.status === 'approved'
            ? \`${dest?.name || 'The requesting branch'} can now confirm delivery\`
            : null
        : // I am the REQUESTER (I asked another branch for stock).
          r.status === 'pending'
            ? \`Waiting for ${origin?.name || 'the source branch'} to approve\`
            : r.status === 'approved'
              ? \`${origin?.name || 'Source branch'} approved \u2014 confirm delivery when the goods arrive\`
              : null;`;
if (!s.includes(oldHintBlock)) {
  console.error('waitingHint block NOT found verbatim');
  process.exit(1);
}
s = s.replace(oldHintBlock, newHintBlock);

// 2) Timeline: remove "In Transit" step + fix the approved 'done' condition.
const oldApprovedStep = `      {
        key: 'approved',
        label: 'Approved',
        icon: 'fa-solid fa-check',
        done: status === 'approved' || status === 'transferring' || status === 'delivered',
      },
      {
        key: 'transferring',
        label: 'In Transit',
        icon: 'fa-solid fa-truck',
        done: status === 'transferring' || status === 'delivered',
      },`;
const newApprovedStep = `      {
        key: 'approved',
        label: 'Approved',
        icon: 'fa-solid fa-check',
        done: status === 'approved' || status === 'delivered',
      },`;
if (!s.includes(oldApprovedStep)) {
  console.error('timeline approved step NOT found verbatim');
  process.exit(1);
}
s = s.replace(oldApprovedStep, newApprovedStep);

// 3) Action buttons: drop "Mark In Transit" + the "preparing dispatch"/"in transit" spans,
//    and move the "Delivered Now" button onto the `approved` status for the requester.
const oldActions = `                    {type === 'incoming' && r.status === 'approved' && (
                      <button
                        style={btnStyle(S.infoLight, S.info)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStockAction(r.id, 'transferring');
                        }}
                      >
                        <i className="fa-solid fa-truck"></i> Mark In Transit
                      </button>
                    )}
                    {type === 'incoming' && r.status === 'transferring' && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: S.textMuted,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <i className="fa-solid fa-hourglass-half"></i> Awaiting delivery
                        confirmation by {dest?.name || 'the requesting branch'}
                      </span>
                    )}

                    {/* OUTGOING = my branch is the REQUESTER / receiver
                        (I asked another branch for stock). Only this side may
                        write "Delivered". */}
                    {type === 'outgoing' && r.status === 'pending' && (
                      <button
                        style={btnStyle('#fff', S.danger, `1px solid ${S.border}`)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStockAction(r.id, 'rejected');
                        }}
                      >
                        <i className="fa-solid fa-times"></i> Cancel Request
                      </button>
                    )}
                    {type === 'outgoing' && r.status === 'approved' && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: S.textMuted,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <i className="fa-solid fa-hourglass-half"></i> {origin?.name || 'Source'} is
                        preparing dispatch
                      </span>
                    )}
                    {type === 'outgoing' && r.status === 'transferring' && (
                      <button
                        style={btnStyle(S.success, '#fff')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStockAction(r.id, 'delivered');
                        }}
                      >
                        <i className="fa-solid fa-circle-check"></i> Delivered Now
                      </button>
                    )}`;
const newActions = `                    {/* OUTGOING = my branch is the REQUESTER / receiver
                        (I asked another branch for stock). Only this side may
                        write "Delivered" once the source branch has approved. */}
                    {type === 'outgoing' && r.status === 'pending' && (
                      <button
                        style={btnStyle('#fff', S.danger, `1px solid ${S.border}`)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStockAction(r.id, 'rejected');
                        }}
                      >
                        <i className="fa-solid fa-times"></i> Cancel Request
                      </button>
                    )}
                    {type === 'outgoing' && r.status === 'approved' && (
                      <button
                        style={btnStyle(S.success, '#fff')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStockAction(r.id, 'delivered');
                        }}
                      >
                        <i className="fa-solid fa-circle-check"></i> Delivered Now
                      </button>
                    )}`;
if (!s.includes(oldActions)) {
  console.error('actions block NOT found verbatim');
  process.exit(1);
}
s = s.replace(oldActions, newActions);

fs.writeFileSync(f, s, 'utf8');
console.log('OK: waitingHint + timeline patched. bytes changed:', before.length - s.length + (s.length - before.length), '=>', s.length - before.length, 'chars delta');
