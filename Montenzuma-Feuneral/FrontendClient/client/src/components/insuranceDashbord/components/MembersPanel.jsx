import React, { useMemo } from 'react';
import AlphabetFilter from './AlphabetFilter';
import MemberRow from './MemberRow';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export default function MembersPanel({ members, selected, onSelect, onOpen, loading }) {
  const counts = useMemo(() => members.reduce((result, member) => { const letter = (member.fullName || '').trim().charAt(0).toUpperCase(); if (ALPHABET.includes(letter)) result[letter] = (result[letter] || 0) + 1; return result; }, {}), [members]);
  const list = selected ? members.filter(m => (m.fullName || '').trim().toUpperCase().startsWith(selected)) : members;
  return <section className="insdash-panel insdash-members-panel"><div className="insdash-panel-heading"><div><p className="insdash-eyebrow">MEMBER DIRECTORY</p><h2>{selected ? `Names beginning with ${selected}` : 'All members'}</h2><p className="insdash-muted">{list.length} {list.length === 1 ? 'member' : 'members'}{selected ? ` · ${counts[selected] || 0} starting with ${selected}` : ' · Choose a letter to browse'}</p></div><span className="insdash-total-pill">{list.length} total</span></div>
    <AlphabetFilter selected={selected} counts={counts} onSelect={onSelect} /><div className="insdash-table-labels"><span>MEMBER</span><span>POLICY NUMBER</span><span>COVER</span><span>STATUS</span><span /></div><div className="insdash-member-list">{loading ? <div className="insdash-empty"><span className="insdash-loader" />Loading members…</div> : list.length ? list.map(member => <MemberRow key={member.policyNumber || member.policyId} member={member} onOpen={onOpen} />) : <div className="insdash-empty"><b>{selected ? `No members start with “${selected}”` : 'No members yet'}</b><span>Member records will appear here when available.</span></div>}</div>
  </section>;
}
