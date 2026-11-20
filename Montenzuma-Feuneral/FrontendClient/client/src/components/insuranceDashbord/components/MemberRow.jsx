import React from 'react';
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';
export default function MemberRow({ member, onOpen }) {
  const status = String(member.status || 'unknown').toLowerCase();
  return <button className="insdash-member-row" onClick={() => onOpen(member)}><span className="insdash-member-person"><span className="insdash-avatar">{initials(member.fullName)}</span><span><b>{member.fullName || 'Unnamed member'}</b><small>{member.phone || 'Phone not provided'}</small></span></span><span className="insdash-policy">{member.policyNumber || '—'}</span><span>{member.coverType || 'Amani Cover'}<small className="insdash-cell-note">{Number(member.coveredCount || 1)} covered</small></span><span className={`insdash-status insdash-status-${status.replace(/[^a-z]/g, '-')}`}>{member.status || 'Unknown'}</span><span className="insdash-row-arrow">→</span></button>;
}
